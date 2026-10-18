import { ref, computed, type Ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'

/**
 * CSV 编辑器逻辑（与文件编辑器解耦）：仅负责解析与预览态。
 * 纯本地解析（demo 级：逗号分隔、无转义）。
 */
export function useCsvEditor(content: Ref<string>, scheduleAutoSave: () => void) {
  const csvMode = ref<'preview' | 'source'>('preview')

  const csvColumns = computed<DataTableColumns<Record<string, string>>>(() => {
    const parsed = parseCsv(content.value)
    return parsed.headers.map((h) => ({ title: h || '-', key: h }))
  })

  const csvRows = computed<Record<string, string>[]>(() => {
    const parsed = parseCsv(content.value)
    return parsed.rows
  })

  function handleContentInput() {
    scheduleAutoSave()
  }

  function parseCsv(text: string) {
    const lines = text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((l) => l.trim().length > 0)
    const headerLine = lines[0] ?? ''
    const headers = headerLine.split(',').map((s) => s.trim())
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((s) => s.trim())
      const row: Record<string, string> = {}
      for (let i = 0; i < headers.length; i += 1) {
        const key = headers[i] || `列${i + 1}`
        row[key] = values[i] ?? ''
      }
      return row
    })
    return { headers, rows }
  }

  return {
    csvMode,
    csvColumns,
    csvRows,
    parseCsv,
    handleContentInput
  }
}
