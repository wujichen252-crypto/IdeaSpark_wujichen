import { describe, it, expect } from 'vitest'
import {
  escapeHtml,
  sanitizeUrl,
  inlineMdToHtml,
  isTableHeaderRow,
  isTableSepRow,
  isTableBodyRow,
  parseTableRow,
} from '../markdownEditorHelpers'

describe('escapeHtml', () => {
  it('转义所有 HTML 敏感字符', () => {
    expect(escapeHtml(`<div>&"'</div>`)).toBe('&lt;div&gt;&amp;&quot;&#39;&lt;/div&gt;')
  })
  it('空字符串返回空', () => {
    expect(escapeHtml('')).toBe('')
  })
  it('纯文本原样返回', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
})

describe('sanitizeUrl（安全关键）', () => {
  it('拦截 javascript: 协议（含大小写变体）', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('')
  })
  it('允许 http/https', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
    expect(sanitizeUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1')
  })
  it('允许 data:image/', () => {
    expect(sanitizeUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA')
  })
  it('拦截非图片 data: 协议', () => {
    expect(sanitizeUrl('data:text/html,<script>')).toBe('')
  })
  it('允许 blob:', () => {
    expect(sanitizeUrl('blob:https://example.com/uuid')).toBe('blob:https://example.com/uuid')
  })
  it('允许绝对路径与相对路径', () => {
    expect(sanitizeUrl('/assets/a.png')).toBe('/assets/a.png')
    expect(sanitizeUrl('./a.png')).toBe('./a.png')
    expect(sanitizeUrl('../a.png')).toBe('../a.png')
  })
  it('空或纯空白返回空', () => {
    expect(sanitizeUrl('')).toBe('')
    expect(sanitizeUrl('   ')).toBe('')
  })
  it('拦截未白名单协议（ftp/mailto/相对无斜杠）', () => {
    expect(sanitizeUrl('ftp://x')).toBe('')
    expect(sanitizeUrl('mailto:a@b.com')).toBe('')
    expect(sanitizeUrl('foo.png')).toBe('')
  })
})

describe('inlineMdToHtml', () => {
  it('加粗', () => {
    expect(inlineMdToHtml('**hi**')).toBe('<strong>hi</strong>')
  })
  it('斜体', () => {
    expect(inlineMdToHtml('*hi*')).toBe('<em>hi</em>')
  })
  it('行内代码', () => {
    expect(inlineMdToHtml('`x`')).toBe('<code>x</code>')
  })
  it('删除线', () => {
    expect(inlineMdToHtml('~~x~~')).toBe('<del>x</del>')
  })
  it('安全链接', () => {
    expect(inlineMdToHtml('[a](https://e.com)')).toBe(
      '<a class="md-link" href="https://e.com" target="_blank" rel="noopener noreferrer">a</a>',
    )
  })
  it('危险链接协议被剥离，仅保留转义后的文本', () => {
    const r = inlineMdToHtml('[click](javascript:alert(1))')
    expect(r).not.toContain('href')
    expect(r).toContain('click')
    expect(r).not.toContain('javascript')
  })
  it('安全图片', () => {
    expect(inlineMdToHtml('![alt](https://e.com/i.png)')).toBe(
      '<img class="md-image" src="https://e.com/i.png" alt="alt" />',
    )
  })
  it('危险图片 src 被剥离', () => {
    expect(inlineMdToHtml('![alt](javascript:evil)')).toBe('')
  })
  it('HTML 注入文本被转义', () => {
    expect(inlineMdToHtml('<script>')).toBe('&lt;script&gt;')
  })
})

describe('Markdown 表格解析', () => {
  it('isTableHeaderRow：含管道且非代码围栏', () => {
    expect(isTableHeaderRow('a | b')).toBe(true)
    expect(isTableHeaderRow('no pipe')).toBe(false)
    expect(isTableHeaderRow('```code```')).toBe(false)
  })
  it('isTableSepRow：识别分隔行（含对齐冒号，至少两列，连字符需 ≥3）', () => {
    expect(isTableSepRow('| --- | --- |')).toBe(true)
    expect(isTableSepRow('| :--- | ---: |')).toBe(true)
    expect(isTableSepRow('| :---: | --- |')).toBe(true)
    // 实现要求至少 3 个连字符，单横对齐写法不算分隔行
    expect(isTableSepRow('| :- | -: |')).toBe(false)
    expect(isTableSepRow('| a | b |')).toBe(false)
    expect(isTableSepRow('| --- |')).toBe(false)
    expect(isTableSepRow('no pipe')).toBe(false)
  })
  it('isTableBodyRow：非空且含管道', () => {
    expect(isTableBodyRow('| x | y |')).toBe(true)
    expect(isTableBodyRow('')).toBe(false)
    expect(isTableBodyRow('no pipe')).toBe(false)
  })
  it('parseTableRow：剥离首尾管道并切分', () => {
    expect(parseTableRow('| a | b | c |')).toEqual(['a', 'b', 'c'])
    expect(parseTableRow('a | b')).toEqual(['a', 'b'])
  })
  it('parseTableRow：支持转义竖线', () => {
    expect(parseTableRow('| a \\| b | c |')).toEqual(['a | b', 'c'])
  })
})
