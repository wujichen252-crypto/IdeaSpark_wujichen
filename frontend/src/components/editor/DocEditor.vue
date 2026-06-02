<template>
  <div class="doc-editor">
    <WordRibbonToolbar
      :title="title"
      :save-status="saveStatus"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :show-ai-panel="showAiPanel"
      :view-mode="viewMode"
      :is-bold="isBold"
      :is-italic="isItalic"
      :is-underline="isUnderline"
      :is-strikethrough="isStrikethrough"
      :is-ordered-list="isOrderedList"
      :is-unordered-list="isUnorderedList"
      :block-tag="blockTag"
      :align="align"
      :font-color="fontColor"
      :highlight-color="highlightColor"
      @back="$emit('back')"
      @save="handleSave"
      @undo="undo"
      @redo="redo"
      @title-change="$emit('title-change', $event)"
      @toggle-ai="toggleAiPanel"
      @ai-action="handleAiAction"
      @view-mode-change="viewMode = $event"
      @export="handleExport"
      @print="handlePrint"
      @share="$emit('share')"
      @toggle-fullscreen="$emit('toggle-fullscreen')"
      @format="handleFormat"
      @insert="handleInsert"
      @insert-table="insertTable"
    />

    <div class="editor-body">
      <div
ref="editorRef"
class="doc-editor-content"
contenteditable="true"
@input="onInput"
@paste="handlePaste" ></div>

      <!-- Nexus AI Panel -->
      <NexusAiPanel
        v-if="showAiPanel"
        :file-name="props.title"
        :get-editor-content="getEditorPlainText"
        :get-selected-text="getSelectedText"
        @close="toggleAiPanel"
        @insert="insertAiResult"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import { useDocAi } from '../../composables/useDocAi'
import WordRibbonToolbar from './WordRibbonToolbar.vue'
import NexusAiPanel from './NexusAiPanel.vue'

/**
 * DocEditor 组件 Props 定义
 * @property modelValue - 文档内容（支持 v-model）
 * @property title - 文档标题
 * @property initialContent - 初始内容（可选，优先使用 modelValue）
 */
const props = defineProps<{
  modelValue?: string
  title?: string
  initialContent?: string
}>()

/**
 * DocEditor 组件事件定义
 * @event update:modelValue - 更新文档内容（v-model 支持）
 * @event back - 返回事件
 * @event save - 保存事件，传递当前内容和标题
 * @event title-change - 标题变更事件
 * @event share - 分享事件
 * @event toggle-fullscreen - 全屏切换事件
 * @event change - 内容变更事件
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'back'): void
  (e: 'save', payload: { content: string; title: string }): void
  (e: 'title-change', value: string): void
  (e: 'share'): void
  (e: 'toggle-fullscreen'): void
  (e: 'change'): void
}>()

const message = useMessage()
const editorRef = ref<HTMLElement>()
const viewMode = ref<'typora' | 'split' | 'source'>('typora')
const showAiPanel = ref(false)
const aiResult = ref('')

const docAi = useDocAi(props.title || '')

/**
 * 获取编辑器纯文本内容
 */
function getEditorPlainText(): string {
  if (!editorRef.value) return ''
  return editorRef.value.innerText || ''
}

/**
 * 获取选中的文本
 */
function getSelectedText(): string {
  const sel = window.getSelection()
  return sel?.toString() || ''
}

/**
 * 获取编辑器HTML内容
 */
function getEditorHtml(): string {
  if (!editorRef.value) return ''
  return editorRef.value.innerHTML
}

// Format state
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)
const isStrikethrough = ref(false)
const isOrderedList = ref(false)
const isUnorderedList = ref(false)
const blockTag = ref('p')
const align = ref('left')
const fontColor = ref('#000000')
const highlightColor = ref('#ffff00')

// History
const history = ref<string[]>([''])
const historyIndex = ref(0)
const contentModified = ref(false)
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// Save
let saveTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 将当前编辑器内容推入历史记录栈
 * 同时同步到父组件（通过 v-model）
 */
