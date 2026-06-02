<template>
  <div class="ai-chat-area" :class="{ 'is-sidebar': mode === 'sidebar', 'is-fluid': fluid }">
    <!-- Header: only show in full mode -->
    <div v-if="mode === 'full'" class="chat-header">
      <div class="model-selector">
        <n-icon size="20" color="#22c55e"><Sparkles /></n-icon>
        <span class="label">IdeaSpark AI 助手</span>
        <n-tag
type="success"
size="small"
round
bordered>已连接</n-tag>
      </div>
      <div class="header-actions">
        <n-button quaternary size="small" @click="emit('toggle-settings')">
          <template #icon><n-icon><SettingsOutline /></n-icon></template>
        </n-button>
      </div>
    </div>

    <!-- Messages Area -->
    <div ref="scrollRef" class="messages-scroll-area">
      <div class="messages-content">
        <!-- Empty State -->
        <div v-if="messages.length === 0" class="empty-state">
          <div class="logo-placeholder">
            <n-icon size="40" color="#22c55e"><Sparkles /></n-icon>
          </div>
          <h3>AI 文档助手</h3>
          <p class="empty-desc">发送消息，让 AI 帮你写作、润色或生成大纲</p>
          <div v-if="mode === 'full'" class="quick-prompts">
            <n-button dashed class="prompt-btn" @click="handleQuickPrompt('帮我完善商业模式')">
              💼 完善商业模式
            </n-button>
            <n-button dashed class="prompt-btn" @click="handleQuickPrompt('如何推广我的公众号')">
              📈 推广公众号
            </n-button>
            <n-button dashed class="prompt-btn" @click="handleQuickPrompt('制定一份学习计划')">
              📚 制定学习计划
            </n-button>
          </div>
        </div>

        <!-- Message List -->
        <template v-else>
          <AiMessageItem
            v-for="msg in messages"
            :key="msg.id || msg.timestamp"
            :message="msg"
            @save-code="(payload) => emit('save-file', payload)"
          />
        </template>
        <div class="bottom-spacer"></div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area-wrapper">
      <AiInputBox 
        :loading="loading" 
        :mode="mode === 'sidebar' ? 'mini' : 'normal'"
        @send="handleSend" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useChatStore } from '@/store/chat'
import { SettingsOutline, Sparkles } from '@vicons/ionicons5'
import { sendChatMessage } from '@/api/ai'
import type { ChatMessage } from '@/api/ai'
import AiMessageItem from './AiMessageItem.vue'
import AiInputBox from './AiInputBox.vue'

const props = withDefaults(defineProps<{
  sessionId: string | null
  mode?: 'full' | 'sidebar'
  currentStep?: number
  systemContext?: string
  fluid?: boolean
}>(), {
  mode: 'full',
  currentStep: 0,
  systemContext: '',
  fluid: false
})

const emit = defineEmits<{
  (e: 'toggle-settings'): void
  (e: 'save-file', payload: { code: string, lang: string }): void
}>()

const chatStore = useChatStore()
const scrollRef = ref<HTMLElement | null>(null)
const loading = ref(false)

// Use the session matching our sessionId, fallback to current session
const activeSession = computed(() => {
  if (props.sessionId) {
    const found = chatStore.sessions.find(s => s.id === props.sessionId)
    if (found) return found
  }
  return chatStore.currentSession
})

const messages = computed(() => activeSession.value?.messages || [])

const handleQuickPrompt = (text: string) => {
  handleSend(text)
}

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight
    }
  })
}

watch(() => messages.value.length, scrollToBottom)
watch(() => messages.value[messages.value.length - 1]?.content, scrollToBottom)

