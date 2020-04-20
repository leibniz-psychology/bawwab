# example configuration
#SERVER_NAME = 'https://www.example.com'
LISTEN = 'localhost:8000'
#SOCKET = 'bawwab.socket'
SOCKET_MODE = 0o600

# set these to Falso for production
DEBUG = False
ACCESS_LOG = False

# if deploying behind nginx add a Forwarded header (RFC 7239)
# proxy_set_header Forwarded "for=_hidden;proto=https;by=_fooshyair5;host=$server_name";
# see also https://sanic.readthedocs.io/en/latest/sanic/config.html#proxy-configuration
FORWARDED_SECRET = '_foobar'
FONTAWESOME_PATH = '/path/to/fontawesome'
KNOWN_HOSTS_PATH = '/etc/ssh/ssh_known_hosts'

# oauth config
KEYCLOAK_BASE = 'https://sso.example.com/'
KEYCLOAK_REALM = 'example'
CLIENT_ID = 'example'
CLIENT_SECRET = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
SCOPE = 'example'

DATABASE_URL = 'sqlite://db.sqlite3'
# password encryption key, use
# > from cryptography.fernet import Fernet
# > Fernet.generate_key()
# to generate one, see https://cryptography.io/en/latest/fernet/. If you change
# or lose it, you cannot decrypt ssh passwords any more.
DATABASE_PASSWORD_KEY = b'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

AUDIT_LOG_PATH = 'audit.log'

# location of usermgrd socket
USERMGRD_SOCKET = 'usermgrd.socket'

# compute node, just one supported right now
SSH_HOST = 'ssh.example.com'
# URL running conductor, python format string, which expands variables key and user
PROXY_HOST = 'https://{key}.{user}.user.example.com'

# default permissions for unauthenticated roles
ANON_PERMISSIONS = dict (
	canCreateWorkspace=False,
	canUpdateTos=False,
	canRegister=False,
	)
# permissions for default authenticated role
AUTH_PERMISSIONS = dict (
	canCreateWorkspace=True,
	canUpdateTos=False,
	canRegister=False,
	)

