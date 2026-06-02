/**
 * 插件管理接口
 * @description 封装插件模块的所有 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'

/**
 * 插件导出配置
 */
export interface PluginExportConfig {
  ext: string
  mime: string
  filenameSuffix?: string
}

/**
 * 插件信息
 */
export interface Plugin {
  id: string
  key: string
  name: string
  category: string
  description: string
  isActive: boolean
  icon: string
  color: string
  source: 'official' | 'community' | 'premium'
  export: PluginExportConfig
  prompt: string
  price: number
  usageCount: number
  tags: string
  isPremium: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 获取插件列表
 * @param source - 来源筛选：all-全部, official-官方, community-社区, premium-高级
 */
export function getPlugins(source: 'all' | 'official' | 'community' | 'premium' = 'all') {
  return service.get<ApiResponse<{ plugins: Plugin[] }>>('/api/plugins', { params: { source } })
}

/**
 * 获取所有插件（包括未启用的，供管理员使用）
 */
export function getAllPlugins() {
  return service.get<ApiResponse<{ plugins: Plugin[] }>>('/api/plugins/all')
}
