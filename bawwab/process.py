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
Interact with processes running on the compute backend
"""

import shlex, json, asyncio, traceback
from collections import defaultdict
from functools import partial
from itertools import chain

from sanic import Blueprint
from sanic.log import logger
from sanic.response import json as jsonResponse
from sanic.exceptions import Forbidden, InvalidUsage, ServerError

import asyncssh

from .user import User, authenticated
from .action import getAction
from .util import randomSecret

logger = logger.getChild (__name__)

bp = Blueprint('process')

# all sockets for a single user, so we can broadcast messages
perUserSockets = defaultdict (list)
# all sockets for a single user, so we can restore his session
perUserProcesses = defaultdict (dict)

class WebsocketProcess:
	__slots__ = ('token', 'user', 'broadcast', 'command',
			'messages', 'task', 'process', 'extraData')

	def __init__ (self, token, user, broadcastFunc, command, extraData):
		self.token = token
		self.user = user
		self.broadcast = broadcastFunc
		self.command = command
		self.extraData = extraData

		# message buffer, for session restore replay
		self.messages = []
		self.task = None
		self.process = None

	def __repr__ (self):
		return f'<WebsocketProcess {self.user!r} {self.command}, {len (self.messages)} messages>'

	async def send (self, msg):
		self.messages.append (msg)
		logger.debug (f'sending message {msg}')
		await self.broadcast (msg)

	async def run (self):
		token = self.token

		async def sendOutput (kind, fd):
			try:
				while True:
					l = await fd.read (10*1024)
					if not l:
						break
					msg = dict (
							notify=f'processData',
							kind=kind,
							data=l,
							token=token,
							)
					await self.send (msg)
			except:
				pass

		async def f (p):
			result = await p.wait ()
			msg = dict (
					notify='processExit',
					status=result.exit_status,
					signal=result.exit_signal,
					token=token,
					)
			await self.send (msg)

			p.close ()
			await p.wait_closed ()

		msg = dict (
				notify='processStart',
				token=token,
				command=self.command,
				extraData=self.extraData,
				)
		await self.send (msg)
		self.process = p = await self.user.getChannel ('create_process', shlex.join (self.command))
		asyncio.create_task (sendOutput ('stdout', p.stdout))
		asyncio.create_task (sendOutput ('stderr', p.stderr))

		self.task = asyncio.create_task (f (p))

async def getStatus ():
	replayBufferMessages = 0
	for procs in perUserProcesses.values ():
		for p in procs.values ():
			replayBufferMessages += len (p.messages)

	return dict (
		users=len (perUserSockets),
		sockets=sum (map (len, perUserSockets.values ())),
		processes=sum (map (len, perUserProcesses.values ())),
		replayBufferMessages=replayBufferMessages,
		)

@bp.route ('/', methods=['POST'])
@authenticated
async def processRun (request, authenticatedUser):
	def substitute (s):
		return s.format (user=authenticatedUser.name)

	reqData = request.json
	actionToken = reqData.get ('action', None)
	command = reqData.get ('command', None)
	# client-defined extra data, forwarded to start notification
	extraData = reqData.get ('extraData', None)
	isAction = bool (actionToken)
	isCommand = bool (command)

	user = None
	if isAction and isCommand:
		# cannot have both at the same time
		raise InvalidUsage ('make_up_your_mind')
	elif isAction:
		action = await getAction (actionToken)
		args = action.arguments
		authId = args['user']
		user = await User.get_or_none (authId=authId)
		command = list (map (substitute, args['command']))
	elif isCommand:
		# use current user instead
		user = authenticatedUser

	if not user:
		# not connected to any authorized user
		raise Forbidden ('forbidden')
	else:
		processes = perUserProcesses[authenticatedUser]

		while True:
			token = randomSecret ()
			if token not in processes:
				break

		p = WebsocketProcess (token, authenticatedUser,
				broadcastFunc=partial (broadcast, authenticatedUser),
				command=command,
				extraData=extraData)
		try:
			await p.run ()
			processes[token] = p
			return jsonResponse ({'status': 'ok', 'token': token})
		except asyncssh.misc.PermissionDenied:
			raise Forbidden ('locked_out')

@bp.route ('/<token>', methods=['DELETE'])
async def processKill (request, token):
	pass

async def broadcast (recipient, msg):
	if len (perUserSockets[recipient]) > 0:
		await asyncio.wait ([socket.send (json.dumps (msg))
				for socket in perUserSockets[recipient]])
	else:
		logger.debug (f'no sockets for {recipient}')

@bp.websocket('/notify')
@authenticated
async def processNotify (request, user, ws):
	# first send the process state
	processes = perUserProcesses[user]
	for k, p in processes.items ():
		# do not replay if dead
		if p.process.is_closing ():
			continue
		logger.debug (f'replaying messages for {p}')
		# must be in order
		for msg in p.messages:
			await ws.send (json.dumps (msg))

	# then add the socket to broadcast
	perUserSockets[user].append (ws)

	try:
		while True:
			# we don’t support any requests and discard any data sent
			data = await ws.recv ()
	finally:
		l = perUserSockets[user]
		l.remove (ws)
		if len (l) == 0:
			perUserSockets.pop (user)

async def cleanupJob ():
	""" Cleanup dead processes from the perUserProcess store """

	while True:
		remove = set ()
		for processes in perUserProcesses.values ():
			for k, v in processes.items ():
				if v.task.done ():
					try:
						await v.task
						remove.add (k)
					except Exception as e:
						logger.error (f'task raised an exception {e}')
			for r in remove:
				del processes[r]
		await asyncio.sleep (10)

cleanupThread = None

@bp.listener('before_server_start')
async def setup (app, loop):
	global cleanupThread

	cleanupThread = asyncio.ensure_future (cleanupJob ())

@bp.listener('after_server_stop')
async def teardown (app, loop):
	if cleanupThread:
		cleanupThread.cancel ()
		try:
			await cleanupThread
		except asyncio.CancelledError:
			pass


