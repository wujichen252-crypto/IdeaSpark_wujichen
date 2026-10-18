<template>
  <div v-if="editor.showAiPanel.value && !editor.presentMode.value" class="se-ai-panel">
    <div class="ai-panel-header">
      <div class="ai-panel-title">
        <n-icon size="16"><Sparkles /></n-icon>
        <span>IdeaSpark AI</span>
      </div>
      <button class="nexus-icon-btn" @click="editor.showAiPanel.value = false">
        <n-icon size="16"><X /></n-icon>
      </button>
    </div>

    <!-- 对话消息区域 -->
    <div class="ai-messages-area" ref="aiMessagesRef">
      <div class="ai-welcome" v-if="editor.aiMessages.value.length === 0 && !editor.aiLoading.value">
        <div class="ai-avatar">
          <n-icon size="20"><Sparkles /></n-icon>
        </div>
        <div class="ai-welcome-text">
          <p>你好！我是 IdeaSpark AI 助手。</p>
          <p>我可以帮助你生成大纲、扩写内容、添加演讲备注或提供设计建议。</p>
        </div>
      </div>

      <div class="ai-quick-actions" v-if="editor.aiMessages.value.length === 0 && !editor.aiLoading.value">
        <button
          v-for="action in editor.slideAiActions"
          :key="action.key"
          class="nexus-pill-btn ai-action-btn"
          @click="editor.executeAiAction(action.key)"
        >
          <Sparkles class="nexus-icon" />
          {{ action.label }}
        </button>
      </div>

      <div class="ai-messages-list" v-if="editor.aiMessages.value.length > 0">
        <div
          v-for="(msg, index) in editor.aiMessages.value"
          :key="index"
          class="ai-message"
          :class="msg.role"
        >
          <div class="message-avatar">
            <n-icon v-if="msg.role === 'ai'" size="14"><Sparkles /></n-icon>
            <n-icon v-else size="14"><User /></n-icon>
          </div>
          <div class="message-content">
            <div class="message-bubble" v-html="editor.renderMessageContent(msg.content)"></div>
          </div>
        </div>
      </div>

      <div v-if="editor.aiLoading.value" class="ai-loading">
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <span>AI 正在思考中...</span>
      </div>
    </div>

    <!-- 结果操作按钮 -->
    <div v-if="editor.aiResult.value && !editor.aiLoading.value" class="ai-result-actions">
      <button class="nexus-ghost-btn" @click="editor.copyResult()">
        <n-icon size="14"><Copy /></n-icon>
        复制
      </button>
      <button class="nexus-ghost-btn" @click="editor.applyResult()">
        <n-icon size="14"><Check /></n-icon>
        应用
      </button>
    </div>

    <!-- 输入框 -->
    <div class="ai-input-area">
      <textarea
        v-model="editor.aiInputText.value"
        class="ai-textarea"
        placeholder="输入您的想法... (Shift + Enter 换行)"
        rows="1"
        @keydown="editor.onAiKeydown($event)"
      ></textarea>
      <button
        class="nexus-send-btn"
        :disabled="!editor.aiInputText.value.trim() || editor.aiLoading.value"
        @click="editor.sendAiMessage()"
      >
        <n-icon size="16"><Send /></n-icon>
      </button>
    </div>

    <!-- AI生成PPT全局加载遮罩 -->
    <div v-if="editor.aiLoading.value && editor.isGeneratingSlides.value" class="ai-generating-overlay">
      <div class="ai-generating-content">
        <div class="ai-generating-spinner">
          <n-icon size="48" color="#10b981"><Sparkles /></n-icon>
        </div>
        <div class="ai-generating-text">AI 正在生成演示文稿...</div>
        <div class="ai-generating-subtext">请稍候，正在为您创建精彩内容</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Sparkles,
  X,
  Copy,
  Check,
  Send,
  User
} from 'lucide-vue-next'
import { useSlideEditorContext } from '@/composables/useSlideEditor'

const editor = useSlideEditorContext()
// 将共享的 ref 暴露给模板 ref 绑定，供滚动到底部逻辑使用
const aiMessagesRef = editor.aiMessagesRef
</script>