async function handleSend(text: string) {
  let sid = props.sessionId
  if (sid) {
    chatStore.ensureSession(sid, '文档协作')
  } else {
    chatStore.createSession()
    sid = chatStore.currentSessionId
  }
  if (!sid) return
  
  // 1. Add User Message
  chatStore.addMessage(sid, {
    role: 'user',
    content: text,
    type: 'text'
  })
  
  scrollToBottom()
  loading.value = true
  
  // 2. Add initial empty AI message
  chatStore.addMessage(sid, {
    role: 'ai',
    content: '',
    type: 'text',
    status: 'loading'
  })
  
  const targetSession = chatStore.sessions.find(s => s.id === sid)
  if (!targetSession) {
    loading.value = false
    return
  }
  
  const aiMsgIndex = targetSession.messages.length - 1
  const aiMsg = targetSession.messages[aiMsgIndex]
  if (!aiMsg) {
    loading.value = false
    return
  }
  
  try {
    // Build message history
    const sessionMessages = targetSession.messages
    const chatMessages: ChatMessage[] = []
    
    // System context
    if (props.systemContext) {
      chatMessages.push({
        role: 'system',
        content: props.systemContext
      })
    } else {
      chatMessages.push({
        role: 'system',
        content: '你是 IdeaSpark AI 助手，一个专业的项目管理助手。你可以帮助用户解答项目开发、技术选型、团队协作等问题。请用中文回答，回答要专业、简洁、实用。'
      })
    }
    
    // Recent messages (max 10, skip loading)
    const recentMessages = sessionMessages.slice(-10)
    recentMessages.forEach(msg => {
      if (msg.status === 'loading') return
      if ((msg.role === 'user' || msg.role === 'ai') && msg.content) {
        chatMessages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        })
      }
    })
    
    // Call DeepSeek API
    const response = await sendChatMessage({ messages: chatMessages })
    const responseText = response.data?.data?.message?.content || ''
    
    // Update AI message
    chatStore.updateMessage(sid, aiMsg.id, { 
      content: responseText, 
      status: 'success' 
    })
    
  } catch (error: any) {
    console.error('AI 调用失败:', error)
    chatStore.updateMessage(sid, aiMsg.id, { 
      content: '抱歉，AI 服务暂时不可用，请稍后重试。', 
      status: 'error' 
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

defineExpose({ handleSend })
</script>

<style scoped lang="scss">
.ai-chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  position: relative;
  height: 100%;
  overflow: hidden;

  /* Sidebar mode */
  &.is-sidebar {
    background-color: #fff;
    border-left: 1px solid #e2e8f0;
    
    .messages-scroll-area .messages-content {
      padding: 12px;
      max-width: none;
      margin: 0;
      overflow-x: hidden;
      
      .empty-state {
        h3 { font-size: 16px; }
        .empty-desc { font-size: 13px; }
        .quick-prompts { display: none; }
      }
    }
    
    :deep(.ai-message) {
      max-width: none;
      margin: 0 0 14px 0;
      gap: 8px;
      padding-right: 2px;
      
      .avatar .n-avatar {
        width: 28px !important;
        height: 28px !important;
      }
      
      .content-wrapper {
        max-width: calc(100% - 40px) !important;
        
        .bubble {
          padding: 8px 12px;
          font-size: 13px;
          border-radius: 12px;
          
          .code-block-wrapper {
            max-width: 100%;
            margin: 8px 0;
            
            pre {
              padding: 8px;
              max-width: 100%;
              
              code {
                white-space: pre-wrap;
                word-break: break-all;
                font-size: 12px;
              }
            }
          }
        }
      }
    }
  }

  /* Fluid mode */
  &.is-fluid {
    .messages-scroll-area .messages-content {
      max-width: none;
      margin: 0;
    }
    
    :deep(.ai-message) {
      max-width: none;
    }
  }

  .chat-header {
    height: 56px;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    flex-shrink: 0;
    
    .model-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      
      .label {
        color: #0f172a;
        font-weight: 600;
      }
    }
  }

  .messages-scroll-area {
    flex: 1;
    overflow-y: auto;
    scroll-behavior: smooth;
    background: #fafafa;
    
    .messages-content {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      
      .empty-state {
        margin: auto;
        text-align: center;
        padding: 40px 20px;
        
        .logo-placeholder {
          margin-bottom: 16px;
          width: 64px;
          height: 64px;
          background: #dcfce7;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        h3 {
          font-size: 18px;
          color: #0f172a;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .empty-desc {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 24px;
        }
        
        .quick-prompts {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          
          .prompt-btn {
            border-radius: 20px;
            font-size: 13px;
          }
        }
      }
      
      .bottom-spacer {
        height: 12px;
      }
    }
  }

  .input-area-wrapper {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.4);
    z-index: 20;
    padding: 12px 16px 16px;
  }
}
</style>
