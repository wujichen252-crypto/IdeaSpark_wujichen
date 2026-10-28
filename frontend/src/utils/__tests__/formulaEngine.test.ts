/**
 * 表格公式引擎单元测试
 * @description 覆盖单元格坐标解析/换算、区域展开与基础表达式求值，
 *              重点验证非法输入的错误码而非静默失败
 */
import { describe, it, expect } from 'vitest'
import {
  FormulaError,
  parseCellRef,
  getCellRef,
  getRangeCells,
  getRangeValues,
  evaluateFormula,
  getFormulaDependencies
} from '../formulaEngine'

/**
 * 构造内存单元格读取器
 * @param cells - 单元格值与引用映射
 */
function createReader(cells: Record<string, string | number | boolean>) {
  return (ref: string): string | number | boolean => cells[ref] ?? ''
}

describe('parseCellRef', () => {
  it('解析单字母列引用', () => {
    expect(parseCellRef('A1')).toEqual({ col: 0, row: 1 })
  })

  it('解析双字母列引用（26 进制）', () => {
    expect(parseCellRef('AA1')).toEqual({ col: 26, row: 1 })
    expect(parseCellRef('AZ2')).toEqual({ col: 51, row: 2 })
  })

  it('兼容小写输入', () => {
    expect(parseCellRef('b3')).toEqual({ col: 1, row: 3 })
  })

  it('非法引用抛出 #REF! 错误', () => {
    for (const invalid of ['', 'A', '1', 'A1:B2', 'A-1', '1A']) {
      expect(() => parseCellRef(invalid)).toThrow(FormulaError)
      try {
        parseCellRef(invalid)
      } catch (err) {
        expect((err as FormulaError).code).toBe('#REF!')
      }
    }
  })
})

describe('getCellRef', () => {
  it('生成 A-Z 列引用', () => {
    expect(getCellRef(0, 1)).toBe('A1')
    expect(getCellRef(25, 3)).toBe('Z3')
  })

  it('生成进位后的多字母列引用', () => {
    expect(getCellRef(26, 1)).toBe('AA1')
    expect(getCellRef(51, 1)).toBe('AZ1')
    expect(getCellRef(701, 1)).toBe('ZZ1')
    expect(getCellRef(702, 1)).toBe('AAA1')
  })

  it('与 parseCellRef 互为逆运算', () => {
    for (const col of [0, 1, 25, 26, 27, 51, 52, 701, 702, 5000]) {
      expect(parseCellRef(getCellRef(col, 7)).col).toBe(col)
    }
  })
})

describe('getRangeCells', () => {
  it('按行优先顺序展开区域', () => {
    expect(getRangeCells('A1', 'B2')).toEqual(['A1', 'B1', 'A2', 'B2'])
  })

  it('反序区域同样返回正序结果', () => {
    expect(getRangeCells('B2', 'A1')).toEqual(['A1', 'B1', 'A2', 'B2'])
  })

  it('单格区域只返回自身', () => {
    expect(getRangeCells('C3', 'C3')).toEqual(['C3'])
  })
})

describe('getRangeValues', () => {
  it('返回二维值数组并对缺失单元格回退空串', () => {
    const reader = createReader({ A1: 1, B1: 2, A2: 'x' })
    expect(getRangeValues('A1', 'B2', reader)).toEqual([[1, 2], ['x', '']])
  })
})

describe('evaluateFormula', () => {
  const reader = createReader({ A1: 1, B1: 2, C1: 3 })

  it('按优先级计算四则运算', () => {
    expect(evaluateFormula('=1+2*3', reader)).toBe(7)
    expect(evaluateFormula('=(1+2)*3', reader)).toBe(9)
    expect(evaluateFormula('2^3', reader)).toBe(8)
  })

  it('支持单元格引用', () => {
    expect(evaluateFormula('=A1+B1*C1', reader)).toBe(7)
  })

  it('除零返回 #DIV/0!', () => {
    expect(evaluateFormula('=1/0', reader)).toBe('#DIV/0!')
  })

  it('未知标识符返回 #NAME?', () => {
    expect(evaluateFormula('=FOO', reader)).toBe('#NAME?')
  })

  it('语法错误返回 #VALUE!', () => {
    expect(evaluateFormula('=1+', reader)).toBe('#VALUE!')
  })
})

describe('getFormulaDependencies', () => {
  it('收集单元格与区域依赖', () => {
    expect(getFormulaDependencies('=A1+B2')).toEqual(['A1', 'B2'])
    expect(getFormulaDependencies('=SUM(A1:B2)')).toEqual(['A1', 'B1', 'A2', 'B2'])
  })

  it('无依赖或非法公式返回空数组', () => {
    expect(getFormulaDependencies('=1+2')).toEqual([])
    expect(getFormulaDependencies('=1+')).toEqual([])
  })
})
