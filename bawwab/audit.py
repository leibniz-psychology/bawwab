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

