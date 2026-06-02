"""Like business logic — post & comment likes."""
import uuid
from django.db import transaction
from apps.community.models import CommunityPost, CommunityComment, CommunityPostLike, CommunityCommentLike
from common.exceptions import BusinessException, NotFoundException


# ── Post likes ──


@transaction.atomic
def like_post(post_id: str, user_id: int):
    """POST /api/community/likes/post/{postId}"""
    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')

    if CommunityPostLike.objects.filter(post=post, user_id=user_id).exists():
        raise BusinessException('已经点赞过该帖子')

    CommunityPostLike.objects.create(
        id=str(uuid.uuid4()),
        post=post,
        user_id=user_id,
    )
    post.likes_count = (post.likes_count or 0) + 1
    post.save(update_fields=['likes_count'])


@transaction.atomic
def unlike_post(post_id: str, user_id: int):
    """DELETE /api/community/likes/post/{postId}"""
    try:
        like = CommunityPostLike.objects.get(post_id=post_id, user_id=user_id)
        like.delete()
    except CommunityPostLike.DoesNotExist:
        raise BusinessException('未点赞该帖子')

    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')
    post.likes_count = max(0, (post.likes_count or 0) - 1)
    post.save(update_fields=['likes_count'])


def get_post_like_count(post_id: str) -> dict:
    """GET /api/community/likes/post/{postId}/count"""
    count = CommunityPostLike.objects.filter(post_id=post_id).count()
    return {'count': count}


def check_post_liked(post_id: str, user_id: int) -> dict:
    """GET /api/community/likes/post/{postId}/check"""
    liked = CommunityPostLike.objects.filter(post_id=post_id, user_id=user_id).exists()
    return {'liked': liked}


# ── Comment likes ──


@transaction.atomic
def like_comment(comment_id: str, user_id: int):
    """POST /api/community/likes/comment/{commentId}"""
    try:
        comment = CommunityComment.objects.get(id=comment_id)
    except CommunityComment.DoesNotExist:
        raise NotFoundException('评论不存在')

    if CommunityCommentLike.objects.filter(comment=comment, user_id=user_id).exists():
        raise BusinessException('已经点赞过该评论')

    CommunityCommentLike.objects.create(
        id=str(uuid.uuid4()),
        comment=comment,
        user_id=user_id,
    )
    comment.likes_count = (comment.likes_count or 0) + 1
    comment.save(update_fields=['likes_count'])


@transaction.atomic
def unlike_comment(comment_id: str, user_id: int):
    """DELETE /api/community/likes/comment/{commentId}"""
    try:
        CommunityCommentLike.objects.get(comment_id=comment_id, user_id=user_id).delete()
    except CommunityCommentLike.DoesNotExist:
        raise BusinessException('未点赞该评论')

    try:
        comment = CommunityComment.objects.get(id=comment_id)
    except CommunityComment.DoesNotExist:
        raise NotFoundException('评论不存在')
    comment.likes_count = max(0, (comment.likes_count or 0) - 1)
    comment.save(update_fields=['likes_count'])


def get_comment_like_count(comment_id: str) -> dict:
    """GET /api/community/likes/comment/{commentId}/count"""
    count = CommunityCommentLike.objects.filter(comment_id=comment_id).count()
    return {'count': count}


def check_comment_liked(comment_id: str, user_id: int) -> dict:
    """GET /api/community/likes/comment/{commentId}/check"""
    liked = CommunityCommentLike.objects.filter(comment_id=comment_id, user_id=user_id).exists()
    return {'liked': liked}
