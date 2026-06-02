"""Project business logic service."""
import uuid
import logging
from datetime import datetime
from typing import Optional, List

from django.db import transaction
from django.db.models import Q

from apps.accounts.models import User
from apps.projects.models import (
    Project, ProjectMember, ProjectFile, Plugin, ProjectPlugin,
    ProjectFavorite, ProjectLike, ProjectComment,
)
from apps.projects.schemas import (
    CreateProjectIn, UpdateProjectIn, CreateFileIn, UpdateFileIn,
)
from apps.teams.models import Team
from common.exceptions import BusinessException, NotFoundException, ForbiddenException
from common.pagination import paginate_queryset, validate_pagination, Page

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
#  Project CRUD
# ═══════════════════════════════════════════════════════════

def get_my_projects(user_id: int, keyword: Optional[str], status: Optional[str],
                    page: int, size: int) -> Page:
    """GET /api/projects/my"""
    qs = Project.objects.filter(
        Q(owner_id=user_id) | Q(projectmember__user_id=user_id)
    ).distinct()

    if keyword:
        qs = qs.filter(Q(name__icontains=keyword) | Q(description__icontains=keyword))
    if status:
        qs = qs.filter(status=status)

    qs = qs.order_by('-updated_at')
    p, s = validate_pagination(page, size)
    result = paginate_queryset(qs, p, s)
    result.items = [_project_to_list_item(p, user_id) for p in result.items]
    return result


def get_user_public_projects(target_user_id: int, page: int, size: int) -> Page:
    """GET /api/projects/user/{userId}"""
    qs = Project.objects.filter(owner_id=target_user_id, visibility='public').order_by('-updated_at')
    p, s = validate_pagination(page, size)
    result = paginate_queryset(qs, p, s)
    result.items = [_project_to_list_item(p, target_user_id) for p in result.items]
    return result


@transaction.atomic
def create_project(user_id: int, payload: CreateProjectIn) -> dict:
    """POST /api/projects"""
    user = User.objects.get(id=user_id)

    team = None
    if payload.team_id:
        try:
            team = Team.objects.get(id=payload.team_id)
        except Team.DoesNotExist:
            raise BusinessException('团队不存在')

    project = Project.objects.create(
        id=str(uuid.uuid4()),
        owner=user,
        name=payload.name.strip(),
        description=payload.description or '',
        category=payload.category or '',
        cover_url=payload.cover_url or '',
        visibility=payload.visibility or 'private',
        status='active',
        progress=0,
        team=team,
        parent_id=None,
        tags=','.join(payload.tags) if payload.tags else '',
        tech_stack=','.join(payload.tech_stack) if payload.tech_stack else '',
        content=payload.content or '',
    )

    # Add owner as project member
    ProjectMember.objects.create(
        id=str(uuid.uuid4()),
        project=project,
        user=user,
        role='owner',
    )

    # Link plugins
    if payload.plugins:
        _link_plugins(project, payload.plugins)

    return _project_to_create_resp(project)


@transaction.atomic
def update_project(user_id: int, project_id: str, payload: UpdateProjectIn) -> dict:
    """PUT /api/projects/{projectId}"""
    project = _get_project(project_id)
    _check_owner(project, user_id)

    update_fields = []
    field_map = {
        'name': 'name', 'description': 'description', 'category': 'category',
        'cover_url': 'cover_url', 'status': 'status', 'visibility': 'visibility',
        'allow_fork': 'allow_fork', 'content': 'content',
    }
    data = payload.dict(exclude_none=True, exclude_unset=True)

    for schema_f, model_f in field_map.items():
        if schema_f in data:
            setattr(project, model_f, data[schema_f] if schema_f != 'name' else data[schema_f].strip())
            update_fields.append(model_f)

    if 'tags' in data and data['tags'] is not None:
        project.tags = ','.join(data['tags'])
        update_fields.append('tags')
    if 'tech_stack' in data and data['tech_stack'] is not None:
        project.tech_stack = ','.join(data['tech_stack'])
        update_fields.append('tech_stack')
    if 'plugins' in data and data['plugins'] is not None:
        _link_plugins(project, data['plugins'])

    if update_fields:
        project.save(update_fields=update_fields)

    return _project_to_create_resp(project)


