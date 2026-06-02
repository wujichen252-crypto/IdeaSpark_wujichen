"""AI models — ChatSession, ChatMessage."""
from django.db import models


class ChatSession(models.Model):
    """Maps to `chat_sessions` table."""

    id = models.CharField(max_length=36, primary_key=True)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id', null=True)
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, db_column='project_id', null=True)
    title = models.CharField(max_length=100, blank=True, default='')
    model = models.CharField(max_length=50, blank=True, default='')
    system_prompt = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_sessions'
        managed = False

    def __str__(self):
        return f'{self.title} ({self.id})'


class ChatMessage(models.Model):
    """Maps to `chat_messages` table."""

    id = models.CharField(max_length=36, primary_key=True)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, db_column='session_id')
    role = models.CharField(max_length=10)
    content = models.TextField()
    message_type = models.CharField(max_length=10, blank=True, default='')
    language = models.CharField(max_length=20, blank=True, default='')
    image_urls = models.TextField(blank=True, null=True, default=None)  # JSON
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        managed = False

    def __str__(self):
        return f'{self.role}: {self.content[:50]}'
