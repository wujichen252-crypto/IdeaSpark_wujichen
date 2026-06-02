import service from './request'
import type { ApiResponse } from './types'
import type { ProjectFile } from '@/store/modules/aiWorkshop'

/**
 * 创建项目文件
 * @param projectId - 项目 ID
 * @param file - 文件信息
 */
export function createProjectFile(projectId: string, file: Partial<ProjectFile> & { name: string }) {
  return service.post<ApiResponse<ProjectFile>>(`/api/projects/${projectId}/files`, file)
}

/**
 * 更新项目文件
 * @param projectId - 项目 ID
 * @param fileId - 文件 ID
 * @param updates - 更新内容
 */
export function updateProjectFile(projectId: string, fileId: string, updates: Partial<ProjectFile>) {
  return service.put<ApiResponse<ProjectFile>>(`/api/projects/${projectId}/files/${fileId}`, updates)
}

/**
 * 删除项目文件
 * @param projectId - 项目 ID
 * @param fileId - 文件 ID
 */
export function deleteProjectFile(projectId: string, fileId: string) {
  return service.delete<ApiResponse<{ deleted: boolean }>>(`/api/projects/${projectId}/files/${fileId}`)
}

/**
 * 获取项目文件详情
 * @param projectId - 项目 ID
 * @param fileId - 文件 ID
 */
export function getProjectFileDetail(projectId: string, fileId: string) {
  return service.get<ApiResponse<ProjectFile>>(`/api/projects/${projectId}/files/${fileId}`)
}
