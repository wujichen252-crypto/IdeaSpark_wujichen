import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store'

import coreRoutes from './modules/core'
import userRoutes from './modules/user'
import projectRoutes from './modules/project'
import communityRoutes from './modules/community'
import aiRoutes from './modules/ai'
import workbenchRoutes from './modules/workbench'
import toolsRoutes from './modules/tools'

/**
 * 路由配置
 * @description 整合所有路由模块，配置路由守卫
 */
const routes: RouteRecordRaw[] = [
  ...coreRoutes,
  ...userRoutes,
  ...projectRoutes,
  ...communityRoutes,
  ...aiRoutes,
  ...workbenchRoutes,
  ...toolsRoutes,
  // 创建项目页面重定向（兼容旧路径 /create）
  {
    path: '/create',
    redirect: '/project/create'
  },
  // Dashboard 重定向到工作台
  {
    path: '/dashboard',
    redirect: '/workbench'
  },
  // 403 页面
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
    meta: {
      title: '无权访问'
    }
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: '页面不存在'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

/**
 * 全局前置守卫
 * @description 处理登录验证、页面标题设置等
 */
router.beforeEach((to, from, next) => {
  /**
   * 惰性获取 userStore 实例
   * @description 使用缓存变量避免重复创建，确保在 Pinia 安装后才访问
   */
  let userStore: ReturnType<typeof useUserStore> | null = null
  try {
    userStore = useUserStore()
  } catch {
    next()
    return
  }

  // 验证登录状态（优先执行，避免不必要的标题设置）
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 角色权限验证
  if (to.meta.requiresAuth && to.meta.roles && Array.isArray(to.meta.roles)) {
    const userRole = userStore.user?.role
    if (!userRole || !(to.meta.roles as string[]).includes(userRole)) {
      next('/403')
      return
    }
  }

  // 已登录用户访问登录页，重定向到首页
  if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
    return
  }

  next()
})

/**
 * 全局后置钩子
 * @description 页面切换后的处理
 */
router.afterEach((to) => {
  // 设置页面标题（移到后置钩子，避免阻塞导航）
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - IdeaSpark`
  } else {
    document.title = 'IdeaSpark - 从灵感到落地，只需一句话'
  }
  
  // 开发环境路由日志
  if (import.meta.env.DEV) {
    console.log(`[Router] 导航到: ${to.path}`)
  }
})

export default router
