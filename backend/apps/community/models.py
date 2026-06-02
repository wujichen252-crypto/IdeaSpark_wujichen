"""
Community models — Posts, Comments, Groups, Likes, Follows.
Maps Java: com.ideaspark.project.model.entity.*
"""
from django.db import models


class CommunityPost(models.Model):
    """Maps to `community_posts` table."""

    id = models.CharField(max_length=36, primary_key=True)
    author = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='author_id', null=True, related_name='posts')
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, db_column='project_id', null=True)
    group = models.ForeignKey('CommunityGroup', on_delete=models.CASCADE, db_column='group_id', null=True)
    title = models.CharField(max_length=255, blank=True, default='')
    content = models.TextField(blank=True, default='')
    images = models.TextField(blank=True, null=True, default=None)  # JSON string
    tags = models.TextField(blank=True, null=True, default=None)  # JSON string
    channel = models.CharField(max_length=100, blank=True, default='')
    visibility = models.CharField(max_length=20, default='public')
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    views_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'community_posts'
        managed = False

    def __str__(self):
        return f'{self.title} ({self.id})'


class CommunityComment(models.Model):
    """Maps to `community_comments` table."""

    id = models.CharField(max_length=36, primary_key=True)
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, db_column='post_id')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id', null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, db_column='parent_id', null=True)
    content = models.TextField()
    likes_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'community_comments'
        managed = False

    def __str__(self):
        return f'Comment {self.id} on {self.post_id}'


class CommunityGroup(models.Model):
    """Maps to `community_groups` table."""

    id = models.CharField(max_length=36, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    keyword = models.CharField(max_length=50, blank=True, default='')
    icon_url = models.CharField(max_length=255, blank=True, default='')
    cover_url = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='created_by', null=True, related_name='created_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'community_groups'
        managed = False

    def __str__(self):
        return f'{self.name} ({self.id})'


class CommunityGroupMember(models.Model):
    """Maps to `community_group_members` table."""

    id = models.CharField(max_length=36, primary_key=True)
    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, db_column='group_id')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id')
    role = models.CharField(max_length=20, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'community_group_members'
        managed = False

    def __str__(self):
        return f'{self.user.username} → {self.group.name} ({self.role})'


class CommunityPostLike(models.Model):
    """Maps to `community_post_likes` table."""

    id = models.CharField(max_length=36, primary_key=True)
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, db_column='post_id')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'community_post_likes'
        managed = False


class CommunityCommentLike(models.Model):
    """Maps to `community_comment_likes` table."""

    id = models.CharField(max_length=36, primary_key=True)
    comment = models.ForeignKey(CommunityComment, on_delete=models.CASCADE, db_column='comment_id')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='user_id')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'community_comment_likes'
        managed = False


class UserFollow(models.Model):
    """Maps to `user_follows` table."""

    id = models.CharField(max_length=36, primary_key=True)
    follower = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='follower_id', related_name='following_set')
    following = models.ForeignKey('accounts.User', on_delete=models.CASCADE, db_column='following_id', related_name='follower_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_follows'
        managed = False

    def __str__(self):
        return f'{self.follower_id} → {self.following_id}'