def get_project_detail(user_id: int, project_id: str) -> dict:
    """GET /api/projects/{projectId}"""
    project = _get_project(project_id)
    is_owner = project.owner_id == user_id
    is_member = ProjectMember.objects.filter(project=project, user_id=user_id).exists()
    is_public = project.visibility == 'public'

    if not is_public and not is_owner and not is_member:
        raise ForbiddenException('没有权限查看该项目')

    my_role = 'owner' if is_owner else ('member' if is_member else 'visitor')

    # Get plugins
    project_plugins = ProjectPlugin.objects.filter(project=project).select_related('plugin')
    plugin_keys = [pp.plugin.key for pp in project_plugins if pp.plugin]

    # Get files
    files_qs = ProjectFile.objects.filter(project=project).order_by('-created_at')
    files_list = [_file_to_dict(f) for f in files_qs]

    # Get members
    members_qs = ProjectMember.objects.filter(project=project).select_related('user')
    members_list = [_member_to_dict(m) for m in members_qs]

    return {
        'id': project.id,
        'name': project.name or '',
        'description': project.description or '',
        'category': project.category or '',
        'cover_url': project.cover_url or '',
        'status': project.status or 'draft',
        'progress': project.progress or 0,
        'visibility': project.visibility or 'private',
        'allow_fork': project.allow_fork if project.allow_fork is not None else True,
        'owner_id': project.owner_id,
        'owner_name': project.owner.username if project.owner else '',
        'team_id': project.team_id or '',
        'team_name': project.team.name if project.team else '',
        'my_role': my_role,
        'tags': _parse_tags(project.tags),
        'tech_stack': _parse_tags(project.tech_stack),
        'content': project.content or '',
        'plugins': plugin_keys,
        'files': files_list,
        'members': members_list,
        'created_at': _dt(project.created_at),
        'updated_at': _dt(project.updated_at),
    }


def get_project_members(user_id: int, project_id: str) -> list:
    """GET /api/projects/{projectId}/members"""
    project = _get_project(project_id)
    is_owner = project.owner_id == user_id
    is_member = ProjectMember.objects.filter(project=project, user_id=user_id).exists()
    is_public = project.visibility == 'public'

    if not is_public and not is_owner and not is_member:
        raise ForbiddenException('没有权限查看该项目成员')

    members_qs = ProjectMember.objects.filter(project=project).select_related('user')
    return [_member_to_dict(m) for m in members_qs]


# ═══════════════════════════════════════════════════════════
#  Project Files
# ═══════════════════════════════════════════════════════════

def create_file(user_id: int, project_id: str, payload: CreateFileIn) -> dict:
    """POST /api/projects/{projectId}/files"""
    project = _get_project(project_id)
    _check_member(project, user_id)

    file = ProjectFile.objects.create(
        id=str(uuid.uuid4()),
        project=project,
        name=payload.name.strip(),
        type=payload.type or '',
        ext=payload.ext or '',
        size=payload.size,
        source=payload.source or '',
        plugin_id=payload.plugin_id or None,
        content=payload.content or '',
        created_by_id=user_id,
        updated_by_id=user_id,
    )
    return _file_to_dict(file)


def update_file(user_id: int, project_id: str, file_id: str, payload: UpdateFileIn) -> dict:
    """PUT /api/projects/{projectId}/files/{fileId}"""
    project = _get_project(project_id)
    _check_member(project, user_id)

    try:
        file = ProjectFile.objects.get(id=file_id, project=project)
    except ProjectFile.DoesNotExist:
        raise NotFoundException('文件不存在')

    update_fields = []
    if payload.name is not None:
        file.name = payload.name.strip()
        update_fields.append('name')
    if payload.content is not None:
        file.content = payload.content
        update_fields.append('content')
    if payload.size is not None:
        file.size = payload.size
        update_fields.append('size')
    file.updated_by_id = user_id
    update_fields.append('updated_by')

    if update_fields:
        file.save(update_fields=update_fields)

    return _file_to_dict(file)


