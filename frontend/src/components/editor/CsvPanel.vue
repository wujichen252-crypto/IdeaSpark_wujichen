<template>
  <div class="editor-csv">
    <div class="csv-toolbar">
      <n-radio-group v-model:value="ctx.csvMode.value" size="small">
        <n-radio-button value="preview">表格预览</n-radio-button>
        <n-radio-button value="source">源码编辑</n-radio-button>
      </n-radio-group>
    </div>

    <div v-if="ctx.csvMode.value === 'preview'" class="nexus-glass-panel csv-preview-panel">
      <n-data-table
        :columns="ctx.csvColumns.value"
        :data="ctx.csvRows.value"
        :max-height="560"
        :striped="true" />
    </div>

    <div v-else class="nexus-glass-panel csv-source-panel">
      <n-input
        v-model:value="ctx.content.value"
        type="textarea"
        :autosize="{ minRows: 22 }"
        placeholder="输入 CSV 内容..."
        class="mono-editor nexus-mono-input"
        @input="ctx.handleCsvInput" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NRadioGroup, NRadioButton, NDataTable, NInput } from 'naive-ui'
import { useProjectFileEditorContext } from '@/composables/useProjectFileEditor'

const ctx = useProjectFileEditorContext()
</script>

<style scoped lang="scss">
/* CSV 面板样式必须声明在组件内部：父视图 ProjectFileEditorView 使用 scoped 样式，
   父作用域 id 只落在子组件根元素上，.csv-toolbar / .csv-preview-panel /
   .csv-source-panel 等内部节点拿不到样式（工具栏失去玻璃态与横向排布、
   预览与源码面板失去 flex:1 与内边距）。 */
.editor-csv {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--nexus-space-4);
}

.csv-toolbar {
  @include nexus-glass;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px var(--nexus-space-4);
}

.csv-preview-panel {
  flex: 1;
  min-height: 0;
  padding: var(--nexus-space-4);
}

.csv-source-panel {
  flex: 1;
  min-height: 0;
  padding: var(--nexus-space-4);
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
</style>
