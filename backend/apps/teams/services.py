"""Team business logic service."""
import uuid
import logging
from datetime import datetime
from typing import Optional, List

from django.db import transaction
from django.db.models import Q

from apps.accounts.models import User
from apps.teams.models import Team, TeamMember, TeamInvitation
from apps.projects.models import Project
from apps.teams.schemas import (
    CreateTeamIn, UpdateTeamIn,
    TeamMemberRoleUpdateIn, TeamTransferOwnershipIn, TeamInvitationSendIn,
)
from common.exceptions import BusinessException, NotFoundException, ForbiddenException
from common.pagination import paginate_queryset, validate_pagination, Page

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
#  Team CRUD
# ═══════════════════════════════════════════════════════════

@transaction.atomic
def create_collaboration_team(user_id: int, payload: CreateTeamIn) -> dict:
    """POST /api/teams/collaboration"""
    user = User.objects.get(id=user_id)

    name = payload.name.strip()
    if not name:
        raise BusinessException('团队名称不能为空')
    if Team.objects.filter(name=name, dissolved_at__isnull=True).exists():
        raise BusinessException('团队名称已存在')

    team = Team.objects.create(
        id=str(uuid.uuid4()),
        owner=user,
        name=name,
        description=payload.description or '',
        is_personal=False,
        team_size=1,
    )

    TeamMember.objects.create(
        team=team,
        user=user,
        role='owner',
    )

    return {'team': _team_to_detail(team, user, 'owner', 1)}


@transaction.atomic
def dissolve_team(team_uuid: str, user_id: int) -> dict:
    """DELETE /api/teams/{uuid}"""
    team, membership = _get_team_and_check_access(team_uuid, user_id)
    if membership.role != 'owner':
        raise ForbiddenException('仅团队所有者可以解散团队')

    team.dissolved_at = datetime.now()
    team.team_size = 0
    team.save(update_fields=['dissolved_at', 'team_size'])

    return {
        'teamId': team.id,
        'teamName': team.name,
        'dissolvedAt': _dt(team.dissolved_at),
    }


def get_team_detail(team_uuid: str, user_id: int) -> dict:
    """GET /api/teams/{uuid}"""
    team, membership = _get_team_and_check_access(team_uuid, user_id)

    member_count = TeamMember.objects.filter(team=team).count()
    latest_project = Project.objects.filter(team=team).order_by('-created_at').first()

    detail = _team_to_detail(team, team.owner, membership.role, member_count)
    if latest_project:
        detail['projectId'] = latest_project.id
    return detail


@transaction.atomic
def update_team(team_uuid: str, user_id: int, payload: UpdateTeamIn) -> dict:
    """PUT /api/teams/{uuid}"""
    team, membership = _get_team_and_check_access(team_uuid, user_id)

    if membership.role not in ('owner', 'admin'):
        raise ForbiddenException('无权限更新团队信息')

    update_fields = []
    if payload.name is not None and payload.name.strip():
        team.name = payload.name.strip()
        update_fields.append('name')
    if payload.description is not None:
        team.description = payload.description
        update_fields.append('description')
    if payload.avatarUrl is not None:
        team.avatar_url = payload.avatarUrl
        update_fields.append('avatar_url')

    if update_fields:
        team.save(update_fields=update_fields)

    return {
        'uuid': team.id,
        'name': team.name,
        'avatarUrl': team.avatar_url or '',
        'description': team.description or '',
        'updatedAt': _dt(team.updated_at),
    }


def get_my_teams(user_id: int, page: int, size: int) -> dict:
    """GET /api/teams/my"""
    p, s = validate_pagination(page, size)
    offset = (p - 1) * s

    member_ids = TeamMember.objects.filter(user_id=user_id).values_list('team_id', flat=True)
    qs = Team.objects.filter(id__in=member_ids, dissolved_at__isnull=True).order_by('-created_at')
    total = qs.count()
    teams = qs[offset:offset + s]

    return {
        'teams': [_team_to_list_item(t, user_id) for t in teams],
        'total': total,
        'page': p,
        'size': s,
    }


def get_team_projects(team_uuid: str, user_id: int, page: int, size: int) -> dict:
    """GET /api/teams/{uuid}/projects"""
    team, membership = _get_team_and_check_access(team_uuid, user_id)

    p, s = validate_pagination(page, size)
    offset = (p - 1) * s

    qs = Project.objects.filter(team=team).order_by('-created_at')
    total = qs.count()
    projects = qs[offset:offset + s]

    return {
        'projects': [_team_project_to_dict(prj) for prj in projects],
        'total': total,
        'page': p,
        'size': s,
    }


