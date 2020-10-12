"""
CSP reporting, just logging for now
"""

from sanic import Blueprint
from sanic.log import logger
from sanic.response import html, json

bp = Blueprint ('csp')

@bp.route ('/', methods=['POST'])
async def report (request):
	logger.error (f'CSP report: {request.json}')
	return json ({})

