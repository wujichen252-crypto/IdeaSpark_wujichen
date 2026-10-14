/**
 * 嵌入式编辑器注册表
 * @description 初期以常量形式维护（不建独立 tool 模块）。
 * 新增一个嵌入编辑器 = 在此登记一行 + 实现符合 EditorAdapterProps/Emits 契约的本体组件。
 * 未来若开放第三方工具，再升级为后端注册表——现阶段不提前抽象。
 */
import type { EmbeddedEditorDefinition, ArtifactType } from '@/components/embedded/types'

/** 各类型的空白初始负载 */
const emptyPayloads: Record<ArtifactType, () => Record<string, unknown>> = {
  whiteboard: () => ({ elements: [], appState: {}, files: {} }),
  // simple-mind-map 根节点结构：{ data: { text }, children: [] }
  mindmap: () => ({ data: { text: '中心主题' }, children: [] }),
  flow: () => ({ nodes: [], edges: [] }),
}

/**
 * 注册表：白板 / 思维导图 / 流程图
 * loader 返回模块动态 import（由壳组件 defineAsyncComponent 包装成独立 chunk），
 * 其中 Excalidraw 依赖 React，必须隔离在自身 chunk，不污染主包。
 */
export const EMBEDDED_EDITOR_REGISTRY: EmbeddedEditorDefinition[] = [
  {
    key: 'excalidraw',
    name: '协作白板',
    type: 'whiteboard',
    loader: () => import('@/components/embedded/editors/WhiteboardEditor.vue'),
    supportedExports: ['png', 'svg', 'json'],
    emptyPayload: emptyPayloads.whiteboard,
  },
  {
    key: 'simple-mind-map',
    name: '思维导图',
    type: 'mindmap',
    loader: () => import('@/components/embedded/editors/MindmapEditor.vue'),
    supportedExports: ['json', 'png', 'markdown'],
    emptyPayload: emptyPayloads.mindmap,
  },
  {
    key: 'logicflow',
    name: '流程图',
    type: 'flow',
    loader: () => import('@/components/embedded/editors/FlowEditor.vue'),
    supportedExports: ['json', 'png', 'svg'],
    emptyPayload: emptyPayloads.flow,
  },
]

/**
 * 按资产类型查找注册项
 * @param type - 资产类型
 */
export function findEditorByType(type: ArtifactType): EmbeddedEditorDefinition | undefined {
  return EMBEDDED_EDITOR_REGISTRY.find((item) => item.type === type)
}
