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

<style scoped lang="scss">
/* 幻灯片面板样式必须声明在组件内部：父视图 ProjectFileEditorView 的样式是 scoped 的，
   scoped 只会把父作用域 id 加到子组件根元素上，.slides-sider / .slides-list /
   .slide-item / .slides-main 等内部节点拿不到任何样式，导致窄屏下侧栏与编辑区
   各自塌缩成不可用宽度。 */
.editor-slides {
  flex: 1;
  display: flex;
  gap: 16px;
  min-width: 0;
}

.slides-sider {
  width: 220px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.slides-sider-header {
  padding: 14px 16px;
  font-weight: 600;
  color: var(--nexus-text-primary);
  border-bottom: 1px solid var(--nexus-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: var(--nexus-font-size-base);
}

.slides-sider-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nexus-pill-btn {
  border-radius: var(--nexus-radius-full) !important;
}

.slides-list {
  padding: 12px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slide-item {
  padding: 10px;
  border-radius: var(--nexus-radius-md);
  border: 1px solid var(--nexus-border-light);
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-item:hover {
  border-color: rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.02);
}

.slide-item.active {
  border-color: var(--nexus-text-primary);
  background: rgba(0, 0, 0, 0.04);
}

.slide-item-title {
  font-weight: 600;
  color: var(--nexus-text-primary);
  font-size: var(--nexus-font-size-sm);
}

.slide-item-sub {
  margin-top: 4px;
  font-size: var(--nexus-font-size-xs);
  color: var(--nexus-text-tertiary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.slides-main {
  flex: 1;
  min-width: 0;
  padding: 16px;
}

.mono-editor {
  height: 100%;
  font-family: var(--nexus-font-mono);
}

.nexus-mono-input {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  font-size: var(--nexus-font-size-base);
  line-height: var(--nexus-leading-prose);
  padding: 0 !important;
}

/* 窄屏：页列表由侧栏改为顶部横向条，编辑区独占整宽 */
@media (max-width: 960px) {
  .editor-slides {
    flex-direction: column;
    gap: 12px;
  }

  .slides-sider {
    width: 100%;
    flex: 0 0 auto;
    max-height: 148px;
  }

  .slides-list {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 10px;
  }

  .slide-item {
    flex: 0 0 132px;
  }

  .slides-main {
    flex: 1 1 auto;
    min-height: 0;
    padding: 12px;
  }
}
</style>
