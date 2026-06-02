/**
 * 邀请管理接口
 * @description 封装邀请管理模块的 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'
import type { InvitationValidateResult } from './types'

/**
 * 验证团队邀请链接
 * @param token - 邀请令牌
 */
export function validateInvitation(token: string) {
  return service.get<ApiResponse<InvitationValidateResult>>('/api/invitations/validate', { params: { token } })
}
