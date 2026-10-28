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

<style scoped lang="scss">
/* 这些样式必须写在组件内部：父视图 ProjectFileEditorView 使用 scoped 样式，
   而 scoped 只会把父级作用域 id 加到子组件根元素上，其内部节点（.header-left /
   .file-title / .save-status 等）此前完全拿不到样式，导致头部内部纵向堆叠、
   内容溢出 56px 固定高度。 */
.nexus-editor-header {
  height: var(--header-height);
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--nexus-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: var(--nexus-z-nav);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.nexus-header-btn {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: var(--nexus-radius-full);
  transition: background-color 200ms cubic-bezier(0.16, 1, 0.3, 1), color 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.nexus-header-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.nexus-header-btn-active {
  background: var(--nexus-text-primary) !important;
  color: var(--nexus-white) !important;
}

.nexus-divider-v {
  width: 1px;
  height: 20px;
  flex: 0 0 1px;
  background: rgba(0, 0, 0, 0.08);
}

.file-title {
  max-width: 520px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: var(--nexus-text-primary);
  font-size: var(--nexus-font-size-base);
  letter-spacing: -0.01em;
}

.save-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  font-size: var(--nexus-font-size-xs);
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--nexus-radius-full);
  transition: color 200ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.save-status.saved {
  color: var(--nexus-text-tertiary);
  background: rgba(0, 0, 0, 0.04);
}

.save-status.saving {
  color: #d97706;
  background: rgba(217, 119, 6, 0.08);
}

.save-status.unsaved {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.06);
}

.save-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.save-status.saving .save-dot {
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.nexus-save-btn {
  height: 34px;
  padding: 0 18px;
  border-radius: var(--nexus-radius-full);
  background: var(--nexus-text-primary);
  color: var(--nexus-white);
  font-size: var(--nexus-font-size-sm);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms cubic-bezier(0.16, 1, 0.3, 1);
  font-family: var(--nexus-font-ui);
}

.nexus-save-btn:hover {
  background: var(--nexus-accent-hover);
}

.nexus-save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 窄屏：标题空间被右侧按钮挤压，隐藏状态文案只留圆点，给文件名留出可读宽度 */
@media (max-width: 600px) {
  .nexus-editor-header {
    padding: 0 12px;
  }

  .header-left {
    gap: 8px;
  }

  .file-title {
    max-width: none;
  }

  .save-label {
    display: none;
  }

  .save-status {
    padding: 4px 6px;
  }

  .nexus-save-btn {
    padding: 0 12px;
  }
}
</style>
