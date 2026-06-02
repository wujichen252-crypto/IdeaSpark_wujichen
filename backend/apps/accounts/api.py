"""
User API router.
Maps Java: com.ideaspark.project.controller.UserController
"""
import logging

from django.http import HttpRequest
from ninja import Router

from apps.accounts.auth import AuthBearer
from apps.accounts.schemas import (
    RegisterIn, LoginIn, RefreshTokenIn, UserUpdateIn,
    PasswordChangeIn, ForgotPasswordIn, ResetPasswordIn,
    UserInfoOut, LoginOut, UserStatsOut,
)
from apps.accounts import services
from common.exceptions import ForbiddenException
from common.response import ApiResponseData

logger = logging.getLogger(__name__)

router = Router()


# ═══════════════════════════════════════════════════════════
#  Auth
# ═══════════════════════════════════════════════════════════

@router.post('/api/user/register', auth=None)
def register(request: HttpRequest, payload: RegisterIn):
    """用户注册"""
    user_info = services.register(payload)
    return ApiResponseData.ok(data=user_info, message='注册成功')


@router.post('/api/user/login', auth=None)
def login(request: HttpRequest, payload: LoginIn):
    """用户登录"""
    result = services.login(payload)
    return ApiResponseData.ok(data=result, message='登录成功')


@router.post('/api/user/refresh-token', auth=None)
def refresh_token(request: HttpRequest, payload: RefreshTokenIn):
    """刷新 Access Token"""
    result = services.refresh_access_token(payload.refreshToken)
    return ApiResponseData.ok(data=result, message='刷新成功')


# ═══════════════════════════════════════════════════════════
#  Profile
# ═══════════════════════════════════════════════════════════

@router.get('/api/user/me', auth=AuthBearer())
def get_profile(request: HttpRequest):
    """获取当前用户信息"""
    user_id = request.user_id
    profile = services.get_user_profile(user_id)
    return ApiResponseData.ok(data=profile)


@router.post('/api/user/update', auth=AuthBearer())
def update_profile(request: HttpRequest, payload: UserUpdateIn):
    """更新用户信息"""
    user_id = request.user_id
    result = services.update_user_profile(user_id, payload)
    return ApiResponseData.ok(data=result, message='更新成功')


@router.post('/api/user/password', auth=AuthBearer())
def change_password(request: HttpRequest, payload: PasswordChangeIn):
    """修改密码"""
    user_id = request.user_id
    services.change_password(user_id, payload.oldPassword, payload.newPassword)
    return ApiResponseData.ok(message='密码修改成功')


@router.get('/api/user/stats', auth=AuthBearer())
def get_stats(request: HttpRequest):
    """获取用户统计数据"""
    user_id = request.user_id
    stats = services.get_user_stats(user_id)
    return ApiResponseData.ok(data=stats)


# ═══════════════════════════════════════════════════════════
#  Password Reset
# ═══════════════════════════════════════════════════════════

@router.post('/api/user/forgot-password', auth=None)
def forgot_password(request: HttpRequest, payload: ForgotPasswordIn):
    """忘记密码 — 发送重置令牌"""
    services.forgot_password(payload.email)
    return ApiResponseData.ok(message='如果该邮箱已注册，重置链接将发送至您的邮箱')


@router.get('/api/user/validate-reset-token', auth=None)
def validate_reset_token(request: HttpRequest, token: str):
    """验证重置令牌"""
    email = services.validate_reset_token(token)
    return ApiResponseData.ok(data={'email': email})


@router.post('/api/user/reset-password', auth=None)
def reset_password(request: HttpRequest, payload: ResetPasswordIn):
    """重置密码"""
    services.reset_password(payload.token, payload.password)
    return ApiResponseData.ok(message='密码重置成功，请使用新密码登录')


# ═══════════════════════════════════════════════════════════
#  Admin
# ═══════════════════════════════════════════════════════════

@router.get('/api/user/getAllUsers', auth=AuthBearer())
def get_all_users(request: HttpRequest, page: int = 1, size: int = 20, name: str = None):
    """管理员 — 查询用户列表"""
    role = getattr(request, 'user_role', '')
    if role.lower() != 'admin':
        raise ForbiddenException('权限不足，仅管理员可操作')
    result = services.get_all_users(page, size, name)
    return ApiResponseData.ok(data=result)


@router.post('/api/user/deleteUsers', auth=AuthBearer())
def delete_users(request: HttpRequest, payload: dict):
    """管理员 — 批量删除用户"""
    role = getattr(request, 'user_role', '')
    if role.lower() != 'admin':
        raise ForbiddenException('权限不足，仅管理员可操作')
    user_ids = payload.get('userIds', [])
    current_user_id = request.user_id
    services.delete_users(user_ids, current_user_id)
    return ApiResponseData.ok(message='删除成功')


# ═══════════════════════════════════════════════════════════
#  User Plugins
# ═══════════════════════════════════════════════════════════

@router.get('/api/user/plugins', auth=AuthBearer())
def get_my_plugins(request: HttpRequest):
    """获取我的插件列表"""
    user_id = request.user_id
    plugins = services.get_my_plugins(user_id)
    return ApiResponseData.ok(data={'plugins': plugins})


@router.get('/api/user/plugins/keys', auth=AuthBearer())
def get_my_plugin_keys(request: HttpRequest):
    """获取我的插件 Key 列表"""
    user_id = request.user_id
    keys = services.get_my_plugin_keys(user_id)
    return ApiResponseData.ok(data={'pluginKeys': keys})


@router.get('/api/user/plugins/check', auth=AuthBearer())
def check_plugin_owned(request: HttpRequest, pluginKey: str):
    """检查是否拥有插件"""
    user_id = request.user_id
    owned = services.is_plugin_owned(user_id, pluginKey)
    return ApiResponseData.ok(data={'owned': owned})


@router.post('/api/user/plugins/acquire', auth=AuthBearer())
def acquire_free_plugin(request: HttpRequest, pluginKey: str):
    """获取免费插件"""
    user_id = request.user_id
    services.acquire_free_plugin(user_id, pluginKey)
    return ApiResponseData.ok(data={'owned': True})


@router.post('/api/user/plugins/purchase', auth=AuthBearer())
def purchase_plugin(request: HttpRequest, pluginKey: str, months: int = 1):
    """购买插件"""
    user_id = request.user_id
    services.purchase_plugin(user_id, pluginKey, months)
    return ApiResponseData.ok(data={'owned': True})


# ═══════════════════════════════════════════════════════════
#  User detail — MUST be last (catches /api/user/{any})
# ═══════════════════════════════════════════════════════════

@router.get('/api/user/{user_id}', auth=None)
def get_user_by_id(request: HttpRequest, user_id: int):
    """获取用户公开信息"""
    user_info = services.get_user_by_id(user_id)
    return ApiResponseData.ok(data=user_info)
