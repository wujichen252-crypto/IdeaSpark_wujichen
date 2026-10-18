// ============================================================
// QUARANTINED DEAD CODE — DO NOT IMPORT.
// ------------------------------------------------------------
// Verbatim copy of the FULL <script setup> of ProjectWorkspaceView.vue
// (both live and dead logic) captured at refactor time, for review only.
// The 'plugin tool drawer + AI PPT generator' subsystem in here
// (openPlugin / showToolDrawer / toolForm / pptAiForm / generatePptByAi /
// buildTemplateContent / mockGeneratePptContent / download ...) is DEAD:/n// the template never binds it (no <n-drawer> ...), and only goToToolMarket
// (which just window.open('/tools')) is reachable. Kept verbatim so the
// original behaviour is auditable. Never imported => never executed/bundled.
// ============================================================

import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Component } from 'vue'
import type { MenuOption } from 'naive-ui'
import { useMessage, useDialog, NEmpty, NButton, NIcon, NInput, NCard, NTag, NRadioGroup, NRadioButton, NDrawer, NDrawerContent, NSpace, NLayout, NLayoutSider, NLayoutContent, NMenu, NAvatar, NDivider, NList, NListItem, NForm, NFormItem, NSelect, NSwitch, NGrid, NGridItem, NModal, NText, type UploadCustomRequestOptions } from 'naive-ui'
import { ArrowBack, DocumentTextOutline, DocumentOutline, GridOutline, EaselOutline, ExtensionPuzzleOutline, HomeOutline, FolderOpenOutline, PeopleOutline, SettingsOutline, TimeOutline, SparklesOutline, ImageOutline, VideocamOutline, MusicalNotesOutline, ColorPaletteOutline, CodeSlashOutline, BarChartOutline, LanguageOutline, TrashOutline } from '@vicons/ionicons5'
import request, { type Result } from '@/api/request'
import { useAiWorkshopStore, type ProjectFile, type ProjectFileType } from '@/store/modules/aiWorkshop'
import { getProjectDetail, getProjectMembers, updateProject } from '@/api/project'
import { sendSimpleChat } from '@/api/ai'
import { uploadFile } from '@/api/file'
import { createProjectFile, deleteProjectFile } from '@/api/projectFile'
import { findEditorByType } from '@/constants/embeddedEditors'
import type { ArtifactType } from '@/components/embedded/types'
import { toggleProjectPlugin, getProjectPluginIds } from '@/api/projectPlugin'
import { getMyPlugins } from '@/api/userPlugin'
import type { Project as ApiProject, ProjectMember } from '@/api/types'
import type { Plugin } from '@/api/plugin'

const route = useRoute()
const router = useRouter()
const store = useAiWorkshopStore()
const message = useMessage()
const dialog = useDialog()
const projectId = route.params.id as string

const project = computed(() => store.getProjectById(projectId))

// 项目成员列表
const projectMembers = ref<ProjectMember[]>([])

/**
 * 加载项目详情数据
 */
/**
 * 加载项目已启用插件列表
 */
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
    // 后端返回的格式可能是 { code, message, data } 或 { status, message, data }
    const data = res.data as any
    const isSuccess = data.code === 200 || data.status === 200
    if (isSuccess && res.data.data) {
      const apiProject: any = res.data.data
      // 将后端数据转换为 store 支持的格式
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
      // 单独加载已启用插件列表
      await loadProjectPlugins()
    } else {
      message.error(res.data.message || '获取项目详情失败')
    }
  } catch (error: any) {
    console.error('加载项目详情失败:', error)
    message.error(error.response?.data?.message || '加载项目详情失败，请检查网络连接')
  }
}

/**
 * 加载用户已拥有的插件列表
 */
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

/**
 * 加载项目成员列表
 */
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

// 组件挂载时加载数据
onMounted(() => {
  loadProjectDetail()
  loadMyPlugins()
  loadProjectMembers()
})

type WorkspaceMenuKey = 'home' | 'files' | 'members' | 'settings' | 'plugins'

type PluginSource = 'official' | 'community'
type WorkspacePlugin = {
  id: string
  name: string
  description: string
  source: PluginSource
  icon: Component
  color: string
  export: { ext: string; mime: string; filenameSuffix?: string }
  prompt: string
}

