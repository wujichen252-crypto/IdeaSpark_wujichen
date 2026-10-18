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
