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

import stat, mimetypes
from contextlib import contextmanager

from sanic import Blueprint
from sanic.response import stream, json
from sanic.log import logger
from sanic.exceptions import Forbidden, NotFound, ServerError
import asyncssh

from .user import User, authenticated

bp = Blueprint('filesystem')
logger = logger.getChild (__name__)

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

@bp.route ('/<path:path>', methods=['GET', 'STAT', 'DELETE', 'PUT'], stream=True)
@authenticated
async def fileGetDelete (request, user, path):
	"""
	Fetch or delete a file
	"""

	path = '/' + path
	filename = path.split ('/')[-1]
	logger.debug (f'user {user} is requesting file {path}')
	client = await user.getSftp ()

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

		mimetype, encoding = mimetypes.guess_type (filename)
		headers = {
				'Content-Length': f'{s.size}',
				# implement strict security policy, essentially disallowing
				# everything (running scripts, submitting forms, …). Hopefully
				# this make serving content from the same origin secure.
				'Content-Security-Policy': "sandbox; default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
				}
		inlineAllowed = {'image/svg+xml', }
		inline = 'inline' in request.args and mimetype in inlineAllowed
		if not inline:
			headers['Content-Disposition'] = f'attachment; filename="{filename}"'
		return stream (doStream,
				headers=headers,
				content_type=mimetype,
				# disable chunked, because we know the file-size and thus the
				# browser can show progress
				chunked=False)
	elif request.method == 'STAT':
		with translateSSHError ():
			follow = int (request.args.get ('follow', 1)) != 0
			if follow:
				s = await client.stat (path)
			else:
				s = await client.lstat (path)
			ret = dict (size=s.size)
			if stat.S_ISLNK (s.permissions):
				s['target'] = await client.readlink (path)
			return ret
	elif request.method == 'PUT':
		with translateSSHError ():
			fd = await client.open (path, 'wb')
			while True:
				buf = await request.stream.read ()
				if buf is None:
					break
				logger.debug (f'got {len (buf)} bytes')
				await fd.write (buf)
			await fd.close ()
			return json ({'status': 'ok'})
	elif request.method == 'DELETE':
		with translateSSHError ():
			await client.remove (path)

		return json ({'status': 'ok'})

