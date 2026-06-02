"""
Common exceptions for IdeaSpark.
Translates Java BusinessException pattern.
"""


class BusinessException(Exception):
    """Equivalent to com.ideaspark.project.exception.BusinessException"""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(BusinessException):
    def __init__(self, message: str = "资源不存在"):
        super().__init__(message, status_code=404)


class UnauthorizedException(BusinessException):
    def __init__(self, message: str = "未登录或登录已过期"):
        super().__init__(message, status_code=401)


class ForbiddenException(BusinessException):
    def __init__(self, message: str = "没有权限执行此操作"):
        super().__init__(message, status_code=403)
