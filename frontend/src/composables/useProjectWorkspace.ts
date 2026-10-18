import { computed, h, reactive, ref, watch, type InjectionKey, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, useDialog, NIcon, type MenuOption, type UploadCustomRequestOptions } from 'naive-ui'
import {
  HomeOutline,
  FolderOpenOutline,
  PeopleOutline,
  SettingsOutline,
  ExtensionPuzzleOutline
} from '@vicons/ionicons5'
import { useAiWorkshopStore, type ProjectFile, type ProjectFileType } from '@/store/modules/aiWorkshop'
import { getProjectDetail, getProjectMembers, updateProject } from '@/api/project'
import { sendSimpleChat } from '@/api/ai'
import { uploadFile } from '@/api/file'
import { createProjectFile, deleteProjectFile } from '@/api/projectFile'
import { findEditorByType } from '@/constants/embeddedEditors'
import type { ArtifactType } from '@/components/embedded/types'
import { toggleProjectPlugin, getProjectPluginIds } from '@/api/projectPlugin'
import { getMyPlugins } from '@/api/userPlugin'
import type { ProjectMember } from '@/api/types'
import type { Plugin } from '@/api/plugin'
import {
  visibilityOptions,
  buildWorkspacePlugins,
  getPluginIcon,
  parseCommaList,
  formatDateTime,
  formatSize,
  fileTypeLabel,
  fileTypeTagType,
  detectFileTypeByExt,
  stripExtFromTitle,
  buildTemplateContent,
  buildAiPrompt,
  buildExportContent,
  type WorkspaceMenuKey
} from './workspaceHelpers'

export type ProjectWorkspaceContext = ReturnType<typeof createProjectWorkspace>

export const WORKSPACE_KEY: InjectionKey<ProjectWorkspaceContext> = Symbol('project-workspace')

/**
 * 项目工作区状态与逻辑中枢（活动代码；插件工具抽屉 + AI PPT 生成等死代码已隔离到 legacy）。
 * 在父组件创建实例并经 provide 下发，子组件 inject 同一实例，避免多实例串数据。
 */