def delete_file(user_id: int, project_id: str, file_id: str) -> None:
    """DELETE /api/projects/{projectId}/files/{fileId}"""
    project = _get_project(project_id)
    _check_member(project, user_id)

    deleted, _ = ProjectFile.objects.filter(id=file_id, project=project).delete()
    if not deleted:
        raise NotFoundException('文件不存在')


def get_file_detail(user_id: int, project_id: str, file_id: str) -> dict:
    """GET /api/projects/{projectId}/files/{fileId}"""
    project = _get_project(project_id)
    _check_member(project, user_id)

    try:
        file = ProjectFile.objects.get(id=file_id, project=project)
    except ProjectFile.DoesNotExist:
        raise NotFoundException('文件不存在')
    return _file_to_dict(file)


# ═══════════════════════════════════════════════════════════
#  Favorites
# ═══════════════════════════════════════════════════════════

def favorite_project(user_id: int, project_id: str) -> None:
    """POST /api/projects/{projectId}/favorite"""
    project = _get_project(project_id)
    ProjectFavorite.objects.get_or_create(user_id=user_id, project=project)


def unfavorite_project(user_id: int, project_id: str) -> None:
    """DELETE /api/projects/{projectId}/favorite"""
    ProjectFavorite.objects.filter(user_id=user_id, project_id=project_id).delete()


def check_favorite(user_id: int, project_id: str) -> bool:
    """GET /api/projects/{projectId}/favorite/check"""
    return ProjectFavorite.objects.filter(user_id=user_id, project_id=project_id).exists()


def get_favorite_projects(user_id: int, page: int, size: int) -> Page:
    """GET /api/projects/my/favorites"""
    fav_ids = ProjectFavorite.objects.filter(user_id=user_id).values_list('project_id', flat=True)
    qs = Project.objects.filter(id__in=fav_ids).order_by('-updated_at')
    p, s = validate_pagination(page, size)
    result = paginate_queryset(qs, p, s)
    result.items = [_project_to_list_item(p, user_id) for p in result.items]
    return result


# ═══════════════════════════════════════════════════════════
#  Likes
# ═══════════════════════════════════════════════════════════

def like_project(user_id: int, project_id: str) -> None:
    """POST /api/projects/{projectId}/like"""
    project = _get_project(project_id)
    ProjectLike.objects.get_or_create(user_id=user_id, project=project)


def unlike_project(user_id: int, project_id: str) -> None:
    """DELETE /api/projects/{projectId}/like"""
    ProjectLike.objects.filter(user_id=user_id, project_id=project_id).delete()


def check_like(user_id: int, project_id: str) -> bool:
    """GET /api/projects/{projectId}/like/check"""
    return ProjectLike.objects.filter(user_id=user_id, project_id=project_id).exists()


def get_liked_projects(user_id: int, page: int, size: int) -> Page:
    """GET /api/projects/my/likes"""
    liked_ids = ProjectLike.objects.filter(user_id=user_id).values_list('project_id', flat=True)
    qs = Project.objects.filter(id__in=liked_ids).order_by('-updated_at')
    p, s = validate_pagination(page, size)
    result = paginate_queryset(qs, p, s)
    result.items = [_project_to_list_item(p, user_id) for p in result.items]
    return result


# ═══════════════════════════════════════════════════════════
#  Internal Helpers
# ═══════════════════════════════════════════════════════════

def _get_project(project_id: str) -> Project:
    try:
        return Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        raise NotFoundException('项目不存在')


def _check_owner(project: Project, user_id: int) -> None:
    if project.owner_id != user_id:
        raise ForbiddenException('没有权限更新该项目')


def _check_member(project: Project, user_id: int) -> None:
    is_owner = project.owner_id == user_id
    is_member = ProjectMember.objects.filter(project=project, user_id=user_id).exists()
    if not is_owner and not is_member:
        raise ForbiddenException('没有权限执行此操作')


