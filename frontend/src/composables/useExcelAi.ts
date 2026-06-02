/**
 * Excel AI 助手 - 重构版
 * @description 提供智能数据分析、公式生成、数据清洗、可视化建议等功能
 */
import { ref } from 'vue'
import { sendChatMessage, editAi } from '@/api/ai'
import type { ChatMessage } from '@/api/ai'

/**
 * AI 功能类型
 */
export type AiFunctionType = 
  | 'smart-fill'      // 智能填充
  | 'data-analysis'   // 数据分析
  | 'formula-gen'     // 公式生成
  | 'data-clean'      // 数据清洗
  | 'visual-advice'   // 可视化建议
  | 'quick-stats'     // 快速统计
  | 'trend-forecast'  // 趋势预测
  | 'anomaly-detect'  // 异常检测
  | 'smart-generate'  // 智能生成

/**
 * AI 快捷操作定义
 */
export interface AiQuickAction {
  key: AiFunctionType
  label: string
  icon: string
  description: string
  systemPrompt: string
}

/**
 * 单元格数据接口
 */
export interface CellData {
  value?: string | number
  formula?: string
  style?: Record<string, any>
}

/**
 * 表格数据上下文
 */
export interface ExcelContext {
  fileName: string
  sheetName: string
  selectedRange: string | null
  selectedData: CellData[][]
  headers: string[]
  dataSummary: {
    rowCount: number
    colCount: number
    numericCols: number[]
    hasHeaders: boolean
  }
}

/**
 * AI 生成结果
 */
export interface AiResult {
  type: 'text' | 'formula' | 'table' | 'chart-advice' | 'code'
  content: string
  data?: any
  explanation?: string
}

/**
 * 预定义的 AI 快捷操作
 */
export const AI_QUICK_ACTIONS: AiQuickAction[] = [
  {
    key: 'smart-fill',
    label: '智能填充',
    icon: '✨',
    description: '根据示例自动填充数据',
    systemPrompt: `你是 Excel 智能填充助手。分析用户提供的示例数据，识别规律并生成填充建议。

输出格式要求：
1. 如果是简单序列，直接给出后续值
2. 如果是复杂规律，用 Markdown 表格展示填充结果
3. 说明识别出的规律

注意：只输出填充结果，不要解释过多。`
  },
  {
    key: 'data-analysis',
    label: '数据分析',
    icon: '📊',
    description: '深度分析选中数据',
    systemPrompt: `你是数据分析专家。对提供的 Excel 数据进行深度分析。

分析维度：
1. 基础统计（总和、平均值、最大最小值）
2. 数据分布特征
3. 关键趋势和洞察
4. 异常值识别
5. 数据质量评估

输出要求：
- 用简洁的中文输出
- 关键数据用 **加粗** 标注
- 使用 Markdown 表格展示统计数据
- 给出 3-5 条 actionable insights`
  },
  {
    key: 'formula-gen',
    label: '公式生成',
    icon: '🔢',
    description: '根据需求生成 Excel 公式',
    systemPrompt: `你是 Excel 公式专家。根据用户需求生成准确、高效的公式。

输出格式：
1. 直接给出公式（如 =SUM(A1:A10)）
2. 用中文简要说明公式原理
3. 如有多种方案，给出推荐方案

注意事项：
- 确保公式语法正确
- 考虑边界情况（空值、错误值）
- 优先使用高效的函数组合`
  },
  {
    key: 'data-clean',
    label: '数据清洗',
    icon: '🧹',
    description: '发现并修复数据问题',
    systemPrompt: `你是数据清洗专家。识别数据中的质量问题并给出清洗方案。

检查项目：
1. 空值/缺失值
2. 重复数据
3. 格式不一致
4. 异常值/离群点
5. 数据类型错误

输出要求：
- 列出发现的具体问题
- 给出清洗步骤（可操作）
- 如需公式，提供具体公式
- 预估清洗后的数据质量提升`
  },
  {
    key: 'visual-advice',
    label: '图表建议',
    icon: '📈',
    description: '推荐合适的可视化方案',
    systemPrompt: `你是数据可视化专家。根据数据特征推荐最佳图表类型。

推荐维度：
1. 数据类型（时间序列、分类、占比等）
2. 分析目的（对比、趋势、分布、关联）
3. 图表优缺点对比

输出格式：
- 推荐 2-3 种图表类型
- 说明每种图表的适用场景
- 给出 Excel 插入图表的具体步骤`
  },
  {
    key: 'quick-stats',
    label: '快速统计',
    icon: '⚡',
    description: '一键生成统计摘要',
    systemPrompt: `你是统计分析助手。快速生成数据的关键统计指标。

输出内容：
1. 样本量、均值、中位数、标准差
2. 最大值、最小值、极差
3. 四分位数、异常值范围
4. 关键发现（一句话总结）

格式：Markdown 表格 + 简要文字说明`
  },
  {
    key: 'trend-forecast',
    label: '趋势预测',
    icon: '🔮',
    description: '基于历史数据预测趋势',
    systemPrompt: `你是趋势预测专家。基于历史数据进行简单预测。

分析步骤：
1. 识别数据模式（线性/指数/季节性）
2. 计算增长率/变化趋势
3. 给出短期预测（未来 3-5 期）
4. 说明预测置信度

注意：明确告知这是基于历史模式的简单预测，仅供参考。`
  },
  {
    key: 'anomaly-detect',
    label: '异常检测',
    icon: '🔍',
    description: '自动发现数据异常',
    systemPrompt: `你是异常检测专家。使用统计方法识别数据中的异常值。

检测方法：
1. 3σ 原则（标准差法）
2. IQR 四分位距法
3. 业务规则检查

输出要求：
- 列出所有异常值及其位置
- 说明异常类型（过高/过低/格式异常）
- 给出可能的原因分析
- 建议处理方式`
  },
  {
    key: 'smart-generate',
    label: '智能生成',
    icon: '🚀',
    description: '根据描述自动生成完整表格内容',
    systemPrompt: `你是 Excel 表格生成专家。根据用户需求，直接生成完整的、可直接使用的表格数据。

生成要求：
1. 数据必须真实、合理、有实际意义
2. 包含完整的表头和数据行
3. 数据格式规范（日期、货币、百分比等）
4. 可以包含简单的计算公式（如求和、平均值）

输出格式（必须严格遵守）：
1. 第一行是表头，用 | 分隔
2. 第二行是分隔线 |---|---|---|
3. 从第三行开始是数据
4. 所有行以 | 开头和结尾

示例输出：
| 产品名称 | 销量 | 单价 | 销售额 |
|---|---|---|---|
| 产品A | 100 | 50 | =B2*C2 |
| 产品B | 200 | 30 | =B3*C3 |
| 合计 | | | =SUM(D2:D3) |

注意：
- 直接输出 Markdown 表格，不要其他解释
- 数据行数根据需求确定（通常 5-20 行）
- 可以包含 Excel 公式（以 = 开头）`
  }
]

