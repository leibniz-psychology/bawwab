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
Simple OAuth over aiohttp wrapper

Just one preset for KeyCloak exists and the only mode of operation supported is
authorization, fetching a token and returning user info.

See https://tools.ietf.org/html/rfc6749
"""

import urllib.parse
import aiohttp
from furl import furl

class Oauth2Error (Exception):
	pass

class Oauth2InvalidGrant (Oauth2Error):
	pass

class Oauth2Client:
	__slots__ = ('id', 'secret')

	def __init__ (self, id, secret):
		self.id = id
		self.secret = secret

	async def authorize (self, state, scope=None, redirectUri=None, code=None):
		"""
		Authorize.

		Call me twice. Once without code, and the second time with the same
		arguments AND code. First time returns authorization URL, second
		(token, user) tuple.
		"""
		if code is None:
			# no code yet, first stage
			query = dict (
					response_type='code',
					client_id=self.id,
					redirect_uri=redirectUri,
					scope=scope,
					state=state)
			for k in list (query.keys ()):
				if query[k] is None:
					query.pop (k)
			return self.authUrl.add (query_params=query)
		else:
			async with aiohttp.ClientSession() as session:
				query = dict (grant_type='authorization_code', code=code,
						redirect_uri=redirectUri, client_id=self.id,
						client_secret=self.secret)
				async with session.post (str (self.tokenUrl), data=query) as resp:
					token = await resp.json ()
					if resp.status == 400:
						raise {'invalid_grant': Oauth2InvalidGrant}.get (token['error'], Exception) (token['error'])
					elif resp.status == 200:
						# ok
						pass
					else:
						raise Exception ('unexpected status code')

				headers = {'Authorization': f'{token["token_type"]} {token["access_token"]}'}
				async with session.get (str (self.userinfoUrl), headers=headers) as resp:
					userinfo = await resp.json ()
					if resp.status == 200:
						# ok
						pass
					else:
						raise Exception ('unexpected status code')
			return token, userinfo

	@property
	def authUrl (self):
		raise NotImplementedError ()

	@property
	def tokenUrl (self):
		raise NotImplementedError ()

	@property
	def userinfoUrl (self):
		raise NotImplementedError ()

# XXX: discover URIs via
# `curl -X GET https://sso.leibniz-psychology.org/auth/realms/ZPID/.well-known/uma2-configuration`
class KeycloakClient (Oauth2Client):
	__slots__ = ('baseUrl', 'realm')

	def __init__ (self, id, secret, baseUrl, realm):
		super ().__init__ (id, secret)
		self.baseUrl = furl (baseUrl)
		self.realm = realm

	def _buildUrl (self):
		return self.baseUrl / f'realms/{self.realm}/protocol/openid-connect'

	@property
	def authUrl (self):
		return self._buildUrl () / 'auth'

	@property
	def tokenUrl (self):
		return self._buildUrl () / 'token'

	@property
	def userinfoUrl (self):
		return self._buildUrl () / 'userinfo'

