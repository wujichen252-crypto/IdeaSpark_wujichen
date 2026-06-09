"""
Community business logic — Posts, Comments, Groups, Likes, Follows.
Maps Java: com.ideaspark.project.service.*
"""
import json
import logging
import uuid
from datetime import datetime
from typing import Optional

from django.db import transaction, connection
from django.db.models import Count

from apps.accounts.models import User
from apps.community.models import (
    CommunityPost, CommunityComment, CommunityGroup,
    CommunityGroupMember, CommunityPostLike, CommunityCommentLike, UserFollow,
)
from common.exceptions import BusinessException, NotFoundException, ForbiddenException

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
#  Posts
# ═══════════════════════════════════════════════════════════════


def _post_to_dict(post: CommunityPost, user_id: Optional[int] = None) -> dict:
    """Convert a CommunityPost to the frontend Post format."""
    images = []
    if post.images:
        try:
            images = json.loads(post.images) if isinstance(post.images, str) else post.images
        except (json.JSONDecodeError, TypeError):
            images = []

    tags = []
    if post.tags:
        try:
            tags = json.loads(post.tags) if isinstance(post.tags, str) else post.tags
        except (json.JSONDecodeError, TypeError):
            tags = []

    author = post.author
    author_dict = {
        'id': author.id,
        'username': author.username or '',
        'name': author.username or '',
        'avatar': author.avatar or '',
    } if author else {
        'id': 0,
        'username': '已注销',
        'name': '已注销',
        'avatar': '',
    }

    result = {
        'id': post.id,
        'title': post.title or '',
        'content': post.content or '',
        'images': images,
        'tags': tags,
        'channel': post.channel or '',
        'visibility': (post.visibility or 'public').upper(),
        'likesCount': post.likes_count or 0,
        'commentsCount': post.comments_count or 0,
        'viewsCount': post.views_count or 0,
        'createdAt': post.created_at.isoformat() if post.created_at else '',
        'updatedAt': post.updated_at.isoformat() if post.updated_at else '',
        'author': author_dict,
        'isLiked': False,
    }

    # Check if liked by current user
    if user_id:
        result['isLiked'] = CommunityPostLike.objects.filter(
            post_id=post.id, user_id=user_id
        ).exists()

    if post.project_id:
        from apps.projects.models import Project
        try:
            p = Project.objects.get(id=post.project_id)
            result['project'] = {'id': p.id, 'name': p.name or ''}
        except Project.DoesNotExist:
            pass

    return result


def create_post(user_id: int, title: str, content: str, channel: str = '',
                images: Optional[str] = None, tags: Optional[str] = None,
                visibility: str = 'PUBLIC', project_id: Optional[str] = None,
                group_id: Optional[str] = None) -> dict:
    """Create a community post."""
    user = User.objects.filter(id=user_id).first()
    if not user:
        raise BusinessException('用户不存在')

    post = CommunityPost.objects.create(
        id=str(uuid.uuid4()),
        author_id=user_id,
        title=title or '',
        content=content or '',
        images=images or None,
        tags=tags or None,
        channel=channel or '',
        visibility=(visibility or 'public').lower(),
        project_id=project_id,
        group_id=group_id,
        likes_count=0,
        comments_count=0,
        views_count=0,
    )
    return _post_to_dict(post, user_id)


def get_post_list(channel: Optional[str] = None, user_id: Optional[int] = None) -> list:
    """Get all public posts, optionally filtered by channel."""
    qs = CommunityPost.objects.select_related('author').filter(
        visibility='public'
    ).order_by('-created_at')

    if channel:
        qs = qs.filter(channel=channel)

    return [_post_to_dict(p, user_id) for p in qs]


def get_latest_posts(user_id: Optional[int] = None) -> list:
    """Get latest posts ordered by creation time."""
    qs = CommunityPost.objects.select_related('author').filter(
        visibility='public'
    ).order_by('-created_at')[:50]

    return [_post_to_dict(p, user_id) for p in qs]


def get_recommend_posts(user_id: Optional[int] = None) -> list:
    """Get recommended posts (by likes_count + comments_count)."""
    qs = CommunityPost.objects.select_related('author').filter(
        visibility='public'
    ).order_by('-likes_count', '-comments_count', '-created_at')[:50]

    return [_post_to_dict(p, user_id) for p in qs]


