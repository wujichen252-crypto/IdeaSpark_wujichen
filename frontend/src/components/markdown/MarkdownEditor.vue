<template>
  <div class="markdown-editor-panel">
    <!-- Nexus 风格工具栏 -->
    <div class="nexus-toolbar">
      <div class="nexus-toolbar-group">
        <n-dropdown trigger="click" :options="viewModeOptions" @select="handleViewModeSelect">
          <n-button
size="small"
quaternary
circle
class="nexus-tool-btn"
title="视图模式">
            <template #icon><n-icon :component="SwapHorizontalOutline" /></template>
          </n-button>
        </n-dropdown>

        <n-button
          size="small"
          quaternary
          circle
          class="nexus-tool-btn"
          :disabled="!canMdUndo"
          title="撤销（Ctrl+Z）"
          @click="handleMdUndo">
          <template #icon><n-icon :component="ArrowUndoOutline" /></template>
        </n-button>
        <n-button
          size="small"
          quaternary
          circle
          class="nexus-tool-btn"
          :disabled="!canMdRedo"
          title="重做（Ctrl+Y / Ctrl+Shift+Z）"
          @click="handleMdRedo">
          <template #icon><n-icon :component="ArrowRedoOutline" /></template>
        </n-button>

        <div class="nexus-divider" ></div>

        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn nexus-tool-text"
title="加粗（Ctrl+B）"
@click="applyMdBold">
          <span class="nexus-bold">B</span>
        </n-button>
        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn nexus-tool-text"
title="斜体（Ctrl+I）"
@click="applyMdItalic">
          <span class="nexus-italic">I</span>
        </n-button>
        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn nexus-tool-text"
title="删除线"
@click="applyMdStrike">
          <span class="nexus-strike">S</span>
        </n-button>

        <n-dropdown trigger="click" :options="headingOptions" @select="handleHeadingSelect">
          <n-button
size="small"
quaternary
circle
class="nexus-tool-btn"
title="标题">
            <template #icon><n-icon :component="TextOutline" /></template>
          </n-button>
        </n-dropdown>

        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn"
title="引用"
@click="applyMdQuote">
          <template #icon><n-icon :component="ChatboxEllipsesOutline" /></template>
        </n-button>
        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn"
title="无序列表"
@click="applyMdUnorderedList">
          <template #icon><n-icon :component="ListOutline" /></template>
        </n-button>
        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn"
title="有序列表"
@click="applyMdOrderedList">
          <template #icon><n-icon :component="ReorderTwoOutline" /></template>
        </n-button>
        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn"
title="任务列表"
@click="applyMdTaskList">
          <template #icon><n-icon :component="CheckboxOutline" /></template>
        </n-button>

        <div class="nexus-divider" ></div>

        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn"
title="行内代码"
@click="applyMdInlineCode">
          <template #icon><n-icon :component="CodeOutline" /></template>
        </n-button>
        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn"
title="代码块"
@click="applyMdCodeBlock">
          <template #icon><n-icon :component="CodeSlashOutline" /></template>
        </n-button>
        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn"
title="链接（Ctrl+K）"
@click="applyMdLink">
          <template #icon><n-icon :component="LinkOutline" /></template>
        </n-button>
        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn"
title="插入图片"
@click="pickMarkdownImage">
          <template #icon><n-icon :component="ImageOutline" /></template>
        </n-button>
        <n-button
