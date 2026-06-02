<template>
  <aside class="nexus-ai-sidebar">
    <!-- Header -->
    <div class="nexus-ai-header">
      <div class="nexus-ai-title">
        <n-icon size="18" color="#10b981">
          <Sparkles />
        </n-icon>
        <span>IdeaSpark AI</span>
        <span class="nexus-ai-status">在线</span>
      </div>
    </div>

    <!-- Content -->
    <div class="nexus-ai-content">
      <!-- Smart Generate -->
      <div class="ai-smart-generate">
        <div class="ai-section-label">智能生成</div>
        <div class="smart-gen-input-wrap">
          <input
            v-model="smartGenInput"
            class="smart-gen-input"
            placeholder="输入表格描述，如：销售数据表"
            @keydown.enter="handleSmartGenerate"
          />
          <button
            class="smart-gen-btn"
            :disabled="!smartGenInput.trim() || smartGenLoading"
            @click="handleSmartGenerate"
          >
            <n-icon size="14"><Sparkles /></n-icon>
            生成
          </button>
        </div>
        <div class="smart-gen-examples">
          <span class="example-tag" @click="smartGenInput = '销售数据表'">销售数据表</span>
          <span class="example-tag" @click="smartGenInput = '员工信息表'">员工信息表</span>
          <span class="example-tag" @click="smartGenInput = '财务报表'">财务报表</span>
        </div>
      </div>

      <!-- Quick Actions -->
      <div v-if="quickActions.length" class="ai-quick-actions">
        <div class="ai-section-label">快捷操作</div>
        <div class="ai-action-grid">
          <button
            v-for="action in quickActions"
            :key="action.key"
            class="ai-action-pill"
            :disabled="loading"
            @click="handleQuickAction(action)"
          >
            {{ action.label }}
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div ref="messagesRef" class="ai-messages">
        <div v-if="!messages.length" class="ai-empty">
          <div class="ai-empty-icon">
            <n-icon size="32" color="#e5e7eb">
              <Sparkles />
            </n-icon>
          </div>
          <p class="ai-empty-title">AI 助手</p>
          <p class="ai-empty-desc">描述你的需求，让 AI 帮你编辑文档</p>
        </div>

        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="ai-message"
          :class="msg.role"
        >
          <div class="ai-message-avatar">
            <n-avatar
              v-if="msg.role === 'ai'"
              round
              :size="28"
              :style="{ background: '#dcfce7', color: '#166534' }"
            >
              <n-icon size="14"><Sparkles /></n-icon>
            </n-avatar>
            <n-avatar
              v-else
              round
              :size="28"
              :style="{ background: '#f3f4f6', color: '#374151' }"
            >
              {{ userInitial }}
            </n-avatar>
          </div>
          <div class="ai-message-body">
            <div class="ai-message-bubble" :class="[msg.role, { 'thinking': msg.isThinking }]">
              <!-- 思考过程展示 -->
              <div v-if="msg.isThinking" class="ai-thinking-process">
                <div class="thinking-header">
                  <n-icon size="14"><Sparkles /></n-icon>
                  <span>思考中</span>
                </div>
                <div class="thinking-content">{{ msg.content }}</div>
              </div>
              <!-- 加载动画 -->
              <div v-else-if="msg.status === 'loading' && !msg.isThinking" class="ai-loading">
                <span class="ai-loading-dot" ></span>
                <span class="ai-loading-dot" ></span>
                <span class="ai-loading-dot" ></span>
              </div>
              <!-- 正常内容 -->
              <div v-else class="ai-message-text" v-html="renderMarkdown(msg.content)" ></div>
            </div>
            <div v-if="msg.role === 'ai' && msg.status !== 'loading' && !msg.isThinking" class="ai-message-actions">
              <button class="ai-msg-btn" @click="$emit('apply', msg.content)">
                <n-icon size="12"><Checkmark /></n-icon>
                应用
              </button>
              <button class="ai-msg-btn" @click="copyText(msg.content)">
                <n-icon size="12"><CopyOutline /></n-icon>
                复制
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="nexus-ai-input-area">
      <div class="ai-input-wrap">
        <textarea
          v-model="inputText"
          class="ai-input"
          rows="2"
          placeholder="输入指令，按 Enter 发送..."
          @keydown.enter.prevent="handleSend"
          @keydown.delete.stop
          @keydown.backspace.stop
        ></textarea>
        <button
          class="ai-send-btn"
          :disabled="!inputText.trim() || loading"
          @click="handleSend"
        >
          <n-icon size="16"><Send /></n-icon>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import {
  Sparkles,
  Checkmark,
  CopyOutline,
  Send
} from '@vicons/ionicons5'
import { useUserStore } from '@/store'
import { sendChatMessage } from '@/api/ai'
import type { ChatMessage } from '@/api/ai'

