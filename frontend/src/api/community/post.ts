/**
 * 社区帖子接口
 * @description 封装社区帖子模块的所有 HTTP 请求方法
 */
import service from '../request'
import type { ApiResponse } from '../types'
import type {
  Post,
  PostDetail,
  CreatePostParams,
  UpdatePostParams
} from '../types'

/**
 * 创建帖子
 * @param params - 帖子创建参数
 * @returns 返回标准响应格式 { status, message, data }
 */
export function createPost(params: CreatePostParams) {
  return service.post<ApiResponse<PostDetail>>('/api/community/posts', params)
}

/**
 * 获取帖子列表
 * @param channel - 可选，按圈子频道过滤
 * @returns 返回标准响应格式 { status, message, data }
 */
export function getPostList(channel?: string) {
  return service.get<ApiResponse<Post[]>>('/api/community/posts', {
    params: channel ? { channel } : undefined
  })
}

/**
 * 获取最新帖子列表（按时间排序）
 * @returns 返回标准响应格式 { status, message, data }
 */
export function getLatestPosts() {
  return service.get<ApiResponse<Post[]>>('/api/community/posts/feed/latest')
}

/**
 * 获取推荐帖子列表（按热度排序）
 * @returns 返回标准响应格式 { status, message, data }
 */
export function getRecommendPosts() {
  return service.get<ApiResponse<Post[]>>('/api/community/posts/feed/recommend')
}

/**
 * 获取关注用户的帖子列表
 * @returns 返回标准响应格式 { status, message, data }
 * @description 需要登录，返回当前用户关注的用户发布的帖子
 */
export function getFollowingPosts() {
  return service.get<ApiResponse<Post[]>>('/api/community/posts/feed/following')
}

/**
 * 获取帖子详情
 * @param postId - 帖子 ID
 * @returns 可能返回：
 *   - 标准响应格式 { status: 200, message, data: PostDetail }
 *   - 错误数组 ["这条动态不存在或已被删除。"]（当帖子不存在时）
 */
export function getPostDetail(postId: string) {
  return service.get<ApiResponse<PostDetail> | string[]>(`/api/community/posts/${postId}`)
}

/**
 * 更新帖子
 * @param postId - 帖子 ID
 * @param params - 更新参数
 * @returns 返回标准响应格式 { status, message, data: PostDetail }
 */
export function updatePost(postId: string, params: UpdatePostParams) {
  return service.put<ApiResponse<PostDetail>>(`/api/community/posts/${postId}`, params)
}

/**
 * 删除帖子
 * @param postId - 帖子 ID
 * @returns 返回标准响应格式 { status, message }
 */
export function deletePost(postId: string) {
  return service.delete<ApiResponse<null>>(`/api/community/posts/${postId}`)
}

/**
 * 更新帖子点赞数
 * @param postId - 帖子 ID
 * @param count - 点赞数
 * @returns 返回 CommunityPost 实体对象（非标准包装格式）
 * @description 后端直接返回实体对象，非标准包装格式
 */
export function updatePostLikes(postId: string, count: number) {
  return service.put<PostDetail>(
    `/api/community/posts/${postId}/likes`,
    null,
    { params: { count } }
  )
}

/**
 * 更新帖子评论数
 * @param postId - 帖子 ID
 * @param count - 评论数
 * @returns 返回标准响应格式 { status, message, data: { id, commentsCount } }
 */
export function updatePostComments(postId: string, count: number) {
  return service.put<ApiResponse<{ id: string; commentsCount: number }>>(
    `/api/community/posts/${postId}/comments`,
    null,
    { params: { count } }
  )
}

/**
 * 获取指定用户的帖子列表
 * @param userId - 用户 ID
 */
export function getUserPosts(userId: number) {
  return service.get<ApiResponse<Post[]>>(`/api/community/posts/user/${userId}`)
}
