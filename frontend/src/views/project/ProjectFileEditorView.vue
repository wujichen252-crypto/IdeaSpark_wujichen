<template>
  <div class="project-file-editor">
    <!-- Nexus 风格头部 -->
    <header class="nexus-editor-header">
      <div class="header-left">
        <n-button
circle
quaternary
class="nexus-header-btn"
@click="handleBack">
          <template #icon>
            <n-icon :component="ArrowBackOutline" />
          </template>
        </n-button>
        <div class="nexus-divider-v" ></div>
        <div class="file-title">{{ file?.name || '未找到文件' }}</div>
        <div
          class="save-status"
          :class="saveStatus">
          <span class="save-dot" ></span>
          <span class="save-label">
            {{ saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中...' : '未保存' }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <n-button
          circle
          quaternary
          class="nexus-header-btn"
          :class="{ 'nexus-header-btn-active': showAi }"
          @click="showAi = !showAi">
          <template #icon>
            <n-icon :component="showAi ? Sparkles : SparklesOutline" />
          </template>
        </n-button>

        <n-button
          circle
          quaternary
          class="nexus-header-btn"
          @click="handleExport">
          <template #icon><n-icon :component="DownloadOutline" /></template>
        </n-button>

        <n-button
          class="nexus-save-btn"
          :disabled="!file"
          :loading="saveStatus === 'saving'"
          @click="handleSave">
          保存
        </n-button>
      </div>
    </header>

    <div class="editor-body">
      <n-empty v-if="!file" description="未找到该文件" />

      <div v-else class="editor-container" :class="{ 'ai-open': showAi }">
        <!-- Markdown 编辑器 -->
        <div v-if="editorKind === 'markdown'" class="editor-markdown">
          <MarkdownEditor
            v-model="content"
            :show-ai="showAi"
            :session-id="mdSessionId"
            :system-context="mdSystemContext"
            :file-name="file?.name || '未命名文档'"
            view-mode="typora"
            @update:show-ai="v => showAi = v"
            @change="scheduleAutoSave"
            @save-file="handleAiInsert"
          />
        </div>

        <!-- CSV 编辑器 -->
        <div v-else-if="editorKind === 'csv'" class="editor-csv">
          <div class="csv-toolbar">
            <n-radio-group v-model:value="csvMode" size="small">
              <n-radio-button value="preview">表格预览</n-radio-button>
              <n-radio-button value="source">源码编辑</n-radio-button>
            </n-radio-group>
          </div>

          <div v-if="csvMode === 'preview'" class="nexus-glass-panel csv-preview-panel">
            <n-data-table
              :columns="csvColumns"
              :data="csvRows"
              :max-height="560"
              :striped="true" />
          </div>

          <div v-else class="nexus-glass-panel csv-source-panel">
            <n-input
              v-model:value="content"
              type="textarea"
              :autosize="{ minRows: 22 }"
              placeholder="输入 CSV 内容..."
              class="mono-editor nexus-mono-input"
              @input="handleContentInput"
            />
          </div>
        </div>

        <!-- Slides 编辑器 -->
        <div v-else-if="editorKind === 'slides'" class="editor-slides">
          <div class="nexus-glass-panel slides-sider">
            <div class="slides-sider-header">
              <div class="slides-sider-title">页列表</div>
              <n-space size="small">
                <n-button
size="tiny"
secondary
class="nexus-pill-btn"
@click="addSlide">新增</n-button>
                <n-button
                  size="tiny"
                  tertiary
                  class="nexus-pill-btn"
                  :disabled="slideBlocks.length <= 1"
                  @click="removeSlide">
                  删除
                </n-button>
              </n-space>
            </div>
            <div class="slides-list">
              <div
                v-for="(s, idx) in slideBlocks"
                :key="idx"
                class="slide-item"
                :class="{ active: idx === activeSlideIndex }"
                @click="activeSlideIndex = idx"
              >
                <div class="slide-item-title">第 {{ idx + 1 }} 页</div>
                <div class="slide-item-sub">{{ slideSummary(s) }}</div>
              </div>
            </div>
          </div>
          <div class="nexus-glass-panel slides-main">
            <n-input
              v-model:value="activeSlideContent"
              type="textarea"
              :autosize="{ minRows: 22 }"
              placeholder="编辑当前页内容..."
              class="mono-editor nexus-mono-input"
              @input="handleSlideInput"
            />
          </div>
        </div>

        <!-- Word 文档编辑器 -->
        <div v-else-if="editorKind === 'doc'" class="editor-doc">
          <DocEditor
            v-model="content"
            :title="file?.name || '未命名文档'"
            @change="handleDocContentChange"
            @save="handleDocSave"
            @back="handleBack"
            @title-change="handleTitleChange"
          />
        </div>

        <!-- 纯文本编辑器 -->
        <div v-else class="editor-single">
          <div class="nexus-glass-panel text-editor-wrapper">
            <n-input
              v-model:value="content"
              type="textarea"
              :autosize="{ minRows: 22 }"
              placeholder="开始编辑..."
              class="mono-editor nexus-mono-input"
              @input="handleContentInput"
            />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowBackOutline,
  DownloadOutline,
  SparklesOutline,
  Sparkles
} from '@vicons/ionicons5'
import {
  NButton,
  NIcon,
  NInput,
  NEmpty,
  NRadioGroup,
  NRadioButton,
  NDataTable,
  NSpace,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import { useAiWorkshopStore, type ProjectFile } from '@/store/modules/aiWorkshop'
import { updateProjectFile, getProjectFileDetail } from '@/api/projectFile'
import { getProjectDetail } from '@/api/project'
import DocEditor from '@/components/editor/DocEditor.vue'
import MarkdownEditor from '@/components/markdown/MarkdownEditor.vue'

type EditorKind = 'markdown' | 'csv' | 'slides' | 'doc' | 'text'
type MdViewMode = 'typora' | 'split' | 'source'

const route = useRoute()
const router = useRouter()
const store = useAiWorkshopStore()
const message = useMessage()

const projectId = route.params.id as string
const fileId = route.params.fileId as string

const file = computed<ProjectFile | undefined>(() => store.getProjectFileById(projectId, fileId))
const editorKind = computed<EditorKind>(() => resolveEditorKind(file.value))

// 对于 sheet 类型的文件，自动跳转到 Excel 编辑器
watch(
  () => file.value?.type,
  (type) => {
    if (type === 'sheet') {
      router.replace(`/project/excel/${projectId}/${fileId}`)
    }
  },
  { immediate: true }
)

const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
const content = ref('')
let saveTimer: number | null = null

const showAi = ref(true)
const markdownEditorHostRef = ref<HTMLElement | null>(null)
const markdownPreviewRef = ref<HTMLElement | null>(null)
const markdownSelection = ref<{ start: number; end: number }>({ start: 0, end: 0 })
const markdownImageInputRef = ref<HTMLInputElement | null>(null)
const mdTyporaEditorRef = ref<HTMLDivElement | null>(null)
const mdViewMode = ref<MdViewMode>('typora')

let isSyncingTyporaEditor = false
let lastTyporaMarkdown = ''

let mdHistory: string[] = []
let mdHistoryIndex = -1
let mdHistoryTimer: number | null = null
let isApplyingMdHistory = false

// 标记是否已经加载过文件详情（必须在 watch 之前定义以避免TDZ问题）
let hasLoadedFileDetail = false

// 选区处理器引用，必须在 watch 之前初始化以避免暂时性死区(TDZ)问题
let selectionHandlers:
  | {
      el: HTMLTextAreaElement
      onKeyDown: (evt: KeyboardEvent) => void
      onKeyUp: () => void
      onMouseUp: () => void
      onFocus: () => void
      onPaste: (evt: ClipboardEvent) => void
      onDrop: (evt: DragEvent) => void
      onDragOver: (evt: DragEvent) => void
    }
  | null = null

const canMdUndo = computed(() => mdHistoryIndex > 0)
const canMdRedo = computed(() => mdHistoryIndex >= 0 && mdHistoryIndex < mdHistory.length - 1)

const headingOptions = [
  { label: '一级标题', key: 'h1' },
  { label: '二级标题', key: 'h2' },
  { label: '三级标题', key: 'h3' },
  { label: '四级标题', key: 'h4' },
  { label: '五级标题', key: 'h5' },
  { label: '六级标题', key: 'h6' }
]

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



const markdownPreviewHtml = computed(() => {
  if (editorKind.value !== 'markdown') return ''
  if (mdViewMode.value !== 'split') return ''
  return renderMarkdownPreview(content.value)
})

watch(
  () => markdownPreviewHtml.value,
  (html) => {
    if (!markdownPreviewRef.value) return
    markdownPreviewRef.value.innerHTML = html || ''
  },
  { immediate: true }
)

const viewModeOptions = [
  { label: '所见即所得', key: 'typora' },
  { label: '分栏预览', key: 'split' },
  { label: '源码编辑', key: 'source' }
]

const csvMode = ref<'preview' | 'source'>('preview')
const csvColumns = computed<DataTableColumns<Record<string, string>>>(() => buildCsvColumns(content.value))
const csvRows = computed<Record<string, string>[]>(() => buildCsvRows(content.value))

const activeSlideIndex = ref(0)
const slideBlocks = computed(() => parseSlideBlocks(content.value))
const activeSlideContent = computed({
  get() {
    return slideBlocks.value[activeSlideIndex.value] ?? ''
  },
  set(val: string) {
    content.value = updateSlideBlock(content.value, activeSlideIndex.value, val)
  }
})

watch(
  () => slideBlocks.value.length,
  (len) => {
    if (len <= 0) {
      activeSlideIndex.value = 0
      return
    }
    if (activeSlideIndex.value > len - 1) activeSlideIndex.value = Math.max(0, len - 1)
  },
  { immediate: true }
)

watch(
  () => file.value,
  (next, prev) => {
    if (!next) return
    // 如果尚未从API加载文件详情，跳过（避免覆盖 onMounted 中加载的内容）
    if (!hasLoadedFileDetail) return
    // 严格判断 content 是否为 null/undefined，空字符串是有效值
    const hasContent = next.content !== undefined && next.content !== null
    const nextContent: string = hasContent ? (next.content as string) : createDefaultContent(next)
    const isSameFile = Boolean(prev && prev.id === next.id)
    // 如果是同一文件，且用户有未保存的编辑（unsaved），不要覆盖
    if (isSameFile && saveStatus.value === 'unsaved') return
    if (isSameFile && nextContent === content.value) return
    content.value = nextContent
    if (!hasContent) {
      // 没有 content 时，将默认内容保存到 store（但不覆盖后端）
      store.updateProjectFile(projectId, next.id, { content: nextContent })
    }
    if (resolveEditorKind(next) === 'markdown') {
      resetMdHistory(nextContent)
    }
    saveStatus.value = 'saved'
  },
  { immediate: false }
)

watch(
  () => editorKind.value,
  async (kind) => {
    detachMarkdownSelectionListeners()
    if (kind !== 'markdown') return
    await nextTick()
    attachMarkdownSelectionListeners()
    resetMdHistory(content.value)
    if (mdViewMode.value === 'typora') {
      syncTyporaEditorFromMarkdown(content.value, false)
    }
  },
  { immediate: true }
)

watch(
  () => mdViewMode.value,
  async () => {
    if (editorKind.value !== 'markdown') return
    detachMarkdownSelectionListeners()
    await nextTick()
    attachMarkdownSelectionListeners()
    if (mdViewMode.value === 'typora') {
      syncTyporaEditorFromMarkdown(content.value, false)
    }
    focusMarkdown()
  }
)

watch(
  () => content.value,
  async (next) => {
    if (editorKind.value !== 'markdown') return
    if (mdViewMode.value !== 'typora') return
    if (isSyncingTyporaEditor) return
    if (next === lastTyporaMarkdown) return
    await nextTick()
    syncTyporaEditorFromMarkdown(next, true)
  }
)

onBeforeUnmount(() => {
  detachMarkdownSelectionListeners()
})

// 直接访问文件编辑器时，确保项目数据已加载
onMounted(async () => {
  // 先加载项目详情
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

  // 获取文件详情以确保内容是最新的
  try {
    const fileRes = await getProjectFileDetail(projectId, fileId)
    const fileData = fileRes.data as any
    if ((fileData.code === 200 || fileData.status === 200) && fileData.data) {
      const apiFile = fileData.data
      hasLoadedFileDetail = true
      // 更新store中的文件内容
      store.updateProjectFile(projectId, fileId, {
        content: apiFile.content,
        size: apiFile.size,
        updatedAt: apiFile.updatedAt
      })
      // 直接设置内容到编辑器
      if (apiFile.content !== undefined && apiFile.content !== null) {
        content.value = apiFile.content
        if (resolveEditorKind(apiFile) === 'markdown') {
          resetMdHistory(apiFile.content)
        }
      }
    }
  } catch (e) {
    console.error('加载文件详情失败:', e)
  }
})

/**
 * 返回项目工作台
 */
function handleBack() {
  if (canGoBack()) {
    router.back()
    return
  }
  router.replace(`/project/workspace/${projectId}`)
}

/**
 * 判断是否可以安全返回上一页
 */
function canGoBack() {
  const state = router.options.history.state
  return typeof state.back === 'string' && state.back.length > 0
}

/**
 * 根据文件信息推断编辑器类型
 * @param f - 文件记录
 */
function resolveEditorKind(f: ProjectFile | undefined): EditorKind {
  if (!f) return 'text'
  // 优先根据 type 字段判断（仅处理特殊类型）
  if (f.type === 'sheet') return 'csv' // sheet 类型使用 CSV 编辑器或跳转到 Excel 编辑器
  if (f.type === 'slide') return 'slides'
  // 注意：document 类型的文件需要根据扩展名进一步判断，不能统一返回 doc
  
  const ext = getFileExt(f).toLowerCase()
  if (ext === 'md') return 'markdown'
  if (ext === 'csv') return 'csv'
  if (ext === 'ppt' || ext === 'pptx') return 'slides'
  if (ext === 'doc' || ext === 'docx') return 'doc'
  return 'text'
}

/**
 * 获取文件扩展名（优先使用 ext 字段）
 * @param f - 文件记录
 */
function getFileExt(f: ProjectFile) {
  if (f.ext) return f.ext
  const dot = f.name.lastIndexOf('.')
  if (dot <= 0) return ''
  return f.name.slice(dot + 1)
}

/**
 * 为不同类型文件创建默认内容
 * @param f - 文件记录
 * @returns 默认内容字符串
 */
function createDefaultContent(f: ProjectFile): string {
  const ext = getFileExt(f).toLowerCase()
  if (ext === 'md') return `# ${f.name.replace(/\\.md$/i, '')}\n\n（开始编辑...）\n`
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
  // doc/docx 文件返回默认 HTML 内容
  if (ext === 'doc' || ext === 'docx') {
    return '<p><br></p>'
  }
  return ''
}

/**
 * 内容输入时触发自动保存调度
 */
function handleContentInput() {
  scheduleAutoSave()
}

/**
 * Markdown 输入时触发自动保存，并同步选区
 */
function handleMarkdownInput() {
  syncMarkdownSelection()
  scheduleAutoSave()
  scheduleMdHistoryRecord()
}

/**
 * 将 Markdown 同步渲染到 Typora 编辑器（Markdown → HTML）
 * @param md - Markdown 文本
 * @param preserveCaret - 是否尝试保留光标位置
 */
function syncTyporaEditorFromMarkdown(md: string, preserveCaret: boolean) {
  const el = mdTyporaEditorRef.value
  if (!el) return
  isSyncingTyporaEditor = true
  const caret = preserveCaret ? getCaretCharacterOffsetWithin(el) : null
  const nextMd = md || ''
  const html = nextMd.trim().length > 0 ? renderMarkdownForTyporaEditor(nextMd) : ''
  el.innerHTML = html
  lastTyporaMarkdown = nextMd
  nextTick(() => {
    if (caret != null) setCaretCharacterOffsetWithin(el, caret)
    isSyncingTyporaEditor = false
  })
}

/**
 * Typora 模式：执行编辑命令后同步 Markdown（HTML → Markdown）
 */
function syncTyporaAfterCommand() {
  if (mdViewMode.value !== 'typora') return
  nextTick(() => handleTyporaEditorInput())
}

/**
 * 调度一次 Markdown 历史记录（短延迟，避免每次输入都入栈）
 */
function scheduleMdHistoryRecord() {
  if (isApplyingMdHistory) return
  if (mdHistoryTimer != null) window.clearTimeout(mdHistoryTimer)
  mdHistoryTimer = window.setTimeout(() => {
    mdHistoryTimer = null
    recordMdHistory(content.value)
  }, 220)
}

/**
 * 将 Typora 编辑器当前 HTML 转为 Markdown（尽量保留常用格式）
 * @param html - 编辑器 HTML
 */
function convertTyporaHtmlToMarkdown(html: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html || '', 'text/html')
  const md = convertTyporaNodesToMarkdown(doc.body.childNodes).trimEnd()
  const normalized = md.replace(/\n{3,}/g, '\n\n').trimEnd()
  return normalized.length > 0 ? normalized + '\n' : ''
}

/**
 * 将一组 DOM 节点转换为 Markdown（块级）
 * @param nodes - DOM 节点列表
 * @param listIndent - 列表缩进
 */
function convertTyporaNodesToMarkdown(nodes: NodeListOf<ChildNode> | ChildNode[], listIndent = ''): string {
  const arr = Array.isArray(nodes) ? nodes : Array.from(nodes)
  const blocks: string[] = []

  for (const node of arr) {
    const block = convertTyporaBlockToMarkdown(node, listIndent).trimEnd()
    if (block.length === 0) continue
    blocks.push(block)
  }

  return blocks.join('\n\n')
}

/**
 * 将单个块级节点转换为 Markdown
 * @param node - DOM 节点
 * @param listIndent - 列表缩进
 */
function convertTyporaBlockToMarkdown(node: ChildNode, listIndent: string): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent || '').replace(/\s+/g, ' ').trim()
    return text.length > 0 ? text : ''
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''
  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
    const level = Number(tag.replace('h', '')) || 1
    return `${'#'.repeat(level)} ${convertTyporaInlineToMarkdown(el).trim()}`
  }

  if (tag === 'p' || tag === 'div') return convertTyporaInlineToMarkdown(el).trim()

  if (tag === 'blockquote') {
    const inner = convertTyporaNodesToMarkdown(Array.from(el.childNodes), listIndent)
    const lines = inner.split('\n')
    return lines.map(l => (l.trim().length ? `> ${l}` : '>')).join('\n')
  }

  if (tag === 'pre') {
    const code = (el.textContent || '').replace(/\r\n/g, '\n').replace(/\n$/, '')
    return ['```', code, '```'].join('\n')
  }

  if (tag === 'ul' || tag === 'ol') {
    return convertTyporaListToMarkdown(el, listIndent)
  }

  if (tag === 'table') {
    return convertTyporaTableToMarkdown(el as HTMLTableElement)
  }

  if (tag === 'hr') return '---'

  return convertTyporaInlineToMarkdown(el).trim()
}

