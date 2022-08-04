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
Flexible one (or multiple) time action links

Unicorns. Unicorns everywhere.
"""

import asyncio, hashlib
from datetime import timedelta

from sanic import Blueprint
from sanic.response import json
from sanic.exceptions import NotFound
from tortoise.models import Model
from tortoise import fields
from structlog import get_logger

from .util import now, randomSecret

logger = get_logger ()

class Action (Model):
	# token is hashed, so a database breach does not expose all actions and
	# hexencoded, so SQL-lookups work
	tokenHashed = fields.CharField (64*2, unique=True, description='Token used to trigger this action')
	created = fields.DatetimeField (auto_now_add=True, description='Creation time')
	expires = fields.DatetimeField (null=True, description='Expiry time')
	usesRemaining = fields.IntField (null=True, description='Number of times the link can be used')
	name = fields.CharField (16, description='Action name')
	arguments = fields.JSONField (description='Action function parameters')

	@staticmethod
	def hashToken (t):
		return hashlib.blake2b (t.encode ('ascii')).hexdigest ()

	@property
	def token (self):
		raise NotImplementedError ()

	@token.setter
	def token (self, value):
		self.tokenHashed = self.hashToken (value)

async def getStatus ():
	return dict (
		total=await Action.filter().count(),
		)

bp = Blueprint('action')

def actionToDict (token, action):
	return dict (
			token=token,
			name=action.name,
			expires=action.expires.isoformat (),
			usesRemaining=action.usesRemaining,
			extra=action.arguments['extra'],
			)

@bp.route ('/', methods=['POST'])
async def createAction (request):
	session = request.ctx.session
	form = request.json
	name = form.get ('name')

	if name == 'run':
		# Why does a run action exist? When interacting with web services users
		# expect they can share documents using links with other users who may
		# or may not be registered on the platform already. For the underlying
		# UNIX user model however, we cannot for instance grant permissions to
		# a user that does not exist yet.
		# Thus some form of “limited sudo” is required. Why not use
		# passwordless sudo? Because it will not work with Kerberos and
		# limiting the available commands is next to impossible.
		# The command supports python-style format strings, see rpc.py
		arguments = {'command': form['command'], 'user': session.authId, 'extra': form.get ('extra')}
	else:
		raise NotFound ({'status': 'invalid_action'})

	token = randomSecret ()
	action = Action (
			expires=now()+timedelta (seconds=int (form['validFor'])),
			usesRemaining=form['usesRemaining'],
			name=form['name'],
			arguments=arguments,
			)
	action.token = token
	await action.save ()

	return json (actionToDict (token, action))

async def getAction (token):
	action = await Action.get_or_none (tokenHashed=Action.hashToken (token))
	if action is None:
		raise KeyError ()

	# XXX: let a garbage cleaner remove expired ones?
	if now () >= action.expires:
		raise ValueError ('expired')
	if action.usesRemaining is not None:
		if action.usesRemaining <= 0:
			raise ValueError ('expired')
		action.usesRemaining -= 1
		await action.save (update_fields=('usesRemaining', ))

	return action

@bp.route ('/<token:str>', methods=['GET'])
async def fetchAction (request, token):
	session = request.ctx.session

	try:
		action = await getAction (token)
	except KeyError:
		raise NotFound ('not_found')
	except ValueError as e:
		raise NotFound (e.args[0])

	return json (actionToDict (token, action))

__all__ = ['bp']

