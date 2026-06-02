"""
User model — maps to existing `users` table.
Java counterpart: com.ideaspark.project.model.entity.User
"""
from django.db import models


class PasswordResetToken(models.Model):
    """Maps to `password_reset_tokens` table."""

    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(max_length=100)
    token = models.CharField(max_length=100, unique=True)
    expiry_date = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'password_reset_tokens'
        managed = False


class UserPlugin(models.Model):
    """Maps to `user_plugins` table. Links users to owned plugins."""

    id = models.CharField(max_length=36, primary_key=True)
    user = models.ForeignKey('User', on_delete=models.CASCADE, db_column='user_id')
    plugin_id = models.CharField(max_length=36)
    plugin_key = models.CharField(max_length=50)
    acquired_type = models.CharField(max_length=20, blank=True, default='')
    expired_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_plugins'
        managed = False


class User(models.Model):
    """Maps to the `users` table in the existing database."""

    id = models.BigAutoField(primary_key=True)
    username = models.CharField(max_length=50)
    email = models.EmailField(max_length=100, unique=True)
    password_hash = models.CharField(max_length=255)
    avatar = models.CharField(max_length=255, blank=True, default='')
    role = models.CharField(max_length=50, default='USER')
    bio = models.TextField(blank=True, default='')
    position = models.CharField(max_length=255, blank=True, default='')
    address = models.CharField(max_length=255, blank=True, default='')
    per_website = models.CharField(max_length=100, blank=True, default='')
    cover = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    is_hide = models.BooleanField(default=True)
    is_notifisys = models.BooleanField(default=True)
    is_notiftrends = models.BooleanField(default=True)
    is_notifipost = models.BooleanField(default=False)
    likes_count = models.IntegerField(default=0)
    followers_count = models.IntegerField(default=0)
    following_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        managed = False  # Django won't create/migrate this table
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.username} ({self.email})'


class RefreshToken(models.Model):
    """Maps to `refresh_tokens` table. Stores JWT refresh tokens."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    token = models.CharField(max_length=255, unique=True)
    expiry_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'refresh_tokens'
        managed = False
