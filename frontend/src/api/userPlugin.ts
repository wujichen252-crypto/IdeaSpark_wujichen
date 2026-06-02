/**
 * 用户插件管理接口
 * @description 封装用户拥有插件的所有 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'
import type { Plugin } from './plugin'

/**
 * 获取当前用户已拥有的插件列表
 */
export function getMyPlugins() {
  return service.get<ApiResponse<{ plugins: Plugin[] }>>('/api/user/plugins')
}

/**
 * 获取当前用户已拥有的插件Key列表
 */
export function getMyPluginKeys() {
  return service.get<ApiResponse<{ pluginKeys: string[] }>>('/api/user/plugins/keys')
}

/**
 * 检查是否拥有指定插件
 * @param pluginKey - 插件Key
 */
export function checkPluginOwned(pluginKey: string) {
  return service.get<ApiResponse<{ owned: boolean }>>('/api/user/plugins/check', {
    params: { pluginKey }
  })
}

/**
 * 获取免费插件
 * @param pluginKey - 插件Key
 */
export function acquireFreePlugin(pluginKey: string) {
  return service.post<ApiResponse<{ owned: boolean }>>('/api/user/plugins/acquire', null, {
    params: { pluginKey }
  })
}

/**
 * 购买插件
 * @param pluginKey - 插件Key
 * @param months - 购买月数
 */
export function purchasePlugin(pluginKey: string, months: number = 1) {
  return service.post<ApiResponse<{ owned: boolean }>>('/api/user/plugins/purchase', null, {
    params: { pluginKey, months }
  })
}
