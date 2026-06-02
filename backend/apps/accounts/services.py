"""
User business logic service.
Maps Java: com.ideaspark.project.service.UserService
"""
import logging
from datetime import datetime, timezone, timedelta

from django.db import transaction
from django.contrib.auth.hashers import check_password, make_password

from apps.accounts.models import User, RefreshToken, PasswordResetToken, UserPlugin
from apps.accounts.schemas import RegisterIn, LoginIn, UserUpdateIn, UserInfoOut
from common.exceptions import BusinessException, NotFoundException
from common.auth import generate_access_token, generate_refresh_token, decode_access_token

logger = logging.getLogger(__name__)


def register(payload: RegisterIn) -> dict:
    """User registration. Maps to UserService.register()."""
    if not payload.username or not payload.username.strip():
        raise BusinessException('用户名不能为空')
    if not payload.email or not payload.email.strip():
        raise BusinessException('邮箱不能为空')
    if not payload.password or len(payload.password) < 6:
        raise BusinessException('密码长度不能少于 6 位')

    if User.objects.filter(email=payload.email).exists():
        raise BusinessException('邮箱已存在')

    with transaction.atomic():
        user = User.objects.create(
            username=payload.username.strip(),
            email=payload.email.strip(),
            password_hash=make_password(payload.password),
            role='USER',
        )
        _create_personal_team(user)

    return _user_to_dict(user)


def login(payload: LoginIn) -> dict:
    """User login. Maps to UserService.login()."""
    if not payload.email:
        raise BusinessException('邮箱不能为空')
    if not payload.password:
        raise BusinessException('密码不能为空')

    try:
        user = User.objects.get(email=payload.email)
    except User.DoesNotExist:
        raise BusinessException('邮箱或密码错误')

    if not check_password(payload.password, user.password_hash):
        raise BusinessException('邮箱或密码错误')

    access_token = generate_access_token(user.id, user.role)
    refresh_token_value = generate_refresh_token()
    _save_refresh_token(user.id, refresh_token_value)

    return {
        'token': access_token,
        'refreshToken': refresh_token_value,
        'userInfo': _user_to_dict(user),
    }


def refresh_access_token(refresh_token_value: str) -> dict:
    """Refresh access token. Maps to UserService.refreshAccessToken()."""
    if not refresh_token_value:
        raise BusinessException('刷新令牌不能为空')

    try:
        rt = RefreshToken.objects.get(token=refresh_token_value)
    except RefreshToken.DoesNotExist:
        raise BusinessException('刷新令牌无效')

    if rt.expiry_date.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        rt.delete()
        raise BusinessException('刷新令牌已过期，请重新登录')

    try:
        user = User.objects.get(id=rt.user_id)
    except User.DoesNotExist:
        raise BusinessException('用户不存在')

    # Rotation: delete old, create new
    new_access_token = generate_access_token(user.id, user.role)
    new_refresh_token = generate_refresh_token()
    rt.delete()
    _save_refresh_token(user.id, new_refresh_token)

    return {
        'token': new_access_token,
        'refreshToken': new_refresh_token,
        'userInfo': _user_to_dict(user),
    }


def get_user_profile(user_id: int) -> dict:
    """Get current user's full profile. Maps to UserController /api/user/me."""
    user = _get_user_or_404(user_id)
    return _user_to_dict(user)


