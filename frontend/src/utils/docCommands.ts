/**
 * docCommands.ts — 统一封装所有 document.execCommand 调用
 * Nexus Design System 文档编辑器底层命令层
 */

export type FormatType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'subscript'
  | 'superscript'
  | 'heading'
  | 'bullet-list'
  | 'numbered-list'
  | 'task-list'
  | 'quote'
  | 'code'
  | 'code-block'
  | 'link'
  | 'image'
  | 'table'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify'
  | 'font-family'
  | 'font-size'
  | 'font-color'
  | 'highlight-color'
  | 'paste'
  | 'cut'
  | 'copy'
  | 'remove-format'

export interface TableSize {
  rows: number
  cols: number
}

/**
 * 执行格式化命令
 */
export function execFormat(type: FormatType, value?: any): void {
  document.execCommand('styleWithCSS', false, 'true')

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
    case 'heading':
      applyHeading(value as number)
      break
    case 'bullet-list':
      document.execCommand('insertUnorderedList')
      break
    case 'numbered-list':
      document.execCommand('insertOrderedList')
      break
    case 'task-list':
      insertTaskList()
      break
    case 'quote':
      document.execCommand('formatBlock', false, 'blockquote')
      break
    case 'code':
      document.execCommand('formatBlock', false, 'pre')
      break
    case 'code-block':
      insertCodeBlock()
      break
    case 'link':
      insertLink()
      break
    case 'image':
      insertImage()
      break
    case 'table':
      // table 需要外部调用 insertTableHtml
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
    case 'align-justify':
      document.execCommand('justifyFull')
      break
    case 'font-family':
      document.execCommand('fontName', false, value)
      break
    case 'font-size':
      document.execCommand('fontSize', false, '7')
      // execCommand fontSize 只能用 1-7，需要额外用 span 包裹来实现精确字号
      wrapSelectionWithStyle('fontSize', value + 'px')
      break
    case 'font-color':
      document.execCommand('foreColor', false, value)
      break
    case 'highlight-color':
      document.execCommand('hiliteColor', false, value)
      break
    case 'remove-format':
      document.execCommand('removeFormat')
      break
    case 'paste':
      // 由浏览器默认行为或 Clipboard API 处理
      break
    case 'cut':
      document.execCommand('cut')
      break
    case 'copy':
      document.execCommand('copy')
      break
  }
}

/**
 * 应用标题层级
 */
export function applyHeading(level: number): void {
  const tag = `h${level}`
  document.execCommand('formatBlock', false, tag)
}

/**
 * 插入链接
 */
export function insertLink(url?: string): void {
  const href = url ?? prompt('请输入链接地址:', 'https://')
  if (href) {
    document.execCommand('createLink', false, href)
  }
}

/**
 * 插入图片
 */
export function insertImage(src?: string): void {
  const url = src ?? prompt('请输入图片地址:', 'https://')
  if (url) {
    document.execCommand('insertImage', false, url)
  }
}

/**
 * 生成表格 HTML
 */
export function buildTableHtml(size: TableSize): string {
  let html = '<table style="width:100%; border-collapse: collapse;">'
  for (let i = 0; i < size.rows; i++) {
    html += '<tr>'
    for (let j = 0; j < size.cols; j++) {
      const tag = i === 0 ? 'th' : 'td'
      html += `<${tag} style="border: 1px solid #ccc; padding: 8px;">单元格</${tag}>`
    }
    html += '</tr>'
  }
  html += '</table><p><br></p>'
  return html
}

/**
 * 插入任务列表（模拟实现）
 */
function insertTaskList(): void {
  const ul = document.createElement('ul')
  ul.style.listStyle = 'none'
  ul.style.paddingLeft = '0'
  const li = document.createElement('li')
  li.innerHTML = '<input type="checkbox" style="margin-right:8px;" />任务项'
  ul.appendChild(li)
  insertElement(ul)
}

/**
 * 插入代码块
 */
