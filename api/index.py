import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import app

class VercelPathMiddleware:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        raw_uri = environ.get('REQUEST_URI') or environ.get('x-matched-path')
        if raw_uri and (environ.get('PATH_INFO', '').endswith('/api/index.py') or environ.get('PATH_INFO') == '/api'):
            environ['PATH_INFO'] = raw_uri.split('?')[0]
        return self.wsgi_app(environ, start_response)

app.wsgi_app = VercelPathMiddleware(app.wsgi_app)