# ═══════════════════════════════════════════════════════════
#  Team Members
# ═══════════════════════════════════════════════════════════

def get_team_members(team_uuid: str, user_id: int,
                     page: int, size: int,
                     role: Optional[str] = None,
                     keyword: Optional[str] = None) -> dict:
    """GET /api/teams/{uuid}/members"""
    team, membership = _get_team_and_check_access(team_uuid, user_id)
    current_role = membership.role

    p, s = validate_pagination(page, size)
    offset = (p - 1) * s

    qs = TeamMember.objects.filter(team=team).select_related('user')
    if role:
        qs = qs.filter(role=role)
    if keyword:
        qs = qs.filter(user__username__icontains=keyword)

    total = qs.count()
    members = qs[offset:offset + s]

    return {
        'members': [_member_to_list_item(m, current_role, user_id) for m in members],
        'total': total,
        'page': p,
        'size': s,
    }


@transaction.atomic
def update_member_role(team_uuid: str, member_id: int, user_id: int, payload: TeamMemberRoleUpdateIn) -> dict:
    """PUT /api/teams/{uuid}/members/{memberId}/role"""
    team, membership = _get_team_and_check_access(team_uuid, user_id)

    try:
        target = TeamMember.objects.get(id=member_id, team=team)
    except TeamMember.DoesNotExist:
        raise NotFoundException('成员不存在')

    current_role = membership.role
    if not _can_change_role(current_role, target, user_id):
        raise ForbiddenException('无权限修改该成员角色')

    new_role = payload.role.strip().lower()
    if new_role == 'owner':
        raise BusinessException('不能将角色修改为所有者')
    if new_role not in ('admin', 'member', 'visitor'):
        raise BusinessException('角色不合法')

    old_role = target.role
    target.role = new_role
    target.save(update_fields=['role'])

    return {
        'memberId': target.id,
        'userId': target.user_id,
        'userName': target.user.username if target.user else '',
        'oldRole': old_role,
        'newRole': new_role,
    }


@transaction.atomic
def remove_member(team_uuid: str, member_id: int, user_id: int) -> dict:
    """DELETE /api/teams/{uuid}/members/{memberId}"""
    team, membership = _get_team_and_check_access(team_uuid, user_id)
    current_role = membership.role

    try:
        target = TeamMember.objects.get(id=member_id, team=team)
    except TeamMember.DoesNotExist:
        raise NotFoundException('成员不存在')

    # Cannot remove owner
    if target.user_id == team.owner_id:
        raise BusinessException('不能移除团队所有者')

    if not _can_remove(current_role, target, user_id):
        raise ForbiddenException('无权限移除该成员')

    user_name = target.user.username if target.user else ''
    target.delete()

    return {
        'memberId': target.id,
        'userId': target.user_id,
        'userName': user_name,
    }


@transaction.atomic
def exit_team(team_uuid: str, user_id: int) -> dict:
    """DELETE /api/teams/{uuid}/members/self"""
    team, membership = _get_team_and_check_access(team_uuid, user_id)

    if membership.role == 'owner':
        if team.is_personal:
            raise BusinessException('个人团队不能退出')
        raise BusinessException('团队所有者不能退出团队')

    user_name = membership.user.username if membership.user else ''
    membership.delete()

    return {
        'teamId': team.id,
        'teamName': team.name,
        'userId': user_id,
        'userName': user_name,
    }


@transaction.atomic
def transfer_ownership(team_uuid: str, user_id: int, payload: TeamTransferOwnershipIn) -> dict:
    """POST /api/teams/{uuid}/transfer-ownership"""
    team, membership = _get_team_and_check_access(team_uuid, user_id)

    if team.is_personal:
        raise BusinessException('个人团队不支持转让所有权')
    if membership.role != 'owner':
        raise ForbiddenException('仅团队所有者可以转让所有权')
    if membership.user_id != team.owner_id:
        raise BusinessException('仅当前团队所有者可以转让所有权')

    new_owner_member_id = payload.newOwnerId
    try:
        target_member = TeamMember.objects.get(id=new_owner_member_id, team=team)
    except TeamMember.DoesNotExist:
        raise NotFoundException('目标成员不存在')

    if target_member.user_id is None:
        raise BusinessException('目标成员用户信息异常')
    if target_member.role not in ('admin', 'member', 'visitor'):
        raise BusinessException('仅可将所有者转让给管理员')

    old_owner_id = team.owner_id
    new_owner_id = target_member.user_id

    team.owner_id = new_owner_id
    team.save(update_fields=['owner_id'])

    target_member.role = 'owner'
    target_member.save(update_fields=['role'])

    membership.role = 'admin'
    membership.save(update_fields=['role'])

    return {
        'teamId': team.id,
        'oldOwnerId': old_owner_id,
        'newOwnerId': new_owner_id,
    }


