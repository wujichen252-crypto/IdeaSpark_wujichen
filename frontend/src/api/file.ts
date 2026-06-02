/**
 * 文件上传接口
 * @description 封装文件上传模块的 HTTP 请求方法
 */
import service from './request'
import type { ApiResponse } from './types'
import type { UploadResult } from './types'

/**
 * 上传文件到阿里云 OSS
 * @param file - 要上传的文件
 */
export function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return service.post<ApiResponse<UploadResult>>('/api/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