export interface QuickAction {
  key: string
  label: string
  prompt: string
}

interface Message {
  role: 'user' | 'ai'
  content: string
  status?: 'loading' | 'success' | 'error'
  isThinking?: boolean
}

const props = withDefaults(defineProps<{
  sessionId: string
  systemContext?: string
  quickActions?: QuickAction[]
}>(), {
  systemContext: '',
  quickActions: () => []
})

const emit = defineEmits<{
  (e: 'apply', content: string): void
  (e: 'action', actionKey: string): void
}>()

const userStore = useUserStore()
const userInitial = computed(() => {
  const name = userStore.user?.username || 'U'
  return name.charAt(0).toUpperCase()
})

const loading = ref(false)
const inputText = ref('')
const messagesRef = ref<HTMLElement | null>(null)
const messages = ref<Message[]>([])

// 智能生成相关
const smartGenInput = ref('')
const smartGenLoading = ref(false)

/**
 * 处理智能生成
 */
async function handleSmartGenerate() {
  const desc = smartGenInput.value.trim()
  if (!desc || smartGenLoading.value) return

  smartGenLoading.value = true

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: `请生成一个「${desc}」`,
    status: 'success'
  })

  // 添加 AI 加载中消息
  const aiIndex = messages.value.length
  messages.value.push({
    role: 'ai',
    content: '',
    status: 'loading'
  })

  scrollToBottom()

  try {
    const requestMessages: ChatMessage[] = [
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
        content: `请生成一个关于"${desc}"的 Excel 表格，包含 10 行数据。`
      }
    ]

    const res = await sendChatMessage({ messages: requestMessages })
    const content = res.data?.data?.message?.content || ''

    // 更新 AI 消息
    messages.value[aiIndex] = {
      role: 'ai',
      content: content || '生成失败，请重试',
      status: 'success'
    }

    // 清空输入
    smartGenInput.value = ''
  } catch (err) {
    messages.value[aiIndex] = {
      role: 'ai',
      content: '抱歉，AI 服务暂时不可用，请稍后重试。',
      status: 'error'
    }
  } finally {
    smartGenLoading.value = false
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

watch(() => messages.value.length, scrollToBottom)

function renderMarkdown(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px;">$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre style="background:#f9fafb;padding:12px;border-radius:8px;overflow:auto;font-size:12px;"><code>$1</code></pre>')
    .replace(/\n/g, '<br>')
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  loading.value = true

  const aiIndex = messages.value.length
  // 添加思考中的消息
  messages.value.push({ role: 'ai', content: '', status: 'loading', isThinking: true })
  scrollToBottom()

  try {
    const chatMessages: ChatMessage[] = []
    if (props.systemContext) {
      chatMessages.push({ role: 'system', content: props.systemContext })
    }
    // Include last 6 messages for context
    const recent = messages.value.slice(-7, -1)
    recent.forEach(m => {
      if (m.status !== 'loading') {
        chatMessages.push({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.content
        })
      }
    })

    const res = await sendChatMessage({ messages: chatMessages })
    const content = res.data?.data?.message?.content || ''

    // 模拟思考过程展示
    messages.value[aiIndex] = { role: 'ai', content: '', status: 'loading', isThinking: true }
    
    // 流式展示思考过程
    const thinkingSteps = [
      '正在分析问题...',
      '正在整理思路...',
      '正在生成内容...'
    ]
    
    for (let i = 0; i < thinkingSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400))
      messages.value[aiIndex] = { 
        role: 'ai', 
        content: thinkingSteps.slice(0, i + 1).join('\n'), 
        status: 'loading',
        isThinking: true 
      }
      scrollToBottom()
    }
    
    await new Promise(resolve => setTimeout(resolve, 300))
    messages.value[aiIndex] = { role: 'ai', content, status: 'success' }
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

function handleQuickAction(action: QuickAction) {
  // 如果 action 有 key，触发 action 事件让父组件处理
  if (action.key) {
    emit('action', action.key)
  } else {
    // 否则使用旧的逻辑
    inputText.value = action.prompt
    handleSend()
  }
}

function copyText(text: string) {
  navigator.clipboard.writeText(text)
}

defineExpose({
  handleSend,
  messages
})
</script>

<style scoped lang="scss">
@import '@/styles/mixins.scss';

.nexus-ai-sidebar {
  width: 380px;
  min-width: 380px;
  background: var(--nexus-bg-elevated);
  border-left: 2px solid var(--nexus-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.05);
}

.nexus-ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--nexus-border);
  flex-shrink: 0;
}