size="small"
quaternary
circle
class="nexus-tool-btn"
title="表格"
@click="applyMdTable">
          <template #icon><n-icon :component="GridOutline" /></template>
        </n-button>
      </div>

      <div class="nexus-toolbar-group">
        <n-button
          size="small"
          quaternary
          circle
          class="nexus-tool-btn"
          :class="{ 'nexus-tool-active': showAi }"
          title="AI 助手"
          @click="emit('update:showAi', !showAi)">
          <template #icon><n-icon :component="showAi ? Sparkles : SparklesOutline" /></template>
        </n-button>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div class="md-body" :class="{ 'preview-open': mdViewMode === 'split', 'ai-open': showAi }">
      <input
        ref="markdownImageInputRef"
        class="md-hidden-file"
        type="file"
        accept="image/*"
        multiple
        @change="handleMarkdownImagePick" />
      <div ref="markdownEditorHostRef" class="md-editor">
        <div
          v-if="mdViewMode === 'typora'"
          class="md-wysiwyg"
          @click="focusMarkdown"
          @dragover="handleEditorDragOver"
          @drop="handleEditorDrop">
          <div
            ref="mdTyporaEditorRef"
            class="md-typora-editor md-preview-content"
            contenteditable="true"
            spellcheck="false"
            @input="handleTyporaEditorInput"
            @change="handleTyporaEditorInput"
            @keydown="handleTyporaEditorKeydown"
          ></div>
        </div>
        <n-input
          v-else
          v-model:value="content"
          type="textarea"
          :autosize="{ minRows: 22 }"
          placeholder="# 开始编辑 Markdown..."
          class="mono-editor nexus-mono-input"
          @input="handleMarkdownInput"
          @drop="handleEditorDrop"
          @dragover="handleEditorDragOver"
        />
      </div>

      <div v-if="mdViewMode === 'split'" class="md-preview">
        <div class="nexus-glass-panel md-preview-panel">
          <div class="md-preview-header">预览</div>
          <div ref="markdownPreviewRef" class="md-preview-content"></div>
        </div>
      </div>

      <div v-if="showAi" class="md-ai">
        <NexusAiSidebar
          :session-id="sessionId"
          :system-context="systemContext"
          :quick-actions="mdAiQuickActions"
          @apply="handleAiApply"
        />
      </div>
    </div>

    <!-- 浮动 AI 工具栏（选中文字时显示） -->
    <Transition name="nexus-float">
      <div
        v-if="floatingAiVisible && hasTextSelection"
        class="nexus-floating-ai"
        :style="floatingAiStyle">
        <div class="nexus-floating-ai-inner">
          <button
            v-for="action in mdAiQuickActions.slice(0, 5)"
            :key="action.key"
            class="nexus-floating-ai-btn"
            :disabled="mdAiLoading"
            @click="handleFloatingAiAction(action.key)">
            {{ action.label }}
          </button>
          <button
            class="nexus-floating-ai-btn nexus-floating-ai-more"
            :disabled="mdAiLoading"
            @click="handleFloatingAiAction('translate')">
            翻译
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount, onMounted } from 'vue'
import {
  ArrowUndoOutline,
  ArrowRedoOutline,
  ChatboxEllipsesOutline,
  CheckboxOutline,
  CodeOutline,
  CodeSlashOutline,
  GridOutline,
  ImageOutline,
  LinkOutline,
  ListOutline,
  ReorderTwoOutline,
  SparklesOutline,
  Sparkles,
  SwapHorizontalOutline,
  TextOutline
} from '@vicons/ionicons5'
import {
  NButton,
  NIcon,
  NInput,
  NDropdown,
  type DropdownOption
} from 'naive-ui'
import NexusAiSidebar from '@/components/ai/NexusAiSidebar.vue'
import { useMdAi } from '@/composables/useMdAi'

/**
 * 组件属性定义
 */
const props = withDefaults(defineProps<{
  /** 编辑器内容 */
  modelValue: string
  /** 是否显示 AI 面板 */
  showAi?: boolean
  /** 会话 ID */
  sessionId?: string
  /** 系统上下文 */
  systemContext?: string
  /** 视图模式 */
  viewMode?: 'typora' | 'split' | 'source'
  /** 文件名 */
  fileName?: string
}>(), {
  showAi: false,
  sessionId: '',
  systemContext: '',
  viewMode: 'typora',
  fileName: '未命名文档'
})