const workspacePlugins = computed<WorkspacePlugin[]>(() => {
  const basePrompt = project.value
    ? `项目名称：${project.value.name}\n项目简介：${project.value.description || '暂无'}\n`
    : ''

  return [
    {
      id: 'plg-tool-md',
      name: 'MD 文档生成',
      description: '生成项目说明、需求文档、周报等 Markdown 文档',
      source: 'official',
      icon: DocumentTextOutline,
      color: '#111827',
      export: { ext: 'md', mime: 'text/markdown', filenameSuffix: 'doc' },
      prompt: `${basePrompt}请生成一份适合直接保存为 Markdown 的项目文档。`
    },
    {
      id: 'plg-tool-word',
      name: 'Word 文档生成',
      description: '生成可直接保存为 Word 的汇报/说明文档（基础版）',
      source: 'official',
      icon: DocumentOutline,
      color: '#2563eb',
      export: { ext: 'doc', mime: 'application/msword', filenameSuffix: 'report' },
      prompt: `${basePrompt}请生成一份适合汇报的 Word 文档内容，包含标题、摘要、正文要点与结论。`
    },
    {
      id: 'plg-tool-excel',
      name: 'Excel 表格生成',
      description: '生成可用 Excel 打开的表格（CSV 格式）',
      source: 'official',
      icon: GridOutline,
      color: '#16a34a',
      export: { ext: 'csv', mime: 'text/csv', filenameSuffix: 'table' },
      prompt: `${basePrompt}请生成一份 CSV 表格，列出项目任务、负责人、截止日期、状态与备注。`
    },
    {
      id: 'plg-tool-ppt',
      name: 'PPT 生成',
      description: '生成路演/汇报 PPT 的大纲（基础版）',
      source: 'official',
      icon: EaselOutline,
      color: '#f97316',
      export: { ext: 'ppt', mime: 'application/vnd.ms-powerpoint', filenameSuffix: 'pitch' },
      prompt: `${basePrompt}请生成一份 PPT 大纲（按页），包含标题页、问题、方案、亮点、商业模式、进度与计划、团队、总结。`
    },
    {
      id: 'plg-community-template-pack',
      name: '社区模板包',
      description: '社区贡献的文档/表格模板集合（示例）',
      source: 'community',
      icon: ExtensionPuzzleOutline,
      color: '#7c3aed',
      export: { ext: 'md', mime: 'text/markdown', filenameSuffix: 'template' },
      prompt: `${basePrompt}请生成一份“社区模板包”介绍页（Markdown）。`
    },
    {
      id: 'plg-community-weekly-report',
      name: '周报生成器（社区）',
      description: '生成项目周报 Markdown 模板，便于团队同步',
      source: 'community',
      icon: DocumentTextOutline,
      color: '#0ea5e9',
      export: { ext: 'md', mime: 'text/markdown', filenameSuffix: 'weekly' },
      prompt: `${basePrompt}请生成一份结构清晰的项目周报，包含进展、风险、计划与待协助事项。`
    },
    {
      id: 'plg-community-meeting-minutes',
      name: '会议纪要（社区）',
      description: '生成会议纪要模板与行动项清单',
      source: 'community',
      icon: DocumentTextOutline,
      color: '#64748b',
      export: { ext: 'md', mime: 'text/markdown', filenameSuffix: 'minutes' },
      prompt: `${basePrompt}请生成一份会议纪要模板，包含参会人、议题、结论与行动项。`
    },
    {
      id: 'plg-community-gantt-csv',
      name: '甘特表（社区）',
      description: '生成可在 Excel 打开的甘特/排期表（CSV）',
      source: 'community',
      icon: GridOutline,
      color: '#84cc16',
      export: { ext: 'csv', mime: 'text/csv', filenameSuffix: 'gantt' },
      prompt: `${basePrompt}请生成一个 CSV 排期表，列出阶段、任务、开始日期、结束日期、负责人与状态。`
    }
  ]
})

const enabledPluginIds = computed(() => project.value?.plugins ?? [])
// 从用户已拥有的插件中筛选已启用的
const enabledPlugins = computed(() => (myPlugins.value || []).filter(p => enabledPluginIds.value.includes(p.id)))

// 用户已拥有的插件列表
const myPlugins = ref<Plugin[]>([])
const myPluginIds = computed(() => myPlugins.value.map(p => p.id))

// 从 URL 查询参数中读取当前标签页
const getInitialTab = (): WorkspaceMenuKey => {
  const tab = route.query.tab as string
  const validTabs: WorkspaceMenuKey[] = ['home', 'files', 'members', 'settings', 'plugins']
  return validTabs.includes(tab as WorkspaceMenuKey) ? (tab as WorkspaceMenuKey) : 'home'
}

const activeMenuKey = ref<WorkspaceMenuKey>(getInitialTab())