/**
 * 构建 Excel 上下文提示
 */
function buildContextPrompt(context: ExcelContext): string {
  const { selectedRange, selectedData, headers, dataSummary, sheetName } = context
  
  let prompt = `当前工作表：${sheetName}\n`
  prompt += `选中区域：${selectedRange || '未选择'}\n`
  prompt += `数据规模：${dataSummary.rowCount} 行 × ${dataSummary.colCount} 列\n`
  
  if (headers.length > 0) {
    prompt += `表头：${headers.join(' | ')}\n`
  }
  
  if (selectedData.length > 0) {
    prompt += `\n选中数据预览（前 10 行）：\n`
    const previewRows = selectedData.slice(0, 10)
    previewRows.forEach((row, idx) => {
      const values = row.map(cell => cell.value ?? '').join('\t')
      prompt += `行 ${idx + 1}: ${values}\n`
    })
    
    if (selectedData.length > 10) {
      prompt += `... 共 ${selectedData.length} 行\n`
    }
  }
  
  return prompt
}

/**
 * 解析 AI 响应为结构化结果
 */
function parseAiResponse(content: string): AiResult {
  const trimmed = content.trim()
  
  // 检测公式
  if (trimmed.startsWith('=') && !trimmed.includes('\n')) {
    return {
      type: 'formula',
      content: trimmed,
      explanation: ''
    }
  }
  
  // 检测 Markdown 表格
  if (trimmed.includes('|') && trimmed.includes('\n')) {
    const lines = trimmed.split('\n')
    const hasTable = lines.some(line => line.trim().startsWith('|') && line.trim().endsWith('|'))
    if (hasTable) {
      return {
        type: 'table',
        content: trimmed,
        explanation: ''
      }
    }
  }
  
  // 检测代码块
  if (trimmed.startsWith('```')) {
    return {
      type: 'code',
      content: trimmed,
      explanation: ''
    }
  }
  
  // 默认文本
  return {
    type: 'text',
    content: trimmed,
    explanation: ''
  }
}

/**
 * Excel AI 助手 Composable - 重构版
 */
