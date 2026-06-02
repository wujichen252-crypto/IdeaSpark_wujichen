"""
Notification API router.
Maps Java: com.ideaspark.project.controller.NotificationController
"""
import logging

from django.http import HttpRequest
from ninja import Router

from apps.accounts.auth import AuthBearer
from apps.notifications.schemas import CreateNotificationIn
from apps.notifications import services
from common.response import ApiResponseData

logger = logging.getLogger(__name__)

router = Router()


@router.get('/api/notifications', auth=AuthBearer())
def list_notifications(request: HttpRequest,
                        type: str = None,
                        page: int = 1,
                        size: int = 20):
    """获取消息列表"""
    user_id = request.user_id
    result = services.get_user_notifications(user_id, type, page, size)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/notifications/unread', auth=AuthBearer())
def unread_notifications(request: HttpRequest):
    """获取未读消息列表"""
    user_id = request.user_id
    result = services.get_unread_notifications(user_id)
    return ApiResponseData.ok(data=result, message='获取成功')


@router.get('/api/notifications/unread/count', auth=AuthBearer())
def unread_count(request: HttpRequest):
    """获取未读消息数量"""
    user_id = request.user_id
    count = services.get_unread_count(user_id)
    return ApiResponseData.ok(data={'count': count}, message='获取成功')


@router.put('/api/notifications/{notification_id}/read', auth=AuthBearer())
def mark_read(request: HttpRequest, notification_id: int):
    """标记消息为已读"""
    user_id = request.user_id
    success = services.mark_as_read(notification_id, user_id)
    if not success:
        return ApiResponseData.error(message='消息不存在', status=404)
    return ApiResponseData.ok(message='标记已读成功')


@router.put('/api/notifications/read/all', auth=AuthBearer())
def mark_all_read(request: HttpRequest):
    """标记所有消息为已读"""
    user_id = request.user_id
    count = services.mark_all_as_read(user_id)
    return ApiResponseData.ok(message=f'已将{count}条消息标记为已读')


@router.delete('/api/notifications/read', auth=AuthBearer())
def delete_read(request: HttpRequest):
    """删除已读消息"""
    user_id = request.user_id
    count = services.delete_read_notifications(user_id)
    return ApiResponseData.ok(message=f'已删除{count}条已读消息')


@router.delete('/api/notifications/{notification_id}', auth=AuthBearer())
def delete_notification(request: HttpRequest, notification_id: int):
    """删除单条消息"""
    user_id = request.user_id
    success = services.delete_notification(notification_id, user_id)
    if not success:
        return ApiResponseData.error(message='消息不存在', status=404)
    return ApiResponseData.ok(message='删除成功')


@router.post('/api/notifications', auth=AuthBearer())
def create_notification(request: HttpRequest, payload: CreateNotificationIn):
    """创建消息（内部使用）"""
    result = services.create_notification(payload)
    return ApiResponseData.ok(data=result, message='创建成功')
