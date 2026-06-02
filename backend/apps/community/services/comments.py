"""Comment business logic."""
import uuid
from typing import List
from django.db import transaction
from apps.accounts.models import User
from apps.community.models import CommunityPost, CommunityComment, CommunityCommentLike
from apps.community.schemas import CreateCommentIn
from common.exceptions import BusinessException, NotFoundException, ForbiddenException
from . import _dt


@transaction.atomic
def create_comment(user_id: int, payload: CreateCommentIn) -> dict:
    """POST /api/community/comments"""
    try:
        post = CommunityPost.objects.get(id=payload.postId)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')

    parent = None
    if payload.parentId:
        try:
            parent = CommunityComment.objects.get(id=payload.parentId, post=post)
        except CommunityComment.DoesNotExist:
            raise NotFoundException('父评论不存在')

    user = User.objects.get(id=user_id)

    comment = CommunityComment.objects.create(
        id=str(uuid.uuid4()),
        post=post,
        user=user,
        parent=parent,
        content=payload.content.strip(),
        likes_count=0,
    )
    return _comment_to_map(comment, user_id)


def get_comments_by_post(post_id: str, user_id: int = 0) -> List[dict]:
    """GET /api/community/comments/post/{postId} — top-level only"""
    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')
    qs = CommunityComment.objects.filter(post=post, parent__isnull=True)
    qs = qs.select_related('user').order_by('-created_at')
    return [_comment_to_map(c, user_id) for c in qs]


def get_replies_by_parent(parent_id: str, user_id: int = 0) -> List[dict]:
    """GET /api/community/comments/replies/{parentId}"""
    qs = CommunityComment.objects.filter(parent_id=parent_id)
    qs = qs.select_related('user').order_by('created_at')
    return [_comment_to_map(c, user_id) for c in qs]


def get_all_comments_by_post(post_id: str, user_id: int = 0) -> List[dict]:
    """GET /api/community/comments/post/{postId}/all — including replies"""
    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')
    qs = CommunityComment.objects.filter(post=post)
    qs = qs.select_related('user').order_by('created_at')
    return [_comment_to_map(c, user_id) for c in qs]


@transaction.atomic
def update_comment(comment_id: str, user_id: int, content: str) -> dict:
    """PUT /api/community/comments/{commentId}"""
    try:
        comment = CommunityComment.objects.get(id=comment_id)
    except CommunityComment.DoesNotExist:
        raise NotFoundException('评论不存在')
    if comment.user_id != user_id:
        raise ForbiddenException('无权修改该评论')
    comment.content = content.strip()
    comment.save(update_fields=['content'])
    return _comment_to_map(comment, user_id)


@transaction.atomic
def delete_comment(comment_id: str, user_id: int):
    """DELETE /api/community/comments/{commentId}"""
    try:
        comment = CommunityComment.objects.get(id=comment_id)
    except CommunityComment.DoesNotExist:
        raise NotFoundException('评论不存在')
    if comment.user_id != user_id:
        raise ForbiddenException('无权删除该评论')
    comment.delete()


@transaction.atomic
def update_comment_likes_count(comment_id: str, count: int) -> dict:
    """PUT /api/community/comments/{commentId}/likes"""
    try:
        comment = CommunityComment.objects.get(id=comment_id)
    except CommunityComment.DoesNotExist:
        raise NotFoundException('评论不存在')
    comment.likes_count = count
    comment.save(update_fields=['likes_count'])
    return _comment_to_map(comment)


# ── Helpers ──


def _comment_to_map(comment: CommunityComment, user_id: int = 0) -> dict:
    """Convert comment to response map."""
    is_liked = False
    if user_id:
        is_liked = CommunityCommentLike.objects.filter(comment_id=comment.id, user_id=user_id).exists()

    result = {
        'id': comment.id,
        'content': comment.content or '',
        'userId': comment.user_id,
        'username': comment.user.username if comment.user else '',
        'avatar': comment.user.avatar if comment.user else '',
        'likesCount': comment.likes_count or 0,
        'createdAt': _dt(comment.created_at),
        'isLiked': is_liked,
    }

    if comment.parent_id:
        result['parentId'] = comment.parent_id

    return result
