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

import sys, logging

import aiohttp
import structlog
from sanic import Sanic
from sanic.response import json as sanicjson
from sanic.exceptions import SanicException
from tortoise.contrib.sanic import register_tortoise

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

app.blueprint (session.bp, url_prefix='/session')
app.blueprint (user.bp, url_prefix='/user')
app.blueprint (action.bp, url_prefix='/action')
app.blueprint (status.bp, url_prefix='/status')
app.blueprint (process.bp, url_prefix='/process')
app.blueprint (csp.bp, url_prefix='/csp')
app.blueprint (filesystem.bp, url_prefix='/filesystem')
app.blueprint (email.bp, url_prefix='/email')
app.blueprint (tos.bp, url_prefix='/tos')

def addLogger (request):
	""" Add bound logger to request """
	# .id is only available with sanic >=2021.X?
	request.ctx.logger = logger.bind (url=request.url, method=request.method)
app.register_middleware (addLogger, 'request')

