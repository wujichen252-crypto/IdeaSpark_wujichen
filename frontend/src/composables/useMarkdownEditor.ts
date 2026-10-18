import { computed, ref, watch, nextTick, onBeforeUnmount, onMounted, inject, type InjectionKey, type Ref, type ComputedRef } from 'vue'
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
import { useMdAi } from '@/composables/useMdAi'
import {
  renderMarkdownPreview,
  renderMarkdownForTyporaEditor,
  convertTyporaHtmlToMarkdown,
  getCaretCharacterOffsetWithin,
  setCaretCharacterOffsetWithin,
  sanitizeUrl,
  escapeHtml
} from '@/components/markdown/markdownEditorHelpers'

export interface MarkdownEditorContext {
  // 模板绑定 ref
  markdownEditorHostRef: Ref<HTMLElement | null>
  markdownPreviewRef: Ref<HTMLElement | null>
  markdownImageInputRef: Ref<HTMLInputElement | null>
  mdTyporaEditorRef: Ref<HTMLDivElement | null>
  // 状态
  content: Ref<string>
  mdViewMode: Ref<'typora' | 'split' | 'source'>
  markdownSelection: Ref<{ start: number; end: number }>
  showAi: boolean
  sessionId: string
  systemContext: string
  fileName: string
  // 计算属性
  canMdUndo: ComputedRef<boolean>
  canMdRedo: ComputedRef<boolean>
  headingOptions: DropdownOption[]
  viewModeOptions: DropdownOption[]
  markdownPreviewHtml: ComputedRef<string>
  mdAiLoading: Ref<boolean>
  mdAiQuickActions: ComputedRef<{ key: string; label: string; prompt: string }[]>
  floatingAiVisible: Ref<boolean>
  floatingAiStyle: ComputedRef<{ left: string; top: string }>
  hasTextSelection: Ref<boolean>
  // 方法
  handleViewModeSelect: (key: string | number) => void
  handleMdUndo: () => void
  handleMdRedo: () => void
  handleHeadingSelect: (key: string | number) => void
  applyMdBold: () => void
  applyMdItalic: () => void
  applyMdStrike: () => void
  applyMdInlineCode: () => void
  applyMdCodeBlock: () => void
  applyMdLink: () => void
  applyMdTable: () => void
  applyMdHeading: (level: number) => void
  applyMdQuote: () => void
  applyMdUnorderedList: () => void
  applyMdTaskList: () => void
  applyMdOrderedList: () => void
  pickMarkdownImage: () => void
  sendAiRewrite: () => void
  sendAiPolish: () => void
  sendAiExpand: () => void
  sendAiOutline: () => void
  sendAiSummary: () => void
  handleFloatingAiAction: (actionKey: string) => Promise<void>
  handleAiApply: (appliedContent: string) => void
  handleEditorDragOver: (evt: DragEvent) => void
  handleEditorDrop: (evt: DragEvent) => void
  handleTyporaEditorInput: () => void
  handleTyporaEditorKeydown: (evt: KeyboardEvent) => void
  handleMarkdownInput: () => void
  handleMarkdownImagePick: (e: Event) => Promise<void>
  focusMarkdown: () => void
}

export const MARKDOWN_EDITOR_KEY: InjectionKey<MarkdownEditorContext> = Symbol('markdown-editor')

type MdViewMode = 'typora' | 'split' | 'source'