// 监听 activeMenuKey 变化，同步到 URL
watch(activeMenuKey, (newTab) => {
  router.replace({
    query: { ...route.query, tab: newTab }
  })
})
const marketFilter = ref<'all' | 'official' | 'community'>('official')
const keyword = ref('')

// 只显示用户已拥有但未启用的插件
const filteredMyPlugins = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return (myPlugins.value || []).filter(p => {
    // 排除已启用的插件
    if (enabledPluginIds.value.includes(p.id)) return false
    if (marketFilter.value !== 'all' && p.source !== marketFilter.value) return false
    if (!kw) return true
    return `${p.name} ${p.description}`.toLowerCase().includes(kw)
  })
})

// 跳转到工具市场
function goToToolMarket() {
  window.open('http://localhost:5173/tools', '_blank')
}

/**
 * 根据图标名称获取图标组件
 */
function getPluginIcon(iconName: string | undefined): Component {
  const iconMap: Record<string, Component> = {
    'DocumentTextOutline': DocumentTextOutline,
    'DocumentOutline': DocumentOutline,
    'GridOutline': GridOutline,
    'EaselOutline': EaselOutline,
    'ExtensionPuzzleOutline': ExtensionPuzzleOutline,
    'SparklesOutline': SparklesOutline,
    'ImageOutline': ImageOutline,
    'VideocamOutline': VideocamOutline,
    'MusicalNotesOutline': MusicalNotesOutline,
    'ColorPaletteOutline': ColorPaletteOutline,
    'CodeSlashOutline': CodeSlashOutline,
    'BarChartOutline': BarChartOutline,
    'LanguageOutline': LanguageOutline
  }
  return iconMap[iconName || ''] || ExtensionPuzzleOutline
}

const isHomeEditing = ref(false)
const saving = ref(false)

/**
 * 插件工具相关状态
 */
const activePluginId = ref<string>('')
const pptActiveSlideIndex = ref<number>(0)
const toolForm = ref({
  title: '',
  content: '',
  value: ''
})
const showToolDrawer = ref(false)

/**
 * PPT AI 生成相关状态
 */
const pptAiForm = reactive({
  title: '',
  topic: '',
  style: 'report' as 'report' | 'pitch' | 'training',
  pageCount: 8,
  audience: '',
  description: '',
  extra: ''
})
const showPptAiModal = ref(false)
const pptAiGenerating = ref(false)
const pptAiApplyMode = ref<'replace' | 'append'>('replace')

const visibilityOptions = [
  { label: '私有项目', value: 'private' },
  { label: '公开项目', value: 'public' }
]

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

const menuOptions = computed<MenuOption[]>(() => {
  return [
    { key: 'home', label: '项目首页', icon: renderMenuIcon(HomeOutline) },
    { key: 'files', label: '项目文件', icon: renderMenuIcon(FolderOpenOutline) },
    { key: 'members', label: '成员管理', icon: renderMenuIcon(PeopleOutline) },
    { key: 'settings', label: '项目设置', icon: renderMenuIcon(SettingsOutline) },
    { key: 'plugins', label: '项目插件', icon: renderMenuIcon(ExtensionPuzzleOutline) }
  ]
})

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

/**
 * 生成菜单图标渲染函数
 */
function renderMenuIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

/**
 * 根据文本生成稳定的颜色值（用于头像背景）
 */
