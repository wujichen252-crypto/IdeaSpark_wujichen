"""
Community API router — Posts, Comments, Groups, Likes, Follows.
Maps Java: com.ideaspark.project.controller.*
"""
import logging

from django.http import HttpRequest
from ninja import Router

from apps.accounts.auth import AuthBearer, OptionalAuthBearer, get_user_id
from apps.community import services
from apps.community.schemas import (
    CreatePostIn, UpdatePostIn,
    CreateCommentIn, UpdateCommentIn,
    CreateGroupIn, UpdateGroupIn, UpdateGroupMemberRoleIn,
)
from common.response import ApiResponseData

logger = logging.getLogger(__name__)

router = Router()


# ═══════════════════════════════════════════════════════════════
#  Posts — feed routes BEFORE parameterized {post_id} routes
# ═══════════════════════════════════════════════════════════════

@router.get('/api/community/posts/feed/latest', auth=OptionalAuthBearer())
def latest_posts(request: HttpRequest):
    """获取最新帖子列表"""
    user_id = get_user_id(request)
    posts = services.get_latest_posts(user_id)
    return ApiResponseData.ok(data=posts)


@router.get('/api/community/posts/feed/recommend', auth=OptionalAuthBearer())
def recommend_posts(request: HttpRequest):
    """获取推荐帖子列表（按热度排序）"""
    user_id = get_user_id(request)
    posts = services.get_recommend_posts(user_id)
    return ApiResponseData.ok(data=posts)


@router.get('/api/community/posts/feed/following', auth=AuthBearer())
def following_posts(request: HttpRequest):
    """获取关注用户的帖子列表"""
    user_id = request.user_id
    posts = services.get_following_posts(user_id)
    return ApiResponseData.ok(data=posts)


@router.get('/api/community/posts/user/{target_user_id}', auth=OptionalAuthBearer())
def user_posts(request: HttpRequest, target_user_id: int):
    """获取指定用户的帖子列表"""
    user_id = get_user_id(request)
    posts = services.get_user_posts(user_id, target_user_id)
    return ApiResponseData.ok(data=posts)


@router.get('/api/community/posts', auth=OptionalAuthBearer())
def post_list(request: HttpRequest, channel: str = None):
    """获取帖子列表（可按频道筛选）"""
    user_id = get_user_id(request)
    posts = services.get_post_list(channel, user_id)
    return ApiResponseData.ok(data=posts)


@router.post('/api/community/posts', auth=AuthBearer())
def create_post(request: HttpRequest, payload: CreatePostIn):
    """创建帖子"""
    user_id = request.user_id
    post = services.create_post(
        user_id=user_id,
        title=payload.title,
        content=payload.content,
        channel=payload.channel or '',
        images=payload.images,
        tags=payload.tags,
        visibility=payload.visibility or 'PUBLIC',
        project_id=payload.projectId,
        group_id=payload.groupId,
    )
    return ApiResponseData.created(data=post, message='发布成功')


@router.get('/api/community/posts/{post_id}', auth=OptionalAuthBearer())
def post_detail(request: HttpRequest, post_id: str):
    """获取帖子详情"""
    user_id = get_user_id(request)
    try:
        post = services.get_post_detail(post_id, user_id)
        return ApiResponseData.ok(data=post)
    except Exception:
        return ApiResponseData.error(message='这条动态不存在或已被删除。', status=404)


@router.put('/api/community/posts/{post_id}', auth=AuthBearer())
def update_post(request: HttpRequest, post_id: str, payload: UpdatePostIn):
    """更新帖子"""
    user_id = request.user_id
    post = services.update_post(
        post_id=post_id, user_id=user_id,
        title=payload.title, content=payload.content,
        images=payload.images, tags=payload.tags,
        visibility=payload.visibility,
    )
    return ApiResponseData.ok(data=post, message='更新成功')


@router.delete('/api/community/posts/{post_id}', auth=AuthBearer())
def delete_post(request: HttpRequest, post_id: str):
    """删除帖子"""
    user_id = request.user_id
    services.delete_post(post_id, user_id)
    return ApiResponseData.ok(message='删除成功')


@router.put('/api/community/posts/{post_id}/likes', auth=OptionalAuthBearer())
def update_post_likes(request: HttpRequest, post_id: str, count: int = 0):
    """更新帖子点赞数"""
    result = services.update_post_likes(post_id, count)
    return ApiResponseData.ok(data=result)


