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

import asyncio, shlex, json, itertools
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

from .util import randomSecret, now, periodic

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

class LastUseProxy:
	"""
	Object proxy, which records the last time a method was called
	in asyncio.loop time.
	"""

	def __init__ (self, o):
		self.o = o

		self.loop = asyncio.get_running_loop ()
		self.lastUse = self.loop.time ()

	def __getattr__ (self, name):
		self.lastUse = self.loop.time ()

		return getattr (self.o, name)

	def getLastUse (self):
		return self.lastUse

class UserConnection:
	"""
	A single SSH connection, which remembers it’s SFTP and process
	channels, as well as its last usage.
	"""

	def __init__ (self, conn):
		self.conn = conn
		self.sftpConn = None
		self.sftpLock = asyncio.Lock ()
		self.processes = []
		self.processLock = asyncio.Lock ()

		# Can we use this connection? For the connection manager (urgh)
		self.usable = True

		self.loop = asyncio.get_running_loop ()
		self.lastUse = self.loop.time ()

	def getLastUse (self):
		self.processes = list (filter (lambda x: not x.is_closing (), self.processes))
		if len (self.processes) > 0:
			# Still in use.
			return self.loop.time ()
		elif self.sftpConn is not None:
			# Maybe we used SFTP?
			return max (self.lastUse, self.sftpConn.getLastUse ())
		else:
			return self.lastUse

	@classmethod
	async def connect (cls, host, user, knownHosts=None, acceptTos=False):
		conn = await asyncssh.connect (
				client_factory=lambda: BawwabSSHClient (user, acceptTos),
				host=host,
				port=22,
				username=user.name,
				password=user.password,
				options=asyncssh.SSHClientConnectionOptions (known_hosts=knownHosts),
				)
		return cls (conn)

	async def close (self):
		async with self.sftpLock:
			if self.sftpConn is not None:
				self.sftpConn.exit ()
				await self.sftpConn.wait_closed ()
				self.sftpConn = None

		if self.conn is not None:
			self.conn.close ()
			await self.conn.wait_closed ()
			self.conn = None

	async def getMotd (self):
		self.lastUse = self.loop.time ()

		stdin, stdout, stderr = await self.conn.open_session ()

		try:
			return await asyncio.wait_for (stdout.read (64*1024), timeout=0.5)
		except asyncio.TimeoutError:
			return None

	async def getSftp (self):
		self.lastUse = self.loop.time ()

		async with self.sftpLock:
			if self.sftpConn is not None:
				# There is no way to check the status of a connection, so
				# try an operation to see if it’s still alive.
				await self.sftpConn.getcwd ()
			else:
				self.sftpConn = LastUseProxy (await self.conn.start_sftp_client ())

			return self.sftpConn

	async def createProcess (self, *args):
		self.lastUse = self.loop.time ()

		async with self.processLock:
			p = await self.conn.create_process (shlex.join (args))
			self.processes.append (p)
			return p

