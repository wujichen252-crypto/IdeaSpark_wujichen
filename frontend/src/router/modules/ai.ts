import type { RouteRecordRaw } from 'vue-router'

/**
 * AI 模块路由配置
 * @description 包含 AI 聊天、AI 项目工作台等相关路由
 */
const aiRoutes: RouteRecordRaw[] = [
  {
    path: '/ai',
    name: 'AiLanding',
    component: () => import('@/views/ai/AiLandingPage.vue'),
    meta: {
      title: 'AI 创意助手',
      keepAlive: true
    }
  },
  {
    path: '/ai/chat',
    name: 'AiChat',
    component: () => import('@/views/ai/AiChatView.vue'),
    meta: {
      title: 'AI 对话',
      requiresAuth: true
    }
  },
  {
    path: '/ai/project',
    name: 'AiProjectHome',
    component: () => import('@/views/ai/project/AiProjectHome.vue'),
    meta: {
      title: 'AI 项目',
      requiresAuth: true
    }
  },
  {
    path: '/ai/project/create',
    name: 'AiProjectCreate',
    component: () => import('@/views/ai/project/AiProjectCreate.vue'),
    meta: {
      title: '创建 AI 项目',
      requiresAuth: true
    }
  },
  {
    path: '/ai/project/:id',
    name: 'AiProjectBoard',
    component: () => import('@/views/ai/project/AiProjectBoard.vue'),
    meta: {
      title: '项目看板',
      requiresAuth: true
    }
  },
  {
    path: '/ai/project/:id/workbench',
    name: 'AiProjectWorkbench',
    component: () => import('@/views/ai/project/AiProjectWorkbench.vue'),
    meta: {
      title: '项目工作台',
      requiresAuth: true
    }
  },
  {
    path: '/ai/project/:id/management',
    name: 'AiProjectManagement',
    component: () => import('@/views/ai/project/AiProjectManagement.vue'),
    meta: {
      title: '项目管理',
      requiresAuth: true
    }
  },
  {
    path: '/ai/project/:id/settings',
    name: 'AiProjectSettings',
    component: () => import('@/views/ai/project/AiProjectSettings.vue'),
    meta: {
      title: '项目设置',
      requiresAuth: true
    }
  }
]

export default aiRoutes
