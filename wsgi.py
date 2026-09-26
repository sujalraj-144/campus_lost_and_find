"""
CampusFind Production WSGI Entry Point
CampusFind 2.0
"""
import os
import sys

# Ensure project directory is in python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    try:
        from waitress import serve
        print(f"🚀 CampusFind Production Server running on port {port} (Waitress WSGI)")
        serve(app, host="0.0.0.0", port=port)
    except ImportError:
        print(f"CampusFind running on port {port}")
        app.run(host="0.0.0.0", port=port)
