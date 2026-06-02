export interface CellPosition {
  col: number
  row: number
}

export class FormulaError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
    this.name = 'FormulaError'
  }
}

export function parseCellRef(ref: string): CellPosition {
  const match = ref.match(/^([A-Za-z]+)(\d+)$/)
  if (!match || !match[1] || !match[2]) {
    throw new FormulaError('#REF!')
  }
  const letters = match[1].toUpperCase()
  let col = 0
  for (let i = 0; i < letters.length; i++) {
    const charCode = letters.charCodeAt(i)
    if (charCode) {
      col = col * 26 + (charCode - 64)
    }
  }
  return { col: col - 1, row: parseInt(match[2], 10) || 0 }
}

export function getCellRef(col: number, row: number): string {
  let result = ''
  let n = col + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    result = String.fromCharCode(65 + rem) + result
    n = Math.floor((n - 1) / 26)
  }
  return result + row
}

export function getRangeCells(start: string, end: string): string[] {
  const s = parseCellRef(start)
  const endPos = parseCellRef(end)
  const minCol = Math.min(s.col, endPos.col)
  const maxCol = Math.max(s.col, endPos.col)
  const minRow = Math.min(s.row, endPos.row)
  const maxRow = Math.max(s.row, endPos.row)
  const cells: string[] = []
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      cells.push(getCellRef(c, r))
    }
  }
  return cells
}

export function getRangeValues(
  start: string,
  end: string,
  getCellValue: (ref: string) => any
): any[][] {
  const s = parseCellRef(start)
  const endPos = parseCellRef(end)
  const minCol = Math.min(s.col, endPos.col)
  const maxCol = Math.max(s.col, endPos.col)
  const minRow = Math.min(s.row, endPos.row)
  const maxRow = Math.max(s.row, endPos.row)
  const rows: any[][] = []
  for (let r = minRow; r <= maxRow; r++) {
    const cols: any[] = []
    for (let c = minCol; c <= maxCol; c++) {
      cols.push(getCellValue(getCellRef(c, r)))
    }
    rows.push(cols)
  }
  return rows
}

/* ─── Lexer ─── */

type Token =
  | { type: 'NUMBER'; value: number }
  | { type: 'STRING'; value: string }
  | { type: 'CELL'; ref: string }
  | { type: 'RANGE'; start: string; end: string }
  | { type: 'FUNC'; name: string }
  | { type: 'OP'; op: string }
  | { type: 'LPAREN' }
  | { type: 'RPAREN' }
  | { type: 'COMMA' }
  | { type: 'EOF' }