def update_user_profile(user_id: int, payload: UserUpdateIn) -> dict:
    """Update user profile fields. Maps to UserService.updateUser()."""
    user = _get_user_or_404(user_id)

    update_fields = []

    # Map snake_case schema fields (Python) to model fields
    field_map = {
        'username': 'username',
        'email': 'email',
        'password': 'password_hash',
        'avatar': 'avatar',
        'position': 'position',
        'bio': 'bio',
        'address': 'address',
        'perWebsite': 'per_website',
        'cover': 'cover',
        'phone': 'phone',
        'isHide': 'is_hide',
        'isNotifSys': 'is_notifisys',
        'isNotifTrends': 'is_notiftrends',
        'isNotifPost': 'is_notifipost',
    }

    data = payload.dict(exclude_none=True)

    for schema_field, model_field in field_map.items():
        if schema_field not in data:
            continue
        value = data[schema_field]

        if schema_field == 'email':
            if value and value.strip() and value != user.email:
                if User.objects.filter(email=value).exists():
                    raise BusinessException('邮箱已存在')
                setattr(user, model_field, value.strip())
                update_fields.append(model_field)
        elif schema_field == 'password':
            if value and len(value) >= 6:
                user.password_hash = make_password(value)
                update_fields.append('password_hash')
                # Invalidate all refresh tokens on password change
                RefreshToken.objects.filter(user_id=user_id).delete()
        elif schema_field == 'username':
            if value and value.strip():
                setattr(user, model_field, value.strip())
                update_fields.append(model_field)
        else:
            setattr(user, model_field, value)
            update_fields.append(model_field)

    if update_fields:
        user.save(update_fields=update_fields)

    return _user_to_dict(user)


def change_password(user_id: int, old_password: str, new_password: str) -> None:
    """Change password for current user."""
    user = _get_user_or_404(user_id)

    if not check_password(old_password, user.password_hash):
        raise BusinessException('当前密码错误')

    if len(new_password) < 6:
        raise BusinessException('新密码长度不能少于 6 位')

    user.password_hash = make_password(new_password)
    user.save(update_fields=['password_hash'])

    # Invalidate all refresh tokens
    RefreshToken.objects.filter(user_id=user_id).delete()


def get_user_stats(user_id: int) -> dict:
    """Get user statistics. Maps to UserService.getUserStats()."""
    user = _get_user_or_404(user_id)

    # Use raw COUNT queries to avoid loading all relations
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute('SELECT COUNT(*) FROM community_posts WHERE author_id = %s', [user_id])
        post_count = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM projects WHERE owner_id = %s', [user_id])
        project_count = cursor.fetchone()[0]

    return {
        'postCount': post_count,
        'projectCount': project_count,
        'followingCount': user.following_count or 0,
        'followerCount': user.followers_count or 0,
    }


def get_user_by_id(target_user_id: int) -> dict:
    """Get public user info by ID."""
    user = _get_user_or_404(target_user_id)
    return _user_to_public_dict(user)


# ── Private helpers ──────────────────────────────────────


def _get_user_or_404(user_id: int) -> User:
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise NotFoundException('用户不存在')


def _save_refresh_token(user_id: int, token_value: str) -> None:
    RefreshToken.objects.create(
        user_id=user_id,
        token=token_value,
        expiry_date=datetime.now(timezone.utc) + timedelta(days=7),
    )


def _create_personal_team(user: User) -> None:
    """Create personal team for new user (maps to UserService.createPersonalTeam)."""
    import uuid
    from apps.teams.models import Team, TeamMember

    team = Team.objects.create(
        id=str(uuid.uuid4()),
        owner=user,
        name=user.username,
        is_personal=True,
        team_size=1,
    )
    TeamMember.objects.create(
        team=team,
        user=user,
        role='owner',
    )


def _user_to_dict(user: User) -> dict:
    """Maps User entity to UserInfoOut-compatible dict."""
    return {
        'id': user.id,
        'username': _val(user.username, ''),
        'email': _val(user.email, ''),
        'avatar': _val(user.avatar, ''),
        'role': _val(user.role, 'USER'),
        'bio': _val(user.bio, ''),
        'position': _val(user.position, ''),
        'address': _val(user.address, ''),
        'perWebsite': _val(user.per_website, ''),
        'cover': _val(user.cover, ''),
        'phone': _val(user.phone, ''),
        'isHide': bool(user.is_hide) if user.is_hide is not None else True,
        'isNotifSys': bool(user.is_notifisys) if user.is_notifisys is not None else True,
        'isNotifTrends': bool(user.is_notiftrends) if user.is_notiftrends is not None else True,
        'isNotifPost': bool(user.is_notifipost) if user.is_notifipost is not None else False,
        'likesCount': user.likes_count or 0,
        'followersCount': user.followers_count or 0,
        'followingCount': user.following_count or 0,
        'createdAt': user.created_at.isoformat() if user.created_at else '',
        'updatedAt': user.updated_at.isoformat() if user.updated_at else '',
    }


