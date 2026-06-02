"""
Project API router.
Maps Java: com.ideaspark.project.controller.ProjectController + FileController + interactions
"""
import logging

from django.http import HttpRequest
from ninja import Body, Router

from apps.accounts.auth import AuthBearer, OptionalAuthBearer
from apps.projects.schemas import (
    CreateProjectIn, UpdateProjectIn,
    CreateFileIn, UpdateFileIn,
)
from apps.projects import services
from common.response import ApiResponseData

logger = logging.getLogger(__name__)

router = Router()


# ═══════════════════════════════════════════════════════════
#  Project CRUD
# ═══════════════════════════════════════════════════════════

@router.get('/api/projects/my', auth=AuthBearer())
def my_projects(request: HttpRequest,
                keyword: str = None,
                status: str = None,
                page: int = 1,
                size: int = 20):
    """获取我的项目列表"""
    user_id = request.user_id
    result = services.get_my_projects(user_id, keyword, status, page, size)
    return ApiResponseData.paginated(
        items=result.items,
        total=result.total,
        page=result.page,
        size=result.size,
    )


@router.get('/api/projects/user/{target_user_id}', auth=OptionalAuthBearer())
def user_public_projects(request: HttpRequest,
                         target_user_id: int,
                         page: int = 1,
                         size: int = 20):
    """获取用户公开项目列表"""
    result = services.get_user_public_projects(target_user_id, page, size)
    return ApiResponseData.paginated(
        items=result.items,
        total=result.total,
        page=result.page,
        size=result.size,
    )


@router.post('/api/projects', auth=AuthBearer())
def create_project(request: HttpRequest, payload: CreateProjectIn):
    """创建项目"""
    user_id = request.user_id
    project = services.create_project(user_id, payload)
    return ApiResponseData.created(data=project, message='创建成功')


@router.get('/api/projects/{project_id}', auth=OptionalAuthBearer())
def get_project_detail(request: HttpRequest, project_id: str):
    """获取项目详情"""
    user_id = getattr(request, 'user_id', 0) or 0
    detail = services.get_project_detail(user_id, project_id)
    return ApiResponseData.ok(data=detail)


@router.put('/api/projects/{project_id}', auth=AuthBearer())
def update_project(request: HttpRequest, project_id: str, payload: UpdateProjectIn):
    """更新项目"""
    user_id = request.user_id
    project = services.update_project(user_id, project_id, payload)
    return ApiResponseData.ok(data=project, message='更新成功')


@router.delete('/api/projects/{project_id}', auth=AuthBearer())
def delete_project(request: HttpRequest, project_id: str):
    """删除项目（仅所有者）"""
    user_id = request.user_id
    services.delete_project(user_id, project_id)
    return ApiResponseData.ok(message='删除成功')


# ═══════════════════════════════════════════════════════════
#  Project Members
# ═══════════════════════════════════════════════════════════

@router.get('/api/projects/{project_id}/members', auth=OptionalAuthBearer())
def get_project_members(request: HttpRequest, project_id: str):
    """获取项目成员列表"""
    user_id = getattr(request, 'user_id', 0) or 0
    members = services.get_project_members(user_id, project_id)
    return ApiResponseData.ok(data=members)


# ═══════════════════════════════════════════════════════════
#  Project Files
# ═══════════════════════════════════════════════════════════

@router.post('/api/projects/{project_id}/files', auth=AuthBearer())
def create_file(request: HttpRequest, project_id: str, payload: CreateFileIn):
    """创建项目文件"""
    user_id = request.user_id
    file = services.create_file(user_id, project_id, payload)
    return ApiResponseData.created(data=file, message='文件创建成功')


@router.get('/api/projects/{project_id}/files/{file_id}', auth=AuthBearer())
def get_file_detail(request: HttpRequest, project_id: str, file_id: str):
    """获取文件详情"""
    user_id = request.user_id
    file = services.get_file_detail(user_id, project_id, file_id)
    return ApiResponseData.ok(data=file)


@router.put('/api/projects/{project_id}/files/{file_id}', auth=AuthBearer())
def update_file(request: HttpRequest, project_id: str, file_id: str, payload: UpdateFileIn):
    """更新文件"""
    user_id = request.user_id
    file = services.update_file(user_id, project_id, file_id, payload)
    return ApiResponseData.ok(data=file, message='更新成功')


@router.delete('/api/projects/{project_id}/files/{file_id}', auth=AuthBearer())
def delete_file(request: HttpRequest, project_id: str, file_id: str):
    """删除文件"""
    user_id = request.user_id
    services.delete_file(user_id, project_id, file_id)
    return ApiResponseData.ok(message='删除成功')