function insertCodeBlock(): void {
  const pre = document.createElement('pre')
  pre.style.background = '#f9fafb'
  pre.style.padding = '12px'
  pre.style.borderRadius = '8px'
  pre.style.overflow = 'auto'
  pre.style.fontSize = '12px'
  pre.style.fontFamily = 'var(--nexus-font-mono)'
  const code = document.createElement('code')
  code.textContent = '// 在此输入代码'
  pre.appendChild(code)
  insertElement(pre)
}

/**
 * 将选区内容用指定样式包裹
 */
function wrapSelectionWithStyle(cssProp: string, cssValue: string): void {
  const selection = window.getSelection()
  if (!selection || !selection.rangeCount) return

  const range = selection.getRangeAt(0)
  const extracted = range.extractContents()
  const span = document.createElement('span')
  ;(span.style as any)[cssProp] = cssValue
  span.appendChild(extracted)
  range.insertNode(span)
  selection.removeAllRanges()
}

/**
 * 在选区插入元素
 */
function insertElement(el: HTMLElement): void {
  const selection = window.getSelection()
  if (!selection || !selection.rangeCount) return
  const range = selection.getRangeAt(0)
  range.deleteContents()
  range.insertNode(el)
  range.collapse(false)
}

/**
 * 插入 HTML 字符串到选区
 */
export function insertHtml(html: string): void {
  const selection = window.getSelection()
  if (!selection || !selection.rangeCount) return

  const range = selection.getRangeAt(0)
  range.deleteContents()
  const fragment = range.createContextualFragment(html)
  range.insertNode(fragment)
  range.collapse(false)
}

/**
 * 查询当前选区的格式状态
 */
export function queryFormatState(): {
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrikethrough: boolean
  isSubscript: boolean
  isSuperscript: boolean
  isOrderedList: boolean
  isUnorderedList: boolean
  blockTag: string
  align: string
  fontName: string
  fontSize: string
  foreColor: string
  hiliteColor: string
} {
  return {
    isBold: queryCommandState('bold'),
    isItalic: queryCommandState('italic'),
    isUnderline: queryCommandState('underline'),
    isStrikethrough: queryCommandState('strikeThrough'),
    isSubscript: queryCommandState('subscript'),
    isSuperscript: queryCommandState('superscript'),
    isOrderedList: queryCommandState('insertOrderedList'),
    isUnorderedList: queryCommandState('insertUnorderedList'),
    blockTag: queryCommandValue('formatBlock') || 'p',
    align: queryCommandValue('justifyLeft')
      ? 'left'
      : queryCommandValue('justifyCenter')
        ? 'center'
        : queryCommandValue('justifyRight')
          ? 'right'
          : queryCommandValue('justifyFull')
            ? 'justify'
            : 'left',
    fontName: queryCommandValue('fontName') || 'Microsoft YaHei',
    fontSize: queryCommandValue('fontSize') || '3',
    foreColor: rgbToHex(queryCommandValue('foreColor') || '#000000'),
    hiliteColor: rgbToHex(queryCommandValue('hiliteColor') || '#ffffff'),
  }
}

function queryCommandState(command: string): boolean {
  try {
    return document.queryCommandState(command)
  } catch {
    return false
  }
}

function queryCommandValue(command: string): string {
  try {
    return document.queryCommandValue(command)
  } catch {
    return ''
  }
}

/**
 * RGB / RGBA 转 Hex
 */
function rgbToHex(color: string): string {
  if (color.startsWith('#')) return color
  const rgb = color.match(/\d+/g)
  if (!rgb || rgb.length < 3) return '#000000'
  const toHex = (n: string | undefined) => parseInt(n || '0').toString(16).padStart(2, '0')
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`
}

/**
 * 获取选中的纯文本
 */
export function getSelectedText(): string {
  const selection = window.getSelection()
  return selection ? selection.toString() : ''
}

/**
 * 获取选中的 HTML
 */
export function getSelectedHtml(): string {
  const selection = window.getSelection()
  if (!selection || !selection.rangeCount) return ''
  const range = selection.getRangeAt(0)
  const div = document.createElement('div')
  div.appendChild(range.cloneContents())
  return div.innerHTML
}
