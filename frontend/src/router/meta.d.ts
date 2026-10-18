import 'vue-router'

/**
 * 路由元信息类型扩展（单一可信源）
 * @description layout 取代原 App.vue 硬编码的顶栏显隐列表；headerPad 仅首页等全幅页关闭避让。
 */
declare module 'vue-router' {
  interface RouteMeta {
    /** 布局骨架：default=带顶栏 / editor=全屏无顶栏 / auth=认证页 / blank=错误页 */
    layout?: 'default' | 'editor' | 'auth' | 'blank'
    /** 是否给内容区加避让固定顶栏的 padding，默认 true；首页等全幅页设 false */
    headerPad?: boolean
    /** 是否需要登录 */
    requiresAuth?: boolean
    /** 允许的角色 */
    roles?: string[]
    /** 页面标题 */
    title?: string
  }
}
