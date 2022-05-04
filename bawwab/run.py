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

import sys, sqlite3, inspect, argparse, json

def migrate ():
	prefix = 'migrateDo'
	available = dict ()
	for k, v in inspect.getmembers (sys.modules[__name__], inspect.isfunction):
		if k.startswith (prefix):
			available[k[len(prefix):].lower ()] = v

	parser = argparse.ArgumentParser(description='Database migration.')
	parser.add_argument('database', help='Database path')
	parser.add_argument('apply', choices=available.keys (), help='Named migration to apply')

	args = parser.parse_args()

	db = sqlite3.connect (args.database)
	available[args.apply] (db)

def loganalyze ():
	parser = argparse.ArgumentParser(description='Analyze logfiles.')
	parser.add_argument('--process', '-p', help='Get stdout/stderr for process token')
	parser.add_argument('--failed', '-f', action='store_true', help='Get failed processes only')

	args = parser.parse_args()

	processes = {}

	for l in sys.stdin:
		try:
			o = json.loads (l)
		except Exception:
			# ignore non-json log lines
			continue

		if o['event'] == __package__ + '.process.message':
			procMsg = o['msg']
			token = o['token']

			if args.process:
				# single process dump mode
				if token == args.process:
					kind = procMsg['notify']
					if kind == 'processData':
						getattr (sys, procMsg['kind']).write (procMsg['data'])
			else:
				if procMsg['notify'] == 'processStart':
					processes[token] = dict (user=o['user'],
							command=o['command'],
							start=o['timestamp'],
							token=token)
				elif procMsg['notify'] == 'processExit':
					p = processes.get (token)
					if not p:
						continue
					p['end'] = o['timestamp']
					p['exitCode'] = procMsg['status']

					if (not args.process and not args.failed) or \
							(args.process and args.process == token) or \
							(args.failed and p['exitCode'] != 0):
						json.dump (p, sys.stdout)
						sys.stdout.write ('\n')

def passwd ():
	""" Change UNIX password for a user.

	This is required if the password changed on the backend
	"""

	import asyncio
	from getpass import getpass
	from tortoise import Tortoise
	from sanic.config import Config
	from .user import User

	parser = argparse.ArgumentParser(description='Change user password.')
	parser.add_argument('user', help='Unix username of user')
	args = parser.parse_args()

	config = Config ()
	config.from_envvar('BAWWAB_SETTINGS')
	User.setup (config.DATABASE_PASSWORD_KEY)

	async def run ():
		await Tortoise.init(db_url=config.DATABASE_URL,
				modules={'models': ['bawwab.user']})
		try:
			user = await User.get_or_none (name=args.user)
			pass1 = getpass ('Enter new password: ').strip ()
			pass2 = getpass ('Re-enter new password: ').strip ()
			if pass1 != pass2:
				print ('Passwords do not match', file=sys.stderr)
				return 1
			user.password = pass1.strip ()
			await user.save ()
			return 0
		finally:
			await Tortoise.close_connections ()

	return asyncio.run (run ())

