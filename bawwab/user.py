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

import asyncio, shlex, json
from asyncio.subprocess import PIPE
from functools import wraps
from datetime import timedelta
from collections import defaultdict

from tortoise.models import Model
from tortoise import fields
from tortoise.exceptions import DoesNotExist, IntegrityError
from tortoise.transactions import in_transaction
from sanic import Blueprint
from sanic.response import html
from sanic.response import json as sanicjson
from sanic.exceptions import Forbidden, ServerError, NotFound, ServiceUnavailable
import aiohttp
from cryptography.fernet import Fernet
import asyncssh
from structlog import get_logger

from .util import randomSecret, now

logger = get_logger ()

bp = Blueprint ('user')

class TermsNotAccepted (Exception):
	""" User did not agree to terms of service yet """
	pass

# In asyncio terminology this is a Protocol?
class BawwabSSHClient (asyncssh.SSHClient):
	def __init__ (self, user, acceptTos=False):
		self.user = user
		self.sftp = None
		self.motd = None
		self.acceptTos = acceptTos
		self.conn = None

	def connection_made (self, conn):
		self.conn = conn

		# create link to connection object, so we can access this client somehow
		assert getattr (conn, 'bclient', None) is None
		conn.bclient = self

	def connection_lost (self, exc):
		pass

	def auth_banner_received (self, msg, lang):
		pass

	def kbdint_auth_requested (self):
		return ''

	def kbdint_challenge_received (self, name, instructions, lang, prompts):
		# This seems awfully fragile, but, meh.
		if 'Permission denied'.lower () in instructions.lower () and not prompts:
			raise asyncssh.misc.PermissionDenied (reason=instructions)
		ret = []
		for p, echo in prompts:
			if p.strip ().lower () == 'password:':
				ret.append (self.user.password)
			elif 'Do you agree to the terms and conditions'.lower () in p.lower () and echo:
				if self.acceptTos:
					ret.append ('y')
				else:
					ret.append ('n')
					raise TermsNotAccepted ()
		return ret

class UserConnectionManager:
	""" Manage per-user SSH connection """

	def __init__ (self, host, knownHosts):
		self._conns = {}
		self._locks = defaultdict (asyncio.Lock)
		self.host = host
		self.knownHosts = knownHosts
		self.logger = logger.bind ()

	async def _getConnection (self, user, acceptTos=False):
		"""
		Get a cached connection or establish one.

		Can throw TermsNotAccepted via BawwabSSHClient.
		"""
		async with self._locks[user]:
			c = self._conns.get (user, None)
			if c is None:
				conn = await asyncssh.connect (
						client_factory=lambda: BawwabSSHClient (user, acceptTos),
						host=self.host,
						port=22,
						username=user.name,
						password=user.password,
						options=asyncssh.SSHClientConnectionOptions (known_hosts=self.knownHosts),
						)
				try:
					stdin, stdout, stderr = await conn.open_session ()
				except asyncssh.misc.ChannelOpenError:
					raise Exception ('channel_open')

				# get motd
				try:
					conn.bclient.motd = await asyncio.wait_for (stdout.read (64*1024), timeout=0.5)
				except asyncio.TimeoutError:
					pass

				c = self._conns[user] = conn
			return c

	async def _invalidate (self, user):
		async with self._locks[user]:
			if user in self._conns:
				c = self._conns.pop (user)
				if c.bclient.sftp:
					c.bclient.sftp.exit ()
					await c.bclient.sftp.wait_closed ()
				c.close ()
				await c.wait_closed ()

	async def getChannel (self, user, kind, *args, **kwargs):
		backoff = 0.5
		for i in range (10):
			try:
				c = await self._getConnection (user)
				if kind == 'start_sftp_client' and c.bclient.sftp:
					# There is no way to check the status of a connection, so
					# try an operation to see if it’s still alive.
					await c.bclient.sftp.getcwd ()
					return c.bclient.sftp
				async with self._locks[user]:
					f = getattr (c, kind)
					ret = await f (*args, **kwargs)
					if kind == 'start_sftp_client':
						c.bclient.sftp = ret
					return ret
			except (asyncssh.misc.ChannelOpenError, asyncssh.misc.ConnectionLost, asyncssh.SFTPError):
				self.logger.debug ('invalidate_channel', user=user, kind=kind)
				await self._invalidate (user)
				await asyncio.sleep (backoff)
				backoff *= 1.2
		raise Exception ('bug')

	async def getSftp (self, user):
		""" Cached sftp client """
		return await self.getChannel (user, 'start_sftp_client')

	async def aclose (self):
		for c in self._conns.values ():
			c.close ()
			await c.wait_closed ()