/**
 * 将列表节点（支持嵌套）转换为 Markdown
 * @param listEl - ul/ol 节点
 * @param listIndent - 列表缩进
 */
function convertTyporaListToMarkdown(listEl: HTMLElement, listIndent: string) {
  const tag = listEl.tagName.toLowerCase()
  const isOl = tag === 'ol'
  const items = Array.from(listEl.children).filter(c => c.tagName.toLowerCase() === 'li') as HTMLLIElement[]
  const lines: string[] = []
  let idx = 1

  for (const li of items) {
    const task = extractTyporaTaskState(li)
    const body = getTyporaListItemBody(li).trim()
    let prefix = `${listIndent}- `
    if (task != null) prefix = `${listIndent}- [${task ? 'x' : ' '}] `
    else if (isOl) prefix = `${listIndent}${idx}. `
    const bodyLines = body.split('\n')
    const first = (prefix + (bodyLines[0] ?? '')).trimEnd()
    lines.push(first)
    const continuationIndent = ' '.repeat(prefix.length)
    for (let i = 1; i < bodyLines.length; i += 1) {
      const l = bodyLines[i] ?? ''
      lines.push((continuationIndent + l).trimEnd())
    }
    if (isOl) idx += 1

    const nestedLists = Array.from(li.children).filter((c) => {
      const t = c.tagName.toLowerCase()
      return t === 'ul' || t === 'ol'
    }) as HTMLElement[]
    for (const nested of nestedLists) {
      const nestedMd = convertTyporaListToMarkdown(nested, listIndent + '  ').trimEnd()
      if (nestedMd.length > 0) lines.push(nestedMd)
    }
  }

  return lines.join('\n')
}