export function createMarkdownEditor(
  props: {
    modelValue: string
    showAi?: boolean
    sessionId?: string
    systemContext?: string
    viewMode?: MdViewMode
    fileName?: string
  },
  emit: {
    (e: 'update:modelValue', value: string): void
    (e: 'update:showAi', value: boolean): void
    (e: 'change'): void
    (e: 'save-file', payload: { code: string; lang: string }): void
    (e: 'undo-state-change', canUndo: boolean, canRedo: boolean): void
  }
): MarkdownEditorContext {
  const content = ref(props.modelValue)
  const mdViewMode = ref<MdViewMode>(props.viewMode ?? 'typora')
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
  const { loading: mdAiLoading, actions: mdAiActions, executeAction } = useMdAi(props.fileName ?? '未命名文档')

  const mdAiQuickActions = computed(() =>
    mdAiActions.map((a) => ({
      key: a.key,
      label: a.label,
      prompt: a.prompt(getSelectedOrAllMarkdown(), props.fileName ?? '未命名文档')
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
  watch(
    () => props.modelValue,
    (next) => {
      if (next !== content.value) {
        content.value = next
        resetMdHistory(next)
        if (mdViewMode.value === 'typora') {
          syncTyporaEditorFromMarkdown(next, false)
        }
      }
    }
  )

  // 监听 viewMode 属性变化
  watch(
    () => props.viewMode,
    (newMode) => {
      if (newMode && newMode !== mdViewMode.value) {
        mdViewMode.value = newMode
      }
    }
  )

  watch(
    () => content.value,
    (next) => {
      emit('update:modelValue', next)
      emit('change')
      if (mdViewMode.value === 'typora') {
        if (isSyncingTyporaEditor) return
        if (next === lastTyporaMarkdown) return
        nextTick(() => {
          syncTyporaEditorFromMarkdown(next, true)
        })
      }
    }
  )

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
    const images = files.filter((f) => f.type.startsWith('image/'))
    if (images.length === 0) return
    evt.preventDefault()
    for (const file of images) {
      void insertImageFileToMarkdown(file)
    }
  }

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

  function insertHtmlIntoTypora(html: string) {
    const el = mdTyporaEditorRef.value
    if (!el) return
    el.focus()
    const selection = window.getSelection()
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    const canUseRange = range && el.contains(range.commonAncestorContainer)
    const targetRange = canUseRange
      ? range
      : (() => {
          const r = document.createRange()
          r.selectNodeContents(el)
          r.collapse(false)
          return r
        })()
    const frag = targetRange!.createContextualFragment(html)
    const last = frag.lastChild
    targetRange!.deleteContents()
    targetRange!.insertNode(frag)
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
    const allOrdered = lines.filter((l) => l.trim().length > 0).every((l) => /^\s*\d+\.\s+/.test(l))
    if (allOrdered) {
      const nextLines = lines.map((l) => l.replace(/^\s*\d+\.\s+/, ''))
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
    const meaningful = lines.filter((l) => l.trim().length > 0)
    const allHas = meaningful.length > 0 && meaningful.every((l) => l.startsWith(prefix))
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

  function sendAiRewrite() {
    emit('update:showAi', true)
  }

  function sendAiPolish() {
    emit('update:showAi', true)
  }

  function sendAiExpand() {
    emit('update:showAi', true)
  }

  function sendAiOutline() {
    emit('update:showAi', true)
  }

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
    selectionHandlers = {
      el,
      onKeyDown,
      onKeyUp,
      onMouseUp,
      onFocus,
      onPaste,
      onDrop,
      onDragOver,
      onMouseMove
    }
    syncMarkdownSelection()
  }

  function detachMarkdownSelectionListeners() {
    if (!selectionHandlers) return
    const { el, onKeyDown, onKeyUp, onMouseUp, onFocus, onPaste, onDrop, onDragOver, onMouseMove } =
      selectionHandlers
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
    const imageItems = items.filter((i) => i.type.startsWith('image/'))
    if (imageItems.length === 0) return
    evt.preventDefault()
    for (const item of imageItems) {
      const file = item.getAsFile()
      if (file) void insertImageFileToMarkdown(file)
    }
  }

  function handleMarkdownDrop(evt: DragEvent) {
    const files = evt.dataTransfer?.files ? Array.from(evt.dataTransfer.files) : []
    const images = files.filter((f) => f.type.startsWith('image/'))
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

  function applyMarkdownEdit(
    insertText: string,
    selectRange?: { startOffset: number; endOffset: number }
  ) {
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

  return {
    markdownEditorHostRef,
    markdownPreviewRef,
    markdownImageInputRef,
    mdTyporaEditorRef,
    content,
    mdViewMode,
    markdownSelection,
    showAi: props.showAi ?? false,
    sessionId: props.sessionId ?? '',
    systemContext: props.systemContext ?? '',
    fileName: props.fileName ?? '未命名文档',
    canMdUndo,
    canMdRedo,
    headingOptions,
    viewModeOptions,
    markdownPreviewHtml,
    mdAiLoading,
    mdAiQuickActions,
    floatingAiVisible,
    floatingAiStyle,
    hasTextSelection,
    handleViewModeSelect,
    handleMdUndo,
    handleMdRedo,
    handleHeadingSelect,
    applyMdBold,
    applyMdItalic,
    applyMdStrike,
    applyMdInlineCode,
    applyMdCodeBlock,
    applyMdLink,
    applyMdTable,
    applyMdHeading,
    applyMdQuote,
    applyMdUnorderedList,
    applyMdTaskList,
    applyMdOrderedList,
    pickMarkdownImage,
    sendAiRewrite,
    sendAiPolish,
    sendAiExpand,
    sendAiOutline,
    sendAiSummary,
    handleFloatingAiAction,
    handleAiApply,
    handleEditorDragOver,
    handleEditorDrop,
    handleTyporaEditorInput,
    handleTyporaEditorKeydown,
    handleMarkdownInput,
    handleMarkdownImagePick,
    focusMarkdown
  }
}

export function useMarkdownEditorContext(): MarkdownEditorContext {
  const ctx = inject(MARKDOWN_EDITOR_KEY)
  if (!ctx) {
    throw new Error('useMarkdownEditorContext 必须在 MarkdownEditor 内使用')
  }
  return ctx
}
