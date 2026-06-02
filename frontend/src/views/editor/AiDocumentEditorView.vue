<template>
  <div class="ai-document-editor">
    <!-- Word 风格 Ribbon 工具栏 -->
    <WordRibbonToolbar
      :title="projectTitle"
      :save-status="saveStatus"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :show-ai-panel="showChat"
      :view-mode="viewMode"
      @back="handleBack"
      @save="handleManualSave"
      @undo="handleUndo"
      @redo="handleRedo"
      @title-change="handleTitleChange"
      @toggle-ai="toggleChat"
      @ai-action="handleAiAction"
      @view-mode-change="handleViewModeChange"
      @export="handleExport"
      @print="handlePrint"
      @share="handleShare"
      @format="handleFormat"
      @insert="handleInsert"
    />

    <!-- 主体区域 -->
    <div class="editor-body">
      <MarkdownEditor
        ref="markdownEditorRef"
        v-model="content"
        :show-ai="showChat"
        :view-mode="viewMode"
        :session-id="projectId"
        :system-context="systemContext"
        @change="handleContentChange"
        @save-file="handleAiCode"
        @undo-state-change="handleUndoStateChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAiWorkshopStore } from '@/store/modules/aiWorkshop'
import { updateProject, getProjectDetail } from '@/api/project'
import { useMessage } from 'naive-ui'
import WordRibbonToolbar from '@/components/editor/WordRibbonToolbar.vue'
import MarkdownEditor from '@/components/markdown/MarkdownEditor.vue'

const route = useRoute()
const router = useRouter()
const store = useAiWorkshopStore()
const message = useMessage()

// 编辑器引用
const markdownEditorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null)

// 项目相关状态
const projectId = route.params.id as string
const projectTitle = ref('')
const content = ref('')
const showChat = ref(true)
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
const viewMode = ref<'typora' | 'split' | 'source'>('typora')

// 撤销/重做状态
const canUndo = ref(false)
const canRedo = ref(false)

// 自动保存定时器
let saveTimer: ReturnType<typeof setTimeout> | null = null

/**
 * AI 系统上下文
 * 用于向 AI 提供当前文档的上下文信息
 */
const systemContext = computed(() => {
  return [
    '你是一个 Markdown 文档助手（类似 Typora + AI 的协作模式）。',
    `当前正在编辑的文档标题为《${projectTitle.value || '未命名文档'}》。`,
    '要求：请输出可直接粘贴到 Markdown 的内容；尽量保持结构清晰；避免输出与"写代码/生成代码"相关的内容。',
    '当前文档片段（可能不完整）：',
    (content.value || '').slice(0, 2000)
  ].join('\n')
})

/**
 * 组件挂载时初始化
 * 加载项目详情
 */
onMounted(async () => {
  await loadProject()
})

onUnmounted(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
})

/**
 * 加载项目详情
 * 优先从本地 store 获取，如果没有则从后端加载
 */
