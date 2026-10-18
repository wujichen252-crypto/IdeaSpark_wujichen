<template>
  <!-- 浮动 AI 工具栏（选中文字时显示） -->
  <Transition name="nexus-float">
    <div
      v-if="ctx.floatingAiVisible.value && ctx.hasTextSelection.value"
      class="nexus-floating-ai"
      :style="ctx.floatingAiStyle.value">
      <div class="nexus-floating-ai-inner">
        <button
          v-for="action in ctx.mdAiQuickActions.value.slice(0, 5)"
          :key="action.key"
          class="nexus-floating-ai-btn"
          :disabled="ctx.mdAiLoading.value"
          @click="ctx.handleFloatingAiAction(action.key)">
          {{ action.label }}
        </button>
        <button
          class="nexus-floating-ai-btn nexus-floating-ai-more"
          :disabled="ctx.mdAiLoading.value"
          @click="ctx.handleFloatingAiAction('translate')">
          翻译
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useMarkdownEditorContext } from '@/composables/useMarkdownEditor'

const ctx = useMarkdownEditorContext()
</script>
