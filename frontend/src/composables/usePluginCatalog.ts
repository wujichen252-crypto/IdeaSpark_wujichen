import { ref, computed } from 'vue'

export type PluginCategory = '文案' | 'UI' | '分析' | '管理'

export interface PluginItem {
  id: string
  key: string
  name: string
  category: PluginCategory
  icon: string
  description: string
}

/**
 * 获取插件目录与选择逻辑
 * @returns 插件列表、分类、推荐组合、选择与排序方法
 */
export function usePluginCatalog() {
  const allPlugins = ref<PluginItem[]>([
    { id: 'p_copywriter', key: 'copywriter', name: '文案生成', category: '文案', icon: 'CreateOutline', description: '生成产品文案、Slogan、推介稿等' },
    { id: 'p_brand', key: 'brand', name: '品牌命名', category: '文案', icon: 'BulbOutline', description: 'AI 命名与品牌语调建议' },
    { id: 'p_ui', key: 'ui', name: 'UI 风格建议', category: 'UI', icon: 'ColorPaletteOutline', description: '配色、字体与版式建议' },
    { id: 'p_logo', key: 'logo', name: 'Logo 概念', category: 'UI', icon: 'ImageOutline', description: '生成 Logo 概念与参考图' },
    { id: 'p_analyze', key: 'analyze', name: '需求分析', category: '分析', icon: 'Search', description: '痛点拆解、竞品与可行性分析' },
    { id: 'p_mvp', key: 'mvp', name: 'MVP 规划', category: '分析', icon: 'GitNetworkOutline', description: '定义最小可行产品与里程碑' },
    { id: 'p_manage', key: 'manage', name: '任务管理', category: '管理', icon: 'ClipboardOutline', description: '任务拆解、进度与提醒' },
    { id: 'p_docs', key: 'docs', name: '文档中心', category: '管理', icon: 'DocumentTextOutline', description: '输出规划文档与汇报材料' }
  ])

  const categories = ref<PluginCategory[]>(['文案', 'UI', '分析', '管理'])
  const activeCategory = ref<PluginCategory>('文案')
  const selected = ref<string[]>([])

  const recommendedCombos = ref<{ id: string; name: string; pluginIds: string[] }[]>([
    { id: 'combo_startup', name: '创业起步组合', pluginIds: ['p_analyze', 'p_mvp', 'p_copywriter'] },
    { id: 'combo_branding', name: '品牌表达组合', pluginIds: ['p_brand', 'p_copywriter', 'p_ui', 'p_logo'] },
    { id: 'combo_docs', name: '交付文档组合', pluginIds: ['p_docs', 'p_copywriter'] }
  ])

  const filteredPlugins = computed(() => 
    allPlugins.value.filter(p => p.category === activeCategory.value)
  )

  /**
   * 切换插件选择状态
   * @param id 插件ID
   */
  function togglePlugin(id: string) {
    const idx = selected.value.indexOf(id)
    if (idx === -1) selected.value.push(id)
    else selected.value.splice(idx, 1)
  }

  /**
   * 应用推荐组合
   * @param comboId 组合ID
   */
  function applyCombo(comboId: string) {
    const combo = recommendedCombos.value.find(c => c.id === comboId)
    if (!combo) return
    const set = new Set(selected.value)
    combo.pluginIds.forEach(id => set.add(id))
    selected.value = Array.from(set)
  }

  /**
   * 上移选中插件顺序
   * @param id 插件ID
   */
  function moveUp(id: string) {
    const i = selected.value.indexOf(id)
    if (i > 0) {
      const tmp = selected.value[i - 1]
      if (!tmp) return
      selected.value[i - 1] = id
      selected.value[i] = tmp
    }
  }

  /**
   * 下移选中插件顺序
   * @param id 插件ID
   */
  function moveDown(id: string) {
    const i = selected.value.indexOf(id)
    if (i !== -1 && i < selected.value.length - 1) {
      const tmp = selected.value[i + 1]
      if (!tmp) return
      selected.value[i + 1] = id
      selected.value[i] = tmp
    }
  }

  /**
   * 清空选择
   */
  function clearSelection() {
    selected.value = []
  }

  return {
    allPlugins,
    categories,
    activeCategory,
    filteredPlugins,
    selected,
    recommendedCombos,
    togglePlugin,
    applyCombo,
    moveUp,
    moveDown,
    clearSelection
  }
}
