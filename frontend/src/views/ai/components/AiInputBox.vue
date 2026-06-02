<template>
  <div class="ai-input-box" :class="{ mini: mode === 'mini' }">
    <div class="input-container" :class="{ focused: isFocused }">
      <div class="toolbar">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button quaternary circle size="small">
              <template #icon><n-icon><AttachOutline /></n-icon></template>
            </n-button>
          </template>
          上传文件 (暂未开放)
        </n-tooltip>
        
        <n-popselect
v-model:value="promptValue"
:options="promptOptions"
trigger="click"
@update:value="onSelectPrompt">
          <n-button quaternary circle size="small">
            <template #icon><n-icon><FlashOutline /></n-icon></template>
          </n-button>
        </n-popselect>
      </div>
      
      <n-input
        v-model:value="inputValue"
        type="textarea"
        placeholder="输入你的想法... (Shift + Enter 换行)"
        :autosize="{ minRows: 1, maxRows: 8 }"
        class="custom-textarea"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown.enter.prevent="handleEnter"
      />
      
      <div class="actions">
        <n-button 
          type="primary" 
          circle 
          class="send-btn" 
          :disabled="!inputValue.trim() || loading"
          @click="handleSend"
        >
          <template #icon>
            <n-icon v-if="!loading"><Send /></n-icon>
            <n-icon v-else><StopOutline /></n-icon>
          </template>
        </n-button>
      </div>
    </div>
    <div class="footer-tip">
      IdeaSpark AI 生成的内容可能不准确，请核对重要信息。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AttachOutline, FlashOutline, Send, StopOutline } from '@vicons/ionicons5'

const props = withDefaults(defineProps<{
  loading: boolean
  mode?: 'normal' | 'mini'
}>(), {
  mode: 'normal'
})

const emit = defineEmits<{
  (e: 'send', text: string): void
}>()

const inputValue = ref('')
const isFocused = ref(false)
const promptValue = ref(null)

const promptOptions = [
  { label: '解释代码', value: '请解释以下代码的工作原理：' },
  { label: '优化文案', value: '请帮我润色并优化以下文案，使其更具吸引力：' },
  { label: '生成代码', value: '请用 Vue 3 实现一个...' }
]

function handleEnter(e: KeyboardEvent) {
  if (!e.shiftKey) {
    handleSend()
  } else {
    // Manually insert newline if needed, but n-input handles textarea defaults usually. 
    // Actually n-input enter.prevent stops newline, so we are good.
    // We need to verify if Shift+Enter works by default when enter is prevented.
    // Usually preventing enter prevents submission, but we want Shift+Enter to insert newline.
    // NInput textarea mode usually handles this unless we prevent default on all Enters.
    // We only prevent on Enter without Shift.
    inputValue.value += '\n'
  }
}

function handleSend() {
  const text = inputValue.value.trim()
  if (!text || props.loading) return
  
  emit('send', text)
  inputValue.value = ''
}

function onSelectPrompt(val: string) {
  inputValue.value = val
}
</script>

<style scoped lang="scss">
.ai-input-box {
  padding: 0 24px 24px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  
  /* Mini 模式适配 */
  &.mini {
    padding: 12px;
    max-width: none;
    box-sizing: border-box;
    
    .input-container {
      padding: 8px 12px 8px 8px; /* 右侧留点空间给按钮 */
      border-radius: 20px; /* 更圆润 */
      flex-direction: row; /* 改为水平排列 */
      align-items: flex-end; /* 底部对齐 */
      gap: 8px;
      
      .toolbar {
        display: none; 
      }
      
      .custom-textarea {
        flex: 1; /* 占据剩余空间 */
        padding-bottom: 2px;
        
        :deep(.n-input__textarea-el) {
          font-size: 13px;
          min-height: 24px !important; /* 允许更矮 */
          max-height: 120px;
        }
      }

      .actions {
        margin-bottom: 2px; /* 微调对齐 */
        
        .send-btn {
          width: 32px;
          height: 32px;
          min-width: 32px;
        }
      }
    }
    
    .footer-tip {
      display: none; 
    }
  }
  
  .input-container {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 1rem;
    padding: 12px;
    box-sizing: border-box;
    box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    &.focused {
      border-color: #000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .toolbar {
      display: flex;
      gap: 8px;
    }
    
    .custom-textarea {
      :deep(.n-input__textarea-el) {
        padding: 0;
        font-size: 15px;
        line-height: 1.6;
      }
      :deep(.n-input-wrapper) {
        padding: 0;
      }
      --n-border: none !important;
      --n-border-hover: none !important;
      --n-border-focus: none !important;
      --n-box-shadow-focus: none !important;
      background: transparent;
    }
    
    .actions {
      display: flex;
      justify-content: flex-end;
      
      .send-btn {
        transition: all 0.2s;
        &[disabled] {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
  
  .footer-tip {
    text-align: center;
    font-size: 12px;
    color: #9ca3af;
    margin-top: 12px;
  }
}
</style>
