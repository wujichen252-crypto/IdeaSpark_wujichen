/**
 * 项目插件管理接口
 * @description 封装项目插件关联的所有 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'
import type { Plugin } from './plugin'

/**
 * 项目插件关联信息
 */
export interface ProjectPlugin {
  id: string
  projectId: string
  pluginId: string
  sortOrder: number
  createdAt: string
  plugin?: Plugin
}

/**
 * 获取项目已启用的插件列表
 * @param projectId - 项目ID
 */
export function getProjectPlugins(projectId: string) {
  return service.get<ApiResponse<{ plugins: ProjectPlugin[] }>>(`/api/projects/${projectId}/plugins`)
}

/**
 * 获取项目已启用的插件ID列表
 * @param projectId - 项目ID
 */
export function getProjectPluginIds(projectId: string) {
  return service.get<ApiResponse<{ pluginIds: string[] }>>(`/api/projects/${projectId}/plugins/ids`)
}

/**
 * 获取项目已启用的插件Key列表
 * @param projectId - 项目ID
 */
export function getProjectPluginKeys(projectId: string) {
  return service.get<ApiResponse<{ pluginKeys: string[] }>>(`/api/projects/${projectId}/plugins/keys`)
}

/**
 * 为项目启用插件
 * @param projectId - 项目ID
 * @param pluginId - 插件ID
 */
export function enableProjectPlugin(projectId: string, pluginId: string) {
  return service.post<ApiResponse<ProjectPlugin>>(`/api/projects/${projectId}/plugins/${pluginId}`)
}

/**
 * 为项目停用插件
 * @param projectId - 项目ID
 * @param pluginId - 插件ID
 */
export function disableProjectPlugin(projectId: string, pluginId: string) {
  return service.delete<ApiResponse<void>>(`/api/projects/${projectId}/plugins/${pluginId}`)
}

/**
 * 切换项目插件状态（通过插件ID）
 * @param projectId - 项目ID
 * @param pluginId - 插件ID
 */
export function toggleProjectPlugin(projectId: string, pluginId: string) {
  return service.post<ApiResponse<{ enabled: boolean }>>(`/api/projects/${projectId}/plugins/${pluginId}/toggle`)
}

/**
 * 切换项目插件状态（通过插件Key）
 * @param projectId - 项目ID
 * @param pluginKey - 插件Key
 */
export function toggleProjectPluginByKey(projectId: string, pluginKey: string) {
  return service.post<ApiResponse<{ enabled: boolean }>>(`/api/projects/${projectId}/plugins/key/${pluginKey}/toggle`)
}

/**
 * 检查插件是否已启用
 * @param projectId - 项目ID
 * @param pluginId - 插件ID
 */
export function checkProjectPluginEnabled(projectId: string, pluginId: string) {
  return service.get<ApiResponse<{ enabled: boolean }>>(`/api/projects/${projectId}/plugins/${pluginId}/check`)
}
