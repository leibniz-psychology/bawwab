"""
oauth2-based login. See https://tools.ietf.org/html/rfc6749 for specs.

XXX: perhaps rename to "user"?
"""

import asyncio
from functools import wraps
from datetime import timedelta

from tortoise.models import Model
from tortoise import fields
from tortoise.exceptions import DoesNotExist, IntegrityError
from tortoise.transactions import in_transaction
from sanic import Blueprint
from sanic.log import logger
from sanic.response import html, redirect, json
from sanic.exceptions import Forbidden, ServerError

from .oauth2 import KeycloakClient, Oauth2Error
from .util import randomSecret, now
from . import audit

bp = Blueprint ('auth')

class User (Model):
	created = fields.DatetimeField (auto_now_add=True, description='Creation time')
	lastLogin = fields.DatetimeField (null=True, description='Last login')
	authId = fields.CharField (128, null=True, unique=True, description='OAuth identity')
	email = fields.CharField (128, null=True, description='E-mail address')
	username = fields.CharField (64, null=True)
	givenName = fields.CharField (64, null=True)
	familyName = fields.CharField (64, null=True)
	orcid = fields.CharField (16+3, null=True, description='ORCid')
	roles = fields.ManyToManyField ('models.Role', description='Permitted roles for user')
	acceptedTermsOfService = fields.ForeignKeyField ('models.TermsOfService', null=True, description='ToS the user has agreed to')

	@property
	def isAnonymous (self):
		return self.authId is None

	def updateFromUserInfo (self, data):
		""" Update user from OAuth2 info """
			# sub is supposed to be a unique id identifying this user
		self.authId = 'oauth2:' + data['sub']
		self.email = data.get ('email')
		self.username = data.get ('preferred_username')
		self.givenName = data.get ('given_name')
		self.familyName = data.get ('family_name')
		self.orcid = data.get ('orcid')

class Role (Model):
	""" Roles are like hats: You may own multiple hats, but you can only wear one at a time. """
	# role with lowest priority is default
	priority = fields.IntField (description='Role priority when logging in')
	name = fields.CharField (64, description='Role name')

class GlobalPermission (Model):
	role = fields.ForeignKeyField ('models.Role', unique=True)
	canCreateWorkspace = fields.BooleanField (description='Create new workspaces')
	canUpdateTos = fields.BooleanField (description='Update the terms of service')
	canRegister = fields.BooleanField (description='Register a new account')

async def hasPermission (role, name):
	try:
		x = await GlobalPermission.get (role=role)
		return getattr (x, name, False)
	except DoesNotExist:
		# this is a bug
		logger.error (f'role {role} did not have any global permissions')
	return False

def requirePermission (name):
	""" Decorator that checks a global permission for the currently selected role """
	def wrapper (f):
		@wraps (f)
		async def wrapped (*args, **kwargs):
			request = args[0]
			session = request.ctx.session
			role = session.role

			if not await hasPermission (role, name):
				raise Forbidden ('permission_denied')

			return await f (*args, **kwargs)
		return wrapped
	return wrapper

async def getStatus ():
	""" Get module status information """
	activeSince = now() - timedelta (days=1)
	return dict (
			total=await User.filter().count (),
			anonymous=await User.filter(authId=None).count (),
			login1d=await User.filter(lastLogin__gte=activeSince).count (),
			)

from .tos import TermsOfService

@bp.route ('/login')
async def login (request):
	app = request.app
	config = app.config

	session = request.ctx.session

	# already logged in?
	if not session.user.isAnonymous:
		return redirect ('/')

	cbUrl = request.url_for ('auth.callback')
	state = randomSecret ()
	session.oauthState = state
	await session.save (update_fields=('oauthState', ))
	redirectUrl = await auth.authorize (scope="ZPID", redirectUri=cbUrl, state=state)

	audit.log ('auth.login.start', dict (session=session.name))

	return redirect (str (redirectUrl))

