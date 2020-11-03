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
Audit logs
"""

import json, os
from datetime import datetime

from sanic import Blueprint

from .util import now

bp = Blueprint('audit')
logfile = None
fd = None

class StrJsonEncoder (json.JSONEncoder):
    """ JSON encoder that turns unknown classes into a string and thus never
    fails """
    def default (self, obj):
        if isinstance (obj, datetime):
            return obj.isoformat ()

        # make sure serialization always succeeds
        try:
            return json.JSONEncoder.default(self, obj)
        except TypeError:
            return str (obj)

@bp.listener('before_server_start')
async def setup (app, loop):
	global logfile

	logfile = app.config.AUDIT_LOG_PATH

def log (name, **data):
	global fd

	if not logfile:
		return

	if not fd or not os.path.exists (logfile):
		if fd:
			fd.flush ()
			fd.close ()
		fd = open (logfile, 'a')

	o = dict (
		time=now(),
		event=name,
		data=data,
		)
	json.dump (o, fd, cls=StrJsonEncoder)
	fd.write ('\n')
	fd.flush ()

__all__ = ['log']