/**
 * 组件事件定义
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:showAi', value: boolean): void
  (e: 'change'): void
  (e: 'save-file', payload: { code: string; lang: string }): void
  (e: 'undo-state-change', canUndo: boolean, canRedo: boolean): void
}>()

type MdViewMode = 'typora' | 'split' | 'source'

const content = ref(props.modelValue)
const mdViewMode = ref<MdViewMode>(props.viewMode)
const markdownEditorHostRef = ref<HTMLElement | null>(null)
const markdownPreviewRef = ref<HTMLElement | null>(null)
const markdownSelection = ref<{ start: number; end: number }>({ start: 0, end: 0 })
const markdownImageInputRef = ref<HTMLInputElement | null>(null)
const mdTyporaEditorRef = ref<HTMLDivElement | null>(null)

let isSyncingTyporaEditor = false
let lastTyporaMarkdown = ''

let mdHistory: string[] = []
let mdHistoryIndex = -1
let mdHistoryTimer: ReturnType<typeof setTimeout> | null = null
let isApplyingMdHistory = false

const canMdUndo = computed(() => mdHistoryIndex > 0)
const canMdRedo = computed(() => mdHistoryIndex >= 0 && mdHistoryIndex < mdHistory.length - 1)

watch(() => canMdUndo.value, (v) => emit('undo-state-change', v, canMdRedo.value))
watch(() => canMdRedo.value, (v) => emit('undo-state-change', canMdUndo.value, v))

const headingOptions: DropdownOption[] = [
  { label: '一级标题', key: 'h1' },
  { label: '二级标题', key: 'h2' },
  { label: '三级标题', key: 'h3' },
  { label: '四级标题', key: 'h4' },
  { label: '五级标题', key: 'h5' },
  { label: '六级标题', key: 'h6' }
]

const viewModeOptions: DropdownOption[] = [
  { label: '所见即所得', key: 'typora' },
  { label: '分栏预览', key: 'split' },
  { label: '源码编辑', key: 'source' }
]

const markdownPreviewHtml = computed(() => {
  if (mdViewMode.value !== 'split') return ''
  return renderMarkdownPreview(content.value)
})

// AI 相关
const { loading: mdAiLoading, actions: mdAiActions, executeAction } = useMdAi(props.fileName)

const mdAiQuickActions = computed(() =>
  mdAiActions.map(a => ({
    key: a.key,
    label: a.label,
    prompt: a.prompt(getSelectedOrAllMarkdown(), props.fileName)
  }))
)

// 浮动 AI 工具栏
const floatingAiVisible = ref(false)
const floatingAiPosition = ref({ x: 0, y: 0 })
const hasTextSelection = ref(false)

const floatingAiStyle = computed(() => ({
  left: `${floatingAiPosition.value.x}px`,
  top: `${floatingAiPosition.value.y - 48}px`
}))

// 监听 modelValue 变化
watch(() => props.modelValue, (next) => {
  if (next !== content.value) {
    content.value = next
    resetMdHistory(next)
    if (mdViewMode.value === 'typora') {
      syncTyporaEditorFromMarkdown(next, false)
    }
  }
})

// 监听 viewMode 属性变化
watch(() => props.viewMode, (newMode) => {
  if (newMode !== mdViewMode.value) {
    mdViewMode.value = newMode
  }
})

watch(() => content.value, (next) => {
  emit('update:modelValue', next)
  emit('change')
  if (mdViewMode.value === 'typora') {
    if (isSyncingTyporaEditor) return
    if (next === lastTyporaMarkdown) return
    nextTick(() => {
      syncTyporaEditorFromMarkdown(next, true)
    })
  }
})

watch(
  () => markdownPreviewHtml.value,
  (html) => {
    if (!markdownPreviewRef.value) return
    markdownPreviewRef.value.innerHTML = html || ''
  },
  { immediate: true }
)

watch(
  () => mdViewMode.value,
  async () => {
    detachMarkdownSelectionListeners()
    await nextTick()
    attachMarkdownSelectionListeners()
    if (mdViewMode.value === 'typora') {
      syncTyporaEditorFromMarkdown(content.value, false)
    }
    focusMarkdown()
  }
)

onBeforeUnmount(() => {
  detachMarkdownSelectionListeners()
  document.removeEventListener('selectionchange', onDocumentSelectionChange)
})

onMounted(() => {
  document.addEventListener('selectionchange', onDocumentSelectionChange)
})

function onDocumentSelectionChange() {
  if (mdViewMode.value === 'typora') {
    checkTyporaSelection()
  } else {
    checkTextareaSelection()
  }
}

function checkTyporaSelection() {
  const el = mdTyporaEditorRef.value
  if (!el) {
    hasTextSelection.value = false
    return
  }
  const selection = window.getSelection()
  const text = selection?.toString() || ''
  hasTextSelection.value = text.trim().length > 0
  if (hasTextSelection.value && selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    floatingAiPosition.value = {
      x: rect.left + rect.width / 2,
      y: rect.top
    }
  }
  floatingAiVisible.value = hasTextSelection.value
}

function checkTextareaSelection() {
  const el = getMarkdownTextareaEl()
  if (!el) {
    hasTextSelection.value = false
    return
  }
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  const text = content.value.slice(start, end)
  hasTextSelection.value = text.trim().length > 0
  if (hasTextSelection.value) {
    // 对于 textarea，浮动工具栏显示在固定位置或基于鼠标位置
    // 这里简化处理：使用最近一次鼠标位置
    floatingAiPosition.value = lastMousePosition.value
  }
  floatingAiVisible.value = hasTextSelection.value
}

const lastMousePosition = ref({ x: 0, y: 0 })

function handleEditorMouseMove(evt: MouseEvent) {
  lastMousePosition.value = { x: evt.clientX, y: evt.clientY }
}

async function handleFloatingAiAction(actionKey: string) {
  const selected = getSelectedMarkdownText()
  const target = selected.trim().length > 0 ? selected : content.value
  if (!target.trim()) return

  const result = await executeAction(actionKey, target)
  if (!result) return

  if (mdViewMode.value === 'typora') {
    const html = renderMarkdownForTyporaEditor(result)
    insertHtmlIntoTypora(html)
    handleTyporaEditorInput()
  } else {
    applyMarkdownEdit(result + '\n')
  }
  floatingAiVisible.value = false
}

async function handleAiApply(appliedContent: string) {
  const text = (appliedContent || '').trim()
  if (!text) return
  if (mdViewMode.value === 'typora') {
    const html = renderMarkdownForTyporaEditor(text)
    insertHtmlIntoTypora(html)
    handleTyporaEditorInput()
  } else {
    applyMarkdownEdit(text + '\n')
  }
  emit('save-file', { code: text, lang: 'markdown' })
}

function handleEditorDragOver(evt: DragEvent) {
  if (evt.dataTransfer?.types?.includes('Files')) {
    evt.preventDefault()
    evt.dataTransfer.dropEffect = 'copy'
  }
}

function handleEditorDrop(evt: DragEvent) {
  const files = evt.dataTransfer?.files ? Array.from(evt.dataTransfer.files) : []
  const images = files.filter(f => f.type.startsWith('image/'))
  if (images.length === 0) return
  evt.preventDefault()
  for (const file of images) {
    void insertImageFileToMarkdown(file)
  }
}

/**
 * 将 Markdown 同步渲染到 Typora 编辑器（Markdown → HTML）
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

function syncTyporaAfterCommand() {
  if (mdViewMode.value !== 'typora') return
  nextTick(() => handleTyporaEditorInput())
}

function scheduleMdHistoryRecord() {
  if (isApplyingMdHistory) return
  if (mdHistoryTimer != null) window.clearTimeout(mdHistoryTimer)
  mdHistoryTimer = window.setTimeout(() => {
    mdHistoryTimer = null
    recordMdHistory(content.value)
  }, 220)
}

function convertTyporaHtmlToMarkdown(html: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html || '', 'text/html')
  const md = convertTyporaNodesToMarkdown(doc.body.childNodes).trimEnd()
  const normalized = md.replace(/\n{3,}/g, '\n\n').trimEnd()
  return normalized.length > 0 ? normalized + '\n' : ''
}

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

function escapeTableCellMd(text: string) {
  return (text || '').replace(/\r\n/g, '\n').replace(/\n+/g, '<br>').replace(/\|/g, '\\|')
}

function wrapInlineCodeMd(codeText: string) {
  const text = (codeText || '').replace(/\r\n/g, '\n').replace(/\n+/g, ' ')
  const runs = Array.from(text.matchAll(/`+/g)).map(m => m[0].length)
  const fenceLen = Math.max(1, ...runs) + 1
  const fence = '`'.repeat(fenceLen)
  const needPadding = text.startsWith('`') || text.endsWith('`') || text.startsWith(' ') || text.endsWith(' ')
  return needPadding ? `${fence} ${text} ${fence}` : `${fence}${text}${fence}`
}

function extractTyporaTaskState(li: HTMLLIElement): boolean | null {
  const inputs = Array.from(li.querySelectorAll('input'))
  const checkbox = inputs.find(i => (i.getAttribute('type') || '').toLowerCase() === 'checkbox') as HTMLInputElement | undefined
  if (!checkbox) return null
  return checkbox.checked
}

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

function convertTyporaChildrenInline(el: HTMLElement, options?: { stripCheckboxInputs?: boolean }) {
  const parts = Array.from(el.childNodes).map(n => convertTyporaInlineToMarkdown(n, options))
  return parts.join('')
}

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

function insertImageIntoTypora(src: string, alt: string) {
  const safeSrc = sanitizeUrl(src)
  if (!safeSrc) return
  const safeAlt = escapeHtml((alt || 'image').replace(/[\r\n"]/g, ' ').trim() || 'image')
  insertHtmlIntoTypora(`<img class="md-image" src="${safeSrc}" alt="${safeAlt}" />`)
}

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

function resetMdHistory(text: string) {
  mdHistory = [text]
  mdHistoryIndex = 0
}

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

function handleMdUndo() {
  if (!canMdUndo.value) return
  isApplyingMdHistory = true
  mdHistoryIndex -= 1
  const nextMd = mdHistory[mdHistoryIndex] ?? ''
  if (mdViewMode.value === 'typora') lastTyporaMarkdown = nextMd
  content.value = nextMd
  nextTick(() => {
    isApplyingMdHistory = false
    focusMarkdown()
    if (mdViewMode.value === 'typora') syncTyporaEditorFromMarkdown(content.value, false)
    else syncMarkdownSelection()
  })
}

function handleMdRedo() {
  if (!canMdRedo.value) return
  isApplyingMdHistory = true
  mdHistoryIndex += 1
  const nextMd = mdHistory[mdHistoryIndex] ?? ''
  if (mdViewMode.value === 'typora') lastTyporaMarkdown = nextMd
  content.value = nextMd
  nextTick(() => {
    isApplyingMdHistory = false
    focusMarkdown()
    if (mdViewMode.value === 'typora') syncTyporaEditorFromMarkdown(content.value, false)
    else syncMarkdownSelection()
  })
}

function handleViewModeSelect(key: string | number) {
  const mode = String(key) as MdViewMode
  if (mode !== 'typora' && mode !== 'split' && mode !== 'source') return
  mdViewMode.value = mode
}

function handleTyporaEditorInput() {
  if (mdViewMode.value !== 'typora') return
  if (isSyncingTyporaEditor) return
  const el = mdTyporaEditorRef.value
  if (!el) return
  const md = convertTyporaHtmlToMarkdown(el.innerHTML || '')
  lastTyporaMarkdown = md
  content.value = md
  scheduleMdHistoryRecord()
}

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

function handleHeadingSelect(key: string | number) {
  const level = Number(String(key).replace('h', ''))
  if (!Number.isFinite(level) || level < 1 || level > 6) return
  applyMdHeading(level)
}

function focusMarkdown() {
  if (mdViewMode.value === 'typora') {
    mdTyporaEditorRef.value?.focus()
    return
  }
  const el = getMarkdownTextareaEl()
  if (!el) return
  el.focus()
}

function applyMdBold() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('bold')
    syncTyporaAfterCommand()
    return
  }
  applyInlineWrap('**', '**', '加粗文本')
}

function applyMdItalic() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('italic')
    syncTyporaAfterCommand()
    return
  }
  applyInlineWrap('*', '*', '斜体文本')
}

function applyMdStrike() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('strikeThrough')
    syncTyporaAfterCommand()
    return
  }
  applyInlineWrap('~~', '~~', '删除线文本')
}

function applyMdInlineCode() {
  if (mdViewMode.value === 'typora') {
    wrapTyporaSelectionAsInlineCode()
    syncTyporaAfterCommand()
    return
  }
  applyInlineWrap('`', '`', 'code')
}

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

function applyMdTable() {
  if (mdViewMode.value === 'typora') {
    insertHtmlIntoTypora(createTyporaTableHtml(3, 3))
    syncTyporaAfterCommand()
    return
  }
  const table = `| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n`
  applyMarkdownEdit(table, { startOffset: 2, endOffset: 4 })
}

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

function applyMdQuote() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('formatBlock', false, 'blockquote')
    syncTyporaAfterCommand()
    return
  }
  toggleLinePrefix('> ')
}

function applyMdUnorderedList() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('insertUnorderedList')
    syncTyporaAfterCommand()
    return
  }
  toggleLinePrefix('- ')
}

function applyMdTaskList() {
  if (mdViewMode.value === 'typora') {
    document.execCommand('insertUnorderedList')
    insertHtmlIntoTypora('<input type="checkbox" /> ')
    syncTyporaAfterCommand()
    return
  }
  toggleLinePrefix('- [ ] ')
}

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

function applyInlineWrap(prefix: string, suffix: string, placeholder: string) {
  const selected = getSelectedMarkdownText()
  const inner = selected.length > 0 ? selected : placeholder
  const insertText = `${prefix}${inner}${suffix}`
  applyMarkdownEdit(insertText, { startOffset: prefix.length, endOffset: prefix.length + inner.length })
}

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

function replaceMarkdownRange(rangeStart: number, rangeEnd: number, insertText: string) {
  const before = content.value.slice(0, rangeStart)
  const after = content.value.slice(rangeEnd)
  content.value = before + insertText + after
  recordMdHistory(content.value)
  nextTick(() => {
    const el = getMarkdownTextareaEl()
    if (!el) return
    el.focus()
    const nextPos = before.length + insertText.length
    el.setSelectionRange(nextPos, nextPos)
    markdownSelection.value = { start: nextPos, end: nextPos }
  })
}

function applyLineTransform(transform: (line: string) => string) {
  const { start, end } = getSelectedLineRange()
  const block = content.value.slice(start, end)
  const lines = block.split('\n')
  const nextBlock = lines.map(transform).join('\n')
  replaceMarkdownRange(start, end, nextBlock)
}

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

function pickMarkdownImage() {
  markdownImageInputRef.value?.click()
}

/**
 * AI 改写功能
 * @description 调用 AI 改写当前选中的文本或文档内容
 */
