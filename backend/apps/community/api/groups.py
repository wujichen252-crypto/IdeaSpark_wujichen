"""Groups API."""
import logging
from django.http import HttpRequest
from ninja import Router
from apps.accounts.auth import AuthBearer, OptionalAuthBearer, get_user_id
from apps.community.schemas import CreateGroupIn, UpdateGroupIn, UpdateGroupMemberRoleIn
from apps.community.services import groups as svc

logger = logging.getLogger(__name__)
router = Router()


@router.get('/api/community/groups/my', auth=AuthBearer())
def my_groups(request: HttpRequest):
    """获取我加入的圈子"""
    result = svc.get_my_groups(request.user_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.post('/api/community/groups', auth=AuthBearer())
def create_group(request: HttpRequest, payload: CreateGroupIn):
    """创建圈子"""
    result = svc.create_group(request.user_id, payload)
    return {'status': 200, 'message': '创建成功', 'data': result}


@router.get('/api/community/groups', auth=OptionalAuthBearer())
def list_groups(request: HttpRequest):
    """获取圈子列表"""
    result = svc.get_all_groups()
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/groups/{group_id}', auth=OptionalAuthBearer())
def group_detail(request: HttpRequest, group_id: str):
    """获取圈子详情"""
    result = svc.get_group_detail(group_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.put('/api/community/groups/{group_id}', auth=AuthBearer())
def update_group(request: HttpRequest, group_id: str, payload: UpdateGroupIn):
    """更新圈子"""
    result = svc.update_group(group_id, request.user_id, payload)
    return {'status': 200, 'message': '更新成功', 'data': result}


@router.delete('/api/community/groups/{group_id}', auth=AuthBearer())
def delete_group(request: HttpRequest, group_id: str):
    """删除圈子"""
    svc.delete_group(group_id, request.user_id)
    return {'status': 200, 'message': '删除成功', 'data': None}


@router.post('/api/community/groups/{group_id}/join', auth=AuthBearer())
def join_group(request: HttpRequest, group_id: str):
    """加入圈子"""
    svc.join_group(group_id, request.user_id)
    return {'status': 200, 'message': '加入成功', 'data': None}


@router.delete('/api/community/groups/{group_id}/join', auth=AuthBearer())
def quit_group(request: HttpRequest, group_id: str):
    """退出圈子"""
    svc.quit_group(group_id, request.user_id)
    return {'status': 200, 'message': '退出成功', 'data': None}


@router.get('/api/community/groups/{group_id}/members/count', auth=OptionalAuthBearer())
def group_member_count(request: HttpRequest, group_id: str):
    """获取圈子成员数"""
    result = svc.get_group_member_count(group_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/groups/{group_id}/check', auth=OptionalAuthBearer())
def check_membership(request: HttpRequest, group_id: str):
    """检查当前用户是否在圈子中"""
    result = svc.check_group_membership(group_id, get_user_id(request))
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.get('/api/community/groups/{group_id}/members', auth=OptionalAuthBearer())
def group_members(request: HttpRequest, group_id: str):
    """获取圈子成员列表"""
    result = svc.get_group_members(group_id)
    return {'status': 200, 'message': '获取成功', 'data': result}


@router.delete('/api/community/groups/{group_id}/members/{member_id}', auth=AuthBearer())
def remove_group_member(request: HttpRequest, group_id: str, member_id: str):
    """移除圈子成员"""
    result = svc.remove_group_member(group_id, member_id, request.user_id)
    return {'status': 200, 'message': '移除成功', 'data': result}


@router.put('/api/community/groups/{group_id}/members/{member_id}/role', auth=AuthBearer())
def update_group_member_role(request: HttpRequest, group_id: str, member_id: str,
                              payload: UpdateGroupMemberRoleIn):
    """更新圈子成员角色"""
    result = svc.update_group_member_role(group_id, member_id, request.user_id, payload)
    return {'status': 200, 'message': '更新成功', 'data': result}
