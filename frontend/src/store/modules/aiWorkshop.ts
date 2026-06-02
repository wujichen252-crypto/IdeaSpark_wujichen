import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { createDefaultModules, MODULE_ORDER, TEMPLATES } from '@/constants/aiModules'
import type { ProjectModule, ModuleData } from '@/constants/aiModules'

export type { ProjectModule, ModuleData }
export type ArtifactType = 'document' | 'image' | 'code' | 'link' | 'other'
export interface Artifact {
  id: string
  name: string
  type: ArtifactType
  createdAt: number
  updatedAt?: number
  url?: string
  content?: string
}
export interface StageChecklistItem {
  id: string
  label: string
  completed: boolean
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: number
  assignee?: string
  tags?: string[]
}
export type ProjectFileType = 'document' | 'sheet' | 'slide' | 'image' | 'other'
export interface ProjectFile {
  id: string
  name: string
  type: ProjectFileType
  ext?: string
  size?: number
  updatedAt: number
  source?: 'plugin' | 'upload' | 'system'
  pluginId?: string
  content?: string
}
export interface ProjectSummary {
  id: string
  name: string
  description: string
  category: string
  type?: 'app' | 'document'
  currentModule: ProjectModule
  updatedAt: number
  cover?: string
  tags?: string[]
  techStack?: string[]
  status?: 'active' | 'completed' | 'paused' | 'draft'
  progress?: number
  team?: { id: string, name: string, avatar: string, role?: 'owner' | 'member' }[]
  detailedDescription?: string
  visibility?: 'public' | 'private'
  allowFork?: boolean
  plugins?: string[]
  files?: ProjectFile[]
  developerMessage?: string
  announcements?: { id: string, title: string, content: string, date: number }[]
  content?: string
}

function loadProjects(): ProjectSummary[] {
  return []
}