/**
 * 获取列表项的"正文"（排除嵌套列表与任务复选框）
 * @param li - 列表项
 */
function getTyporaListItemBody(li: HTMLLIElement) {
  const clone = li.cloneNode(true) as HTMLLIElement
  const nestedLists = Array.from(clone.querySelectorAll('ul,ol'))
  for (const nl of nestedLists) nl.remove()
  const inputs = Array.from(clone.querySelectorAll('input'))
  for (const input of inputs) {
    const type = (input.getAttribute('type') || '').toLowerCase()
    if (type === 'checkbox') input.remove()
  }
  return convertTyporaInlineToMarkdown(clone, { stripCheckboxInputs: true }).trim()
}

/**
 * 将表格节点转换为 Markdown 表格
 * @param table - table 节点
 */
function convertTyporaTableToMarkdown(table: HTMLTableElement) {
  const theadRow =
    (table.querySelector('thead tr') as HTMLTableRowElement | null) ||
    (table.querySelector('tr') as HTMLTableRowElement | null)
  if (!theadRow) return ''

  const headCells = Array.from(theadRow.children)
    .filter((c) => {
      const t = c.tagName.toLowerCase()
      return t === 'th' || t === 'td'
    })
    .map(c => escapeTableCellMd(convertTyporaInlineToMarkdown(c, { stripCheckboxInputs: true }).trim()))

  const bodyRows = Array.from(table.querySelectorAll('tbody tr'))
  const bodySource = bodyRows.length > 0 ? bodyRows : Array.from(table.querySelectorAll('tr')).slice(1)
  const body = bodySource.map((tr) => {
    const cells = Array.from(tr.children)
      .filter((c) => {
        const t = c.tagName.toLowerCase()
        return t === 'th' || t === 'td'
      })
      .map(c => escapeTableCellMd(convertTyporaInlineToMarkdown(c, { stripCheckboxInputs: true }).trim()))
    return cells
  })

  const colCount = Math.max(1, headCells.length, ...body.map(r => r.length))
  const headerLine = `| ${Array.from({ length: colCount }, (_, i) => headCells[i] ?? '').join(' | ')} |`
  const sepLine = `| ${Array.from({ length: colCount }, () => '---').join(' | ')} |`
  const bodyLines = body.map(r => `| ${Array.from({ length: colCount }, (_, i) => r[i] ?? '').join(' | ')} |`)

  return [headerLine, sepLine, ...bodyLines].join('\n')
}

/**
 * 转义表格单元格中的管道符，避免破坏表格结构
 * @param text - 单元格文本
 */
function escapeTableCellMd(text: string) {
  return (text || '').replace(/\r\n/g, '\n').replace(/\n+/g, '<br>').replace(/\|/g, '\\|')
}

/**
 * 将行内 code 内容安全包裹为 Markdown code span
 * @param codeText - code 文本
 */