# ═══════════════════════════════════════════════════════════
#  Favorites
# ═══════════════════════════════════════════════════════════

@router.post('/api/projects/{project_id}/favorite', auth=AuthBearer())
def favorite_project(request: HttpRequest, project_id: str):
    """收藏项目"""
    user_id = request.user_id
    services.favorite_project(user_id, project_id)
    return ApiResponseData.ok(message='收藏成功')


@router.delete('/api/projects/{project_id}/favorite', auth=AuthBearer())
def unfavorite_project(request: HttpRequest, project_id: str):
    """取消收藏"""
    user_id = request.user_id
    services.unfavorite_project(user_id, project_id)
    return ApiResponseData.ok(message='已取消收藏')


@router.get('/api/projects/{project_id}/favorite/check', auth=AuthBearer())
def check_favorite(request: HttpRequest, project_id: str):
    """检查是否已收藏"""
    user_id = request.user_id
    is_fav = services.check_favorite(user_id, project_id)
    return ApiResponseData.ok(data={'favorited': is_fav})


@router.get('/api/projects/my/favorites', auth=AuthBearer())
def get_favorite_projects(request: HttpRequest,
                          page: int = 1,
                          size: int = 20):
    """获取我收藏的项目列表"""
    user_id = request.user_id
    result = services.get_favorite_projects(user_id, page, size)
    return ApiResponseData.paginated(
        items=result.items,
        total=result.total,
        page=result.page,
        size=result.size,
    )


# ═══════════════════════════════════════════════════════════
#  Likes
# ═══════════════════════════════════════════════════════════

@router.post('/api/projects/{project_id}/like', auth=AuthBearer())
def like_project(request: HttpRequest, project_id: str):
    """点赞项目"""
    user_id = request.user_id
    services.like_project(user_id, project_id)
    return ApiResponseData.ok(message='点赞成功')


@router.delete('/api/projects/{project_id}/like', auth=AuthBearer())
def unlike_project(request: HttpRequest, project_id: str):
    """取消点赞"""
    user_id = request.user_id
    services.unlike_project(user_id, project_id)
    return ApiResponseData.ok(message='已取消点赞')


@router.get('/api/projects/{project_id}/like/check', auth=AuthBearer())
def check_like(request: HttpRequest, project_id: str):
    """检查是否已点赞"""
    user_id = request.user_id
    is_liked = services.check_like(user_id, project_id)
    return ApiResponseData.ok(data={'liked': is_liked})


@router.get('/api/projects/my/likes', auth=AuthBearer())
def get_liked_projects(request: HttpRequest,
                       page: int = 1,
                       size: int = 20):
    """获取我点赞的项目列表"""
    user_id = request.user_id
    result = services.get_liked_projects(user_id, page, size)
    return ApiResponseData.paginated(
        items=result.items,
        total=result.total,
        page=result.page,
        size=result.size,
    )


# ═══════════════════════════════════════════════════════════
#  Project Market
# ═══════════════════════════════════════════════════════════

@router.get('/api/market/projects/list', auth=None)
def market_project_list(request: HttpRequest,
                        keyword: str = None,
                        category: str = None,
                        page: int = 1,
                        size: int = 20):
    """获取项目市场列表"""
    result = services.list_market_projects(keyword, category, page, size)
    return ApiResponseData.ok(data={
        'projects': result.items,
        'total': result.total,
        'page': result.page,
        'size': result.size,
    })


@router.get('/api/market/projects/{project_id}', auth=None)
def market_project_detail(request: HttpRequest, project_id: str):
    """获取项目市场详情"""
    detail = services.get_market_project_detail(project_id)
    return ApiResponseData.ok(data=detail)


# ═══════════════════════════════════════════════════════════
#  Project Comments
# ═══════════════════════════════════════════════════════════

@router.post('/api/market/comments', auth=AuthBearer())
def create_project_comment(request: HttpRequest, payload: dict = Body(None)):
    """创建项目评论"""
    user_id = request.user_id
    payload = payload or {}
    comment = services.create_comment(
        user_id, payload.get('projectId', ''),
        payload.get('content', ''),
        payload.get('parentId', None),
    )
    return ApiResponseData.created(data=comment, message='评论成功')


@router.get('/api/market/comments/project/{project_id}', auth=None)
def get_project_comments(request: HttpRequest, project_id: str):
    """获取项目一级评论"""
    comments = services.get_project_comments(project_id)
    return ApiResponseData.ok(data=comments)


@router.get('/api/market/comments/replies/{parent_id}', auth=None)
def get_comment_replies(request: HttpRequest, parent_id: str):
    """获取评论回复"""
    replies = services.get_comment_replies(parent_id)
    return ApiResponseData.ok(data=replies)