function stringToColor(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 60% 45%)`
}

/**
 * 返回上一级路由
 */
function handleBack() {
  if (canGoBack()) {
    router.back()
    return
  }
  router.replace('/workbench')
}

/**
 * 判断是否可以安全返回上一页
 */
function canGoBack() {
  const state = router.options.history.state
  return typeof state.back === 'string' && state.back.length > 0
}

/**
 * 将当前项目数据同步到设置表单
 */
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

/**
 * 保存项目基础设置
 */
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

/**
 * 处理封面上传
 */
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

const createFilePluginOptions = computed(() => {
  return enabledPlugins.value.map(p => ({
    label: `${p.name}（${p.source === 'official' ? '官方' : '社区'} · .${p.export.ext}）`,
    value: p.id
  }))
})

const filteredFiles = computed(() => {
  const kw = fileSearch.value.trim().toLowerCase()
  if (!kw) return projectFiles.value
  return projectFiles.value.filter(f => f.name.toLowerCase().includes(kw))
})

function parseCommaList(input: string) {
  const raw = input
    .split(/[,，]/g)
    .map(s => s.trim())
    .filter(Boolean)
  return Array.from(new Set(raw))
}

function formatDateTime(timestamp: number) {
  const d = new Date(timestamp)
  return d.toLocaleString()
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function fileTypeLabel(type: ProjectFileType) {
  const map: Record<ProjectFileType, string> = {
    document: '文档',
    sheet: '表格',
    slide: '演示',
    image: '图片',
    whiteboard: '白板',
    mindmap: '思维导图',
    flow: '流程图',
    other: '其他'
  }
  return map[type]
}

function fileTypeTagType(type: ProjectFileType) {
  if (type === 'document') return 'info'
  if (type === 'sheet') return 'success'
  if (type === 'slide') return 'warning'
  if (type === 'image') return 'primary'
  return 'default'
}

function detectFileTypeByExt(ext: string): ProjectFileType {
  const lower = ext.toLowerCase()
  if (['md', 'doc', 'docx', 'txt'].includes(lower)) return 'document'
  if (['csv', 'xls', 'xlsx'].includes(lower)) return 'sheet'
  if (['ppt', 'pptx'].includes(lower)) return 'slide'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(lower)) return 'image'
  return 'other'
}

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
      // 回退到本地保存
      const current = project.value.files ?? []
      store.updateProject(projectId, { files: [file, ...current] })
      message.warning('服务器保存失败，已本地保存')
    }
  } catch (error: any) {
    console.error('创建文件失败:', error)
    // 回退到本地保存
    const current = project.value.files ?? []
    store.updateProject(projectId, { files: [file, ...current] })
    message.warning('服务器保存失败，已本地保存')
  }
}

/**
 * 打开文件编辑页面
 * @param file - 文件记录
 */
// 嵌入式资产类型（白板 / 思维导图 / 流程图），按其 type 区分而非扩展名
const EMBEDDED_FILE_TYPES: ProjectFileType[] = ['whiteboard', 'mindmap', 'flow']

function openFile(file: ProjectFile) {
  // 嵌入式资产走统一编辑器路由，按 type 渲染对应编辑器本体
  if (EMBEDDED_FILE_TYPES.includes(file.type)) {
    router.push({
      name: 'EmbeddedArtifact',
      params: { id: projectId, fileId: file.id, type: file.type },
      query: { name: file.name }
    })
    return
  }
  // 其余按文件扩展名判断文件类型
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'ppt' || ext === 'pptx') {
    // PPT文件使用幻灯片编辑器
    router.push({ name: 'SlideEditor', params: { id: projectId, fileId: file.id } })
  } else if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
    // Excel/CSV文件使用Excel编辑器
    router.push({ name: 'ExcelEditor', params: { id: projectId, fileId: file.id } })
  } else {
    // 其他文件使用通用编辑器
    router.push({ name: 'ProjectFileEditor', params: { id: projectId, fileId: file.id } })
  }
}

/**
 * 删除项目文件
 */
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
          store.updateProject(projectId, {
            files: current.filter(f => f.id !== file.id)
          })
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

/**
 * 打开新增文件弹窗
 */
function openAddFileModal() {
  newFileTitle.value = ''
  createFilePluginId.value = enabledPlugins.value[0]?.id ?? null
  showAddFileModal.value = true
}

/**
 * 关闭新增文件弹窗
 */
function cancelAddFile() {
  showAddFileModal.value = false
  newFileTitle.value = ''
  createFilePluginId.value = null
  useAiGenerate.value = false
}

/**
 * 新建嵌入式资产（白板 / 思维导图 / 流程图）
 * @description 直接调 createProjectFile 写入空信封 JSON，随后跳转统一编辑器路由。
 * 后端 /content 接口会解析 content 字段中的 { schema_version, payload } 信封。
 */
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

/**
 * 从标题移除扩展名
 */
function stripExtFromTitle(title: string) {
  const dot = title.lastIndexOf('.')
  if (dot <= 0) return title
  return title.slice(0, dot)
}

/**
 * 确认新增文件（选择插件并打开生成抽屉）
 */
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
  const selected = enabledPlugins.value.find(p => p.id === pluginId)
  if (!selected) {
    message.warning('插件不存在')
    return
  }

  const safeTitle = stripExtFromTitle(title).replace(/[\\/:*?"<>|]/g, '_').trim()
  const filename = `${safeTitle || title}.${selected.export.ext}`
  let rawContent = buildTemplateContent(pluginId)

  // AI 生成内容
  if (useAiGenerate.value) {
    message.info('AI 正在生成内容，请稍候...')
    try {
      const aiPrompt = buildAiPrompt(pluginId, safeTitle || title)
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

/**
 * 判断插件是否已在当前项目启用
 */
function isEnabled(pluginId: string) {
  return enabledPluginIds.value.includes(pluginId)
}

/**
 * 切换插件启用状态（调用后端 API 保存到当前项目）
 */
async function togglePlugin(pluginId: string) {
  if (!project.value) return
  try {
    const res = await toggleProjectPlugin(projectId, pluginId)
    const data = res.data as any
    const isSuccess = data.code === 200 || data.status === 200
    if (isSuccess) {
      // 重新获取已启用插件列表
      await loadProjectPlugins()
    } else {
      message.error(data.message || '操作失败')
    }
  } catch (error: any) {
    console.error('切换插件状态失败:', error)
    message.error(error.response?.data?.message || '操作失败，请检查网络连接')
  }
}

/**
 * 打开插件工具抽屉，并在需要时自动启用官方插件
 */
async function openPlugin(pluginId: string) {
  activePluginId.value = pluginId
  const selected = workspacePlugins.value.find(p => p.id === pluginId)
  if (selected && selected.source === 'official' && !isEnabled(pluginId)) {
    await togglePlugin(pluginId)
  }
  pptActiveSlideIndex.value = 0
  toolForm.value = {
    title: project.value?.name ? `${project.value.name} - ${selected?.name || '工具'}` : selected?.name || '工具',
    content: pluginId === 'plg-tool-ppt' ? buildTemplateContent(pluginId) : '',
    value: ''
  }
  showToolDrawer.value = true
}

/**
 * 构建 AI 生成 Prompt
 */
function buildAiPrompt(pluginId: string, title: string): string {
  const projectName = project.value?.name || '当前项目'
  const projectDesc = project.value?.description || ''
  switch (pluginId) {
    case 'plg-tool-word':
      return `请为项目「${projectName}」生成一份「${title}」Word 文档内容，使用 HTML 格式（h1/h2/p/strong 等标签）。包含：背景与问题、方案概述、实施计划、结论。项目简介：${projectDesc}`
    case 'plg-tool-excel':
      return `请为项目「${projectName}」生成一个「${title}」CSV 表格，包含以下列：任务、负责人、截止日期、状态、备注。生成 5-8 行示例数据。项目简介：${projectDesc}`
    case 'plg-community-gantt-csv':
      return `请为项目「${projectName}」生成一个「${title}」甘特图 CSV 表格，包含以下列：阶段、任务、开始日期、结束日期、负责人、状态。生成 5-8 行示例数据。项目简介：${projectDesc}`
    case 'plg-tool-ppt':
      return `请为项目「${projectName}」生成一个「${title}」PPT 演示文稿的 Markdown 大纲，包含：标题页、问题、解决方案、商业模式、进度与计划、团队、总结。项目简介：${projectDesc}`
    case 'plg-community-weekly-report':
      return `请为项目「${projectName}」生成一份「${title}」周报，Markdown 格式，包含：本周进展、数据与结果、风险与阻塞、下周计划、需要协助。项目简介：${projectDesc}`
    case 'plg-community-meeting-minutes':
      return `请为项目「${projectName}」生成一份「${title}」会议纪要，Markdown 格式，包含：议题、讨论与结论、行动项（表格形式）。项目简介：${projectDesc}`
    default:
      return `请为项目「${projectName}」生成一份「${title}」文档内容，Markdown 格式。项目简介：${projectDesc}`
  }
}

/**
 * 构建不同插件的模板内容
 */
function buildTemplateContent(pluginId: string) {
  const selected = workspacePlugins.value.find(p => p.id === pluginId)
  if (!selected) return ''
  if (pluginId === 'plg-tool-excel' || pluginId === 'plg-community-gantt-csv') {
    return [
      pluginId === 'plg-community-gantt-csv'
        ? '阶段,任务,开始日期,结束日期,负责人,状态'
        : '任务,负责人,截止日期,状态,备注',
      pluginId === 'plg-community-gantt-csv'
        ? '规划,需求梳理,2025-01-01,2025-01-05,我,进行中'
        : '需求梳理,我,2025-01-05,进行中,',
      pluginId === 'plg-community-gantt-csv'
        ? '设计,原型设计,2025-01-06,2025-01-10,我,待开始'
        : '原型设计,我,2025-01-10,待开始,',
      pluginId === 'plg-community-gantt-csv'
        ? '开发,前端开发,2025-01-11,2025-01-20,我,待开始'
        : '前端开发,我,2025-01-20,待开始,'
    ].join('\n')
  }
  if (pluginId === 'plg-tool-ppt') {
    return [
      '标题页',
      `- 项目：${project.value?.name || '（项目名称）'}`,
      '- 一句话价值主张：',
      '',
      '问题',
      '- 目标用户：',
      '- 核心痛点：',
      '',
      '解决方案',
      '- 核心功能：',
      '- 关键体验：',
      '',
      '亮点',
      '- 差异化：',
      '- 壁垒：',
      '',
      '商业模式',
      '- 付费方式：',
      '- 增长路径：',
      '',
      '进度与计划',
      '- 当前里程碑：',
      '- 下一步：',
      '',
      '团队',
      '- 成员与分工：',
      '',
      '总结',
      '- 愿景：',
      '- Call to Action：'
    ].join('\n')
  }
  if (pluginId === 'plg-tool-word') {
    return [
      `<h1>${project.value?.name || '项目汇报'}</h1>`,
      `<p><strong>摘要：</strong>${project.value?.description || '（请补充项目摘要）'}</p>`,
      '<h2>一、背景与问题</h2>',
      '<p>（请补充背景、用户痛点、现状分析）</p>',
      '<h2>二、方案概述</h2>',
      '<p>（请补充核心方案、功能模块与价值）</p>',
      '<h2>三、实施计划</h2>',
      '<p>（请补充里程碑、时间表、资源与风险）</p>',
      '<h2>四、结论</h2>',
      '<p>（请补充总结与下一步行动）</p>'
    ].join('\n')
  }
  if (pluginId === 'plg-community-weekly-report') {
    return [
      `# 项目周报：${project.value?.name || '（项目名称）'}`,
      '',
      `周期：____/__/__ - ____/__/__`,
      '',
      '## 1. 本周进展',
      '- ',
      '',
      '## 2. 数据与结果（可选）',
      '- ',
      '',
      '## 3. 风险与阻塞',
      '- ',
      '',
      '## 4. 下周计划',
      '- ',
      '',
      '## 5. 需要协助',
      '- '
    ].join('\n')
  }
  if (pluginId === 'plg-community-meeting-minutes') {
    return [
      `# 会议纪要：${project.value?.name || '（项目名称）'}`,
      '',
      '时间：____/__/__ __:__',
      '参会：',
      '记录：',
      '',
      '## 1. 议题',
      '- ',
      '',
      '## 2. 讨论与结论',
      '- ',
      '',
      '## 3. 行动项（Action Items）',
      '| 事项 | 负责人 | 截止时间 | 状态 |',
      '|---|---|---|---|',
      '|  |  |  |  |'
    ].join('\n')
  }
  return [
    `# ${project.value?.name || '项目文档'}`,
    '',
    `> ${project.value?.description || '（请补充项目简介）'}`,
    '',
    '## 1. 背景',
    '',
    '## 2. 目标',
    '',
    '## 3. 范围',
    '',
    '## 4. 里程碑',
    ''
  ].join('\n')
}

