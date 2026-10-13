<template>
  <div class="editor-placeholder">
    <n-empty :description="placeholderText">
      <template #extra>
        <n-tag size="small" :bordered="false">LogicFlow · Apache-2.0</n-tag>
      </template>
    </n-empty>
  </div>
</template>

<script setup lang="ts">
/**
 * 流程图编辑器本体（LogicFlow 接入位）
 * @description 遵守嵌入编辑器契约：吃 JSON / 吐 JSON。
 * Phase 1 实施时 npm 直入 @logicflow/core + @logicflow/extension，
 * 监听 events 变更后调用 graphModel.getData() 取 graphData JSON 向上 emit，
 * 初始化时用 props.modelValue 调用 graph.render(data)
 */
import { computed } from 'vue'
import type { EditorAdapterProps, EditorAdapterEmits } from '../types'

const props = defineProps<EditorAdapterProps>()
const emit = defineEmits<EditorAdapterEmits>()

const placeholderText = computed(() =>
  props.readonly ? '流程图预览（待接入 LogicFlow）' : '流程图编辑器（待接入 LogicFlow）'
)

// 契约占位：接入本体后，图数据变更时调用
// emit('update:modelValue', graphDataJson)
void emit
</script>

<style scoped lang="scss">
.editor-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
