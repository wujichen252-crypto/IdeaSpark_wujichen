from typing import Optional
from ninja import Schema


class NotificationItem(Schema):
    id: int
    type: str
    title: str
    content: str
    isRead: bool
    relatedId: Optional[str] = ''
    relatedType: Optional[str] = ''
    senderId: Optional[int] = None
    senderName: Optional[str] = ''
    senderAvatar: Optional[str] = ''
    createdAt: str
    timeAgo: str = ''


class NotificationListResult(Schema):
    notifications: list
    total: int
    page: int
    size: int
    totalPages: int


class CreateNotificationIn(Schema):
    userId: int
    type: str
    title: str
    content: str
    relatedId: Optional[str] = None
    relatedType: Optional[str] = None
    senderId: Optional[int] = None
    senderName: Optional[str] = None
    senderAvatar: Optional[str] = None
