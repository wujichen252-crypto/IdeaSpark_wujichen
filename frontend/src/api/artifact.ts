/**
 * 统一项目资产接口（嵌入式编辑器数据总线）
 * @description 所有嵌入编辑器（白板/导图/流程图等）通过本模块读写 JSON 信封，
 * 与后端 /api/projects/{projectId}/files/{fileId}/content 对齐
 */
import service from './request'
import type { ApiResponse } from './types'

/**
 * 资产内容读取信封（后端 ArtifactContentOut）
 */
export interface ArtifactEnvelope {
  file_id: string
  type: string
  schema_version: number
  payload: Record<string, unknown> | null
  version: string
  updated_at: string | null
}

/**
 * 资产内容写入请求体（后端 ArtifactContentIn）
 */
export interface ArtifactSaveBody {
  type: string
  schema_version?: number
  payload?: Record<string, unknown> | null
  /** 乐观锁：读取时拿到的 version 令牌 */
  base_version?: string | null
}

/**
 * 读取资产内容信封
 * @param projectId - 项目 ID
 * @param fileId - 文件 ID
 */
export function getArtifactContent(projectId: string, fileId: string) {
  return service.get<ApiResponse<ArtifactEnvelope>>(
    `/api/projects/${projectId}/files/${fileId}/content`
  )
}

/**
 * 保存资产内容信封（乐观锁，版本冲突返回 409）
 * @param projectId - 项目 ID
 * @param fileId - 文件 ID
 * @param body - 写入信封
 */
export function saveArtifactContent(projectId: string, fileId: string, body: ArtifactSaveBody) {
  return service.put<ApiResponse<ArtifactEnvelope>>(
    `/api/projects/${projectId}/files/${fileId}/content`,
    body
  )
}