function sendAiRewrite() {
  emit('update:showAi', true)
}

/**
 * AI 润色功能
 * @description 调用 AI 润色当前选中的文本
 */
function sendAiPolish() {
  emit('update:showAi', true)
}

/**
 * AI 扩写功能
 * @description 调用 AI 扩展当前选中的文本内容
 */
function sendAiExpand() {
  emit('update:showAi', true)
}

/**
 * AI 生成大纲功能
 * @description 调用 AI 生成文档大纲
 */
function sendAiOutline() {
  emit('update:showAi', true)
}

/**
 * AI 生成摘要功能
 * @description 调用 AI 生成文档内容摘要
 */
function sendAiSummary() {
  emit('update:showAi', true)
}

async function handleMarkdownImagePick(e: Event) {
  const input = e.target as HTMLInputElement | null
  const files = input?.files ? Array.from(input.files) : []
  if (input) input.value = ''
  if (files.length === 0) return
  for (const f of files) {
    await insertImageFileToMarkdown(f)
  }
}

async function insertImageFileToMarkdown(file: File) {
  if (!file.type.startsWith('image/')) return
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('读取失败'))
    reader.readAsDataURL(file)
  })
}

function insertImageMarkdown(src: string, alt: string) {
  const safeAlt = (alt || 'image').replace(/[\r\n\]]/g, ' ').trim() || 'image'
  const line = `![${safeAlt}](${src})\n`
  applyMarkdownEdit(line)
}

