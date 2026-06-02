import type { RouteRecordRaw } from 'vue-router'
import CommunityView from '@/views/community/CommunityView.vue'

const communityRoutes: RouteRecordRaw[] = [
  {
    path: '/community',
    name: 'Community',
    component: CommunityView
  },
  {
    path: '/community/create',
    name: 'CommunityCreatePost',
    component: () => import('@/views/community/CommunityCreatePostView.vue'),
    meta: {
      title: '发布帖子',
      requiresAuth: true
    }
  },
  {
    path: '/community/post/:id',
    name: 'CommunityPostDetail',
    component: () => import('@/views/community/CommunityPostDetailView.vue')
  },
  {
    path: '/community/group/:id',
    name: 'CommunityGroupDetail',
    component: () => import('@/views/community/CommunityGroupDetailView.vue')
  }
]

export default communityRoutes