/**
 * 为不同插件填充可直接编辑的模板内容
 */
function fillTemplate(pluginId: string) {
  toolForm.value.content = buildTemplateContent(pluginId)
  if (pluginId === 'plg-tool-ppt') pptActiveSlideIndex.value = 0
}

/**
 * 打开 PPT 的 AI 生成弹窗，并用当前项目/标题做默认填充
 */
function openPptAiModal() {
  const fallback = project.value?.name ? `${project.value.name} 路演 PPT` : toolForm.value.title || '路演 PPT'
  if (!pptAiForm.topic.trim()) pptAiForm.topic = fallback
  if (!pptAiForm.audience.trim()) pptAiForm.audience = '评委 / 投资人'
  showPptAiModal.value = true
}

type PptAiResponseData = { content: string }

/**
 * 生成 PPT 内容（优先请求后端 AI；失败则使用本地模拟生成）
 */
async function generatePptByAi() {
  const topic = pptAiForm.topic.trim()
  if (!topic) {
    message.warning('请输入主题')
    return
  }

  pptAiGenerating.value = true
  try {
    const content = await requestPptAiContent()
    applyGeneratedPptContent(content)
    showPptAiModal.value = false
    message.success('已生成并应用')
  } catch {
    const fallback = mockGeneratePptContent({
      topic,
      pageCount: pptAiForm.pageCount,
      audience: pptAiForm.audience.trim(),
      style: pptAiForm.style,
      extra: pptAiForm.extra.trim(),
      projectName: project.value?.name || '',
      projectDesc: project.value?.description || ''
    })
    applyGeneratedPptContent(fallback)
    showPptAiModal.value = false
    message.success('已生成并应用（本地模拟）')
  } finally {
    pptAiGenerating.value = false
  }
}