function tokenize(formula: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const s = formula.trim()

  /**
   * 安全获取字符串指定位置的字符
   * @param str - 源字符串
   * @param index - 字符索引
   * @returns 指定位置的字符，如果越界则返回空字符串
   */
  function safeChar(str: string, index: number): string {
    return index < str.length ? str[index]! : ''
  }

  while (i < s.length) {
    const ch = safeChar(s, i)

    if (/\s/.test(ch)) {
      i++
      continue
    }

    if (/\d/.test(ch) || (ch === '.' && /\d/.test(safeChar(s, i + 1)))) {
      let num = ''
      while (i < s.length && /[\d.]/.test(safeChar(s, i))) {
        num += safeChar(s, i)
        i++
      }
      const value = parseFloat(num)
      if (Number.isNaN(value)) throw new FormulaError('#VALUE!')
      tokens.push({ type: 'NUMBER', value })
      continue
    }

    if (ch === '"') {
      let str = ''
      i++
      while (i < s.length && safeChar(s, i) !== '"') {
        str += safeChar(s, i)
        i++
      }
      if (i >= s.length) throw new FormulaError('#VALUE!')
      i++ // skip closing quote
      tokens.push({ type: 'STRING', value: str })
      continue
    }

    if (/[A-Za-z]/.test(ch)) {
      let ident = ''
      while (i < s.length && /[A-Za-z0-9_]/.test(safeChar(s, i))) {
        ident += safeChar(s, i)
        i++
      }
      const upper = ident.toUpperCase()

      // Peek ahead for function call
      let j = i
      while (j < s.length && /\s/.test(safeChar(s, j))) j++
      if (j < s.length && safeChar(s, j) === '(') {
        tokens.push({ type: 'FUNC', name: upper })
        continue
      }

      // Cell reference or range
      const cellMatch = ident.match(/^([A-Za-z]+)(\d+)$/)
      if (cellMatch) {
        // Check for range operator A1:B2
        let k = i
        while (k < s.length && /\s/.test(safeChar(s, k))) k++
        if (k < s.length && safeChar(s, k) === ':') {
          k++
          while (k < s.length && /\s/.test(safeChar(s, k))) k++
          let endIdent = ''
          while (k < s.length && /[A-Za-z0-9]/.test(safeChar(s, k))) {
            endIdent += safeChar(s, k)
            k++
          }
          const endMatch = endIdent.match(/^([A-Za-z]+)(\d+)$/)
          if (endMatch) {
            tokens.push({ type: 'RANGE', start: upper, end: endIdent.toUpperCase() })
            i = k
            continue
          }
        }
        tokens.push({ type: 'CELL', ref: upper })
        continue
      }

      // Unknown identifier
      throw new FormulaError('#NAME?')
    }

    // Multi-char operators
    if (i + 1 < s.length) {
      const two = s.slice(i, i + 2)
      if (['<=', '>=', '<>', '=='].includes(two)) {
        tokens.push({ type: 'OP', op: two })
        i += 2
        continue
      }
    }

    // Single char operators / punctuation
    if (ch === '+') { tokens.push({ type: 'OP', op: ch }); i++; continue }
    if (ch === '-') { tokens.push({ type: 'OP', op: ch }); i++; continue }
    if (ch === '*') { tokens.push({ type: 'OP', op: ch }); i++; continue }
    if (ch === '/') { tokens.push({ type: 'OP', op: ch }); i++; continue }
    if (ch === '^') { tokens.push({ type: 'OP', op: ch }); i++; continue }
    if (ch === '&') { tokens.push({ type: 'OP', op: ch }); i++; continue }
    if (ch === '=') { tokens.push({ type: 'OP', op: ch }); i++; continue }
    if (ch === '<') { tokens.push({ type: 'OP', op: ch }); i++; continue }
    if (ch === '>') { tokens.push({ type: 'OP', op: ch }); i++; continue }
    if (ch === '(') { tokens.push({ type: 'LPAREN' }); i++; continue }
    if (ch === ')') { tokens.push({ type: 'RPAREN' }); i++; continue }
    if (ch === ',') { tokens.push({ type: 'COMMA' }); i++; continue }

    // Unexpected character
    throw new FormulaError('#VALUE!')
  }

  tokens.push({ type: 'EOF' })
  return tokens
}

/* ─── Helpers ─── */

function toNumber(v: any): number {
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'string') {
    if (v.startsWith('#')) return Number.NaN
    const n = Number(v)
    if (!Number.isNaN(n) && v.trim() !== '') return n
  }
  return Number.NaN
}

function toBoolean(v: any): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') {
    if (v.toLowerCase() === 'true') return true
    if (v.toLowerCase() === 'false') return false
    const n = Number(v)
    if (!Number.isNaN(n) && v.trim() !== '') return n !== 0
  }
  return false
}

function isError(v: any): boolean {
  return typeof v === 'string' && v.startsWith('#')
}

function assertNotError(v: any): any {
  if (isError(v)) throw new FormulaError(v)
  return v
}

function flattenArgs(args: any[]): any[] {
  return args.flatMap((arg) => {
    if (Array.isArray(arg)) {
      if (arg.length > 0 && Array.isArray(arg[0])) return arg.flat()
      return arg
    }
    return [arg]
  })
}

/* ─── Type Guards ─── */

function isOpToken(token: Token): token is { type: 'OP'; op: string } {
  return token.type === 'OP'
}

function isFuncToken(token: Token): token is { type: 'FUNC'; name: string } {
  return token.type === 'FUNC'
}

/* ─── Evaluator ─── */

class Evaluator {
  private tokens: Token[]
  private pos = 0
  private getCellValue: (ref: string) => any
  private visited: Set<string>

  constructor(
    tokens: Token[],
    getCellValue: (ref: string) => any,
    visited: Set<string>
  ) {
    this.tokens = tokens
    this.getCellValue = getCellValue
    this.visited = visited
  }

  private current(): Token {
    const token = this.tokens[this.pos]
    if (!token) {
      throw new FormulaError('#VALUE!')
    }
    return token
  }

  private advance(): Token {
    const token = this.tokens[this.pos++]
    if (!token) {
      throw new FormulaError('#VALUE!')
    }
    return token
  }

  private expect(type: Token['type'], op?: string): Token {
    const tok = this.current()
    if (tok.type !== type) {
      throw new FormulaError('#VALUE!')
    }
    if (op && isOpToken(tok) && tok.op !== op) {
      throw new FormulaError('#VALUE!')
    }
    this.pos++
    return tok
  }

