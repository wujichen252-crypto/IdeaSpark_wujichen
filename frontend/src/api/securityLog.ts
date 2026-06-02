/**
 * 安全日志接口
 * @description 封装安全日志模块的所有 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'

/**
 * 安全日志类型
 */
export interface SecurityLog {
  id: number
  actionType: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PROFILE_UPDATE' | 'PASSWORD_RESET' | 'ABNORMAL_LOGIN'
  description: string
  ipAddress?: string
  location?: string
  device?: string
  status?: 'SUCCESS' | 'FAILED'
  createdAt: string
  timeAgo: string
}

/**
 * 安全日志列表响应
 */
export interface SecurityLogListResult {
  logs: SecurityLog[]
  total: number
  page: number
  size: number
  totalPages: number
}

/**
 * 获取安全日志列表
 * @param params - 查询参数
 */
export function getSecurityLogs(params?: {
  page?: number
  size?: number
}) {
  return service.get<ApiResponse<SecurityLogListResult>>('/api/security/logs', { params })
}
