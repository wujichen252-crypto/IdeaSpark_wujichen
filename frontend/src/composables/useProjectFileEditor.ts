import { computed, ref, watch, onMounted, inject, type InjectionKey, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAiWorkshopStore, type ProjectFile } from '@/store/modules/aiWorkshop'
import { updateProjectFile, getProjectFileDetail } from '@/api/projectFile'
import { getProjectDetail } from '@/api/project'
import DocEditor from '@/components/editor/DocEditor.vue'
import MarkdownEditor from '@/components/markdown/MarkdownEditor.vue'
import { useCsvEditor } from './useCsvEditor'
import { useSlidesEditor } from './useSlidesEditor'

type EditorKind = 'markdown' | 'csv' | 'slides' | 'doc' | 'text'
type MdViewMode = 'typora' | 'split' | 'source'

const ARTIFACT_TYPES = ['whiteboard', 'mindmap', 'flow']

/**
 * 文件编辑器核心逻辑（与展示组件解耦）。
 * 注意：原文件内嵌的 Markdown/Typora 行内编辑子系统已被确认为不可达的
 * 死代码（模板将 markdown 委托给 <MarkdownEditor> 组件，typora ref 从未绑定），
 * 已整体隔离到 composables/legacy/markdownTyporaEditor.ts，本模块不再包含。
 */