function getSelectedOrAllMarkdown() {
  const selected = getSelectedMarkdownText()
  return selected.trim().length > 0 ? selected : content.value
}

function getMarkdownTextareaEl() {
  const host = markdownEditorHostRef.value
  if (!host) return null
  return host.querySelector('textarea') as HTMLTextAreaElement | null
}

function syncMarkdownSelection() {
  const el = getMarkdownTextareaEl()
  if (!el) return
  markdownSelection.value = { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 }
}

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
      onMouseMove: (evt: MouseEvent) => void
    }
  | null = null

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
  const onMouseMove = (evt: MouseEvent) => handleEditorMouseMove(evt)
  el.addEventListener('keydown', onKeyDown as unknown as EventListener)
  el.addEventListener('keyup', onKeyUp)
  el.addEventListener('mouseup', onMouseUp)
  el.addEventListener('focus', onFocus)
  el.addEventListener('paste', onPaste as unknown as EventListener)
  el.addEventListener('drop', onDrop as unknown as EventListener)
  el.addEventListener('dragover', onDragOver as unknown as EventListener)
  el.addEventListener('mousemove', onMouseMove)
  selectionHandlers = { el, onKeyDown, onKeyUp, onMouseUp, onFocus, onPaste, onDrop, onDragOver, onMouseMove }
  syncMarkdownSelection()
}