def get_following_posts(user_id: int) -> list:
    """Get posts from users the current user follows."""
    following_ids = UserFollow.objects.filter(
        follower_id=user_id
    ).values_list('following_id', flat=True)

    qs = CommunityPost.objects.select_related('author').filter(
        author_id__in=list(following_ids),
        visibility='public',
    ).order_by('-created_at')[:50]

    return [_post_to_dict(p, user_id) for p in qs]


def get_post_detail(post_id: str, user_id: Optional[int] = None) -> dict:
    """Get a single post by ID."""
    try:
        post = CommunityPost.objects.select_related('author').get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')

    # Increment view count
    CommunityPost.objects.filter(id=post_id).update(
        views_count=CommunityPost.objects.values('views_count').get(id=post_id)['views_count'] + 1
    )
    post.refresh_from_db()

    return _post_to_dict(post, user_id)


def update_post(post_id: str, user_id: int, title: Optional[str] = None,
                content: Optional[str] = None, images: Optional[str] = None,
                tags: Optional[str] = None, visibility: Optional[str] = None) -> dict:
    """Update a post."""
    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')

    if post.author_id != user_id:
        raise ForbiddenException('只能编辑自己的帖子')

    if title is not None:
        post.title = title
    if content is not None:
        post.content = content
    if images is not None:
        post.images = images
    if tags is not None:
        post.tags = tags
    if visibility is not None:
        post.visibility = visibility.lower()

    post.save(update_fields=[f for f in ['title', 'content', 'images', 'tags', 'visibility']
                             if getattr(post, f) is not None])
    return _post_to_dict(post, user_id)


def delete_post(post_id: str, user_id: int) -> None:
    """Delete a post (owner only)."""
    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')

    if post.author_id != user_id:
        raise ForbiddenException('只能删除自己的帖子')

    post.delete()


def update_post_likes(post_id: str, count: int) -> dict:
    """Set likes_count for a post (used for sync)."""
    CommunityPost.objects.filter(id=post_id).update(likes_count=count)
    return {'id': post_id, 'likesCount': count}


def update_post_comments(post_id: str, count: int) -> dict:
    """Set comments_count for a post."""
    CommunityPost.objects.filter(id=post_id).update(comments_count=count)
    return {'id': post_id, 'commentsCount': count}


def get_user_posts(user_id: int, target_user_id: int) -> list:
    """Get posts by a specific user."""
    qs = CommunityPost.objects.select_related('author').filter(
        author_id=target_user_id,
    ).order_by('-created_at')

    # Only show public posts if viewing someone else's profile
    # (or all posts if viewing own profile)
    if user_id != target_user_id:
        qs = qs.filter(visibility='public')

    return [_post_to_dict(p, user_id) for p in qs]


# ═══════════════════════════════════════════════════════════════
#  Comments
# ═══════════════════════════════════════════════════════════════


def _comment_to_dict(comment: CommunityComment, user_id: Optional[int] = None) -> dict:
    """Convert CommunityComment to frontend format."""
    user = comment.user
    result = {
        'id': comment.id,
        'content': comment.content or '',
        'userId': user.id if user else 0,
        'username': user.username if user else '已注销',
        'avatar': user.avatar if user else '',
        'likesCount': comment.likes_count or 0,
        'createdAt': comment.created_at.isoformat() if comment.created_at else '',
        'parentId': comment.parent_id,
        'isLiked': False,
    }

    if user_id:
        result['isLiked'] = CommunityCommentLike.objects.filter(
            comment_id=comment.id, user_id=user_id
        ).exists()

    return result


def create_comment(user_id: int, post_id: str, content: str,
                   parent_id: Optional[str] = None) -> dict:
    """Create a comment on a post."""
    user = User.objects.filter(id=user_id).first()
    if not user:
        raise BusinessException('用户不存在')

    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')

    if parent_id:
        try:
            CommunityComment.objects.get(id=parent_id)
        except CommunityComment.DoesNotExist:
            raise NotFoundException('父评论不存在')

    comment = CommunityComment.objects.create(
        id=str(uuid.uuid4()),
        post_id=post_id,
        user_id=user_id,
        parent_id=parent_id,
        content=content,
        likes_count=0,
    )

    # Update post comments count
    CommunityPost.objects.filter(id=post_id).update(
        comments_count=CommunityComment.objects.filter(post_id=post_id).count()
    )

    return _comment_to_dict(comment, user_id)


