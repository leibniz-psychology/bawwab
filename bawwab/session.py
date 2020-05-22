"""
Simple session middleware
"""

import asyncio
from datetime import timedelta

from tortoise.models import Model
from tortoise import fields
from tortoise.exceptions import DoesNotExist, IntegrityError
from tortoise.transactions import in_transaction
from sanic import Blueprint
from sanic.log import logger
from sanic.response import json
from sanic.exceptions import Forbidden
from yarl import URL

from .util import now, randomSecret
from .auth import Role, User, GlobalPermission
from . import audit

# do not change this value unless you know how to migrate your database
sessionNameLen = 32

class Session (Model):
	name = fields.CharField(sessionNameLen, unique=True, description='Session id exposed to browser')
	created = fields.DatetimeField(auto_now_add=True)
	accessed = fields.DatetimeField(null=True, description='Last user access to session')
	role = fields.ForeignKeyField ('models.Role', null=True, description='Current user’s role')
	user = fields.ForeignKeyField('models.User', null=True, description='Currently authenticated user')
	# for .auth
	oauthState = fields.TextField (null=True, description='OAuth state data')

bp = Blueprint ('session')

async def loadSession (request):
	session = None
	config = request.app.config

	# this is a hack, so status collection does not create a session
	if request.headers.get ('x-no-session'):
		return

	sessionId = request.cookies.get ('session')
	if sessionId:
		try:
			session = await Session.filter (name=sessionId).prefetch_related ('role', 'user').first ()
		except DoesNotExist:
			pass

	while not session:
		try:
			async with in_transaction ():
				# create a new one
				sid = randomSecret (sessionNameLen)

				role = Role (priority=0, name='default')
				await role.save ()

				permissions = GlobalPermission (role=role, **config.ANON_PERMISSIONS)
				await permissions.save ()

				user = User ()
				await user.save ()
				await user.roles.add (role)

				# make sure there’s no duplicates
				session = Session (name=sid, role=role, user=user)
				await session.save ()
				break
		except IntegrityError:
			session = None
	session.accessed = now ()
	await session.save (update_fields=('accessed', ))
	request.ctx.session = session

async def csrfOriginCheck (request):
	"""
	Prevent CSRF attacks by checking the Origin header against the target host.
	If they disagree someone sent a request from a different site (i.e. Origin).
	"""
	origin = request.headers.get ('origin')
	if origin and URL (origin).with_path ('/') != URL (request.url).with_path ('/'):
		raise Forbidden ('csrf')

async def saveSession (request, response):
	# a handler can delete the session by setting .session to None. When doing
	# so it should .delete() the session object as well.
	# XXX: can we figure out a fail-safe way to do this?
	session = getattr (request.ctx, 'session')
	if session is not None and session.name:
		response.cookies['session'] = request.ctx.session.name
		# session cookies should never be readable by JavaScript. In case of an
		# XSS vulnerability reading them via JavaScript is not possible.
		# see https://developer.mozilla.org/de/docs/Web/HTTP/Cookies
		response.cookies['session']['httponly'] = True
		response.cookies['session']['samesite'] = 'Lax'
		# no expiraton == session cookie
		# DO NOT .save() the session here. Session objects are long-lived and
		# prone to race-conditions. Use .save(update_fields=…) instead.
	else:
		# delete session
		del response.cookies['session']

async def getStatus ():
	""" Get module status information """
	activeSince = now() - timedelta (minutes=10)
	return dict (
			active10m=await Session.filter (accessed__gte=activeSince).count (),
			total=await Session.filter().count (),
			)

@bp.route ('/', methods=['DELETE'])
async def sessionDelete (request):
	app = request.app

	session = request.ctx.session
	audit.log ('session.delete', dict (session=session.name))

	await session.delete ()
	request.ctx.session = None

	return json ({}, status=200)

expireJobThread = None

async def expireJob ():
	hour = 60*60

	while True:
		oldest = now() - timedelta (days=1)
		async for s in Session.filter (accessed__lte=oldest):
			audit.log ('session.expire', dict (session=s.name))
			await s.delete ()

		await asyncio.sleep (1*hour)

@bp.listener('before_server_start')
async def setup (app, loop):
	global expireJobThread

	expireJobThread = asyncio.ensure_future (expireJob ())

	# @bp.middleware attaches to blueprint’s url only, but we need it
	# application-wide
	app.register_middleware (csrfOriginCheck, 'request')
	app.register_middleware (loadSession, 'request')
	app.register_middleware (saveSession, 'response')

@bp.listener('after_server_stop')
async def teardown (app, loop):
	if expireJobThread:
		expireJobThread.cancel ()
		try:
			await expireJobThread
		except asyncio.CancelledError:
			pass

