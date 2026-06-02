"""Community business logic service.

Combines Java counterparts:
  - CommunityPostService
  - CommunityCommentService
  - CommunityGroupService (inline in controller)
  - CommunityLikeService
  - UserFollowService
"""
import json
import uuid
import logging
from datetime import datetime
from typing import Optional, List

from django.db import transaction
from django.db.models import Q

from apps.accounts.models import User
from apps.community.models import (
    CommunityPost, CommunityComment, CommunityGroup,
    CommunityGroupMember, CommunityPostLike, CommunityCommentLike,
    UserFollow,
)
from apps.projects.models import Project
from apps.community.schemas import (
    CreatePostIn, UpdatePostIn,
    CreateCommentIn, UpdateCommentIn,
    CreateGroupIn, UpdateGroupIn, UpdateGroupMemberRoleIn,
)
from common.exceptions import BusinessException, NotFoundException, ForbiddenException

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
#  Posts
# ═══════════════════════════════════════════════════════════

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
    Sort by popularity score: likes*3 + comments*2 + views
    """
    qs = CommunityPost.objects.select_related('author', 'project').all()
    qs = qs.exclude(visibility='deleted')
    posts = list(qs)
    posts.sort(key=lambda p: p.likes_count * 3 + p.comments_count * 2 + p.views_count, reverse=True)
    return [_post_to_map(p, user_id) for p in posts]


def get_following_posts(user_id: int) -> List[dict]:
    """GET /api/community/posts/feed/following"""
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


# ═══════════════════════════════════════════════════════════
#  Comments
# ═══════════════════════════════════════════════════════════

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


# ═══════════════════════════════════════════════════════════
#  Groups
# ═══════════════════════════════════════════════════════════

@transaction.atomic
def create_group(user_id: int, payload: CreateGroupIn) -> dict:
    """POST /api/community/groups"""
    name = payload.name.strip()
    if not name:
        raise BusinessException('圈子名称不能为空')
    if CommunityGroup.objects.filter(name=name).exists():
        raise BusinessException('圈子名称已存在')

    user = User.objects.get(id=user_id)

    group = CommunityGroup.objects.create(
        id=str(uuid.uuid4()),
        name=name,
        keyword=payload.keyword or '',
        description=payload.description or '',
        icon_url=payload.iconUrl or '',
        cover_url=payload.coverUrl or '',
        created_by=user,
    )

    # Creator auto-joins as admin
    CommunityGroupMember.objects.create(
        id=str(uuid.uuid4()),
        group=group,
        user=user,
        role='admin',
    )

    return _group_to_detail(group)


def get_all_groups() -> List[dict]:
    """GET /api/community/groups"""
    groups = CommunityGroup.objects.select_related('created_by').all().order_by('-created_at')
    return [_group_to_detail(g) for g in groups]


def get_group_detail(group_id: str) -> dict:
    """GET /api/community/groups/{groupId}"""
    try:
        group = CommunityGroup.objects.select_related('created_by').get(id=group_id)
    except CommunityGroup.DoesNotExist:
        raise NotFoundException('圈子不存在')
    return _group_to_detail(group)


@transaction.atomic
def update_group(group_id: str, user_id: int, payload: UpdateGroupIn) -> dict:
    """PUT /api/community/groups/{groupId}"""
    try:
        group = CommunityGroup.objects.get(id=group_id)
    except CommunityGroup.DoesNotExist:
        raise NotFoundException('圈子不存在')
    if group.created_by_id != user_id:
        raise ForbiddenException('无权修改该圈子')

    update_fields = []
    if payload.name is not None:
        new_name = payload.name.strip()
        if new_name != group.name and CommunityGroup.objects.filter(name=new_name).exists():
            raise BusinessException('圈子名称已存在')
        group.name = new_name
        update_fields.append('name')
    if payload.keyword is not None:
        group.keyword = payload.keyword
        update_fields.append('keyword')
    if payload.description is not None:
        group.description = payload.description
        update_fields.append('description')
    if payload.iconUrl is not None:
        group.icon_url = payload.iconUrl
        update_fields.append('icon_url')
    if payload.coverUrl is not None:
        group.cover_url = payload.coverUrl
        update_fields.append('cover_url')

    if update_fields:
        group.save(update_fields=update_fields)

    return _group_to_detail(group)


@transaction.atomic
def delete_group(group_id: str, user_id: int):
    """DELETE /api/community/groups/{groupId}"""
    try:
        group = CommunityGroup.objects.get(id=group_id)
    except CommunityGroup.DoesNotExist:
        raise NotFoundException('圈子不存在')
    if group.created_by_id != user_id:
        raise ForbiddenException('无权删除该圈子')

    # Delete all members first
    CommunityGroupMember.objects.filter(group=group).delete()
    group.delete()


@transaction.atomic
def join_group(group_id: str, user_id: int):
    """POST /api/community/groups/{groupId}/join"""
    try:
        group = CommunityGroup.objects.get(id=group_id)
    except CommunityGroup.DoesNotExist:
        raise NotFoundException('圈子不存在')

    if CommunityGroupMember.objects.filter(group=group, user_id=user_id).exists():
        raise BusinessException('已加入该圈子')

    CommunityGroupMember.objects.create(
        id=str(uuid.uuid4()),
        group=group,
        user_id=user_id,
        role='member',
    )


@transaction.atomic
def quit_group(group_id: str, user_id: int):
    """DELETE /api/community/groups/{groupId}/join"""
    try:
        group = CommunityGroup.objects.get(id=group_id)
    except CommunityGroup.DoesNotExist:
        raise NotFoundException('圈子不存在')

    if group.created_by_id == user_id:
        raise BusinessException('圈子创建者不能退出，请先转让圈子或解散圈子')

    try:
        member = CommunityGroupMember.objects.get(group=group, user_id=user_id)
    except CommunityGroupMember.DoesNotExist:
        raise BusinessException('未加入该圈子')

    member.delete()


def get_group_members(group_id: str) -> List[dict]:
    """GET /api/community/groups/{groupId}/members"""
    members = CommunityGroupMember.objects.filter(group_id=group_id).select_related('user')
    return [_group_member_to_map(m) for m in members]


def get_my_groups(user_id: int) -> List[dict]:
    """GET /api/community/groups/my"""
    members = CommunityGroupMember.objects.filter(user_id=user_id).select_related('group', 'user')
    return [_group_member_to_map(m) for m in members]


def get_group_member_count(group_id: str) -> dict:
    """GET /api/community/groups/{groupId}/members/count"""
    count = CommunityGroupMember.objects.filter(group_id=group_id).count()
    return {'count': count}


def check_group_membership(group_id: str, user_id: int) -> dict:
    """GET /api/community/groups/{groupId}/check"""
    is_member = CommunityGroupMember.objects.filter(group_id=group_id, user_id=user_id).exists()
    return {'member': is_member}


@transaction.atomic
def remove_group_member(group_id: str, member_id: str, user_id: int) -> dict:
    """DELETE /api/community/groups/{groupId}/members/{memberId}"""
    try:
        group = CommunityGroup.objects.get(id=group_id)
    except CommunityGroup.DoesNotExist:
        raise NotFoundException('圈子不存在')

    is_creator = group.created_by_id == user_id
    current_member = CommunityGroupMember.objects.filter(group_id=group_id, user_id=user_id).first()
    is_admin = current_member is not None and current_member.role == 'admin'

    if not is_creator and not is_admin:
        raise ForbiddenException('无权移除该成员')

    try:
        target = CommunityGroupMember.objects.get(id=member_id, group_id=group_id)
    except CommunityGroupMember.DoesNotExist:
        raise NotFoundException('成员不存在')

    if target.user_id == group.created_by_id:
        raise BusinessException('不能移除圈子创建者')

    if target.role == 'admin' and not is_creator:
        raise ForbiddenException('无权移除管理员')

    target.delete()
    return {'memberId': member_id, 'message': '成员移除成功'}


@transaction.atomic
def update_group_member_role(group_id: str, member_id: str, user_id: int, payload: UpdateGroupMemberRoleIn) -> dict:
    """PUT /api/community/groups/{groupId}/members/{memberId}/role"""
    try:
        group = CommunityGroup.objects.get(id=group_id)
    except CommunityGroup.DoesNotExist:
        raise NotFoundException('圈子不存在')

    if group.created_by_id != user_id:
        raise ForbiddenException('只有圈子创建者可以修改成员角色')

    try:
        target = CommunityGroupMember.objects.get(id=member_id, group_id=group_id)
    except CommunityGroupMember.DoesNotExist:
        raise NotFoundException('成员不存在')

    if target.user_id == group.created_by_id:
        raise BusinessException('不能修改创建者的角色')

    new_role = payload.role.strip().lower()
    if new_role not in ('admin', 'member'):
        raise BusinessException('角色必须是 admin 或 member')

    old_role = target.role
    target.role = new_role
    target.save(update_fields=['role'])

    return {
        'memberId': member_id,
        'oldRole': old_role,
        'newRole': new_role,
        'message': '角色更新成功',
    }


# ═══════════════════════════════════════════════════════════
#  Likes — Post
# ═══════════════════════════════════════════════════════════

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


# ═══════════════════════════════════════════════════════════
#  Likes — Comment
# ═══════════════════════════════════════════════════════════

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


# ═══════════════════════════════════════════════════════════
#  Follows
# ═══════════════════════════════════════════════════════════

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


# ═══════════════════════════════════════════════════════════
#  Internal Helpers
# ═══════════════════════════════════════════════════════════

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


def _group_to_detail(group: CommunityGroup) -> dict:
    """Convert group to detail map."""
    member_count = CommunityGroupMember.objects.filter(group=group).count()

    result = {
        'id': group.id,
        'name': group.name or '',
        'keyword': group.keyword or '',
        'description': group.description or '',
        'iconUrl': group.icon_url or '',
        'coverUrl': group.cover_url or '',
        'memberCount': member_count,
        'createdAt': _dt(group.created_at),
        'updatedAt': _dt(group.updated_at),
    }

    if group.created_by_id:
        result['createdBy'] = {
            'id': group.created_by_id,
            'username': group.created_by.username if group.created_by else '',
            'avatar': group.created_by.avatar if group.created_by else '',
        }

    return result


def _group_member_to_map(member: CommunityGroupMember) -> dict:
    """Convert group member to response map."""
    result = {
        'id': member.id,
        'role': member.role or '',
        'joinedAt': _dt(member.joined_at),
        'user': {
            'id': member.user_id,
            'username': member.user.username if member.user else '',
            'avatar': member.user.avatar if member.user else '',
        } if member.user_id else None,
    }

    if member.group_id:
        result['group'] = {
            'id': member.group.id,
            'name': member.group.name or '',
            'iconUrl': member.group.icon_url or '',
            'keyword': member.group.keyword or '',
            'description': member.group.description or '',
        }

    return result


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


def _dt(val):
    if val is None:
        return None
    if isinstance(val, str):
        return val
    return val.isoformat() if hasattr(val, 'isoformat') else str(val)
