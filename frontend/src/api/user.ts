/**
 * 用户管理接口
 * @description 封装用户模块的所有 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'
import type {
  LoginParams,
  RegisterParams,
  UpdateUserParams,
  User,
  LoginResult,
  GetUsersParams,
  PageData,
  DeleteUsersParams
} from './types'

/**
 * 获取当前登录用户信息
 */
export function getCurrentUser() {
  return service.get<ApiResponse<User>>('/api/user/me')
}

/**
 * 用户登录
 * @param params - 登录参数
 */
export function login(params: LoginParams) {
  return service.post<ApiResponse<LoginResult>>('/api/user/login', params)
}

/**
 * 用户注册
 * @param params - 注册参数
 */
export function register(params: RegisterParams) {
  return service.post<ApiResponse<User>>('/api/user/register', params)
}

/**
 * 更新用户信息
 * @param params - 更新参数
 */
export function updateUser(params: UpdateUserParams) {
  return service.post<ApiResponse<User>>('/api/user/update', params)
}

/**
 * 分页查询用户列表
 * @param params - 查询参数
 */
export function getAllUsers(params?: GetUsersParams) {
  return service.get<ApiResponse<PageData<User>>>('/api/user/getAllUsers', { params })
}

/**
 * 批量删除用户
 * @param params - 删除参数
 */
export function deleteUsers(params: DeleteUsersParams) {
  return service.post<ApiResponse<null>>('/api/user/deleteUsers', params)
}

/**
 * 刷新 Token
 */
export function refreshToken(refreshToken: string) {
  return service.post<ApiResponse<LoginResult>>('/api/user/refresh-token', { refreshToken })
}

/**
 * 用户统计数据
 */
export interface UserStats {
  postCount: number
  projectCount: number
  followingCount: number
  followerCount: number
}

/**
 * 获取用户统计数据
 */
export function getUserStats() {
  return service.get<ApiResponse<UserStats>>('/api/user/stats')
}

/**
 * 根据ID获取用户公开信息
 * @param id - 用户ID
 */
export function getUserById(id: number) {
  return service.get<ApiResponse<User>>('/api/user/' + id)
}

/**
 * 请求密码重置
 * @param email - 用户邮箱
 */
export function forgotPassword(email: string) {
  return service.post<ApiResponse<null>>('/api/user/forgot-password', { email })
}

/**
 * 验证重置令牌
 * @param token - 重置令牌
 */
export function validateResetToken(token: string) {
  return service.get<ApiResponse<{ email: string }>>('/api/user/validate-reset-token', { params: { token } })
}

/**
 * 重置密码
 * @param token - 重置令牌
 * @param newPassword - 新密码
 */
export function resetPassword(token: string, newPassword: string) {
  return service.post<ApiResponse<null>>('/api/user/reset-password', { token, newPassword })
}
