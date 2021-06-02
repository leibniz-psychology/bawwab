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

import socket, os, sys, shutil, traceback, sqlite3, inspect, argparse, re, \
		logging, structlog, json

import pkg_resources
import aiohttp
from sanic import Sanic
from sanic.response import json as sanicjson, html, file_stream
from sanic.exceptions import SanicException
from tortoise import Tortoise
from tortoise.contrib.sanic import register_tortoise
from pypika import Query, Table, Field

from . import session, user, action, status, process, csp, filesystem, email, tos

logger = structlog.get_logger ()

class StructLogHandler (logging.Handler):
	""" Forward messages from Python’s own logging module to structlog """
	def emit (self, record):
		lvl = record.levelname.lower ()
		f = getattr (logger, lvl)
		f ('logging.' + record.name, message=record.getMessage (), exc_info=record.exc_info)

def socketSession (path):
	conn = aiohttp.UnixConnector (path=path)
	return aiohttp.ClientSession(connector=conn)

def main ():
	structlog.configure (
		wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
		processors=[
			structlog.threadlocal.merge_threadlocal_context,
			structlog.processors.add_log_level,
			structlog.processors.format_exc_info,
			structlog.processors.TimeStamper(fmt="iso", utc=False),
			structlog.processors.JSONRenderer(),
		],
		logger_factory=structlog.PrintLoggerFactory(),
	)

	# Forward Python logging to structlog
	rootLogger = logging.getLogger ()
	structHandler = StructLogHandler ()
	rootLogger.addHandler (structHandler)
	rootLogger.setLevel (logging.INFO)

	app = Sanic('bawwab', configure_logging=False)

	# XXX: make sure config has proper permissions
	app.config.from_envvar('BAWWAB_SETTINGS')
	config = app.config

	# globally available services
	@app.listener('before_server_start')
	async def setup (app, loop):
		config = app.config
		app.usermgrd = socketSession (config.USERMGRD_SOCKET)

	@app.listener('after_server_stop')
	async def teardown (app, loop):
		await app.usermgrd.close ()

	@app.exception (Exception)
	def handleException (request, exception):
		log = request.ctx.logger
		if isinstance (exception, SanicException):
			log.error (__name__ + '.error', status=exception.args[0])
			return sanicjson (dict (status=exception.args[0]), status=exception.status_code)
		else:
			_, _, exc_info = sys.exc_info ()
			log.error (__name__ + '.error', exc_info=exc_info)
			return sanicjson (dict (status='bug'), status=500)

	register_tortoise (
		app=app,
		db_url=config.DATABASE_URL,
		modules={'models': [
				'bawwab.session',
				'bawwab.user',
				'bawwab.action',
				'bawwab.email',
				]},
		generate_schemas=True,
	)

	app.blueprint (session.bp, url_prefix='/api/session')
	app.blueprint (user.bp, url_prefix='/api/user')
	app.blueprint (action.bp, url_prefix='/api/action')
	app.blueprint (status.bp, url_prefix='/api/status')
	app.blueprint (process.bp, url_prefix='/api/process')
	app.blueprint (csp.bp, url_prefix='/api/csp')
	app.blueprint (filesystem.bp, url_prefix='/api/filesystem')
	app.blueprint (email.bp, url_prefix='/api/email')
	app.blueprint (tos.bp, url_prefix='/api/tos')
	app.static('/assets', pkg_resources.resource_filename (__package__, 'assets/'))

	def addLogger (request):
		""" Add bound logger to request """
		# .id is only available with sanic >=2021.X?
		request.ctx.logger = logger.bind (url=request.url, method=request.method)
	app.register_middleware (addLogger, 'request')

	# this should only be required when debugging
	async def catchall (request, path=None):
		if path:
			try:
				prefix = pkg_resources.resource_filename (__package__, f'assets/')
				filename = pkg_resources.resource_filename (__package__, f'assets/{path}')
				# restrict to assets/ directory
				if os.path.normpath (filename).startswith (prefix) and os.path.isfile (filename):
					return await file_stream (filename)
			except FileNotFoundError:
				# fall back to app.html
				pass
		with pkg_resources.resource_stream (__package__, 'assets/app.html') as fd:
			return html (fd.read ().decode ('utf-8'))
	app.add_route (catchall, '/')
	app.add_route (catchall, '/<path:path>')

	args = {}
	try:
		if config.DEBUG:
			args['debug'] = True
			args['auto_reload'] = True
	except AttributeError:
		# no debugging then
		pass

	try:
		args['host'], args['port'] = config.LISTEN.split (':', 1)
	except AttributeError:
		args['sock'] = sock = socket.socket (socket.AF_UNIX)
		if os.path.exists (config.SOCKET):
			os.unlink (config.SOCKET)
		sock.bind (config.SOCKET)
		try:
			shutil.chown (config.SOCKET, config.SOCKET_USER, config.SOCKET_GROUP)
		except AttributeError:
			# no config given
			pass
		os.chmod (config.SOCKET, config.SOCKET_MODE)

	app.run (**args)

def migrateDoApplicationNameToKey (db):
	application = Table('application')
	c = db.cursor()
	print ('begin transaction;')
	for row in c.execute ('select name, command, conductorKey, lastStarted, id from application'):
		q = Query \
				.into(application) \
				.columns('key', 'command', 'conductorKey', 'lastStarted', 'id') \
				.insert(row[0].lower(), row[1], row[2], row[3], row[4])
		print (str (q) + ';')
	print ('commit;')

def migrate ():
	prefix = 'migrateDo'
	available = dict ()
	for k, v in inspect.getmembers (sys.modules[__name__], inspect.isfunction):
		if k.startswith (prefix):
			available[k[len(prefix):].lower ()] = v

	parser = argparse.ArgumentParser(description='Database migration.')
	parser.add_argument('database', help='Database path')
	parser.add_argument('apply', choices=available.keys (), help='Named migration to apply')

	args = parser.parse_args()

	db = sqlite3.connect (args.database)
	available[args.apply] (db)

def loganalyze ():
	parser = argparse.ArgumentParser(description='Analyze logfiles.')
	parser.add_argument('--process', '-p', help='Get stdout/stderr for process token')
	parser.add_argument('--failed', '-f', action='store_true', help='Get failed processes only')

	args = parser.parse_args()

	processes = {}

	for l in sys.stdin:
		o = json.loads (l)

		if o['event'] == __package__ + '.process.message':
			procMsg = o['msg']
			token = o['token']

			if args.process:
				# single process dump mode
				if token == args.process:
					kind = procMsg['notify']
					if kind == 'processData':
						getattr (sys, procMsg['kind']).write (procMsg['data'])
			else:
				if procMsg['notify'] == 'processStart':
					processes[token] = dict (user=o['user'],
							command=o['command'],
							start=o['timestamp'],
							token=token)
				elif procMsg['notify'] == 'processExit':
					p = processes.get (token)
					if not p:
						continue
					p['end'] = o['timestamp']
					p['exitCode'] = procMsg['status']

					if (not args.process and not args.failed) or \
							(args.process and args.process == token) or \
							(args.failed and p['exitCode'] != 0):
						json.dump (p, sys.stdout)
						sys.stdout.write ('\n')