function wrapInlineCodeMd(codeText: string) {
  const text = (codeText || '').replace(/\r\n/g, '\n').replace(/\n+/g, ' ')
  const runs = Array.from(text.matchAll(/`+/g)).map(m => m[0].length)
  const fenceLen = Math.max(1, ...runs) + 1
  const fence = '`'.repeat(fenceLen)
  const needPadding = text.startsWith('`') || text.endsWith('`') || text.startsWith(' ') || text.endsWith(' ')
  return needPadding ? `${fence} ${text} ${fence}` : `${fence}${text}${fence}`
}

/**
 * 从列表项中提取任务勾选状态
 * @param li - 列表项
 */
function extractTyporaTaskState(li: HTMLLIElement): boolean | null {
  const inputs = Array.from(li.querySelectorAll('input'))
  const checkbox = inputs.find(i => (i.getAttribute('type') || '').toLowerCase() === 'checkbox') as HTMLInputElement | undefined
  if (!checkbox) return null
  return checkbox.checked
}

/**
 * 将节点的行内内容转换为 Markdown
 * @param node - 节点
 * @param options - 转换选项
 */
function convertTyporaInlineToMarkdown(node: Node, options?: { stripCheckboxInputs?: boolean }): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''
  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  if (options?.stripCheckboxInputs && tag === 'input') {
    const type = (el.getAttribute('type') || '').toLowerCase()
    if (type === 'checkbox') return ''
  }

  if (tag === 'br') return '\n'
  if (tag === 'code' && el.parentElement?.tagName.toLowerCase() !== 'pre') return wrapInlineCodeMd(el.textContent || '')
  if (tag === 'strong' || tag === 'b') return '**' + convertTyporaChildrenInline(el, options) + '**'
  if (tag === 'em' || tag === 'i') return '*' + convertTyporaChildrenInline(el, options) + '*'
  if (tag === 's' || tag === 'del') return '~~' + convertTyporaChildrenInline(el, options) + '~~'
  if (tag === 'a') {
    const href = (el.getAttribute('href') || '').trim()
    const label = convertTyporaChildrenInline(el, options).trim() || href || '链接'
    const safeHref = sanitizeUrl(href)
    return safeHref ? `[${label}](${safeHref})` : label
  }
  if (tag === 'img') {
    const src = (el.getAttribute('src') || '').trim()
    const alt = (el.getAttribute('alt') || '').trim()
    const safeSrc = sanitizeUrl(src)
    return safeSrc ? `![${alt || 'image'}](${safeSrc})` : ''
  }

  return convertTyporaChildrenInline(el, options)
}

/**
 * 将元素子节点转换为 Markdown 行内串
 * @param el - 元素
 * @param options - 转换选项
 */
function convertTyporaChildrenInline(el: HTMLElement, options?: { stripCheckboxInputs?: boolean }) {
  const parts = Array.from(el.childNodes).map(n => convertTyporaInlineToMarkdown(n, options))
  return parts.join('')
}

/**
 * 获取 Typora 编辑器内的光标字符偏移
 * @param el - 编辑器根元素
 */
function getCaretCharacterOffsetWithin(el: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return 0
  const range = selection.getRangeAt(0)
  if (!el.contains(range.startContainer)) return 0
  const preRange = range.cloneRange()
  preRange.selectNodeContents(el)
  preRange.setEnd(range.startContainer, range.startOffset)
  return preRange.toString().length
}

/**
 * 在 Typora 编辑器内按字符偏移设置光标位置
 * @param el - 编辑器根元素
 * @param offset - 字符偏移
 */
function setCaretCharacterOffsetWithin(el: HTMLElement, offset: number) {
  const selection = window.getSelection()
  if (!selection) return
  const safeOffset = Math.max(0, offset)
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
  let currentOffset = 0
  let node: Node | null = walker.nextNode()
  while (node) {
    const text = node.textContent || ''
    const nextOffset = currentOffset + text.length
    if (safeOffset <= nextOffset) {
      const range = document.createRange()
      range.setStart(node, Math.max(0, safeOffset - currentOffset))
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      return
    }
    currentOffset = nextOffset
    node = walker.nextNode()
  }
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

/**
 * 在 Typora 编辑器中插入 HTML（在当前选区处）
 * @param html - HTML 片段
 */
function insertHtmlIntoTypora(html: string) {
  const el = mdTyporaEditorRef.value
  if (!el) return
  el.focus()
  const selection = window.getSelection()
  const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
  const canUseRange = range && el.contains(range.commonAncestorContainer)
  const targetRange = canUseRange ? range : (() => {
    const r = document.createRange()
    r.selectNodeContents(el)
    r.collapse(false)
    return r
  })()
  const frag = targetRange.createContextualFragment(html)
  const last = frag.lastChild
  targetRange.deleteContents()
  targetRange.insertNode(frag)
  if (last) {
    const after = document.createRange()
    after.setStartAfter(last)
    after.collapse(true)
    selection?.removeAllRanges()
    selection?.addRange(after)
  }
}

/**
 * 在 Typora 编辑器中插入图片
 * @param src - 图片地址
 * @param alt - 替代文本
 */
function insertImageIntoTypora(src: string, alt: string) {
  const safeSrc = sanitizeUrl(src)
  if (!safeSrc) return
  const safeAlt = escapeHtml((alt || 'image').replace(/[\r\n"]/g, ' ').trim() || 'image')
  insertHtmlIntoTypora(`<img class="md-image" src="${safeSrc}" alt="${safeAlt}" />`)
}

/**
 * Typora 模式：把当前选区包裹为行内 code
 */
function wrapTyporaSelectionAsInlineCode() {
  const el = mdTyporaEditorRef.value
  if (!el) return
  el.focus()
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  if (!el.contains(range.commonAncestorContainer)) return
  const text = range.toString() || 'code'
  range.deleteContents()
  const codeEl = document.createElement('code')
  codeEl.textContent = text
  range.insertNode(codeEl)
  const after = document.createRange()
  after.setStartAfter(codeEl)
  after.collapse(true)
  selection.removeAllRanges()
  selection.addRange(after)
}

/**
 * Typora 模式：把当前选区包裹为代码块
 */
function wrapTyporaSelectionAsCodeBlock() {
  const el = mdTyporaEditorRef.value
  if (!el) return
  el.focus()
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  if (!el.contains(range.commonAncestorContainer)) return
  const text = range.toString() || '代码'
  insertHtmlIntoTypora(`<pre class="md-code"><code>${escapeHtml(text)}</code></pre>`)
}

/**
 * Typora 模式：创建链接（选中内容或默认文本）
 * @param url - 链接地址
 */
function createTyporaLink(url: string) {
  const el = mdTyporaEditorRef.value
  if (!el) return
  el.focus()
  const selection = window.getSelection()
  if (!selection) return
  const before = getCaretCharacterOffsetWithin(el)
  const hasSelection = selection.rangeCount > 0 && selection.toString().length > 0
  if (!hasSelection) {
    document.execCommand('insertText', false, '链接文本')
    const after = getCaretCharacterOffsetWithin(el)
    setTyporaSelectionByTextOffsets(el, Math.max(before, after - 4), after)
  }
  document.execCommand('createLink', false, url)
}

/**
 * 在 Typora 编辑器内按字符偏移设置选区
 * @param el - 编辑器根元素
 * @param start - 起始偏移
 * @param end - 结束偏移
 */
function setTyporaSelectionByTextOffsets(el: HTMLElement, start: number, end: number) {
  const selection = window.getSelection()
  if (!selection) return
  const s = Math.max(0, Math.min(start, end))
  const e = Math.max(0, Math.max(start, end))
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
  let currentOffset = 0
  let startNode: Node | null = null
  let startOffset = 0
  let endNode: Node | null = null
  let endOffset = 0

  let node: Node | null = walker.nextNode()
  while (node) {
    const text = node.textContent || ''
    const nextOffset = currentOffset + text.length
    if (!startNode && s <= nextOffset) {
      startNode = node
      startOffset = Math.max(0, s - currentOffset)
    }
    if (!endNode && e <= nextOffset) {
      endNode = node
      endOffset = Math.max(0, e - currentOffset)
      break
    }
    currentOffset = nextOffset
    node = walker.nextNode()
  }

  if (!startNode || !endNode) return
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  selection.removeAllRanges()
  selection.addRange(range)
}

/**
 * 重置 Markdown 撤销/重做历史
 * @param text - 初始文本
 */
function resetMdHistory(text: string) {
  mdHistory = [text]
  mdHistoryIndex = 0
}

/**
 * 记录 Markdown 历史（用于撤销/重做）
 * @param text - 当前文本
 */
function recordMdHistory(text: string) {
  if (isApplyingMdHistory) return
  const current = mdHistoryIndex >= 0 ? mdHistory[mdHistoryIndex] : undefined
  if (current === text) return
  if (mdHistoryIndex < mdHistory.length - 1) mdHistory = mdHistory.slice(0, mdHistoryIndex + 1)
  mdHistory.push(text)
  mdHistoryIndex = mdHistory.length - 1
  if (mdHistory.length > 120) {
    const overflow = mdHistory.length - 120
    mdHistory = mdHistory.slice(overflow)
    mdHistoryIndex = Math.max(0, mdHistoryIndex - overflow)
  }
}

/**
 * 撤销（Markdown）
 */
function handleMdUndo() {
  if (!canMdUndo.value) return
  isApplyingMdHistory = true
  mdHistoryIndex -= 1
  const nextMd = mdHistory[mdHistoryIndex] ?? ''
  if (mdViewMode.value === 'typora') lastTyporaMarkdown = nextMd
  content.value = nextMd
  scheduleAutoSave()
  nextTick(() => {
    isApplyingMdHistory = false
    focusMarkdown()
    if (mdViewMode.value === 'typora') syncTyporaEditorFromMarkdown(content.value, false)
    else syncMarkdownSelection()
  })
}

/**
 * 重做（Markdown）
 */
function handleMdRedo() {
  if (!canMdRedo.value) return
  isApplyingMdHistory = true
  mdHistoryIndex += 1
  const nextMd = mdHistory[mdHistoryIndex] ?? ''
  if (mdViewMode.value === 'typora') lastTyporaMarkdown = nextMd
  content.value = nextMd
  scheduleAutoSave()
  nextTick(() => {
    isApplyingMdHistory = false
    focusMarkdown()
    if (mdViewMode.value === 'typora') syncTyporaEditorFromMarkdown(content.value, false)
    else syncMarkdownSelection()
  })
}

/**
 * 视图模式切换
 * @param key - 视图模式 key
 */
function handleViewModeSelect(key: string | number) {
  const mode = String(key) as MdViewMode
  if (mode !== 'typora' && mode !== 'split' && mode !== 'source') return
  mdViewMode.value = mode
}

/**
 * Typora 模式输入处理（HTML → Markdown）
 */
function handleTyporaEditorInput() {
  if (editorKind.value !== 'markdown') return
  if (mdViewMode.value !== 'typora') return
  if (isSyncingTyporaEditor) return
  const el = mdTyporaEditorRef.value
  if (!el) return
  const md = convertTyporaHtmlToMarkdown(el.innerHTML || '')
  lastTyporaMarkdown = md
  content.value = md
  scheduleAutoSave()
  scheduleMdHistoryRecord()
}

/**
 * Typora 模式快捷键处理（避免浏览器差异）
 * @param evt - 键盘事件
 */
function handleTyporaEditorKeydown(evt: KeyboardEvent) {
  const isMod = evt.ctrlKey || evt.metaKey
  if (!isMod) return
  const key = (evt.key || '').toLowerCase()

  if (key === 'z') {
    evt.preventDefault()
    if (evt.shiftKey) handleMdRedo()
    else handleMdUndo()
    return
  }
  if (key === 'y') {
    evt.preventDefault()
    handleMdRedo()
    return
  }

  if (key === 'b') {
    evt.preventDefault()
    applyMdBold()
    return
  }
  if (key === 'i') {
    evt.preventDefault()
    applyMdItalic()
    return
  }
  if (key === 'k') {
    evt.preventDefault()
    applyMdLink()
  }
}

/**
 * 标题下拉选择回调
 * @param key - 下拉项 key（h1~h6）
 */
function handleHeadingSelect(key: string | number) {
  const level = Number(String(key).replace('h', ''))
  if (!Number.isFinite(level) || level < 1 || level > 6) return
  applyMdHeading(level)
}

/**
 * 聚焦当前 Markdown 编辑器
 */
function focusMarkdown() {
  if (mdViewMode.value === 'typora') {
    mdTyporaEditorRef.value?.focus()
    return
  }
  const el = getMarkdownTextareaEl()
  if (!el) return
  el.focus()
}

/**
 * 加粗（Markdown）
 */
function applyMdBold() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('bold')
    syncTyporaAfterCommand()
    return
  }
  applyInlineWrap('**', '**', '加粗文本')
}

/**
 * 斜体（Markdown）
 */
function applyMdItalic() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('italic')
    syncTyporaAfterCommand()
    return
  }
  applyInlineWrap('*', '*', '斜体文本')
}

/**
 * 删除线（Markdown）
 */
function applyMdStrike() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('strikeThrough')
    syncTyporaAfterCommand()
    return
  }
  applyInlineWrap('~~', '~~', '删除线文本')
}

