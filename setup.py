import subprocess
from setuptools import setup, Command
from distutils.command.build import build

build.sub_commands.insert (0, ('esbuild', lambda self: True))

class Esbuild (Command):
	user_options = []

	def initialize_options(self):
		pass

	def finalize_options (self):
		pass

	def run(self):
		subprocess.run (['esbuild', 'bawwab/client/app.js', '--bundle',
				'--sourcemap', '--minify',
				'--target=chrome58,firefox57,safari11,edge16',
				'--outdir=bawwab/assets/'])

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
    ],
    python_requires='>=3.7',
    entry_points={
    'console_scripts': [
            'bawwab = bawwab.run:main',
            'bawwab-migrate = bawwab.run:migrate',
            ],
    },
    package_data={
            'bawwab': ['assets/*', 'assets/img/*'],
    },
    classifiers = [
        'License :: OSI Approved :: MIT License',
        'Development Status :: 4 - Beta',
        'Operating System :: POSIX :: Linux',
        'Programming Language :: Python :: 3',
        ],
	cmdclass={'esbuild': Esbuild},
)
