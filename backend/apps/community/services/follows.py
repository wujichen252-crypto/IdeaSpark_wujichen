"""Follow business logic."""
import uuid
from typing import List
from django.db import transaction
from apps.accounts.models import User
from apps.community.models import UserFollow
from common.exceptions import BusinessException, NotFoundException
from . import _dt


@transaction.atomic
def follow_user(follower_id: int, following_id: int):
    """POST /api/follows/{followingId}"""
    if follower_id == following_id:
        raise BusinessException('不能关注自己')
    if not User.objects.filter(id=following_id).exists():
        raise NotFoundException('被关注用户不存在')

    if UserFollow.objects.filter(follower_id=follower_id, following_id=following_id).exists():
        raise BusinessException('已经关注过该用户')

    UserFollow.objects.create(
        id=str(uuid.uuid4()),
        follower_id=follower_id,
        following_id=following_id,
    )


@transaction.atomic
def unfollow_user(follower_id: int, following_id: int):
    """DELETE /api/follows/{followingId}"""
    try:
        UserFollow.objects.get(follower_id=follower_id, following_id=following_id).delete()
    except UserFollow.DoesNotExist:
        raise BusinessException('未关注该用户')


def get_following_list(user_id: int) -> List[dict]:
    """GET /api/follows/my/following"""
    qs = UserFollow.objects.filter(follower_id=user_id).select_related('following').order_by('-created_at')
    return [_follow_to_following_map(f) for f in qs]


def get_follower_list(user_id: int) -> List[dict]:
    """GET /api/follows/my/followers"""
    qs = UserFollow.objects.filter(following_id=user_id).select_related('follower').order_by('-created_at')
    return [_follow_to_follower_map(f) for f in qs]


def get_following_count(user_id: int) -> int:
    """Count following for a user."""
    return UserFollow.objects.filter(follower_id=user_id).count()


def get_follower_count(user_id: int) -> int:
    """Count followers for a user."""
    return UserFollow.objects.filter(following_id=user_id).count()


def check_follow(follower_id: int, following_id: int) -> bool:
    """Check if follower_id follows following_id."""
    return UserFollow.objects.filter(follower_id=follower_id, following_id=following_id).exists()


def get_recommend_users(user_id: int) -> List[dict]:
    """GET /api/follows/recommend — active users not already followed."""
    following_ids = UserFollow.objects.filter(follower_id=user_id).values_list('following_id', flat=True)
    exclude_ids = list(following_ids) + [user_id]
    recommend_users = User.objects.exclude(id__in=exclude_ids).order_by('-created_at')[:10]
    return [_user_to_recommend_map(u) for u in recommend_users]


# ── Helpers ──


def _follow_to_following_map(follow: UserFollow) -> dict:
    """Convert follow to 'my following' list item."""
    return {
        'id': follow.id,
        'followingId': follow.following_id,
        'followingName': follow.following.username if follow.following else '',
        'followingAvatar': follow.following.avatar if follow.following else '',
        'createdAt': _dt(follow.created_at),
    }


def _follow_to_follower_map(follow: UserFollow) -> dict:
    """Convert follow to 'my follower' list item."""
    return {
        'id': follow.id,
        'followerId': follow.follower_id,
        'followerName': follow.follower.username if follow.follower else '',
        'followerAvatar': follow.follower.avatar if follow.follower else '',
        'createdAt': _dt(follow.created_at),
    }


def _user_to_recommend_map(user) -> dict:
    """Convert user to recommend list item."""
    return {
        'id': user.id,
        'name': user.username or '',
        'avatar': user.avatar or '',
        'desc': user.bio or '',
        'isFollowed': False,
    }
