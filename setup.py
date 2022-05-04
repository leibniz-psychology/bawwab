from setuptools import setup

setup(
    name='bawwab',
    version='0.1',
    author='Lars-Dominik Braun',
    author_email='ldb@leibniz-psychology.org',
    url='https://github.com/leibniz-psychology/bawwab',
    packages=['bawwab'],
    description='A web gateway to compute clusters.',
    long_description=open('README.rst').read(),
    long_description_content_type='text/x-rst',
    install_requires=[
        'sanic',
        # XXX: version 4 is currently broken, blacklist it
        'aiohttp<4',
        'pytz',
        'furl',
        'asyncssh',
        'tortoise-orm>=0.16.7',
        'aiosqlite',
        'cryptography',
		# for migrations
		'pypika',
		'pyyaml',
		'aiosmtplib',
		'bonsai',
		# Same library sanic is using.
		'websockets',
		'structlog',
    ],
    python_requires='>=3.7',
    entry_points={
    'console_scripts': [
            'bawwab-migrate = bawwab.run:migrate',
            'bawwab-loganalyze = bawwab.run:loganalyze',
            'bawwab-passwd = bawwab.run:passwd',
            ],
    },
    classifiers = [
        'License :: OSI Approved :: MIT License',
        'Development Status :: 4 - Beta',
        'Operating System :: POSIX :: Linux',
        'Programming Language :: Python :: 3',
        ],
)
