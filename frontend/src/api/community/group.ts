/**
 * 社区圈子接口
 * @description 封装社区圈子模块的所有 HTTP 请求方法
 */
import service from '../request'
import type { ApiResponse } from '../types'
import type {
  Group,
  GroupDetail,
  GroupMember,
  CreateGroupParams,
  UpdateGroupParams,
  UpdateGroupMemberRoleParams,
  MyGroupItem,
  GroupMemberCountResult,
  GroupMembershipResult
} from '../types'

/**
 * 创建圈子
 * @param params - 圈子创建参数
 */
export function createGroup(params: CreateGroupParams) {
  return service.post<ApiResponse<GroupDetail>>('/api/community/groups', params)
}

/**
 * 获取圈子列表
 * @returns 返回标准响应格式 { status, message, data: Group[] }
 */
export function getGroupList() {
  return service.get<ApiResponse<Group[]>>('/api/community/groups')
}

/**
 * 获取圈子详情
 * @param groupId - 圈子 ID
 */
export function getGroupDetail(groupId: string) {
  return service.get<ApiResponse<GroupDetail>>(`/api/community/groups/${groupId}`)
}

/**
 * 更新圈子
 * @param groupId - 圈子 ID
 * @param params - 更新参数
 */
export function updateGroup(groupId: string, params: UpdateGroupParams) {
  return service.put<ApiResponse<GroupDetail>>(`/api/community/groups/${groupId}`, params)
}

/**
 * 删除圈子
 * @param groupId - 圈子 ID
 */
export function deleteGroup(groupId: string) {
  return service.delete<ApiResponse<null>>(`/api/community/groups/${groupId}`)
}

/**
 * 加入圈子
 * @param groupId - 圈子 ID
 */
export function joinGroup(groupId: string) {
  return service.post<ApiResponse<null>>(`/api/community/groups/${groupId}/join`)
}

/**
 * 退出圈子
 * @param groupId - 圈子 ID
 */
export function quitGroup(groupId: string) {
  return service.delete<ApiResponse<null>>(`/api/community/groups/${groupId}/join`)
}

/**
 * 获取我加入的圈子列表
 */
export function getMyGroups() {
  return service.get<ApiResponse<MyGroupItem[]>>('/api/community/groups/my')
}

/**
 * 获取圈子成员数
 * @param groupId - 圈子 ID
 */
export function getGroupMemberCount(groupId: string) {
  return service.get<ApiResponse<GroupMemberCountResult>>(
    `/api/community/groups/${groupId}/members/count`
  )
}

/**
 * 检查当前用户是否在圈子中
 * @param groupId - 圈子 ID
 */
export function checkGroupMembership(groupId: string) {
  return service.get<ApiResponse<GroupMembershipResult>>(`/api/community/groups/${groupId}/check`)
}

/**
 * 获取圈子成员列表
 * @param groupId - 圈子 ID
 */
export function getGroupMembers(groupId: string) {
  return service.get<ApiResponse<GroupMember[]>>(`/api/community/groups/${groupId}/members`)
}

/**
 * 移除圈子成员
 * @param groupId - 圈子 ID
 * @param memberId - 成员 ID
 */
export function removeGroupMember(groupId: string, memberId: string) {
  return service.delete<ApiResponse<{ memberId: string; message: string }>>(
    `/api/community/groups/${groupId}/members/${memberId}`
  )
}

/**
 * 更新圈子成员角色
 * @param groupId - 圈子 ID
 * @param memberId - 成员 ID
 * @param params - 角色参数
 */
export function updateGroupMemberRole(
  groupId: string,
  memberId: string,
  params: UpdateGroupMemberRoleParams
) {
  return service.put<ApiResponse<{ memberId: string; oldRole: string; newRole: string; message: string }>>(
    `/api/community/groups/${groupId}/members/${memberId}/role`,
    params
  )
}
