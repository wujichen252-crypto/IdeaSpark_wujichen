"""Comments API."""
import logging
from django.http import HttpRequest
from ninja import Router
from apps.accounts.auth import AuthBearer, OptionalAuthBearer, get_user_id
from apps.community.schemas import CreateCommentIn, UpdateCommentIn
from apps.community.services import comments as svc

logger = logging.getLogger(__name__)
router = Router()


@router.post('/api/community/comments', auth=AuthBearer())
def create_comment(request: HttpRequest, payload: CreateCommentIn):
    """创建评论"""
    result = svc.create_comment(request.user_id, payload)
    return {'status': 200, 'message': '评论成功', 'data': result}


@router.get('/api/community/comments/post/{post_id}', auth=OptionalAuthBearer())
def post_comments(request: HttpRequest, post_id: str):
    """获取帖子的一级评论"""
    result = svc.get_comments_by_post(post_id, get_user_id(request))
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/comments/post/{post_id}/all', auth=OptionalAuthBearer())
def all_post_comments(request: HttpRequest, post_id: str):
    """获取帖子的所有评论（含回复）"""
    result = svc.get_all_comments_by_post(post_id, get_user_id(request))
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/comments/replies/{parent_id}', auth=OptionalAuthBearer())
def comment_replies(request: HttpRequest, parent_id: str):
    """获取评论的回复"""
    result = svc.get_replies_by_parent(parent_id, get_user_id(request))
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.put('/api/community/comments/{comment_id}', auth=AuthBearer())
def update_comment(request: HttpRequest, comment_id: str, payload: UpdateCommentIn):
    """更新评论"""
    result = svc.update_comment(comment_id, request.user_id, payload.content)
    return {'status': 200, 'message': '更新成功', 'data': result}


@router.delete('/api/community/comments/{comment_id}', auth=AuthBearer())
def delete_comment(request: HttpRequest, comment_id: str):
    """删除评论"""
    svc.delete_comment(comment_id, request.user_id)
    return {'status': 200, 'message': '删除成功', 'data': None}


@router.put('/api/community/comments/{comment_id}/likes', auth=OptionalAuthBearer())
def update_comment_likes(request: HttpRequest, comment_id: str, count: int):
    """更新评论点赞数"""
    result = svc.update_comment_likes_count(comment_id, count)
    return {'status': 200, 'message': '更新成功', 'data': result}
