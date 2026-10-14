/**
 * 补充模块声明
 * @description Excalidraw 0.18 的类型声明内部引用了 .scss 文件（import './css/app.scss'），
 * 这些文件在发布包中并不存在，会导致 TS 报 "Cannot find module"。
 * 通过通配声明兜底，避免类型检查失败（运行期由 Excalidraw 自带样式注入，无需真实 scss）。
 */
declare module '*.scss' {
  const content: Record<string, string>
  export default content
}
