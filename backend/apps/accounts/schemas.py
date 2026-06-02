"""
Pydantic schemas for user API.
Maps Java DTOs: UserRegisterRequest, UserLoginRequest, UserUpdateRequest, UserResponse, LoginResponse.
"""
from typing import Optional
from ninja import Schema


# ── Request Schemas ──────────────────────────────────────

class RegisterIn(Schema):
    username: str
    email: str
    password: str


class LoginIn(Schema):
    email: str
    password: str


class RefreshTokenIn(Schema):
    refreshToken: str


class UserUpdateIn(Schema):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    avatar: Optional[str] = None
    position: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    perWebsite: Optional[str] = None
    cover: Optional[str] = None
    phone: Optional[str] = None
    isHide: Optional[bool] = None
    isNotifSys: Optional[bool] = None
    isNotifTrends: Optional[bool] = None
    isNotifPost: Optional[bool] = None


class PasswordChangeIn(Schema):
    oldPassword: str
    newPassword: str


class ForgotPasswordIn(Schema):
    email: str


class ResetPasswordIn(Schema):
    token: str
    password: str


# ── Response Schemas ─────────────────────────────────────

class UserInfoOut(Schema):
    """Maps to Java UserResponse (via UserMapper.toUserResponse)."""
    id: int
    username: str
    email: str
    avatar: str = ''
    role: str = 'USER'
    bio: str = ''
    position: str = ''
    address: str = ''
    perWebsite: str = ''
    cover: str = ''
    phone: str = ''
    isHide: bool = True
    isNotifSys: bool = True
    isNotifTrends: bool = True
    isNotifPost: bool = False
    likesCount: int = 0
    followersCount: int = 0
    followingCount: int = 0
    createdAt: str = ''
    updatedAt: str = ''


class LoginOut(Schema):
    """Maps to Java LoginResponse."""
    accessToken: str
    refreshToken: str
    userInfo: UserInfoOut


class UserStatsOut(Schema):
    """Maps to Java UserStatsResponse."""
    postCount: int = 0
    projectCount: int = 0
    followingCount: int = 0
    followerCount: int = 0
