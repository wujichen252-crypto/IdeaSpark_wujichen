/**
 * 幻灯片AI功能组合式函数
 * @description 提供幻灯片大纲生成、内容扩写、设计建议等相关的AI功能
 */
import { ref } from 'vue'
import { editAi } from '@/api/ai'

/**
 * 幻灯片AI操作
 */
export interface SlideAiAction {
  key: string
  label: string
  action: 'outline' | 'expand' | 'design' | 'notes' | 'generate'
  prompt: (content: string, title: string) => string
}

/**
 * 幻灯片支持的AI操作列表
 */
const slideActions: SlideAiAction[] = [
  {
    key: 'outline',
    label: '生成大纲',
    action: 'outline',
    prompt: (content, title) => `请为演示文稿《${title}》生成一个结构清晰的幻灯片大纲（使用 ## 标题和 - 列表格式），主题如下：\n\n${content}`
  },
  {
    key: 'expand',
    label: '扩写内容',
    action: 'expand',
    prompt: (content) => `请对以下幻灯片内容进行扩写，添加更多细节和说明，使其更加充实：\n\n${content}`
  },
  {
    key: 'design',
    label: '设计建议',
    action: 'design',
    prompt: (content) => `请根据以下幻灯片内容推荐合适的版式和设计风格，给出具体建议：\n\n${content}`
  },
  {
    key: 'notes',
    label: '演讲备注',
    action: 'notes',
    prompt: (content) => `请为以下幻灯片内容生成演讲者备注，帮助演讲人更好地呈现内容：\n\n${content}`
  }
]

/**
 * 幻灯片AI功能
 * @param fileName 演示文稿名称
 */
export function useSlideAi(fileName: string = '未命名演示文稿') {
  const loading = ref(false)

  /**
   * 执行AI操作
   * @param actionKey 操作key
   * @param content 幻灯片内容
   * @param title 幻灯片标题（可选）
   */
  async function executeAction(actionKey: string, content: string, title?: string): Promise<string> {
    const action = slideActions.find(a => a.key === actionKey)
    if (!action) return ''

    loading.value = true
    try {
      const res = await editAi({
        fileType: 'pptx',
        content: content || '',
        action: action.action,
        selectedText: title
      })
      return res.data?.data?.content || ''
    } catch (err) {
      console.error('Slide AI 调用失败:', err)
      return ''
    } finally {
      loading.value = false
    }
  }

  /**
   * AI聊天对话
   * @param prompt 用户输入
   * @param content 当前幻灯片内容
   */
  async function chat(prompt: string, content: string = ''): Promise<string> {
    loading.value = true
    try {
      const res = await editAi({
        fileType: 'pptx',
        content: content,
        action: 'design',
        selectedText: prompt
      })
      return res.data?.data?.content || ''
    } catch (err) {
      console.error('Slide AI 聊天失败:', err)
      return ''
    } finally {
      loading.value = false
    }
  }

  /**
   * 生成幻灯片大纲（便捷方法）
   * @param topic 主题
   */
  async function generateOutline(topic: string): Promise<string> {
    loading.value = true
    try {
      const res = await editAi({
        fileType: 'pptx',
        content: '',
        action: 'generate',
        selectedText: `请为我生成关于"${topic}"的演示文稿大纲（使用 ## 标题和 - 列表格式）`
      })
      return res.data?.data?.content || ''
    } catch (err) {
      console.error('生成大纲失败:', err)
      return ''
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    actions: slideActions,
    executeAction,
    chat,
    generateOutline
  }
}
