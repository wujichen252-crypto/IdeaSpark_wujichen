"""Gunicorn production configuration for IdeaSpark Django backend."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Socket binding
bind = f"0.0.0.0:{os.getenv('SERVER_PORT', '9001')}"

# Worker processes — recommended: (2 * CPU cores) + 1
workers = int(os.getenv('GUNICORN_WORKERS', '4'))
worker_class = 'sync'
# For async views (AI chat streaming): use 'uvicorn.workers.UvicornWorker'
# worker_class = 'uvicorn.workers.UvicornWorker'

# Timeouts
timeout = int(os.getenv('GUNICORN_TIMEOUT', '120'))
graceful_timeout = 30
keepalive = 5

# Logging
accesslog = str(BASE_DIR / 'logs' / 'gunicorn_access.log')
errorlog = str(BASE_DIR / 'logs' / 'gunicorn_error.log')
loglevel = os.getenv('LOG_LEVEL', 'info').lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = 'ideaspark_django'
pidfile = str(BASE_DIR / 'ideaspark.pid')

# Restart workers after serving N requests (memory leak mitigation)
max_requests = int(os.getenv('GUNICORN_MAX_REQUESTS', '10000'))
max_requests_jitter = int(os.getenv('GUNICORN_MAX_REQUESTS_JITTER', '1000'))

# Daemon
daemon = False  # Managed by start-server.sh via nohup

# Server mechanics
worker_connections = 1000
preload_app = True
