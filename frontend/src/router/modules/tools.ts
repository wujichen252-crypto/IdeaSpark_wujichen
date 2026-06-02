import type { RouteRecordRaw } from 'vue-router'

/**
 * 工具市场路由
 */
const toolsRoutes: RouteRecordRaw[] = [
  {
    path: '/tools',
    name: 'ToolsMarket',
    component: () => import('@/views/tools/ToolsMarketView.vue'),
    meta: {
      title: '工具市场',
      requiresAuth: true
    }
  }
]

export default toolsRoutes
