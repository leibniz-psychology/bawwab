"""
Various utility functions
"""

import secrets
from datetime import datetime

import aiohttp, pytz

def randomSecret (n=32):
	alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
	return ''.join (secrets.choice (alphabet) for i in range (n))

def now ():
	return datetime.now (tz=pytz.utc)

### snip ###
# copied from https://github.com/PromyLOPh/crocoite/blob/master/crocoite/irc.py

# see https://arxiv.org/html/0901.4016 on how to build proquints (human
# pronouncable unique ids)
toConsonant = 'bdfghjklmnprstvz'
toVowel = 'aiou'
quintBits = 16

def u16ToQuint (v):
    """ Transform a 16 bit unsigned integer into a single quint """
    assert 0 <= v < 2**quintBits
    # quints are “big-endian”
    return ''.join ([
            toConsonant[(v>>(4+2+4+2))&0xf],
            toVowel[(v>>(4+2+4))&0x3],
            toConsonant[(v>>(4+2))&0xf],
            toVowel[(v>>4)&0x3],
            toConsonant[(v>>0)&0xf],
            ])

def uintToQuint (v, length=2):
    """ Turn any integer into a proquint with fixed length """
    assert 0 <= v < 2**(length*quintBits)

    return '-'.join (reversed ([u16ToQuint ((v>>(x*quintBits))&0xffff) for x in range (length)]))

def humanUid (length=4):
    """ Create random, human-pronouncable uid """
    return uintToQuint (secrets.randbits (length*quintBits), length)
### snap ###

