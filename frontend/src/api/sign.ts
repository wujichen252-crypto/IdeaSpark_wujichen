/**
 * 报名审核统计接口
 * @description 封装报名审核统计模块的 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'
import type {
  GetSignApplicationStatsParams,
  SignApplicationStatsResponse
} from './types'

/**
 * 获取报名审核统计
 * @param params - 统计参数
 * @deprecated 后端暂未实现此接口
 */
export function getSignApplicationStats(params?: GetSignApplicationStatsParams) {
  // TODO: 后端暂未实现此接口，如需使用请联系后端开发
  // return service.get<ApiResponse<SignApplicationStatsResponse>>('/api/sign/applications/stats', { params })
  return Promise.reject(new Error('后端暂未实现此接口: /api/sign/applications/stats'))
}
