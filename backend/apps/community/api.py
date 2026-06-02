"""
Community API router — posts, comments, groups, likes, follows.
Maps Java controllers:
  - CommunityPostController
  - CommunityCommentController
  - CommunityGroupController
  - CommunityLikeController
  - UserFollowController
"""
import logging

from django.http import HttpRequest
from ninja import Router

from apps.accounts.auth import AuthBearer, OptionalAuthBearer
from apps.community.schemas import (
    CreatePostIn, UpdatePostIn,
    CreateCommentIn, UpdateCommentIn,
    CreateGroupIn, UpdateGroupIn, UpdateGroupMemberRoleIn,
)
from apps.community import services
from common.response import ApiResponseData

logger = logging.getLogger(__name__)

router = Router()


# ═══════════════════════════════════════════════════════════
#  Posts
# ═══════════════════════════════════════════════════════════

@router.post('/api/community/posts', auth=AuthBearer())
def create_post(request: HttpRequest, payload: CreatePostIn):
    """创建帖子"""
    user_id = request.user_id
    result = services.create_post(user_id, payload)
    return ApiResponseData.ok(data=result, message='创建成功')


@router.get('/api/community/posts', auth=OptionalAuthBearer())
def list_posts(request: HttpRequest, channel: str = None):
    """获取帖子列表"""
    user_id = getattr(request, 'user_id', 0) or 0
    result = services.get_all_posts(channel, user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/posts/feed/latest', auth=OptionalAuthBearer())
def latest_posts(request: HttpRequest):
    """获取最新帖子"""
    user_id = getattr(request, 'user_id', 0) or 0
    result = services.get_latest_posts(user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/posts/feed/recommend', auth=OptionalAuthBearer())
def recommend_posts(request: HttpRequest):
    """获取推荐帖子"""
    user_id = getattr(request, 'user_id', 0) or 0
    result = services.get_recommend_posts(user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/posts/feed/following', auth=AuthBearer())
def following_posts(request: HttpRequest):
    """获取关注用户的帖子"""
    user_id = request.user_id
    result = services.get_following_posts(user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/posts/user/{user_id}', auth=OptionalAuthBearer())
def user_posts(request: HttpRequest, user_id: int):
    """获取指定用户的帖子"""
    current_user_id = getattr(request, 'user_id', 0) or 0
    result = services.get_user_posts(user_id, current_user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/posts/{post_id}', auth=OptionalAuthBearer())
def post_detail(request: HttpRequest, post_id: str):
    """获取帖子详情"""
    user_id = getattr(request, 'user_id', 0) or 0
    result = services.get_post_detail(post_id, user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.put('/api/community/posts/{post_id}', auth=AuthBearer())
def update_post(request: HttpRequest, post_id: str, payload: UpdatePostIn):
    """更新帖子"""
    user_id = request.user_id
    result = services.update_post(post_id, user_id, payload)
    return ApiResponseData.ok(data=result, message='更新成功')


@router.delete('/api/community/posts/{post_id}', auth=AuthBearer())
def delete_post(request: HttpRequest, post_id: str):
    """删除帖子"""
    user_id = request.user_id
    services.delete_post(post_id, user_id)
    return ApiResponseData.ok(message='删除成功')


@router.put('/api/community/posts/{post_id}/likes', auth=OptionalAuthBearer())
def update_post_likes(request: HttpRequest, post_id: str, count: int):
    """更新帖子点赞数"""
    services.update_post_likes_count(post_id, count)
    return ApiResponseData.ok(message='更新成功')


@router.put('/api/community/posts/{post_id}/comments', auth=OptionalAuthBearer())
def update_post_comments(request: HttpRequest, post_id: str, count: int):
    """更新帖子评论数"""
    result = services.update_post_comments_count(post_id, count)
    return ApiResponseData.ok(data=result, message='更新成功')


# ═══════════════════════════════════════════════════════════
#  Comments — specific routes BEFORE parameterized
# ═══════════════════════════════════════════════════════════

@router.post('/api/community/comments', auth=AuthBearer())
def create_comment(request: HttpRequest, payload: CreateCommentIn):
    """创建评论"""
    user_id = request.user_id
    result = services.create_comment(user_id, payload)
    return ApiResponseData.ok(data=result, message='评论成功')


@router.get('/api/community/comments/post/{post_id}', auth=OptionalAuthBearer())
def post_comments(request: HttpRequest, post_id: str):
    """获取帖子的一级评论"""
    user_id = getattr(request, 'user_id', 0) or 0
    result = services.get_comments_by_post(post_id, user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/comments/post/{post_id}/all', auth=OptionalAuthBearer())
def all_post_comments(request: HttpRequest, post_id: str):
    """获取帖子的所有评论（含回复）"""
    user_id = getattr(request, 'user_id', 0) or 0
    result = services.get_all_comments_by_post(post_id, user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/comments/replies/{parent_id}', auth=OptionalAuthBearer())
def comment_replies(request: HttpRequest, parent_id: str):
    """获取评论的回复"""
    user_id = getattr(request, 'user_id', 0) or 0
    result = services.get_replies_by_parent(parent_id, user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.put('/api/community/comments/{comment_id}', auth=AuthBearer())
def update_comment(request: HttpRequest, comment_id: str, payload: UpdateCommentIn):
    """更新评论"""
    user_id = request.user_id
    result = services.update_comment(comment_id, user_id, payload.content)
    return ApiResponseData.ok(data=result, message='更新成功')


@router.delete('/api/community/comments/{comment_id}', auth=AuthBearer())
def delete_comment(request: HttpRequest, comment_id: str):
    """删除评论"""
    user_id = request.user_id
    services.delete_comment(comment_id, user_id)
    return ApiResponseData.ok(message='删除成功')


@router.put('/api/community/comments/{comment_id}/likes', auth=OptionalAuthBearer())
def update_comment_likes(request: HttpRequest, comment_id: str, count: int):
    """更新评论点赞数"""
    result = services.update_comment_likes_count(comment_id, count)
    return ApiResponseData.ok(data=result, message='更新成功')


# ═══════════════════════════════════════════════════════════
#  Groups — my before {group_id}
# ═══════════════════════════════════════════════════════════

@router.get('/api/community/groups/my', auth=AuthBearer())
def my_groups(request: HttpRequest):
    """获取我加入的圈子"""
    user_id = request.user_id
    result = services.get_my_groups(user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.post('/api/community/groups', auth=AuthBearer())
def create_group(request: HttpRequest, payload: CreateGroupIn):
    """创建圈子"""
    user_id = request.user_id
    result = services.create_group(user_id, payload)
    return ApiResponseData.ok(data=result, message='创建成功')


@router.get('/api/community/groups', auth=OptionalAuthBearer())
def list_groups(request: HttpRequest):
    """获取圈子列表"""
    result = services.get_all_groups()
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/groups/{group_id}', auth=OptionalAuthBearer())
def group_detail(request: HttpRequest, group_id: str):
    """获取圈子详情"""
    result = services.get_group_detail(group_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.put('/api/community/groups/{group_id}', auth=AuthBearer())
def update_group(request: HttpRequest, group_id: str, payload: UpdateGroupIn):
    """更新圈子"""
    user_id = request.user_id
    result = services.update_group(group_id, user_id, payload)
    return ApiResponseData.ok(data=result, message='更新成功')


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


@router.get('/api/community/groups/{group_id}/members/count', auth=OptionalAuthBearer())
def group_member_count(request: HttpRequest, group_id: str):
    """获取圈子成员数"""
    result = services.get_group_member_count(group_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/groups/{group_id}/check', auth=OptionalAuthBearer())
def check_membership(request: HttpRequest, group_id: str):
    """检查当前用户是否在圈子中"""
    user_id = getattr(request, 'user_id', 0) or 0
    result = services.check_group_membership(group_id, user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/groups/{group_id}/members', auth=OptionalAuthBearer())
def group_members(request: HttpRequest, group_id: str):
    """获取圈子成员列表"""
    result = services.get_group_members(group_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.delete('/api/community/groups/{group_id}/members/{member_id}', auth=AuthBearer())
def remove_group_member(request: HttpRequest, group_id: str, member_id: str):
    """移除圈子成员"""
    user_id = request.user_id
    result = services.remove_group_member(group_id, member_id, user_id)
    return ApiResponseData.ok(data=result, message='移除成功')


@router.put('/api/community/groups/{group_id}/members/{member_id}/role', auth=AuthBearer())
def update_group_member_role(request: HttpRequest, group_id: str, member_id: str,
                              payload: UpdateGroupMemberRoleIn):
    """更新圈子成员角色"""
    user_id = request.user_id
    result = services.update_group_member_role(group_id, member_id, user_id, payload)
    return ApiResponseData.ok(data=result, message='更新成功')


# ═══════════════════════════════════════════════════════════
#  Likes — Post
# ═══════════════════════════════════════════════════════════

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
    return ApiResponseData.ok(message='取消点赞成功')


@router.get('/api/community/likes/post/{post_id}/count', auth=OptionalAuthBearer())
def post_like_count(request: HttpRequest, post_id: str):
    """获取帖子点赞数"""
    result = services.get_post_like_count(post_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/likes/post/{post_id}/check', auth=OptionalAuthBearer())
def check_post_liked(request: HttpRequest, post_id: str):
    """检查是否点赞帖子"""
    user_id = getattr(request, 'user_id', 0) or 0
    result = services.check_post_liked(post_id, user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


# ═══════════════════════════════════════════════════════════
#  Likes — Comment
# ═══════════════════════════════════════════════════════════

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
    return ApiResponseData.ok(message='取消点赞成功')


@router.get('/api/community/likes/comment/{comment_id}/count', auth=OptionalAuthBearer())
def comment_like_count(request: HttpRequest, comment_id: str):
    """获取评论点赞数"""
    result = services.get_comment_like_count(comment_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/community/likes/comment/{comment_id}/check', auth=OptionalAuthBearer())
def check_comment_liked(request: HttpRequest, comment_id: str):
    """检查是否点赞评论"""
    user_id = getattr(request, 'user_id', 0) or 0
    result = services.check_comment_liked(comment_id, user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


# ═══════════════════════════════════════════════════════════
#  Follows — specific routes BEFORE parameterized
# ═══════════════════════════════════════════════════════════

@router.get('/api/follows/recommend', auth=AuthBearer())
def recommend_users(request: HttpRequest):
    """获取推荐关注用户"""
    user_id = request.user_id
    result = services.get_recommend_users(user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/follows/my/following', auth=AuthBearer())
def my_following(request: HttpRequest):
    """获取我的关注列表"""
    user_id = request.user_id
    result = services.get_following_list(user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/follows/my/followers', auth=AuthBearer())
def my_followers(request: HttpRequest):
    """获取我的粉丝列表"""
    user_id = request.user_id
    result = services.get_follower_list(user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/follows/my/following/count', auth=AuthBearer())
def my_following_count(request: HttpRequest):
    """获取我的关注数"""
    user_id = request.user_id
    count = services.get_following_count(user_id)
    return ApiResponseData.ok(data={'count': count}, message='获取成功')


@router.get('/api/follows/my/followers/count', auth=AuthBearer())
def my_followers_count(request: HttpRequest):
    """获取我的粉丝数"""
    user_id = request.user_id
    count = services.get_follower_count(user_id)
    return ApiResponseData.ok(data={'count': count}, message='获取成功')


@router.get('/api/follows/check/{following_id}', auth=OptionalAuthBearer())
def check_follow(request: HttpRequest, following_id: int):
    """检查是否关注"""
    user_id = getattr(request, 'user_id', 0) or 0
    result = services.check_follow(user_id, following_id)
    return ApiResponseData.ok(data={'following': result}, message='获取成功')


@router.get('/api/follows/user/{user_id}/following', auth=OptionalAuthBearer())
def user_following(request: HttpRequest, user_id: int):
    """获取指定用户的关注列表"""
    result = services.get_following_list(user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/follows/user/{user_id}/followers', auth=OptionalAuthBearer())
def user_followers(request: HttpRequest, user_id: int):
    """获取指定用户的粉丝列表"""
    result = services.get_follower_list(user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/follows/user/{user_id}/following/count', auth=OptionalAuthBearer())
def user_following_count(request: HttpRequest, user_id: int):
    """获取指定用户的关注数"""
    count = services.get_following_count(user_id)
    return ApiResponseData.ok(data={'count': count}, message='获取成功')


@router.get('/api/follows/user/{user_id}/followers/count', auth=OptionalAuthBearer())
def user_followers_count(request: HttpRequest, user_id: int):
    """获取指定用户的粉丝数"""
    count = services.get_follower_count(user_id)
    return ApiResponseData.ok(data={'count': count}, message='获取成功')


@router.post('/api/follows/{following_id}', auth=AuthBearer())
def follow_user(request: HttpRequest, following_id: int):
    """关注用户"""
    user_id = request.user_id
    services.follow_user(user_id, following_id)
    return ApiResponseData.ok(message='关注成功')


@router.delete('/api/follows/{following_id}', auth=AuthBearer())
def unfollow_user(request: HttpRequest, following_id: int):
    """取消关注用户"""
    user_id = request.user_id
    services.unfollow_user(user_id, following_id)
    return ApiResponseData.ok(message='取消关注成功')
