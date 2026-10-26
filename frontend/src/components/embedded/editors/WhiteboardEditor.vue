<template>
  <div ref="containerRef" class="whiteboard-editor"></div>
</template>

<script setup lang="ts">
/**
 * 白板编辑器本体（Excalidraw 接入 · React 孤岛）
 * @description 遵守嵌入编辑器契约：吃 JSON / 吐 JSON。
 * - 用 ReactDOM.createRoot 将 Excalidraw（React 组件）挂载进 Vue 容器
 * - 挂载时以 props.modelValue（{ elements, appState, files }）作为 initialData
 * - onChange 把场景 JSON 向上 emit；通过"值比对"阻断 emit 被壳组件 markDirty 写回的回环
 * - 仅当外部 payload 与当前场景不一致时才 updateScene（覆盖式载入），避免连续 onChange 造成的重渲染风暴
 * - React 依赖经动态 import 隔离在本组件专属 chunk，不污染主包
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { EditorAdapterProps, EditorAdapterEmits } from '../types'
import { isSamePayload } from './dataEqual'

interface ScenePayload {
  elements: unknown[]
  appState: Record<string, unknown>
  files: Record<string, unknown>
}

const props = defineProps<EditorAdapterProps>()
const emit = defineEmits<EditorAdapterEmits>()

const containerRef = ref<HTMLElement | null>(null)
let root: Root | null = null
let api: any = null

const EMPTY: ScenePayload = { elements: [], appState: {}, files: {} }

/**
 * 清理 appState 中的非序列化字段（如 collaborators 为 Map），保证可 JSON 落盘且回读安全
 * @param appState - Excalidraw 当前 appState
 */
function sanitizeAppState(appState: any): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...appState }
  delete clone.collaborators
  for (const key of Object.keys(clone)) {
    const v = clone[key]
    if (v && typeof v === 'object' && (v.constructor === Map || v.constructor === Set)) {
      delete clone[key]
    }
  }
  return clone
}

/** 构造 Excalidraw initialData（缺省返回 undefined，由库启用空白画布） */
function toInitialData(val: unknown): { elements: unknown[]; appState: Record<string, unknown>; files: Record<string, unknown> } | undefined {
  if (!val) return undefined
  const d = val as Partial<ScenePayload>
  return {
    elements: d.elements ?? [],
    appState: d.appState ?? {},
    files: d.files ?? {},
  }
}

/** 读取当前画布场景（与 emit 负载同构，便于值比对） */
function currentScene(): ScenePayload {
  if (!api) return EMPTY
  return {
    elements: api.getSceneElements(),
    appState: sanitizeAppState(api.getAppState()),
    files: api.getFiles(),
  }
}

/** 变更回调：仅非只读时向上 emit 场景 JSON */
function handleChange(elements: any, appState: any, files: any): void {
  if (props.readonly) return
  emit('update:modelValue', {
    elements,
    appState: sanitizeAppState(appState),
    files,
  } as Record<string, unknown>)
}

function mountReact(): void {
  if (!containerRef.value) return
  root = createRoot(containerRef.value)
  root.render(
    // Excalidraw 是 React 组件，这里用 createElement 桥接，避免项目引入 JSX 编译链
        React.createElement(Excalidraw as any, {
      initialData: toInitialData(props.modelValue),
      viewModeEnabled: !!props.readonly,
      onChange: handleChange,
            excalidrawAPI: (a: any) => {
        api = a
      },
    } as Record<string, unknown>)
  )
}

function unmountReact(): void {
  if (root) {
    root.unmount()
    root = null
  }
  api = null
}

onMounted(() => {
  mountReact()
})

// 外部 payload（异步加载完成 / 「重新加载」）与当前场景不一致时，覆盖式载入
watch(
  () => props.modelValue,
  (val) => {
    if (!api || !val) return
    if (!isSamePayload(currentScene(), val)) {
      const d = val as Partial<ScenePayload>
      api.updateScene({
        elements: d.elements ?? [],
        appState: d.appState ?? {},
        files: d.files ?? {},
      })
    }
  }
)

// readonly 切换：Excalidraw 未提供运行时视图模式切换 API，重建实例
watch(
  () => props.readonly,
  () => {
    unmountReact()
    mountReact()
  }
)

onBeforeUnmount(() => {
  unmountReact()
})

defineExpose({ getApi: () => api })
</script>

<style scoped lang="scss">
.whiteboard-editor {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--nexus-white);
}
</style>
