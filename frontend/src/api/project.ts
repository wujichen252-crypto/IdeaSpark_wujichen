/**
 * 项目管理接口
 * @description 封装项目模块的所有 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'
import type { 
  ProjectListResult, 
  GetMyProjectsParams, 
  CreateProjectParams, 
  CreateProjectResult,
  Project,
  ProjectMember
} from './types'

/**
 * 获取我的项目列表
 * @param params - 分页和筛选参数
 */
export function getMyProjects(params?: GetMyProjectsParams) {
  return service.get<ApiResponse<ProjectListResult>>('/api/projects/my', { params })
}

/**
 * 获取指定用户的公开项目列表
 * @param userId - 用户ID
 * @param params - 分页参数
 */
export function getUserProjects(userId: number, params?: GetMyProjectsParams) {
  return service.get<ApiResponse<ProjectListResult>>(`/api/projects/user/${userId}`, { params })
}

/**
 * 收藏项目
 * @param projectId - 项目ID
 */
export function favoriteProject(projectId: string) {
  return service.post<ApiResponse<{ favorited: boolean }>>(`/api/projects/${projectId}/favorite`)
}

/**
 * 取消收藏项目
 * @param projectId - 项目ID
 */
export function unfavoriteProject(projectId: string) {
  return service.delete<ApiResponse<{ favorited: boolean }>>(`/api/projects/${projectId}/favorite`)
}

/**
 * 检查是否已收藏
 * @param projectId - 项目ID
 */
export function checkFavorite(projectId: string) {
  return service.get<ApiResponse<{ favorited: boolean }>>(`/api/projects/${projectId}/favorite/check`)
}

/**
 * 点赞项目
 * @param projectId - 项目ID
 */
export function likeProject(projectId: string) {
  return service.post<ApiResponse<{ liked: boolean }>>(`/api/projects/${projectId}/like`)
}

/**
 * 取消点赞项目
 * @param projectId - 项目ID
 */
export function unlikeProject(projectId: string) {
  return service.delete<ApiResponse<{ liked: boolean }>>(`/api/projects/${projectId}/like`)
}

/**
 * 检查是否已点赞
 * @param projectId - 项目ID
 */
export function checkLiked(projectId: string) {
  return service.get<ApiResponse<{ liked: boolean }>>(`/api/projects/${projectId}/like/check`)
}

/**
 * 获取我收藏的项目列表
 * @param params - 分页参数
 */
export function getMyFavorites(params?: GetMyProjectsParams) {
  return service.get<ApiResponse<ProjectListResult>>('/api/projects/my/favorites', { params })
}

/**
 * 创建项目
 * @param params - 创建项目参数
 */
export function createProject(params: CreateProjectParams) {
  return service.post<ApiResponse<CreateProjectResult>>('/api/projects', params)
}

/**
 * 获取项目详情
 * @param projectId - 项目ID
 */
export function getProjectDetail(projectId: string) {
  return service.get<ApiResponse<Project>>(`/api/projects/${projectId}`)
}

/**
 * 获取项目成员列表
 * @param projectId - 项目ID
 */
export function getProjectMembers(projectId: string) {
  return service.get<ApiResponse<{ members: ProjectMember[] }>>(`/api/projects/${projectId}/members`)
}

/**
 * 更新项目信息
 * @param projectId - 项目ID
 * @param params - 更新参数
 */
export function updateProject(projectId: string, params: Partial<CreateProjectParams>) {
  return service.put<ApiResponse<Project>>(`/api/projects/${projectId}`, params)
}

/**
 * 删除项目
 * @param projectId - 项目ID
 * @param confirmation - 确认删除文本
 */
export function deleteProject(projectId: string, confirmation: string = '确认删除项目') {
  return service.delete<ApiResponse<{ projectId: string; projectName: string }>>(`/api/projects/${projectId}`, {
    data: { confirmation }
  })
}