def _link_plugins(project: Project, plugin_keys: List[str]) -> None:
    """Sync project plugins with given keys."""
    existing = ProjectPlugin.objects.filter(project=project)
    existing_plugin_ids = set(pp.plugin_id for pp in existing)

    target_plugins = Plugin.objects.filter(key__in=plugin_keys)
    target_ids = set(str(p.id) for p in target_plugins)

    # Delete removed
    to_delete = [pp for pp in existing if pp.plugin_id not in target_ids]
    ProjectPlugin.objects.filter(id__in=[pp.id for pp in to_delete]).delete()

    # Add new
    existing_ids_set = set(existing_plugin_ids)
    for plugin in target_plugins:
        if plugin.id not in existing_ids_set:
            ProjectPlugin.objects.create(
                id=str(uuid.uuid4()),
                project=project,
                plugin=plugin,
            )


def _project_to_list_item(project: Project, user_id: int) -> dict:
    my_role = 'owner' if project.owner_id == user_id else 'member'
    return {
        'id': project.id,
        'name': project.name or '',
        'description': project.description or '',
        'category': project.category or '',
        'cover_url': project.cover_url or '',
        'status': project.status or 'draft',
        'progress': project.progress or 0,
        'visibility': project.visibility or 'private',
        'allow_fork': project.allow_fork if project.allow_fork is not None else True,
        'owner_id': project.owner_id,
        'owner_name': project.owner.username if project.owner else '',
        'team_id': project.team_id or '',
        'team_name': project.team.name if project.team else '',
        'my_role': my_role,
        'created_at': _dt(project.created_at),
        'updated_at': _dt(project.updated_at),
    }


def _project_to_create_resp(project: Project) -> dict:
    return {
        'id': project.id,
        'name': project.name or '',
        'description': project.description or '',
        'category': project.category or '',
        'cover_url': project.cover_url or '',
        'status': project.status or 'draft',
        'progress': project.progress or 0,
        'visibility': project.visibility or 'private',
        'allow_fork': project.allow_fork if project.allow_fork is not None else True,
        'owner_id': project.owner_id,
        'owner_name': project.owner.username if project.owner else '',
        'team_id': project.team_id or '',
        'team_name': project.team.name if project.team else '',
        'current_user_role': 'owner',
        'tags': [],
        'created_at': _dt(project.created_at),
        'updated_at': _dt(project.updated_at),
    }


def _file_to_dict(file: ProjectFile) -> dict:
    return {
        'id': file.id,
        'name': file.name or '',
        'type': file.type or '',
        'ext': file.ext or '',
        'size': file.size,
        'source': file.source or '',
        'plugin_id': file.plugin_id or '',
        'content': file.content or '',
        'created_at': _dt(file.created_at),
        'updated_at': _dt(file.updated_at),
    }


def _member_to_dict(member: ProjectMember) -> dict:
    role_cn_map = {'owner': '所有者', 'admin': '管理员', 'member': '成员'}
    return {
        'id': member.user_id,
        'username': member.user.username if member.user else '',
        'nickname': member.user.username if member.user else '',
        'avatar': member.user.avatar if member.user and member.user.avatar else '',
        'role': member.role or 'member',
        'role_cn': role_cn_map.get(member.role, '成员'),
        'joined_at': _dt(member.joined_at),
    }


def _parse_tags(tag_str: Optional[str]) -> list:
    if not tag_str:
        return []
    return [t.strip() for t in tag_str.split(',') if t.strip()]


def _dt(val) -> Optional[str]:
    if val is None:
        return None
    if isinstance(val, str):
        return val
    return val.isoformat() if hasattr(val, 'isoformat') else str(val)


# ═══════════════════════════════════════════════════════════
#  Project Delete
# ═══════════════════════════════════════════════════════════

@transaction.atomic
def delete_project(user_id: int, project_id: str) -> None:
    """DELETE /api/projects/{projectId}"""
    project = _get_project(project_id)
    _check_owner(project, user_id)
    ProjectPlugin.objects.filter(project=project).delete()
    ProjectFile.objects.filter(project=project).delete()
    ProjectMember.objects.filter(project=project).delete()
    ProjectFavorite.objects.filter(project=project).delete()
    ProjectLike.objects.filter(project=project).delete()
    ProjectComment.objects.filter(project=project).delete()
    project.delete()


# ═══════════════════════════════════════════════════════════
#  Project Market
# ═══════════════════════════════════════════════════════════

