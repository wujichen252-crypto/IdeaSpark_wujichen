<template>
  <div class="editor-placeholder">
    <n-empty :description="placeholderText">
      <template #extra>
        <n-tag size="small" :bordered="false">simple-mind-map · MIT</n-tag>
      </template>
    </n-empty>
  </div>
</template>

<script setup lang="ts">
/**
 * 思维导图编辑器本体（simple-mind-map 接入位）
 * @description 遵守嵌入编辑器契约：吃 JSON / 吐 JSON。
 * Phase 1 实施时 npm 直入 simple-mind-map，挂载到容器 div，
 * 监听 data_change 事件将导图 JSON 向上 emit，
 * 初始化时用 props.modelValue 调用 setData()
 */
import { computed } from 'vue'
import type { EditorAdapterProps, EditorAdapterEmits } from '../types'

const props = defineProps<EditorAdapterProps>()
const emit = defineEmits<EditorAdapterEmits>()

const placeholderText = computed(() =>
  props.readonly ? '思维导图预览（待接入 simple-mind-map）' : '思维导图编辑器（待接入 simple-mind-map）'
)

// 契约占位：接入本体后，数据变更时调用
// emit('update:modelValue', mindmapDataJson)
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
