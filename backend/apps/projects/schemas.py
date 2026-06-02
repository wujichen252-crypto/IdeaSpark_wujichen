"""Pydantic schemas for Project API."""
from typing import Optional, List
from ninja import Schema


# ── Request Schemas ──────────────────────────────────────

class CreateProjectIn(Schema):
    name: str
    description: Optional[str] = ''
    category: Optional[str] = ''
    cover_url: Optional[str] = ''
    visibility: Optional[str] = 'private'
    team_id: Optional[str] = ''
    tags: Optional[List[str]] = None
    tech_stack: Optional[List[str]] = None
    content: Optional[str] = ''
    plugins: Optional[List[str]] = None


class UpdateProjectIn(Schema):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    cover_url: Optional[str] = None
    status: Optional[str] = None
    visibility: Optional[str] = None
    allow_fork: Optional[bool] = None
    tags: Optional[List[str]] = None
    tech_stack: Optional[List[str]] = None
    content: Optional[str] = None
    plugins: Optional[List[str]] = None


class ProjectListIn(Schema):
    page: Optional[int] = 1
    size: Optional[int] = 20
    keyword: Optional[str] = None
    status: Optional[str] = None


class CreateFileIn(Schema):
    name: str
    type: Optional[str] = ''
    ext: Optional[str] = ''
    size: Optional[int] = None
    source: Optional[str] = ''
    plugin_id: Optional[str] = ''
    content: Optional[str] = ''


class UpdateFileIn(Schema):
    name: Optional[str] = None
    content: Optional[str] = None
    size: Optional[int] = None


# ── Response Schemas ─────────────────────────────────────

class ProjectItemOut(Schema):
    """Maps to ProjectMyListItemResponse."""
    id: str
    name: str
    description: str = ''
    category: str = ''
    cover_url: str = ''
    status: str = 'draft'
    progress: int = 0
    visibility: str = 'private'
    allow_fork: bool = True
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    my_role: str = 'member'
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ProjectDetailOut(Schema):
    """Maps to ProjectDetailResponse."""
    id: str
    name: str
    description: str = ''
    category: str = ''
    cover_url: str = ''
    status: str = 'draft'
    progress: int = 0
    visibility: str = 'private'
    allow_fork: bool = True
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    my_role: str = 'visitor'
    tags: List[str] = []
    tech_stack: List[str] = []
    content: str = ''
    plugins: List[str] = []
    files: List[dict] = []
    members: List[dict] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class FileOut(Schema):
    """Maps to ProjectFileResponse."""
    id: str
    name: str
    type: str = ''
    ext: str = ''
    size: Optional[int] = None
    source: str = ''
    plugin_id: str = ''
    content: str = ''
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class MemberOut(Schema):
    """Maps to ProjectMemberResponse."""
    id: int
    username: str
    nickname: str
    avatar: str = ''
    role: str
    role_cn: str = '成员'
    joined_at: Optional[str] = None
