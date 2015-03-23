#! /usr/local/bin/python

import pycurl
import os, sys
from urllib import urlencode

c = pycurl.Curl()
c.setopt(c.URL, 'http://localhost:8000/data') #TODO: choose server location

post_data = {'gps': sys.argv[1], 'x': sys.argv[2], 'y': sys.argv[3], 'z': sys.argv[4] }
postfields = urlencode(post_data)
c.setopt(c.POSTFIELDS, postfields)

c.perform()
c.close()
