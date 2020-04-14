from functools import wraps

from sanic import Blueprint
from sanic.exceptions import Forbidden, NotFound
from sanic.response import json
from sanic.log import logger

from tortoise.models import Model
from tortoise import fields

class TermsOfService (Model):
	created = fields.DatetimeField (auto_now_add=True, description='Creation time')
	enforce = fields.DatetimeField (null=True, description='When accepting the terms becomes mandatory')
	content = fields.TextField (description='The terms.')

	def toPublicDict (self):
		return dict (
			id=self.id,
			created=self.created,
			enforce=self.enforce,
			content=self.content,
			)

def requireTos (f):
	""" Require accepting terms of service """
	@wraps (f)
	async def wrapped (*args, **kwargs):
		request = args[0]
		session = request.ctx.session
		user = session.user

		if await TermsOfService.filter ().count () > 0:
			await user.fetch_related ('acceptedTermsOfService')
			if user.acceptedTermsOfService is None:
				raise Forbidden ('no_tos')

			# XXX: implement
			newTos = await TermsOfService.filter (created__gt=user.acceptedTermsOfService.created, enforce__lt=now ()).order_by ('-created').first ()
			if newTos:
				raise Forbidden ('new_tos')

		return await f (*args, **kwargs)
	return wrapped

from .util import now
from .auth import requirePermission

bp = Blueprint('tos')

@bp.route ('/')
async def getCurrent (request):
	tos = await TermsOfService.filter ().order_by ('-created').first ()
	if tos:
		return json (tos.toPublicDict (), status=200)
	else:
		raise NotFound ('not_found')

@bp.route ('/', methods=['POST'])
@requirePermission ('canUpdateTos')
async def update (request):
	form = request.json
	try:
		tos = TermsOfService (content=form.get ('content'), enforce=form.get ('enforce'))
	except ValueError:
		return json ({'validation'}, status=400)

	await tos.save ()

	return json (tos.toPublicDict (), status=200)

