<template>
  <div class="editor-slides">
    <div class="nexus-glass-panel slides-sider">
      <div class="slides-sider-header">
        <div class="slides-sider-title">页列表</div>
        <n-space size="small">
          <n-button
            size="tiny"
            secondary
            class="nexus-pill-btn"
            @click="ctx.addSlide()">新增</n-button>
          <n-button
            size="tiny"
            tertiary
            class="nexus-pill-btn"
            :disabled="ctx.slideBlocks.value.length <= 1"
            @click="ctx.removeSlide()">删除</n-button>
        </n-space>
      </div>
      <div class="slides-list">
        <div
          v-for="(s, idx) in ctx.slideBlocks.value"
          :key="idx"
          class="slide-item"
          :class="{ active: idx === ctx.activeSlideIndex.value }"
          @click="ctx.activeSlideIndex.value = idx">
          <div class="slide-item-title">第 {{ idx + 1 }} 页</div>
          <div class="slide-item-sub">{{ ctx.slideSummary(s) }}</div>
        </div>
      </div>
    </div>
    <div class="nexus-glass-panel slides-main">
      <n-input
        v-model:value="ctx.activeSlideContent.value"
        type="textarea"
        :autosize="{ minRows: 22 }"
        placeholder="编辑当前页内容..."
        class="mono-editor nexus-mono-input"
        @input="ctx.handleSlideInput" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NSpace, NInput } from 'naive-ui'
import { useProjectFileEditorContext } from '@/composables/useProjectFileEditor'

const ctx = useProjectFileEditorContext()
</script>
