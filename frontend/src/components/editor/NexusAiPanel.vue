<template>
  <div class="nexus-ai-panel">
    <!-- Header -->
    <div class="ai-panel-header">
      <div class="ai-panel-title">
        <n-icon size="16" color="var(--nexus-text-primary)">
          <SparklesOutline />
        </n-icon>
        <span>IdeaSpark AI</span>
      </div>
      <button class="nexus-icon-btn close-btn" @click="$emit('close')">
        <n-icon size="16"><CloseOutline /></n-icon>
      </button>
    </div>

    <!-- 消息列表区域 -->
    <div class="ai-messages" ref="messagesRef">
      <!-- 欢迎消息 -->
      <div class="ai-welcome" v-if="!hasInteraction">
        <div class="ai-avatar">
          <n-icon size="20"><SparklesOutline /></n-icon>
        </div>
        <div class="ai-welcome-text">
          <p>你好！我是 IdeaSpark AI 助手。</p>
          <p>我可以帮助你编写文档、生成文案或者提供创意灵感。</p>
        </div>
      </div>

      <!-- 消息列表 -->
      <div
v-for="(msg, index) in messages"
:key="index"
class="ai-message"
:class="msg.role">
        <div class="message-avatar">
          <n-icon v-if="msg.role === 'ai'" size="16"><SparklesOutline /></n-icon>
          <n-icon v-else size="16"><PersonOutline /></n-icon>
        </div>
        <div class="message-content">
          <div class="message-bubble" :class="msg.role">
            <div v-if="msg.status === 'loading'" class="loading-indicator">
              <span class="dot" ></span>
              <span class="dot" ></span>
              <span class="dot" ></span>
            </div>
            <div v-else class="message-text" v-html="renderMessage(msg.content)"></div>
          </div>
          <div v-if="msg.role === 'ai' && msg.status === 'success'" class="message-actions">
            <button class="action-btn" @click="copyMessage(msg.content)">
              <n-icon size="12"><CopyOutline /></n-icon>
              复制
            </button>
            <button class="action-btn primary" @click="insertToEditor(msg.content)">
              <n-icon size="12"><TextOutline /></n-icon>
              插入编辑器
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入框区域 - 固定在底部 -->
    <div class="ai-input-area">
      <textarea
        ref="inputRef"
        v-model="inputText"
        class="ai-textarea"
        placeholder="输入您的想法... (Shift + Enter 换行)"
        rows="3"
        @keydown="onKeydown"
      ></textarea>
      <div class="ai-input-actions">
        <div class="input-left">
          <button class="nexus-mini-pill" @click="addContext">
            <n-icon size="12"><AddCircleOutline /></n-icon>
            添加上下文
          </button>
        </div>
        <button
          class="nexus-send-btn"
          :disabled="!inputText.trim() || loading"
          @click="handleSend"
        >
          <n-icon size="16"><SendOutline /></n-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { SparklesOutline, CloseOutline, CopyOutline, TextOutline, SendOutline, AddCircleOutline, PersonOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { useDocAi } from '@/composables/useDocAi'

/**
 * 消息接口
 */
interface Message {
  role: 'user' | 'ai'
  content: string
  status: 'loading' | 'success' | 'error'
}

const props = defineProps<{
  fileName?: string
  getEditorContent?: () => string
  getSelectedText?: () => string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'insert', content: string): void
}>()

const message = useMessage()
const inputRef = ref<HTMLTextAreaElement>()
const messagesRef = ref<HTMLElement>()
const inputText = ref('')
const messages = ref<Message[]>([])
const loading = ref(false)

const docAi = useDocAi(props.fileName || '未命名文档')

const hasInteraction = computed(() => messages.value.length > 0)

/**
 * 渲染消息内容 - 将纯文本转换为 HTML 显示
 */
function renderMessage(content: string): string {
  if (!content) return ''
  // 转义 HTML 特殊字符
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // 将换行符转换为 <br>
  html = html.replace(/\n/g, '<br>')
  
  return html
}

/**
 * 滚动到底部
 */
function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

/**
 * 监听消息变化，自动滚动
 */
watch(() => messages.value.length, scrollToBottom)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

/**
 * 处理发送消息
 */