function detachMarkdownSelectionListeners() {
  if (!selectionHandlers) return
  const { el, onKeyDown, onKeyUp, onMouseUp, onFocus, onPaste, onDrop, onDragOver, onMouseMove } = selectionHandlers
  el.removeEventListener('keydown', onKeyDown as unknown as EventListener)
  el.removeEventListener('keyup', onKeyUp)
  el.removeEventListener('mouseup', onMouseUp)
  el.removeEventListener('focus', onFocus)
  el.removeEventListener('paste', onPaste as unknown as EventListener)
  el.removeEventListener('drop', onDrop as unknown as EventListener)
  el.removeEventListener('dragover', onDragOver as unknown as EventListener)
  el.removeEventListener('mousemove', onMouseMove)
  selectionHandlers = null
}

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

function handleMarkdownDrop(evt: DragEvent) {
  const files = evt.dataTransfer?.files ? Array.from(evt.dataTransfer.files) : []
  const images = files.filter(f => f.type.startsWith('image/'))
  if (images.length === 0) return
  evt.preventDefault()
  for (const file of images) {
    void insertImageFileToMarkdown(file)
  }
}

function getSelectedMarkdownText() {
  const el = getMarkdownTextareaEl()
  if (!el) return ''
  const start = markdownSelection.value.start
  const end = markdownSelection.value.end
  if (end <= start) return ''
  return content.value.slice(start, end)
}

