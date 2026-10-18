<template>
  <div class="markdown-editor-panel">
    <MarkdownToolbar
      :show-ai="showAi"
      @update:show-ai="emit('update:showAi', $event)" />

    <!-- 编辑区域 -->
    <div class="md-body" :class="{ 'preview-open': mdViewMode === 'split', 'ai-open': showAi }">
      <input
        ref="markdownImageInputRef"
        class="md-hidden-file"
        type="file"
        accept="image/*"
        multiple
        @change="ctx.handleMarkdownImagePick" />
      <div ref="markdownEditorHostRef" class="md-editor">
        <div
          v-if="mdViewMode === 'typora'"
          class="md-wysiwyg"
          @click="ctx.focusMarkdown"
          @dragover="ctx.handleEditorDragOver"
          @drop="ctx.handleEditorDrop">
          <div
            ref="mdTyporaEditorRef"
            class="md-typora-editor md-preview-content"
            contenteditable="true"
            spellcheck="false"
            @input="ctx.handleTyporaEditorInput"
            @change="ctx.handleTyporaEditorInput"
            @keydown="ctx.handleTyporaEditorKeydown"
          ></div>
        </div>
        <n-input
          v-else
          v-model:value="content"
          type="textarea"
          :autosize="{ minRows: 22 }"
          placeholder="# 开始编辑 Markdown..."
          class="mono-editor nexus-mono-input"
          @input="ctx.handleMarkdownInput"
          @drop="ctx.handleEditorDrop"
          @dragover="ctx.handleEditorDragOver"
        />
      </div>

      <div v-if="mdViewMode === 'split'" class="md-preview">
        <div class="nexus-glass-panel md-preview-panel">
          <div class="md-preview-header">预览</div>
          <div ref="markdownPreviewRef" class="md-preview-content"></div>
        </div>
      </div>

      <div v-if="showAi" class="md-ai">
        <NexusAiSidebar
          :session-id="sessionId"
          :system-context="systemContext"
          :quick-actions="mdAiQuickActions"
          @apply="ctx.handleAiApply"
        />
      </div>
    </div>

    <MarkdownFloatingAi />
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { NInput } from 'naive-ui'
import NexusAiSidebar from '@/components/ai/NexusAiSidebar.vue'
import MarkdownToolbar from './MarkdownToolbar.vue'
import MarkdownFloatingAi from './MarkdownFloatingAi.vue'
import {
  createMarkdownEditor,
  MARKDOWN_EDITOR_KEY
} from '@/composables/useMarkdownEditor'

const props = withDefaults(defineProps<{
  /** 编辑器内容 */
  modelValue: string
  /** 是否显示 AI 面板 */
  showAi?: boolean
  /** 会话 ID */
  sessionId?: string
  /** 系统上下文 */
  systemContext?: string
  /** 视图模式 */
  viewMode?: 'typora' | 'split' | 'source'
  /** 文件名 */
  fileName?: string
}>(), {
  showAi: false,
  sessionId: '',
  systemContext: '',
  viewMode: 'typora',
  fileName: '未命名文档'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:showAi', value: boolean): void
  (e: 'change'): void
  (e: 'save-file', payload: { code: string; lang: string }): void
  (e: 'undo-state-change', canUndo: boolean, canRedo: boolean): void
}>()

const ctx = createMarkdownEditor(props, emit)
provide(MARKDOWN_EDITOR_KEY, ctx)

// 模板所需的顶层响应式别名（ref 在模板中自动解包；DOM ref 需顶层绑定才能生效）
const content = ctx.content
const mdViewMode = ctx.mdViewMode
const mdAiQuickActions = ctx.mdAiQuickActions
const markdownImageInputRef = ctx.markdownImageInputRef
const markdownEditorHostRef = ctx.markdownEditorHostRef
const mdTyporaEditorRef = ctx.mdTyporaEditorRef
const markdownPreviewRef = ctx.markdownPreviewRef

// 受控属性需从 props 取，确保响应式
const showAi = computed(() => props.showAi)
const sessionId = computed(() => props.sessionId)
const systemContext = computed(() => props.systemContext)

// 保留对外契约（父组件 ProjectFileEditorView 依赖以下方法）
defineExpose({
  handleMdUndo: ctx.handleMdUndo,
  handleMdRedo: ctx.handleMdRedo,
  applyMdBold: ctx.applyMdBold,
  applyMdItalic: ctx.applyMdItalic,
  applyMdStrike: ctx.applyMdStrike,
  applyMdHeading: ctx.applyMdHeading,
  applyMdUnorderedList: ctx.applyMdUnorderedList,
  applyMdOrderedList: ctx.applyMdOrderedList,
  applyMdTaskList: ctx.applyMdTaskList,
  applyMdQuote: ctx.applyMdQuote,
  applyMdInlineCode: ctx.applyMdInlineCode,
  applyMdCodeBlock: ctx.applyMdCodeBlock,
  applyMdLink: ctx.applyMdLink,
  applyMdTable: ctx.applyMdTable,
  pickMarkdownImage: ctx.pickMarkdownImage,
  sendAiRewrite: ctx.sendAiRewrite,
  sendAiPolish: ctx.sendAiPolish,
  sendAiExpand: ctx.sendAiExpand,
  sendAiOutline: ctx.sendAiOutline,
  sendAiSummary: ctx.sendAiSummary,
  markdownSelection: ctx.markdownSelection
})
</script>

<style lang="scss" src="./MarkdownEditor.scss" />
