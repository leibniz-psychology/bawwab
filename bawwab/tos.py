# Copyright 2021 Leibniz Institute for Psychology
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
Terms of Service
"""

import asyncio
from datetime import datetime
from collections import namedtuple

import bonsai

from sanic import Blueprint
from sanic.log import logger
from sanic.response import html, json
from sanic.exceptions import Forbidden, ServerError, NotFound, ServiceUnavailable

from .util import periodic

logger = logger.getChild (__name__)

bp = Blueprint ('tos')

@bp.route ('/', methods=['GET'])
async def tosGet (request):
	session = request.ctx.session

	return json (list (map (termsToDict, cachedTos)), status=200)

client = None
refreshJobThread = None
cachedTos = []

Terms = namedtuple ('Terms', ['id', 'language', 'kind', 'content', 'effective'])
def termsToDict (t):
	d = t._asdict ()
	d['effective'] = d['effective'].isoformat ()
	return d

hour = 60*60
@periodic(1*hour, logger)
async def refreshJob (base):
	global cachedTos

	tos = []
	async with client.connect (is_async=True) as conn:
		ret = await conn.search (base, bonsai.LDAPSearchScope.SUB, "(objectclass=x-termsAndConditions)")
		for t in ret:
			tos.append (Terms (
					id=t['x-termsId'][0],
					language=t['x-termsLanguage'][0],
					kind=t['x-termsKind'][0],
					content=t['x-termsContent'][0],
					effective=datetime.strptime (t['x-termsEffective'][0], '%Y%m%d%H%M%SZ'),
					))
		cachedTos = tos

@bp.listener('before_server_start')
async def setup (app, loop):
	global client, refreshJobThread

	config = app.config

	client = bonsai.LDAPClient (config.LDAP_SERVER)
	client.set_credentials ("SIMPLE", user=config.LDAP_USER, password=config.LDAP_PASSWORD)
	refreshJobThread = asyncio.ensure_future (refreshJob (config.LDAP_TOS_BASE))

@bp.listener('after_server_stop')
async def teardown (app, loop):
	if refreshJobThread:
		refreshJobThread.cancel ()
		try:
			await refreshJobThread
		except asyncio.CancelledError:
			pass