class User (Model):
	crypter = None

	authId = fields.CharField (128, null=True, unique=True, description='OAuth identity')
	name = fields.CharField (64, description='UNIX user name')
	passwordEncrypted = fields.BinaryField (description='UNIX user password')

	def __repr__ (self):
		return f'<User {self.name}>'

	def __str__ (self):
		return repr (self)

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

	async def getConnection (self, acceptTos=False):
		return await connmgr._getConnection (self, acceptTos)

	async def getSftp (self):
		return await connmgr.getSftp (self)

def authenticated (f):
	@wraps(f)
	async def wrapper (request, *args, **kwds):
		session = request.ctx.session
		authId = getattr (session, 'authId', None)
		if authId is not None:
			user = await User.get_or_none (authId=authId)
			if user is not None:
				request.ctx.logger = request.ctx.logger.bind (user=dict (name=user.name, authId=user.authId))
				return await f (request, user, *args, **kwds)
		raise Forbidden ('unauthenticated')
	return wrapper

async def getStatus ():
	""" Get module status information """
	activeSince = now() - timedelta (days=1)
	return dict (
			total=await User.filter().count (),
			)

async def makeUserResponse (user, acceptTos=False):
	motd = None
	loginStatus = 'unknown'
	try:
		c = await user.getConnection (acceptTos)
		motd = c.bclient.motd
		loginStatus = 'success'
	except TermsNotAccepted:
		loginStatus = 'termsOfService'
	except asyncssh.misc.PermissionDenied:
		loginStatus = 'permissionDenied'
	except OSError:
		# SSH is down
		return sanicjson (dict (status='unavailable'), status=503)

	return sanicjson (dict (
		status='ok',
		name=user.name,
		password=user.password,
		motd=motd,
		loginStatus=loginStatus,
		))

@bp.route ('/', methods=['GET'])
async def userGet (request):
	session = request.ctx.session

	authId = getattr (session, 'authId', None)
	if authId is not None:
		user = await User.get_or_none (authId=session.authId)
		if user is not None:
			# XXX: acceptTos should probably be done in a post request, because
			# it modifies state
			return await makeUserResponse (user, acceptTos='acceptTos' in request.args)

	raise NotFound ('nonexistent')

@bp.route ('/', methods=['POST'])
async def userCreate (request):
	session = request.ctx.session
	form = request.json
	config = request.app.config

	authId = getattr (session, 'authId', None)
	if authId is None:
		raise Forbidden ('anonymous')

	form['authorization'] = authId

	user = await User.get_or_none (authId=authId)
	if user is not None:
		raise Forbidden ('exists')

	try:
		proc = await asyncio.create_subprocess_exec (*config.USERMGR_CREATE_COMMAND, stdin=PIPE, stdout=PIPE)

		s = json.dumps (form)
		proc.stdin.write (s.encode ('utf-8'))
		await proc.stdin.drain ()
		proc.stdin.close ()
		await proc.stdin.wait_closed ()

		await proc.wait ()
		s = await proc.stdout.read ()
		s = s.decode ('utf-8')
		data = json.loads (s)
		if data['status'] != 'ok':
			request.ctx.logger.error (__name__ + '.create.usermgrd_error', reason=data['status'])
			raise ServerError ('backend')
	except aiohttp.ClientConnectionError:
		request.ctx.logger.error (__name__ + '.create.usermgrd_connect_failure')
		raise ServiceUnavailable ('backend')

	user = User (authId=authId, name=data['user'])
	user.password = data['password']
	await user.save ()

	request.ctx.logger.info (__name__ + '.create', user=user.name)

	return await makeUserResponse (user)

@bp.route ('/', methods=['DELETE'])
async def userDelete (request):
	session = request.ctx.session
	form = request.json
	config = request.app.config

	authId = getattr (session, 'authId', None)
	if authId is None:
		raise Forbidden ('anonymous')

	user = await User.get_or_none (authId=authId)
	if user is None:
		# This is fine.
		return sanicjson ({'status': 'ok'}, status=200)

	p = await user.getChannel ('create_process', shlex.join (config.USERMGR_DELETE_COMMAND))
	result = await p.wait ()
	request.ctx.logger.info (__name__ + '.data', result=result)
	data = json.loads (result.stdout)
	if data['status'] != 'ok':
		request.ctx.logger.error (__name__ + '.delete.usermgrd_error', reason=data['status'])
		raise ServerError ('backend')

	# Close all connections.
	await connmgr._invalidate (user)

	await user.delete ()

	request.ctx.logger.info (__name__ + '.delete', user=user.name)

	return sanicjson ({'status': 'ok'}, status=200)

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