# ═══════════════════════════════════════════════════════════
#  Invitations
# ═══════════════════════════════════════════════════════════

@transaction.atomic
def send_invitations(team_uuid: str, user_id: int, payload: TeamInvitationSendIn) -> dict:
    """POST /api/teams/{uuid}/invitations"""
    team, membership = _get_team_and_check_access(team_uuid, user_id)

    if membership.role not in ('owner', 'admin'):
        raise ForbiddenException('无权限发送团队邀请')

    role = payload.role.strip().lower()
    if role not in ('admin', 'member', 'visitor'):
        raise BusinessException('邀请角色不合法')
    if role == 'admin' and membership.role != 'owner':
        raise BusinessException('仅团队所有者可以邀请管理员')

    inviter = membership.user
    invite_type = (payload.type or 'email').strip().lower()

    if invite_type == 'link':
        invitation = TeamInvitation.objects.create(
            id=str(uuid.uuid4()),
            team=team,
            inviter=inviter,
            role=role,
            token=_generate_token(),
            status='PENDING',
            expires_at=datetime.now().astimezone().replace(tzinfo=None) if hasattr(datetime.now(), 'astimezone') else datetime.now(),
        )

        # Set expiry 7 days from now
        from datetime import timedelta
        invitation.expires_at = (datetime.now() + timedelta(days=7)) if not invitation.expires_at else invitation.expires_at
        invitation.save(update_fields=['expires_at'])

        dto = {
            'role': role,
            'status': invitation.status,
            'token': invitation.token,
            'expiresAt': _dt(invitation.expires_at),
        }

        return {
            'totalInvited': 1,
            'successCount': 1,
            'invitations': [dto],
        }

    # email type
    emails = payload.emails or []
    if not emails:
        raise BusinessException('邮箱列表不能为空')

    total_invited = len(emails)
    success_count = 0
    invitation_dtos = []

    from datetime import timedelta

    for raw_email in emails:
        if not raw_email or not raw_email.strip():
            continue
        email = raw_email.strip()

        invitee_user = None
        try:
            user_by_email = User.objects.get(email=email)
            if TeamMember.objects.filter(team=team, user=user_by_email).exists():
                continue
            invitee_user = user_by_email
        except User.DoesNotExist:
            pass

        invitation = TeamInvitation.objects.create(
            id=str(uuid.uuid4()),
            team=team,
            inviter=inviter,
            invitee=invitee_user,
            invitee_email=email,
            role=role,
            token=_generate_token(),
            status='PENDING',
            expires_at=datetime.now() + timedelta(days=7),
        )

        dto = {
            'inviteeId': invitee_user.id if invitee_user else None,
            'inviteeEmail': invitation.invitee_email,
            'role': role,
            'status': invitation.status,
            'token': invitation.token,
            'expiresAt': _dt(invitation.expires_at),
        }
        invitation_dtos.append(dto)
        success_count += 1

    return {
        'totalInvited': total_invited,
        'successCount': success_count,
        'invitations': invitation_dtos,
    }


@transaction.atomic
def validate_invitation_token(token: str, user_id: int) -> dict:
    """GET /api/invitations/validate?token=xxx"""
    token = (token or '').strip()
    if not token:
        return {'valid': False, 'reason': 'INVALID_TOKEN'}

    try:
        invitation = TeamInvitation.objects.get(token=token)
    except TeamInvitation.DoesNotExist:
        return {'valid': False, 'reason': 'EXPIRED'}

    team = invitation.team
    if not team:
        return {'valid': False, 'reason': 'EXPIRED'}

    if invitation.expires_at and invitation.expires_at < datetime.now().astimezone().replace(tzinfo=None):
        return {'valid': False, 'reason': 'EXPIRED'}
    if invitation.status != 'PENDING':
        return {'valid': False, 'reason': 'EXPIRED'}

    user = User.objects.get(id=user_id)
    already_member = TeamMember.objects.filter(team=team, user=user).exists()
    joined = False

    if not already_member:
        member_role = 'member'
        if invitation.role and invitation.role.strip().lower() in ('admin', 'member', 'visitor'):
            member_role = invitation.role.strip().lower()

        TeamMember.objects.create(
            team=team,
            user=user,
            role=member_role,
        )

        if team.team_size is None:
            team.team_size = 0
        team.team_size += 1
        team.save(update_fields=['team_size'])
        joined = True

    invitation.status = 'ACCEPTED'
    invitation.save(update_fields=['status'])

    invitation_info = {
        'teamId': team.id,
        'teamName': team.name,
        'teamAvatar': team.avatar_url or '',
        'inviterName': invitation.inviter.username if invitation.inviter else '',
        'role': invitation.role,
    }

    return {
        'valid': True,
        'invitation': invitation_info,
        'joined': joined,
    }


