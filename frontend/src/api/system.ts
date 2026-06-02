/**
 * 系统接口
 * @description 封装系统相关的 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'
import type { SystemHomeResult, HealthCheckResult } from './types'

/**
 * 获取系统主页信息
 */
export function getSystemHome() {
  return service.get<ApiResponse<SystemHomeResult>>('/')
}

/**
 * 系统健康检查
 */
export function healthCheck() {
  return service.get<ApiResponse<string>>('/ping')
}

/**
 * 获取 API 根路径信息
 */
export function getApiRoot() {
  return service.get<ApiResponse<{ user: string }>>('/api')
}

/**
 * 初始化社区圈子数据（管理员接口）
 * 会清空现有圈子并插入20个完整的圈子
 */
export function initCommunityGroups() {
  return service.post<ApiResponse<{ insertedCount: number; message: string }>>('/api/admin/init/community-groups')
}
