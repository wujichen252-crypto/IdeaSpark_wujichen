/**
 * 嵌入式编辑器接入协议
 * @description 所有嵌入编辑器（无论开源组件还是自研）遵守同一契约：
 * 本体只负责"吃 JSON / 吐 JSON"，Header、保存、主题、懒加载由壳组件统一提供
 */
import type { Component } from 'vue'

/**
 * 嵌入资产类型（与后端 project_files.type 列对齐）
 */
export type ArtifactType = 'whiteboard' | 'mindmap' | 'flow'

/**
 * 编辑器本体 props 契约
 */
export interface EditorAdapterProps {
  /** 当前资产 JSON 负载（加载后的初始值） */
  modelValue: Record<string, unknown> | null
  /** 只读模式 */
  readonly?: boolean
}

/**
 * 编辑器本体 emits 契约
 */
export interface EditorAdapterEmits {
  (e: 'update:modelValue', payload: Record<string, unknown>): void
}

/**
 * 编辑器注册项（轻量注册表，见 constants/embeddedEditors.ts）
 */
export interface EmbeddedEditorDefinition {
  /** 唯一标识 */
  key: string
  /** 展示名称 */
  name: string
  /** 资产类型判别键 */
  type: ArtifactType
  /** 编辑器本体异步加载器（懒加载，独立 chunk） */
  loader: () => Promise<{ default: Component }>
  /** 支持的导出格式（壳组件导出菜单据此渲染） */
  supportedExports: string[]
  /** 新建资产时的空白负载 */
  emptyPayload: () => Record<string, unknown>
}
