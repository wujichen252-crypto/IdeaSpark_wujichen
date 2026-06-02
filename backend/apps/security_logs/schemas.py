"""Security log schemas."""
from ninja import Schema
from typing import Optional


class SecurityLogItem(Schema):
    id: int
    actionType: str
    description: str
    ipAddress: Optional[str] = ''
    location: Optional[str] = ''
    device: Optional[str] = ''
    status: Optional[str] = ''
    createdAt: str
    timeAgo: str = ''


class SecurityLogListResult(Schema):
    logs: list
    total: int
    page: int
    size: int
    totalPages: int
