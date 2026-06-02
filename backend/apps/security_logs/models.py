"""SecurityLog model — maps to `security_logs` table."""
from django.db import models


class SecurityLog(models.Model):
    """Maps to `security_logs` table."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id')
    action_type = models.CharField(max_length=30)
    description = models.CharField(max_length=500)
    ip_address = models.CharField(max_length=50, blank=True, default='')
    location = models.CharField(max_length=100, blank=True, default='')
    device = models.CharField(max_length=200, blank=True, default='')
    user_agent = models.CharField(max_length=500, blank=True, default='')
    status = models.CharField(max_length=20, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'security_logs'
        managed = False
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.action_type}] {self.description[:50]}'
