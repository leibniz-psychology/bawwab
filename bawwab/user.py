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
User management.
"""

import asyncio, shlex
from functools import wraps
from datetime import timedelta

from tortoise.models import Model
from tortoise import fields
from tortoise.exceptions import DoesNotExist, IntegrityError
from tortoise.transactions import in_transaction
from sanic import Blueprint
from sanic.log import logger
from sanic.response import html, json
from sanic.exceptions import Forbidden, ServerError, NotFound, ServiceUnavailable
import aiohttp
from cryptography.fernet import Fernet
import asyncssh

from .util import randomSecret, now
from . import audit

logger = logger.getChild (__name__)

bp = Blueprint ('user')

class UserConnectionManager:
	""" Manage per-user SSH connection """

	def __init__ (self, host, knownHosts):
		self._conns = {}
		self.host = host
		self.knownHosts = knownHosts

	async def _getConnection (self, user):
		conn = self._conns.get (user, None)
		if conn is None:
			logger.debug (f'establishing new SSH connection for {user}')
			conn = await asyncssh.connect (
					host=self.host,
					port=22,
					username=user.name,
					password=user.password,
					options=asyncssh.SSHClientConnectionOptions (known_hosts=self.knownHosts),
					)
			self._conns[user] = conn
		return conn

	async def _invalidate (self, user):
		conn = self._conns.pop (user)
		conn.close ()
		await conn.wait_closed ()

	async def getChannel (self, user, kind, *args, **kwargs):
		for i in range (10):
			try:
				conn = await self._getConnection (user)
				f = getattr (conn, kind)
				return await f (*args, **kwargs)
			except asyncssh.misc.ChannelOpenError:
				logger.error (f'channel {kind} for {user!r} was invalid, opening new connection')
				await self._invalidate (user)
		raise Exception ('bug')

	async def aclose (self):
		for c in self._conns.values ():
			c.close ()
			await c.wait_closed ()

class User (Model):
	crypter = None

	authId = fields.CharField (128, null=True, unique=True, description='OAuth identity')
	name = fields.CharField (64, description='UNIX user name')
	passwordEncrypted = fields.BinaryField (description='UNIX user password')

	@classmethod
	def setup (cls, key):
		# Obviously this is security through obscurity. But we want to make sure
		# that someone with access to the database cannot gain SSH access unless he
		# also has access to this application, which would be game over anyway. It
		# would be nice if we could encrypt it with the user’s password, but – you
		# know – OAuth.
		cls.crypter = Fernet (key)

	@property
	def password (self):
		return self.crypter.decrypt (self.passwordEncrypted).decode ('utf-8')

	@password.setter
	def password (self, password):
		self.passwordEncrypted = self.crypter.encrypt (password.encode ('utf-8'))

	async def getChannel (self, kind, *args, **kwargs):
		return await connmgr.getChannel (self, kind, *args, **kwargs)

def authenticated (f):
	@wraps(f)
	async def wrapper (request, *args, **kwds):
		session = request.ctx.session
		authId = getattr (session, 'authId', None)
		if authId is not None:
			user = await User.get_or_none (authId=authId)
			if user is not None:
				return await f (request, user, *args, **kwds)
		raise Forbidden ('unauthenticated')
	return wrapper

async def getStatus ():
	""" Get module status information """
	activeSince = now() - timedelta (days=1)
	return dict (
			total=await User.filter().count (),
			)

@bp.route ('/', methods=['GET'])
async def userGet (request):
	session = request.ctx.session

	authId = getattr (session, 'authId', None)
	if authId is not None:
		user = await User.get_or_none (authId=session.authId)
		if user is not None:
			return json (dict (
				name=user.name,
				password=user.password,
				))
	raise NotFound ('nonexistent')

@bp.route ('/', methods=['POST'])
async def userCreate (request):
	session = request.ctx.session
	form = request.json

	authId = getattr (session, 'authId', None)
	if authId is None:
		raise Forbidden ('anonymous')

	form['authorization'] = authId

	user = await User.get_or_none (authId=authId)
	if user is not None:
		raise Forbidden ('exists')

	try:
		async with request.app.usermgrd.post ('http://localhost/', json=form) as resp:
			data = await resp.json ()
			if data['status'] != 'ok':
				audit.log ('user.create.usermgrd_error', reason=data['status'])
				raise ServerError ('backend')
	except aiohttp.ClientConnectionError:
		audit.log ('user.create.usermgrd_connect_failure')
		raise ServiceUnavailable ('backend')

	user = User (authId=authId, name=data['user'])
	user.password = data['password']
	await user.save ()

	return json (dict (
		name=user.name,
		password=user.password,
		))

@bp.route ('/', methods=['DELETE'])
@authenticated
async def userDelete (request, user):
	async def callDelete (expectedStatus):
		try:
			logger.debug (f'calling delete user for {user.name}')
			async with request.app.usermgrd.delete (f'http://localhost/{user.name}') as resp:
				data = await resp.json ()
				logger.debug (f'got response {data}')
				status = data['status']
				if status == 'user_not_found':
					logger.warning (f'user {user.name} was already gone')
					return None
				elif status != expectedStatus:
					audit.log ('user.delete.usermgrd_error', reason=data['status'],
							authId=authId, user=user.name)
					raise ServerError ('backend')
				return data
		except aiohttp.ClientConnectionError:
			audit.log ('user.delete.usermgrd_connect_failure', user=user.name,
					authId=authId)
			raise ServiceUnavailable ('backend')

	data = await callDelete ('again')
	if data:
		# create the file
		token = data['token']
		command = ['touch', token]
		logger.debug (f'running command {command}')
		try:
			p = await user.getChannel ('create_process', shlex.join (command))
			await p.wait ()
			p.close ()
			await p.wait_closed ()

			# call again to confirm
			await callDelete ('ok')
		except asyncssh.misc.PermissionDenied:
			raise Forbidden ('locked_out')

	session = request.ctx.session
	audit.log ('user.delete', user=user.name, authId=session.authId)
	await user.delete ()

	return json ({}, status=200)

connmgr = None

@bp.listener('before_server_start')
async def setup (app, loop):
	global connmgr

	config = app.config
	User.setup (config.DATABASE_PASSWORD_KEY)
	connmgr = UserConnectionManager (host=config.SSH_HOST,
			knownHosts=config.KNOWN_HOSTS_PATH)

@bp.listener('after_server_stop')
async def teardown (app, loop):
	if connmgr:
		await connmgr.aclose ()
