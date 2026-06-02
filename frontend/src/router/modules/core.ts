import type { RouteRecordRaw } from 'vue-router'

const coreRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/market',
    name: 'Explore',
    component: () => import('@/views/MarketView.vue')
  },
  {
    path: '/market/projects/:projectId',
    name: 'MarketProjectDetail',
    component: () => import('@/views/ProjectDetailView.vue'),
    props: true
  }
]

export default coreRoutes