export function createProjectFileEditor() {
  const route = useRoute()
  const router = useRouter()
  const store = useAiWorkshopStore()
  const message = useMessage()

  const projectId = route.params.id as string
  const fileId = route.params.fileId as string

  const file = computed<ProjectFile | undefined>(() => store.getProjectFileById(projectId, fileId))
  const editorKind = computed<EditorKind>(() => resolveEditorKind(file.value))

  const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
  const content = ref('')
  let saveTimer: number | null = null

  const showAi = ref(true)

  // 对于 sheet 类型自动跳转 Excel 编辑器；嵌入资产跳转统一嵌入式编辑器
  watch(
    () => file.value?.type,
    (type) => {
      if (type === 'sheet') {
        router.replace(`/project/excel/${projectId}/${fileId}`)
      } else if (type && ARTIFACT_TYPES.includes(type)) {
        router.replace(
          `/project/artifact/${projectId}/${fileId}/${type}?name=${encodeURIComponent(file.value?.name || '')}`
        )
      }
    },
    { immediate: true }
  )

  const csv = useCsvEditor(content, scheduleAutoSave)
  const slides = useSlidesEditor(content, scheduleAutoSave)

  watch(
    () => file.value,
    (next, prev) => {
      if (!next) return
      if (!hasLoadedFileDetail) return
      const hasContent = next.content !== undefined && next.content !== null
      const nextContent: string = hasContent ? (next.content as string) : createDefaultContent(next)
      const isSameFile = Boolean(prev && prev.id === next.id)
      if (isSameFile && saveStatus.value === 'unsaved') return
      if (isSameFile && nextContent === content.value) return
      content.value = nextContent
      if (!hasContent) {
        store.updateProjectFile(projectId, next.id, { content: nextContent })
      }
      saveStatus.value = 'saved'
    },
    { immediate: false }
  )

  let hasLoadedFileDetail = false

  onMounted(async () => {
    if (!store.getProjectById(projectId)) {
      try {
        const res = await getProjectDetail(projectId)
        const data = res.data as any
        const isSuccess = data.code === 200 || data.status === 200
        if (isSuccess && data.data) {
          const apiProject = data.data
          store.addProject({
            id: apiProject.id,
            name: apiProject.name || '未命名项目',
            description: apiProject.description || '',
            category: apiProject.category || '未分类',
            type: 'app',
            currentModule: 'home',
            updatedAt: Date.now(),
            status: apiProject.status || 'active',
            visibility: apiProject.visibility || 'private',
            cover: apiProject.coverUrl,
            tags: apiProject.tags || [],
            techStack: apiProject.label ? [apiProject.label] : [],
            plugins: apiProject.plugins || [],
            files: apiProject.files || [],
            content: apiProject.content || '',
            team: []
          })
        }
      } catch (e) {
        console.error('加载项目详情失败:', e)
      }
    }

    try {
      const fileRes = await getProjectFileDetail(projectId, fileId)
      const fileData = fileRes.data as any
      if ((fileData.code === 200 || fileData.status === 200) && fileData.data) {
        const apiFile = fileData.data
        hasLoadedFileDetail = true
        store.updateProjectFile(projectId, fileId, {
          content: apiFile.content,
          size: apiFile.size,
          updatedAt: apiFile.updatedAt
        })
        if (apiFile.content !== undefined && apiFile.content !== null) {
          content.value = apiFile.content
        }
      }
    } catch (e) {
      console.error('加载文件详情失败:', e)
    }
  })

  function handleBack() {
    if (canGoBack()) {
      router.back()
      return
    }
    router.replace(`/project/workspace/${projectId}`)
  }

  function canGoBack() {
    const state = router.options.history.state
    return typeof state.back === 'string' && state.back.length > 0
  }

  function resolveEditorKind(f: ProjectFile | undefined): EditorKind {
    if (!f) return 'text'
    if (f.type === 'sheet') return 'csv'
    if (f.type === 'slide') return 'slides'
    const ext = getFileExt(f).toLowerCase()
    if (ext === 'md') return 'markdown'
    if (ext === 'csv') return 'csv'
    if (ext === 'ppt' || ext === 'pptx') return 'slides'
    if (ext === 'doc' || ext === 'docx') return 'doc'
    return 'text'
  }

  function getFileExt(f: ProjectFile) {
    if (f.ext) return f.ext
    const dot = f.name.lastIndexOf('.')
    if (dot <= 0) return ''
    return f.name.slice(dot + 1)
  }

  function createDefaultContent(f: ProjectFile): string {
    const ext = getFileExt(f).toLowerCase()
    if (ext === 'md') return `# ${f.name.replace(/\.md$/i, '')}\n\n（开始编辑...）\n`
    if (ext === 'csv') return '列1,列2,列3\n数据1,数据2,数据3\n'
    if (ext === 'ppt' || ext === 'pptx') {
      return [
        '# 标题页',
        '',
        '（填写项目名称 / 一句话价值主张）',
        '',
        '---',
        '问题',
        '',
        '- 目标用户：',
        '- 核心痛点：',
        '',
        '---',
        '解决方案',
        '',
        '- 核心功能：',
        '- 关键体验：',
        '',
        '---',
        '商业模式',
        '',
        '- 付费方式：',
        '- 增长路径：'
      ].join('\n') + '\n'
    }
    if (ext === 'doc' || ext === 'docx') {
      return '<p><br></p>'
    }
    return ''
  }

  function scheduleAutoSave() {
    saveStatus.value = 'unsaved'
    if (saveTimer != null) window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(async () => {
      saveTimer = null
      await persistFileContent({ silent: true })
    }, 800)
  }

  async function handleSave() {
    await persistFileContent({ silent: false })
  }

  async function persistFileContent(options?: { silent?: boolean }) {
    if (!file.value) {
      console.warn('[persistFileContent] file.value is undefined, skipping save')
      return
    }
    const silent = options?.silent !== false
    const currentContent = content.value
    const currentSize = new Blob([currentContent]).size
    saveStatus.value = 'saving'
    console.log('[persistFileContent] saving file', file.value.id, 'content length:', currentContent.length, 'size:', currentSize)
    try {
      const res = await updateProjectFile(projectId, file.value.id, {
        content: currentContent,
        size: currentSize
      })
      console.log('[persistFileContent] API response:', res.data)
      store.updateProjectFile(projectId, file.value.id, { content: currentContent, size: currentSize })
      if (!silent) message.success('已保存到服务器')
    } catch (error: any) {
      console.error('保存文件失败:', error)
      store.updateProjectFile(projectId, file.value.id, { content: currentContent, size: currentSize })
      if (!silent) message.warning('服务器保存失败，已本地保存')
    }
    saveStatus.value = 'saved'
  }

  function handleExport() {
    if (!file.value) return
    const ext = file.value.ext || 'txt'
    const mimeType = ext === 'csv' ? 'text/csv' : ext === 'md' ? 'text/markdown' : 'text/plain'
    const blob = new Blob([content.value], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.value.name || `导出文件.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('文件已导出')
  }

  /**
   * AI 输出插入（由 <MarkdownEditor> 的 @save-file 触发）。
   * 注意：原实现在 markdown 分支会进入 typora 行内插入链路，但该链路依赖未绑定的
   * typora ref，运行时为 no-op；此处归一为直接追加到 content（与 text/csv 一致），
   * 使 markdown 的 AI 插入行为真正生效。
   */
  function handleAiInsert(payload: { code: string; lang: string }) {
    const text = (payload.code || '').trim()
    if (!text) return
    if (editorKind.value === 'slides') {
      slides.activeSlideContent.value = (slides.activeSlideContent.value || '') + '\n\n' + text
      return
    }
    content.value = (content.value || '') + '\n\n' + text
  }

  function handleDocContentChange() {
    scheduleAutoSave()
  }

  async function handleDocSave(payload: { content: string; title: string }) {
    if (!file.value) return
    saveStatus.value = 'saving'
    console.log('[handleDocSave] saving doc file', file.value.id, 'content length:', payload.content.length)
    try {
      const currentSize = new Blob([payload.content]).size
      const res = await updateProjectFile(projectId, file.value.id, {
        content: payload.content,
        size: currentSize
      })
      console.log('[handleDocSave] API response:', res.data)
      store.updateProjectFile(projectId, file.value.id, { content: payload.content, size: currentSize })
      message.success('已保存到服务器')
    } catch (error: any) {
      console.error('保存文件失败:', error)
      const currentSize = new Blob([payload.content]).size
      store.updateProjectFile(projectId, file.value.id, { content: payload.content, size: currentSize })
      message.warning('服务器保存失败，已本地保存')
    }
    saveStatus.value = 'saved'
  }

  async function handleTitleChange(newTitle: string) {
    if (!file.value) return
    const oldName = file.value.name
    const ext = getFileExt(file.value)
    const newName = newTitle.endsWith(`.${ext}`) ? newTitle : `${newTitle}.${ext}`

    if (newName !== oldName) {
      try {
        await updateProjectFile(projectId, file.value.id, { name: newName })
        store.updateProjectFile(projectId, file.value.id, { name: newName })
        message.success('文件名已更新')
      } catch (error) {
        message.error('文件名更新失败')
      }
    }
  }

  const mdSessionId = computed(() => `md:${projectId}:${fileId}`)

  const mdSystemContext = computed(() => {
    const projectName = store.getProjectById(projectId)?.name || '未命名项目'
    const filename = file.value?.name || '未命名文件'
    const excerpt = (content.value || '').slice(0, 2000)
    return [
      '你是一个 Markdown 文档助手（类似 Typora + AI 的协作模式）。',
      `项目：${projectName}`,
      `文件：${filename}`,
      '要求：请输出可直接粘贴到 Markdown 的内容；尽量保持结构清晰；避免输出与"写代码/生成代码"相关的内容。',
      '当前文档片段（可能不完整）：',
      excerpt
    ].join('\n')
  })

  return {
    // 状态
    file,
    editorKind,
    saveStatus,
    content,
    showAi,
    mdSessionId,
    mdSystemContext,
    // csv / slides 子逻辑
    csvMode: csv.csvMode,
    csvColumns: csv.csvColumns,
    csvRows: csv.csvRows,
    csvParse: csv.parseCsv,
    handleCsvInput: csv.handleContentInput,
    slideBlocks: slides.slideBlocks,
    activeSlideIndex: slides.activeSlideIndex,
    activeSlideContent: slides.activeSlideContent,
    addSlide: slides.addSlide,
    removeSlide: slides.removeSlide,
    handleSlideInput: slides.handleSlideInput,
    slideSummary: slides.slideSummary,
    // 方法
    handleBack,
    canGoBack,
    handleSave,
    handleExport,
    scheduleAutoSave,
    handleAiInsert,
    handleDocContentChange,
    handleDocSave,
    handleTitleChange,
    // 类型透传（供子组件 import 使用）
    DocEditor,
    MarkdownEditor
  }
}

export type ProjectFileEditorContext = ReturnType<typeof createProjectFileEditor>

export const PROJECT_FILE_EDITOR_KEY: InjectionKey<ProjectFileEditorContext> =
  Symbol('projectFileEditor')

export function useProjectFileEditorContext(): ProjectFileEditorContext {
  const ctx = inject(PROJECT_FILE_EDITOR_KEY)
  if (!ctx) {
    throw new Error('useProjectFileEditorContext must be used within ProjectFileEditorView')
  }
  return ctx
}
