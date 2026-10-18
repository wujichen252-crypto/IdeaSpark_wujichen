// 纯函数助手：Markdown <-> HTML 渲染、Typora DOM 转换、caret 工具、URL 安全化。
// 从 MarkdownEditor.vue 抽离，无任何 Vue 响应式依赖；仅使用浏览器 DOM 全局类型。

export function convertTyporaHtmlToMarkdown(html: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html || '', 'text/html')
  const md = convertTyporaNodesToMarkdown(doc.body.childNodes).trimEnd()
  const normalized = md.replace(/\n{3,}/g, '\n\n').trimEnd()
  return normalized.length > 0 ? normalized + '\n' : ''
}

export function convertTyporaNodesToMarkdown(nodes: NodeListOf<ChildNode> | ChildNode[], listIndent = ''): string {
  const arr = Array.isArray(nodes) ? nodes : Array.from(nodes)
  const blocks: string[] = []
  for (const node of arr) {
    const block = convertTyporaBlockToMarkdown(node, listIndent).trimEnd()
    if (block.length === 0) continue
    blocks.push(block)
  }
  return blocks.join('\n\n')
}

export function convertTyporaBlockToMarkdown(node: ChildNode, listIndent: string): string {
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

export function convertTyporaListToMarkdown(listEl: HTMLElement, listIndent: string) {
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

export function getTyporaListItemBody(li: HTMLLIElement) {
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

export function convertTyporaTableToMarkdown(table: HTMLTableElement) {
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

export function escapeTableCellMd(text: string) {
  return (text || '').replace(/\r\n/g, '\n').replace(/\n+/g, '<br>').replace(/\|/g, '\\|')
}

export function wrapInlineCodeMd(codeText: string) {
  const text = (codeText || '').replace(/\r\n/g, '\n').replace(/\n+/g, ' ')
  const runs = Array.from(text.matchAll(/`+/g)).map(m => m[0].length)
  const fenceLen = Math.max(1, ...runs) + 1
  const fence = '`'.repeat(fenceLen)
  const needPadding = text.startsWith('`') || text.endsWith('`') || text.startsWith(' ') || text.endsWith(' ')
  return needPadding ? `${fence} ${text} ${fence}` : `${fence}${text}${fence}`
}

export function extractTyporaTaskState(li: HTMLLIElement): boolean | null {
  const inputs = Array.from(li.querySelectorAll('input'))
  const checkbox = inputs.find(i => (i.getAttribute('type') || '').toLowerCase() === 'checkbox') as HTMLInputElement | undefined
  if (!checkbox) return null
  return checkbox.checked
}

export function convertTyporaInlineToMarkdown(node: Node, options?: { stripCheckboxInputs?: boolean }): string {
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

export function convertTyporaChildrenInline(el: HTMLElement, options?: { stripCheckboxInputs?: boolean }) {
  const parts = Array.from(el.childNodes).map(n => convertTyporaInlineToMarkdown(n, options))
  return parts.join('')
}

export function getCaretCharacterOffsetWithin(el: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return 0
  const range = selection.getRangeAt(0)
  if (!el.contains(range.startContainer)) return 0
  const preRange = range.cloneRange()
  preRange.selectNodeContents(el)
  preRange.setEnd(range.startContainer, range.startOffset)
  return preRange.toString().length
}

export function setCaretCharacterOffsetWithin(el: HTMLElement, offset: number) {
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

export function renderMarkdownPreview(md: string) {
  return renderMarkdownHtml(md, { forTypora: false })
}

export function renderMarkdownForTyporaEditor(md: string) {
  return renderMarkdownHtml(md, { forTypora: true })
}

export function renderMarkdownHtml(md: string, options: { forTypora: boolean }) {
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

export function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function inlineMdToHtml(text: string) {
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

export function isTableHeaderRow(line: string) {
  const t = (line || '').trim()
  return t.includes('|') && !t.startsWith('```')
}

export function isTableSepRow(line: string) {
  const t = (line || '').trim()
  if (!t.includes('|')) return false
  const normalized = t.replace(/^\|/, '').replace(/\|$/, '')
  const cells = normalized.split('|').map(s => s.trim())
  if (cells.length < 2) return false
  return cells.every(c => /^:?-{3,}:?$/.test(c))
}

export function isTableBodyRow(line: string) {
  const t = (line || '').trim()
  if (!t) return false
  if (!t.includes('|')) return false
  return true
}

export function parseTableRow(line: string) {
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

export function sanitizeUrl(url: string) {
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