class UserConnectionManager:
	"""
	Manage per-user SSH connection.

	A user can have multiple open connections, but only the most
	recent one is exposed. Connections are automatically closed
	when idle.
	"""

	def __init__ (self, host, knownHosts):
		self._conns = defaultdict (list)
		self._locks = defaultdict (asyncio.Lock)
		self.host = host
		self.knownHosts = knownHosts
		self.logger = logger.bind ()

	async def getConnection (self, user, useNewConnection=False, acceptTos=False):
		userconns = self._conns[user]
		if len (userconns) == 0 or useNewConnection or not userconns[0].usable:
			# Mark other connections as unusable, so even
			# if we GC this new one we will not fall back to
			# the other ones.
			for c in userconns:
				c.usable = False
			c = await UserConnection.connect (self.host, user, self.knownHosts, acceptTos=acceptTos)
			userconns.insert (0, c)
		return userconns[0]

	async def withConnection (self, f, *args, **kwargs):
		"""
		Use a connection with one retry, return the result of f.

		Retries all asyncssh SSH and SFTP errors.
		"""
		try:
			c = await self.getConnection (*args, **kwargs)
			return await f (c)
		except (asyncssh.misc.Error, asyncssh.sftp.SFTPError):
			kwargs['useNewConnection'] = True
			c = await self.getConnection (*args, **kwargs)
			return await f (c)

	async def getMotd (self, user):
		async def f (c):
			return await c.getMotd ()
		return await self.withConnection (f, user)

	async def getSftp (self, user):
		async def f (c):
			return await c.getSftp ()
		return await self.withConnection (f, user)

	async def createProcess (self, user, *args, useNewConnection=False):
		async def f (c):
			return await c.createProcess (*args)
		return await self.withConnection (f, user, useNewConnection=useNewConnection)

	async def acceptTos (self, user):
		c = await self.getConnection (user, useNewConnection=True, acceptTos=True)
		return True

	async def disconnect (self, user):
		async with self._locks[user]:
			for c in self._conns[user]:
				await c.close ()

	async def cleanup (self):
		""" Clean up idle and dead connections """
		self.logger.info ('connmgr.cleanup.start', conns=len (self._conns))
		loop = asyncio.get_running_loop ()
		now = loop.time ()
		maxIdle = 10*60
		for k in list (self._conns.keys ()):
			purgeLock = False
			async with self._locks[k]:
				conns = self._conns[k]
				alive = []
				for c in conns:
					if now - c.getLastUse () > maxIdle:
						await c.close ()
					else:
						alive.append (c)
				if len (alive) == 0:
					self.logger.info ('connmgr.cleanup.purge', user=k)
					del self._conns[k]
					purgeLock = True
				else:
					self.logger.info ('connmgr.cleanup.alive', user=k, conns=len (alive))
					self._conns[k] = alive
			if purgeLock:
				del self._locks[k]

	async def close (self):
		for c in itertools.chain.from_iterable (self._conns.values ()):
			await c.close ()

	@property
	def connectionCount (self):
		return sum (map (len, self._conns.values ()))

	@property
	def userCount (self):
		return len (self._conns)

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

	async def getMotd (self):
		return await connmgr.getMotd (self)

	async def getSftp (self):
		return await connmgr.getSftp (self)

	async def createProcess (self, *args, useNewConnection=False):
		return await connmgr.createProcess (self, *args, useNewConnection=useNewConnection)

	async def acceptTos (self):
		return await connmgr.acceptTos (self)

	async def disconnect (self):
		return await connmgr.disconnect (self)

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
			connmgr=dict(
				connections=connmgr.connectionCount,
				users=connmgr.userCount,
				),
			)

async def makeUserResponse (user):
	motd = None
	loginStatus = 'unknown'
	try:
		motd = await user.getMotd ()
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
			return await makeUserResponse (user)

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

@bp.route ('/acceptTos', methods=['POST'])
@authenticated
async def userAcceptTos (request, user):
	await user.acceptTos ()
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

	p = await user.createProcess (*config.USERMGR_DELETE_COMMAND)
	result = await p.wait ()
	request.ctx.logger.info (__name__ + '.data', result=result)
	data = json.loads (result.stdout)
	if data['status'] != 'ok':
		request.ctx.logger.error (__name__ + '.delete.usermgrd_error', reason=data['status'])
		raise ServerError ('backend')

	# Close all connections.
	await user.disconnect ()

	await user.delete ()

	request.ctx.logger.info (__name__ + '.delete', user=user.name)

	return sanicjson ({'status': 'ok'}, status=200)

connmgr = None
cleanupThread = None

@bp.listener('before_server_start')
async def setup (app, loop):
	global connmgr
	global cleanupThread

	config = app.config
	User.setup (config.DATABASE_PASSWORD_KEY)
	connmgr = UserConnectionManager (host=config.SSH_HOST,
			knownHosts=config.KNOWN_HOSTS_PATH)

	cleanupThread = asyncio.ensure_future (cleanupJob ())

@bp.listener('after_server_stop')
async def teardown (app, loop):
	if cleanupThread:
		cleanupThread.cancel ()
		try:
			await cleanupThread
		except asyncio.CancelledError:
			pass

	if connmgr:
		await connmgr.close ()

@periodic(10)
async def cleanupJob ():
	await connmgr.cleanup ()