  parse(): any {
    const result = this.expression()
    if (this.current().type !== 'EOF') {
      throw new FormulaError('#VALUE!')
    }
    return result
  }

  /* Grammar (lowest to highest precedence):
     expression -> comparison
     comparison -> concat ( ( = | <> | < | > | <= | >= ) concat )?
     concat     -> term ( & term )*
     term       -> factor ( ( + | - ) factor )*
     factor     -> power ( ( * | / ) power )*
     power      -> unary ( ^ unary )*
     unary      -> ( + | - ) unary | primary
     primary    -> NUMBER | STRING | CELL | RANGE | FUNC call | ( expression )
  */

  private expression(): any {
    return this.comparison()
  }

  private comparison(): any {
    let left = this.concat()
    while (true) {
      const curr = this.current()
      if (!isOpToken(curr)) break
      if (!['=', '<>', '<', '>', '<=', '>='].includes(curr.op)) break
      const op = (this.advance() as { type: 'OP'; op: string }).op
      const right = this.concat()
      left = this.compare(left, op, right)
    }
    return left
  }

  private compare(left: any, op: string, right: any): boolean {
    const l = assertNotError(left)
    const r = assertNotError(right)

    if (typeof l === 'number' && typeof r === 'number') {
      switch (op) {
        case '=':
          return Math.abs(l - r) < 1e-9
        case '<>':
          return Math.abs(l - r) >= 1e-9
        case '<':
          return l < r
        case '>':
          return l > r
        case '<=':
          return l <= r
        case '>=':
          return l >= r
      }
    }

    const ls = String(l)
    const rs = String(r)
    switch (op) {
      case '=':
        return ls === rs
      case '<>':
        return ls !== rs
      case '<':
        return ls < rs
      case '>':
        return ls > rs
      case '<=':
        return ls <= rs
      case '>=':
        return ls >= rs
    }
    return false
  }

  private concat(): any {
    let left = this.term()
    while (true) {
      const curr = this.current()
      if (!isOpToken(curr) || curr.op !== '&') break
      this.advance()
      const right = this.term()
      left = String(assertNotError(left)) + String(assertNotError(right))
    }
    return left
  }

  private term(): any {
    let left = this.factor()
    while (true) {
      const curr = this.current()
      if (!isOpToken(curr) || (curr.op !== '+' && curr.op !== '-')) break
      const op = (this.advance() as { type: 'OP'; op: string }).op
      const right = this.factor()
      left = this.arith(left, op, right)
    }
    return left
  }

  private factor(): any {
    let left = this.power()
    while (true) {
      const curr = this.current()
      if (!isOpToken(curr) || (curr.op !== '*' && curr.op !== '/')) break
      const op = (this.advance() as { type: 'OP'; op: string }).op
      const right = this.power()
      left = this.arith(left, op, right)
    }
    return left
  }

  private power(): any {
    let left = this.unary()
    while (true) {
      const curr = this.current()
      if (!isOpToken(curr) || curr.op !== '^') break
      this.advance()
      const right = this.unary()
      left = Math.pow(toNumber(assertNotError(left)), toNumber(assertNotError(right)))
    }
    return left
  }

  private unary(): any {
    while (true) {
      const curr = this.current()
      if (!isOpToken(curr) || (curr.op !== '+' && curr.op !== '-')) break
      const op = (this.advance() as { type: 'OP'; op: string }).op
      const val = this.unary()
      return op === '-' ? -toNumber(assertNotError(val)) : toNumber(assertNotError(val))
    }
    return this.primary()
  }

  private primary(): any {
    const tok = this.current()

    if (tok.type === 'NUMBER') {
      this.advance()
      return tok.value
    }

    if (tok.type === 'STRING') {
      this.advance()
      return tok.value
    }

    if (tok.type === 'CELL') {
      this.advance()
      if (this.visited.has(tok.ref)) {
        throw new FormulaError('#REF!')
      }
      this.visited.add(tok.ref)
      const val = this.getCellValue(tok.ref)
      this.visited.delete(tok.ref)
      return val
    }

    if (tok.type === 'RANGE') {
      this.advance()
      const rows = getRangeValues(tok.start, tok.end, (ref) => {
        if (this.visited.has(ref)) {
          throw new FormulaError('#REF!')
        }
        this.visited.add(ref)
        const val = this.getCellValue(ref)
        this.visited.delete(ref)
        return val
      })
      return rows
    }

    if (tok.type === 'FUNC') {
      return this.parseFunction()
    }

    if (tok.type === 'LPAREN') {
      this.advance()
      const val = this.expression()
      this.expect('OP', ')')
      return val
    }

    throw new FormulaError('#VALUE!')
  }