export function useExcelAi() {
  const loading = ref(false)
  const currentResult = ref<AiResult | null>(null)

  /**
   * 执行 AI 快捷操作
   */
  async function executeAction(
    actionKey: AiFunctionType, 
    context: ExcelContext
  ): Promise<AiResult | null> {
    const action = AI_QUICK_ACTIONS.find(a => a.key === actionKey)
    if (!action) {
      console.error('未知的 AI 操作:', actionKey)
      return null
    }

    loading.value = true
    currentResult.value = null

    try {
      const contextPrompt = buildContextPrompt(context)
      const userPrompt = `请对以下 Excel 数据进行 ${action.label} 分析：\n\n${contextPrompt}`

      // 使用对话模式获得更好的结果
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: action.systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ]

      const res = await sendChatMessage({ messages })
      const content = res.data?.data?.message?.content || ''
      
      currentResult.value = parseAiResponse(content)
      return currentResult.value
    } catch (err) {
      console.error('Excel AI 调用失败:', err)
      return {
        type: 'text',
        content: 'AI 服务暂时不可用，请稍后重试。',
        explanation: ''
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 自由对话模式
   */
  async function chat(
    userInput: string, 
    context: ExcelContext
  ): Promise<AiResult | null> {
    loading.value = true
    currentResult.value = null

    try {
      const contextPrompt = buildContextPrompt(context)
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `你是 Excel 智能助手，帮助用户处理表格数据。

能力：
1. 数据分析和洞察
2. 公式生成和优化
3. 数据清洗建议
4. 可视化推荐
5. 自动填充和补全

输出要求：
- 优先使用 Markdown 表格展示数据
- 公式用代码块标注
- 关键信息加粗显示
- 保持简洁专业`
        },
        {
          role: 'user',
          content: `上下文：\n${contextPrompt}\n\n用户需求：${userInput}`
        }
      ]

      const res = await sendChatMessage({ messages })
      const content = res.data?.data?.message?.content || ''
      
      currentResult.value = parseAiResponse(content)
      return currentResult.value
    } catch (err) {
      console.error('Excel AI 聊天失败:', err)
      return {
        type: 'text',
        content: '抱歉，AI 服务暂时不可用，请稍后重试。',
        explanation: ''
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 智能填充 - 根据示例自动推断并填充
   */
  async function smartFill(
    examples: string[],
    targetCount: number
  ): Promise<AiResult | null> {
    loading.value = true
    
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `你是智能填充助手。分析示例数据的规律，生成后续数据。

输出要求：
1. 只输出填充结果，用 Markdown 表格
2. 第一列是序号，第二列是填充值
3. 简要说明识别出的规律`
        },
        {
          role: 'user',
          content: `示例数据：\n${examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n请生成后续 ${targetCount} 个值。`
        }
      ]

      const res = await sendChatMessage({ messages })
      const content = res.data?.data?.message?.content || ''
      
      return parseAiResponse(content)
    } catch (err) {
      console.error('智能填充失败:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 生成复杂公式 - 带错误处理和优化建议
   */
  async function generateFormula(
    requirement: string,
    context: ExcelContext
  ): Promise<AiResult | null> {
    loading.value = true
    
    try {
      const contextPrompt = buildContextPrompt(context)
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `你是 Excel 公式专家。生成准确、高效、健壮的公式。

要求：
1. 公式必须正确处理空值和错误值
2. 优先使用高效的函数组合
3. 给出公式的中文解释
4. 说明使用方法和注意事项

输出格式：
公式：
\`\`\`
=公式内容
\`\`\`

说明：...
适用场景：...`
        },
        {
          role: 'user',
          content: `需求：${requirement}\n\n上下文：\n${contextPrompt}`
        }
      ]

      const res = await sendChatMessage({ messages })
      const content = res.data?.data?.message?.content || ''
      
      return parseAiResponse(content)
    } catch (err) {
      console.error('公式生成失败:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 智能生成 - 根据描述生成完整表格
   */
  async function smartGenerate(
    description: string,
    rowCount: number = 10
  ): Promise<AiResult | null> {
    loading.value = true
    
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `你是 Excel 表格生成专家。根据用户需求，直接生成完整的、可直接使用的表格数据。

生成要求：
1. 数据必须真实、合理、有实际意义
2. 包含完整的表头和数据行
3. 数据格式规范（日期、货币、百分比等）
4. 可以包含简单的计算公式（如求和、平均值）

输出格式（必须严格遵守）：
1. 第一行是表头，用 | 分隔
2. 第二行是分隔线 |---|---|---|
3. 从第三行开始是数据
4. 所有行以 | 开头和结尾

示例输出：
| 产品名称 | 销量 | 单价 | 销售额 |
|---|---|---|---|
| 产品A | 100 | 50 | =B2*C2 |
| 产品B | 200 | 30 | =B3*C3 |
| 合计 | | | =SUM(D2:D3) |

注意：
- 直接输出 Markdown 表格，不要其他解释
- 数据行数根据需求确定（通常 5-20 行）
- 可以包含 Excel 公式（以 = 开头）`
        },
        {
          role: 'user',
          content: `请生成一个关于"${description}"的 Excel 表格，包含 ${rowCount} 行数据。`
        }
      ]

      const res = await sendChatMessage({ messages })
      const content = res.data?.data?.message?.content || ''
      
      return parseAiResponse(content)
    } catch (err) {
      console.error('智能生成失败:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    currentResult,
    actions: AI_QUICK_ACTIONS,
    executeAction,
    chat,
    smartFill,
    generateFormula,
    smartGenerate
  }
}
