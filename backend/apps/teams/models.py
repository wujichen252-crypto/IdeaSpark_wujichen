"""
Team and TeamMember models.
Maps Java: com.ideaspark.project.model.entity.Team / TeamMember
"""
from django.db import models


class Team(models.Model):
    """Maps to `teams` table. Primary key is VARCHAR(36) UUID."""

    id = models.CharField(max_length=36, primary_key=True)  # UUID stored as VARCHAR
    owner = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='owner_id')
    name = models.CharField(max_length=100)
    is_personal = models.BooleanField(default=False)
    avatar_url = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True, default='')
    team_size = models.IntegerField(default=0)
    dissolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def uuid(self):
        return self.id

    class Meta:
        db_table = 'teams'
        managed = False

    def __str__(self):
        return f'{self.name} ({self.id})'


class TeamMember(models.Model):
    """Maps to `team_members` table."""

    id = models.BigAutoField(primary_key=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, db_column='team_id')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id')
    role = models.CharField(max_length=20)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'team_members'
        managed = False

    def __str__(self):
        return f'{self.user.username} → {self.team.name} ({self.role})'


class TeamInvitation(models.Model):
    """Maps to `team_invitations` table."""

    id = models.CharField(max_length=36, primary_key=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, db_column='team_id')
    inviter = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='inviter_id', null=True, related_name='sent_invitations')
    invitee = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='invitee_id', null=True, related_name='received_invitations')
    invitee_email = models.CharField(max_length=100, blank=True, default='')
    role = models.CharField(max_length=20, blank=True, default='')
    token = models.CharField(max_length=64)
    status = models.CharField(max_length=20, default='PENDING')
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'team_invitations'
        managed = False

    def __str__(self):
        return f'Invitation {self.id} ({self.status})'