def get_post_comments(post_id: str, user_id: Optional[int] = None) -> list:
    """Get top-level comments for a post."""
    comments = CommunityComment.objects.select_related('user').filter(
        post_id=post_id, parent_id__isnull=True
    ).order_by('-created_at')

    return [_comment_to_dict(c, user_id) for c in comments]


def get_all_post_comments(post_id: str, user_id: Optional[int] = None) -> list:
    """Get ALL comments (including replies) for a post."""
    comments = CommunityComment.objects.select_related('user').filter(
        post_id=post_id
    ).order_by('created_at')

    return [_comment_to_dict(c, user_id) for c in comments]


def get_comment_replies(parent_id: str, user_id: Optional[int] = None) -> list:
    """Get replies to a specific comment."""
    replies = CommunityComment.objects.select_related('user').filter(
        parent_id=parent_id
    ).order_by('created_at')

    return [_comment_to_dict(c, user_id) for c in replies]


def update_comment(comment_id: str, user_id: int, content: str) -> dict:
    """Update a comment."""
    try:
        comment = CommunityComment.objects.get(id=comment_id)
    except CommunityComment.DoesNotExist:
        raise NotFoundException('评论不存在')

    if comment.user_id != user_id:
        raise ForbiddenException('只能编辑自己的评论')

    comment.content = content
    comment.save(update_fields=['content'])
    return _comment_to_dict(comment, user_id)


def delete_comment(comment_id: str, user_id: int) -> None:
    """Delete a comment."""
    try:
        comment = CommunityComment.objects.get(id=comment_id)
    except CommunityComment.DoesNotExist:
        raise NotFoundException('评论不存在')

    if comment.user_id != user_id:
        raise ForbiddenException('只能删除自己的评论')

    post_id = comment.post_id
    comment.delete()

    # Update post comments count
    CommunityPost.objects.filter(id=post_id).update(
        comments_count=CommunityComment.objects.filter(post_id=post_id).count()
    )


def update_comment_likes(comment_id: str, count: int) -> dict:
    """Update likes_count for a comment."""
    CommunityComment.objects.filter(id=comment_id).update(likes_count=count)
    return {'id': comment_id, 'likesCount': count}


# ═══════════════════════════════════════════════════════════════
#  Groups
# ═══════════════════════════════════════════════════════════════


def _group_to_dict(group: CommunityGroup) -> dict:
    """Convert CommunityGroup to frontend Group format."""
    member_count = CommunityGroupMember.objects.filter(group_id=group.id).count()
    return {
        'id': group.id,
        'name': group.name or '',
        'keyword': group.keyword or '',
        'description': group.description or '',
        'iconUrl': group.icon_url or '',
        'coverUrl': group.cover_url or '',
        'memberCount': member_count,
        'postCount': CommunityPost.objects.filter(group_id=group.id).count(),
        'createdAt': group.created_at.isoformat() if group.created_at else '',
    }


def _group_detail_to_dict(group: CommunityGroup) -> dict:
    """Convert CommunityGroup to frontend GroupDetail format."""
    result = _group_to_dict(group)
    creator = group.created_by
    result['createdBy'] = {
        'id': creator.id,
        'username': creator.username or '',
    } if creator else {'id': 0, 'username': '未知'}
    return result


def create_group(user_id: int, name: str, keyword: Optional[str] = None,
                 description: Optional[str] = None, icon_url: Optional[str] = None,
                 cover_url: Optional[str] = None) -> dict:
    """Create a community group."""
    if not name or not name.strip():
        raise BusinessException('圈子名称不能为空')

    if CommunityGroup.objects.filter(name=name).exists():
        raise BusinessException('圈子名称已存在')

    group = CommunityGroup.objects.create(
        id=str(uuid.uuid4()),
        name=name.strip(),
        keyword=keyword or '',
        description=description or '',
        icon_url=icon_url or '',
        cover_url=cover_url or '',
        created_by_id=user_id,
    )

    # Creator automatically joins as admin
    CommunityGroupMember.objects.create(
        id=str(uuid.uuid4()),
        group=group,
        user_id=user_id,
        role='admin',
    )

    return _group_detail_to_dict(group)


def get_group_list() -> list:
    """Get all groups."""
    groups = CommunityGroup.objects.all().order_by('-created_at')
    return [_group_to_dict(g) for g in groups]