function applyMarkdownEdit(insertText: string, selectRange?: { startOffset: number; endOffset: number }) {
  const el = getMarkdownTextareaEl()
  const start = markdownSelection.value.start
  const end = markdownSelection.value.end
  const before = content.value.slice(0, start)
  const after = content.value.slice(end)
  content.value = before + insertText + after
  recordMdHistory(content.value)
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

function handleMarkdownInput() {
  syncMarkdownSelection()
  scheduleMdHistoryRecord()
}

function renderMarkdownPreview(md: string) {
  return renderMarkdownHtml(md, { forTypora: false })
}

function renderMarkdownForTyporaEditor(md: string) {
  return renderMarkdownHtml(md, { forTypora: true })
}

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

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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

function isTableHeaderRow(line: string) {
  const t = (line || '').trim()
  return t.includes('|') && !t.startsWith('```')
}

function isTableSepRow(line: string) {
  const t = (line || '').trim()
  if (!t.includes('|')) return false
  const normalized = t.replace(/^\|/, '').replace(/\|$/, '')
  const cells = normalized.split('|').map(s => s.trim())
  if (cells.length < 2) return false
  return cells.every(c => /^:?-{3,}:?$/.test(c))
}

function isTableBodyRow(line: string) {
  const t = (line || '').trim()
  if (!t) return false
  if (!t.includes('|')) return false
  return true
}

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
 * 暴露组件方法和属性给父组件
 */
defineExpose({
  handleMdUndo,
  handleMdRedo,
  applyMdBold,
  applyMdItalic,
  applyMdStrike,
  applyMdHeading,
  applyMdUnorderedList,
  applyMdOrderedList,
  applyMdTaskList,
  applyMdQuote,
  applyMdInlineCode,
  applyMdCodeBlock,
  applyMdLink,
  applyMdTable,
  pickMarkdownImage,
  sendAiRewrite,
  sendAiPolish,
  sendAiExpand,
  sendAiOutline,
  sendAiSummary,
  markdownSelection
})
</script>

<style scoped lang="scss">
.markdown-editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  overflow: hidden;
  position: relative;
}

/* Nexus 风格工具栏 */
.nexus-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
}

.nexus-toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.nexus-tool-btn {
  width: 34px;
  height: 34px;
  border-radius: 9999px;
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.nexus-tool-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.nexus-tool-active {
  background: #111827 !important;
  color: #fff !important;
}

.nexus-tool-text {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-weight: 700;
  letter-spacing: 0.5px;
  font-size: 13px;
}

.nexus-bold {
  font-weight: 700;
}

.nexus-italic {
  font-style: italic;
}

.nexus-strike {
  text-decoration: line-through;
}

.nexus-divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 4px;
}