/**
 * 请求后端 AI 生成 PPT 的内容（按页用空行分隔）
 */
async function requestPptAiContent() {
  const prompt = buildPptAiPrompt({
    topic: pptAiForm.topic.trim(),
    pageCount: pptAiForm.pageCount,
    audience: pptAiForm.audience.trim(),
    style: pptAiForm.style,
    extra: pptAiForm.extra.trim(),
    projectName: project.value?.name || '',
    projectDesc: project.value?.description || ''
  })

  const res = await request.post<Result<PptAiResponseData>>('/ai/ppt', {
    prompt,
    meta: {
      topic: pptAiForm.topic.trim(),
      pageCount: pptAiForm.pageCount,
      audience: pptAiForm.audience.trim(),
      style: pptAiForm.style
    }
  })
  const content = res.data.data?.content
  if (!content || !content.trim()) throw new Error('Empty AI content')
  return normalizePptText(content)
}

/**
 * 应用生成结果到当前 PPT 编辑器
 */
function applyGeneratedPptContent(content: string) {
  const normalized = normalizePptText(content)
  if (pptAiApplyMode.value === 'append' && toolForm.value.content.trim()) {
    const prevLen = parsePptSlideBlocks(toolForm.value.content).length
    toolForm.value.content = `${normalizePptText(toolForm.value.content)}\n\n${normalized}\n`
    pptActiveSlideIndex.value = prevLen
    return
  }
  toolForm.value.content = `${normalized}\n`
  pptActiveSlideIndex.value = 0
}

