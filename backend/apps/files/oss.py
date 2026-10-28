"""
Aliyun OSS client.
Replaces Java: com.ideaspark.project.service.OssService
"""
import logging
import uuid
from pathlib import Path

from django.conf import settings

logger = logging.getLogger(__name__)


def get_oss_config() -> dict:
    """Get OSS configuration from Django settings.

    注意：settings 里的变量名是 OSS_BUCKET（不是 OSS_BUCKET_NAME），
    endpoint 允许带协议头，这里统一去掉，避免拼出 https://https://... 的坏地址。
    """
    endpoint = getattr(settings, 'OSS_ENDPOINT', 'oss-cn-hangzhou.aliyuncs.com') or ''
    endpoint = endpoint.replace('https://', '').replace('http://', '').rstrip('/')
    return {
        'access_key_id': getattr(settings, 'OSS_ACCESS_KEY_ID', ''),
        'access_key_secret': getattr(settings, 'OSS_ACCESS_KEY_SECRET', ''),
        'bucket_name': getattr(settings, 'OSS_BUCKET', 'ideaspark'),
        'endpoint': endpoint,
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
    """OSS 未配置时的兜底：把文件真实落盘到 MEDIA_ROOT，并返回可访问的 /media/ 地址。

    旧实现只拼了一个 /uploads/<原文件名> 的假地址，而没有任何服务托管这个路径，
    于是「上传成功、保存成功、图片却 404」——头像保存后不显示正是这个原因。
    """
    content = file_obj.read()
    ext = filename.rsplit('.', 1)[-1].lower() if filename and '.' in filename else ''
    stored_name = f'{uuid.uuid4().hex}.{ext}' if ext else uuid.uuid4().hex

    target_dir = Path(settings.MEDIA_ROOT) / 'uploads'
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / stored_name).write_bytes(content)

    return {
        'url': f'{settings.MEDIA_URL.rstrip("/")}/uploads/{stored_name}',
        'filename': filename or stored_name,
        'size': len(content),
    }
