/**
 * Markdown文档AI功能组合式函数
 * @description 提供Markdown文档编辑相关的AI功能
 */
import { ref } from 'vue'
import { editAi, sendSimpleChat } from '@/api/ai'

/**
 * Markdown文档AI操作
 */
export interface MdAiAction {
  key: string
  label: string
  action: 'rewrite' | 'polish' | 'expand' | 'outline' | 'summary' | 'translate'
  prompt: (text: string, fileName: string) => string
}

/**
 * Markdown文档支持的AI操作列表
 */
const mdActions: MdAiAction[] = [
  {
    key: 'rewrite',
    label: '改写',
    action: 'rewrite',
    prompt: (text) => `请对以下内容进行改写，保持原意但使用不同的表达方式，直接输出改写后的内容，不要添加解释：\n\n${text}`
  },
  {
    key: 'polish',
    label: '润色',
    action: 'polish',
    prompt: (text) => `请对以下内容进行润色和纠错，使其更加通顺、专业、有逻辑。直接输出润色后的内容，不要添加解释：\n\n${text}`
  },
  {
    key: 'expand',
    label: '扩写',
    action: 'expand',
    prompt: (text) => `请扩写以下内容，添加更多细节、案例和说明，使其更加丰富完整。直接输出扩写后的内容：\n\n${text}`
  },
  {
    key: 'outline',
    label: '生成大纲',
    action: 'outline',
    prompt: (text) => `请为以下内容生成一个清晰的目录大纲（Markdown 格式，使用 ## 层级），直接输出大纲：\n\n${text}`
  },
  {
    key: 'summary',
    label: '总结',
    action: 'summary',
    prompt: (text) => `请将以下内容总结为要点列表（5-10条），直接输出总结：\n\n${text}`
  },
  {
    key: 'translate',
    label: '翻译',
    action: 'translate',
    prompt: (text) => `请将以下内容翻译成英文，保持专业术语准确，直接输出翻译：\n\n${text}`
  }
]

/**
 * Markdown文档AI功能
 * @param fileName 文档名称
 */
export function useMdAi(fileName: string = '未命名文档') {
  const loading = ref(false)

  /**
   * 执行AI操作
   * @param actionKey 操作key
   * @param content 文档内容
   * @param selectedText 选中的文本（可选）
   */
  async function executeAction(actionKey: string, content: string, selectedText?: string): Promise<string> {
    const action = mdActions.find(a => a.key === actionKey)
    if (!action) return ''

    loading.value = true
    try {
      const res = await editAi({
        fileType: 'md',
        content: content || '',
        action: action.action,
        selectedText: selectedText || undefined
      })
      return res.data?.data?.content || ''
    } catch (err) {
      console.error('Markdown AI 调用失败:', err)
      return ''
    } finally {
      loading.value = false
    }
  }

  /**
   * AI聊天对话
   * @param prompt 用户输入
   * @param content 当前文档内容（已弃用，通过 sendSimpleChat 发送）
   */
  async function chat(prompt: string, _content: string = ''): Promise<string> {
    loading.value = true
    try {
      const res = await sendSimpleChat(prompt)
      return res.data?.data?.content || ''
    } catch (err) {
      console.error('Markdown AI 聊天失败:', err)
      return ''
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    actions: mdActions,
    executeAction,
    chat
  }
}