/**
 * 行内代码（Markdown）
 */
function applyMdInlineCode() {
  if (mdViewMode.value === 'typora') {
    wrapTyporaSelectionAsInlineCode()
    syncTyporaAfterCommand()
    return
  }
  applyInlineWrap('`', '`', 'code')
}

/**
 * 代码块（Markdown）
 */
function applyMdCodeBlock() {
  if (mdViewMode.value === 'typora') {
    wrapTyporaSelectionAsCodeBlock()
    syncTyporaAfterCommand()
    return
  }
  const selected = getSelectedMarkdownText()
  const inner = selected.length > 0 ? selected : '代码'
  const prefix = '```\n'
  const suffix = '\n```\n'
  const insertText = `${prefix}${inner}${suffix}`
  applyMarkdownEdit(insertText, { startOffset: prefix.length, endOffset: prefix.length + inner.length })
}

/**
 * 链接（Markdown）
 */
function applyMdLink() {
  if (mdViewMode.value === 'typora') {
    createTyporaLink('https://')
    syncTyporaAfterCommand()
    return
  }
  const selected = getSelectedMarkdownText()
  const text = selected.length > 0 ? selected : '链接文本'
  const url = 'https://'
  const prefix = `[${text}](`
  const insertText = `${prefix}${url})`
  applyMarkdownEdit(insertText, { startOffset: prefix.length, endOffset: prefix.length + url.length })
}

/**
 * 表格（Markdown）
 */
function applyMdTable() {
  if (mdViewMode.value === 'typora') {
    insertHtmlIntoTypora(createTyporaTableHtml(3, 3))
    syncTyporaAfterCommand()
    return
  }
  const table = `| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n`
  applyMarkdownEdit(table, { startOffset: 2, endOffset: 4 })
}

/**
 * 创建可编辑的 HTML 表格片段（Typora 模式使用）
 * @param cols - 列数
 * @param rows - 行数（含表头）
 */
function createTyporaTableHtml(cols: number, rows: number) {
  const c = Math.max(1, Math.floor(cols))
  const r = Math.max(2, Math.floor(rows))
  const head = Array.from({ length: c }, (_, i) => `<th>列${i + 1}</th>`).join('')
  const bodyRows = Array.from({ length: r - 1 }, () => {
    const tds = Array.from({ length: c }, () => `<td>内容</td>`).join('')
    return `<tr>${tds}</tr>`
  }).join('')
  return `<table class="md-table"><thead><tr>${head}</tr></thead><tbody>${bodyRows}</tbody></table>`
}

/**
 * 标题（Markdown）
 * @param level - 标题级别 1~6
 */
function applyMdHeading(level: number) {
  if (mdViewMode.value === 'typora') {
    const safe = Math.min(Math.max(level, 1), 6)
    document.execCommand('formatBlock', false, `h${safe}`)
    syncTyporaAfterCommand()
    return
  }
  applyLineTransform((line) => {
    const trimmed = line.trim()
    if (!trimmed) return line
    const withoutHeading = line.replace(/^\s*#{1,6}\s+/, '')
    return `${'#'.repeat(level)} ${withoutHeading.trim()}`
  })
}

/**
 * 引用（Markdown）
 */
function applyMdQuote() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('formatBlock', false, 'blockquote')
    syncTyporaAfterCommand()
    return
  }
  toggleLinePrefix('> ')
}

/**
 * 无序列表（Markdown）
 */
function applyMdUnorderedList() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('insertUnorderedList')
    syncTyporaAfterCommand()
    return
  }
  toggleLinePrefix('- ')
}

/**
 * 任务列表（Markdown）
 */
function applyMdTaskList() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('insertUnorderedList')
    insertHtmlIntoTypora('<input type="checkbox" /> ')
    syncTyporaAfterCommand()
    return
  }
  toggleLinePrefix('- [ ] ')
}

/**
 * 有序列表（Markdown）
 */
function applyMdOrderedList() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('insertOrderedList')
    syncTyporaAfterCommand()
    return
  }
  const { start, end } = getSelectedLineRange()
  const block = content.value.slice(start, end)
  const lines = block.split('\n')
  const allOrdered = lines.filter(l => l.trim().length > 0).every(l => /^\s*\d+\.\s+/.test(l))
  if (allOrdered) {
    const nextLines = lines.map(l => l.replace(/^\s*\d+\.\s+/, ''))
    replaceMarkdownRange(start, end, nextLines.join('\n'))
    return
  }
  let idx = 1
  const nextLines = lines.map((l) => {
    if (l.trim().length === 0) return l
    const without = l.replace(/^\s*(?:- \[ \]\s+|- \[x\]\s+|- \[X\]\s+|- )/, '')
    const next = `${idx}. ${without.trim()}`
    idx += 1
    return next
  })
  replaceMarkdownRange(start, end, nextLines.join('\n'))
}

/**
 * 将选中内容用前后缀包裹（Markdown 行内语法）
 * @param prefix - 前缀
 * @param suffix - 后缀
 * @param placeholder - 无选中时的占位文本
 */
function applyInlineWrap(prefix: string, suffix: string, placeholder: string) {
  const selected = getSelectedMarkdownText()
  const inner = selected.length > 0 ? selected : placeholder
  const insertText = `${prefix}${inner}${suffix}`
  applyMarkdownEdit(insertText, { startOffset: prefix.length, endOffset: prefix.length + inner.length })
}

/**
 * 获取当前选区覆盖到的整行范围
 */
function getSelectedLineRange() {
  const text = content.value
  const start = Math.min(markdownSelection.value.start, markdownSelection.value.end)
  const endRaw = Math.max(markdownSelection.value.start, markdownSelection.value.end)
  const end = endRaw > 0 && text[endRaw - 1] === '\n' ? endRaw - 1 : endRaw
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const nextNl = text.indexOf('\n', end)
  const lineEnd = nextNl === -1 ? text.length : nextNl
  return { start: lineStart, end: lineEnd }
}

/**
 * 替换 Markdown 的某段范围文本并重置光标
 * @param rangeStart - 起始下标（包含）
 * @param rangeEnd - 结束下标（不包含）
 * @param insertText - 替换内容
 */
function replaceMarkdownRange(rangeStart: number, rangeEnd: number, insertText: string) {
  const before = content.value.slice(0, rangeStart)
  const after = content.value.slice(rangeEnd)
  content.value = before + insertText + after
  recordMdHistory(content.value)
  scheduleAutoSave()
  nextTick(() => {
    const el = getMarkdownTextareaEl()
    if (!el) return
    el.focus()
    const nextPos = before.length + insertText.length
    el.setSelectionRange(nextPos, nextPos)
    markdownSelection.value = { start: nextPos, end: nextPos }
  })
}

/**
 * 对选中的行应用转换
 * @param transform - 行转换函数
 */
function applyLineTransform(transform: (line: string) => string) {
  const { start, end } = getSelectedLineRange()
  const block = content.value.slice(start, end)
  const lines = block.split('\n')
  const nextBlock = lines.map(transform).join('\n')
  replaceMarkdownRange(start, end, nextBlock)
}

/**
 * 对选中的行切换前缀（全有则去掉，否则补上）
 * @param prefix - 行前缀
 */
function toggleLinePrefix(prefix: string) {
  const { start, end } = getSelectedLineRange()
  const block = content.value.slice(start, end)
  const lines = block.split('\n')
  const meaningful = lines.filter(l => l.trim().length > 0)
  const allHas = meaningful.length > 0 && meaningful.every(l => l.startsWith(prefix))
  const nextLines = lines.map((l) => {
    if (l.trim().length === 0) return l
    if (allHas) return l.slice(prefix.length)
    return prefix + l
  })
  replaceMarkdownRange(start, end, nextLines.join('\n'))
}

/**
 * 触发选择图片文件（插入为 Markdown 图片语法）
 */
function pickMarkdownImage() {
  if (editorKind.value !== 'markdown') return
  markdownImageInputRef.value?.click()
}

/**
 * 处理图片选择并插入到 Markdown
 * @param e - change 事件
 */
async function handleMarkdownImagePick(e: Event) {
  const input = e.target as HTMLInputElement | null
  const files = input?.files ? Array.from(input.files) : []
  if (input) input.value = ''
  if (files.length === 0) return
  for (const f of files) {
    await insertImageFileToMarkdown(f)
  }
}

