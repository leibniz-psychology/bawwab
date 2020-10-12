"""
Various utility functions
"""

import secrets
from datetime import datetime

import aiohttp, pytz

def randomSecret (n=32):
	alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
	return ''.join (secrets.choice (alphabet) for i in range (n))

def now ():
	return datetime.now (tz=pytz.utc)

