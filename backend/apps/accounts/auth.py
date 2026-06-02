"""
JWT Authentication backend for Django Ninja.
Maps Java: com.ideaspark.project.config.JwtAuthenticationInterceptor
"""
from ninja.security import HttpBearer
from django.http import HttpRequest

from common.auth import decode_access_token
from common.exceptions import UnauthorizedException


class AuthBearer(HttpBearer):
    """Validates JWT access token and sets request.user_id."""

    def authenticate(self, request: HttpRequest, token: str) -> str | None:
        payload = decode_access_token(token)
        if payload is None:
            raise UnauthorizedException('Token 无效或已过期')
        request.user_id = int(payload['sub'])
        request.user_role = payload.get('role', 'USER')
        return token


class OptionalAuthBearer(HttpBearer):
    """Like AuthBearer but does not raise on missing/invalid token."""

    def __call__(self, request: HttpRequest):
        headers = request.headers
        auth_value = headers.get(self.header)
        if not auth_value:
            return True  # No token → allow as anonymous
        parts = auth_value.split(" ")
        if parts[0].lower() != self.openapi_scheme:
            return True  # Unknown scheme → allow
        token = " ".join(parts[1:])
        payload = decode_access_token(token)
        if payload is not None:
            request.user_id = int(payload['sub'])
            request.user_role = payload.get('role', 'USER')
        return True  # Allow regardless

    def authenticate(self, request: HttpRequest, token: str) -> str | None:
        payload = decode_access_token(token)
        if payload is not None:
            request.user_id = int(payload['sub'])
            request.user_role = payload.get('role', 'USER')
        return True


def get_user_id(request: HttpRequest) -> int:
    """Get user ID from authenticated request, defaulting to 0 for anonymous."""
    return getattr(request, 'user_id', 0) or 0