def get_my_groups(user_id: int) -> list:
    """Get groups the current user has joined."""
    memberships = CommunityGroupMember.objects.filter(
        user_id=user_id
    ).select_related('group', 'user')

    result = []
    for m in memberships:
        item = {
            'id': m.id,
            'role': m.role,
            'joinedAt': m.joined_at.isoformat() if m.joined_at else '',
            'user': {
                'id': m.user.id,
                'username': m.user.username or '',
                'avatar': m.user.avatar or '',
            } if m.user else None,
            'group': {
                'id': m.group.id,
                'name': m.group.name or '',
                'iconUrl': m.group.icon_url or '',
                'keyword': m.group.keyword or '',
                'description': m.group.description or '',
            } if m.group else None,
        }
        result.append(item)

    return result


def get_group_detail(group_id: str) -> dict:
    """Get group detail."""
    try:
        group = CommunityGroup.objects.get(id=group_id)
    except CommunityGroup.DoesNotExist:
        raise NotFoundException('圈子不存在')

    return _group_detail_to_dict(group)


def update_group(group_id: str, user_id: int, name: Optional[str] = None,
                 keyword: Optional[str] = None, description: Optional[str] = None,
                 icon_url: Optional[str] = None, cover_url: Optional[str] = None) -> dict:
    """Update a group (admin only)."""
    try:
        group = CommunityGroup.objects.get(id=group_id)
    except CommunityGroup.DoesNotExist:
        raise NotFoundException('圈子不存在')

    # Check permission
    membership = CommunityGroupMember.objects.filter(
        group_id=group_id, user_id=user_id
    ).first()
    if not membership or membership.role != 'admin':
        raise ForbiddenException('只有管理员可以编辑圈子')

    if name is not None and name.strip():
        if name != group.name and CommunityGroup.objects.filter(name=name).exists():
            raise BusinessException('圈子名称已存在')
        group.name = name.strip()
    if keyword is not None:
        group.keyword = keyword
    if description is not None:
        group.description = description
    if icon_url is not None:
        group.icon_url = icon_url
    if cover_url is not None:
        group.cover_url = cover_url

    group.save()
    return _group_detail_to_dict(group)


def delete_group(group_id: str, user_id: int) -> None:
    """Delete a group (admin only)."""
    try:
        group = CommunityGroup.objects.get(id=group_id)
    except CommunityGroup.DoesNotExist:
        raise NotFoundException('圈子不存在')

    if group.created_by_id != user_id:
        raise ForbiddenException('只有创建者可以删除圈子')

    group.delete()


def join_group(group_id: str, user_id: int) -> None:
    """Join a group."""
    try:
        CommunityGroup.objects.get(id=group_id)
    except CommunityGroup.DoesNotExist:
        raise NotFoundException('圈子不存在')

    if CommunityGroupMember.objects.filter(group_id=group_id, user_id=user_id).exists():
        raise BusinessException('已经加入该圈子')

    CommunityGroupMember.objects.create(
        id=str(uuid.uuid4()),
        group_id=group_id,
        user_id=user_id,
        role='member',
    )


def quit_group(group_id: str, user_id: int) -> None:
    """Quit a group."""
    membership = CommunityGroupMember.objects.filter(
        group_id=group_id, user_id=user_id
    ).first()

    if not membership:
        raise BusinessException('未加入该圈子')

    if membership.role == 'admin':
        # Check if there are other admins
        admin_count = CommunityGroupMember.objects.filter(
            group_id=group_id, role='admin'
        ).exclude(user_id=user_id).count()
        if admin_count == 0:
            raise BusinessException('你是唯一管理员，请先转让管理权限再退出')

    membership.delete()


def get_group_members(group_id: str) -> list:
    """Get members of a group."""
    members = CommunityGroupMember.objects.filter(
        group_id=group_id
    ).select_related('user')

    result = []
    for m in members:
        result.append({
            'id': m.id,
            'role': m.role,
            'joinedAt': m.joined_at.isoformat() if m.joined_at else '',
            'user': {
                'id': m.user.id,
                'username': m.user.username or '',
                'avatar': m.user.avatar or '',
            } if m.user else {'id': 0, 'username': '未知'},
        })

    return result


def get_group_member_count(group_id: str) -> dict:
    """Get member count for a group."""
    count = CommunityGroupMember.objects.filter(group_id=group_id).count()
    return {'count': count}


def check_group_membership(group_id: str, user_id: int) -> dict:
    """Check if user is a member of the group."""
    is_member = CommunityGroupMember.objects.filter(
        group_id=group_id, user_id=user_id
    ).exists()
    return {'member': is_member}


