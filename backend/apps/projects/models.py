"""Project models — maps to 7 project-related tables."""
from django.db import models


class Project(models.Model):
    """Maps to `projects` table. VARCHAR(36) UUID primary key."""

    id = models.CharField(max_length=36, primary_key=True)
    owner = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='owner_id', null=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    category = models.CharField(max_length=50, blank=True, default='')
    cover_url = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, default='draft')
    progress = models.IntegerField(default=0)
    visibility = models.CharField(max_length=10, default='private')
    allow_fork = models.BooleanField(default=True)
    team = models.ForeignKey('teams.Team', on_delete=models.CASCADE, db_column='team_id', null=True)
    parent_id = models.CharField(max_length=36, blank=True, null=True, default=None)
    type = models.CharField(max_length=20, blank=True, default='')
    tags = models.TextField(blank=True, default='')
    tech_stack = models.TextField(blank=True, default='')
    content = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        managed = False

    def __str__(self):
        return f'{self.name} ({self.id})'


class ProjectMember(models.Model):
    """Maps to `project_members` table. VARCHAR(36) UUID primary key."""

    id = models.CharField(max_length=36, primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='project_id')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id')
    role = models.CharField(max_length=20, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_members'
        managed = False


class Plugin(models.Model):
    """Maps to `plugins` table."""

    id = models.CharField(max_length=36, primary_key=True)
    key = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, blank=True, default='')
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    icon = models.CharField(max_length=50, blank=True, default='')
    color = models.CharField(max_length=20, blank=True, default='')
    source = models.CharField(max_length=20, default='official')
    export_ext = models.CharField(max_length=10, blank=True, default='')
    export_mime = models.CharField(max_length=100, blank=True, default='')
    export_filename_suffix = models.CharField(max_length=50, blank=True, default='')
    prompt = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    usage_count = models.IntegerField(default=0)
    tags = models.CharField(max_length=100, blank=True, default='')
    is_premium = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'plugins'
        managed = False


class ProjectPlugin(models.Model):
    """Maps to `project_plugins` table."""

    id = models.CharField(max_length=36, primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='project_id')
    plugin = models.ForeignKey(Plugin, on_delete=models.CASCADE, db_column='plugin_id')
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_plugins'
        managed = False


class ProjectFile(models.Model):
    """Maps to `project_files` table."""

    id = models.CharField(max_length=36, primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='project_id')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, blank=True, default='')
    ext = models.CharField(max_length=10, blank=True, default='')
    size = models.IntegerField(null=True, blank=True)
    source = models.CharField(max_length=20, blank=True, default='')
    content = models.TextField(blank=True, default='')
    plugin_id = models.CharField(max_length=36, blank=True, null=True, default=None)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, db_column='created_by', null=True, related_name='created_files')
    updated_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, db_column='updated_by', null=True, related_name='updated_files')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_files'
        managed = False


class ProjectFavorite(models.Model):
    """Maps to `project_favorites` table. BIGINT auto-increment PK."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='project_id')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_favorites'
        managed = False


class ProjectLike(models.Model):
    """Maps to `project_likes` table. BIGINT auto-increment PK."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='project_id')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_likes'
        managed = False


class ProjectComment(models.Model):
    """Maps to `project_comments` table. Market project comments."""

    id = models.CharField(max_length=36, primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='project_id')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, db_column='parent_id', null=True, blank=True)
    content = models.TextField()
    likes_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_comments'
        managed = False
