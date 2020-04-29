from sanic import Blueprint
from sanic.response import json

from .session import getStatus as getSession
from .auth import getStatus as getAuth
from .workspace import getStatus as getWorkspace
from .application import getStatus as getApplication

from .util import now

bp = Blueprint ('status')

@bp.route ('/')
async def statusGet (request):
	start = now ()
	status = dict (
			session=await getSession (),
			user=await getAuth (),
			workspace=await getWorkspace (),
			application=await getApplication (),
			)
	# we can abuse this to get a glimpse at database performance
	status['status'] = dict (collecttime=(now()-start).total_seconds ())

	return json (status, status=200)

