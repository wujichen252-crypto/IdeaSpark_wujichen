"""Security log business logic."""
import math
from datetime import datetime, timezone

from apps.security_logs.models import SecurityLog


def get_security_logs(user_id: int, page: int = 1, size: int = 20) -> dict:
    """GET /api/security/logs"""
    qs = SecurityLog.objects.filter(user_id=user_id).order_by('-created_at')
    total = qs.count()
    total_pages = math.ceil(total / size) if total > 0 else 0
    offset = (page - 1) * size
    logs = qs[offset:offset + size]

    return {
        'logs': [_log_to_dict(log) for log in logs],
        'total': total,
        'page': page,
        'size': size,
        'totalPages': total_pages,
    }


def _log_to_dict(log: SecurityLog) -> dict:
    now = datetime.now(timezone.utc)
    created = log.created_at
    if created and created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    diff = now - created if created else 0
    seconds = diff.total_seconds()
    if seconds < 60:
        time_ago = '刚刚'
    elif seconds < 3600:
        time_ago = f'{int(seconds // 60)}分钟前'
    elif seconds < 86400:
        time_ago = f'{int(seconds // 3600)}小时前'
    else:
        time_ago = f'{int(seconds // 86400)}天前'

    return {
        'id': log.id,
        'actionType': log.action_type or '',
        'description': log.description or '',
        'ipAddress': log.ip_address or '',
        'location': log.location or '',
        'device': log.device or '',
        'status': log.status or '',
        'createdAt': log.created_at.isoformat() if log.created_at else '',
        'timeAgo': time_ago,
    }