def remove_group_member(group_id: str, member_id: str, user_id: int) -> None:
    """Remove a member from a group (admin only)."""
    membership = CommunityGroupMember.objects.filter(
        group_id=group_id, user_id=user_id
    ).first()
    if not membership or membership.role != 'admin':
        raise ForbiddenException('只有管理员可以移除成员')

    target = CommunityGroupMember.objects.filter(id=member_id).first()
    if not target:
        raise NotFoundException('成员不存在')

    if target.role == 'admin':
        raise ForbiddenException('不能移除管理员')

    target.delete()


def update_group_member_role(group_id: str, member_id: str, user_id: int, role: str) -> dict:
    """Update a member's role (admin only)."""
    membership = CommunityGroupMember.objects.filter(
        group_id=group_id, user_id=user_id
    ).first()
    if not membership or membership.role != 'admin':
        raise ForbiddenException('只有管理员可以修改成员角色')

    target = CommunityGroupMember.objects.filter(id=member_id).first()
    if not target:
        raise NotFoundException('成员不存在')

    old_role = target.role
    target.role = role
    target.save(update_fields=['role'])

    return {
        'memberId': member_id,
        'oldRole': old_role,
        'newRole': role,
        'message': '角色修改成功',
    }


# ═══════════════════════════════════════════════════════════════
#  Likes
# ═══════════════════════════════════════════════════════════════


def like_post(post_id: str, user_id: int) -> None:
    """Like a post."""
    try:
        CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        raise NotFoundException('帖子不存在')

    _, created = CommunityPostLike.objects.get_or_create(
        post_id=post_id,
        user_id=user_id,
        defaults={'id': str(uuid.uuid4())},
    )
    if created:
        CommunityPost.objects.filter(id=post_id).update(
            likes_count=CommunityPostLike.objects.filter(post_id=post_id).count()
        )


def unlike_post(post_id: str, user_id: int) -> None:
    """Unlike a post."""
    deleted, _ = CommunityPostLike.objects.filter(
        post_id=post_id, user_id=user_id
    ).delete()
    if deleted:
        CommunityPost.objects.filter(id=post_id).update(
            likes_count=CommunityPostLike.objects.filter(post_id=post_id).count()
        )


def get_post_like_count(post_id: str) -> dict:
    """Get like count for a post."""
    count = CommunityPostLike.objects.filter(post_id=post_id).count()
    return {'count': count}


def check_post_liked(post_id: str, user_id: int) -> dict:
    """Check if user has liked a post."""
    liked = CommunityPostLike.objects.filter(
        post_id=post_id, user_id=user_id
    ).exists()
    return {'liked': liked}


def like_comment(comment_id: str, user_id: int) -> None:
    """Like a comment."""
    try:
        CommunityComment.objects.get(id=comment_id)
    except CommunityComment.DoesNotExist:
        raise NotFoundException('评论不存在')

    _, created = CommunityCommentLike.objects.get_or_create(
        comment_id=comment_id,
        user_id=user_id,
        defaults={'id': str(uuid.uuid4())},
    )
    if created:
        CommunityComment.objects.filter(id=comment_id).update(
            likes_count=CommunityCommentLike.objects.filter(comment_id=comment_id).count()
        )


def unlike_comment(comment_id: str, user_id: int) -> None:
    """Unlike a comment."""
    deleted, _ = CommunityCommentLike.objects.filter(
        comment_id=comment_id, user_id=user_id
    ).delete()
    if deleted:
        CommunityComment.objects.filter(id=comment_id).update(
            likes_count=CommunityCommentLike.objects.filter(comment_id=comment_id).count()
        )


def get_comment_like_count(comment_id: str) -> dict:
    """Get like count for a comment."""
    count = CommunityCommentLike.objects.filter(comment_id=comment_id).count()
    return {'count': count}


def check_comment_liked(comment_id: str, user_id: int) -> dict:
    """Check if user has liked a comment."""
    liked = CommunityCommentLike.objects.filter(
        comment_id=comment_id, user_id=user_id
    ).exists()
    return {'liked': liked}


# ═══════════════════════════════════════════════════════════════
#  Follows
# ═══════════════════════════════════════════════════════════════


def follow_user(follower_id: int, following_id: int) -> None:
    """Follow a user."""
    if follower_id == following_id:
        raise BusinessException('不能关注自己')

    user = User.objects.filter(id=following_id).first()
    if not user:
        raise NotFoundException('用户不存在')

    _, created = UserFollow.objects.get_or_create(
        follower_id=follower_id,
        following_id=following_id,
        defaults={'id': str(uuid.uuid4())},
    )
    if created:
        _sync_follow_counts(following_id)


