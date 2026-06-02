/**
 * 消息通知接口
 * @description 封装消息通知模块的所有 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'

/**
 * 消息通知类型
 */
export interface Notification {
  id: number
  type: 'SYSTEM' | 'COMMENT' | 'LIKE' | 'FOLLOW' | 'PROJECT'
  title: string
  content: string
  isRead: boolean
  relatedId?: string
  relatedType?: string
  senderId?: number
  senderName?: string
  senderAvatar?: string
  createdAt: string
  timeAgo: string
}

/**
 * 消息列表响应
 */
export interface NotificationListResult {
  notifications: Notification[]
  total: number
  page: number
  size: number
  totalPages: number
}

/**
 * 未读数量响应
 */
export interface UnreadCountResult {
  count: number
}

/**
 * 获取消息列表
 * @param params - 查询参数
 */
export function getNotifications(params?: {
  type?: string
  page?: number
  size?: number
}) {
  return service.get<ApiResponse<NotificationListResult>>('/api/notifications', { params })
}

/**
 * 获取未读消息列表
 */
export function getUnreadNotifications() {
  return service.get<ApiResponse<Notification[]>>('/api/notifications/unread')
}

/**
 * 获取未读消息数量
 */
export function getUnreadCount() {
  return service.get<ApiResponse<UnreadCountResult>>('/api/notifications/unread/count')
}

/**
 * 标记消息为已读
 * @param id - 消息ID
 */
export function markAsRead(id: number) {
  return service.put<ApiResponse<null>>(`/api/notifications/${id}/read`)
}

/**
 * 标记所有消息为已读
 */
export function markAllAsRead() {
  return service.put<ApiResponse<null>>('/api/notifications/read/all')
}

/**
 * 删除已读消息
 */
export function deleteReadNotifications() {
  return service.delete<ApiResponse<null>>('/api/notifications/read')
}

/**
 * 删除单条消息
 * @param id - 消息ID
 */
export function deleteNotification(id: number) {
  return service.delete<ApiResponse<null>>(`/api/notifications/${id}`)
}
