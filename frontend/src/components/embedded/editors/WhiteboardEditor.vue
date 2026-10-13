<template>
  <div class="editor-placeholder">
    <n-empty :description="placeholderText">
      <template #extra>
        <n-tag size="small" :bordered="false">Excalidraw · MIT</n-tag>
      </template>
    </n-empty>
  </div>
</template>

<script setup lang="ts">
/**
 * 白板编辑器本体（Excalidraw 接入位）
 * @description 遵守嵌入编辑器契约：吃 JSON / 吐 JSON。
 * Phase 1 实施时以 react-island 挂载 @excalidraw/excalidraw，
 * onChange 拿 scene JSON（elements/appState/files）向上 emit，
 * initialData 传入 props.modelValue；React 依赖隔离在本组件的独立 chunk。
 */
import { computed } from 'vue'
import type { EditorAdapterProps, EditorAdapterEmits } from '../types'

const props = defineProps<EditorAdapterProps>()
const emit = defineEmits<EditorAdapterEmits>()

const placeholderText = computed(() =>
  props.readonly ? '白板预览（待接入 Excalidraw）' : '白板编辑器（待接入 Excalidraw）'
)

// 契约占位：接入本体后，画布变更时调用
// emit('update:modelValue', sceneAsJson)
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