/**
 * 将图片文件读取为 DataURL 并插入到 Markdown
 * @param file - 图片文件
 */
async function insertImageFileToMarkdown(file: File) {
  if (!file.type.startsWith('image/')) {
    message.warning('仅支持图片文件')
    return
  }
  const dataUrl = await readFileAsDataUrl(file)
  const alt = file.name.replace(/\.[^/.]+$/, '')
  if (mdViewMode.value === 'typora') {
    insertImageIntoTypora(dataUrl, alt)
    handleTyporaEditorInput()
    return
  }
  const selectedAltRaw = getSelectedMarkdownText().trim()
  const selectedAlt = selectedAltRaw.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
  const safeAlt = selectedAlt.length > 0 && selectedAlt.length <= 80 ? selectedAlt : alt
  insertImageMarkdown(dataUrl, safeAlt)
}

/**
 * 读取文件为 DataURL
 * @param file - 文件
 */
function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 插入 Markdown 图片语法到当前选区/光标
 * @param src - 图片地址
 * @param alt - 替代文本
 */
function insertImageMarkdown(src: string, alt: string) {
  const safeAlt = (alt || 'image').replace(/[\r\n\]]/g, ' ').trim() || 'image'
  const line = `![${safeAlt}](${src})\n`
  applyMarkdownEdit(line)
}

/**
 * 将 AI 输出插入到当前选区或光标位置
 * @param payload - AI 输出
 */
function handleAiInsert(payload: { code: string; lang: string }) {
  const text = (payload.code || '').trim()
  if (!text) return
  if (editorKind.value === 'markdown') {
    if (mdViewMode.value === 'typora') {
      const html = renderMarkdownForTyporaEditor(text)
      insertHtmlIntoTypora(html)
      handleTyporaEditorInput()
      return
    }
    applyMarkdownEdit(text + '\n')
    return
  }
  // 对于 text / csv / slides 编辑器，直接追加内容
  if (editorKind.value === 'slides') {
    activeSlideContent.value = (activeSlideContent.value || '') + '\n\n' + text
    return
  }
  content.value = (content.value || '') + '\n\n' + text
}

/**
 * 获取选中内容；若未选中则返回全文
 */
function getSelectedOrAllMarkdown() {
  const selected = getSelectedMarkdownText()
  return selected.trim().length > 0 ? selected : content.value
}

/**
 * 获取 Markdown textarea 元素
 */
function getMarkdownTextareaEl() {
  const host = markdownEditorHostRef.value
  if (!host) return null
  return host.querySelector('textarea') as HTMLTextAreaElement | null
}

/**
 * 同步当前 Markdown 选区信息
 */
function syncMarkdownSelection() {
  const el = getMarkdownTextareaEl()
  if (!el) return
  markdownSelection.value = { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 }
}

/**
 * 绑定 Markdown 编辑器选区监听
 */
function attachMarkdownSelectionListeners() {
  const el = getMarkdownTextareaEl()
  if (!el) return
  const onKeyDown = (evt: KeyboardEvent) => handleMarkdownKeydown(evt)
  const onKeyUp = () => syncMarkdownSelection()
  const onMouseUp = () => syncMarkdownSelection()
  const onFocus = () => syncMarkdownSelection()
  const onPaste = (evt: ClipboardEvent) => handleMarkdownPaste(evt)
  const onDrop = (evt: DragEvent) => handleMarkdownDrop(evt)
  const onDragOver = (evt: DragEvent) => {
    if (evt.dataTransfer?.types?.includes('Files')) evt.preventDefault()
  }
  el.addEventListener('keydown', onKeyDown as unknown as EventListener)
  el.addEventListener('keyup', onKeyUp)
  el.addEventListener('mouseup', onMouseUp)
  el.addEventListener('focus', onFocus)
  el.addEventListener('paste', onPaste as unknown as EventListener)
  el.addEventListener('drop', onDrop as unknown as EventListener)
  el.addEventListener('dragover', onDragOver as unknown as EventListener)
  selectionHandlers = { el, onKeyDown, onKeyUp, onMouseUp, onFocus, onPaste, onDrop, onDragOver }
  syncMarkdownSelection()
}

/**
 * 解绑 Markdown 编辑器选区监听
 */
function detachMarkdownSelectionListeners() {
  if (!selectionHandlers) return
  const { el, onKeyDown, onKeyUp, onMouseUp, onFocus, onPaste, onDrop, onDragOver } = selectionHandlers
  el.removeEventListener('keydown', onKeyDown as unknown as EventListener)
  el.removeEventListener('keyup', onKeyUp)
  el.removeEventListener('mouseup', onMouseUp)
  el.removeEventListener('focus', onFocus)
  el.removeEventListener('paste', onPaste as unknown as EventListener)
  el.removeEventListener('drop', onDrop as unknown as EventListener)
  el.removeEventListener('dragover', onDragOver as unknown as EventListener)
  selectionHandlers = null
}

/**
 * 处理 Markdown 快捷键（偏 Typora 风格）
 * @param evt - 键盘事件
 */
function handleMarkdownKeydown(evt: KeyboardEvent) {
  const isMod = evt.ctrlKey || evt.metaKey
  if (!isMod) return
  const key = (evt.key || '').toLowerCase()

  if (key === 'b') {
    evt.preventDefault()
    applyMdBold()
    return
  }
  if (key === 'i') {
    evt.preventDefault()
    applyMdItalic()
    return
  }
  if (key === 'k') {
    evt.preventDefault()
    applyMdLink()
    return
  }
  if (key === 'z') {
    evt.preventDefault()
    if (evt.shiftKey) handleMdRedo()
    else handleMdUndo()
    return
  }
  if (key === 'y') {
    evt.preventDefault()
    handleMdRedo()
  }
}

/**
 * 处理 Markdown 粘贴图片
 * @param evt - 剪贴板事件
 */
function handleMarkdownPaste(evt: ClipboardEvent) {
  const items = evt.clipboardData?.items ? Array.from(evt.clipboardData.items) : []
  const imageItems = items.filter(i => i.type.startsWith('image/'))
  if (imageItems.length === 0) return
  evt.preventDefault()
  for (const item of imageItems) {
    const file = item.getAsFile()
    if (file) void insertImageFileToMarkdown(file)
  }
}

/**
 * 处理 Markdown 拖拽图片
 * @param evt - 拖拽事件
 */
function handleMarkdownDrop(evt: DragEvent) {
  const files = evt.dataTransfer?.files ? Array.from(evt.dataTransfer.files) : []
  const images = files.filter(f => f.type.startsWith('image/'))
  if (images.length === 0) return
  evt.preventDefault()
  for (const file of images) {
    void insertImageFileToMarkdown(file)
  }
}

/**
 * 获取当前选中的 Markdown 文本
 */
function getSelectedMarkdownText() {
  const el = getMarkdownTextareaEl()
  if (!el) return ''
  const start = markdownSelection.value.start
  const end = markdownSelection.value.end
  if (end <= start) return ''
  return content.value.slice(start, end)
}

/**
 * 将文本插入/替换到 Markdown 的当前选区
 * @param insertText - 要插入的文本
 * @param selectRange - 插入后需要选中的范围（相对插入段起始偏移）
 */
function applyMarkdownEdit(insertText: string, selectRange?: { startOffset: number; endOffset: number }) {
  const el = getMarkdownTextareaEl()
  const start = markdownSelection.value.start
  const end = markdownSelection.value.end
  const before = content.value.slice(0, start)
  const after = content.value.slice(end)
  content.value = before + insertText + after
  recordMdHistory(content.value)
  scheduleAutoSave()
  nextTick(() => {
    const targetEl = el || getMarkdownTextareaEl()
    if (!targetEl) return
    targetEl.focus()
    const nextStart = before.length + (selectRange ? selectRange.startOffset : insertText.length)
    const nextEnd = before.length + (selectRange ? selectRange.endOffset : insertText.length)
    targetEl.setSelectionRange(nextStart, nextEnd)
    markdownSelection.value = { start: nextStart, end: nextEnd }
  })
}

/**
 * 将 Markdown 渲染为安全的预览 HTML（demo 版）
 * @param md - Markdown 文本
 */
function renderMarkdownPreview(md: string) {
  return renderMarkdownHtml(md, { forTypora: false })
}

/**
 * 将 Markdown 渲染为 Typora 可编辑 HTML（demo 版）
 * @param md - Markdown 文本
 */
function renderMarkdownForTyporaEditor(md: string) {
  return renderMarkdownHtml(md, { forTypora: true })
}

/**
 * Markdown 渲染（预览/Typora 通用）
 * @param md - Markdown 文本
 * @param options - 渲染选项
 */
