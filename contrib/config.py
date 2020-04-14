# example configuration
SERVER_NAME = 'example.com'
LISTEN = SERVER_NAME
#SOCKET = 'bawwab.socket'
SOCKET_MODE = 0o600
DEBUG = True
FONTAWESOME_PATH = '/path/to/fontawesome'
KNOWN_HOSTS_PATH = '/etc/ssh/ssh_known_hosts'

# oauth config
KEYCLOAK_BASE = 'https://sso.example.com/'
KEYCLOAK_REALM = 'example'
CLIENT_ID = 'example'
CLIENT_SECRET = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
SCOPE = 'example'

DATABASE_URL = 'sqlite://db.sqlite3'
# password encryption key, use Fernet.generate_key() to generate one. If you
# change or lose it, you cannot decrypt ssh passwords any more.
DATABASE_PASSWORD_KEY = b'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

AUDIT_LOG_PATH = 'audit.log'

# location of usermgrd socket
USERMGRD_SOCKET = 'usermgrd.socket'

# compute node, just one supported right now
SSH_HOST = 'ssh.example.com'
# host running conductor
PROXY_HOST = 'user.example.com'

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