async function handleSend() {
  const content = inputText.value.trim()
  if (!content || loading.value) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: content,
    status: 'success'
  })

  inputText.value = ''
  loading.value = true

  // 添加 AI 加载中消息
  const aiIndex = messages.value.length
  messages.value.push({
    role: 'ai',
    content: '',
    status: 'loading'
  })

  scrollToBottom()

  try {
    const editorContent = props.getEditorContent?.() || ''
    const result = await docAi.chat(content, editorContent)
    
    // 更新 AI 消息
    messages.value[aiIndex] = {
      role: 'ai',
      content: result || '抱歉，AI 暂时无法回答您的问题。',
      status: 'success'
    }
  } catch (err) {
    messages.value[aiIndex] = {
      role: 'ai',
      content: '抱歉，AI 服务暂时不可用，请稍后重试。',
      status: 'error'
    }
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

/**
 * 复制消息内容
 */
function copyMessage(content: string) {
  navigator.clipboard.writeText(content).then(() => {
    message.success('已复制到剪贴板')
  })
}

/**
 * 插入到编辑器
 */
function insertToEditor(content: string) {
  emit('insert', content)
}

/**
 * 添加上下文（选中的文本）
 */
function addContext() {
  const selection = props.getSelectedText?.() || ''
  if (selection) {
    inputText.value += (inputText.value ? '\n\n' : '') + `选中内容：\n${selection}`
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.scrollTop = inputRef.value.scrollHeight
        inputRef.value.focus()
      }
    })
  } else {
    message.info('请先在编辑器中选中文本')
  }
}
</script>

<style scoped lang="scss">
.nexus-ai-panel {
  width: 320px;
  height: 100%;
  background: var(--nexus-bg-elevated);
  border-left: 1px solid var(--nexus-border);
  display: flex;
  flex-direction: column;
  font-family: var(--nexus-font-ui);
}

.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--nexus-border);
  flex-shrink: 0;
}

.ai-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--nexus-text-primary);
}

.close-btn {
  width: 28px;
  height: 28px;
}

/* 消息列表区域 - 可滚动 */
.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 欢迎消息 */
.ai-welcome {
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--nexus-radius-full);
  background: var(--nexus-text-primary);
  color: var(--nexus-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-welcome-text {
  font-size: 13px;
  color: var(--nexus-text-secondary);
  line-height: 1.6;

  p {
    margin: 0;
  }
}

/* 消息样式 */
.ai-message {
  display: flex;
  gap: 10px;
  
  &.user {
    flex-direction: row-reverse;
    
    .message-bubble {
      background: var(--nexus-text-primary);
      color: var(--nexus-text-inverse);
      border-bottom-right-radius: 4px;
    }
  }
  
  &.ai {
    .message-bubble {
      background: var(--nexus-divider);
      color: var(--nexus-text-primary);
      border-bottom-left-radius: 4px;
    }
  }
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--nexus-radius-full);
  background: var(--nexus-divider);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--nexus-text-secondary);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: calc(100% - 40px);
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.message-text {
  white-space: pre-wrap;
}

.loading-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
  
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--nexus-text-tertiary);
    animation: loadingBounce 1.4s infinite ease-in-out both;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes loadingBounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.message-actions {
  display: flex;
  gap: 8px;
  padding-left: 4px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--nexus-radius-full);
  border: 1px solid var(--nexus-border);
  background: transparent;
  color: var(--nexus-text-tertiary);
  font-size: 11px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);
  
  &:hover {
    border-color: var(--nexus-text-primary);
    color: var(--nexus-text-primary);
  }
  
  &.primary {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
    border-color: var(--nexus-text-primary);
    
    &:hover {
      background: var(--nexus-text-secondary);
    }
  }
}

/* 输入框区域 - 固定在底部 */
.ai-input-area {
  padding: 12px 16px;
  border-top: 1px solid var(--nexus-border);
  background: var(--nexus-bg);
  flex-shrink: 0;
}

.ai-textarea {
  width: 100%;
  min-height: 60px;
  max-height: 120px;
  padding: 10px 12px;
  border-radius: var(--nexus-radius-lg);
  border: 1px solid var(--nexus-border);
  background: var(--nexus-bg-elevated);
  color: var(--nexus-text-primary);
  font-size: 13px;
  font-family: var(--nexus-font-ui);
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 200ms var(--nexus-ease);

  &::placeholder {
    color: var(--nexus-text-tertiary);
  }

  &:focus {
    border-color: var(--nexus-text-primary);
  }
}

.ai-input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.input-left {
  display: flex;
  gap: 6px;
}

.nexus-send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--nexus-radius-full);
  border: none;
  background: var(--nexus-text-primary);
  color: var(--nexus-text-inverse);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: var(--nexus-text-secondary);
  }
}

/* 通用按钮 */
.nexus-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--nexus-radius-full);
  border: none;
  background: transparent;
  color: var(--nexus-text-secondary);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
  }
}

.nexus-mini-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--nexus-radius-full);
  border: none;
  background: var(--nexus-divider);
  color: var(--nexus-text-secondary);
  font-size: 11px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
  }
}
</style>
