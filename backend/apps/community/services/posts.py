"""Post business logic."""
import json
import uuid
from typing import Optional, List
from django.db import transaction
from apps.accounts.models import User
from apps.community.models import (
    CommunityPost, CommunityPostLike, CommunityCommentLike,
)
from apps.projects.models import Project
from apps.community.schemas import CreatePostIn, UpdatePostIn
from common.exceptions import BusinessException, NotFoundException, ForbiddenException
from . import _dt


@transaction.atomic
def create_post(user_id: int, payload: CreatePostIn) -> dict:
    """POST /api/community/posts"""
    user = User.objects.get(id=user_id)

    project = None
    if payload.projectId:
        try:
            project = Project.objects.get(id=payload.projectId)
        except Project.DoesNotExist:
            raise BusinessException('关联项目不存在')

    post = CommunityPost.objects.create(
        id=str(uuid.uuid4()),
        author=user,
        project=project,
        title=payload.title or '',
        content=payload.content or '',
        images=payload.images or None,
        tags=payload.tags or None,
        channel=payload.channel or '',
        visibility=payload.visibility or 'public',
        likes_count=0,
        comments_count=0,
        views_count=0,
    )

    return _post_to_detail(post, user_id)


def get_all_posts(channel: Optional[str] = None, user_id: int = 0) -> List[dict]:
    """GET /api/community/posts"""
    qs = CommunityPost.objects.select_related('author', 'project').all()
    if channel:
        qs = qs.filter(channel=channel)
    qs = qs.exclude(visibility='deleted').order_by('-created_at')
    return [_post_to_map(p, user_id) for p in qs]


def get_user_posts(target_user_id: int, current_user_id: int = 0) -> List[dict]:
    """GET /api/community/posts/user/{userId}"""
    qs = CommunityPost.objects.filter(author_id=target_user_id)
    qs = qs.select_related('author', 'project').exclude(visibility='deleted').order_by('-created_at')
    return [_post_to_map(p, current_user_id) for p in qs]


def get_latest_posts(user_id: int = 0) -> List[dict]:
    """GET /api/community/posts/feed/latest"""
    qs = CommunityPost.objects.select_related('author', 'project').all()
    qs = qs.exclude(visibility='deleted').order_by('-created_at')
    return [_post_to_map(p, user_id) for p in qs]


def get_recommend_posts(user_id: int = 0) -> List[dict]:
    """GET /api/community/posts/feed/recommend
    Sort by popularity score: likes*3 + comments*2 + views"""
    qs = CommunityPost.objects.select_related('author', 'project').all()
    qs = qs.exclude(visibility='deleted')
    posts = list(qs)
    posts.sort(key=lambda p: p.likes_count * 3 + p.comments_count * 2 + p.views_count, reverse=True)
    return [_post_to_map(p, user_id) for p in posts]


def get_following_posts(user_id: int) -> List[dict]:
    """GET /api/community/posts/feed/following"""
    from apps.community.models import UserFollow
    following_ids = UserFollow.objects.filter(follower_id=user_id).values_list('following_id', flat=True)
    qs = CommunityPost.objects.filter(author_id__in=following_ids)
    qs = qs.select_related('author', 'project').exclude(visibility='deleted').order_by('-created_at')
    return [_post_to_map(p, user_id) for p in qs]


def increment_view_count(post_id: str) -> CommunityPost:
    """Increment views_count and return post."""
    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')
    post.views_count = (post.views_count or 0) + 1
    post.save(update_fields=['views_count'])
    return post


def get_post_detail(post_id: str, user_id: int = 0) -> dict:
    """GET /api/community/posts/{postId}"""
    post = increment_view_count(post_id)
    return _post_to_detail(post, user_id)


@transaction.atomic
def update_post(post_id: str, user_id: int, payload: UpdatePostIn) -> dict:
    """PUT /api/community/posts/{postId}"""
    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')

    if post.author_id != user_id:
        raise ForbiddenException('无权修改该帖子')

    update_fields = []
    if payload.title is not None:
        post.title = payload.title
        update_fields.append('title')
    if payload.content is not None:
        post.content = payload.content
        update_fields.append('content')
    if payload.images is not None:
        post.images = payload.images
        update_fields.append('images')
    if payload.tags is not None:
        post.tags = payload.tags
        update_fields.append('tags')
    if payload.visibility is not None:
        post.visibility = payload.visibility
        update_fields.append('visibility')

    if update_fields:
        post.save(update_fields=update_fields)

    return _post_to_detail(post, user_id)


@transaction.atomic
def delete_post(post_id: str, user_id: int):
    """DELETE /api/community/posts/{postId} — logical delete."""
    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')
    if post.author_id != user_id:
        raise ForbiddenException('无权删除该帖子')
    post.visibility = 'deleted'
    post.save(update_fields=['visibility'])


@transaction.atomic
def update_post_likes_count(post_id: str, count: int):
    """PUT /api/community/posts/{postId}/likes"""
    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')
    post.likes_count = count
    post.save(update_fields=['likes_count'])


@transaction.atomic
def update_post_comments_count(post_id: str, count: int) -> dict:
    """PUT /api/community/posts/{postId}/comments"""
    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')
    post.comments_count = count
    post.save(update_fields=['comments_count'])
    return {'id': post.id, 'commentsCount': post.comments_count}


# ── Helpers ──


def _post_to_map(post: CommunityPost, user_id: int = 0) -> dict:
    """Convert post to list item map."""
    is_liked = False
    if user_id:
        is_liked = CommunityPostLike.objects.filter(post_id=post.id, user_id=user_id).exists()

    return {
        'id': post.id,
        'title': post.title or '',
        'content': post.content or '',
        'images': json.loads(post.images) if post.images and post.images.startswith('[') else ([post.images] if post.images else []),
        'tags': json.loads(post.tags) if post.tags and post.tags.startswith('[') else ([post.tags] if post.tags else []),
        'channel': post.channel or '',
        'visibility': post.visibility or '',
        'likesCount': post.likes_count or 0,
        'commentsCount': post.comments_count or 0,
        'viewsCount': post.views_count or 0,
        'createdAt': _dt(post.created_at),
        'updatedAt': _dt(post.updated_at),
        'author': {
            'id': post.author_id,
            'username': post.author.username if post.author else '',
            'avatar': post.author.avatar if post.author else '',
        } if post.author else None,
        'project': {'id': post.project.id, 'name': post.project.name} if post.project else None,
        'isLiked': is_liked,
    }


def _post_to_detail(post: CommunityPost, user_id: int = 0) -> dict:
    """Convert post to detail map (same as _post_to_map but with full fields)."""
    m = _post_to_map(post, user_id)
    m['channel'] = post.channel or ''
    m['visibility'] = post.visibility or ''
    m['updatedAt'] = _dt(post.updated_at)
    return m