type MockPptGenInput = {
  topic: string
  pageCount: number
  audience: string
  style: 'pitch' | 'report' | 'training'
  extra: string
  projectName: string
  projectDesc: string
}

/**
 * 本地模拟生成 PPT 内容：用于无后端 AI 时的可用体验
 */
function mockGeneratePptContent(input: MockPptGenInput) {
  const blocks = buildMockPptBlocks(input)
  return blocks.join('\n\n') + '\n'
}

/**
 * 将用户信息拼装成适合后端大模型的 Prompt
 */
function buildPptAiPrompt(input: MockPptGenInput) {
  const styleLabelMap: Record<MockPptGenInput['style'], string> = {
    pitch: '路演/创业',
    report: '汇报/总结',
    training: '培训/课程'
  }
  const ctx = [
    input.projectName ? `项目名称：${input.projectName}` : '',
    input.projectDesc ? `项目简介：${input.projectDesc}` : ''
  ].filter(Boolean).join('\n')

  return [
    '你是一名 PPT 内容策划师，请输出“按页分隔”的 PPT 文本大纲。',
    '要求：',
    `- 主题：${input.topic}`,
    `- 页数：${input.pageCount} 页`,
    `- 受众：${input.audience || '通用受众'}`,
    `- 风格：${styleLabelMap[input.style]}`,
    '- 输出格式：每一页一个段落块，块与块之间必须用一个空行分隔；每页第一行为标题；后续用条目符号（-）列要点。',
    input.extra ? `- 补充要求：${input.extra}` : '',
    ctx ? `参考上下文：\n${ctx}` : '',
    '现在开始输出。'
  ].filter(Boolean).join('\n')
}

/**
 * 生成模拟 PPT 各页块（每块代表一页）
 */