@router.put('/api/community/posts/{post_id}/comments', auth=OptionalAuthBearer())
def update_post_comments(request: HttpRequest, post_id: str, count: int = 0):
    """更新帖子评论数"""
    result = services.update_post_comments(post_id, count)
    return ApiResponseData.ok(data=result)


# ═══════════════════════════════════════════════════════════════
#  Comments
# ═══════════════════════════════════════════════════════════════

@router.post('/api/community/comments', auth=AuthBearer())
def create_comment(request: HttpRequest, payload: CreateCommentIn):
    """创建评论"""
    user_id = request.user_id
    comment = services.create_comment(
        user_id=user_id,
        post_id=payload.postId,
        content=payload.content,
        parent_id=payload.parentId,
    )
    return ApiResponseData.created(data=comment, message='评论成功')


@router.get('/api/community/comments/post/{post_id}', auth=OptionalAuthBearer())
def post_comments(request: HttpRequest, post_id: str):
    """获取帖子的一级评论"""
    user_id = get_user_id(request)
    comments = services.get_post_comments(post_id, user_id)
    return ApiResponseData.ok(data=comments)


@router.get('/api/community/comments/post/{post_id}/all', auth=OptionalAuthBearer())
def post_all_comments(request: HttpRequest, post_id: str):
    """获取帖子的所有评论（含回复）"""
    user_id = get_user_id(request)
    comments = services.get_all_post_comments(post_id, user_id)
    return ApiResponseData.ok(data=comments)


@router.get('/api/community/comments/replies/{parent_id}', auth=OptionalAuthBearer())
def comment_replies(request: HttpRequest, parent_id: str):
    """获取评论的回复列表"""
    user_id = get_user_id(request)
    replies = services.get_comment_replies(parent_id, user_id)
    return ApiResponseData.ok(data=replies)


@router.put('/api/community/comments/{comment_id}', auth=AuthBearer())
def update_comment(request: HttpRequest, comment_id: str, payload: UpdateCommentIn):
    """更新评论"""
    user_id = request.user_id
    comment = services.update_comment(comment_id, user_id, payload.content)
    return ApiResponseData.ok(data=comment, message='更新成功')


@router.delete('/api/community/comments/{comment_id}', auth=AuthBearer())
def delete_comment(request: HttpRequest, comment_id: str):
    """删除评论"""
    user_id = request.user_id
    services.delete_comment(comment_id, user_id)
    return ApiResponseData.ok(message='删除成功')


@router.put('/api/community/comments/{comment_id}/likes', auth=OptionalAuthBearer())
def update_comment_likes(request: HttpRequest, comment_id: str, count: int = 0):
    """更新评论点赞数"""
    comment = services.update_comment_likes(comment_id, count)
    return ApiResponseData.ok(data=comment)


# ═══════════════════════════════════════════════════════════════
#  Groups — static routes BEFORE {group_id}
# ═══════════════════════════════════════════════════════════════

@router.get('/api/community/groups/my', auth=AuthBearer())
def my_groups(request: HttpRequest):
    """获取我加入的圈子列表"""
    user_id = request.user_id
    groups = services.get_my_groups(user_id)
    return ApiResponseData.ok(data=groups)


@router.get('/api/community/groups', auth=OptionalAuthBearer())
def group_list(request: HttpRequest):
    """获取圈子列表"""
    groups = services.get_group_list()
    return ApiResponseData.ok(data=groups)


@router.post('/api/community/groups', auth=AuthBearer())
def create_group(request: HttpRequest, payload: CreateGroupIn):
    """创建圈子"""
    user_id = request.user_id
    group = services.create_group(
        user_id=user_id,
        name=payload.name,
        keyword=payload.keyword,
        description=payload.description,
        icon_url=payload.iconUrl,
        cover_url=payload.coverUrl,
    )
    return ApiResponseData.created(data=group, message='创建成功')


@router.get('/api/community/groups/{group_id}', auth=OptionalAuthBearer())
def group_detail(request: HttpRequest, group_id: str):
    """获取圈子详情"""
    group = services.get_group_detail(group_id)
    return ApiResponseData.ok(data=group)


@router.put('/api/community/groups/{group_id}', auth=AuthBearer())
def update_group(request: HttpRequest, group_id: str, payload: UpdateGroupIn):
    """更新圈子"""
    user_id = request.user_id
    group = services.update_group(
        group_id=group_id, user_id=user_id,
        name=payload.name, keyword=payload.keyword,
        description=payload.description,
        icon_url=payload.iconUrl, cover_url=payload.coverUrl,
    )
    return ApiResponseData.ok(data=group, message='更新成功')