def unfollow_user(follower_id: int, following_id: int) -> None:
    """Unfollow a user."""
    deleted, _ = UserFollow.objects.filter(
        follower_id=follower_id, following_id=following_id
    ).delete()
    if deleted:
        _sync_follow_counts(following_id)


def _sync_follow_counts(user_id: int) -> None:
    """Sync the denormalized follow counts on the User model."""
    following_count = UserFollow.objects.filter(follower_id=user_id).count()
    followers_count = UserFollow.objects.filter(following_id=user_id).count()
    User.objects.filter(id=user_id).update(
        following_count=following_count,
        followers_count=followers_count,
    )


def get_my_following(user_id: int) -> list:
    """Get users I follow."""
    follows = UserFollow.objects.filter(
        follower_id=user_id
    ).select_related('following')

    result = []
    for f in follows:
        u = f.following
        result.append({
            'id': f.id,
            'followingId': u.id if u else 0,
            'followingName': u.username if u else '已注销',
            'followingAvatar': u.avatar if u else '',
            'createdAt': f.created_at.isoformat() if f.created_at else '',
        })
    return result


def get_my_followers(user_id: int) -> list:
    """Get my followers."""
    follows = UserFollow.objects.filter(
        following_id=user_id
    ).select_related('follower')

    result = []
    for f in follows:
        u = f.follower
        result.append({
            'id': f.id,
            'followerId': u.id if u else 0,
            'followerName': u.username if u else '已注销',
            'followerAvatar': u.avatar if u else '',
            'createdAt': f.created_at.isoformat() if f.created_at else '',
        })
    return result


def get_my_following_count(user_id: int) -> dict:
    """Get count of users I follow."""
    count = UserFollow.objects.filter(follower_id=user_id).count()
    return {'count': count}


def get_my_followers_count(user_id: int) -> dict:
    """Get count of my followers."""
    count = UserFollow.objects.filter(following_id=user_id).count()
    return {'count': count}


def check_following(follower_id: int, following_id: int) -> dict:
    """Check if I'm following a user."""
    following = UserFollow.objects.filter(
        follower_id=follower_id, following_id=following_id
    ).exists()
    return {'following': following}


def get_user_following(user_id: int, target_user_id: int) -> list:
    """Get users a specific user follows."""
    follows = UserFollow.objects.filter(
        follower_id=target_user_id
    ).select_related('following')

    result = []
    for f in follows:
        u = f.following
        result.append({
            'id': f.id,
            'followingId': u.id if u else 0,
            'followingName': u.username if u else '已注销',
            'followingAvatar': u.avatar if u else '',
            'createdAt': f.created_at.isoformat() if f.created_at else '',
        })
    return result


def get_user_followers(user_id: int, target_user_id: int) -> list:
    """Get followers of a specific user."""
    follows = UserFollow.objects.filter(
        following_id=target_user_id
    ).select_related('follower')

    result = []
    for f in follows:
        u = f.follower
        result.append({
            'id': f.id,
            'followerId': u.id if u else 0,
            'followerName': u.username if u else '已注销',
            'followerAvatar': u.avatar if u else '',
            'createdAt': f.created_at.isoformat() if f.created_at else '',
        })
    return result


def get_user_following_count(target_user_id: int) -> dict:
    """Get count of users a specific user follows."""
    count = UserFollow.objects.filter(follower_id=target_user_id).count()
    return {'count': count}


def get_user_followers_count(target_user_id: int) -> dict:
    """Get follower count of a specific user."""
    count = UserFollow.objects.filter(following_id=target_user_id).count()
    return {'count': count}


def get_recommend_users(current_user_id: int) -> list:
    """Get recommended users to follow."""
    following_ids = UserFollow.objects.filter(
        follower_id=current_user_id
    ).values_list('following_id', flat=True)

    # Exclude self and already-followed users
    exclude_ids = list(following_ids) + [current_user_id]

    users = User.objects.exclude(id__in=exclude_ids).filter(
        username__isnull=False
    ).exclude(username='').order_by('-followers_count', '-likes_count')[:5]

    result = []
    for u in users:
        result.append({
            'id': u.id,
            'name': u.username or '',
            'avatar': u.avatar or '',
            'desc': u.bio or u.position or '',
            'isFollowed': False,
        })

    return result
