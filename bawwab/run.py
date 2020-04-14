import socket, os, sys, shutil, traceback

import pkg_resources
import aiohttp
from sanic import Sanic
from sanic.response import json, html
from sanic.log import logger
from sanic.exceptions import SanicException
from tortoise import Tortoise
from tortoise.contrib.sanic import register_tortoise

from . import session, auth, workspace, audit, application, tos, action

def socketSession (path):
	conn = aiohttp.UnixConnector (path=path)
	return aiohttp.ClientSession(connector=conn)

def main ():
	app = Sanic('bawwab')
	# XXX: make sure config has proper permissions
	app.config.from_envvar('BAWWAB_SETTINGS')
	config = app.config

	@app.listener('before_server_start')
	async def setup (app, loop):
		config = app.config
		app.usermgrd = socketSession (config.USERMGRD_SOCKET)

	@app.listener('after_server_stop')
	async def teardown (app, loop):
		await app.usermgrd.close ()

	@app.exception (Exception)
	async def handleException (request, exception):
		if isinstance (exception, SanicException):
			return json (dict (status=exception.args[0]), status=exception.status_code)
		else:
			traceback.print_exc ()
			return json (dict (status='bug'), status=500)

	register_tortoise (
		app=app,
		db_url=config.DATABASE_URL,
		modules={'models': ['bawwab.workspace', 'bawwab.application', 'bawwab.session', 'bawwab.auth', 'bawwab.tos', 'bawwab.action']},
		generate_schemas=True,
	)

	app.blueprint (session.bp, url_prefix='/api/session')
	app.blueprint (auth.bp, url_prefix='/api/auth')
	app.blueprint (workspace.bp, url_prefix='/api/workspace')
	app.blueprint (application.bp, url_prefix='/api/application')
	app.blueprint (audit.bp, url_prefix='/api/audit')
	app.blueprint (tos.bp, url_prefix='/api/tos')
	app.blueprint (action.bp, url_prefix='/api/action')
	# must be first, so /assets does not override subpath
	app.static('/assets/fontawesome', config.FONTAWESOME_PATH)
	app.static('/assets', pkg_resources.resource_filename (__package__, 'assets/'))

	# this should only be required when debugging
	async def catchall (request, path=None):
		with pkg_resources.resource_stream (__package__, 'assets/app.html') as fd:
			# use non-minified script resources when debugging
			if config.DEBUG:
				return html (fd.read ().decode ('utf-8').replace ('.min.js', '.js'))
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