@router.delete('/api/community/groups/{group_id}', auth=AuthBearer())
def delete_group(request: HttpRequest, group_id: str):
    """删除圈子"""
    user_id = request.user_id
    services.delete_group(group_id, user_id)
    return ApiResponseData.ok(message='删除成功')


@router.post('/api/community/groups/{group_id}/join', auth=AuthBearer())
def join_group(request: HttpRequest, group_id: str):
    """加入圈子"""
    user_id = request.user_id
    services.join_group(group_id, user_id)
    return ApiResponseData.ok(message='加入成功')


@router.delete('/api/community/groups/{group_id}/join', auth=AuthBearer())
def quit_group(request: HttpRequest, group_id: str):
    """退出圈子"""
    user_id = request.user_id
    services.quit_group(group_id, user_id)
    return ApiResponseData.ok(message='退出成功')


@router.get('/api/community/groups/{group_id}/members', auth=OptionalAuthBearer())
def group_members(request: HttpRequest, group_id: str):
    """获取圈子成员列表"""
    members = services.get_group_members(group_id)
    return ApiResponseData.ok(data=members)


@router.get('/api/community/groups/{group_id}/members/count', auth=OptionalAuthBearer())
def group_member_count(request: HttpRequest, group_id: str):
    """获取圈子成员数"""
    count = services.get_group_member_count(group_id)
    return ApiResponseData.ok(data=count)


@router.get('/api/community/groups/{group_id}/check', auth=AuthBearer())
def check_group_membership(request: HttpRequest, group_id: str):
    """检查当前用户是否在圈子中"""
    user_id = request.user_id
    result = services.check_group_membership(group_id, user_id)
    return ApiResponseData.ok(data=result)


@router.delete('/api/community/groups/{group_id}/members/{member_id}', auth=AuthBearer())
def remove_group_member(request: HttpRequest, group_id: str, member_id: str):
    """移除圈子成员"""
    user_id = request.user_id
    services.remove_group_member(group_id, member_id, user_id)
    return ApiResponseData.ok(data={'memberId': member_id, 'message': '移除成功'})


@router.put('/api/community/groups/{group_id}/members/{member_id}/role', auth=AuthBearer())
def update_group_member_role(request: HttpRequest, group_id: str,
                              member_id: str, payload: UpdateGroupMemberRoleIn):
    """更新圈子成员角色"""
    user_id = request.user_id
    result = services.update_group_member_role(group_id, member_id, user_id, payload.role)
    return ApiResponseData.ok(data=result)


# ═══════════════════════════════════════════════════════════════
#  Likes
# ═══════════════════════════════════════════════════════════════

@router.post('/api/community/likes/post/{post_id}', auth=AuthBearer())
def like_post(request: HttpRequest, post_id: str):
    """点赞帖子"""
    user_id = request.user_id
    services.like_post(post_id, user_id)
    return ApiResponseData.ok(message='点赞成功')


@router.delete('/api/community/likes/post/{post_id}', auth=AuthBearer())
def unlike_post(request: HttpRequest, post_id: str):
    """取消点赞帖子"""
    user_id = request.user_id
    services.unlike_post(post_id, user_id)
    return ApiResponseData.ok(message='取消点赞')


@router.get('/api/community/likes/post/{post_id}/count', auth=OptionalAuthBearer())
def post_like_count(request: HttpRequest, post_id: str):
    """获取帖子点赞数"""
    result = services.get_post_like_count(post_id)
    return ApiResponseData.ok(data=result)


@router.get('/api/community/likes/post/{post_id}/check', auth=AuthBearer())
def check_post_liked(request: HttpRequest, post_id: str):
    """检查是否已点赞帖子"""
    user_id = request.user_id
    result = services.check_post_liked(post_id, user_id)
    return ApiResponseData.ok(data=result)


@router.post('/api/community/likes/comment/{comment_id}', auth=AuthBearer())
def like_comment(request: HttpRequest, comment_id: str):
    """点赞评论"""
    user_id = request.user_id
    services.like_comment(comment_id, user_id)
    return ApiResponseData.ok(message='点赞成功')


