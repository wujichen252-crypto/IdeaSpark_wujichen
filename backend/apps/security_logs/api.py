"""Security Log API router."""
import logging

from django.http import HttpRequest
from ninja import Router

from apps.accounts.auth import AuthBearer
from apps.security_logs import services
from common.response import ApiResponseData

logger = logging.getLogger(__name__)

router = Router()


@router.get('/api/security/logs', auth=AuthBearer())
def list_logs(request: HttpRequest, page: int = 1, size: int = 20):
    """获取安全日志列表"""
    user_id = request.user_id
    result = services.get_security_logs(user_id, page, size)
    return ApiResponseData.ok(data=result, message='获取成功')
