/**
 * 项目市场接口
 * @description 封装项目市场模块的所有 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'
import type {
  MarketProject,
  MarketProjectDetail,
  MarketProjectListResult,
  GetMarketProjectsParams
} from './types'

export type { MarketProject, MarketProjectDetail, MarketProjectListResult, GetMarketProjectsParams }

/**
 * 获取项目市场列表
 * @param params - 查询参数
 */
export function getProjectList(params?: GetMarketProjectsParams) {
  return service.get<ApiResponse<MarketProjectListResult>>('/api/market/projects/list', { params })
}

/**
 * 获取项目市场详情
 * @param projectId - 项目 ID
 */
export function getMarketProjectDetail(projectId: string) {
  return service.get<ApiResponse<MarketProjectDetail>>(`/api/market/projects/${projectId}`)
}