.nexus-ai-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--nexus-text-primary);
}

.nexus-ai-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 400;
  color: var(--nexus-success);

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--nexus-success);
    animation: pulse-dot 2s ease-in-out infinite;
  }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.nexus-ai-content {
  flex: 1;
  overflow-y: auto;
  @include nexus-scrollbar;
  padding: 16px;
}

.ai-quick-actions {
  margin-bottom: 16px;
}

.ai-section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--nexus-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.ai-action-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

// 智能生成样式
.ai-smart-generate {
  padding: 16px;
  border-bottom: 1px solid var(--nexus-border);
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

.smart-gen-input-wrap {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.smart-gen-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--nexus-border);
  border-radius: var(--nexus-radius-lg);
  font-size: 13px;
  font-family: var(--nexus-font-ui);
  background: var(--nexus-bg);
  color: var(--nexus-text-primary);
  outline: none;
  transition: border-color 200ms var(--nexus-ease);

  &:focus {
    border-color: var(--nexus-success);
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
  }

  &::placeholder {
    color: var(--nexus-text-tertiary);
  }
}

.smart-gen-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: var(--nexus-radius-lg);
  border: none;
  background: var(--nexus-success);
  color: white;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);
  flex-shrink: 0;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: #059669;
  }
}

.smart-gen-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.example-tag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--nexus-radius-full);
  background: var(--nexus-divider);
  color: var(--nexus-text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
  }
}

.ai-action-pill {
  padding: 6px 14px;
  background: var(--nexus-divider);
  color: var(--nexus-text-secondary);
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);
  font-family: var(--nexus-font-ui);

  &:hover {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ai-messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-empty {
  text-align: center;
  padding: 40px 0;
}

.ai-empty-icon {
  margin-bottom: 12px;
}

.ai-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--nexus-text-primary);
  margin-bottom: 4px;
}

.ai-empty-desc {
  font-size: 13px;
  color: var(--nexus-text-tertiary);
}

.ai-message {
  display: flex;
  gap: 10px;

  &.user {
    flex-direction: row-reverse;
  }
}

.ai-message-avatar {
  flex-shrink: 0;
}

.ai-message-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: calc(100% - 44px);
}

.ai-message-bubble {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;

  &.user {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
    border-bottom-right-radius: 4px;
  }

  &.ai {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
    border-bottom-left-radius: 4px;
  }

  &.thinking {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1px solid #86efac;
  }
}

.ai-thinking-process {
  .thinking-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #16a34a;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px dashed #86efac;
  }

  .thinking-content {
    font-size: 12px;
    color: #166534;
    line-height: 1.8;
    white-space: pre-line;
  }
}

.ai-message-text {
  :deep(h1), :deep(h2), :deep(h3) {
    font-size: 14px;
    font-weight: 600;
    margin: 8px 0 4px;
  }

  :deep(pre) {
    margin: 8px 0;
  }
}

.ai-message-actions {
  display: flex;
  gap: 8px;
  padding-left: 4px;
}

.ai-msg-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: transparent;
  color: var(--nexus-text-tertiary);
  font-size: 11px;
  border-radius: 9999px;
  border: 1px solid var(--nexus-border);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);
  font-family: var(--nexus-font-ui);

  &:hover {
    border-color: var(--nexus-text-primary);
    color: var(--nexus-text-primary);
  }
}

.ai-loading {
  display: flex;
  gap: 4px;
  padding: 6px 0;
}

.ai-loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--nexus-text-tertiary);
  animation: bounce 1.4s infinite ease-in-out both;

  &:nth-child(1) { animation-delay: -0.32s; }
  &:nth-child(2) { animation-delay: -0.16s; }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.nexus-ai-input-area {
  padding: 14px 16px;
  border-top: 1px solid var(--nexus-border);
  background: var(--nexus-bg-elevated);
  flex-shrink: 0;
}

.ai-input-wrap {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: var(--nexus-bg);
  border: 1px solid var(--nexus-border);
  border-radius: 16px;
  padding: 8px 12px;
  transition: border-color 200ms var(--nexus-ease);

  &:focus-within {
    border-color: var(--nexus-text-primary);
  }
}

.ai-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--nexus-font-ui);
  font-size: 13px;
  color: var(--nexus-text-primary);
  resize: none;
  line-height: 1.5;
  max-height: 120px;

  &::placeholder {
    color: var(--nexus-text-tertiary);
  }
}

.ai-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--nexus-text-primary);
  color: var(--nexus-text-inverse);
  border-radius: 50%;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
  }
}
</style>