function renderMarkdownHtml(md: string, options: { forTypora: boolean }) {
  const raw = md || ''
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let inCode = false
  let inBlockquote = false

  type ListKind = 'ul' | 'ol' | 'task'
  type ListLevel = { kind: ListKind; indent: number; hasOpenLi: boolean }
  const listStack: ListLevel[] = []

  const renderBlank = () => (options.forTypora ? '<p><br /></p>' : '<div class="md-blank"></div>')
  const openListTag = (kind: ListKind) => {
    if (kind === 'ol') return '<ol>'
    if (kind === 'task') return '<ul class="md-task-list">'
    return '<ul>'
  }
  const closeListTag = (kind: ListKind) => (kind === 'ol' ? '</ol>' : '</ul>')

  const closeAllLists = () => {
    while (listStack.length > 0) {
      const top = listStack[listStack.length - 1]!
      if (top.hasOpenLi) out.push('</li>')
      out.push(closeListTag(top.kind))
      listStack.pop()
    }
  }

  const closeBlockquote = () => {
    if (!inBlockquote) return
    out.push('</blockquote>')
    inBlockquote = false
  }

  const ensureListLevel = (indent: number, kind: ListKind) => {
    if (listStack.length === 0) {
      out.push(openListTag(kind))
      listStack.push({ kind, indent, hasOpenLi: false })
      return
    }

    const top = listStack[listStack.length - 1]!
    if (indent > top.indent) {
      out.push(openListTag(kind))
      listStack.push({ kind, indent, hasOpenLi: false })
      return
    }

    while (true) {
      const cur = listStack[listStack.length - 1]
      if (!cur) break
      if (indent >= cur.indent) break
      if (cur.hasOpenLi) out.push('</li>')
      out.push(closeListTag(cur.kind))
      listStack.pop()
    }

    const now = listStack[listStack.length - 1]
    if (!now || now.indent !== indent) {
      out.push(openListTag(kind))
      listStack.push({ kind, indent, hasOpenLi: false })
      return
    }

    if (now.kind !== kind) {
      if (now.hasOpenLi) out.push('</li>')
      out.push(closeListTag(now.kind))
      listStack.pop()
      out.push(openListTag(kind))
      listStack.push({ kind, indent, hasOpenLi: false })
    }
  }

  const addListItem = (indent: number, kind: ListKind, html: string, checked?: boolean) => {
    ensureListLevel(indent, kind)
    const top = listStack[listStack.length - 1]
    if (!top) return
    if (top.hasOpenLi) out.push('</li>')
    if (kind === 'task') {
      const disabledAttr = options.forTypora ? '' : 'disabled'
      out.push(
        `<li class="md-task"><input type="checkbox" ${disabledAttr} ${checked ? 'checked' : ''} />` +
          `<span>${html}</span>`
      )
    } else {
      out.push(`<li>${html}`)
    }
    top.hasOpenLi = true
  }

  const consumeTable = (startIndex: number) => {
    const header = lines[startIndex] ?? ''
    const sep = lines[startIndex + 1] ?? ''
    if (!isTableHeaderRow(header) || !isTableSepRow(sep)) return { consumed: 0 }
    const rows: string[] = []
    let i = startIndex + 2
    while (i < lines.length) {
      const row = lines[i] ?? ''
      if (!isTableBodyRow(row)) break
      rows.push(row)
      i += 1
    }

    closeAllLists()
    closeBlockquote()

    const headerCells = parseTableRow(header)
    const bodyCells = rows.map(parseTableRow)
    const colCount = Math.max(1, headerCells.length, ...bodyCells.map(r => r.length))

    out.push('<table class="md-table"><thead><tr>')
    for (let c = 0; c < colCount; c += 1) {
      out.push(`<th>${inlineMdToHtml(headerCells[c] ?? '')}</th>`)
    }
    out.push('</tr></thead><tbody>')

    for (const row of bodyCells) {
      out.push('<tr>')
      for (let c = 0; c < colCount; c += 1) {
        out.push(`<td>${inlineMdToHtml(row[c] ?? '')}</td>`)
      }
      out.push('</tr>')
    }
    out.push('</tbody></table>')
    return { consumed: 2 + rows.length }
  }

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx] ?? ''

    if (line.trim().startsWith('```')) {
      if (!inCode) {
        closeAllLists()
        closeBlockquote()
        out.push('<pre class="md-code"><code>')
        inCode = true
      } else {
        out.push('</code></pre>')
        inCode = false
      }
      continue
    }
    if (inCode) {
      out.push(escapeHtml(line))
      continue
    }

    const tableConsumed = consumeTable(idx)
    if (tableConsumed.consumed > 0) {
      idx += tableConsumed.consumed - 1
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      closeAllLists()
      closeBlockquote()
      const level = heading[1]?.length ?? 1
      out.push(`<h${level}>${inlineMdToHtml(heading[2] || '')}</h${level}>`)
      continue
    }

    const quote = line.match(/^\s*>\s?(.*)$/)
    if (quote) {
      closeAllLists()
      if (!inBlockquote) {
        out.push('<blockquote class="md-quote">')
        inBlockquote = true
      }
      const body = quote[1] || ''
      if (body.trim().length === 0) out.push(renderBlank())
      else out.push(`<p>${inlineMdToHtml(body)}</p>`)
      continue
    }

    if (inBlockquote && line.trim().length === 0) {
      out.push(renderBlank())
      continue
    }

    if (inBlockquote && !line.trim().startsWith('>')) closeBlockquote()

    const leadingSpaces = (line.match(/^\s*/)?.[0] ?? '').replace(/\t/g, '  ').length
    const taskItem = line.match(/^\s*-\s+\[( |x|X)\]\s+(.*)$/)
    if (taskItem) {
      const checked = taskItem[1]?.toLowerCase() === 'x'
      addListItem(leadingSpaces, 'task', inlineMdToHtml(taskItem[2] || ''), checked)
      continue
    }

    const ulItem = line.match(/^\s*-\s+(.*)$/)
    if (ulItem) {
      addListItem(leadingSpaces, 'ul', inlineMdToHtml(ulItem[1] || ''))
      continue
    }

    const olItem = line.match(/^\s*(\d+)\.\s+(.*)$/)
    if (olItem) {
      addListItem(leadingSpaces, 'ol', inlineMdToHtml(olItem[2] || ''))
      continue
    }

    if (listStack.length > 0 && line.trim().length === 0) {
      closeAllLists()
      continue
    }

    if (line.trim().length === 0) {
      closeAllLists()
      closeBlockquote()
      out.push(renderBlank())
      continue
    }

    closeAllLists()
    out.push(`<p>${inlineMdToHtml(line)}</p>`)
  }

  closeAllLists()
  closeBlockquote()
  if (inCode) out.push('</code></pre>')
  return out.join('\n')
}

/**
 * HTML 转义
 * @param input - 原始文本
 */
function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 行内 Markdown（demo 版：粗体/斜体/行内代码）
 * @param text - 行内容
 */
function inlineMdToHtml(text: string) {
  const escaped = escapeHtml(text)
  const withImages = escaped.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_m, alt, src) => {
    const safeSrc = sanitizeUrl(String(src || ''))
    if (!safeSrc) return ''
    const safeAlt = escapeHtml(String(alt || ''))
    return `<img class="md-image" src="${safeSrc}" alt="${safeAlt}" />`
  })

  const withLinks = withImages.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) => {
    const safeHref = sanitizeUrl(String(href || ''))
    if (!safeHref) return escapeHtml(String(label || ''))
    const safeLabel = escapeHtml(String(label || ''))
    return `<a class="md-link" href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`
  })

  return withLinks
    .replace(/&lt;br\s*\/?&gt;/gi, '<br />')
    .replace(/(`+)([^`]*?)\1/g, (_m, _tick, inner) => `<code>${inner}</code>`)
    .replace(/~~([^\n]+?)~~/g, '<del>$1</del>')
    .replace(/\*\*([^\n]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^\n*]+?)\*(?!\*)/g, (_m, prefix, inner) => `${prefix}<em>${inner}</em>`)
}

/**
 * 判断是否可能是表格首行
 * @param line - 行内容
 */
function isTableHeaderRow(line: string) {
  const t = (line || '').trim()
  return t.includes('|') && !t.startsWith('```')
}

/**
 * 判断是否为表格分隔行（--- / :---: 等）
 * @param line - 行内容
 */
function isTableSepRow(line: string) {
  const t = (line || '').trim()
  if (!t.includes('|')) return false
  const normalized = t.replace(/^\|/, '').replace(/\|$/, '')
  const cells = normalized.split('|').map(s => s.trim())
  if (cells.length < 2) return false
  return cells.every(c => /^:?-{3,}:?$/.test(c))
}

/**
 * 判断是否为表格内容行
 * @param line - 行内容
 */
function isTableBodyRow(line: string) {
  const t = (line || '').trim()
  if (!t) return false
  if (!t.includes('|')) return false
  return true
}

/**
 * 解析表格行（按 | 分隔）
 * @param line - 行内容
 */
