/**
 * simple-mind-map 环境声明
 * @description 该包 package.json 声明了 types: ./types/index.d.ts，但发布产物中并不包含该文件，
 * 且源码为纯 JS（无 .d.ts）。为遵守"直接集成开源库"原则（不手搓实现），此处仅补一个最小可用声明，
 * 覆盖本项目中实际用到的方法：构造 / setData / getData / on / off / destroy。
 * 仅声明用到的部分，未覆盖的 API 保持 unknown，避免误用。
 */
declare module 'simple-mind-map' {
  /** 思维导图节点树：根节点与子节点同构 */
  export interface MindMapNode {
    data: {
      text?: string
      id?: string
      [key: string]: unknown
    }
    children?: MindMapNode[]
    [key: string]: unknown
  }

  /** 思维导图全量数据（getData(false) 返回结构） */
  export interface MindMapData {
    data: {
      text?: string
      id?: string
      [key: string]: unknown
    }
    children?: MindMapNode[]
    [key: string]: unknown
  }

  export interface MindMapOptions {
    /** 挂载容器 */
    el: HTMLElement
    /** 初始数据 */
    data?: MindMapData
    /** 只读模式 */
    readonly?: boolean
    /** 布局算法，如 'logicalStructure' / 'mindMap' 等，缺省使用库内置默认 */
    layout?: string
    /** 主题名或主题配置 */
    theme?: string | Record<string, unknown>
    themeConfig?: Record<string, unknown>
    [key: string]: unknown
  }

  export default class MindMap {
    constructor(opt: MindMapOptions)
    /** 纯节点数据设置 */
    setData(data: MindMapData): void
    /** 获取节点树数据；withConfig=true 时附带布局/主题/视图 */
    getData(withConfig?: boolean): MindMapData
    /** 监听事件，常用 'data_change' */
    on(event: string, fn: (...args: unknown[]) => void): void
    /** 取消监听 */
    off(event: string, fn: (...args: unknown[]) => void): void
    /** 销毁实例，移除 DOM 与事件 */
    destroy(): void
  }
}
