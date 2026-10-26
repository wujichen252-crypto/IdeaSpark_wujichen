<template>
  <div ref="containerRef" class="mindmap-editor" :class="{ 'is-readonly': readonly }"></div>
</template>

<script setup lang="ts">
/**
 * 思维导图编辑器本体（simple-mind-map 接入）
 * @description 遵守嵌入编辑器契约：吃 JSON / 吐 JSON。
 * - 挂载时用 props.modelValue 作为初始数据（缺省用注册表空白负载）
 * - 监听 'data_change' 将导图数据向上 emit
 * - 通过 suppress 标志 + 负载比对，阻断 emit 被壳组件 markDirty 写回后的重渲染回环
 * - readonly 模式重建实例（simple-mind-map 无运行时只读切换 API）
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MindMap from 'simple-mind-map'
import type { MindMapData } from 'simple-mind-map'
import 'simple-mind-map/dist/simpleMindMap.esm.css'
import type { EditorAdapterProps, EditorAdapterEmits } from '../types'
import { isSamePayload } from './dataEqual'

const props = defineProps<EditorAdapterProps>()
const emit = defineEmits<EditorAdapterEmits>()

const containerRef = ref<HTMLElement | null>(null)
let instance: MindMap | null = null
/** 程序化 setData 期间抑制回显，避免触发 data_change 自循环 */
let suppress = false

const EMPTY: MindMapData = { data: { text: '中心主题' }, children: [] }

function getCurrent(): MindMapData {
  return instance ? (instance.getData(false) as MindMapData) : EMPTY
}

function handleChange(): void {
  if (suppress || !instance) return
  emit('update:modelValue', getCurrent() as unknown as Record<string, unknown>)
}

function applyExternal(data: MindMapData): void {
  if (!instance) return
  suppress = true
  try {
    instance.setData(data)
  } finally {
    suppress = false
  }
}

function buildInstance(): void {
  if (!containerRef.value) return
  const initial = ((props.modelValue as MindMapData) ?? EMPTY) as MindMapData
  instance = new MindMap({
    el: containerRef.value,
    data: initial,
    readonly: props.readonly ?? false,
  })
  instance.on('data_change', handleChange)
}

onMounted(() => {
  buildInstance()
})

// 壳组件异步加载 payload 后通过 prop 回灌真实数据；仅当与当前数据不一致时应用
watch(
  () => props.modelValue,
  (val) => {
    if (!instance || !val) return
    if (!isSamePayload(getCurrent(), val)) {
      applyExternal(val as MindMapData)
    }
  }
)

// readonly 切换：simple-mind-map 无运行时切换 API，重建实例
watch(
  () => props.readonly,
  () => {
    if (!containerRef.value) return
    if (instance) {
      instance.off('data_change', handleChange)
      instance.destroy()
      instance = null
    }
    buildInstance()
  }
)

onBeforeUnmount(() => {
  if (instance) {
    instance.off('data_change', handleChange)
    instance.destroy()
    instance = null
  }
})

defineExpose({ getInstance: () => instance })
</script>

<style scoped lang="scss">
.mindmap-editor {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--nexus-white);

  :deep(.smm-mind-map-container) {
    width: 100%;
    height: 100%;
  }
}
</style>
