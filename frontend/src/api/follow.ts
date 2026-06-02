/**
 * 用户关注接口
 * @description 封装用户关注模块的所有 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'
import type {
  MyFollowingItem,
  MyFollowerItem,
  FollowCountResult,
  FollowCheckResult,
  RecommendUser
} from './types'

/**
 * 关注用户
 * @param followingId - 被关注用户 ID
 */
export function followUser(followingId: number) {
  return service.post<ApiResponse<null>>(`/api/follows/${followingId}`)
}

/**
 * 取消关注用户
 * @param followingId - 被取消关注的用户 ID
 */
export function unfollowUser(followingId: number) {
  return service.delete<ApiResponse<null>>(`/api/follows/${followingId}`)
}

/**
 * 获取我的关注列表
 */
export function getMyFollowing() {
  return service.get<ApiResponse<MyFollowingItem[]>>('/api/follows/my/following')
}

/**
 * 获取我的粉丝列表
 */
export function getMyFollowers() {
  return service.get<ApiResponse<MyFollowerItem[]>>('/api/follows/my/followers')
}

/**
 * 获取我的关注数
 * @description 后端直接返回 {count: number}，非标准包装格式
 */
export function getMyFollowingCount() {
  return service.get<FollowCountResult>('/api/follows/my/following/count')
}

/**
 * 获取我的粉丝数
 * @description 后端直接返回 {count: number}，非标准包装格式
 */
export function getMyFollowersCount() {
  return service.get<FollowCountResult>('/api/follows/my/followers/count')
}

/**
 * 检查是否已关注
 * @param followingId - 被检查的用户 ID
 */
export function checkFollowing(followingId: number) {
  return service.get<ApiResponse<FollowCheckResult>>(`/api/follows/check/${followingId}`)
}

/**
 * 获取指定用户的关注列表
 * @param userId - 用户 ID
 */
export function getUserFollowing(userId: number) {
  return service.get<ApiResponse<MyFollowingItem[]>>(`/api/follows/user/${userId}/following`)
}

/**
 * 获取指定用户的粉丝列表
 * @param userId - 用户 ID
 */
export function getUserFollowers(userId: number) {
  return service.get<ApiResponse<MyFollowerItem[]>>(`/api/follows/user/${userId}/followers`)
}

/**
 * 获取指定用户的关注数
 * @param userId - 用户 ID
 * @description 后端直接返回 {count: number}，非标准包装格式
 */
export function getUserFollowingCount(userId: number) {
  return service.get<FollowCountResult>(`/api/follows/user/${userId}/following/count`)
}

/**
 * 获取指定用户的粉丝数
 * @param userId - 用户 ID
 * @description 后端直接返回 {count: number}，非标准包装格式
 */
export function getUserFollowersCount(userId: number) {
  return service.get<FollowCountResult>(`/api/follows/user/${userId}/followers/count`)
}

/**
 * 获取推荐关注用户
 * @description 返回未关注的活跃用户列表
 */
export function getRecommendUsers() {
  return service.get<ApiResponse<RecommendUser[]>>('/api/follows/recommend')
}
