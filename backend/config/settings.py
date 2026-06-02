"""
IdeaSpark Django backend settings.
Maps to ideaspark_backend/src/main/resources/application.yml
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env')

# ── Security ──────────────────────────────────────────────
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'ideaspark-dev-secret-key-change-in-production')
DEBUG = os.getenv('DJANGO_DEBUG', 'false').lower() == 'true'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,47.108.232.238').split(',')

# ── Application ───────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'ninja',
    'django_prometheus',
    # Local apps
    'apps.accounts',
    'apps.projects',
    'apps.teams',
    'apps.community',
    'apps.ai',
    'apps.notifications',
    'apps.files',
    'apps.security_logs',
]

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Custom
    'common.middleware.RequestLogMiddleware',
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ── Database (MySQL) ──────────────────────────────────────
# Match Spring Boot DB config from application.yml
# Override via backend/.env or environment variables
DB_HOST = os.getenv('DB_HOST', '47.108.232.238')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_NAME = os.getenv('DB_NAME', 'ideaspark')
DB_USER = os.getenv('DB_USERNAME', 'ideaspark')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')

# ── Monkey-patch: support MySQL 5.7 (Django 4.2+ requires MySQL 8) ──
import django.db.backends.base.base as django_base_base
from django.db.utils import NotSupportedError
_original_check = django_base_base.BaseDatabaseWrapper.check_database_version_supported
def _patched_check(self):
    try:
        _original_check(self)
    except NotSupportedError:
        pass
django_base_base.BaseDatabaseWrapper.check_database_version_supported = _patched_check

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
        'OPTIONS': {
            'charset': 'utf8mb4',
            'connect_timeout': int(os.getenv('DB_CONN_TIMEOUT', '30')),
        },
        # HikariCP equivalent pool settings
        'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '600')),
    }
}

# ── Email (SMTP) ──────────────────────────────────────────
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.qq.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '465'))
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'true').lower() == 'true'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

# ── Password validation ───────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
]

# ── Internationalization ──────────────────────────────────
LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True

# ── Static files ──────────────────────────────────────────
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Disable migrations for unmanaged models ──────────────
MIGRATION_MODULES = {
    'accounts': None,
    'projects': None,
    'teams': None,
    'community': None,
    'ai': None,
    'notifications': None,
    'files': None,
    'security_logs': None,
}

# ── CORS (matches Spring Boot WebConfig) ──────────────────
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,http://47.108.232.238:9002'
).split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
CORS_ALLOW_HEADERS = ['*']

# ── File upload ───────────────────────────────────────────
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# ── Logging (matches Spring Boot log config) ──────────────
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '%(asctime)s [%(threadName)s] %(levelname)-5s %(name)s - %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.getenv('LOG_FILE_PATH', BASE_DIR / 'logs/ideaspark.log'),
            'maxBytes': 100 * 1024 * 1024,
            'backupCount': 30,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': LOG_LEVEL,
    },
    'loggers': {
        'django': {'level': 'INFO', 'handlers': ['console', 'file'], 'propagate': False},
        'apps': {'level': os.getenv('APP_LOG_LEVEL', 'DEBUG').upper(), 'handlers': ['console', 'file'], 'propagate': False},
    },
}

# ── JWT (matches Spring Boot jwt.* config) ────────────────
JWT_SECRET = os.getenv('JWT_SECRET', 'ideaspark_secret_key_default_for_dev_12345678901234567890')
JWT_EXPIRE_SECONDS = int(os.getenv('JWT_EXPIRE_SECONDS', '604800'))  # 7 days
JWT_REFRESH_EXPIRE_SECONDS = int(os.getenv('JWT_REFRESH_EXPIRE_SECONDS', '2592000'))  # 30 days
JWT_ISSUER = os.getenv('JWT_ISSUER', 'ideaspark')

# ── OSS / Aliyun (matches Spring Boot oss.* config) ───────
OSS_ENABLED = os.getenv('OSS_ENABLED', 'true').lower() == 'true'
OSS_ENDPOINT = os.getenv('OSS_ENDPOINT', 'https://oss-cn-beijing.aliyuncs.com')
OSS_ACCESS_KEY_ID = os.getenv('OSS_ACCESS_KEY_ID', '')
OSS_ACCESS_KEY_SECRET = os.getenv('OSS_ACCESS_KEY_SECRET', '')
OSS_BUCKET = os.getenv('OSS_BUCKET', 'ideaspark')
OSS_BASE_DIR = os.getenv('OSS_BASE_DIR', 'uploads')

# ── DeepSeek AI (matches Spring Boot deepseek.* config) ───
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
DEEPSEEK_BASE_URL = os.getenv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com')
DEEPSEEK_MODEL = os.getenv('DEEPSEEK_MODEL', 'deepseek-chat')
DEEPSEEK_TEMPERATURE = float(os.getenv('DEEPSEEK_TEMPERATURE', '0.7'))
DEEPSEEK_MAX_TOKENS = int(os.getenv('DEEPSEEK_MAX_TOKENS', '2000'))
DEEPSEEK_CONNECT_TIMEOUT = int(os.getenv('DEEPSEEK_CONNECT_TIMEOUT', '30000'))
DEEPSEEK_READ_TIMEOUT = int(os.getenv('DEEPSEEK_READ_TIMEOUT', '60000'))

# ── Frontend URL (for password reset links) ───────────────
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
