"""Notification model — maps to `notifications` table. BIGINT auto-increment PK."""
from django.db import models


class Notification(models.Model):
    """Maps to `notifications` table."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id')
    type = models.CharField(max_length=20)
    title = models.CharField(max_length=200)
    content = models.CharField(max_length=1000)
    is_read = models.BooleanField(default=False, db_column='is_read')
    related_id = models.CharField(max_length=50, blank=True, default='')
    related_type = models.CharField(max_length=20, blank=True, default='')
    sender_id = models.BigIntegerField(null=True, blank=True)
    sender_name = models.CharField(max_length=50, blank=True, default='')
    sender_avatar = models.CharField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notifications'
        managed = False
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.type}] {self.title}'
