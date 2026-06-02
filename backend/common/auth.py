"""
JWT token utilities.
Maps Java: com.ideaspark.project.util.JwtUtil
"""
import hashlib
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings

ALGORITHM = 'HS256'


def generate_access_token(user_id: int, role: str = 'USER') -> str:
    """Generate JWT access token. Maps to JwtUtil.generateToken()."""
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(user_id),
        'role': role,
        'iss': settings.JWT_ISSUER,
        'iat': now,
        'exp': now + timedelta(seconds=settings.JWT_EXPIRE_SECONDS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Validate and decode access token. Returns payload dict or None."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[ALGORITHM],
            issuer=settings.JWT_ISSUER,
        )
        return payload
    except jwt.PyJWTError:
        return None


def generate_refresh_token() -> str:
    """Generate a cryptographically random refresh token.
    Maps to JwtUtil.generateRefreshToken() which creates a UUID-based token."""
    raw = f'{uuid.uuid4().hex}-{uuid.uuid4().hex}'
    return hashlib.sha256(raw.encode()).hexdigest()
