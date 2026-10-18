import { describe, it, expect } from 'vitest'
import {
  parseCommaList,
  formatSize,
  fileTypeLabel,
  detectFileTypeByExt,
  stripExtFromTitle,
} from '../workspaceHelpers'

describe('parseCommaList', () => {
  it('按中英文逗号切分并去重、去空白', () => {
    expect(parseCommaList('a, b，c, a')).toEqual(['a', 'b', 'c'])
  })
  it('空字符串返回空数组', () => {
    expect(parseCommaList('')).toEqual([])
    expect(parseCommaList('   ')).toEqual([])
  })
  it('纯空白项被过滤', () => {
    expect(parseCommaList('x, , y')).toEqual(['x', 'y'])
  })
})

describe('formatSize', () => {
  it('小于 1KB 显示 B', () => {
    expect(formatSize(0)).toBe('0 B')
    expect(formatSize(500)).toBe('500 B')
  })
  it('KB 区间保留一位小数', () => {
    expect(formatSize(1024)).toBe('1.0 KB')
    expect(formatSize(1536)).toBe('1.5 KB')
  })
  it('MB / GB 区间', () => {
    expect(formatSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatSize(1024 * 1024 * 1024)).toBe('1.0 GB')
  })
})

describe('fileTypeLabel', () => {
  it('映射核心类型', () => {
    expect(fileTypeLabel('document')).toBe('文档')
    expect(fileTypeLabel('sheet')).toBe('表格')
    expect(fileTypeLabel('slide')).toBe('演示')
    expect(fileTypeLabel('image')).toBe('图片')
    expect(fileTypeLabel('whiteboard')).toBe('白板')
    expect(fileTypeLabel('mindmap')).toBe('思维导图')
    expect(fileTypeLabel('flow')).toBe('流程图')
    expect(fileTypeLabel('other')).toBe('其他')
  })
})

describe('detectFileTypeByExt', () => {
  it('文档扩展名', () => {
    expect(detectFileTypeByExt('md')).toBe('document')
    expect(detectFileTypeByExt('docx')).toBe('document')
    expect(detectFileTypeByExt('txt')).toBe('document')
  })
  it('表格 / 演示 / 图片扩展名（大小写不敏感）', () => {
    expect(detectFileTypeByExt('xlsx')).toBe('sheet')
    expect(detectFileTypeByExt('PPTX')).toBe('slide')
    expect(detectFileTypeByExt('PNG')).toBe('image')
    expect(detectFileTypeByExt('svg')).toBe('image')
  })
  it('未知扩展名回退 other', () => {
    expect(detectFileTypeByExt('xyz')).toBe('other')
    expect(detectFileTypeByExt('')).toBe('other')
  })
})

describe('stripExtFromTitle', () => {
  it('移除末尾扩展名', () => {
    expect(stripExtFromTitle('report.pdf')).toBe('report')
    expect(stripExtFromTitle('a.b.c.txt')).toBe('a.b.c')
  })
  it('无扩展名或点号在首位时不处理', () => {
    expect(stripExtFromTitle('noext')).toBe('noext')
    expect(stripExtFromTitle('.gitignore')).toBe('.gitignore')
  })
})
