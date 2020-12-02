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
File I/O through SSH
"""

import stat
from contextlib import contextmanager

from sanic import Blueprint
from sanic.response import stream, json
from sanic.log import logger
from sanic.exceptions import Forbidden, NotFound, ServerError
import asyncssh

from .user import User

bp = Blueprint('filesystem')

@contextmanager
def translateSSHError ():
	try:
		yield
	except asyncssh.sftp.SFTPNoSuchFile:
		raise NotFound ('notfound')
	except asyncssh.sftp.SFTPPermissionDenied:
		raise Forbidden ('permissiondenied')
	except asyncssh.sftp.SFTPFailure:
		raise ServerError ('error')

@bp.route ('/<path:path>', methods=['GET', 'DELETE'])
async def fileGetDelete (request, path):
	"""
	Fetch or delete a file
	"""

	session = request.ctx.session
	try:
		authenticatedAuthId = session.authId
	except KeyError:
		raise Forbidden ('unauthenticated')
	user = await User.get_or_none (authId=authenticatedAuthId)
	if user is None:
		raise Forbidden ('unauthenticated')

	path = '/' + path
	filename = path.split ('/')[-1]
	logger.debug (f'user {user} is requesting file {path}')
	conn = await user.getConnection ()
	client = await conn.start_sftp_client ()

	if request.method == 'GET':
		with translateSSHError ():
			s = await client.stat (path)
			if stat.S_ISDIR (s.permissions):
				# return directory listing instead
				entries = await client.readdir (path)
				def toDict (e):
					""" Turn SFTPName into dictionary """
					return {'name': e.filename, 'size': e.attrs.size}
				return json (list (map (toDict, entries)))
			elif stat.S_ISREG (s.permissions):
				fd = await client.open (path, 'rb')
			else:
				raise Forbidden ('invalid_type')

		async def doStream (response):
			while True:
				buf = await fd.read (10*1024)
				if not buf:
					break
				await response.write (buf)
			await fd.close ()
			client.exit ()
			await client.wait_closed ()

		return stream (doStream,
				headers={
				'Content-Disposition': f'attachment; filename="{filename}"',
				'Content-Length': f'{s.size}',
				},
				content_type='application/octet-stream',
				# disable chunked, because we know the file-size and thus the
				# browser can show progress
				chunked=False)
	elif request.method == 'DELETE':
		with translateSSHError ():
			await client.remove (path)

		return json ({'status': 'ok'})

