from setuptools import setup

setup(
    name='bawwab',
    version='0.1',
    author='Lars-Dominik Braun',
    author_email='ldb@leibniz-psychology.org',
    url='https://github.com/leibniz-psychology/bawwab',
    packages=['bawwab'],
    #license='LICENSE.txt',
    description='A web gateway to compute clusters.',
    long_description=open('README.rst').read(),
    long_description_content_type='text/x-rst',
    install_requires=[
        'sanic',
        # XXX: version 4 is currently broken, blacklist it
        'aiohttp<4',
        'pytz',
        'yarl',
        'asyncssh',
        'tortoise-orm',
        'aiosqlite',
        'cryptography',
    ],
    python_requires='>=3.7',
    entry_points={
    'console_scripts': [
            'bawwab = bawwab.run:main',
            ],
    },
    package_data={
            'bawwab': ['assets/*', 'assets/img/*'],
    },
)
