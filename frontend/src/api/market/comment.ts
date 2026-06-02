/**
 * 项目市场评论接口
 * @description 封装项目市场评论模块的所有 HTTP 请求方法
 */
import service from '../request'
import type { ApiResponse } from '../types'

/**
 * 项目评论类型
 */
export interface ProjectComment {
  id: string
  projectId: string
  content: string
  userId: number
  username: string
  avatar?: string
  likesCount: number
  parentId: string | null
  createdAt: string
  updatedAt: string
  isLiked?: boolean
  replies?: ProjectComment[]
}

/**
 * 创建评论参数
 */
export interface CreateProjectCommentParams {
  projectId: string
  content: string
  parentId?: string
}

/**
 * 发布评论
 * @param params - 评论创建参数
 */
export function createProjectComment(params: CreateProjectCommentParams) {
  return service.post<ApiResponse<ProjectComment>>('/api/market/comments', params)
}

/**
 * 获取项目的一级评论
 * @param projectId - 项目 ID
 */
export function getProjectComments(projectId: string) {
  return service.get<ApiResponse<ProjectComment[]>>(`/api/market/comments/project/${projectId}`)
}

/**
 * 获取项目的所有评论（包括回复）
 * @param projectId - 项目 ID
 */
export function getAllProjectComments(projectId: string) {
  return service.get<ApiResponse<ProjectComment[]>>(`/api/market/comments/project/${projectId}/all`)
}

/**
 * 获取评论的回复列表
 * @param parentId - 父评论 ID
 */
export function getCommentReplies(parentId: string) {
  return service.get<ApiResponse<ProjectComment[]>>(`/api/market/comments/replies/${parentId}`)
}

/**
 * 删除评论
 * @param commentId - 评论 ID
 */
export function deleteProjectComment(commentId: string) {
  return service.delete<ApiResponse<null>>(`/api/market/comments/${commentId}`)
}

/**
 * 更新评论点赞数
 * @param commentId - 评论 ID
 * @param count - 点赞数
 */
export function updateCommentLikes(commentId: string, count: number) {
  return service.put<ApiResponse<ProjectComment>>(
    `/api/market/comments/${commentId}/likes`,
    null,
    { params: { count } }
  )
}

/**
 * 获取项目评论数量
 * @param projectId - 项目 ID
 */
export function getProjectCommentCount(projectId: string) {
  return service.get<ApiResponse<{ count: number }>>(`/api/market/comments/project/${projectId}/count`)
}