function buildMockPptBlocks(input: MockPptGenInput) {
  const baseTitle = input.projectName || input.topic
  const blocks: string[] = []

  const candidates: Array<{ title: string; bullets: string[] }> = [
    {
      title: '标题页',
      bullets: [
        `- 主题：${input.topic}`,
        baseTitle !== input.topic ? `- 项目：${baseTitle}` : '- 项目：',
        input.audience ? `- 面向：${input.audience}` : '- 面向：'
      ]
    },
    { title: '一句话价值主张', bullets: ['- 我们解决什么问题？', '- 给谁解决？', '- 产生什么价值？'] },
    { title: '问题与痛点', bullets: ['- 目标用户是谁？', '- 现状是什么？', '- 痛点与成本有哪些？'] },
    { title: '解决方案', bullets: ['- 核心思路', '- 关键能力/功能', '- 使用流程（3 步）'] },
    { title: '产品形态与亮点', bullets: ['- 核心功能模块', '- 差异化亮点', '- 技术/资源壁垒'] },
    { title: '市场与场景', bullets: ['- 典型使用场景', '- 市场规模/机会', '- 竞争格局（可写 2-3 个）'] },
    { title: '商业模式', bullets: ['- 收费方式', '- 增长路径', '- 成本结构与毛利（可选）'] },
    { title: '数据与进展', bullets: ['- 当前进度/里程碑', '- 已验证的结果（数据/反馈）', '- 下一步要验证什么？'] },
    { title: '路线图', bullets: ['- 1-2 周', '- 1-2 月', '- 3-6 月'] },
    { title: '团队', bullets: ['- 成员与分工', '- 关键经验/优势', '- 需要的资源/协作'] },
    { title: '总结与行动', bullets: ['- 我们的愿景', '- 现在需要什么支持？', '- 谢谢'] }
  ]

  const pageCount = Math.min(Math.max(Math.floor(input.pageCount), 1), 20)
  const picked = candidates.slice(0, Math.min(pageCount, candidates.length))

  for (const item of picked) {
    const body = [item.title, ...item.bullets].join('\n')
    blocks.push(body)
  }

  while (blocks.length < pageCount) {
    const idx = blocks.length + 1
    blocks.push(`补充页 ${idx}\n- 要点 1\n- 要点 2\n- 要点 3`)
  }

  return blocks
}

/**
 * 规范化 PPT 文本：统一换行并确保按空行分隔页
 */
function normalizePptText(text: string) {
  const normalized = (text || '').replace(/\r\n/g, '\n')
  const blocks = parsePptSlideBlocks(normalized)
  return blocks.map(b => b.trim()).filter(Boolean).join('\n\n')
}

function parsePptSlideBlocks(text: string) {
  const normalized = (text || '').replace(/\r\n/g, '\n').trim()
  if (!normalized) return ['']
  const blocks = normalized.split(/\n\s*\n+/g).map(b => b.trim()).filter(Boolean)
  return blocks.length ? blocks : ['']
}

function updatePptSlideBlock(fullText: string, index: number, nextBlock: string) {
  const blocks = parsePptSlideBlocks(fullText)
  const safeIndex = Math.min(Math.max(index, 0), blocks.length - 1)
  blocks[safeIndex] = (nextBlock || '').trim()
  return blocks.join('\n\n') + '\n'
}

function pptSlideSummary(block: string) {
  const firstLine = (block || '').split('\n')[0] || ''
  return firstLine.slice(0, 24)
}

function addPptSlide() {
  const blocks = parsePptSlideBlocks(toolForm.value.content)
  blocks.push('')
  toolForm.value.content = blocks.join('\n\n') + '\n'
  pptActiveSlideIndex.value = blocks.length - 1
}

function removeActivePptSlide() {
  const blocks = parsePptSlideBlocks(toolForm.value.content)
  if (blocks.length <= 1) {
    toolForm.value.content = ''
    pptActiveSlideIndex.value = 0
    return
  }
  const safeIndex = Math.min(Math.max(pptActiveSlideIndex.value, 0), blocks.length - 1)
  blocks.splice(safeIndex, 1)
  toolForm.value.content = blocks.join('\n\n') + '\n'
  pptActiveSlideIndex.value = Math.min(safeIndex, blocks.length - 1)
}

/**
 * 将内容转换为导出格式（用于统计大小/下载）
 */
function buildExportContent(pluginId: string, content: string) {
  if (pluginId === 'plg-tool-word' || pluginId === 'plg-tool-ppt') {
    return `<!doctype html><html><head><meta charset="utf-8"></head><body>${content || ''}</body></html>`
  }
  return content || ''
}

/**
 * 将当前内容按插件类型下载为本地文件
 */
async function download(pluginId: string) {
  const selected = workspacePlugins.value.find(p => p.id === pluginId)
  if (!selected) return

  const safeTitle = (toolForm.value.title || selected.name).replace(/[\\/:*?"<>|]/g, '_').trim() || selected.name
  const suffix = selected.export.filenameSuffix ? `-${selected.export.filenameSuffix}` : ''
  const filename = `${safeTitle}${suffix}.${selected.export.ext}`

  const content = buildExportContent(pluginId, toolForm.value.content)

  const blob = new Blob([content], { type: selected.export.mime })
  await addFileRecord({
    id: `file-${Date.now()}`,
    name: filename,
    type: detectFileTypeByExt(selected.export.ext),
    ext: selected.export.ext,
    size: blob.size,
    updatedAt: Date.now(),
    source: 'plugin',
    pluginId,
    content: toolForm.value.content
  })
  downloadBlob(filename, blob)
}

/**
 * 触发浏览器下载（Blob）
 */
function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
