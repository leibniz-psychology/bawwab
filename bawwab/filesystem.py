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
from urllib.parse import unquote_plus

from sanic import Blueprint
from sanic.response import json
from sanic.exceptions import Forbidden, NotFound, ServerError
import asyncssh
from structlog import get_logger

from .user import User, authenticated, TermsNotAccepted

logger = get_logger ()

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

@bp.route ('/<path:path>', methods=['GET', 'DELETE', 'PUT', 'POST'], stream=True)
@authenticated
async def fileGetDelete (request, user, path):
	"""
	Fetch or delete a file
	"""

	path = '/' + unquote_plus (path)
	filename = path.split ('/')[-1]
	request.ctx.logger.info (__name__ + '.fileop', path=path)
	try:
		client = await user.getSftp ()
	except asyncssh.misc.PermissionDenied:
		raise Forbidden ('locked_out')
	except TermsNotAccepted:
		raise Forbidden ('terms_of_service')

	if request.method == 'GET':
		with translateSSHError ():
			s = await client.stat (path)
			if stat.S_ISDIR (s.permissions):
				# return directory listing instead
				entries = await client.readdir (path)
				def toDict (e):
					""" Turn SFTPName into dictionary """
					return dict (name=e.filename, size=e.attrs.size,
							type=e.attrs.type, mtime=e.attrs.mtime)
				return json (list (map (toDict, entries)))
			elif stat.S_ISREG (s.permissions):
				pass
			else:
				raise Forbidden ('invalid_type')

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
		response = await request.respond (
				headers=headers,
				content_type=mimetype)

		async with client.open (path, 'rb') as fd:
			try:
				while True:
					buf = await fd.read (10*1024)
					if not buf:
						break
					await response.send (buf)
			finally:
				await response.eof ()
	elif request.method == 'POST':
		# We cannot use request.json here, since we use
		# stream=True for the request body.
		kind = request.args.get ('kind', None)
		if kind == 'PROPFIND':
			with translateSSHError ():
				follow = int (request.args.get ('follow', 1)) != 0
				if follow:
					s = await client.stat (path)
				else:
					s = await client.lstat (path)
				ret = dict (size=s.size)
				if stat.S_ISLNK (s.permissions):
					s['target'] = await client.readlink (path)
				return json (dict (status='ok', result=ret))
		elif kind == 'MKCOL':
			with translateSSHError ():
				await client.makedirs (path, exist_ok=True)
			return json ({'status': 'ok'})
		elif kind == 'MOVE':
			print ('source', path, request.args.get ('to'))
			with translateSSHError ():
				await client.rename (path, request.args.get ('to'))
			return json ({'status': 'ok'})
		elif kind == 'COPY':
			with translateSSHError ():
				await client.copy ([path], request.args.get ('to'), recurse=True)
			return json ({'status': 'ok'})
		else:
			return json ({'status': 'invalid_method'}, status=405)
	elif request.method == 'PUT':
		with translateSSHError ():
			fd = await client.open (path, 'wb')
			try:
				while True:
					buf = await request.stream.read ()
					if buf is None:
						break
					await fd.write (buf)
			finally:
				await fd.close ()
			return json ({'status': 'ok'})
	elif request.method == 'DELETE':
		with translateSSHError ():
			s = await client.stat (path)
			if stat.S_ISDIR (s.permissions):
				await client.rmtree (path)
			else:
				await client.remove (path)
		return json ({'status': 'ok'})
