<template>
  <div class="flow-editor">
    <div ref="containerRef" class="flow-canvas"></div>

    <!-- 自建轻量工具条（LogicFlow 2.x 扩展组件不随包提供 CSS，故用官方 API 自建） -->
    <div v-if="!readonly" class="flow-toolbar">
      <button class="ft-btn" title="添加矩形" @click="addNode('rect')">▭</button>
      <button class="ft-btn" title="添加圆" @click="addNode('circle')">◯</button>
      <button class="ft-btn" title="添加菱形" @click="addNode('diamond')">◇</button>
      <span class="ft-sep"></span>
      <button class="ft-btn" title="放大" @click="zoomIn">＋</button>
      <button class="ft-btn" title="缩小" @click="zoomOut">－</button>
      <button class="ft-btn" title="适应画布" @click="fit">⤢</button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 流程图编辑器本体（LogicFlow 接入）
 * @description 遵守嵌入编辑器契约：吃 JSON / 吐 JSON。
 * - 挂载时用 props.modelValue（{ nodes, edges }）作为初始数据
 * - 监听结构变更事件（node:add/delete、edge:*、text:update、history:change 等）向上 emit getGraphData()
 * - 通过 suppress 标志 + 负载比对，阻断 emit 被壳组件 markDirty 写回后的重渲染回环
 * - readonly 用 isSilentMode 关闭交互；节点新增/缩放/适应通过官方 API 实现（工具条为集成胶水，非自研引擎）
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LogicFlow from '@logicflow/core'
import '@logicflow/core/lib/index.css'
import type { EditorAdapterProps, EditorAdapterEmits } from '../types'
import { isSamePayload } from './dataEqual'

interface FlowPayload {
  nodes: Array<Record<string, unknown>>
  edges: Array<Record<string, unknown>>
}

const props = defineProps<EditorAdapterProps>()
const emit = defineEmits<EditorAdapterEmits>()

const containerRef = ref<HTMLElement | null>(null)
let lf: LogicFlow | null = null
/** 程序化 render 期间抑制回显 */
let suppress = false

const EMPTY: FlowPayload = { nodes: [], edges: [] }

function getCurrent(): FlowPayload {
  if (!lf) return EMPTY
  const data = lf.getGraphData() as Partial<FlowPayload>
  return { nodes: data.nodes ?? [], edges: data.edges ?? [] }
}

function handleChange(): void {
  if (suppress || !lf) return
  emit('update:modelValue', getCurrent() as unknown as Record<string, unknown>)
}

function applyExternal(data: FlowPayload): void {
  if (!lf) return
  suppress = true
  try {
    // 节点/边结构由库规范，外部负载以 any 透传避免逐字段类型对齐
    lf.render({ nodes: (data.nodes ?? []) as never, edges: (data.edges ?? []) as never })
  } finally {
    suppress = false
  }
}

const CHANGE_EVENTS = [
  'history:change',
  'node:add',
  'node:delete',
  'edge:add',
  'edge:delete',
  'node:drag',
  'node:resize',
  'node:rotate',
  'text:update',
  'node:properties-change',
]

function buildInstance(): void {
  if (!containerRef.value) return
  const initial = ((props.modelValue as unknown as FlowPayload) ?? EMPTY) as FlowPayload
  lf = new LogicFlow({
    container: containerRef.value,
    grid: true,
    isSilentMode: props.readonly ?? false,
  })
  for (const evt of CHANGE_EVENTS) {
    lf.on(evt, handleChange)
  }
  applyExternal(initial)
}

// 工具条：基于官方 API 新增节点（屏幕中心映射为画布坐标）
function nodeCenter(): { x: number; y: number } {
  const el = containerRef.value
  if (!el || !lf) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  const cp = lf.getPointByClient(rect.left + rect.width / 2, rect.top + rect.height / 2)
  // canvasOverlayPosition 为图坐标系（已对视口变换做逆映射）
  return { x: cp.canvasOverlayPosition.x, y: cp.canvasOverlayPosition.y }
}

let addOffset = 0
function addNode(type: 'rect' | 'circle' | 'diamond'): void {
  if (!lf) return
  const { x, y } = nodeCenter()
  lf.addNode({
    type,
    x: x + addOffset,
    y: y + addOffset,
    text: '新节点',
  })
  addOffset = (addOffset + 24) % 120
}

function zoomIn(): void {
  lf?.zoom(true)
}
function zoomOut(): void {
  lf?.zoom(false)
}
function fit(): void {
  lf?.fitView()
}

onMounted(() => {
  buildInstance()
})

// 壳组件异步加载 payload 后通过 prop 回灌真实数据
watch(
  () => props.modelValue,
  (val) => {
    if (!lf || !val) return
    if (!isSamePayload(getCurrent(), val)) {
      applyExternal(val as unknown as FlowPayload)
    }
  }
)

// readonly 切换：isSilentMode 无运行时切换 API，重建实例
watch(
  () => props.readonly,
  () => {
    if (containerRef.value && lf) {
      lf.destroy()
      lf = null
      buildInstance()
    }
  }
)

onBeforeUnmount(() => {
  if (lf) {
    lf.destroy()
    lf = null
  }
})

defineExpose({ getLogicFlow: () => lf })
</script>

<style scoped lang="scss">
.flow-editor {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--nexus-white);
}

.flow-canvas {
  width: 100%;
  height: 100%;
}

.flow-toolbar {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: var(--nexus-z-lift);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--nexus-white);
  border: 1px solid var(--nexus-border);
  border-radius: var(--nexus-radius-sm);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.ft-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--nexus-radius-sm);
  background: transparent;
  color: var(--nexus-gray-700);
  font-size: var(--nexus-font-size-md);
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--nexus-divider);
  }
}

.ft-sep {
  width: 1px;
  height: 18px;
  background: var(--nexus-border);
  margin: 0 2px;
}
</style>
