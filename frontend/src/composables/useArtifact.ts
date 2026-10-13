/**
 * 统一资产读写 composable
 * @description 封装嵌入编辑器的"加载 JSON / 自动保存 / 乐观锁版本管理"，
 * 供 EmbeddedEditor 壳组件复用，业务逻辑不写在组件内
 */
import { ref, onBeforeUnmount } from 'vue'
import { getArtifactContent, saveArtifactContent } from '@/api/artifact'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'conflict'

export interface UseArtifactOptions {
  /** 防抖自动保存间隔（毫秒），默认 3000 */
  debounceMs?: number
}

/**
 * 资产读写逻辑
 * @param projectId - 项目 ID
 * @param fileId - 文件 ID
 * @param type - 资产类型
 * @param options - 可选配置
 */
export function useArtifact(
  projectId: string,
  fileId: string,
  type: string,
  options: UseArtifactOptions = {}
) {
  const { debounceMs = 3000 } = options

  const payload = ref<Record<string, unknown> | null>(null)
  const schemaVersion = ref(1)
  const version = ref('')
  const saveStatus = ref<SaveStatus>('saved')
  const loading = ref(false)
  const error = ref('')

  let timer: number | null = null

  /**
   * 加载资产内容
   */
  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const res = await getArtifactContent(projectId, fileId)
      const env = res.data.data
      payload.value = env.payload
      schemaVersion.value = env.schema_version || 1
      version.value = env.version
      saveStatus.value = 'saved'
    } catch (e) {
      error.value = (e as Error).message || '加载失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 执行一次保存（乐观锁携带 base_version）
   */
  async function flush(): Promise<void> {
    if (saveStatus.value !== 'unsaved' && saveStatus.value !== 'conflict') return
    saveStatus.value = 'saving'
    try {
      const res = await saveArtifactContent(projectId, fileId, {
        type,
        schema_version: schemaVersion.value,
        payload: payload.value,
        base_version: version.value || null,
      })
      version.value = res.data.data.version
      saveStatus.value = 'saved'
    } catch (e) {
      // 409 版本冲突：提示用户重新加载，不覆盖他人改动
      saveStatus.value = 'conflict'
      error.value = '内容已被他人修改，请重新加载最新版本'
    }
  }

  /**
   * 标记内容变更并调度防抖保存
   * @param next - 编辑器吐出的新负载
   */
  function markDirty(next: Record<string, unknown>): void {
    payload.value = next
    saveStatus.value = 'unsaved'
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => void flush(), debounceMs)
  }

  /**
   * 立即保存（离开页面前调用）
   */
  async function saveNow(): Promise<void> {
    if (timer) window.clearTimeout(timer)
    await flush()
  }

  onBeforeUnmount(() => {
    if (timer) window.clearTimeout(timer)
  })

  return {
    payload,
    schemaVersion,
    version,
    saveStatus,
    loading,
    error,
    load,
    markDirty,
    saveNow,
    flush,
  }
}