# ═══════════════════════════════════════════════════════════
#  Internal Helpers
# ═══════════════════════════════════════════════════════════

def _get_team(team_uuid: str) -> Team:
    try:
        return Team.objects.get(id=team_uuid, dissolved_at__isnull=True)
    except Team.DoesNotExist:
        raise NotFoundException('团队不存在')


def _get_team_and_check_access(team_uuid: str, user_id: int):
    team = _get_team(team_uuid)
    try:
        membership = TeamMember.objects.get(team=team, user_id=user_id)
    except TeamMember.DoesNotExist:
        raise ForbiddenException('无权访问该团队')
    return team, membership


def _can_change_role(current_role: str, target: TeamMember, current_user_id: int) -> bool:
    if target.user_id == current_user_id:
        return False
    if current_role == 'owner':
        return target.role != 'owner'
    if current_role == 'admin':
        return target.role in ('member', 'visitor')
    return False


def _can_remove(current_role: str, target: TeamMember, current_user_id: int) -> bool:
    if target.user_id == current_user_id:
        return False
    if target.role == 'owner':
        return False
    if current_role == 'owner':
        return True
    if current_role == 'admin':
        return target.role in ('member', 'visitor')
    return False


def _team_to_detail(team: Team, owner, current_user_role: str, team_size: int) -> dict:
    return {
        'uuid': team.id,
        'name': team.name or '',
        'avatarUrl': team.avatar_url or '',
        'description': team.description or '',
        'isPersonal': bool(team.is_personal),
        'teamType': '个人团队' if team.is_personal else '协作团队',
        'ownerId': owner.id if owner else None,
        'ownerName': owner.username if owner else '',
        'createdAt': _dt(team.created_at),
        'updatedAt': _dt(team.updated_at),
        'currentUserRole': current_user_role,
        'teamSize': team_size,
    }


def _team_to_list_item(team: Team, user_id: int) -> dict:
    return {
        'uuid': team.id,
        'name': team.name or '',
        'avatarUrl': team.avatar_url or '',
    }


def _team_project_to_dict(project) -> dict:
    return {
        'id': project.id,
        'name': project.name or '',
        'description': project.description or '',
        'category': project.category or '',
        'coverUrl': project.cover_url or '',
        'status': project.status or '',
        'visibility': project.visibility or '',
        'progress': project.progress or 0,
        'ownerId': project.owner_id,
        'ownerName': project.owner.username if project.owner else '',
        'ownerAvatar': project.owner.avatar if project.owner and project.owner.avatar else '',
        'createdAt': _dt(project.created_at),
        'updatedAt': _dt(project.updated_at),
    }


def _member_to_list_item(member: TeamMember, current_role: str, current_user_id: int) -> dict:
    role_cn_map = {'owner': '所有者', 'admin': '管理员', 'member': '成员', 'visitor': '访客'}
    return {
        'id': member.id,
        'userId': member.user_id,
        'userName': member.user.username if member.user else '',
        'userAvatar': member.user.avatar if member.user and member.user.avatar else '',
        'role': member.role or '',
        'roleCn': role_cn_map.get(member.role, ''),
        'joinedAt': _dt(member.joined_at),
        'canRemove': _can_remove(current_role, member, current_user_id),
        'canChangeRole': _can_change_role(current_role, member, current_user_id),
    }


def _generate_token() -> str:
    import hashlib
    raw = str(uuid.uuid4()) + str(uuid.uuid4())
    return hashlib.sha256(raw.encode()).hexdigest()


def _dt(val):
    if val is None:
        return None
    if isinstance(val, str):
        return val
    return val.isoformat() if hasattr(val, 'isoformat') else str(val)
