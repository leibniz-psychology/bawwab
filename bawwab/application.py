import asyncio
from traceback import TracebackException

import aiohttp
import asyncssh
from yarl import URL
from sanic import Blueprint
from sanic.response import json
from sanic.log import logger
from tortoise.models import Model
from tortoise import fields

from . import audit
from .util import now, randomSecret
from .tos import requireTos

class Application (Model):
	"""
	Runnable entity bound to a workspace
	"""

	key = fields.CharField (32, description='Application kind')
	command = fields.CharField (128, description='Shell command that starts the application')
	conductorKey = fields.CharField (32, description='Key (i.e. subdomain) for conductor')
	lastStarted = fields.DatetimeField (null=True, description='Time the application was started')

	def toPublicDict (self):
		return dict (id=self.id, key=self.key)

class ApplicationRunner:
	"""
	Run a single application on a remote server
	"""

	# XXX: this is ugly
	CONFIG = None

	def __init__ (self, application):
		self.application = application
		self.token = randomSecret (32)
		self._task = None

	async def baseUrl (self):
		w = await self.application.workspaces.all ().first ()
		return URL (self.CONFIG.PROXY_HOST.format (key=self.application.conductorKey, user=w.sshUser))

	async def loginUrl (self):
		if self.running:
			return (await self.baseUrl ()).with_path (f'/_auth-conductor/{self.token}')
		else:
			return None

	@property
	def running (self):
		return self._task and not self._task.done ()

	def run (self):
		self._task = asyncio.ensure_future (self._run ())

	async def _run (self):
		host = self.CONFIG.SSH_HOST
		workspace = await self.application.workspaces.all ().first ()
		user = workspace.sshUser

		async def dumpLines (fd):
			try:
				while True:
					l = await fd.readline ()
					if not l:
						break
					logger.info (l.strip ())
			except:
				pass

		try:
			conn = await asyncssh.connect (
					host,
					port=22,
					username=user,
					password=workspace.sshPassword,
					options=asyncssh.SSHClientConnectionOptions (known_hosts=self.CONFIG.KNOWN_HOSTS_PATH),
					)
			proc = await conn.create_process (f'$SHELL -l -c "CONDUCTOR_TOKEN={self.token} {self.application.command}"')
			stdoutTask = asyncio.ensure_future (dumpLines (proc.stdout))
			stderrTask = asyncio.ensure_future (dumpLines (proc.stderr))
			try:
				ret = await proc.wait ()
				audit.log ('application.exit', dict (
						app=self.application.id,
						command=self.application.command,
						workspace=workspace.id,
						returncode=ret.exit_status,
						signal=ret.exit_signal,
						))
			except asyncio.CancelledError:
				proc.terminate ()
				await proc.wait ()
				audit.log ('application.cancel', dict (
						app=self.application.id,
						command=self.application.command,
						workspace=workspace.id,
						))
			await stdoutTask
			await stderrTask
		except Exception as e:
			audit.log ('application.crash', dict (
					app=self.application.id,
					command=self.application.command,
					workspace=workspace.id,
					traceback=list (TracebackException.from_exception (e).format ()),
					))

class ApplicationRunnerFactory:
	"""
	This guy here manages running our applications. Obviously it’s not a good
	idea to run it in the same process as the web application since a restart
	kills all applications. But for now we’r doing it anyway.
	"""

	def __init__ (self):
		self.running = {}

	def get (self, application):
		runner = self.running.get (application.id, None)
		if runner and runner.running:
			return runner
		raise KeyError ()

	async def start (self, application):
		runner = self.running.get (application.id, None)
		if runner:
			if runner._task.done ():
				await runner._task
				runner = None
		if not runner:
			runner = ApplicationRunner (application)
			runner.run ()
			self.running[application.id] = runner

			application.lastStarted = now ()
			await application.save ()
		return runner

	async def stop (self, application):
		runner = self.running.pop (application.id, None)
		if runner:
			runner._task.cancel ()
			# XXX: time-out
			await runner._task

def defaultApplications ():
	return [
		Application (key='jupyterlab', command='startjupyter', conductorKey='jupyterlab'),
		Application (key='rstudio', command='startrstudio', conductorKey='rstudio'),
		]

bp = Blueprint('application')
runFactory = ApplicationRunnerFactory ()

@bp.listener('before_server_start')
async def setup (app, loop):
	config = app.config
	ApplicationRunner.CONFIG = config

@bp.route ('/<aid:int>', methods=['POST'])
@requireTos
async def applicationStart (request, aid):
	config = request.app.config
	session = request.ctx.session

	try:
		a = await Application.filter (id=aid,
				workspaces__permissions__role=session.role,
				workspaces__permissions__canExecute=True).first ()
		# XXX: well, one to many…
		workspace = await a.workspaces.all().first ()
	except DoesNotExist:
		return json ({}, status=404)

	audit.log ('application.start', dict (
			app=a.id,
			session=session.name,
			sshUser=workspace.sshUser,
			))
	runner = await runFactory.start (a)

	appBaseUrl = await runner.baseUrl ()
	# make sure it is actually available
	timeout = aiohttp.ClientTimeout (total=10)
	async with aiohttp.ClientSession(timeout=timeout) as client:
		i = 0
		maxRetries = 30
		while True:
			try:
				logger.error (f'app {aid} checking status of {appBaseUrl}')
				async with client.get(appBaseUrl,
						cookies={'authorization': runner.token},
						allow_redirects=False) as resp:
					logger.info (f'app {aid} got status {resp.status}')
					# positive response
					if 200 <= resp.status < 400:
						break
			except aiohttp.ClientError:
				logger.error (f'{aid} cannot connect to target application, retrying')
			except asyncio.TimeoutError:
				logger.error (f'{aid} timed out waiting for proxy')
			i += 1
			# died prematurely?
			if i >= maxRetries or not runner.running:
				return json ({}, status=500)
			await asyncio.sleep (1)

	adict = a.toPublicDict ()
	adict['url'] = str (await runner.loginUrl ())
	return json (adict, status=200)

__all__ = ['bp', 'runFactory']