@bp.route ('/callback')
async def callback (request):
	app = request.app
	config = app.config
	session = request.ctx.session

	# CSRF protection
	if session.oauthState != request.args['state'][0]:
		audit.log ('auth.login.failure', dict (
				reason='state_mismatch',
				expected=session.oauthState,
				received=request.args['state'][0],
				session=session.name,
				))
		return redirect ('/login/state_mismatch')
	session.oauthState = None
	await session.save (update_fields=('oauthState', ))

	# redirect_uri must be the same as above, or server will reject auth
	cbUrl = request.url_for ('auth.callback')
	try:
		token, userinfo = await auth.authorize (
				scope="ZPID",
				redirectUri=cbUrl,
				state=request.args['state'],
				code=request.args['code'])
	except Oauth2Error as e:
		audit.log ('auth.login.failure', dict (
				reason=e.args[0],
				session=session.name,
				))
		return redirect ('/login/oauth2_' + e.args[0])

	async with in_transaction ():
		user = session.user
		user.updateFromUserInfo (userinfo)
		try:
			# XXX: migrate current role to this user’s default role
			user = await User.get (authId=user.authId)
			user.lastLogin = now ()

			session.user = user
			session.role = await user.roles.order_by ('priority').first ()
			await session.save (update_fields=('user_id', 'role_id'))
		except DoesNotExist:
			if not await hasPermission (session.role, 'canRegister'):
				raise Forbidden ('permission_denied')

			# update user with info from oauth
			user.lastLogin = now ()

			# update user’s global permissions now that he’s authenticated
			await GlobalPermission.filter (role=session.role).update (**config.AUTH_PERMISSIONS)

			audit.log ('auth.user_created', dict (
					id=user.id,
					authId=user.authId,
					session=session.name,
					))
		await user.save ()

	audit.log ('auth.login.success', dict (id=user.id, authId=user.authId, session=session.name))

	return redirect ('/login/success')

def userToDict (u):
	return dict (
			id=u.id,
			username=u.username,
			orcid=u.orcid,
			email=u.email,
			givenName=u.givenName,
			familyName=u.familyName,
			isAnonymous=u.isAnonymous,
			acceptedTermsOfService=dict (id=u.acceptedTermsOfService.id) if u.acceptedTermsOfService else None,
			)

@bp.route ('/', methods=['GET'])
async def userGet (request):
	session = request.ctx.session
	user = session.user

	await user.fetch_related ('acceptedTermsOfService')

	return json (userToDict (user), status=200)

@bp.route ('/', methods=['POST'])
async def userUpdate (request):
	session = request.ctx.session
	user = session.user

	form = request.json
	if 'acceptedTermsOfService' in form:
		try:
			tosId = form['acceptedTermsOfService']
			if tosId is None:
				user.acceptedTermsOfService = None
			else:
				user.acceptedTermsOfService = await TermsOfService.get (id=int (tosId))
			logger.info (user.acceptedTermsOfService)
		except TypeError:
			return json ({}, status=400)
		except DoesNotExist:
			raise NotFound ('tos_not_found')

	await user.save ()

	return json (userToDict (user), status=200)

@bp.route ('/', methods=['DELETE'])
async def userUpdate (request):
	session = request.ctx.session

	await session.user.delete ()
	session.user = None
	await session.role.delete ()
	session.role = None
	# XXX: async garbage-collect all associated resources

	return json ({}, status=200)

auth = None
expireJobThread = None

async def expireJob_role ():
         """ Remove the roles of a user in case the last connection to a user is broken to any session """

         hour = 60*60
         while True:
                 async for r in Role.filter ().prefetch_related('users'):
                         if not r.users:
                                audit.log ('role.delete', dict (id=r.id))
                                await r.delete ()

                 await asyncio.sleep (1*hour)
                 break


async def expireJob ():
	""" Remove users without authId and not attached to any session """

	hour = 60*60

	while True:
		async for u in User.filter (authId=None).prefetch_related ('sessions'):
			# XXX: how to do this with a single sql query?
                        if not u.sessions:
                                audit.log ('user.delete', dict (id=u.id))
                                await u.delete ()

		await expireJob_role ()


@bp.listener('before_server_start')
async def setup (app, loop):
	global auth, expireJobThread

	logger.info ('Booting blueprint auth')

	config = app.config
	auth = KeycloakClient (
			id=config.CLIENT_ID,
			secret=config.CLIENT_SECRET,
			baseUrl=config.KEYCLOAK_BASE,
			realm=config.KEYCLOAK_REALM)

	expireJobThread  = asyncio.ensure_future (expireJob ())

@bp.listener('after_server_stop')
async def teardown (app, loop):
	if expireJobThread:
		expireJobThread.cancel ()
		try:
			await expireJobThread
		except asyncio.CancelledError:
			pass

