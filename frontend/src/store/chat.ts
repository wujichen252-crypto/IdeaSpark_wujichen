import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Message {
  id: string
  role: 'user' | 'ai' | 'system'
  content: string
  type: 'text' | 'image' | 'code'
  timestamp: number
  status?: 'loading' | 'success' | 'error'
  // For code blocks or images, we might add extra fields later
  language?: string
  imageUrls?: string[]
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  model: string
  lastUpdated: number
  systemPrompt?: string
}

export const useChatStore = defineStore(
  'chat',
  () => {
  // Initialize with some dummy data if empty
  const sessions = ref<ChatSession[]>([
    {
      id: '1',
      title: 'Vue3 组件开发助手',
      model: 'GPT-4 Turbo',
      lastUpdated: Date.now(),
      messages: [
        {
          id: '101',
          role: 'ai',
          content: '你好！我是 IdeaSpark AI 助手。有什么我可以帮你的吗？我可以帮你写代码、生成文案或者提供创意灵感。',
          type: 'text',
          timestamp: Date.now()
        }
      ]
    }
  ])
  
  const currentSessionId = ref<string>('1')
  const models = ref(['GPT-4 Turbo', 'Claude 3.5 Sonnet', 'Gemini Pro 1.5', 'DeepSeek V2'])
  
  const currentSession = computed(() => 
    sessions.value.find(s => s.id === currentSessionId.value)
  )

  function createSession(model = 'GPT-4 Turbo') {
    const id = Date.now().toString()
    const newSession: ChatSession = {
      id,
      title: '新对话',
      messages: [
        {
          id: Date.now().toString() + 'init',
          role: 'ai',
          content: '你好！我是 IdeaSpark AI 助手。请问今天想聊点什么？',
          type: 'text',
          timestamp: Date.now()
        }
      ],
      model,
      lastUpdated: Date.now()
    }
    sessions.value.unshift(newSession)
    currentSessionId.value = id
    return id
  }

  /**
   * 使用指定 ID 创建会话（用于绑定到某个页面/文件）
   * @param id - 会话 ID
   * @param title - 会话标题
   * @param model - 模型名称
   */
  function createSessionWithId(id: string, title = '新对话', model = 'GPT-4 Turbo') {
    const existing = sessions.value.find(s => s.id === id)
    if (existing) {
      currentSessionId.value = existing.id
      return existing.id
    }
    const newSession: ChatSession = {
      id,
      title,
      messages: [
        {
          id: Date.now().toString() + 'init',
          role: 'ai',
          content: '你好！我是 IdeaSpark AI 助手。请问今天想聊点什么？',
          type: 'text',
          timestamp: Date.now()
        }
      ],
      model,
      lastUpdated: Date.now()
    }
    sessions.value.unshift(newSession)
    currentSessionId.value = id
    return id
  }

  /**
   * 确保会话存在并切换到该会话
   * @param id - 会话 ID
   * @param title - 会话标题
   * @param model - 模型名称
   */
  function ensureSession(id: string, title = '新对话', model = 'GPT-4 Turbo') {
    const existing = sessions.value.find(s => s.id === id)
    if (existing) {
      currentSessionId.value = existing.id
      return existing.id
    }
    return createSessionWithId(id, title, model)
  }

  function switchSession(id: string) {
    currentSessionId.value = id
  }

  function updateSessionTitle(id: string, title: string) {
    const index = sessions.value.findIndex(s => s.id === id)
    if (index !== -1) {
      const session = sessions.value[index]!
      sessions.value[index] = { ...session, title }
    }
  }

  function addMessage(sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index === -1) return
    const session = sessions.value[index]!
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      timestamp: Date.now()
    }
    const newMessages = [...session.messages, newMessage]
    let newTitle = session.title
    // Auto update title if it's the first user message and title is default
    if (message.role === 'user' && newMessages.filter(m => m.role === 'user').length === 1) {
       if (session.title === '新对话') {
          newTitle = message.content.slice(0, 15)
       }
    }
    sessions.value[index] = { ...session, messages: newMessages, lastUpdated: Date.now(), title: newTitle }
  }

  function updateMessage(sessionId: string, messageId: string, updates: Partial<Omit<Message, 'id'>>) {
    const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)
    if (sessionIndex === -1) return
    const session = sessions.value[sessionIndex]!
    const msgIndex = session.messages.findIndex(m => m.id === messageId)
    if (msgIndex === -1) return
    const newMessages = [...session.messages]
    newMessages[msgIndex] = { ...newMessages[msgIndex], ...updates } as Message
    sessions.value[sessionIndex] = { ...session, messages: newMessages }
  }

  function deleteSession(id: string) {
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (currentSessionId.value === id) {
      if (sessions.value.length > 0) {
        const nextSession = sessions.value[0]
        if (nextSession) {
           currentSessionId.value = nextSession.id
        }
      } else {
        createSession()
      }
    }
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    models,
    createSession,
    createSessionWithId,
    ensureSession,
    switchSession,
    addMessage,
    updateMessage,
    deleteSession,
    updateSessionTitle
  }
},
{
  persist: {
    key: 'chat-store',
    storage: localStorage,
    pick: ['sessions', 'currentSessionId']
  }
})
