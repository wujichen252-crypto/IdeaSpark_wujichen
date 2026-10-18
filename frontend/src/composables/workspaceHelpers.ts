import type { Component } from 'vue'
import {
  DocumentTextOutline,
  DocumentOutline,
  GridOutline,
  EaselOutline,
  ExtensionPuzzleOutline,
  SparklesOutline,
  ImageOutline,
  VideocamOutline,
  MusicalNotesOutline,
  ColorPaletteOutline,
  CodeSlashOutline,
  BarChartOutline,
  LanguageOutline
} from '@vicons/ionicons5'
import type { ProjectFile, ProjectFileType } from '@/store/modules/aiWorkshop'

/** 助手函数仅用到 name/description，用结构类型解耦对 ApiProject/ProjectSummary 的依赖 */
export type ProjectLike = { name?: string; description?: string }

export type WorkspaceMenuKey = 'home' | 'files' | 'members' | 'settings' | 'plugins'
export type PluginSource = 'official' | 'community'
export type WorkspacePlugin = {
  id: string
  name: string
  description: string
  source: PluginSource
  icon: Component
  color: string
  export: { ext: string; mime: string; filenameSuffix?: string }
  prompt: string
}

export const visibilityOptions = [
  { label: '私有项目', value: 'private' },
  { label: '公开项目', value: 'public' }
]

/**
 * 构建「项目插件」列表（纯函数，依赖当前项目名/简介做 prompt 注入）
 */
export function buildWorkspacePlugins(project: ProjectLike | undefined): WorkspacePlugin[] {
  const basePrompt = project
    ? `项目名称：${project.name}\n项目简介：${project.description || '暂无'}\n`
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
}

/**
 * 根据图标名称获取图标组件
 */
export function getPluginIcon(iconName: string | undefined): Component {
  const iconMap: Record<string, Component> = {
    DocumentTextOutline,
    DocumentOutline,
    GridOutline,
    EaselOutline,
    ExtensionPuzzleOutline,
    SparklesOutline,
    ImageOutline,
    VideocamOutline,
    MusicalNotesOutline,
    ColorPaletteOutline,
    CodeSlashOutline,
    BarChartOutline,
    LanguageOutline
  }
  return iconMap[iconName || ''] || ExtensionPuzzleOutline
}

export function parseCommaList(input: string) {
  const raw = input
    .split(/[,，]/g)
    .map((s) => s.trim())
    .filter(Boolean)
  return Array.from(new Set(raw))
}

export function formatDateTime(timestamp: number) {
  const d = new Date(timestamp)
  return d.toLocaleString()
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

export function fileTypeLabel(type: ProjectFileType) {
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

export function fileTypeTagType(type: ProjectFileType) {
  if (type === 'document') return 'info'
  if (type === 'sheet') return 'success'
  if (type === 'slide') return 'warning'
  if (type === 'image') return 'primary'
  return 'default'
}

export function detectFileTypeByExt(ext: string): ProjectFileType {
  const lower = ext.toLowerCase()
  if (['md', 'doc', 'docx', 'txt'].includes(lower)) return 'document'
  if (['csv', 'xls', 'xlsx'].includes(lower)) return 'sheet'
  if (['ppt', 'pptx'].includes(lower)) return 'slide'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(lower)) return 'image'
  return 'other'
}

/**
 * 从标题移除扩展名
 */
export function stripExtFromTitle(title: string) {
  const dot = title.lastIndexOf('.')
  if (dot <= 0) return title
  return title.slice(0, dot)
}

/**
 * 构建 AI 生成 Prompt
 */
export function buildAiPrompt(pluginId: string, title: string, project?: ProjectLike): string {
  const projectName = project?.name || '当前项目'
  const projectDesc = project?.description || ''
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
export function buildTemplateContent(pluginId: string, project?: ProjectLike): string {
  const selected = buildWorkspacePlugins(project).find((p) => p.id === pluginId)
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
      `- 项目：${project?.name || '（项目名称）'}`,
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
      `<h1>${project?.name || '项目汇报'}</h1>`,
      `<p><strong>摘要：</strong>${project?.description || '（请补充项目摘要）'}</p>`,
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
      `# 项目周报：${project?.name || '（项目名称）'}`,
      '',
      '周期：____/__/__ - ____/__/__',
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
      `# 会议纪要：${project?.name || '（项目名称）'}`,
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
    `# ${project?.name || '项目文档'}`,
    '',
    `> ${project?.description || '（请补充项目简介）'}`,
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
 * 将内容转换为导出格式（用于统计大小/下载）
 */
export function buildExportContent(pluginId: string, content: string) {
  if (pluginId === 'plg-tool-word' || pluginId === 'plg-tool-ppt') {
    return `<!doctype html><html><head><meta charset="utf-8"></head><body>${content || ''}</body></html>`
  }
  return content || ''
}

export type { ProjectFile }