def _val(value, default):
    """Return default if value is None."""
    return default if value is None else value


def _user_to_public_dict(user: User) -> dict:
    """Public profile (no email or sensitive fields)."""
    return {
        'id': user.id,
        'username': _val(user.username, ''),
        'avatar': _val(user.avatar, ''),
        'role': _val(user.role, 'USER'),
        'bio': _val(user.bio, ''),
        'position': _val(user.position, ''),
        'address': _val(user.address, ''),
        'perWebsite': _val(user.per_website, ''),
        'cover': _val(user.cover, ''),
        'likesCount': user.likes_count or 0,
        'followersCount': user.followers_count or 0,
        'followingCount': user.following_count or 0,
        'createdAt': user.created_at.isoformat() if user.created_at else '',
    }


# ══════════════════════════════════════════════════════════
#  Password Reset
# ══════════════════════════════════════════════════════════


@transaction.atomic
def forgot_password(email: str) -> None:
    """POST /api/user/forgot-password"""
    import uuid as _uuid
    from datetime import timedelta

    if not email or not email.strip():
        raise BusinessException('邮箱不能为空')

    user_exists = User.objects.filter(email=email.strip()).exists()
    if not user_exists:
        return  # Don't reveal whether email exists

    PasswordResetToken.objects.filter(email=email).delete()
    token_value = _uuid.uuid4().hex
    PasswordResetToken.objects.create(
        email=email,
        token=token_value,
        expiry_date=datetime.now(timezone.utc) + timedelta(hours=1),
        used=False,
    )
    logger.info(f'Password reset token created for {email}')


def validate_reset_token(token: str) -> str:
    """GET /api/user/validate-reset-token"""
    if not token:
        raise BusinessException('令牌不能为空')
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        raise BusinessException('无效的令牌')

    if reset_token.used:
        raise BusinessException('令牌已被使用')
    if reset_token.expiry_date.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise BusinessException('令牌已过期')

    return reset_token.email


@transaction.atomic
def reset_password(token: str, new_password: str) -> None:
    """POST /api/user/reset-password"""
    if len(new_password) < 6:
        raise BusinessException('密码长度不能少于 6 位')

    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        raise BusinessException('无效的令牌')

    if reset_token.used:
        raise BusinessException('令牌已被使用')
    if reset_token.expiry_date.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise BusinessException('令牌已过期')

    try:
        user = User.objects.get(email=reset_token.email)
    except User.DoesNotExist:
        raise BusinessException('用户不存在')

    user.password_hash = make_password(new_password)
    user.save(update_fields=['password_hash'])

    reset_token.used = True
    reset_token.save(update_fields=['used'])

    RefreshToken.objects.filter(user_id=user.id).delete()


# ══════════════════════════════════════════════════════════
#  Admin
# ══════════════════════════════════════════════════════════


