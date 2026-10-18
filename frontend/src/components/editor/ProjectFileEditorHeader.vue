<template>
  <header class="nexus-editor-header">
    <div class="header-left">
      <n-button
        circle
        quaternary
        class="nexus-header-btn"
        @click="ctx.handleBack()">
        <template #icon>
          <n-icon :component="ArrowBackOutline" />
        </template>
      </n-button>
      <div class="nexus-divider-v"></div>
      <div class="file-title">{{ ctx.file.value?.name || '未找到文件' }}</div>
      <div
        class="save-status"
        :class="ctx.saveStatus.value">
        <span class="save-dot"></span>
        <span class="save-label">
          {{ ctx.saveStatus.value === 'saved' ? '已保存' : ctx.saveStatus.value === 'saving' ? '保存中...' : '未保存' }}
        </span>
      </div>
    </div>
    <div class="header-right">
      <n-button
        circle
        quaternary
        class="nexus-header-btn"
        :class="{ 'nexus-header-btn-active': ctx.showAi.value }"
        @click="ctx.showAi.value = !ctx.showAi.value">
        <template #icon>
          <n-icon :component="ctx.showAi.value ? Sparkles : SparklesOutline" />
        </template>
      </n-button>

      <n-button
        circle
        quaternary
        class="nexus-header-btn"
        @click="ctx.handleExport()">
        <template #icon><n-icon :component="DownloadOutline" /></template>
      </n-button>

      <n-button
        class="nexus-save-btn"
        :disabled="!ctx.file.value"
        :loading="ctx.saveStatus.value === 'saving'"
        @click="ctx.handleSave()">
        保存
      </n-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { ArrowBackOutline, DownloadOutline, SparklesOutline, Sparkles } from '@vicons/ionicons5'
import { useProjectFileEditorContext } from '@/composables/useProjectFileEditor'

const ctx = useProjectFileEditorContext()
</script>
