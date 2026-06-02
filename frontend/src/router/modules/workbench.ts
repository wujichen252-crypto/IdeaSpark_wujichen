import type { RouteRecordRaw } from 'vue-router'
import WorkbenchView from '@/views/WorkbenchView.vue'

/**
 * 工作台子路由配置
 * @description 工作台页面的子路由配置，使用嵌套路由保持侧边栏一致
 */
const workbenchRoutes: RouteRecordRaw[] = [
  {
    path: '/workbench',
    name: 'Workbench',
    component: WorkbenchView,
    meta: {
      title: '工作台',
      requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'WorkbenchHome',
        redirect: '/workbench/projects'
      },
      {
        path: 'recent',
        name: 'WorkbenchRecent',
        component: () => import('@/views/workbench/WorkbenchRecentView.vue'),
        meta: {
          title: '最近访问',
          requiresAuth: true
        }
      },
      {
        path: 'projects',
        name: 'WorkbenchProjects',
        component: () => import('@/views/workbench/WorkbenchProjectsView.vue'),
        meta: {
          title: '我的项目',
          requiresAuth: true
        }
      },
      {
        path: 'team/:uuid',
        name: 'WorkbenchTeamDetail',
        component: () => import('@/views/workbench/WorkbenchTeamView.vue'),
        meta: {
          title: '团队详情',
          requiresAuth: true
        }
      },

      // 个人中心路由
      {
        path: 'notifications',
        name: 'WorkbenchNotifications',
        component: () => import('@/views/dashboard/NotificationCenterView.vue'),
        meta: {
          title: '通知中心',
          requiresAuth: true
        }
      },
      {
        path: 'settings',
        name: 'WorkbenchSettings',
        component: () => import('@/views/dashboard/AccountSettingsView.vue'),
        meta: {
          title: '账户设置',
          requiresAuth: true
        }
      },
      {
        path: 'security',
        name: 'WorkbenchSecurity',
        component: () => import('@/views/dashboard/PersonalSecurityLogView.vue'),
        meta: {
          title: '安全记录',
          requiresAuth: true
        }
      },
      {
        path: 'users',
        name: 'WorkbenchUserManagement',
        component: () => import('@/views/dashboard/UserManagementView.vue'),
        meta: {
          title: '用户管理',
          requiresAuth: true,
          roles: ['ADMIN', '超级管理员']
        }
      },
      {
        path: 'logs',
        name: 'WorkbenchSecurityLogs',
        component: () => import('@/views/dashboard/SecurityLogView.vue'),
        meta: {
          title: '安全日志',
          requiresAuth: true,
          roles: ['ADMIN', '超级管理员']
        }
      },
      {
        path: 'projects-admin',
        name: 'WorkbenchProjectManagement',
        component: () => import('@/views/dashboard/ProjectManagementView.vue'),
        meta: {
          title: '项目管理',
          requiresAuth: true,
          roles: ['ADMIN', '超级管理员']
        }
      }
    ]
  }
]

export default workbenchRoutes