def list_market_projects(keyword: Optional[str], category: Optional[str],
                         page: int, size: int) -> Page:
    """GET /api/market/projects/list"""
    qs = Project.objects.filter(visibility='public')
    if keyword:
        qs = qs.filter(name__icontains=keyword)
    if category:
        qs = qs.filter(category=category)

    qs = qs.order_by('-updated_at')
    p, s = validate_pagination(page, size)
    result = paginate_queryset(qs, p, s)

    project_ids = [item.id for item in result.items]
    like_counts = _aggregate_like_counts(project_ids)

    result.items = [_market_list_item(p, like_counts.get(p.id, 0)) for p in result.items]
    return result


def get_market_project_detail(project_id: str) -> dict:
    """GET /api/market/projects/{projectId}"""
    try:
        project = Project.objects.get(id=project_id, visibility='public')
    except Project.DoesNotExist:
        raise NotFoundException('项目不存在')

    like_count = _aggregate_like_counts([project_id]).get(project_id, 0)
    tags = _market_tags(project)

    owner = project.owner
    team = project.team

    return {
        'id': project.id,
        'name': project.name or '',
        'description': project.description or '',
        'category': project.category or '',
        'coverUrl': project.cover_url or '',
        'type': project.type or '',
        'status': project.status or 'draft',
        'progress': project.progress or 0,
        'visibility': project.visibility or 'private',
        'allowFork': bool(project.allow_fork) if project.allow_fork is not None else True,
        'createdAt': _dt(project.created_at),
        'updatedAt': _dt(project.updated_at),
        'parentId': project.parent_id,
        'ownerId': owner.id if owner else None,
        'ownerName': owner.username if owner else '',
        'ownerAvatar': owner.avatar if owner else '',
        'teamId': team.id if team else None,
        'teamName': team.name if team else None,
        'teamAvatar': None,
        'teamIsPersonal': team.is_personal if team else None,
        'teamSize': team.team_size if team else None,
        'likeCount': like_count,
        'tags': tags,
    }


def _aggregate_like_counts(project_ids: list) -> dict:
    """Aggregate likes from ProjectLike + CommunityPost likesCount."""
    from django.db.models import Count, Sum, Value
    direct = {r['project_id']: r['count']
              for r in ProjectLike.objects.filter(project_id__in=project_ids)
              .values('project_id').annotate(count=Count('id'))}

    from apps.community.models import CommunityPost
    post_likes = {r['project_id']: r['total']
                  for r in CommunityPost.objects.filter(project_id__in=project_ids)
                  .values('project_id').annotate(total=Sum('likes_count'))}

    all_ids = set(direct.keys()) | set(post_likes.keys())
    return {pid: (direct.get(pid, 0) or 0) + (post_likes.get(pid, 0) or 0) for pid in all_ids}


def _market_tags(project: Project) -> list:
    """Collect tags from project category + community post tags."""
    result = []
    if project.category:
        result.append(project.category)
    from apps.community.models import CommunityPost
    posts = CommunityPost.objects.filter(project_id=project.id).exclude(tags__isnull=True)
    for post in posts:
        raw = post.tags
        if raw and isinstance(raw, list):
            result.extend(raw)
        elif raw and isinstance(raw, str):
            cleaned = raw.strip('[]').replace('"', '').replace("'", '')
            result.extend(t.strip() for t in cleaned.split(',') if t.strip())
    seen = set()
    return [t for t in result if t not in seen and not seen.add(t)]


def _market_list_item(project: Project, like_count: int) -> dict:
    owner = project.owner
    tags = _market_tags(project)
    return {
        'projectId': project.id,
        'projectImage': project.cover_url or '',
        'projectName': project.name or '',
        'ownerId': owner.id if owner else None,
        'ownerName': owner.username if owner else '',
        'ownerAvatar': owner.avatar if owner else '',
        'likeCount': like_count,
        'tags': tags,
    }


# ═══════════════════════════════════════════════════════════
#  Project Comments
# ═══════════════════════════════════════════════════════════