export const useAiWorkshopStore = defineStore('aiWorkshop', () => {
  // --- State ---
  const projectList = ref<ProjectSummary[]>(loadProjects())
  const currentProjectId = ref<string | null>(null)
  const currentModule = ref<ProjectModule>('home')
  const modules = ref<Record<ProjectModule, ModuleData>>(createDefaultModules())

  const projectInfo = ref<ProjectSummary>({
    id: '', name: '', description: '', category: '',
    currentModule: 'home', updatedAt: 0
  })

  // --- Persistence ---
  watch(projectList, saveToStorage, { deep: true })

  function saveToStorage() {
    try { localStorage.setItem('ideaspark_projects', JSON.stringify(projectList.value)) }
    catch (e) { console.error('保存项目列表失败:', e) }
  }

  // --- Computed ---
  const currentModuleData = computed(() => modules.value[currentModule.value])

  const isCurrentModuleComplete = computed(() =>
    currentModuleData.value.checklist.length > 0 &&
    currentModuleData.value.checklist.every(i => i.completed)
  )

  // --- Project CRUD ---
  function addProject(project: Partial<ProjectSummary>) {
    const id = project.id || `proj-${Date.now()}`
    const newProject: ProjectSummary = {
      id, name: project.name || '未命名项目', description: project.description || '',
      category: project.category || '未分类', type: project.type || 'app',
      currentModule: 'idea', updatedAt: Date.now(), status: project.status || 'active',
      progress: project.progress || 0,
      team: project.team || [{ id: 'u1', name: 'User', avatar: '', role: 'owner' }],
      visibility: project.visibility || 'private', plugins: project.plugins || [],
      files: project.files || [], content: project.content || '',
      cover: project.cover, tags: project.tags || [], ...project
    }
    const idx = projectList.value.findIndex(p => p.id === id)
    if (idx !== -1) projectList.value[idx] = newProject
    else projectList.value.unshift(newProject)
    saveToStorage()
    return newProject
  }

  function getProjectById(id: string) {
    return projectList.value.find(p => p.id === id)
  }

  function updateProject(id: string, data: Partial<ProjectSummary>) {
    const index = projectList.value.findIndex(p => p.id === id)
    if (index === -1) return
    const existing = projectList.value[index]
    if (!existing) return
    projectList.value[index] = { ...existing, ...data, id: existing.id, updatedAt: Date.now() }
  }

  function getProjectFileById(projectId: string, fileId: string) {
    return getProjectById(projectId)?.files?.find(f => f.id === fileId)
  }

  function updateProjectFile(projectId: string, fileId: string, updates: Partial<ProjectFile>) {
    const project = getProjectById(projectId)
    if (!project) return
    const files = project.files ?? []
    const index = files.findIndex(f => f.id === fileId)
    if (index === -1) return
    const existing = files[index]
    if (!existing) return
    const next = [...files]
    next[index] = { ...existing, ...updates, id: existing.id, updatedAt: updates.updatedAt ?? Date.now() }
    updateProject(projectId, { files: next })
  }

  function deleteProject(id: string) {
    projectList.value = projectList.value.filter(p => p.id !== id)
    if (currentProjectId.value === id) currentProjectId.value = null
  }

  function saveProject() {
    if (!currentProjectId.value) return
    const idx = projectList.value.findIndex(p => p.id === currentProjectId.value)
    const summary: ProjectSummary = {
      ...projectInfo.value, id: currentProjectId.value,
      currentModule: currentModule.value, updatedAt: Date.now()
    }
    if (idx >= 0) projectList.value[idx] = summary
    else projectList.value.push(summary)
  }

  function activateProject() {
    if (projectInfo.value) {
      projectInfo.value = { ...projectInfo.value, status: 'active' }
      saveProject()
    }
  }

  // --- Module navigation ---
  function nextModule() {
    const idx = MODULE_ORDER.indexOf(currentModule.value)
    if (idx < MODULE_ORDER.length - 1) {
      currentModule.value = MODULE_ORDER[idx + 1]
      saveProject()
    }
  }

  function setProjectInfo(info: Partial<typeof projectInfo.value>) {
    projectInfo.value = { ...projectInfo.value, ...info }
    saveProject()
  }

  function applyTemplate(category: string) {
    let type = 'general'
    if (/创业|SaaS|APP|工具/.test(category)) type = 'startup'
    else if (/内容|公众号|视频/.test(category)) type = 'content'
    const template = TEMPLATES[type] ?? {}
    for (const key of Object.keys(template) as ProjectModule[]) {
      const t = template[key]
      if (!t) continue
      modules.value[key] = {
        ...modules.value[key], ...t,
        checklist: t.checklist ? t.checklist.map(i => ({ ...i })) : modules.value[key].checklist
      }
    }
    saveProject()
  }

  // --- Initialize project ---
  function initProject(id: string) {
    const existing = projectList.value.find(p => p.id === id)
    if (existing) {
      currentProjectId.value = id
      projectInfo.value = { ...existing }
      currentModule.value = existing.currentModule
    } else {
      currentProjectId.value = id
      currentModule.value = 'home'
      projectInfo.value = {
        id, name: '', description: '', category: '',
        currentModule: 'home', updatedAt: Date.now(),
        cover: `https://picsum.photos/seed/newproject/800/400`,
        tags: [], techStack: [], status: 'draft', progress: 0,
        team: [
          { id: 'me', name: 'Me', avatar: '', role: 'owner' },
          { id: 'ai', name: 'AI Assistant', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai', role: 'member' }
        ],
        detailedDescription: '<p>暂无详细描述...</p>',
        visibility: 'private', allowFork: false,
        developerMessage: '欢迎开启新的项目旅程！\n请随时更新项目进度，保持团队信息同步。',
        announcements: [
          { id: 'a1', title: '项目已创建', content: '项目初始化完成，请开始规划您的第一个版本。', date: Date.now() }
        ]
      }
      Object.values(modules.value).forEach(m => {
        m.checklist = m.checklist.map(i => ({ ...i, completed: false }))
      })
    }
  }

  // --- Checklist / task operations ---
  function toggleChecklistItem(moduleKey: ProjectModule, itemId: string) {
    const module = modules.value[moduleKey]
    const index = module.checklist.findIndex(i => i.id === itemId)
    if (index === -1) return
    const item = module.checklist[index]
    if (!item) return
    module.checklist[index] = { ...item, completed: !item.completed }
    saveProject()
  }

  function addTask(moduleKey: ProjectModule, task: Omit<StageChecklistItem, 'id' | 'completed'>) {
    modules.value[moduleKey].checklist = [
      ...modules.value[moduleKey].checklist,
      { ...task, id: Date.now().toString(), completed: false }
    ]
    saveProject()
  }

  function updateTask(moduleKey: ProjectModule, taskId: string, updates: Partial<Omit<StageChecklistItem, 'id'>>) {
    const list = modules.value[moduleKey].checklist
    const index = list.findIndex(i => i.id === taskId)
    if (index === -1) return
    const existing = list[index]
    if (!existing) return
    list[index] = { ...existing, ...updates, id: existing.id }
    saveProject()
  }

  function updateModuleData(moduleKey: ProjectModule, data: Record<string, unknown>) {
    modules.value[moduleKey].data = { ...modules.value[moduleKey].data, ...data }
    saveProject()
  }

  function deleteTask(moduleKey: ProjectModule, taskId: string) {
    modules.value[moduleKey].checklist = modules.value[moduleKey].checklist.filter(i => i.id !== taskId)
    saveProject()
  }

  return {
    projectList, currentProjectId, currentModule, projectInfo, modules,
    currentModuleData, isCurrentModuleComplete,
    addProject, getProjectById, getProjectFileById, updateProject, updateProjectFile,
    deleteProject, saveProject, activateProject, setProjectInfo,
    nextModule, applyTemplate, initProject,
    toggleChecklistItem, addTask, updateTask, updateModuleData, deleteTask
  }
})
