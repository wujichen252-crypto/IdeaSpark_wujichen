import { ref } from 'vue'
import { editAi } from '@/api/ai'
import type { AiEditRequest } from '@/api/ai'

function stripHtml(text: string): string {
  if (!text.includes('<') || !text.includes('>')) return text
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim()
}

export function useDocAi(fileName: string) {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function callDocAi(
    content: string,
    action: string,
    selectedText?: string
  ): Promise<string> {
    loading.value = true
    error.value = null

    try {
      const params: AiEditRequest = {
        fileType: 'doc',
        content: content.slice(0, 5000),
        action
      }
      if (selectedText !== undefined) {
        params.selectedText = selectedText
      }

      const res = await editAi(params)
      return stripHtml(res.data.data?.content || '')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI 服务暂时不可用'
      error.value = msg
      console.error(`Doc AI ${action} 失败:`, err)
      return ''
    } finally {
      loading.value = false
    }
  }

  async function chat(userInput: string, editorContent = ''): Promise<string> {
    return callDocAi(editorContent, 'continue', userInput)
  }

  async function chatWithEdit(userInput: string, editorContent = ''): Promise<string> {
    loading.value = true
    error.value = null

    try {
      const params: AiEditRequest = {
        fileType: 'doc',
        content: editorContent.slice(0, 5000),
        action: 'continue'
      }
      const res = await editAi(params)
      return stripHtml(res.data.data?.content || '')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI 服务暂时不可用'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  function withContentCheck(fn: (content: string) => Promise<string>) {
    return async (content: string): Promise<string> => {
      if (!content.trim()) {
        console.warn('请先输入需要处理的内容')
        return ''
      }
      return fn(content)
    }
  }

  const expand = withContentCheck((content: string) => callDocAi(content, 'expand'))
  const polish = withContentCheck((content: string) => callDocAi(content, 'polish'))
  const summarize = withContentCheck((content: string) => callDocAi(content, 'summary'))

  return {
    loading,
    error,
    chat,
    chatWithEdit,
    expand,
    polish,
    summarize
  }
}