export function createProjectWorkspace() {
  const route = useRoute()
  const router = useRouter()
  const store = useAiWorkshopStore()
  const message = useMessage()
  const dialog = useDialog()
  const projectId = route.params.id as string

  const project = computed(() => store.getProjectById(projectId))

  // 项目成员列表
  const projectMembers = ref<ProjectMember[]>([])

  async function loadProjectPlugins() {
    try {
      const res = await getProjectPluginIds(projectId)
      const data = res.data as any
      const isSuccess = data.code === 200 || data.status === 200
      if (isSuccess && data.data) {
        const pluginIds = data.data.pluginIds || []
        store.updateProject(projectId, { plugins: pluginIds })
      }
    } catch (error: any) {
      console.error('加载项目插件列表失败:', error)
    }
  }

  async function loadProjectDetail() {
    try {
      const res = await getProjectDetail(projectId)
      const data = res.data as any
      const isSuccess = data.code === 200 || data.status === 200
      if (isSuccess && res.data.data) {
        const apiProject: any = res.data.data
        store.addProject({
          id: apiProject.id || apiProject.projectId,
          name: apiProject.name || '未命名项目',
          description: apiProject.description || '',
          category: apiProject.category || '未分类',
          type: 'app',
          currentModule: 'home',
          updatedAt: Date.now(),
          status: apiProject.status || 'active',
          visibility: apiProject.visibility || 'private',
          cover: apiProject.coverUrl,
          tags: apiProject.tags || [],
          techStack: apiProject.techStack || [],
          allowFork: apiProject.allowFork ?? false,
          plugins: [],
          files: apiProject.files || [],
          content: apiProject.content || '',
          team: []
        })
        await loadProjectPlugins()
      } else {
        message.error(res.data.message || '获取项目详情失败')
      }
    } catch (error: any) {
      console.error('加载项目详情失败:', error)
      message.error(error.response?.data?.message || '加载项目详情失败，请检查网络连接')
    }
  }

  async function loadMyPlugins() {
    try {
      const res = await getMyPlugins()
      const data = res.data as any
      const isSuccess = data.code === 200 || data.status === 200
      if (isSuccess && data.data) {
        myPlugins.value = data.data.plugins || []
      }
    } catch (error: any) {
      console.error('加载用户插件列表失败:', error)
    }
  }

  async function loadProjectMembers() {
    try {
      const res = await getProjectMembers(projectId)
      const data = res.data as any
      const isSuccess = data.code === 200 || data.status === 200
      if (isSuccess && data.data) {
        projectMembers.value = data.data.members || []
      }
    } catch (error: any) {
      console.error('加载项目成员列表失败:', error)
    }
  }

  function init() {
    loadProjectDetail()
    loadMyPlugins()
    loadProjectMembers()
  }

  // ============ 插件 ============
  const enabledPluginIds = computed(() => project.value?.plugins ?? [])
  const enabledPlugins = computed(() =>
    (myPlugins.value || []).filter((p) => enabledPluginIds.value.includes(p.id))
  )
  const myPlugins = ref<Plugin[]>([])
  const myPluginIds = computed(() => myPlugins.value.map((p) => p.id))
  const workspacePlugins = computed(() => buildWorkspacePlugins(project.value))

  const getInitialTab = (): WorkspaceMenuKey => {
    const tab = route.query.tab as string
    const validTabs: WorkspaceMenuKey[] = ['home', 'files', 'members', 'settings', 'plugins']
    return validTabs.includes(tab as WorkspaceMenuKey) ? (tab as WorkspaceMenuKey) : 'home'
  }

  const activeMenuKey = ref<WorkspaceMenuKey>(getInitialTab())

  watch(activeMenuKey, (newTab) => {
    router.replace({ query: { ...route.query, tab: newTab } })
  })

  const marketFilter = ref<'all' | 'official' | 'community'>('official')
  const keyword = ref('')

  const filteredMyPlugins = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    return (myPlugins.value || []).filter((p) => {
      if (enabledPluginIds.value.includes(p.id)) return false
      if (marketFilter.value !== 'all' && p.source !== marketFilter.value) return false
      if (!kw) return true
      return `${p.name} ${p.description}`.toLowerCase().includes(kw)
    })
  })

  function goToToolMarket() {
    window.open('http://localhost:5173/tools', '_blank')
  }

  async function togglePlugin(pluginId: string) {
    if (!project.value) return
    try {
      const res = await toggleProjectPlugin(projectId, pluginId)
      const data = res.data as any
      const isSuccess = data.code === 200 || data.status === 200
      if (isSuccess) {
        await loadProjectPlugins()
      } else {
        message.error(data.message || '操作失败')
      }
    } catch (error: any) {
      console.error('切换插件状态失败:', error)
      message.error(error.response?.data?.message || '操作失败，请检查网络连接')
    }
  }

  function isEnabled(pluginId: string) {
    return enabledPluginIds.value.includes(pluginId)
  }

  // ============ 首页 / 设置 ============
  const isHomeEditing = ref(false)
  const saving = ref(false)

  const homeForm = reactive({
    name: '',
    description: '',
    category: '',
    cover: '',
    tagsText: '',
    techStackText: '',
    visibility: 'private' as 'private' | 'public',
    allowFork: false
  })

  const settingsForm = reactive({
    name: '',
    description: '',
    category: '',
    visibility: 'private' as 'private' | 'public',
    allowFork: false
  })

  const menuOptions = computed<MenuOption[]>(() => [
    { key: 'home', label: '项目首页', icon: renderMenuIcon(HomeOutline) },
    { key: 'files', label: '项目文件', icon: renderMenuIcon(FolderOpenOutline) },
    { key: 'members', label: '成员管理', icon: renderMenuIcon(PeopleOutline) },
    { key: 'settings', label: '项目设置', icon: renderMenuIcon(SettingsOutline) },
    { key: 'plugins', label: '项目插件', icon: renderMenuIcon(ExtensionPuzzleOutline) }
  ])

  const currentTitle = computed(() => {
    const map: Record<WorkspaceMenuKey, string> = {
      home: '项目首页',
      files: '项目文件',
      members: '成员管理',
      settings: '项目设置',
      plugins: '项目插件'
    }
    return map[activeMenuKey.value]
  })

  watch(
    () => project.value,
    () => {
      syncSettingsForm()
      syncHomeForm()
    },
    { immediate: true }
  )

  function renderMenuIcon(icon: Component) {
    return () => h(NIcon, null, { default: () => h(icon) })
  }

  function stringToColor(input: string) {
    let hash = 0
    for (let i = 0; i < input.length; i += 1) {
      hash = input.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue} 60% 45%)`
  }

  function handleBack() {
    if (canGoBack()) {
      router.back()
      return
    }
    router.replace('/workbench')
  }

  function canGoBack() {
    const state = router.options.history.state
    return typeof state.back === 'string' && state.back.length > 0
  }

  function syncSettingsForm() {
    if (!project.value) return
    settingsForm.name = project.value.name || ''
    settingsForm.description = project.value.description || ''
    settingsForm.category = project.value.category || ''
    settingsForm.visibility = project.value.visibility ?? 'private'
    settingsForm.allowFork = project.value.allowFork ?? false
  }

  function syncHomeForm() {
    if (!project.value) return
    homeForm.name = project.value.name || ''
    homeForm.description = project.value.description || ''
    homeForm.category = project.value.category || ''
    homeForm.cover = project.value.cover || ''
    homeForm.tagsText = (project.value.tags || []).join(', ')
    homeForm.techStackText = (project.value.techStack || []).join(', ')
    homeForm.visibility = project.value.visibility ?? 'private'
    homeForm.allowFork = project.value.allowFork ?? false
  }

  function startHomeEdit() {
    syncHomeForm()
    isHomeEditing.value = true
  }

  function cancelHomeEdit() {
    syncHomeForm()
    isHomeEditing.value = false
  }

  async function saveHomeEdit() {
    if (!project.value) return
    saving.value = true
    try {
      const tags = parseCommaList(homeForm.tagsText)
      const techStack = parseCommaList(homeForm.techStackText)
      const res = await updateProject(projectId, {
        name: homeForm.name,
        description: homeForm.description,
        category: homeForm.category,
        coverUrl: homeForm.cover,
        tags,
        techStack,
        visibility: homeForm.visibility,
        allowFork: homeForm.allowFork
      })
      const data = res.data as any
      const isSuccess = data.code === 200 || data.status === 200
      if (isSuccess) {
        store.updateProject(projectId, {
          name: homeForm.name,
          description: homeForm.description,
          category: homeForm.category,
          cover: homeForm.cover,
          tags,
          techStack,
          visibility: homeForm.visibility,
          allowFork: homeForm.allowFork
        })
        message.success('已保存')
        isHomeEditing.value = false
      } else {
        message.error(data.message || '保存失败')
      }
    } catch (error: any) {
      console.error('保存项目失败:', error)
      message.error(error.response?.data?.message || '保存失败，请检查网络连接')
    } finally {
      saving.value = false
    }
  }

  async function saveSettings() {
    if (!project.value) return
    saving.value = true
    try {
      const res = await updateProject(projectId, {
        name: settingsForm.name,
        description: settingsForm.description,
        category: settingsForm.category,
        visibility: settingsForm.visibility,
        allowFork: settingsForm.allowFork
      })
      const data = res.data as any
      const isSuccess = data.code === 200 || data.status === 200
      if (isSuccess) {
        store.updateProject(projectId, {
          name: settingsForm.name,
          description: settingsForm.description,
          category: settingsForm.category,
          visibility: settingsForm.visibility,
          allowFork: settingsForm.allowFork
        })
        message.success('已保存')
      } else {
        message.error(data.message || '保存失败')
      }
    } catch (error: any) {
      console.error('保存设置失败:', error)
      message.error(error.response?.data?.message || '保存失败，请检查网络连接')
    } finally {
      saving.value = false
    }
  }

  const handleUploadCover = async ({ file, onFinish, onError }: UploadCustomRequestOptions) => {
    try {
      if (!file.file) {
        message.error('请选择要上传的图片')
        onError()
        return
      }
      const res = await uploadFile(file.file)
      const data = res.data as any
      const isSuccess = data.code === 200 || data.status === 200
      if (isSuccess && data.data?.url) {
        homeForm.cover = data.data.url
        message.success('封面上传成功')
        onFinish()
      } else {
        message.error(data.message || '上传失败')
        onError()
      }
    } catch (error: any) {
      console.error('封面上传失败:', error)
      message.error(error.message || '上传出错')
      onError()
    }
  }

  // ============ 文件 ============
  const projectFiles = computed<ProjectFile[]>(() => {
    const list = project.value?.files ?? []
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  const recentFiles = computed(() => projectFiles.value.slice(0, 6))

  const fileStats = computed(() => {
    const base = { total: 0, document: 0, sheet: 0, slide: 0, image: 0, other: 0 }
    for (const f of projectFiles.value) {
      base.total += 1
      if (f.type === 'document') base.document += 1
      else if (f.type === 'sheet') base.sheet += 1
      else if (f.type === 'slide') base.slide += 1
      else if (f.type === 'image') base.image += 1
      else base.other += 1
    }
    return base
  })

  const fileSearch = ref('')
  const showAddFileModal = ref(false)
  const createFilePluginId = ref<string | null>(null)
  const newFileTitle = ref('')
  const useAiGenerate = ref(false)

  const createFilePluginOptions = computed(() =>
    enabledPlugins.value.map((p) => ({
      label: `${p.name}（${p.source === 'official' ? '官方' : '社区'} · .${p.export.ext}）`,
      value: p.id
    }))
  )

  const filteredFiles = computed(() => {
    const kw = fileSearch.value.trim().toLowerCase()
    if (!kw) return projectFiles.value
    return projectFiles.value.filter((f) => f.name.toLowerCase().includes(kw))
  })

  async function addFileRecord(file: ProjectFile) {
    if (!project.value) return
    try {
      const res = await createProjectFile(projectId, {
        name: file.name,
        type: file.type,
        ext: file.ext,
        size: file.size,
        source: file.source,
        pluginId: file.pluginId,
        content: file.content
      })
      const data = res.data as any
      const isSuccess = data.code === 200 || data.status === 200
      if (isSuccess && data.data) {
        const createdFile = data.data as ProjectFile
        const current = project.value.files ?? []
        store.updateProject(projectId, { files: [createdFile, ...current] })
        message.success('文件已保存到服务器')
      } else {
        const current = project.value.files ?? []
        store.updateProject(projectId, { files: [file, ...current] })
        message.warning('服务器保存失败，已本地保存')
      }
    } catch (error: any) {
      console.error('创建文件失败:', error)
      const current = project.value.files ?? []
      store.updateProject(projectId, { files: [file, ...current] })
      message.warning('服务器保存失败，已本地保存')
    }
  }

  const EMBEDDED_FILE_TYPES: ProjectFileType[] = ['whiteboard', 'mindmap', 'flow']

  function openFile(file: ProjectFile) {
    if (EMBEDDED_FILE_TYPES.includes(file.type)) {
      router.push({
        name: 'EmbeddedArtifact',
        params: { id: projectId, fileId: file.id, type: file.type },
        query: { name: file.name }
      })
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'ppt' || ext === 'pptx') {
      router.push({ name: 'SlideEditor', params: { id: projectId, fileId: file.id } })
    } else if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
      router.push({ name: 'ExcelEditor', params: { id: projectId, fileId: file.id } })
    } else {
      router.push({ name: 'ProjectFileEditor', params: { id: projectId, fileId: file.id } })
    }
  }

  async function handleDeleteFile(file: ProjectFile) {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除文件「${file.name}」吗？此操作不可恢复。`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const res = await deleteProjectFile(projectId, file.id)
          const data = res.data as any
          const isSuccess = data.code === 200 || data.status === 200
          if (isSuccess) {
            const current = project.value?.files ?? []
            store.updateProject(projectId, { files: current.filter((f) => f.id !== file.id) })
            message.success('文件已删除')
          } else {
            message.error(data.message || '删除失败')
          }
        } catch (error: any) {
          console.error('删除文件失败:', error)
          message.error(error.response?.data?.message || '删除失败')
        }
      }
    })
  }

  function openAddFileModal() {
    newFileTitle.value = ''
    createFilePluginId.value = enabledPlugins.value[0]?.id ?? null
    showAddFileModal.value = true
  }

  function cancelAddFile() {
    showAddFileModal.value = false
    newFileTitle.value = ''
    createFilePluginId.value = null
    useAiGenerate.value = false
  }

  const artifactCreateOptions = [
    { label: '新建白板', key: 'whiteboard' },
    { label: '新建思维导图', key: 'mindmap' },
    { label: '新建流程图', key: 'flow' }
  ]

  function handleArtifactCreateSelect(key: string) {
    void createArtifact(key as ArtifactType)
  }

  async function createArtifact(type: ArtifactType): Promise<void> {
    if (!project.value) return
    const def = findEditorByType(type)
    if (!def) {
      message.warning('未知的资产类型')
      return
    }
    const name = `未命名${def.name}`
    const payload = def.emptyPayload()
    const envelope = { schema_version: 1, payload }
    const content = JSON.stringify(envelope)
    const size = new Blob([content]).size
    try {
      const res = await createProjectFile(projectId, {
        name,
        type,
        ext: '',
        size,
        source: 'system',
        content
      })
      const data = res.data as any
      const isSuccess = data.code === 200 || data.status === 200
      if (isSuccess && data.data) {
        const createdFile = data.data as ProjectFile
        const current = project.value.files ?? []
        store.updateProject(projectId, { files: [createdFile, ...current] })
        router.push(
          `/project/artifact/${projectId}/${createdFile.id}/${type}?name=${encodeURIComponent(name)}`
        )
      } else {
        message.error(data.message || '创建失败')
      }
    } catch (e: any) {
      console.error('创建嵌入式资产失败:', e)
      message.error(e?.response?.data?.message || '创建失败，请检查网络连接')
    }
  }

  async function confirmAddFile() {
    if (!project.value) return
    if (!createFilePluginId.value) {
      message.warning('请选择生成插件')
      return
    }
    const title = newFileTitle.value.trim()
    if (!title) {
      message.warning('请输入文件名称')
      return
    }

    const pluginId = createFilePluginId.value
    const selected = enabledPlugins.value.find((p) => p.id === pluginId)
    if (!selected) {
      message.warning('插件不存在')
      return
    }

    const safeTitle = stripExtFromTitle(title).replace(/[\\/:*?"<>|]/g, '_').trim()
    const filename = `${safeTitle || title}.${selected.export.ext}`
    let rawContent = buildTemplateContent(pluginId, project.value)

    if (useAiGenerate.value) {
      message.info('AI 正在生成内容，请稍候...')
      try {
        const aiPrompt = buildAiPrompt(pluginId, safeTitle || title, project.value)
        const res = await sendSimpleChat(aiPrompt)
        const data = res.data as any
        const aiContent = data.data?.content || data.data
        if (aiContent && typeof aiContent === 'string') {
          rawContent = aiContent
          message.success('AI 生成成功')
        } else {
          message.warning('AI 生成内容为空，使用默认模板')
        }
      } catch (e) {
        console.error('AI 生成失败:', e)
        message.warning('AI 生成失败，使用默认模板')
      }
    }

    const exportContent = buildExportContent(pluginId, rawContent)
    const blob = new Blob([exportContent], { type: selected.export.mime })
    await addFileRecord({
      id: `file-${Date.now()}`,
      name: filename,
      type: detectFileTypeByExt(selected.export.ext),
      ext: selected.export.ext,
      size: blob.size,
      updatedAt: Date.now(),
      source: 'plugin',
      pluginId,
      content: rawContent
    })

    showAddFileModal.value = false
    newFileTitle.value = ''
    createFilePluginId.value = null
    useAiGenerate.value = false
    message.success('创建成功')
  }

  return {
    projectId,
    project,
    projectMembers,
    activeMenuKey,
    menuOptions,
    currentTitle,
    isHomeEditing,
    saving,
    homeForm,
    settingsForm,
    visibilityOptions,
    marketFilter,
    keyword,
    enabledPluginIds,
    enabledPlugins,
    myPlugins,
    workspacePlugins,
    filteredMyPlugins,
    getPluginIcon,
    goToToolMarket,
    togglePlugin,
    isEnabled,
    fileSearch,
    showAddFileModal,
    createFilePluginId,
    newFileTitle,
    useAiGenerate,
    createFilePluginOptions,
    filteredFiles,
    projectFiles,
    recentFiles,
    fileStats,
    artifactCreateOptions,
    init,
    startHomeEdit,
    cancelHomeEdit,
    saveHomeEdit,
    saveSettings,
    handleUploadCover,
    handleBack,
    renderMenuIcon,
    stringToColor,
    openFile,
    handleDeleteFile,
    openAddFileModal,
    cancelAddFile,
    confirmAddFile,
    handleArtifactCreateSelect,
    createArtifact,
    formatDateTime,
    formatSize,
    fileTypeLabel,
    fileTypeTagType,
    detectFileTypeByExt
  }
}

export function useProjectWorkspaceContext() {
  const ctx = inject(WORKSPACE_KEY)
  if (!ctx) {
    throw new Error('useProjectWorkspaceContext 必须在 ProjectWorkspaceView 内使用')
  }
  return ctx
}
