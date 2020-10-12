from sanic import Blueprint
from sanic.response import json

from .session import getStatus as getSession
from .user import getStatus as getUser

from .util import now

bp = Blueprint ('status')

@bp.route ('/')
async def statusGet (request):
	start = now ()
	status = dict (
			session=await getSession (),
			user=await getUser (),
			)
	# we can abuse this to get a glimpse at database performance
	status['status'] = dict (collecttime=(now()-start).total_seconds ())

	return json (status, status=200)

