<template>
  <!-- Nexus 风格工具栏 -->
  <div class="nexus-toolbar">
    <div class="nexus-toolbar-group">
      <n-dropdown trigger="click" :options="ctx.viewModeOptions" @select="ctx.handleViewModeSelect">
        <n-button
          size="small"
          quaternary
          circle
          class="nexus-tool-btn"
          title="视图模式">
          <template #icon><n-icon :component="SwapHorizontalOutline" /></template>
        </n-button>
      </n-dropdown>

      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        :disabled="!ctx.canMdUndo.value"
        title="撤销（Ctrl+Z）"
        @click="ctx.handleMdUndo">
        <template #icon><n-icon :component="ArrowUndoOutline" /></template>
      </n-button>
      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        :disabled="!ctx.canMdRedo.value"
        title="重做（Ctrl+Y / Ctrl+Shift+Z）"
        @click="ctx.handleMdRedo">
        <template #icon><n-icon :component="ArrowRedoOutline" /></template>
      </n-button>

      <div class="nexus-divider"></div>

      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn nexus-tool-text"
        title="加粗（Ctrl+B）"
        @click="ctx.applyMdBold">
        <span class="nexus-bold">B</span>
      </n-button>
      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn nexus-tool-text"
        title="斜体（Ctrl+I）"
        @click="ctx.applyMdItalic">
        <span class="nexus-italic">I</span>
      </n-button>
      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn nexus-tool-text"
        title="删除线"
        @click="ctx.applyMdStrike">
        <span class="nexus-strike">S</span>
      </n-button>

      <n-dropdown trigger="click" :options="ctx.headingOptions" @select="ctx.handleHeadingSelect">
        <n-button
          size="small"
          quaternary
          circle
          class="nexus-tool-btn"
          title="标题">
          <template #icon><n-icon :component="TextOutline" /></template>
        </n-button>
      </n-dropdown>

      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        title="引用"
        @click="ctx.applyMdQuote">
        <template #icon><n-icon :component="ChatboxEllipsesOutline" /></template>
      </n-button>
      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        title="无序列表"
        @click="ctx.applyMdUnorderedList">
        <template #icon><n-icon :component="ListOutline" /></template>
      </n-button>
      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        title="有序列表"
        @click="ctx.applyMdOrderedList">
        <template #icon><n-icon :component="ReorderTwoOutline" /></template>
      </n-button>
      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        title="任务列表"
        @click="ctx.applyMdTaskList">
        <template #icon><n-icon :component="CheckboxOutline" /></template>
      </n-button>

      <div class="nexus-divider"></div>

      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        title="行内代码"
        @click="ctx.applyMdInlineCode">
        <template #icon><n-icon :component="CodeOutline" /></template>
      </n-button>
      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        title="代码块"
        @click="ctx.applyMdCodeBlock">
        <template #icon><n-icon :component="CodeSlashOutline" /></template>
      </n-button>
      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        title="链接（Ctrl+K）"
        @click="ctx.applyMdLink">
        <template #icon><n-icon :component="LinkOutline" /></template>
      </n-button>
      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        title="插入图片"
        @click="ctx.pickMarkdownImage">
        <template #icon><n-icon :component="ImageOutline" /></template>
      </n-button>
      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        title="表格"
        @click="ctx.applyMdTable">
        <template #icon><n-icon :component="GridOutline" /></template>
      </n-button>
    </div>

    <div class="nexus-toolbar-group">
      <n-button
        size="small"
        quaternary
        circle
        class="nexus-tool-btn"
        :class="{ 'nexus-tool-active': showAi }"
        title="AI 助手"
        @click="emit('update:showAi', !showAi)">
        <template #icon><n-icon :component="showAi ? Sparkles : SparklesOutline" /></template>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowUndoOutline,
  ArrowRedoOutline,
  ChatboxEllipsesOutline,
  CheckboxOutline,
  CodeOutline,
  CodeSlashOutline,
  GridOutline,
  ImageOutline,
  LinkOutline,
  ListOutline,
  ReorderTwoOutline,
  SparklesOutline,
  Sparkles,
  SwapHorizontalOutline,
  TextOutline
} from '@vicons/ionicons5'
import { NButton, NIcon, NDropdown } from 'naive-ui'
import { useMarkdownEditorContext } from '@/composables/useMarkdownEditor'

const props = defineProps<{ showAi?: boolean }>()
const emit = defineEmits<{ (e: 'update:showAi', value: boolean): void }>()

const ctx = useMarkdownEditorContext()
</script>
