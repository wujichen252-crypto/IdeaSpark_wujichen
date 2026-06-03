"""Posts API."""
import logging
from django.http import HttpRequest
from ninja import Router
from apps.accounts.auth import AuthBearer, OptionalAuthBearer, get_user_id
from apps.community.schemas import CreatePostIn, UpdatePostIn
from apps.community.services import posts as svc

logger = logging.getLogger(__name__)
router = Router()


@router.post('/api/community/posts', auth=AuthBearer())
def create_post(request: HttpRequest, payload: CreatePostIn):
    """创建帖子"""
    result = svc.create_post(request.user_id, payload)
    return {'status': 200, 'message': '创建成功', 'data': result}


@router.get('/api/community/posts', auth=OptionalAuthBearer())
def list_posts(request: HttpRequest, channel: str = None):
    """获取帖子列表"""
    result = svc.get_all_posts(channel, get_user_id(request))
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/posts/feed/latest', auth=OptionalAuthBearer())
def latest_posts(request: HttpRequest):
    """获取最新帖子"""
    result = svc.get_latest_posts(get_user_id(request))
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/posts/feed/recommend', auth=OptionalAuthBearer())
def recommend_posts(request: HttpRequest):
    """获取推荐帖子"""
    result = svc.get_recommend_posts(get_user_id(request))
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/posts/feed/following', auth=AuthBearer())
def following_posts(request: HttpRequest):
    """获取关注用户的帖子"""
    result = svc.get_following_posts(request.user_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/posts/user/{user_id}', auth=OptionalAuthBearer())
def user_posts(request: HttpRequest, user_id: int):
    """获取指定用户的帖子"""
    result = svc.get_user_posts(user_id, get_user_id(request))
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/posts/{post_id}', auth=OptionalAuthBearer())
def post_detail(request: HttpRequest, post_id: str):
    """获取帖子详情"""
    result = svc.get_post_detail(post_id, get_user_id(request))
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.put('/api/community/posts/{post_id}', auth=AuthBearer())
def update_post(request: HttpRequest, post_id: str, payload: UpdatePostIn):
    """更新帖子"""
    result = svc.update_post(post_id, request.user_id, payload)
    return {'status': 200, 'message': '更新成功', 'data': result}


@router.delete('/api/community/posts/{post_id}', auth=AuthBearer())
def delete_post(request: HttpRequest, post_id: str):
    """删除帖子"""
    svc.delete_post(post_id, request.user_id)
    return {'status': 200, 'message': '删除成功', 'data': None}



