"""Follows API."""
import logging
from django.http import HttpRequest
from ninja import Router
from apps.accounts.auth import AuthBearer, OptionalAuthBearer, get_user_id
from apps.community.services import follows as svc

logger = logging.getLogger(__name__)
router = Router()


@router.get('/api/follows/recommend', auth=AuthBearer())
def recommend_users(request: HttpRequest):
    """获取推荐关注用户"""
    result = svc.get_recommend_users(request.user_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/follows/my/following', auth=AuthBearer())
def my_following(request: HttpRequest):
    """获取我的关注列表"""
    result = svc.get_following_list(request.user_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/follows/my/followers', auth=AuthBearer())
def my_followers(request: HttpRequest):
    """获取我的粉丝列表"""
    result = svc.get_follower_list(request.user_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/follows/my/following/count', auth=AuthBearer())
def my_following_count(request: HttpRequest):
    """获取我的关注数"""
    count = svc.get_following_count(request.user_id)
    return {'status': 200, 'message': '获取成功', 'data': {'count': count}}


@router.get('/api/follows/my/followers/count', auth=AuthBearer())
def my_followers_count(request: HttpRequest):
    """获取我的粉丝数"""
    count = svc.get_follower_count(request.user_id)
    return {'status': 200, 'message': '获取成功', 'data': {'count': count}}


@router.get('/api/follows/check/{following_id}', auth=OptionalAuthBearer())
def check_follow(request: HttpRequest, following_id: int):
    """检查是否关注"""
    result = svc.check_follow(get_user_id(request), following_id)
    return {'status': 200, 'message': '获取成功', 'data': {'following': result}}


@router.get('/api/follows/user/{user_id}/following', auth=OptionalAuthBearer())
def user_following(request: HttpRequest, user_id: int):
    """获取指定用户的关注列表"""
    result = svc.get_following_list(user_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/follows/user/{user_id}/followers', auth=OptionalAuthBearer())
def user_followers(request: HttpRequest, user_id: int):
    """获取指定用户的粉丝列表"""
    result = svc.get_follower_list(user_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/follows/user/{user_id}/following/count', auth=OptionalAuthBearer())
def user_following_count(request: HttpRequest, user_id: int):
    """获取指定用户的关注数"""
    count = svc.get_following_count(user_id)
    return {'status': 200, 'message': '获取成功', 'data': {'count': count}}


@router.get('/api/follows/user/{user_id}/followers/count', auth=OptionalAuthBearer())
def user_followers_count(request: HttpRequest, user_id: int):
    """获取指定用户的粉丝数"""
    count = svc.get_follower_count(user_id)
    return {'status': 200, 'message': '获取成功', 'data': {'count': count}}


@router.post('/api/follows/{following_id}', auth=AuthBearer())
def follow_user(request: HttpRequest, following_id: int):
    """关注用户"""
    svc.follow_user(request.user_id, following_id)
    return {'status': 200, 'message': '关注成功', 'data': None}


@router.delete('/api/follows/{following_id}', auth=AuthBearer())
def unfollow_user(request: HttpRequest, following_id: int):
    """取消关注用户"""
    svc.unfollow_user(request.user_id, following_id)
    return {'status': 200, 'message': '取消关注成功', 'data': None}