async function loadProject() {
  let project = store.getProjectById(projectId)

  if (!project) {
    try {
      const res = await getProjectDetail(projectId)
      const data = res.data as any
      const isSuccess = data.code === 200 || data.status === 200

      if (isSuccess && data.data) {
        const apiProject = data.data
        store.addProject({
          id: apiProject.id || apiProject.projectId,
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
        project = store.getProjectById(projectId)
      }
    } catch (error) {
      console.error('加载项目详情失败:', error)
    }
  }

  if (project) {
    projectTitle.value = project.name
    content.value = project.content || ''
  } else {
    message.error('未找到项目')
    router.push('/workbench')
  }
}

/**
 * 处理返回操作
 * 返回工作台页面
 */
function handleBack() {
  router.push('/workbench')
}

/**
 * 处理手动保存
 */
function handleManualSave() {
  saveProject()
}

/**
 * 处理撤销操作
 */
function handleUndo() {
  markdownEditorRef.value?.handleMdUndo?.()
}

/**
 * 处理重做操作
 */
function handleRedo() {
  markdownEditorRef.value?.handleMdRedo?.()
}

/**
 * 处理标题变化
 * @param value 新标题
 */
function handleTitleChange(value: string) {
  projectTitle.value = value
  saveProject()
}

/**
 * 切换 AI 聊天面板
 */
function toggleChat() {
  showChat.value = !showChat.value
}

/**
 * 处理 AI 操作
 * @param action AI 操作类型
 */
function handleAiAction(action: string) {
  if (!showChat.value) {
    showChat.value = true
  }

  // 将 AI 操作转发给编辑器
  setTimeout(() => {
    switch (action) {
      case 'rewrite':
        markdownEditorRef.value?.sendAiRewrite?.()
        break
      case 'polish':
        markdownEditorRef.value?.sendAiPolish?.()
        break
      case 'expand':
        markdownEditorRef.value?.sendAiExpand?.()
        break
      case 'outline':
        markdownEditorRef.value?.sendAiOutline?.()
        break
      case 'summary':
        markdownEditorRef.value?.sendAiSummary?.()
        break
    }
  }, 100)
}

/**
 * 处理视图模式变化
 * @param mode 视图模式
 */
function handleViewModeChange(mode: 'typora' | 'split' | 'source') {
  viewMode.value = mode
}

/**
 * 处理导出操作
 * 导出 Markdown 文件
 */
function handleExport() {
  const blob = new Blob([content.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectTitle.value || '未命名文档'}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('文档已导出')
}

/**
 * 处理打印操作
 */
function handlePrint() {
  window.print()
}

/**
 * 处理分享操作
 */
function handleShare() {
  message.info('分享功能开发中...')
}

/**
 * 处理格式操作
 * @param type 格式类型
 * @param value 格式值
 */
function handleFormat(type: string, value?: any) {
  switch (type) {
    case 'bold':
      markdownEditorRef.value?.applyMdBold?.()
      break
    case 'italic':
      markdownEditorRef.value?.applyMdItalic?.()
      break
    case 'strikethrough':
      markdownEditorRef.value?.applyMdStrike?.()
      break
    case 'heading':
      markdownEditorRef.value?.applyMdHeading?.(value)
      break
    case 'bullet-list':
      markdownEditorRef.value?.applyMdUnorderedList?.()
      break
    case 'numbered-list':
      markdownEditorRef.value?.applyMdOrderedList?.()
      break
    case 'task-list':
      markdownEditorRef.value?.applyMdTaskList?.()
      break
    case 'quote':
      markdownEditorRef.value?.applyMdQuote?.()
      break
    case 'code':
      markdownEditorRef.value?.applyMdInlineCode?.()
      break
    case 'code-block':
      markdownEditorRef.value?.applyMdCodeBlock?.()
      break
    case 'link':
      markdownEditorRef.value?.applyMdLink?.()
      break
    case 'table':
      markdownEditorRef.value?.applyMdTable?.()
      break
    case 'image':
      markdownEditorRef.value?.pickMarkdownImage?.()
      break
  }
}

/**
 * 处理插入操作
 * @param type 插入类型
 * @param value 插入值
 */
function handleInsert(type: string, value?: any) {
  switch (type) {
    case 'table':
      markdownEditorRef.value?.applyMdTable?.()
      break
    case 'image':
      markdownEditorRef.value?.pickMarkdownImage?.()
      break
    case 'link':
      markdownEditorRef.value?.applyMdLink?.()
      break
    case 'special-char':
      // 插入特殊字符
      if (value) {
        const currentContent = content.value
        const selection = markdownEditorRef.value?.markdownSelection
        if (selection) {
          const before = currentContent.slice(0, selection.start)
          const after = currentContent.slice(selection.end)
          content.value = before + value + after
          handleContentChange()
        }
      }
      break
  }
}

/**
 * 处理内容变化
 * 触发自动保存
 */
function handleContentChange() {
  saveStatus.value = 'unsaved'
  if (saveTimer) clearTimeout(saveTimer)

  saveTimer = setTimeout(async () => {
    await saveProject()
  }, 1000)
}

/**
 * 处理撤销状态变化
 * @param undo 是否可以撤销
 * @param redo 是否可以重做
 */
function handleUndoStateChange(undo: boolean, redo: boolean) {
  canUndo.value = undo
  canRedo.value = redo
}

/**
 * 保存项目
 * 将当前内容保存到后端和本地 store
 */
async function saveProject() {
  saveStatus.value = 'saving'
  try {
    await updateProject(projectId, {
      name: projectTitle.value,
      content: content.value
    })
    store.updateProject(projectId, {
      name: projectTitle.value,
      content: content.value
    })
  } catch (error: any) {
    console.error('保存项目失败:', error)
    // 即使后端保存失败，也更新本地状态
    store.updateProject(projectId, {
      name: projectTitle.value,
      content: content.value
    })
    message.warning('服务器保存失败，已本地保存')
  }
  saveStatus.value = 'saved'
}

/**
 * 处理 AI 生成的代码/内容
 * @param payload 包含代码和语言类型
 */
function handleAiCode(payload: { code: string; lang: string }) {
  // MarkdownEditor 组件已经处理了内容的插入
  handleContentChange()
  message.success('已应用 AI 生成的内容')
}
</script>

<style scoped lang="scss">
.ai-document-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #f5f5f5;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 16px;
  gap: 16px;
}
</style>
