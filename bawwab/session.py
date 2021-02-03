# Copyright 2019–2020 Leibniz Institute for Psychology
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

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
from sanic.response import json, redirect
from sanic.exceptions import Forbidden, ServerError
from furl import furl

from .util import now, randomSecret, periodic
from .oauth2 import KeycloakClient, Oauth2Error
from . import audit

logger = logger.getChild (__name__)
# do not change this value unless you know how to migrate your database
sessionNameLen = 32

class Session (Model):
	name = fields.CharField(sessionNameLen, unique=True, description='Session id exposed to browser')
	created = fields.DatetimeField(auto_now_add=True)
	accessed = fields.DatetimeField(null=True, description='Last user access to session')
	oauthState = fields.TextField (null=True, description='OAuth state data')
	oauthInfo = fields.JSONField (null=True, description='OAuth user info cache')

	@property
	def authId (self):
		if self.oauthInfo and 'sub' in self.oauthInfo:
			return self.oauthInfo['sub']
		else:
			raise AttributeError ()

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
			session = await Session.filter (name=sessionId).first ()
		except DoesNotExist:
			pass

	# try to create a new session if none exists yet
	for i in range (100 if not session else 0):
		try:
			# create a new one
			sid = randomSecret (sessionNameLen)

			# make sure there’s no duplicates
			session = Session (name=sid)
			await session.save ()
			break
		except IntegrityError:
			session = None
	if not session:
		raise ServerError ('session')
	session.accessed = now ()
	await session.save (update_fields=('accessed', ))
	request.ctx.session = session

async def csrfOriginCheck (request):
	"""
	Prevent CSRF attacks by checking the Origin header against the target host.
	If they disagree someone sent a request from a different site (i.e. Origin).
	"""
	origin = request.headers.get ('origin')
	if origin:
		originUrl = furl (origin).set (path='/')
		requestUrl = furl (request.url).set (path='/')
		# Fix the scheme for websocket requests
		if requestUrl.scheme in {'ws', 'wss'}:
			requestUrl = requestUrl.set (scheme=originUrl.scheme)
		if originUrl != requestUrl:
			logger.error (f'csrf protection denied {request} origin {originUrl} request {requestUrl}')
			raise Forbidden ('csrf')

async def saveSession (request, response):
	# a handler can delete the session by setting .session to None. When doing
	# so it should .delete() the session object as well.
	# XXX: can we figure out a fail-safe way to do this?
	session = getattr (request.ctx, 'session', None)
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

@bp.route ('/', methods=['GET'])
async def sessionGet (request):
	app = request.app

	session = request.ctx.session
	audit.log ('session.delete', session=session.name)

	session = dict (
		name=session.name,
		oauthInfo=session.oauthInfo,
		created=session.created.isoformat (),
		accessed=session.accessed.isoformat (),
		)

	return json (session, status=200)

@bp.route ('/', methods=['DELETE'])
async def sessionDelete (request):
	app = request.app

	session = request.ctx.session
	audit.log ('session.delete', session=session.name)

	await session.delete ()
	request.ctx.session = None

	return json ({}, status=200)

def callbackUrl (request):
	kwargs = dict ()
	if 'next' in request.args:
		kwargs['next'] = request.args['next'][0]
	return request.url_for ('session.callback', **kwargs)
	#return request.url_for ('session.callback')

@bp.route ('/login')
async def login (request):
	app = request.app
	config = app.config

	session = request.ctx.session

	# already logged in?
	if session.oauthInfo:
		return redirect ('/')

	cbUrl = callbackUrl (request)
	state = randomSecret ()
	session.oauthState = state
	await session.save (update_fields=('oauthState', ))
	logger.debug (f'authenticating using url {cbUrl}')
	redirectUrl = await auth.authorize (scope="ZPID", redirectUri=cbUrl, state=state)
	logger.debug (f'redirecting to {redirectUrl}')

	audit.log ('auth.login.start', session=session.name)

	return redirect (str (redirectUrl))

@bp.route ('/callback')
async def callback (request):
	app = request.app
	config = app.config
	session = request.ctx.session

	# CSRF protection
	if session.oauthState != request.args['state'][0]:
		audit.log ('session.login.failure',
				reason='state_mismatch',
				expected=session.oauthState,
				received=request.args['state'][0],
				session=session.name,
				)
		return redirect ('/login/state_mismatch')
	session.oauthState = None
	await session.save (update_fields=('oauthState', ))

	# redirect_uri must be the same as above, or server will reject auth
	cbUrl = callbackUrl (request)
	logger.debug (f'authenticating (step 2) using url {cbUrl}')
	try:
		token, userinfo = await auth.authorize (
				scope="ZPID",
				redirectUri=cbUrl,
				state=request.args['state'],
				code=request.args['code'])
	except Oauth2Error as e:
		audit.log ('auth.login.failure',
				reason=e.args[0],
				session=session.name,
				)
		return redirect ('/login/oauth2_' + e.args[0])

	session.oauthInfo = userinfo
	await session.save ()

	audit.log ('session.login.success',
			authId=session.authId, session=session.name)

	return redirect (request.args['next'][0] if 'next' in request.args else '/login/success')

expireJobThread = None
auth = None

hour = 60*60
@periodic(1*hour, logger)
async def expireJob ():

	oldest = now() - timedelta (days=1)
	async for s in Session.filter (accessed__lte=oldest):
		audit.log ('session.expire', session=s.name)
		await s.delete ()

@bp.listener('before_server_start')
async def setup (app, loop):
	global expireJobThread, auth

	config = app.config

	expireJobThread = asyncio.ensure_future (expireJob ())
	auth = KeycloakClient (
			id=config.CLIENT_ID,
			secret=config.CLIENT_SECRET,
			baseUrl=config.KEYCLOAK_BASE,
			realm=config.KEYCLOAK_REALM)

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

