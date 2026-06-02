"""Pydantic schemas for Team API."""
from typing import Optional, List
from ninja import Schema


# ── Request Schemas ──────────────────────────────────────

class CreateTeamIn(Schema):
    name: str
    description: Optional[str] = ''


class UpdateTeamIn(Schema):
    name: Optional[str] = None
    avatarUrl: Optional[str] = None
    description: Optional[str] = None


class TeamMemberRoleUpdateIn(Schema):
    role: str


class TeamTransferOwnershipIn(Schema):
    newOwnerId: int


class TeamInvitationSendIn(Schema):
    type: Optional[str] = None  # 'link' or 'email'
    role: str
    emails: Optional[List[str]] = None