@router.get('/api/market/comments/project/{project_id}/all', auth=None)
def get_project_all_comments(request: HttpRequest, project_id: str):
    """获取项目全部评论"""
    comments = services.get_project_all_comments(project_id)
    return ApiResponseData.ok(data=comments)


@router.delete('/api/market/comments/{comment_id}', auth=AuthBearer())
def delete_project_comment(request: HttpRequest, comment_id: str):
    """删除评论"""
    user_id = request.user_id
    services.delete_comment(user_id, comment_id)
    return ApiResponseData.ok(message='评论删除成功')


@router.put('/api/market/comments/{comment_id}/likes', auth=None)
def update_comment_likes(request: HttpRequest, comment_id: str, count: int = 0):
    """更新评论点赞数"""
    comment = services.update_comment_likes(comment_id, count)
    return ApiResponseData.ok(data=comment)


@router.get('/api/market/comments/project/{project_id}/count', auth=None)
def get_project_comment_count(request: HttpRequest, project_id: str):
    """获取项目评论数"""
    count = services.get_project_comment_count(project_id)
    return ApiResponseData.ok(data={'count': count})


# ═══════════════════════════════════════════════════════════
#  Plugins — List
# ═══════════════════════════════════════════════════════════

@router.get('/api/plugins', auth=None)
def list_plugins(request: HttpRequest, source: str = 'all'):
    """获取插件列表（按来源筛选）"""
    plugins = services.get_plugins(source)
    return ApiResponseData.ok(data={'plugins': plugins})


@router.get('/api/plugins/all', auth=AuthBearer())
def list_all_plugins(request: HttpRequest):
    """获取全部插件（包含未激活）"""
    plugins = services.get_all_plugins()
    return ApiResponseData.ok(data={'plugins': plugins})


# ═══════════════════════════════════════════════════════════
#  Project Plugins
# ═══════════════════════════════════════════════════════════

@router.get('/api/projects/{project_id}/plugins', auth=None)
def get_project_plugins(request: HttpRequest, project_id: str):
    """获取项目已启用插件"""
    plugins = services.get_project_plugins(project_id)
    return ApiResponseData.ok(data={'plugins': plugins})


@router.get('/api/projects/{project_id}/plugins/ids', auth=None)
def get_project_plugin_ids(request: HttpRequest, project_id: str):
    """获取项目已启用插件 ID 列表"""
    ids = services.get_project_plugin_ids(project_id)
    return ApiResponseData.ok(data={'pluginIds': ids})


@router.get('/api/projects/{project_id}/plugins/keys', auth=None)
def get_project_plugin_keys(request: HttpRequest, project_id: str):
    """获取项目已启用插件 Key 列表"""
    keys = services.get_project_plugin_keys(project_id)
    return ApiResponseData.ok(data={'pluginKeys': keys})


@router.post('/api/projects/{project_id}/plugins/{plugin_id_or_key}', auth=None)
def enable_plugin(request: HttpRequest, project_id: str, plugin_id_or_key: str):
    """启用插件"""
    pp = services.enable_plugin(project_id, plugin_id_or_key)
    return ApiResponseData.created(data=pp)


@router.delete('/api/projects/{project_id}/plugins/{plugin_id_or_key}', auth=None)
def disable_plugin(request: HttpRequest, project_id: str, plugin_id_or_key: str):
    """停用插件"""
    services.disable_plugin(project_id, plugin_id_or_key)
    return ApiResponseData.ok(message='停用成功')


@router.post('/api/projects/{project_id}/plugins/{plugin_id_or_key}/toggle', auth=None)
def toggle_plugin(request: HttpRequest, project_id: str, plugin_id_or_key: str):
    """切换插件状态"""
    enabled = services.toggle_plugin(project_id, plugin_id_or_key)
    return ApiResponseData.ok(data={'enabled': enabled})


@router.post('/api/projects/{project_id}/plugins/key/{plugin_key}/toggle', auth=None)
def toggle_plugin_by_key(request: HttpRequest, project_id: str, plugin_key: str):
    """通过 Key 切换插件状态"""
    enabled = services.toggle_plugin(project_id, plugin_key)
    return ApiResponseData.ok(data={'enabled': enabled})


@router.get('/api/projects/{project_id}/plugins/{plugin_id_or_key}/check', auth=None)
def check_plugin_enabled(request: HttpRequest, project_id: str, plugin_id_or_key: str):
    """检查插件是否已启用"""
    enabled = services.is_plugin_enabled(project_id, plugin_id_or_key)
    return ApiResponseData.ok(data={'enabled': enabled})