function parseTableRow(line: string) {
  const t = (line || '').trim().replace(/^\|/, '').replace(/\|$/, '')
  const cells: string[] = []
  let cur = ''
  for (let i = 0; i < t.length; i += 1) {
    const ch = t[i] ?? ''
    const next = t[i + 1] ?? ''
    if (ch === '\\' && next === '|') {
      cur += '|'
      i += 1
      continue
    }
    if (ch === '|') {
      cells.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  cells.push(cur.trim())
  return cells
}

/**
 * 过滤不安全的 URL（demo 版：允许 http/https/data:image/blob）
 * @param url - 原始 URL
 */
function sanitizeUrl(url: string) {
  const u = url.trim()
  const lower = u.toLowerCase()
  if (!u) return ''
  if (lower.startsWith('javascript:')) return ''
  if (lower.startsWith('data:image/')) return u
  if (lower.startsWith('http://') || lower.startsWith('https://')) return u
  if (lower.startsWith('blob:')) return u
  if (lower.startsWith('/')) return u
  if (lower.startsWith('./') || lower.startsWith('../')) return u
  return ''
}

/**
 * 在幻灯片编辑器里输入时触发自动保存调度
 */
function handleSlideInput() {
  scheduleAutoSave()
}

/**
 * 新增一页幻灯片
 */
function addSlide() {
  const blocks = parseSlideBlocks(content.value)
  blocks.push('')
  content.value = blocks.join('\n\n---\n\n') + '\n'
  activeSlideIndex.value = blocks.length - 1
  scheduleAutoSave()
}

/**
 * 删除当前页幻灯片（至少保留 1 页）
 */
function removeSlide() {
  const blocks = parseSlideBlocks(content.value)
  if (blocks.length <= 1) return
  const safeIndex = Math.min(Math.max(activeSlideIndex.value, 0), blocks.length - 1)
  blocks.splice(safeIndex, 1)
  content.value = blocks.join('\n\n---\n\n') + '\n'
  activeSlideIndex.value = Math.min(safeIndex, blocks.length - 1)
  scheduleAutoSave()
}

/**
 * 调度自动保存（防抖）
 */
function scheduleAutoSave() {
  saveStatus.value = 'unsaved'
  if (saveTimer != null) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(async () => {
    saveTimer = null
    await persistFileContent({ silent: true })
  }, 800)
}

/**
 * 手动保存
 */
async function handleSave() {
  await persistFileContent({ silent: false })
}

/**
 * 处理 Word 文档内容变化
 * 触发自动保存调度
 */
function handleDocContentChange() {
  scheduleAutoSave()
}

/**
 * 处理 Word 文档保存事件
 * @param payload - 包含内容和标题的保存数据
 */
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
    // 即使后端保存失败，也更新本地状态
    const currentSize = new Blob([payload.content]).size
    store.updateProjectFile(projectId, file.value.id, { content: payload.content, size: currentSize })
    message.warning('服务器保存失败，已本地保存')
  }
  saveStatus.value = 'saved'
}

/**
 * 处理标题变化
 * @param newTitle 新标题
 */
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

/**
 * 导出文件内容
 */
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
 * 持久化文件内容到 store
 * @param options - 保存选项
 */
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

/**
 * 解析 CSV 表头并生成表格列定义
 * @param text - CSV 文本
 */
function buildCsvColumns(text: string): DataTableColumns<Record<string, string>> {
  const parsed = parseCsv(text)
  return parsed.headers.map(h => ({ title: h || '-', key: h }))
}

/**
 * 解析 CSV 内容并生成表格行数据
 * @param text - CSV 文本
 */
function buildCsvRows(text: string) {
  const parsed = parseCsv(text)
  return parsed.rows
}

/**
 * 解析 CSV（仅 demo：逗号分隔、无转义）
 * @param text - CSV 文本
 */
function parseCsv(text: string) {
  const lines = text.replace(/\\r\\n/g, '\\n').split('\\n').filter(l => l.trim().length > 0)
  const headerLine = lines[0] ?? ''
  const headers = headerLine.split(',').map(s => s.trim())
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(s => s.trim())
    const row: Record<string, string> = {}
    for (let i = 0; i < headers.length; i += 1) {
      const key = headers[i] || `列${i + 1}`
      row[key] = values[i] ?? ''
    }
    return row
  })
  return { headers, rows }
}

/**
 * 将内容按"空行"分割为幻灯片块
 * @param text - 文本内容
 */
function parseSlideBlocks(text: string) {
  const normalized = (text || '').replace(/\\r\\n/g, '\\n').trim()
  if (!normalized) return ['']
  const byDelimiter = normalized.split(/\\n\\s*---+\\s*\\n/g).map(b => b.trim()).filter(Boolean)
  if (byDelimiter.length > 1) return byDelimiter

  const byBlankLines = normalized.split(/\\n\\s*\\n+/g).map(b => b.trim()).filter(Boolean)
  if (byBlankLines.length > 1) return byBlankLines

  const lines = normalized.split('\\n').map(l => l.trimEnd())
  const firstNonEmptyIndex = lines.findIndex(l => l.trim().length > 0)
  if (firstNonEmptyIndex === -1) return ['']

  const titleLine = lines[firstNonEmptyIndex] || ''
  const restLines = lines.slice(firstNonEmptyIndex + 1)
  const items: string[] = []
  for (const ln of restLines) {
    const m = ln.match(/^\\s*\\d+\\s*[.)、]\\s*(.+?)\\s*$/)
    if (!m) continue
    items.push((m[1] || '').trim())
  }

  if (items.length > 0) {
    const title = titleLine.trim() ? [titleLine.trim()] : []
    return [...(title.length ? [title.join('\\n')] : []), ...items]
  }

  return [normalized]
}

/**
 * 更新指定索引的幻灯片块内容并返回新的全文
 * @param fullText - 全文
 * @param index - 幻灯片索引
 * @param nextBlock - 新块内容
 */
function updateSlideBlock(fullText: string, index: number, nextBlock: string) {
  const blocks = parseSlideBlocks(fullText)
  const safeIndex = Math.min(Math.max(index, 0), blocks.length - 1)
  blocks[safeIndex] = (nextBlock || '').trim()
  return blocks.join('\\n\\n---\\n\\n') + '\\n'
}

/**
 * 生成幻灯片块摘要
 * @param block - 幻灯片块内容
 */
function slideSummary(block: string) {
  const firstLine = (block || '').split('\\n')[0] || ''
  return firstLine.slice(0, 24)
}
</script>

<style scoped lang="scss">
.project-file-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: #fafafa;
  position: absolute;
  top: 0;
  left: 0;
  font-family: 'Inter', sans-serif;
}

/* Nexus 风格头部 */
.nexus-editor-header {
  height: 60px;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.nexus-header-btn {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.nexus-header-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.nexus-header-btn-active {
  background: #111827 !important;
  color: #fff !important;
}

.nexus-divider-v {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.08);
}

.file-title {
  max-width: 520px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: #111827;
  font-size: 15px;
  letter-spacing: -0.01em;
}

.save-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 9999px;
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.save-status.saved {
  color: #6b7280;
  background: rgba(0, 0, 0, 0.04);
}

.save-status.saving {
  color: #d97706;
  background: rgba(217, 119, 6, 0.08);
}

.save-status.unsaved {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.06);
}

.save-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.save-status.saving .save-dot {
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nexus-save-btn {
  height: 34px;
  padding: 0 18px;
  border-radius: 9999px;
  background: #111827;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
  font-family: 'Inter', sans-serif;
}

.nexus-save-btn:hover {
  background: #374151;
}

.nexus-save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.editor-body {
  flex: 1;
  overflow: hidden;
  padding: 20px;
}

.editor-container {
  height: 100%;
  display: flex;
  gap: 16px;
}

.editor-single {
  flex: 1;
}

/* Nexus Glass Panel */
.nexus-glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.text-editor-wrapper {
  height: 100%;
  padding: 16px;
}

.mono-editor {
  height: 100%;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

.nexus-mono-input {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  font-size: 14px;
  line-height: 1.7;
  padding: 0 !important;
}

/* Markdown 编辑器区域 */
.editor-markdown {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  overflow: hidden;
}

/* CSV 编辑器 */
.editor-csv {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.csv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
}

.csv-preview-panel {
  flex: 1;
  padding: 16px;
}

.csv-source-panel {
  flex: 1;
  padding: 16px;
}

/* Slides 编辑器 */
.editor-slides {
  flex: 1;
  display: flex;
  gap: 16px;
  min-width: 0;
}

.slides-sider {
  width: 220px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.slides-sider-header {
  padding: 14px 16px;
  font-weight: 600;
  color: #111827;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
}

.slides-sider-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nexus-pill-btn {
  border-radius: 9999px !important;
}

.slides-list {
  padding: 12px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slide-item {
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-item:hover {
  border-color: rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.02);
}

.slide-item.active {
  border-color: #111827;
  background: rgba(0, 0, 0, 0.04);
}

.slide-item-title {
  font-weight: 600;
  color: #111827;
  font-size: 13px;
}

.slide-item-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.slides-main {
  flex: 1;
  min-width: 0;
  padding: 16px;
}

/* Word 文档编辑器样式 */
.editor-doc {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 响应式 */
@media (max-width: 1200px) {
  .editor-container {
    gap: 12px;
  }
}

@media (max-width: 960px) {
  .editor-container {
    flex-direction: column;
  }
}
</style>
