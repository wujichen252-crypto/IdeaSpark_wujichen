"""
Aliyun OSS client.
Replaces Java: com.ideaspark.project.service.OssService
"""
import logging
import uuid
from typing import Optional

from django.conf import settings

logger = logging.getLogger(__name__)


def get_oss_config() -> dict:
    """Get OSS configuration from Django settings."""
    return {
        'access_key_id': getattr(settings, 'OSS_ACCESS_KEY_ID', ''),
        'access_key_secret': getattr(settings, 'OSS_ACCESS_KEY_SECRET', ''),
        'bucket_name': getattr(settings, 'OSS_BUCKET_NAME', 'ideaspark'),
        'endpoint': getattr(settings, 'OSS_ENDPOINT', 'oss-cn-hangzhou.aliyuncs.com'),
    }


def is_configured() -> bool:
    """Check if OSS is configured."""
    cfg = get_oss_config()
    return bool(cfg['access_key_id'] and cfg['access_key_secret'])


def upload_file(file_obj, filename: str = None) -> dict:
    """
    Upload a file to OSS.
    Returns dict with url, filename, size.
    """
    cfg = get_oss_config()

    if not is_configured():
        # Fallback: return local URL (dev mode)
        return _local_fallback(file_obj, filename)

    try:
        import oss2

        auth = oss2.Auth(cfg['access_key_id'], cfg['access_key_secret'])
        bucket = oss2.Bucket(auth, f'https://{cfg["endpoint"]}', cfg['bucket_name'])

        content = file_obj.read()
        ext = ''
        if filename:
            ext = filename.rsplit('.', 1)[-1] if '.' in filename else ''
        object_key = f'uploads/{uuid.uuid4().hex}.{ext}' if ext else f'uploads/{uuid.uuid4().hex}'

        bucket.put_object(object_key, content)

        url = f'https://{cfg["bucket_name"]}.{cfg["endpoint"]}/{object_key}'

        return {
            'url': url,
            'filename': filename or object_key,
            'size': len(content),
        }
    except Exception as e:
        logger.error(f'OSS upload failed: {e}')
        return _local_fallback(file_obj, filename)


def _local_fallback(file_obj, filename: str = None) -> dict:
    """Fallback for dev mode — return file info without uploading."""
    content = file_obj.read()
    return {
        'url': f'/uploads/{filename or "file"}',
        'filename': filename or 'file',
        'size': len(content),
    }
