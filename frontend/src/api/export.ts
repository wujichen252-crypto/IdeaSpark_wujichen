/**
 * 文件导出接口
 * @description 提供 Word、Excel、PPT 等格式的导出功能
 */
import service from './request'

/**
 * 导出 Word 文档
 * @param htmlContent - HTML 内容
 * @param fileName - 文件名
 */
export function exportDocx(htmlContent: string, fileName: string) {
  return service.post(
    '/api/export/docx',
    { content: htmlContent, fileName },
    { responseType: 'blob' }
  )
}

/**
 * 导出 Excel 表格
 * @param data - 表格数据
 * @param fileName - 文件名
 * @param sheetName - 工作表名称
 */
export function exportXlsx(data: any[][], fileName: string, sheetName?: string) {
  return service.post(
    '/api/export/xlsx',
    { data, fileName, sheetName: sheetName || 'Sheet1' },
    { responseType: 'blob' }
  )
}

/**
 * 导出 PPT 演示文稿
 * @param slides - 幻灯片数据
 * @param fileName - 文件名
 */
export function exportPptx(slides: any[], fileName: string) {
  return service.post(
    '/api/export/pptx',
    { slides, fileName },
    { responseType: 'blob' }
  )
}

/**
 * 触发文件下载
 * @param blob - Blob 数据
 * @param fileName - 下载文件名
 */
export function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
