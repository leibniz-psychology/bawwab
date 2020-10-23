import socket, os, sys, shutil, traceback, sqlite3, inspect, argparse, re

import pkg_resources
import aiohttp
from sanic import Sanic
from sanic.response import json, html
from sanic.log import logger
from sanic.exceptions import SanicException
from tortoise import Tortoise
from tortoise.contrib.sanic import register_tortoise
from pypika import Query, Table, Field

from . import session, user, action, status, process, csp

def socketSession (path):
	conn = aiohttp.UnixConnector (path=path)
	return aiohttp.ClientSession(connector=conn)

def main ():
	app = Sanic('bawwab')
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
		if isinstance (exception, SanicException):
			return json (dict (status=exception.args[0]), status=exception.status_code)
		else:
			traceback.print_exc ()
			return json (dict (status='bug'), status=500)

	register_tortoise (
		app=app,
		db_url=config.DATABASE_URL,
		modules={'models': [
				'bawwab.session',
				'bawwab.user',
				'bawwab.action',
				]},
		generate_schemas=True,
	)

	app.blueprint (session.bp, url_prefix='/api/session')
	app.blueprint (user.bp, url_prefix='/api/user')
	app.blueprint (action.bp, url_prefix='/api/action')
	app.blueprint (status.bp, url_prefix='/api/status')
	app.blueprint (process.bp, url_prefix='/api/process')
	app.blueprint (csp.bp, url_prefix='/api/csp')
	app.static('/assets', pkg_resources.resource_filename (__package__, 'assets/'))

	# this should only be required when debugging
	minre = re.compile (r'(href|src)="(.*?)[\.-]min\.(css|js)"\s+integrity=".*?"')
	async def catchall (request, path=None):
		with pkg_resources.resource_stream (__package__, 'assets/app.html') as fd:
			# use non-minified script resources when debugging
			if config.DEBUG:
				return html (minre.sub (r'\1="\2.\3"', fd.read ().decode ('utf-8')))
			else:
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

