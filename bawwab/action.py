"""
Flexible one (or multiple) time action links

Unicorns. Unicorns everywhere.
"""

import asyncio

from yarl import URL
from sanic import Blueprint
from sanic.response import json
from sanic.log import logger
from sanic.exceptions import NotFound
from tortoise.models import Model
from tortoise import fields

from . import audit
from .auth import GlobalPermission
from .util import now
from .workspace import defaultPermissions, Workspace, WorkspacePermissions
from .tos import requireTos

class Action (Model):
	token = fields.CharField (32, unique=True, description='Token used to trigger this action')
	created = fields.DatetimeField (auto_now_add=True, description='Creation time')
	expires = fields.DatetimeField (null=True, description='Expiry time')
	usesRemaining = fields.IntField (null=True, description='Number of times the link can be used')
	name = fields.CharField (16, description='Action name')
	arguments = fields.JSONField (description='Action function parameters')

bp = Blueprint('action')

@bp.route ('/<token:string>', methods=['POST'])
@requireTos
async def executeAction (request, token):
	config = request.app.config
	session = request.ctx.session

	action = await Action.get_or_none (token=token)
	if action is None:
		raise NotFound ('token_not_found')

	# XXX: let a garbage cleaner remove expired ones?
	if now () >= action.expires:
		raise NotFound ('expired')
	if action.usesRemaining is not None:
		if action.usesRemaining <= 0:
			raise NotFound ('expired')
		action.usesRemaining -= 1
		await action.save ()

	if action.name == 'modifyRolePermissions':
		await GlobalPermission.filter (role=session.role).update (**action.arguments)
	elif action.name == 'grantWorkspacePermissions':
		# Grant permissions to the current role for the workspace in payload.
		# Only *grants* permissions, but never removes them
		workspace = await Workspace.get_or_none (id=action.arguments['workspace_id'])
		if workspace is None:
			raise NotFound ('workspace_not_found')
		wp = await WorkspacePermissions.get_or_none (role=session.role, workspaces__id=action.arguments['workspace_id'])
		if wp is None:
			permissions = defaultPermissions.copy ()
			permissions.update (action.arguments['permissions'])
			wp = WorkspacePermissions (role=session.role, **permissions)
			await wp.save ()
			await workspace.permissions.add (wp)
		else:
			for k, v in action.arguments['permissions'].items ():
				setattr (wp, k, v or getattr (wp, k))
			await wp.save ()
	else:
		raise NotFound ('name_not_found')
		
	return json ({'name': action.name, 'arguments': action.arguments}, status=200)

__all__ = ['bp', 'runFactory']