def create_comment(user_id: int, project_id: str, content: str, parent_id: Optional[str] = None) -> dict:
    """POST /api/market/comments"""
    if not project_id:
        raise BusinessException('项目 ID 不能为空')
    if not content or not content.strip():
        raise BusinessException('评论内容不能为空')

    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        raise NotFoundException('项目不存在')

    if parent_id:
        try:
            ProjectComment.objects.get(id=parent_id)
        except ProjectComment.DoesNotExist:
            raise NotFoundException('父评论不存在')

    import uuid
    comment = ProjectComment.objects.create(
        id=str(uuid.uuid4()),
        project=project,
        user_id=user_id,
        content=content.strip(),
        parent_id=parent_id or None,
    )
    return _comment_to_dict(comment, user_id)


def get_project_comments(project_id: str) -> list:
    """GET /api/market/comments/project/{projectId} — top-level only"""
    qs = ProjectComment.objects.filter(project_id=project_id, parent__isnull=True).order_by('-created_at')
    return [_comment_to_dict(c) for c in qs]


def get_comment_replies(parent_id: str) -> list:
    """GET /api/market/comments/replies/{parentId}"""
    qs = ProjectComment.objects.filter(parent_id=parent_id).order_by('created_at')
    return [_comment_to_dict(c) for c in qs]


def get_project_all_comments(project_id: str) -> list:
    """GET /api/market/comments/project/{projectId}/all"""
    qs = ProjectComment.objects.filter(project_id=project_id).order_by('-created_at')
    return [_comment_to_dict(c) for c in qs]


@transaction.atomic
def delete_comment(user_id: int, comment_id: str) -> None:
    """DELETE /api/market/comments/{commentId}"""
    try:
        comment = ProjectComment.objects.get(id=comment_id)
    except ProjectComment.DoesNotExist:
        raise NotFoundException('评论不存在')

    if comment.user_id != user_id:
        raise ForbiddenException('只能删除自己的评论')

    comment.delete()  # cascade deletes replies


def update_comment_likes(comment_id: str, count: int) -> dict:
    """PUT /api/market/comments/{commentId}/likes"""
    if count < 0:
        raise BusinessException('点赞数不能为负数')
    try:
        comment = ProjectComment.objects.get(id=comment_id)
    except ProjectComment.DoesNotExist:
        raise NotFoundException('评论不存在')

    comment.likes_count = count
    comment.save(update_fields=['likes_count'])
    return _comment_to_dict(comment)


def get_project_comment_count(project_id: str) -> int:
    """GET /api/market/comments/project/{projectId}/count"""
    return ProjectComment.objects.filter(project_id=project_id).count()


def _comment_to_dict(comment: ProjectComment, current_user_id: int = None) -> dict:
    user = comment.user
    return {
        'id': comment.id,
        'projectId': comment.project_id,
        'content': comment.content or '',
        'likesCount': comment.likes_count or 0,
        'createdAt': _dt(comment.created_at),
        'updatedAt': _dt(comment.updated_at),
        'userId': user.id if user else None,
        'username': user.username if user else '',
        'avatar': user.avatar if user else '',
        'parentId': comment.parent_id or None,
    }


# ═══════════════════════════════════════════════════════════
#  Plugins — List
# ═══════════════════════════════════════════════════════════

def get_plugins(source: str = 'all') -> list:
    """GET /api/plugins — list active plugins by source"""
    qs = Plugin.objects.all()
    if source and source != 'all':
        qs = qs.filter(source__iexact=source)
    qs = qs.order_by('name')
    return [_plugin_to_dict(p) for p in qs]


def get_all_plugins() -> list:
    """GET /api/plugins/all — list all plugins (including inactive)"""
    qs = Plugin.objects.all().order_by('name')
    return [_plugin_to_dict(p) for p in qs]


def _plugin_to_dict(plugin: Plugin) -> dict:
    export_config = None
    if plugin.export_ext or plugin.export_mime:
        export_config = {
            'ext': plugin.export_ext or '',
            'mime': plugin.export_mime or '',
            'filenameSuffix': plugin.export_filename_suffix or '',
        }
    return {
        'id': plugin.id,
        'key': plugin.key or '',
        'name': plugin.name or '',
        'category': plugin.category or '',
        'description': plugin.description or '',
        'isActive': bool(plugin.is_active),
        'icon': plugin.icon or '',
        'color': plugin.color or '',
        'source': plugin.source or 'official',
        'export': export_config,
        'prompt': plugin.prompt or '',
        'price': float(plugin.price) if plugin.price else 0,
        'usageCount': plugin.usage_count or 0,
        'tags': plugin.tags or '',
        'isPremium': bool(plugin.is_premium),
        'createdAt': _dt(plugin.created_at),
        'updatedAt': _dt(plugin.updated_at),
    }


