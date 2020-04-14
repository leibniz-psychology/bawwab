from datetime import timedelta

import aiohttp
from sanic import Blueprint
from sanic.response import json, redirect, html
from sanic.log import logger
from sanic.exceptions import ServiceUnavailable, NotFound
from yarl import URL
from tortoise.models import Model
from tortoise import fields
from tortoise.exceptions import DoesNotExist, IntegrityError
from tortoise.transactions import in_transaction
from cryptography.fernet import Fernet

from . import session, auth, audit
from .auth import requirePermission
from .util import now, randomSecret
from .application import defaultApplications, runFactory
from .tos import requireTos

class Workspace (Model):
	"""
	A workspace is a collection of files and applications
	"""

	crypter = None

	created = fields.DatetimeField(auto_now_add=True, description='Creation time')
	name = fields.TextField(null=True, description='User-chosen name')
	description = fields.TextField (null=True)
	# actually, this is one-to-many
	permissions = fields.ManyToManyField ('models.WorkspacePermissions', description='Per-role permissions')
	# dito
	applications = fields.ManyToManyField ('models.Application', description='Available applications')
	sshUser = fields.CharField (32, description='SSH username')
	sshUid = fields.IntField (description='SSH user id')
	sshGid = fields.IntField (description='SSH group id')
	sshPasswordEncrypted = fields.BinaryField (description='SSH user’s password')

	@classmethod
	def setup (cls, key):
		# Obviously this is security through obscurity. But we want to make sure
		# that someone with access to the database cannot gain SSH access unless he
		# also has access to this application, which would be game over anyway. It
		# would be nice if we could encrypt it with the user’s password, but – you
		# know – OAuth.
		cls.crypter = Fernet (key)

	@property
	def sshPassword (self):
		return self.crypter.decrypt (self.sshPasswordEncrypted).decode ('utf-8')

	@sshPassword.setter
	def sshPassword (self, password):
		self.sshPasswordEncrypted = self.crypter.encrypt (password.encode ('utf-8'))

	def toPublicDict (self):
		workspace = dict (
				id=self.id,
				created=self.created,
				name=self.name,
				description=self.description,
				# XXX: publish only with canSSH permission
				#sshUser=self.sshUser,
				#sshPassword=self.sshPassword,
				)
		return workspace

class WorkspacePermissions (Model):
	"""
	Per-role access permissions to workspaces
	"""

	role = fields.ForeignKeyField ('models.Role')
	canList = fields.BooleanField (description='Workspace is shown in lists and search')
	canModify = fields.BooleanField (description='Workspace can be renamed')
	canDelete = fields.BooleanField (description='Can delete workspace')
	canExecute = fields.BooleanField (description='Can run applications')
	canSSH = fields.BooleanField (description='Can access SSH credentials')
	canShareAction = fields.BooleanField (description='Can share workspace via action')
	workspace: fields.ReverseRelation["Workspace"]

defaultPermissions = dict (canList=True, canDelete=True, canExecute=True, canSSH=False, canShareAction=True, canModify=True)

bp = Blueprint('workspace')

@bp.listener('before_server_start')
async def setup (app, loop):
	config = app.config
	Workspace.setup (config.DATABASE_PASSWORD_KEY)

async def workspaceToDict (w):
	applications = []
	async for a in w.applications:
		x = a.toPublicDict ()
		try:
			runner = runFactory.get (a)
			x['url'] = str (await runner.loginUrl ())
		except KeyError:
			# not running
			pass
		applications.append (x)
	# enrich with runner info
	wdict = w.toPublicDict ()
	wdict['applications'] = applications
	return wdict

@bp.route ('/')
@requireTos
async def workspace (request):
	session = request.ctx.session

	workspaces = []
	async for w in Workspace.filter (permissions__role=request.ctx.session.role,
			permissions__canList=True):
		workspaces.append (await workspaceToDict (w))
	return json (workspaces, status=200)