function pushHistory() {
  if (!editorRef.value) return
  const html = editorRef.value.innerHTML
  if (html === history.value[historyIndex.value]) return
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(html)
  historyIndex.value = history.value.length - 1
  contentModified.value = true
  saveStatus.value = 'unsaved'
  // 同步到父组件
  emit('update:modelValue', html)
  emit('change')
  scheduleAutoSave()
}

function scheduleAutoSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (contentModified.value) handleSave()
  }, 3000)
}

/**
 * 处理保存操作
 * 触发 save 事件，通知父组件执行实际保存逻辑
 */
function handleSave() {
  if (!editorRef.value) return
  saveStatus.value = 'saving'
  const currentContent = editorRef.value.innerHTML
  // 同步到父组件
  emit('update:modelValue', currentContent)
  emit('save', {
    content: currentContent,
    title: props.title || '未命名文档'
  })
  contentModified.value = false
  setTimeout(() => {
    saveStatus.value = 'saved'
  }, 500)
}

// History
function undo() {
  if (!canUndo.value || !editorRef.value) return
  historyIndex.value--
  const content = history.value[historyIndex.value]
  if (content) editorRef.value.innerHTML = content
}

function redo() {
  if (!canRedo.value || !editorRef.value) return
  historyIndex.value++
  const content = history.value[historyIndex.value]
  if (content) editorRef.value.innerHTML = content
}

// Input
function onInput() {
  pushHistory()
  updateFormatState()
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  pushHistory()
}

// Format
function handleFormat(type: string, value?: any) {
  if (!editorRef.value) return
  switch (type) {
    case 'bold':
      document.execCommand('bold')
      break
    case 'italic':
      document.execCommand('italic')
      break
    case 'underline':
      document.execCommand('underline')
      break
    case 'strikethrough':
      document.execCommand('strikeThrough')
      break
    case 'subscript':
      document.execCommand('subscript')
      break
    case 'superscript':
      document.execCommand('superscript')
      break
    case 'font-color':
      document.execCommand('foreColor', false, value)
      break
    case 'highlight-color':
      document.execCommand('hiliteColor', false, value)
      break
    case 'font-family':
      document.execCommand('fontName', false, value)
      break
    case 'font-size':
      document.execCommand('fontSize', false, value)
      break
    case 'heading':
      document.execCommand('formatBlock', false, `<h${value}>`)
      break
    case 'bullet-list':
      document.execCommand('insertUnorderedList')
      break
    case 'numbered-list':
      document.execCommand('insertOrderedList')
      break
    case 'task-list':
      const li = document.createElement('li')
      li.innerHTML = '<input type="checkbox" /> Task item'
      document.execCommand('insertHTML', false, li.outerHTML)
      break
    case 'align-left':
      document.execCommand('justifyLeft')
      break
    case 'align-center':
      document.execCommand('justifyCenter')
      break
    case 'align-right':
      document.execCommand('justifyRight')
      break
    case 'quote':
      document.execCommand('formatBlock', false, '<blockquote>')
      break
    case 'code':
      document.execCommand('formatBlock', false, '<pre>')
      break
    case 'link':
      const url = prompt('Enter URL:')
      if (url) document.execCommand('createLink', false, url)
      break
    case 'image':
      const imgUrl = prompt('Enter image URL:')
      if (imgUrl) document.execCommand('insertImage', false, imgUrl)
      break
    case 'paste':
      navigator.clipboard.readText().then((text) => {
        document.execCommand('insertText', false, text)
      })
      break
    case 'cut':
      document.execCommand('cut')
      break
    case 'copy':
      document.execCommand('copy')
      break
  }
  pushHistory()
  updateFormatState()
}

function handleInsert(type: string, value?: any) {
  if (!editorRef.value) return
  switch (type) {
    case 'link':
      const url = prompt('Enter URL:')
      if (url) document.execCommand('createLink', false, url)
      break
    case 'image':
      const imgUrl = prompt('Enter image URL:')
      if (imgUrl) document.execCommand('insertImage', false, imgUrl)
      break
    case 'special-char':
      document.execCommand('insertText', false, value)
      break
  }
  pushHistory()
}

