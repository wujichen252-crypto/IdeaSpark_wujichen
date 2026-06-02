"""
Team API router.
Maps Java: com.ideaspark.project.controller.TeamController + InvitationController
"""
import logging

from django.http import HttpRequest
from ninja import Router

from apps.accounts.auth import AuthBearer
from apps.teams.schemas import (
    CreateTeamIn, UpdateTeamIn,
    TeamMemberRoleUpdateIn, TeamTransferOwnershipIn, TeamInvitationSendIn,
)
from apps.teams import services
from common.response import ApiResponseData

logger = logging.getLogger(__name__)

router = Router()


# ═══════════════════════════════════════════════════════════
#  Team CRUD — fixed routes BEFORE {uuid}
# ═══════════════════════════════════════════════════════════

@router.get('/api/teams/my', auth=AuthBearer())
def my_teams(request: HttpRequest, page: int = 1, size: int = 20):
    """获取我的团队列表"""
    user_id = request.user_id
    result = services.get_my_teams(user_id, page, size)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.post('/api/teams/collaboration', auth=AuthBearer())
def create_collaboration_team(request: HttpRequest, payload: CreateTeamIn):
    """创建协作团队"""
    user_id = request.user_id
    result = services.create_collaboration_team(user_id, payload)
    return ApiResponseData.ok(data=result, message='协作团队创建成功')


@router.get('/api/teams/{uuid}', auth=AuthBearer())
def team_detail(request: HttpRequest, uuid: str):
    """获取团队详情"""
    user_id = request.user_id
    detail = services.get_team_detail(uuid, user_id)
    return ApiResponseData.ok(data=detail, message='获取成功')


@router.put('/api/teams/{uuid}', auth=AuthBearer())
def update_team(request: HttpRequest, uuid: str, payload: UpdateTeamIn):
    """更新团队信息"""
    user_id = request.user_id
    result = services.update_team(uuid, user_id, payload)
    return ApiResponseData.ok(data=result, message='团队信息更新成功')


@router.delete('/api/teams/{uuid}', auth=AuthBearer())
def dissolve_team(request: HttpRequest, uuid: str):
    """解散团队"""
    user_id = request.user_id
    result = services.dissolve_team(uuid, user_id)
    return ApiResponseData.ok(data=result, message='团队解散成功')


# ═══════════════════════════════════════════════════════════
#  Team Members — members/self BEFORE members/{member_id}
# ═══════════════════════════════════════════════════════════

@router.get('/api/teams/{uuid}/members', auth=AuthBearer())
def team_members(request: HttpRequest, uuid: str,
                 page: int = 1, size: int = 20,
                 role: str = None, keyword: str = None):
    """获取团队成员列表"""
    user_id = request.user_id
    result = services.get_team_members(uuid, user_id, page, size, role, keyword)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.delete('/api/teams/{uuid}/members/self', auth=AuthBearer())
def exit_team(request: HttpRequest, uuid: str):
    """退出团队"""
    user_id = request.user_id
    result = services.exit_team(uuid, user_id)
    return ApiResponseData.ok(data=result, message='成功退出团队')


@router.put('/api/teams/{uuid}/members/{member_id}/role', auth=AuthBearer())
def update_member_role(request: HttpRequest, uuid: str, member_id: int,
                       payload: TeamMemberRoleUpdateIn):
    """更新成员角色"""
    user_id = request.user_id
    result = services.update_member_role(uuid, member_id, user_id, payload)
    return ApiResponseData.ok(data=result, message='成员角色修改成功')


@router.delete('/api/teams/{uuid}/members/{member_id}', auth=AuthBearer())
def remove_member(request: HttpRequest, uuid: str, member_id: int):
    """移除成员"""
    user_id = request.user_id
    result = services.remove_member(uuid, member_id, user_id)
    return ApiResponseData.ok(data=result, message='成员移除成功')


@router.post('/api/teams/{uuid}/transfer-ownership', auth=AuthBearer())
def transfer_ownership(request: HttpRequest, uuid: str,
                       payload: TeamTransferOwnershipIn):
    """转让团队所有权"""
    user_id = request.user_id
    result = services.transfer_ownership(uuid, user_id, payload)
    return ApiResponseData.ok(data=result, message='团队所有权转让成功')


# ═══════════════════════════════════════════════════════════
#  Invitations
# ═══════════════════════════════════════════════════════════

@router.post('/api/teams/{uuid}/invitations', auth=AuthBearer())
def send_invitations(request: HttpRequest, uuid: str,
                     payload: TeamInvitationSendIn):
    """发送团队邀请"""
    user_id = request.user_id
    result = services.send_invitations(uuid, user_id, payload)
    return ApiResponseData.ok(data=result, message='邀请发送成功')


@router.get('/api/invitations/validate', auth=AuthBearer())
def validate_invitation(request: HttpRequest, token: str):
    """验证邀请链接"""
    user_id = request.user_id
    result = services.validate_invitation_token(token, user_id)
    is_valid = result.get('valid', False)
    if is_valid:
        return ApiResponseData.ok(data=result, message='邀请验证成功')
    return ApiResponseData.error(message='邀请链接已失效', status=400, data=result)


# ═══════════════════════════════════════════════════════════
#  Team Projects
# ═══════════════════════════════════════════════════════════

@router.get('/api/teams/{uuid}/projects', auth=AuthBearer())
def team_projects(request: HttpRequest, uuid: str,
                  page: int = 1, size: int = 20):
    """获取团队项目列表"""
    user_id = request.user_id
    result = services.get_team_projects(uuid, user_id, page, size)
    return ApiResponseData.ok(data=result, message='获取成功')
