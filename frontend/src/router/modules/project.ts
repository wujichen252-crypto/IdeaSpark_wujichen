import type { RouteRecordRaw } from 'vue-router'

const projectRoutes: RouteRecordRaw[] = [
  {
    path: '/project/:id',
    name: 'ProjectDetail',
    component: () => import('@/views/ProjectDetailView.vue')
  },
  {
    path: '/project/create',
    name: 'CreateProject',
    component: () => import('@/views/project/CreateProjectView.vue')
  },
  {
    path: '/project/doc/:id',
    name: 'DocumentEditor',
    component: () => import('@/views/editor/AiDocumentEditorView.vue')
  },
  {
    path: '/project/workspace/:id',
    name: 'ProjectWorkspace',
    component: () => import('@/views/project/ProjectWorkspaceView.vue')
  },
  {
    path: '/project/workspace/:id/file/:fileId',
    name: 'ProjectFileEditor',
    component: () => import('@/views/project/ProjectFileEditorView.vue')
  },
  {
    path: '/project/slides/:id/:fileId',
    name: 'SlideEditor',
    component: () => import('@/views/editor/SlideEditorView.vue'),
    meta: {
      title: '幻灯片编辑器',
      requiresAuth: true
    }
  },
  {
    path: '/project/excel/:id/:fileId',
    name: 'ExcelEditor',
    component: () => import('@/views/editor/ExcelEditorView.vue'),
    meta: {
      title: 'Excel编辑器',
      requiresAuth: true
    }
  }
]

export default projectRoutes