/* 编辑器主体 */
.md-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  gap: 16px;
  min-width: 0;
  overflow: hidden;
}

.md-body.preview-open {
  grid-template-columns: 1fr 420px;
}

.md-body.ai-open.preview-open {
  grid-template-columns: 1fr 420px 380px;
}

.md-body.ai-open:not(.preview-open) {
  grid-template-columns: 1fr 380px;
}

.md-editor {
  min-width: 0;
  overflow: hidden;
  height: 100%;
}

.md-wysiwyg {
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  box-shadow: 0 2px 12px -2px rgba(0, 0, 0, 0.04);
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.md-wysiwyg:hover {
  border-color: rgba(0, 0, 0, 0.1);
}

.md-typora-editor {
  height: 100%;
  outline: none;
  padding: 20px;
  overflow: auto;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  line-height: 1.7;
  color: #111827;
}

.md-typora-editor:empty::before {
  content: '开始编辑 Markdown...';
  color: #9ca3af;
  font-size: 15px;
}

/* Glass 预览面板 */
.md-preview {
  min-width: 0;
  overflow: hidden;
  height: 100%;
}

.nexus-glass-panel {
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.md-preview-header {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
}

.md-preview-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  color: #111827;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.7;
}

.md-preview-content :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  margin: 16px 0 12px;
  letter-spacing: -0.01em;
}

.md-preview-content :deep(h2) {
  font-size: 18px;
  font-weight: 600;
  margin: 16px 0 8px;
  letter-spacing: -0.01em;
}

.md-preview-content :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 12px 0 8px;
}

.md-preview-content :deep(p) {
  margin: 8px 0;
  line-height: 1.7;
}

.md-preview-content :deep(ul) {
  margin: 8px 0;
  padding-left: 18px;
}

.md-preview-content :deep(li) {
  margin: 6px 0;
  line-height: 1.6;
}

.md-preview-content :deep(code) {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 13px;
}

.md-preview-content :deep(.md-code) {
  background: #111827;
  color: #e5e7eb;
  padding: 14px;
  border-radius: 12px;
  overflow: auto;
}

.md-preview-content :deep(.md-code code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  color: inherit;
}

.md-preview-content :deep(.md-image) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.md-preview-content :deep(.md-blank) {
  height: 10px;
}

.md-preview-content :deep(.md-placeholder) {
  color: #9ca3af;
}

.md-hidden-file {
  display: none;
}

.md-ai {
  min-width: 0;
  overflow: hidden;
  height: 100%;
}

.mono-editor {
  height: 100%;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

.nexus-mono-input {
  background: #ffffff !important;
  border-radius: 16px !important;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  box-shadow: 0 2px 12px -2px rgba(0, 0, 0, 0.04) !important;
  padding: 20px !important;
  font-size: 14px;
  line-height: 1.7;
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.nexus-mono-input:hover {
  border-color: rgba(0, 0, 0, 0.1) !important;
}

.nexus-mono-input:focus {
  border-color: rgba(0, 0, 0, 0.2) !important;
  box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.08) !important;
}

/* 浮动 AI 工具栏 */
.nexus-floating-ai {
  position: fixed;
  z-index: 1000;
  transform: translateX(-50%);
  pointer-events: auto;
}

.nexus-floating-ai-inner {
  display: flex;
  gap: 6px;
  padding: 6px;
  background: #111827;
  border-radius: 9999px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: nexus-float-in 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.nexus-floating-ai-btn {
  padding: 5px 12px;
  background: transparent;
  color: #e5e7eb;
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

.nexus-floating-ai-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.nexus-floating-ai-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nexus-floating-ai-more {
  color: #9ca3af;
  border-color: rgba(255, 255, 255, 0.1);
}

@keyframes nexus-float-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.nexus-float-enter-active,
.nexus-float-leave-active {
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.nexus-float-enter-from,
.nexus-float-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px) scale(0.96);
}

/* 响应式 */
@media (max-width: 1200px) {
  .md-body.ai-open.preview-open {
    grid-template-columns: 1fr 380px;
  }

  .md-body.preview-open {
    grid-template-columns: 1fr;
  }
}
</style>