  private parseFunction(): any {
    const tok = this.current()
    if (!isFuncToken(tok)) {
      throw new FormulaError('#VALUE!')
    }
    const name = tok.name
    this.advance()
    this.expect('LPAREN')
    const args: any[] = []
    if (this.current().type !== 'RPAREN') {
      args.push(this.expression())
      while (this.current().type === 'COMMA') {
        this.advance()
        args.push(this.expression())
      }
    }
    this.expect('RPAREN')
    return this.callFunction(name, args)
  }

  private callFunction(name: string, args: any[]): any {
    switch (name) {
      case 'SUM':
        return flattenArgs(args)
          .map((v) => toNumber(assertNotError(v)))
          .filter((v) => !Number.isNaN(v))
          .reduce((a, b) => a + b, 0)

      case 'AVERAGE': {
        const vals = flattenArgs(args)
          .map((v) => toNumber(assertNotError(v)))
          .filter((v) => !Number.isNaN(v))
        if (vals.length === 0) return '#DIV/0!'
        return vals.reduce((a, b) => a + b, 0) / vals.length
      }

      case 'COUNT': {
        return flattenArgs(args).filter((v) => {
          if (isError(v)) return false
          const n = toNumber(v)
          return !Number.isNaN(n)
        }).length
      }

      case 'MAX': {
        const vals = flattenArgs(args)
          .map((v) => toNumber(assertNotError(v)))
          .filter((v) => !Number.isNaN(v))
        if (vals.length === 0) return 0
        return Math.max(...vals)
      }

      case 'MIN': {
        const vals = flattenArgs(args)
          .map((v) => toNumber(assertNotError(v)))
          .filter((v) => !Number.isNaN(v))
        if (vals.length === 0) return 0
        return Math.min(...vals)
      }

      case 'IF': {
        if (args.length < 2) return '#VALUE!'
        const cond = toBoolean(assertNotError(args[0]))
        return cond ? args[1] : args.length > 2 ? args[2] : false
      }

      case 'VLOOKUP': {
        if (args.length < 3) return '#VALUE!'
        const lookupValue = assertNotError(args[0])
        const table = args[1]
        const colIndex = Math.floor(toNumber(assertNotError(args[2])))
        if (!Array.isArray(table) || table.length === 0 || colIndex < 1) return '#REF!'
        for (const row of table) {
          if (!Array.isArray(row) || row.length === 0) continue
          const firstCell = row[0]
          if (
            firstCell === lookupValue ||
            String(firstCell) === String(lookupValue)
          ) {
            if (colIndex <= row.length) {
              return row[colIndex - 1]
            }
            return '#REF!'
          }
        }
        return '#N/A'
      }

      default:
        return '#NAME?'
    }
  }

  private arith(left: any, op: string, right: any): number {
    const l = toNumber(assertNotError(left))
    const r = toNumber(assertNotError(right))
    if (Number.isNaN(l) || Number.isNaN(r)) {
      throw new FormulaError('#VALUE!')
    }
    switch (op) {
      case '+':
        return l + r
      case '-':
        return l - r
      case '*':
        return l * r
      case '/':
        if (Math.abs(r) < 1e-12) throw new FormulaError('#DIV/0!')
        return l / r
    }
    throw new FormulaError('#VALUE!')
  }
}

export function evaluateFormula(
  formula: string,
  getCellValue: (ref: string) => any
): any {
  try {
    const raw = formula.startsWith('=') ? formula.slice(1) : formula
    const tokens = tokenize(raw)
    const evaluator = new Evaluator(tokens, getCellValue, new Set())
    return evaluator.parse()
  } catch (err: unknown) {
    if (err instanceof FormulaError) return err.code
    return '#VALUE!'
  }
}

export function getFormulaDependencies(formula: string): string[] {
  try {
    const raw = formula.startsWith('=') ? formula.slice(1) : formula
    const tokens = tokenize(raw)
    const deps = new Set<string>()
    for (const tok of tokens) {
      if (tok.type === 'CELL') deps.add(tok.ref)
      if (tok.type === 'RANGE') {
        getRangeCells(tok.start, tok.end).forEach((ref) => deps.add(ref))
      }
    }
    return Array.from(deps)
  } catch {
    return []
  }
}