@router.delete('/api/community/likes/comment/{comment_id}', auth=AuthBearer())
def unlike_comment(request: HttpRequest, comment_id: str):
    """取消点赞评论"""
    user_id = request.user_id
    services.unlike_comment(comment_id, user_id)
    return ApiResponseData.ok(message='取消点赞')


@router.get('/api/community/likes/comment/{comment_id}/count', auth=OptionalAuthBearer())
def comment_like_count(request: HttpRequest, comment_id: str):
    """获取评论点赞数"""
    result = services.get_comment_like_count(comment_id)
    return ApiResponseData.ok(data=result)


@router.get('/api/community/likes/comment/{comment_id}/check', auth=AuthBearer())
def check_comment_liked(request: HttpRequest, comment_id: str):
    """检查是否已点赞评论"""
    user_id = request.user_id
    result = services.check_comment_liked(comment_id, user_id)
    return ApiResponseData.ok(data=result)


# ═══════════════════════════════════════════════════════════════
#  Follows — static routes BEFORE parameterized {user_id}
#  NOTE: These are registered under /api/follows/...
# ═══════════════════════════════════════════════════════════════

@router.get('/api/follows/my/following', auth=AuthBearer())
def my_following(request: HttpRequest):
    """获取我的关注列表"""
    user_id = request.user_id
    result = services.get_my_following(user_id)
    return ApiResponseData.ok(data=result)


@router.get('/api/follows/my/followers', auth=AuthBearer())
def my_followers(request: HttpRequest):
    """获取我的粉丝列表"""
    user_id = request.user_id
    result = services.get_my_followers(user_id)
    return ApiResponseData.ok(data=result)


@router.get('/api/follows/my/following/count', auth=AuthBearer())
def my_following_count(request: HttpRequest):
    """获取我的关注数"""
    user_id = request.user_id
    result = services.get_my_following_count(user_id)
    return ApiResponseData.ok(data=result)


@router.get('/api/follows/my/followers/count', auth=AuthBearer())
def my_followers_count(request: HttpRequest):
    """获取我的粉丝数"""
    user_id = request.user_id
    result = services.get_my_followers_count(user_id)
    return ApiResponseData.ok(data=result)


@router.get('/api/follows/check/{following_id}', auth=AuthBearer())
def check_following(request: HttpRequest, following_id: int):
    """检查是否已关注某用户"""
    user_id = request.user_id
    result = services.check_following(user_id, following_id)
    return ApiResponseData.ok(data=result)


@router.get('/api/follows/recommend', auth=AuthBearer())
def recommend_users(request: HttpRequest):
    """获取推荐关注用户"""
    user_id = request.user_id
    users = services.get_recommend_users(user_id)
    return ApiResponseData.ok(data=users)


@router.get('/api/follows/user/{target_user_id}/following', auth=OptionalAuthBearer())
def user_following(request: HttpRequest, target_user_id: int):
    """获取指定用户的关注列表"""
    user_id = get_user_id(request)
    result = services.get_user_following(user_id, target_user_id)
    return ApiResponseData.ok(data=result)


@router.get('/api/follows/user/{target_user_id}/followers', auth=OptionalAuthBearer())
def user_followers(request: HttpRequest, target_user_id: int):
    """获取指定用户的粉丝列表"""
    user_id = get_user_id(request)
    result = services.get_user_followers(user_id, target_user_id)
    return ApiResponseData.ok(data=result)


@router.get('/api/follows/user/{target_user_id}/following/count', auth=OptionalAuthBearer())
def user_following_count(request: HttpRequest, target_user_id: int):
    """获取指定用户的关注数"""
    result = services.get_user_following_count(target_user_id)
    return ApiResponseData.ok(data=result)


@router.get('/api/follows/user/{target_user_id}/followers/count', auth=OptionalAuthBearer())
def user_followers_count(request: HttpRequest, target_user_id: int):
    """获取指定用户的粉丝数"""
    result = services.get_user_followers_count(target_user_id)
    return ApiResponseData.ok(data=result)


@router.post('/api/follows/{following_id}', auth=AuthBearer())
def follow_user(request: HttpRequest, following_id: int):
    """关注用户"""
    user_id = request.user_id
    services.follow_user(user_id, following_id)
    return ApiResponseData.ok(message='关注成功')


@router.delete('/api/follows/{following_id}', auth=AuthBearer())
def unfollow_user(request: HttpRequest, following_id: int):
    """取消关注"""
    user_id = request.user_id
    services.unfollow_user(user_id, following_id)
    return ApiResponseData.ok(message='已取消关注')