# ═══════════════════════════════════════════════════════════
#  Project Plugins
# ═══════════════════════════════════════════════════════════

def get_project_plugins(project_id: str) -> list:
    """GET /api/projects/{projectId}/plugins"""
    qs = ProjectPlugin.objects.filter(project_id=project_id).select_related('plugin').order_by('sort_order')
    result = []
    for pp in qs:
        p = pp.plugin
        result.append({
            'id': pp.id,
            'projectId': pp.project_id,
            'pluginId': pp.plugin_id,
            'sortOrder': pp.sort_order or 0,
            'createdAt': _dt(pp.created_at),
            'plugin': _plugin_to_dict(p) if p else None,
        })
    return result


def get_project_plugin_ids(project_id: str) -> list:
    """GET /api/projects/{projectId}/plugins/ids"""
    return list(ProjectPlugin.objects.filter(project_id=project_id).values_list('plugin_id', flat=True))


def get_project_plugin_keys(project_id: str) -> list:
    """GET /api/projects/{projectId}/plugins/keys"""
    qs = ProjectPlugin.objects.filter(project_id=project_id).select_related('plugin')
    keys = []
    for pp in qs:
        if pp.plugin and pp.plugin.key:
            keys.append(pp.plugin.key)
    return keys


def _resolve_plugin_id(plugin_id_or_key: str) -> str:
    """Resolve plugin UUID or key to actual plugin ID."""
    if Plugin.objects.filter(id=plugin_id_or_key).exists():
        return plugin_id_or_key
    try:
        p = Plugin.objects.get(key=plugin_id_or_key)
        return p.id
    except Plugin.DoesNotExist:
        raise NotFoundException('插件不存在')


@transaction.atomic
def enable_plugin(project_id: str, plugin_id_or_key: str) -> dict:
    """POST /api/projects/{projectId}/plugins/{pluginId}"""
    actual_id = _resolve_plugin_id(plugin_id_or_key)
    if ProjectPlugin.objects.filter(project_id=project_id, plugin_id=actual_id).exists():
        raise BusinessException('插件已启用')

    import uuid
    pp = ProjectPlugin.objects.create(
        id=str(uuid.uuid4()),
        project_id=project_id,
        plugin_id=actual_id,
        sort_order=0,
    )
    return {
        'id': pp.id,
        'projectId': pp.project_id,
        'pluginId': pp.plugin_id,
        'sortOrder': pp.sort_order or 0,
        'createdAt': _dt(pp.created_at),
    }


@transaction.atomic
def disable_plugin(project_id: str, plugin_id_or_key: str) -> None:
    """DELETE /api/projects/{projectId}/plugins/{pluginId}"""
    actual_id = _resolve_plugin_id(plugin_id_or_key)
    ProjectPlugin.objects.filter(project_id=project_id, plugin_id=actual_id).delete()


@transaction.atomic
def toggle_plugin(project_id: str, plugin_id_or_key: str) -> bool:
    """POST /api/projects/{projectId}/plugins/{pluginId}/toggle"""
    actual_id = _resolve_plugin_id(plugin_id_or_key)
    exists = ProjectPlugin.objects.filter(project_id=project_id, plugin_id=actual_id).exists()
    if exists:
        ProjectPlugin.objects.filter(project_id=project_id, plugin_id=actual_id).delete()
        return False
    else:
        import uuid
        ProjectPlugin.objects.create(
            id=str(uuid.uuid4()),
            project_id=project_id,
            plugin_id=actual_id,
        )
        return True


def is_plugin_enabled(project_id: str, plugin_id_or_key: str) -> bool:
    """GET /api/projects/{projectId}/plugins/{pluginId}/check"""
    actual_id = _resolve_plugin_id(plugin_id_or_key)
    return ProjectPlugin.objects.filter(project_id=project_id, plugin_id=actual_id).exists()