function insertTable(size: { rows: number; cols: number }) {
  let table = '<table border="1" style="border-collapse:collapse;width:100%;">'
  for (let r = 0; r < size.rows; r++) {
    table += '<tr>'
    for (let c = 0; c < size.cols; c++) {
      table += `<td style="border:1px solid #ccc;padding:8px;min-width:80px;">&nbsp;</td>`
    }
    table += '</tr>'
  }
  table += '</table>'
  document.execCommand('insertHTML', false, table)
  pushHistory()
}

// AI
function toggleAiPanel() {
  showAiPanel.value = !showAiPanel.value
}

function handleAiAction(action: string) {
  const sel = window.getSelection()
  const selectedText = sel?.toString() || ''
  const fullContent = getEditorPlainText()
  executeAiWithAction(action, fullContent, selectedText)
}

/**
 * 根据动作类型执行对应的 AI 操作
 * @param action - 动作类型
 * @param content - 编辑器完整内容
 * @param selectedText - 选中的文本（可选）
 */
async function executeAiWithAction(action: string, content: string, selectedText?: string) {
  aiResult.value = ''
  try {
    let result = ''
    const targetContent = selectedText || content

    switch (action) {
      case 'continue':
      case 'expand':
        result = await docAi.expand(targetContent)
        break
      case 'polish':
        result = await docAi.polish(targetContent)
        break
      case 'summary':
        result = await docAi.summarize(targetContent)
        break
      case 'format':
        // 智能排版：先润色再返回
        result = await docAi.polish(targetContent)
        break
      case 'toc':
        // 生成目录：使用总结功能
        result = await docAi.summarize(content)
        break
      default:
        // 默认使用 chat 方法
        result = await docAi.chat(targetContent, content)
    }

    aiResult.value = result
    if (!result) {
      // AI 返回空结果，可能是服务暂时不可用
      console.warn('AI 返回结果为空')
    }
  } catch (e: any) {
    // 错误已经在 useDocAi 中处理，这里不再显示错误消息
    console.error('AI 操作失败:', e)
  }
}

/**
 * 处理 AI 对话发送
 * @param params - 包含用户输入的参数
 */
async function handleAiSend(params: { action?: string; content: string }) {
  aiResult.value = ''
  try {
    const fullContent = getEditorPlainText()
    const result = await docAi.chat(params.content, fullContent)
    aiResult.value = result
    if (!result) {
      // AI 返回空结果，可能是服务暂时不可用
      console.warn('AI 返回结果为空')
    }
  } catch (e: any) {
    // 错误已经在 useDocAi 中处理，这里不再显示错误消息
    console.error('AI 对话失败:', e)
  }
}

/**
 * 将 AI 生成的内容插入到编辑器
 * @param content - 要插入的内容（纯文本）
 */
function insertAiResult(content: string) {
  if (!editorRef.value || !content) return

  // 确保编辑器获得焦点
  editorRef.value.focus()

  // 将纯文本转换为 HTML 段落
  const htmlContent = content
    .split('\n')
    .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
    .join('')

  // 使用 Selection API 插入内容
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    // 如果选区不在编辑器内，将光标移到编辑器末尾
    if (!editorRef.value.contains(range.commonAncestorContainer)) {
      range.selectNodeContents(editorRef.value)
      range.collapse(false)
    }
    // 删除选中的内容
    range.deleteContents()
    // 插入新内容
    const fragment = range.createContextualFragment(htmlContent)
    range.insertNode(fragment)
    // 移动光标到新内容之后
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  } else {
    // 如果没有选区，直接在末尾追加
    editorRef.value.insertAdjacentHTML('beforeend', htmlContent)
  }

  pushHistory()
  message.success('已插入到编辑器')
}

