import subprocess, shutil, os
from setuptools import setup, Command
from distutils.command.build import build

build.sub_commands.insert (0, ('esbuild', lambda self: True))

class Esbuild (Command):
	user_options = [('debug', None, 'Create debug build')]

	def initialize_options(self):
		self.debug = False

	def finalize_options (self):
		pass

	def run(self):
		shutil.copy ('bawwab/client/app.html', 'bawwab/assets')

		node_env = 'development' if self.debug else 'production'
		extraOpts = []
		if not self.debug:
			extraOpts = [
					'--minify',
					# this effectively removes these calls when minifying
					'--pure:console.debug', '--pure:console.log',
					]
		subprocess.run (['esbuild', 'bawwab/client/app.js',
				'--bundle',
				'--sourcemap',
				'--loader:.png=file',
				'--loader:.jpg=file',
				'--loader:.svg=file',
				'--loader:.md=text',
				'--loader:.html=text',
				# We support:
				# Chrome: Last three versions. No LTS release.
				# Edge: Last three versions.
				# Firefox: Latest ESR release.
				# Safari: Last three versions.
				'--target=chrome87,firefox78,safari12,edge87',
				f'--define:process.env.NODE_ENV=\"{node_env}\"',
				'--define:__VUE_OPTIONS_API__=true',
				'--define:__VUE_PROD_DEVTOOLS__=false',
				'--outdir=bawwab/assets/'] + extraOpts, check=True)

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
            'bawwab = bawwab.run:main',
            'bawwab-migrate = bawwab.run:migrate',
            'bawwab-loganalyze = bawwab.run:loganalyze',
            ],
    },
    package_data={
            'bawwab': ['assets/*'],
    },
    classifiers = [
        'License :: OSI Approved :: MIT License',
        'Development Status :: 4 - Beta',
        'Operating System :: POSIX :: Linux',
        'Programming Language :: Python :: 3',
        ],
	cmdclass={'esbuild': Esbuild},
)
