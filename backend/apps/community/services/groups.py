"""Group business logic."""
import uuid
from typing import List
from django.db import transaction
from apps.accounts.models import User
from apps.community.models import CommunityGroup, CommunityGroupMember
from apps.community.schemas import CreateGroupIn, UpdateGroupIn, UpdateGroupMemberRoleIn
from common.exceptions import BusinessException, NotFoundException, ForbiddenException
from . import _dt


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


# ── Helpers ──


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
