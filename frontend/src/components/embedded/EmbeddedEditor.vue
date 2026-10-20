<template>
  <div class="embedded-editor">
    <!-- Nexus 风格统一 Header（编辑器本体不关心） -->
    <header class="ee-header">
      <div class="ee-header-left">
        <button class="ee-icon-btn" title="返回" @click="handleBack">
          <n-icon size="18"><ArrowLeft /></n-icon>
        </button>
        <div class="ee-divider"></div>
        <div class="ee-doc-info">
          <input
            v-model="fileName"
            class="ee-doc-title"
            placeholder="未命名"
            @blur="handleRename"
            @keydown.enter="handleRename"
          />
          <div class="ee-save-status" :class="saveStatus">
            <span class="ee-status-dot"></span>
            {{ statusText }}
          </div>
        </div>
      </div>
      <div class="ee-header-right">
        <n-popover trigger="click" placement="bottom">
          <template #trigger>
            <button class="ee-pill-btn" title="导出">
              <n-icon size="14"><Download /></n-icon>
              导出
            </button>
          </template>
          <div class="ee-export-menu">
            <button
              v-for="fmt in definition?.supportedExports || []"
              :key="fmt"
              class="ee-export-item"
              @click="handleExport(fmt)"
            >
              {{ fmt.toUpperCase() }}
            </button>
          </div>
        </n-popover>
        <button class="ee-pill-btn ee-pill-dark" title="保存" @click="handleSave">
          <n-icon size="14"><Save /></n-icon>
          保存
        </button>
      </div>
    </header>

    <!-- 主体：按注册表懒加载编辑器本体 -->
    <div class="ee-body">
      <div v-if="loading" class="ee-state">
        <n-spin size="medium" />
        <p class="ee-state-text">正在加载编辑器...</p>
      </div>
      <div v-else-if="error && !payload" class="ee-state">
        <n-empty :description="error" />
        <button class="ee-pill-btn" style="margin-top: 16px" @click="load">重试</button>
      </div>
      <component
        v-else-if="editorComponent"
        :is="editorComponent"
        :model-value="payload ?? definition?.emptyPayload() ?? null"
        :readonly="readonly"
        @update:model-value="handlePayloadChange"
      />
    </div>

    <!-- 版本冲突提示条 -->
    <div v-if="saveStatus === 'conflict'" class="ee-conflict-bar">
      <n-icon size="14"><AlertTriangle /></n-icon>
      <span>内容已被他人修改，请重新加载最新版本后再编辑</span>
      <button class="ee-pill-btn" @click="load">重新加载</button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 嵌入式编辑器统一壳组件
 * @description 为所有嵌入编辑器（白板/导图/流程图）提供 Nexus 风格 Header、
 * 自动保存调度、乐观锁冲突处理与导出入口；编辑器本体只处理 JSON 负载
 */
