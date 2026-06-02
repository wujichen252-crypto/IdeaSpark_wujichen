import type { App } from 'vue'
import VueLazyload from 'vue-lazyload'

/**
 * 图片懒加载插件配置
 * @description 配置图片懒加载，支持加载占位图和错误占位图
 * @param app Vue 应用实例
 */
export function setupLazyload(app: App): void {
  app.use(VueLazyload, {
    // 加载中显示的占位图
    loading: '/images/loading-placeholder.svg',
    // 加载失败显示的错误图
    error: '/images/error-placeholder.svg',
    // 预加载高度（提前 200px 开始加载）
    preLoad: 1.3,
    // 延迟加载时间（毫秒）
    attempt: 2,
    // 监听滚动事件的节流时间（毫秒）
    throttleWait: 200,
    // 是否启用懒加载
    lazyComponent: true
  })
}
