"""
Interact with processes running on the compute backend
"""

import shlex, json, asyncio
from collections import defaultdict

from sanic import Blueprint
from sanic.log import logger
from sanic.exceptions import Forbidden

import asyncssh

from .user import User
from .action import getAction

bp = Blueprint('rpc')

class WebsocketProcess:
	def __init__ (self, user, token, connection, socket, command):
		self.user = user
		self.token = token
		self.connection = connection
		self.socket = socket
		self.command = command

		self.task = None
		self.process = None

	async def run (self):
		token = self.token
		socket = self.socket

		async def sendOutput (kind, fd):
			try:
				while True:
					l = await fd.read (4096)
					if not l:
						break
					msg = dict (
							method=f'notifyProcessData',
							kind=kind,
							data=l,
							token=token,
							)
					logger.debug (f'sending notify {msg}')
					await socket.send (json.dumps (msg))
			except:
				pass

		async def f (p):
			result = await p.wait ()
			msg = dict (
					method='notifyProcessExit',
					status=result.exit_status,
					signal=result.exit_signal,
					token=token,
					)
			logger.debug (f'process exited {msg}')
			try:
				await socket.send (json.dumps (msg))
			except:
				# client probably went away raising
				# websockets.exceptions.ConnectionClosedOK
				pass
			p.close ()
			await p.wait_closed ()

		self.process = p = await self.connection.create_process (shlex.join (self.command))
		asyncio.create_task (sendOutput ('stdout', p.stdout))
		asyncio.create_task (sendOutput ('stderr', p.stderr))

		self.task = asyncio.create_task (f (p))

async def doRun (ws, session, processes, request):
	def substitute (s):
		return s.format (user=authenticatedUser.name)

	actionToken = request.get ('action', None)
	command = request.get ('command', None)
	token = request.get ('token', None)
	isAction = bool (actionToken)
	isCommand = bool (command)

	if isAction and isCommand:
		return {'status': 'make_up_your_mind'}

	authenticatedUser = None
	try:
		authenticatedAuthId = session.authId
		authenticatedUser = await User.get_or_none (authId=authenticatedAuthId)
	except KeyError:
		return {'status': 'unauthenticated'}

	if isAction:
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
		return {'status': 'forbidden'}
	else:
		try:
			conn = await user.getConnection ()
		except asyncssh.misc.PermissionDenied:
			# we have no real way of telling what went wrong, so we just assume
			# the account is locked.
			return {'status': 'locked_out'}
		p = WebsocketProcess (user, token, conn, ws, command)
		try:
			await p.run ()
			processes[token] = p
			return {'status': 'ok'}
		except Exception as e:
			return {'status': 'error', 'reason': str (e)}

perUserSockets = dict ()

@bp.websocket('/')
async def rpc (request, ws):
	# XXX: this is a dirty workaround since we can’t restore session yet
	session = request.ctx.session
	authenticatedUser = None
	try:
		authenticatedAuthId = session.authId
		authenticatedUser = await User.get_or_none (authId=authenticatedAuthId)

		lastWs = perUserSockets.get (authenticatedUser)
		if lastWs:
			await lastWs.close ()
		perUserSockets[authenticatedUser] = ws
	except KeyError:
		pass

	processes = dict ()
	try:
		while True:
			data = await ws.recv ()
			data = json.loads (data)
			logger.debug (f'got websocket data {data}')

			token = data['token']
			method = data.get ('method')
			if method == 'ping':
				# for testing, copy input to output
				response = dict ()
				response.update (data)
				response['status'] = 'ok'
			elif method == 'run':
				response = await doRun (ws, session, processes, data)
			else:
				response = {'status': 'invalidMethod'}

			response['token'] = token
			logger.debug (f'sending response {response}')
			await ws.send (json.dumps (response))

			# gc processes
			remove = set ()
			for k, v in processes.items ():
				if v.task.done ():
					try:
						await v.task
						remove.add (k)
					except Exception as e:
						logger.error (f'task raised an exception {e}')
			for r in remove:
				del processes[r]
	finally:
		# kill all processes when closing the connection
		# XXX: this is a dirty workaround until session resumption is implemented
		for p in processes.values ():
			logger.info (f'terminating {p} {p.process}')
			p.process.terminate ()
			await p.task
		if authenticatedUser:
			del perUserSockets[authenticatedUser]