import { computed, ref, watch, onMounted, onBeforeUnmount, shallowRef, defineAsyncComponent, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { ArrowLeft, Download, Save, AlertTriangle } from 'lucide-vue-next'
import { findEditorByType } from '@/constants/embeddedEditors'
import { useArtifact, type SaveStatus } from '@/composables/useArtifact'
import { updateProjectFile } from '@/api/projectFile'
import type { ArtifactType } from './types'

const props = defineProps<{
  /** 资产类型 */
  artifactType: ArtifactType
  /** 所属项目 ID */
  projectId: string
  /** 文件 ID */
  fileId: string
  /** 文件显示名 */
  initialName?: string
  /** 只读模式 */
  readonly?: boolean
}>()

const router = useRouter()
const message = useMessage()

const definition = computed(() => findEditorByType(props.artifactType))

const { payload, saveStatus, loading, error, load, markDirty, saveNow } = useArtifact(
  props.projectId,
  props.fileId,
  props.artifactType
)

const fileName = ref(props.initialName || definition.value?.name || '未命名')
const editorComponent = shallowRef<Component | null>(null)

const statusText = computed(() => {
  const map: Record<SaveStatus, string> = {
    saved: '已保存',
    saving: '保存中...',
    unsaved: '未保存',
    conflict: '保存冲突',
  }
  return map[saveStatus.value]
})

/**
 * 按注册表懒加载编辑器本体（独立 chunk，Excalidraw 的 React 依赖隔离在白板 chunk 内）
 */
function resolveEditor(): void {
  if (!definition.value) return
  editorComponent.value = defineAsyncComponent(definition.value.loader)
}

/**
 * 编辑器负载变更 → 标记脏并调度防抖自动保存
 * @param next - 编辑器吐出的 JSON 负载
 */
function handlePayloadChange(next: Record<string, unknown>): void {
  markDirty(next)
}

/**
 * 手动保存
 */
async function handleSave(): Promise<void> {
  await saveNow()
  if (saveStatus.value === 'saved') message.success('保存成功')
}

/**
 * 重命名文件
 */
async function handleRename(): Promise<void> {
  const name = fileName.value.trim()
  if (!name) {
    fileName.value = props.initialName || '未命名'
    return
  }
  try {
    await updateProjectFile(props.projectId, props.fileId, { name })
  } catch {
    message.warning('重命名失败')
  }
}

/**
 * 导出资产 JSON（图片/SVG 导出由编辑器本体在 Phase 1 后续接入）
 * @param format - 导出格式
 */
function handleExport(format: string): void {
  if (format !== 'json') {
    message.info(`${format.toUpperCase()} 导出即将上线，当前支持 JSON`)
    return
  }
  const blob = new Blob([JSON.stringify(payload.value ?? {}, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName.value}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 返回上一页（离开前强制保存未落盘内容）
 */
async function handleBack(): Promise<void> {
  await saveNow()
  router.back()
}

/**
 * 离开页面前强制保存
 */
function beforeUnloadHandler(e: BeforeUnloadEvent): void {
  if (saveStatus.value === 'unsaved') {
    e.preventDefault()
  }
}

watch(
  () => props.artifactType,
  () => resolveEditor()
)

onMounted(async () => {
  resolveEditor()
  await load()
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
  void saveNow()
})
</script>

<style scoped lang="scss">
.embedded-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--nexus-bg);
  color: var(--nexus-text-primary);
}

.ee-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid var(--nexus-border);
  flex-shrink: 0;
}

.ee-header-left,
.ee-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ee-divider {
  width: 1px;
  height: 20px;
  background: var(--nexus-border);
}

.ee-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--nexus-text-primary);
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--nexus-surface-hover, rgba(0, 0, 0, 0.05));
  }
}

.ee-doc-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ee-doc-title {
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--nexus-text-primary);
  width: 200px;

  &:focus {
    border-bottom: 1px solid var(--nexus-text-primary);
  }
}

.ee-save-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--nexus-text-muted, #888);

  .ee-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #888;
  }

  &.saved .ee-status-dot {
    background: #22c55e;
  }

  &.saving .ee-status-dot,
  &.unsaved .ee-status-dot {
    background: #f59e0b;
  }

  &.conflict .ee-status-dot {
    background: #ef4444;
  }
}

.ee-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--nexus-border);
  background: transparent;
  color: var(--nexus-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--nexus-surface-hover, rgba(0, 0, 0, 0.05));
  }

  &.ee-pill-dark {
    background: var(--nexus-text-primary);
    color: var(--nexus-bg);
    border-color: var(--nexus-text-primary);
  }
}

.ee-export-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
}

.ee-export-item {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    background: var(--nexus-surface-hover, rgba(0, 0, 0, 0.05));
  }
}

.ee-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.ee-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.ee-state-text {
  font-size: 13px;
  color: var(--nexus-text-muted, #888);
}

.ee-conflict-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: #ef4444;
  border-top: 1px solid var(--nexus-border);
  background: rgba(239, 68, 68, 0.06);

  .ee-pill-btn {
    margin-left: auto;
  }
}
</style>