@bp.route ('/', methods=['POST'])
@requirePermission ('canCreateWorkspace')
@requireTos
async def workspaceCreate (request):
	form = request.json
	session = request.ctx.session

	try:
		async with request.app.usermgrd.post ('http://localhost/') as resp:
			data = await resp.json ()
			if data['status'] != 'ok':
				audit.log ('workspace.create.usermgrd_error', dict (reason=data['status']))
				raise ServiceUnavailable ('backend')
	except aiohttp.ClientConnectionError:
		audit.log ('workspace.create.usermgrd_connect_failure')
		raise ServiceUnavailable ('backend')

	async with in_transaction():
		p = WorkspacePermissions (role=session.role, **defaultPermissions)
		await p.save ()

		w = Workspace (
					name=form.get ('name'),
					description=form.get ('description'),
					sshUser=data['user'],
					sshUid=data['uid'],
					sshGid=data['gid'],
					)
		# XXX: get a proper init function
		w.sshPassword = data['password']
		await w.save ()
		await w.permissions.add (p)

		# XXX auto-detect installed applications
		for a in defaultApplications ():
			await a.save ()
			await w.applications.add (a)

	audit.log ('workspace.create', dict (
			id=w.id,
			role=session.role.id,
			user=session.user.id if session.user else None,
			session=session.name,
			sshUser=w.sshUser,
			sshUid=w.sshUid,
			))

	return json (await workspaceToDict (w), status=200)

@bp.route ('/<wid:int>', methods=['POST'])
@requireTos
async def workspaceModify (request, wid):
	w = await Workspace.filter (id=wid,
			permissions__role=request.ctx.session.role,
			permissions__canModify=True).first ()
	if w is None:
		raise NotFound ('not_found')

	form = request.json
	w.name = form.get ('name')
	w.description = form.get ('description')
	await w.save ()

	return json (await workspaceToDict (w), status=200)

@bp.route ('/<wid:int>', methods=['DELETE'])
@requireTos
async def workspaceDelete (request, wid):
	session = request.ctx.session

	w = await Workspace.filter (id=wid,
			permissions__role=session.role,
			permissions__canDelete=True).first ()
	if w is None:
		raise NotFound ('not_found')

	# stop all applications
	async for a in w.applications:
		await runFactory.stop (a)

	# can be None if something went wrong, ignore
	if w.sshUser is not None:
		async with request.app.usermgrd.delete (URL ('http://localhost/') / w.sshUser) as resp:
			data = await resp.json ()
			status = data['status']
			if status != 'ok':
				if status == 'user_not_found':
					# this is fine, I guess
					logger.error (f'trying to delete user {w.sshUser} for workspace {wid}, but user was already gone')
				else:
					raise Exception (f'XXX not ok: {data["status"]}')

	async for p in w.permissions:
		await p.delete ()
	async for a in w.applications:
		await a.delete ()
	await w.delete ()

	audit.log ('workspace.delete', dict (
			id=w.id,
			role=session.role.id,
			user=session.user.id if session.user else None,
			session=session.name,
			))

	return json ({}, status=200)

from .action import Action

@bp.route ('/<wid:int>/share/action', methods=['POST'])
@requireTos
async def workspaceShareAction (request, wid):
	"""
	Create one-time action allowing the calling user to access this workspace
	"""

	w = await Workspace.filter (id=wid,
			permissions__role=request.ctx.session.role,
			permissions__canShareAction=True).first ()
	if w is None:
		raise NotFound ('not_found')

	a = Action (
			token=randomSecret (),
			expires=now()+timedelta (days=7),
			usesRemaining=1,
			name='grantWorkspacePermissions',
			arguments={'workspace_id': w.id,
					'permissions': {
						'canList': True,
						'canExecute': True,
						'canDelete': False,
						'canShareAction': False,
						'canSSH': False,
					}
				},
			)
	await a.save ()

	return json ({'token': a.token, 'expires': a.expires, 'usesRemaining': a.usesRemaining}, status=200)

