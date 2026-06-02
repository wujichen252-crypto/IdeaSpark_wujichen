"""Pydantic schemas for Community API."""
from typing import Optional, List
from ninja import Schema


# ── Post Schemas ───────────────────────────────────────────

class CreatePostIn(Schema):
    title: str
    content: str
    images: Optional[str] = None
    tags: Optional[str] = None
    channel: Optional[str] = None
    visibility: Optional[str] = None
    projectId: Optional[str] = None


class UpdatePostIn(Schema):
    title: Optional[str] = None
    content: Optional[str] = None
    images: Optional[str] = None
    tags: Optional[str] = None
    visibility: Optional[str] = None


# ── Comment Schemas ────────────────────────────────────────

class CreateCommentIn(Schema):
    postId: str
    content: str
    parentId: Optional[str] = None


class UpdateCommentIn(Schema):
    content: str


# ── Group Schemas ──────────────────────────────────────────

class CreateGroupIn(Schema):
    name: str
    keyword: Optional[str] = None
    description: Optional[str] = None
    iconUrl: Optional[str] = None
    coverUrl: Optional[str] = None


class UpdateGroupIn(Schema):
    name: Optional[str] = None
    keyword: Optional[str] = None
    description: Optional[str] = None
    iconUrl: Optional[str] = None
    coverUrl: Optional[str] = None


class UpdateGroupMemberRoleIn(Schema):
    role: str