def get_all_users(page: int = 1, size: int = 20, name: str = None) -> dict:
    """GET /api/user/getAllUsers — Admin query users"""
    qs = User.objects.all()
    if name:
        qs = qs.filter(username__icontains=name)

    qs = qs.order_by('-created_at')
    total = qs.count()
    offset = (page - 1) * size
    users = qs[offset:offset + size]

    return {
        'content': [_user_to_dict(u) for u in users],
        'totalElements': total,
        'totalPages': max(1, (total + size - 1) // size),
        'number': page,
        'size': size,
    }


@transaction.atomic
def delete_users(user_ids: list, current_user_id: int) -> None:
    """POST /api/user/deleteUsers — Admin batch delete"""
    if current_user_id in user_ids:
        raise BusinessException('不能删除自己')

    User.objects.filter(id__in=user_ids).delete()


# ══════════════════════════════════════════════════════════
#  User Plugins
# ══════════════════════════════════════════════════════════


def get_my_plugins(user_id: int) -> list:
    """GET /api/user/plugins"""
    now = datetime.now(timezone.utc)
    user_plugins = UserPlugin.objects.filter(user_id=user_id)
    from apps.projects.models import Plugin

    result = []
    all_plugins = list(Plugin.objects.all())
    plugin_map = {p.key: p for p in all_plugins if p.key}

    for up in user_plugins:
        if up.expired_at and up.expired_at.replace(tzinfo=timezone.utc) < now:
            continue
        plugin = plugin_map.get(up.plugin_key)
        if plugin:
            result.append(_plugin_to_dict(plugin))
    return result


def get_my_plugin_keys(user_id: int) -> list:
    """GET /api/user/plugins/keys"""
    now = datetime.now(timezone.utc)
    qs = UserPlugin.objects.filter(user_id=user_id)
    keys = []
    for up in qs:
        if up.expired_at and up.expired_at.replace(tzinfo=timezone.utc) < now:
            continue
        keys.append(up.plugin_key)
    return keys


def is_plugin_owned(user_id: int, plugin_key: str) -> bool:
    """GET /api/user/plugins/check"""
    now = datetime.now(timezone.utc)
    try:
        up = UserPlugin.objects.get(user_id=user_id, plugin_key=plugin_key)
        if up.expired_at and up.expired_at.replace(tzinfo=timezone.utc) < now:
            return False
        return True
    except UserPlugin.DoesNotExist:
        return False


@transaction.atomic
def acquire_free_plugin(user_id: int, plugin_key: str) -> bool:
    """POST /api/user/plugins/acquire"""
    from apps.projects.models import Plugin
    try:
        Plugin.objects.get(key=plugin_key)
    except Plugin.DoesNotExist:
        raise BusinessException('插件不存在')

    existing = UserPlugin.objects.filter(user_id=user_id, plugin_key=plugin_key).first()
    if existing:
        return True  # Already owned, no-op

    import uuid
    UserPlugin.objects.create(
        id=str(uuid.uuid4()),
        user_id=user_id,
        plugin_key=plugin_key,
        acquired_type='free',
        expired_at=None,
    )
    return True


@transaction.atomic
def purchase_plugin(user_id: int, plugin_key: str, months: int = 1) -> bool:
    """POST /api/user/plugins/purchase"""
    from apps.projects.models import Plugin
    try:
        Plugin.objects.get(key=plugin_key)
    except Plugin.DoesNotExist:
        raise BusinessException('插件不存在')

    from datetime import timedelta
    now = datetime.now(timezone.utc)
    existing = UserPlugin.objects.filter(user_id=user_id, plugin_key=plugin_key).first()

    if existing:
        if existing.expired_at and existing.expired_at.replace(tzinfo=timezone.utc) > now:
            existing.expired_at = existing.expired_at + timedelta(days=30 * months)
        else:
            existing.expired_at = now + timedelta(days=30 * months)
        existing.save(update_fields=['expired_at'])
    else:
        import uuid
        UserPlugin.objects.create(
            id=str(uuid.uuid4()),
            user_id=user_id,
            plugin_key=plugin_key,
            acquired_type='purchase',
            expired_at=now + timedelta(days=30 * months),
        )
    return True


def _plugin_to_dict(plugin) -> dict:
    """Convert Plugin model to PluginResponse dict."""
    export_config = None
    if plugin.export_ext or plugin.export_mime:
        export_config = {
            'ext': plugin.export_ext or '',
            'mime': plugin.export_mime or '',
            'filenameSuffix': plugin.export_filename_suffix or '',
        }
    return {
        'id': plugin.id,
        'key': plugin.key or '',
        'name': plugin.name or '',
        'category': plugin.category or '',
        'description': plugin.description or '',
        'isActive': bool(plugin.is_active),
        'icon': plugin.icon or '',
        'color': plugin.color or '',
        'source': plugin.source or 'official',
        'export': export_config,
        'prompt': plugin.prompt or '',
        'price': float(plugin.price) if plugin.price else 0,
        'usageCount': plugin.usage_count or 0,
        'tags': plugin.tags or '',
        'isPremium': bool(plugin.is_premium),
        'createdAt': plugin.created_at.isoformat() if plugin.created_at else '',
        'updatedAt': plugin.updated_at.isoformat() if plugin.updated_at else '',
    }
