/**
 * 社区点赞接口
 * @description 封装社区点赞模块的所有 HTTP 请求方法
 */
import service from '../request'
import type { ApiResponse } from '../types'
import type { LikeCountResult, LikeCheckResult } from '../types'

/**
 * 点赞帖子
 * @param postId - 帖子 ID
 */
export function likePost(postId: string) {
  return service.post<ApiResponse<null>>(`/api/community/likes/post/${postId}`)
}

/**
 * 取消点赞帖子
 * @param postId - 帖子 ID
 */
export function unlikePost(postId: string) {
  return service.delete<ApiResponse<null>>(`/api/community/likes/post/${postId}`)
}

/**
 * 获取帖子点赞数
 * @param postId - 帖子 ID
 * @description 后端直接返回 {count: number}，非标准包装格式
 */
export function getPostLikeCount(postId: string) {
  return service.get<LikeCountResult>(`/api/community/likes/post/${postId}/count`)
}

/**
 * 检查是否点赞帖子
 * @param postId - 帖子 ID
 * @description 后端直接返回 {liked: boolean}，非标准包装格式
 */
export function checkPostLiked(postId: string) {
  return service.get<LikeCheckResult>(`/api/community/likes/post/${postId}/check`)
}

/**
 * 点赞评论
 * @param commentId - 评论 ID
 */
export function likeComment(commentId: string) {
  return service.post<ApiResponse<null>>(`/api/community/likes/comment/${commentId}`)
}

/**
 * 取消点赞评论
 * @param commentId - 评论 ID
 */
export function unlikeComment(commentId: string) {
  return service.delete<ApiResponse<null>>(`/api/community/likes/comment/${commentId}`)
}

/**
 * 获取评论点赞数
 * @param commentId - 评论 ID
 * @description 后端直接返回 {count: number}，非标准包装格式
 */
export function getCommentLikeCount(commentId: string) {
  return service.get<LikeCountResult>(`/api/community/likes/comment/${commentId}/count`)
}

/**
 * 检查是否点赞评论
 * @param commentId - 评论 ID
 * @description 后端直接返回 {liked: boolean}，非标准包装格式
 */
export function checkCommentLiked(commentId: string) {
  return service.get<LikeCheckResult>(`/api/community/likes/comment/${commentId}/check`)
}
