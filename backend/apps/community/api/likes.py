"""Likes API — post & comment likes."""
import logging
from django.http import HttpRequest
from ninja import Router
from apps.accounts.auth import AuthBearer, OptionalAuthBearer, get_user_id
from apps.community.services import likes as svc

logger = logging.getLogger(__name__)
router = Router()


# ── Post likes ──


@router.post('/api/community/likes/post/{post_id}', auth=AuthBearer())
def like_post(request: HttpRequest, post_id: str):
    """点赞帖子"""
    svc.like_post(post_id, request.user_id)
    return {'status': 200, 'message': '点赞成功', 'data': None}


@router.delete('/api/community/likes/post/{post_id}', auth=AuthBearer())
def unlike_post(request: HttpRequest, post_id: str):
    """取消点赞帖子"""
    svc.unlike_post(post_id, request.user_id)
    return {'status': 200, 'message': '取消点赞成功', 'data': None}


@router.get('/api/community/likes/post/{post_id}/count', auth=OptionalAuthBearer())
def post_like_count(request: HttpRequest, post_id: str):
    """获取帖子点赞数"""
    result = svc.get_post_like_count(post_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/likes/post/{post_id}/check', auth=OptionalAuthBearer())
def check_post_liked(request: HttpRequest, post_id: str):
    """检查是否点赞帖子"""
    result = svc.check_post_liked(post_id, get_user_id(request))
    return {'status': 200, 'message': '获取成功', 'data': result}


# ── Comment likes ──


@router.post('/api/community/likes/comment/{comment_id}', auth=AuthBearer())
def like_comment(request: HttpRequest, comment_id: str):
    """点赞评论"""
    svc.like_comment(comment_id, request.user_id)
    return {'status': 200, 'message': '点赞成功', 'data': None}


@router.delete('/api/community/likes/comment/{comment_id}', auth=AuthBearer())
def unlike_comment(request: HttpRequest, comment_id: str):
    """取消点赞评论"""
    svc.unlike_comment(comment_id, request.user_id)
    return {'status': 200, 'message': '取消点赞成功', 'data': None}


@router.get('/api/community/likes/comment/{comment_id}/count', auth=OptionalAuthBearer())
def comment_like_count(request: HttpRequest, comment_id: str):
    """获取评论点赞数"""
    result = svc.get_comment_like_count(comment_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/likes/comment/{comment_id}/check', auth=OptionalAuthBearer())
def check_comment_liked(request: HttpRequest, comment_id: str):
    """检查是否点赞评论"""
    result = svc.check_comment_liked(comment_id, get_user_id(request))
    return {'status': 200, 'message': '获取成功', 'data': result}