// Format state
function updateFormatState() {
  isBold.value = document.queryCommandState('bold')
  isItalic.value = document.queryCommandState('italic')
  isUnderline.value = document.queryCommandState('underline')
  isStrikethrough.value = document.queryCommandState('strikeThrough')
  isOrderedList.value = document.queryCommandState('insertOrderedList')
  isUnorderedList.value = document.queryCommandState('insertUnorderedList')

  const block = document.queryCommandValue('formatBlock')
  blockTag.value = block || 'p'

  const justifyLeft = document.queryCommandState('justifyLeft')
  const justifyCenter = document.queryCommandState('justifyCenter')
  const justifyRight = document.queryCommandState('justifyRight')
  if (justifyLeft) align.value = 'left'
  else if (justifyCenter) align.value = 'center'
  else if (justifyRight) align.value = 'right'
  else align.value = 'left'
}

// Export
function handleExport() {
  const html = editorRef.value?.innerHTML || ''
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${props.title}</title></head><body>${html}</body></html>`
  const blob = new Blob([fullHtml], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.title || '文档'}.html`
  a.click()
  URL.revokeObjectURL(url)
}

function handlePrint() {
  const html = editorRef.value?.innerHTML || ''
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${props.title}</title></head><body>${html}</body></html>`)
    win.document.close()
    win.print()
  }
}

/**
 * 初始化编辑器
 * 优先使用 modelValue，其次使用 initialContent，最后使用默认内容
 */
function initEditor() {
  if (!editorRef.value) return
  // 优先使用 modelValue，其次使用 initialContent
  const content = props.modelValue || props.initialContent || '<p><br></p>'
  editorRef.value.innerHTML = content
  history.value = [content]
  historyIndex.value = 0
  contentModified.value = false
  saveStatus.value = 'saved'
}

/**
 * 监听 modelValue 变化，同步更新编辑器内容
 * 用于父组件加载数据后更新编辑器
 */
watch(() => props.modelValue, (newContent) => {
  if (!editorRef.value || newContent === undefined) return
  // 如果内容相同，不更新（避免光标跳动）
  if (editorRef.value.innerHTML === newContent) return
  // 如果用户正在编辑（有未保存内容），不覆盖
  if (contentModified.value) return
  editorRef.value.innerHTML = newContent || '<p><br></p>'
  history.value = [newContent || '<p><br></p>']
  historyIndex.value = 0
})

// Keyboard shortcuts
function onKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 's':
        e.preventDefault()
        handleSave()
        break
      case 'z':
        if (e.shiftKey) {
          e.preventDefault()
          redo()
        } else {
          e.preventDefault()
          undo()
        }
        break
      case 'y':
        e.preventDefault()
        redo()
        break
    }
  }
}

onMounted(() => {
  initEditor()
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer)
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped lang="scss">
@import '@/styles/nexus.scss';

.doc-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--nexus-bg);
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.doc-editor-content {
  flex: 1;
  padding: 48px 64px;
  overflow-y: auto;
  font-size: 15px;
  line-height: 1.8;
  font-family: var(--nexus-font-body);
  color: var(--nexus-text-primary);
  outline: none;

  :deep(h1) { font-size: 2em; margin: 0.67em 0; }
  :deep(h2) { font-size: 1.5em; margin: 0.75em 0; }
  :deep(h3) { font-size: 1.17em; margin: 0.83em 0; }
  :deep(blockquote) {
    border-left: 4px solid var(--nexus-border);
    margin: 1em 0;
    padding: 0.5em 1em;
    color: var(--nexus-text-secondary);
  }
  :deep(pre) {
    background: var(--nexus-divider);
    padding: 12px;
    border-radius: var(--nexus-radius-md);
    overflow-x: auto;
  }
  :deep(code) {
    background: var(--nexus-divider);
    padding: 2px 6px;
    border-radius: var(--nexus-radius-sm);
    font-size: 0.9em;
  }
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }
  :deep(td), :deep(th) {
    border: 1px solid var(--nexus-border);
    padding: 8px;
  }
  :deep(img) {
    max-width: 100%;
    border-radius: var(--nexus-radius-md);
  }
  :deep(a) {
    color: var(--nexus-text-primary);
    text-decoration: underline;
  }
}
</style>
