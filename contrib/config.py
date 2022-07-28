# example configuration
SERVER_NAME = 'www.example.com/api'

# set these to Falso for production
DEBUG = False
ACCESS_LOG = False

# if deploying behind nginx add a Forwarded header (RFC 7239)
# proxy_set_header Forwarded "for=_hidden;proto=https;by=_fooshyair5;host=$server_name";
# see also https://sanic.readthedocs.io/en/latest/sanic/config.html#proxy-configuration
FORWARDED_SECRET = '_foobar'
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

LDAP_SERVER = 'ldap://ldap.example.com'
LDAP_USER = 'cn=pamtos,ou=system,dc=example,dc=com'
LDAP_PASSWORD = 'changeme'
LDAP_TOS_BASE = 'ou=terms,dc=example,dc=com'

# Commands to create/delete a user.
USERMGR_CREATE_COMMAND = \
    ['usermgr',
    '--keytab', '/path/to/bawwab.keytab',
    '--client-principal', 'bawwab/example',
    '--server-principal', 'usermgrd/example',
    'user', 'create']
USERMGR_DELETE_COMMAND = \
    ['usermgr',
    '--server-principal', 'usermgrd/example@example.com',
    'user', 'delete']

# compute node, just one supported right now
SSH_HOST = 'ssh.example.com'

EMAIL = dict(
    server="mail.example.com",
    port = 587,
    sender = "noreply@example.com",
    password = '123',
    )
