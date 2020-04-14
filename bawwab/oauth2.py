"""
Simple OAuth over aiohttp wrapper

Just one preset for KeyCloak exists and the only mode of operation supported is
authorization, fetching a token and returning user info.

See https://tools.ietf.org/html/rfc6749
"""

import aiohttp
from yarl import URL

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
			return self.authUrl.update_query (query)
		else:
			async with aiohttp.ClientSession() as session:
				query = dict (grant_type='authorization_code', code=code,
						redirect_uri=redirectUri, client_id=self.id,
						client_secret=self.secret)
				async with session.post (self.tokenUrl, data=query) as resp:
					token = await resp.json ()
					if resp.status == 400:
						raise {'invalid_grant': Oauth2InvalidGrant}.get (token['error'], Exception) (token['error'])
					elif resp.status == 200:
						# ok
						pass
					else:
						raise Exception ('unexpected status code')

				headers = {'Authorization': f'{token["token_type"]} {token["access_token"]}'}
				async with session.get (self.userinfoUrl, headers=headers) as resp:
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
		self.baseUrl = URL (baseUrl)
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

