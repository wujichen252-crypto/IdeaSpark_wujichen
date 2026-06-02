<template>
  <div class="ai-message" :class="message.role">
    <div class="avatar">
      <n-avatar 
        round 
        :size="message.role === 'ai' ? 28 : 24" 
        :src="avatarSrc"
        :color="message.role === 'ai' ? '#dcfce7' : '#f1f5f9'"
      >
        <n-icon v-if="message.role === 'ai'" color="#22c55e" :size="14"><Sparkles /></n-icon>
        <n-icon v-else color="#64748b" :size="14"><PersonOutline /></n-icon>
      </n-avatar>
    </div>
    
    <div class="content-wrapper">
      <div v-if="message.role === 'ai'" class="sender-name">IdeaSpark AI</div>
      
      <div class="bubble" :class="{ loading: message.status === 'loading' }">
        <!-- Loading Indicator -->
        <div v-if="message.status === 'loading'" class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
        
        <!-- Content -->
        <template v-else>
          <div v-if="hasCodeBlocks" class="message-body">
            <template v-for="(segment, idx) in segments" :key="idx">
              <div v-if="segment.type === 'code'" class="code-block-wrapper">
                <div class="code-header">
                  <span class="lang">{{ segment.lang }}</span>
                  <div class="actions">
                    <n-button size="tiny" text @click="copyCode(segment.content || '')">
                      <template #icon><n-icon :size="14"><CopyOutline /></n-icon></template>
                      复制
                    </n-button>
                    <n-button size="tiny" text @click="handleSaveCode(segment.content || '', segment.lang || '')">
                      <template #icon><n-icon :size="14"><SaveOutline /></n-icon></template>
                      插入编辑器
                    </n-button>
                  </div>
                </div>
                <pre><code>{{ segment.content }}</code></pre>
              </div>
              <div v-else class="text-content" v-html="renderMarkdown(segment.content || '')"></div>
            </template>
          </div>
          <div v-else class="text-content" v-html="renderMarkdown(message.content || '')"></div>
        </template>
      </div>
      
      <!-- Message Actions for AI -->
      <div v-if="message.role === 'ai' && message.status !== 'loading' && message.content" class="message-actions">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
size="tiny"
quaternary
circle
@click="handleSaveText">
              <template #icon><n-icon :size="14"><SaveOutline /></n-icon></template>
            </n-button>
          </template>
          插入编辑器
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
size="tiny"
quaternary
circle
@click="copyMessage">
              <template #icon><n-icon :size="14"><CopyOutline /></n-icon></template>
            </n-button>
          </template>
          复制全文
        </n-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/store'
import { CopyOutline, SaveOutline, Sparkles, PersonOutline } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'

const props = defineProps<{
  message: {
    role: string
    content: string
    status?: string
    type: string
  }
}>()

const emit = defineEmits<{
  (e: 'save-code', payload: { code: string, lang: string }): void
}>()

const userStore = useUserStore()
const nMessage = useMessage()

const avatarSrc = computed(() => {
  if (props.message.role === 'user') {
    return userStore.userInfo?.avatar || undefined
  }
  return undefined
})

// Simple markdown renderer for chat bubbles
function renderMarkdown(text: string): string {
  if (!text) return ''
  let html = escapeHtml(text)
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>')
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  // Line breaks
  html = html.replace(/\n/g, '<br>')
  return html
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Parse content into segments (text and code blocks)
const segments = computed(() => {
  const content = props.message.content || ''
  const result: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = []
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  
  let lastIndex = 0
  let match: RegExpExecArray | null
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    }
    result.push({ type: 'code', lang: match[1] || 'text', content: match[2] || '' })
    lastIndex = match.index + match[0].length
  }
  
  if (lastIndex < content.length) {
    result.push({ type: 'text', content: content.slice(lastIndex) })
  }
  
  // If no code blocks at all, return empty so we fall back to simple render
  if (result.length === 0 && content.length > 0) {
    result.push({ type: 'text', content })
  }
  
  return result
})

const hasCodeBlocks = computed(() => segments.value.some(s => s.type === 'code'))

function copyCode(code: string) {
  navigator.clipboard.writeText(code)
  nMessage.success('代码已复制')
}

function copyMessage() {
  navigator.clipboard.writeText(props.message.content)
  nMessage.success('内容已复制')
}

function handleSaveCode(code: string, lang: string) {
  emit('save-code', { code, lang })
}

function handleSaveText() {
  emit('save-code', { code: props.message.content, lang: 'markdown' })
  nMessage.success('已插入编辑器')
}
</script>

<style scoped lang="scss">
.ai-message {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: flex-start;
  animation: messageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  
  @keyframes messageIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  &.user {
    flex-direction: row-reverse;
    
    .content-wrapper {
      align-items: flex-end;
      
      .bubble {
        background: #000;
        color: #fff;
        border-radius: 16px 16px 4px 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        
        .text-content {
          color: #fff;
          
          :deep(.inline-code) {
            background: rgba(255,255,255,0.25);
            color: #fff;
          }
          
          :deep(a) {
            color: #dcfce7;
            text-decoration: underline;
          }
          
          :deep(strong) {
            color: #fff;
          }
        }
      }
    }
  }
  
  &.ai {
    .content-wrapper {
      align-items: flex-start;
      
      .bubble {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 4px 16px 16px 16px;
        box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
        
        .text-content {
          color: #334155;
          
          :deep(.inline-code) {
            background: #f1f5f9;
            color: #0f172a;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 13px;
            font-family: 'Menlo', 'Monaco', monospace;
          }
          
          :deep(a) {
            color: #22c55e;
            text-decoration: none;
            &:hover { text-decoration: underline; }
          }
          
          :deep(strong) {
            color: #0f172a;
            font-weight: 600;
          }
          
          :deep(em) {
            color: #475569;
          }
          
          :deep(del) {
            color: #94a3b8;
          }
        }
      }
    }
  }

  .avatar {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    max-width: 85%;
    min-width: 0;
    
    .sender-name {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 4px;
      font-weight: 500;
    }
    
    .bubble {
      padding: 10px 14px;
      line-height: 1.6;
      font-size: 14px;
      position: relative;
      overflow: hidden;
      transition: all 0.2s ease;
      
      &.loading {
        min-width: 60px;
        min-height: 36px;
        display: flex;
        align-items: center;
      }
      
      .text-content {
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 14px;
        line-height: 1.7;
      }
      
      .code-block-wrapper {
        margin: 10px 0;
        border-radius: 10px;
        overflow: hidden;
        background: #0f172a;
        color: #e2e8f0;
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        
        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(255,255,255,0.05);
          font-size: 12px;
          color: #94a3b8;
          border-bottom: 1px solid rgba(255,255,255,0.05);

          .lang {
            text-transform: uppercase;
            font-weight: 500;
            letter-spacing: 0.5px;
          }

          .actions {
            display: flex;
            gap: 8px;
          }
        }
        
        pre {
          margin: 0;
          padding: 12px;
          overflow-x: auto;
          max-width: 100%;
          
          code {
            font-size: 13px;
            line-height: 1.5;
            color: #e2e8f0;
          }
        }
      }
    }
    
    .message-actions {
      display: flex;
      gap: 2px;
      margin-top: 6px;
      opacity: 0;
      transition: opacity 0.2s;
      padding-left: 4px;
    }
    
    &:hover .message-actions {
      opacity: 1;
    }
  }
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
  align-items: center;
  
  span {
    width: 6px;
    height: 6px;
    background: #94a3b8;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
