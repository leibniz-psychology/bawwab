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
Email functionality.

Obviously it would be better to set up Postfix properly, use postfwd for rate
limits, write some content filter to add footer and reply-to header from LDAP.
But nobody was interested in investing that much time, so here we are, quick
and dirty.
"""

import random, asyncio
from email.message import EmailMessage
from email.utils import make_msgid, formataddr, formatdate
from datetime import timedelta

from sanic import Blueprint
from sanic.response import json
from sanic.exceptions import NotFound, ServerError, SanicException, Forbidden
from tortoise.models import Model
from tortoise import fields
import aiosmtplib, aiosmtplib.errors, re
from furl import furl
from sanic.log import logger

from .user import authenticated
from .util import periodic, now

class SentEmail (Model):
	# easy access by message id
	messageId = fields.TextField (description='Email message id')
	sender = fields.ForeignKeyField ("models.User")
	message = fields.TextField (description='The full email message')
	sent = fields.DatetimeField (auto_now_add=True)

subjectTemplates = dict (
		invite=dict (en="Invitation to PsychNotebook",
				de="Einladung zu Projekt im PsychNotebook"))
templates = dict (invite=dict (en="""\
Hi {recipientName}! 

{senderName} invites you to PsychNotebook to share their project
{projectName}
with you. Click on the link below to access the project. If you don't have an
account, you will be prompted to register first.

{link}

Personal message from {senderName}: 

{message}

---

About us: 
PsychNotebook is a free and open-source platform that offers an online
environment for statistical computing, the presentation of data, and joint
project planning. We stand for open science, that is, free access to scientific
outcomes and their reproducibility. PsychNotebook is provided by Leibniz
Institute for Psychology (ZPID).
https://www.psychnotebook.org
""",
		de="""\
Hallo {recipientName}!

{senderName} lädt dich zu PsychNotebook ein, um das Projekt
{projectName}
mit dir zu teilen. Klicke auf den unten aufgeführten Link, um auf das Projekt
zuzugreifen. Falls du noch kein Benutzerkonto hast, wirst du zunächst
aufgefordert, dich zu registrieren.

{link}

Persönliche Mitteilung von {senderName}:

{message}

---

Über uns:
PsychNotebook ist eine kostenlose Open-Source-Plattform, die eine online
Umgebung für statistische Berechnungen, die Präsentation von Daten und
gemeinsame Projektplanung bietet. Wir stehen für Open Science, d.h. den freien
Zugang zu wissenschaftlichen Ergebnissen und deren Reproduzierbarkeit.
PsychNotebook wird vom Leibniz-Institut für Psychologie (ZPID) bereitgestellt.
https://www.psychnotebook.org
"""))

bp = Blueprint('email')

@bp.route ('/', methods=['POST'])
@authenticated
async def submit (request, user):
	# quota, allow 50 mails/day
	oldest = now() - timedelta (days=1)
	sent = await SentEmail.filter (sent__gte=oldest).count ()
	quota = 50
	if sent >= quota:
		raise Forbidden ('quota_reached')

	session = request.ctx.session
	values = dict (request.json)
	dryRun = values.get ('dryRun')
	templateName = values.get ('template')
	language = values.get ('lang') or 'en'

	tpl = templates.get (templateName, {}).get (language, None)
	if not tpl:
		raise NotFound ('template_not_found')
	subject = subjectTemplates[templateName][language]

	# input validation
	link = furl (values.get ('link', None))
	recipientName = values.get ('recipientName', None)
	recipientAddress = values.get ('recipientAddress', None)
	senderAddress = session.oauthInfo.get ('email', None)
	senderName = session.oauthInfo.get ('name', None)
	# we’re lazy and defer actual validation to the sending SMTP server
	if not recipientName or not recipientAddress:
		raise SanicException ('recipient_invalid', status_code=400)
	if not senderName or not senderAddress:
		raise Forbidden ('sender_invalid')
	if link.host != request.server_name:
		raise Forbidden ('link_invalid')

	values['senderName'] = senderName
	message = tpl.format (**values)
	try:
		if not dryRun:
			email = await sendEmail (request.app.config, recipientName, recipientAddress,
					senderAddress, subject, message)
			entry = SentEmail (messageId=email['message-id'], sender=user, message=str (email))
			await entry.save ()
	except aiosmtplib.errors.SMTPException as e:
		if e.code == 501:
			raise SanicException ('syntax_error', status_code=400)
		else:
			raise ServerError ('error')

	return json (dict (status='ok', message=str (message)))

async def sendEmail (config, recipientName, recipientAddress, senderAddress, subject, content):
	config = config.EMAIL

	message = EmailMessage()
	msgid = message['Message-ID'] = make_msgid ('psychnotebook.org')
	message["From"] = formataddr (('PsychNotebook', config['sender']))
	message["To"] = formataddr ((recipientName, recipientAddress))
	message["Subject"] = subject
	message["Reply-To"] = formataddr (('', senderAddress))
	message["Date"] = formatdate ()
	message.set_content (content)

	await aiosmtplib.send (message, hostname=config['server'],
			port=config['port'], username=config['sender'],
			password=config['password'], start_tls=True)
	return message

expireJobThread = None
hour = 60*60
@periodic(1*hour)
async def expireMailJob ():

	oldest = now() - timedelta (days=30)
	async for e in SentEmail.filter (sent__lte=oldest):
		await e.delete ()

@bp.listener('before_server_start')
async def setup (app, loop):
	global expireJobThread
	expireJobThread = asyncio.ensure_future (expireMailJob ())

@bp.listener('after_server_stop')
async def teardown (app, loop):
	if expireJobThread:
		expireJobThread.cancel ()
		try:
			await expireJobThread
		except asyncio.CancelledError:
			pass

