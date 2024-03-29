bawwab
======

A web gateway to compute clusters, but really just a glorified SSH client.

(This software is probably not very useful to you. It is heavily branded and
has lots of hard-coded assumptions.)

Depends on trash-cli, mashru3 and borg backup on the target.

Prerequisites
-------------

You’ll need some form of automated user management, which clumsy_ provides, a
working installation of conductor_, an OAuth2-capable sign-on (only KeyCloak_
is supported right now) and a recent OpenSSH (>= 7.0) [#]_. You can use `our
setup`_ as a reference.

A good method to deploy bawwab is using guix_:

.. code:: console

	guix package -p /usr/local/profiles/bawwab -f contrib/bawwab.scm

Then use the systemd service file provided in ``contrib/bawwab.service`` to run it.

.. [#] asyncssh’s .terminate() does not have an effect on prior versions, see
	`channel.py <https://github.com/ronf/asyncssh/blob/f2c73b12a6977ec71b0ae19894e6f5f4022e4450/asyncssh/channel.py#L1259>`__
.. _clumsy: https://github.com/leibniz-psychology/clumsy
.. _guix: https://guix.gnu.org
.. _conductor: https://github.com/leibniz-psychology/conductor
.. _KeyCloak: https://www.keycloak.org/
.. _our setup: https://github.com/leibniz-psychology/psychnotebook-deploy/blob/master/doc/configuration.rst#tiruchirappalli

Development
-----------

bawwab is a Python backend based on sanic_ and tortoise-orm_.

.. _VueJS: https://vuejs.org/
.. _VueJS router: https://router.vuejs.org/
.. _sanic: https://sanic.readthedocs.io/en/latest/
.. _tortoise-orm: https://tortoise-orm.readthedocs.io/en/latest/

To get started with the development you need all the prerequisites listed
above. Additionally you must configure your local Guix to use the channel
guix-zpid_. Then you can set up a development environment using

.. code:: console

	guix shell -L contrib/guix -D bawwab nss-certs openssl
	virtualenv --system-site-packages -p python3 sandbox
	source sandbox/bin/activate
	python setup.py develop

configure it using the example in ``contrib/config.py`` and run bawwab directly
from that directory

.. code:: console

	# Only needed, if the realm is not configured system-wide
	export KRB5_CONFIG=contrib/krb5.conf
	export BAWWAB_SETTINGS=/path/to/config.py
	sanic --debug bawwab.app:app

The backend will pick up changes automatically when in debug mode.

.. _guix-zpid: https://github.com/leibniz-psychology/guix-zpid

To ease development it is also possible to override the logged in user,
removing the need for an OAuth server. You can enable it by adding the
following lines to your ``config.py``:

.. code:: python

	DEBUG = True
	DEBUG_USER_OVERRIDE = {"sub":"173d4e4b-a862-4570-a3a9-87f4785ef4eb",
		"email_verified":True,
		"name":"Testuser",
		"preferred_username":"testuser",
		"given_name":"Testuser",
		"family_name":"Test",
		"email":"testuser@invalid"}

