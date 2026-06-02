"""Notification business logic service."""
import math
from datetime import datetime, timezone
from typing import Optional

from django.db import transaction

from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.notifications.schemas import CreateNotificationIn
from common.exceptions import NotFoundException


def get_user_notifications(user_id: int, type_filter: Optional[str] = None,
                            page: int = 1, size: int = 20) -> dict:
    """GET /api/notifications"""
    qs = Notification.objects.filter(user_id=user_id)
    if type_filter:
        qs = qs.filter(type=type_filter)
    qs = qs.order_by('-created_at')

    total = qs.count()
    total_pages = math.ceil(total / size) if total > 0 else 0
    offset = (page - 1) * size
    notifications = qs[offset:offset + size]

    return {
        'notifications': [_notification_to_dict(n) for n in notifications],
        'total': total,
        'page': page,
        'size': size,
        'totalPages': total_pages,
    }


def get_unread_notifications(user_id: int) -> list:
    """GET /api/notifications/unread"""
    qs = Notification.objects.filter(user_id=user_id, is_read=False).order_by('-created_at')
    return [_notification_to_dict(n) for n in qs]


def get_unread_count(user_id: int) -> int:
    """GET /api/notifications/unread/count"""
    return Notification.objects.filter(user_id=user_id, is_read=False).count()


@transaction.atomic
def mark_as_read(notification_id: int, user_id: int) -> bool:
    """PUT /api/notifications/{id}/read"""
    try:
        notif = Notification.objects.get(id=notification_id, user_id=user_id)
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return True
    except Notification.DoesNotExist:
        return False


@transaction.atomic
def mark_all_as_read(user_id: int) -> int:
    """PUT /api/notifications/read/all"""
    count = Notification.objects.filter(user_id=user_id, is_read=False).update(is_read=True)
    return count


@transaction.atomic
def delete_read_notifications(user_id: int) -> int:
    """DELETE /api/notifications/read"""
    count, _ = Notification.objects.filter(user_id=user_id, is_read=True).delete()
    return count


@transaction.atomic
def delete_notification(notification_id: int, user_id: int) -> bool:
    """DELETE /api/notifications/{id}"""
    try:
        notif = Notification.objects.get(id=notification_id, user_id=user_id)
        notif.delete()
        return True
    except Notification.DoesNotExist:
        return False


@transaction.atomic
def create_notification(payload: CreateNotificationIn):
    """POST /api/notifications — internal use"""
    notif = Notification.objects.create(
        user_id=payload.userId,
        type=payload.type,
        title=payload.title,
        content=payload.content,
        related_id=payload.relatedId or '',
        related_type=payload.relatedType or '',
        sender_id=payload.senderId,
        sender_name=payload.senderName or '',
        sender_avatar=payload.senderAvatar or '',
    )
    return _notification_to_dict(notif)


def _notification_to_dict(n: Notification) -> dict:
    now = datetime.now(timezone.utc)
    created = n.created_at
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
        'id': n.id,
        'type': n.type or '',
        'title': n.title or '',
        'content': n.content or '',
        'isRead': bool(n.is_read),
        'relatedId': n.related_id or '',
        'relatedType': n.related_type or '',
        'senderId': n.sender_id,
        'senderName': n.sender_name or '',
        'senderAvatar': n.sender_avatar or '',
        'createdAt': n.created_at.isoformat() if n.created_at else '',
        'timeAgo': time_ago,
    }
