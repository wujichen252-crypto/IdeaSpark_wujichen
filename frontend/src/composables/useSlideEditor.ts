import { ref, computed, inject, type InjectionKey } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAiWorkshopStore } from '@/store/modules/aiWorkshop'
import { useSlideAi } from '@/composables/useSlideAi'
import { getProjectDetail, updateProject } from '@/api/project'
import { copyToClipboard } from '@/utils/clipboard'

// ==================== 类型定义 ====================

export interface SlideElement {
  id: string
  type: 'text' | 'image' | 'shape'
  x: number
  y: number
  width: number
  height: number
  content?: string
  style?: Record<string, any>
}

export interface Slide {
  id: string
  layout: string
  background?: string
  theme?: string
  title?: string
  subtitle?: string
  content?: string
  elements?: SlideElement[]
  notes?: string
  transition?: string
  animation?: string
}

// ==================== 常量数据 ====================

const RIBBON_TABS = [
  { key: 'home', label: '开始' },
  { key: 'insert', label: '插入' },
  { key: 'design', label: '设计' },
  { key: 'transition', label: '切换' },
  { key: 'animation', label: '动画' }
]

const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Roboto', value: 'Roboto' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '宋体', value: 'SimSun' },
  { label: '黑体', value: 'SimHei' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Georgia', value: 'Georgia' }
]

const FONT_SIZE_OPTIONS = [
  { label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 },
  { label: '11', value: 11 }, { label: '12', value: 12 }, { label: '14', value: 14 },
  { label: '16', value: 16 }, { label: '18', value: 18 }, { label: '20', value: 20 },
  { label: '24', value: 24 }, { label: '28', value: 28 }, { label: '32', value: 32 },
  { label: '36', value: 36 }, { label: '40', value: 40 }, { label: '44', value: 44 },
  { label: '48', value: 48 }, { label: '54', value: 54 }, { label: '60', value: 60 },
  { label: '66', value: 66 }, { label: '72', value: 72 }, { label: '80', value: 80 },
  { label: '88', value: 88 }, { label: '96', value: 96 }
]

const ZOOM_OPTIONS = [
  { label: '50%', key: 50 }, { label: '75%', key: 75 }, { label: '90%', key: 90 },
  { label: '100%', key: 100 }, { label: '125%', key: 125 }, { label: '150%', key: 150 },
  { label: '200%', key: 200 }
]

const THEMES = [
  { key: 'default', name: '默认', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textColor: '#ffffff' },
  { key: 'business', name: '商务', preview: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', textColor: '#ffffff' },
  { key: 'creative', name: '创意', preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', textColor: '#ffffff' },
  { key: 'nature', name: '自然', preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', textColor: '#ffffff' },
  { key: 'elegant', name: '优雅', preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', textColor: '#ffffff' },
  { key: 'dark', name: '深色', preview: 'linear-gradient(135deg, #434343 0%, #000000 100%)', textColor: '#ffffff' },
  { key: 'light', name: '浅色', preview: '#ffffff', textColor: '#000000' },
  { key: 'blue', name: '蓝色', preview: '#e3f2fd', textColor: '#1565c0' },
  { key: 'green', name: '绿色', preview: '#e8f5e9', textColor: '#2e7d32' },
  { key: 'warm', name: '暖色', preview: '#fff3e0', textColor: '#e65100' }
]

const BACKGROUND_COLORS = [
  '#ffffff', '#f5f5f5', '#eeeeee', '#e0e0e0', '#bdbdbd', '#9e9e9e',
  '#757575', '#616161', '#424242', '#212121', '#000000', '#ffebee',
  '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935',
  '#d32f2f', '#c62828', '#b71c1c', '#fce4ec', '#f8bbd9', '#f48fb1'
]

const SLIDE_LAYOUTS = [
  { key: 'blank', name: '空白', hasTitle: false, hasContent: false, hasSubtitle: false },
  { key: 'title', name: '标题', hasTitle: true, hasContent: false, hasSubtitle: true },
  { key: 'title-content', name: '标题和内容', hasTitle: true, hasContent: true, hasSubtitle: false },
  { key: 'title-two-content', name: '标题和两栏', hasTitle: true, hasContent: true, hasSubtitle: false },
  { key: 'section', name: '节标题', hasTitle: true, hasContent: false, hasSubtitle: false },
  { key: 'title-only', name: '仅标题', hasTitle: true, hasContent: false, hasSubtitle: false },
  { key: 'content-caption', name: '内容和标题', hasTitle: true, hasContent: true, hasSubtitle: false },
  { key: 'picture-caption', name: '图片和标题', hasTitle: true, hasContent: false, hasSubtitle: false },
  { key: 'comparison', name: '比较', hasTitle: true, hasContent: true, hasSubtitle: false }
]

const TRANSITIONS = [
  { key: 'none', name: '无' },
  { key: 'fade', name: '淡入淡出' },
  { key: 'slide', name: '滑动' },
  { key: 'push', name: '推进' },
  { key: 'zoom', name: '缩放' },
  { key: 'split', name: '分割' }
]

const ANIMATIONS = [
  { key: 'none', name: '无' },
  { key: 'appear', name: '出现' },
  { key: 'fade', name: '淡出' },
  { key: 'fly', name: '飞入' },
  { key: 'float', name: '浮入' },
  { key: 'split', name: '劈裂' },
  { key: 'wipe', name: '擦除' }
]

/**
 * 创建幻灯片编辑器上下文（状态 + 方法）。
 * 在编辑器视图的 setup 中调用一次，并通过 provide(SLIDE_EDITOR_KEY) 共享给子组件。
 * 子组件使用 useSlideEditorContext() 获取同一实例。
 */
export function createSlideEditor() {
  const route = useRoute()
  const router = useRouter()
  const message = useMessage()
  const store = useAiWorkshopStore()
  const projectId = route.params.id as string

  // ==================== 文件信息 ====================
  const fileName = ref('无标题演示文稿')
  const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  // AI 面板开关（由顶部栏按钮与面板自身共享控制）
  const showAiPanel = ref(false)
  function toggleAiPanel() {
    showAiPanel.value = !showAiPanel.value
  }

  // ==================== AI 助手 ====================
  const slideAi = useSlideAi(fileName.value)
  const slideAiActions = slideAi.actions
  const aiResult = ref('')
  const aiLoading = ref(false)
  const isGeneratingSlides = ref(false)
  const aiInputText = ref('')
  const aiMessagesRef = ref<HTMLElement | null>(null)

  interface AiMessage {
    role: 'user' | 'ai'
    content: string
    timestamp: number
  }
  const aiMessages = ref<AiMessage[]>([])

  const isMarkdown = computed(() => {
    return aiResult.value.includes('#') || aiResult.value.includes('**') || aiResult.value.includes('- ')
  })
  const renderedMarkdown = computed(() => {
    if (!isMarkdown.value) return aiResult.value
    return aiResult.value
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
  })

  function renderMessageContent(content: string): string {
    if (!content) return ''
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 4px;border-radius:4px;font-size:12px;">$1</code>')
      .replace(/\n/g, '<br>')
  }

  function scrollAiMessagesToBottom() {
    nextTick(() => {
      if (aiMessagesRef.value) {
        aiMessagesRef.value.scrollTop = aiMessagesRef.value.scrollHeight
      }
    })
  }

  async function executeAiAction(actionKey: string) {
    const context = currentSlide.value?.content || currentSlide.value?.title || fileName.value
    const action = slideAi.actions.find(a => a.key === actionKey)
    const userPrompt = action ? action.label : 'AI 操作'

    aiMessages.value.push({
      role: 'user',
      content: `执行操作：${userPrompt}`,
      timestamp: Date.now()
    })

    aiLoading.value = true
    aiResult.value = ''

    try {
      const result = await slideAi.executeAction(actionKey, context)
      aiResult.value = result
      aiMessages.value.push({ role: 'ai', content: result, timestamp: Date.now() })
      scrollAiMessagesToBottom()
    } catch (error) {
      message.error('AI 调用失败')
      aiMessages.value.push({ role: 'ai', content: '抱歉，AI 服务暂时不可用，请稍后重试。', timestamp: Date.now() })
    } finally {
      aiLoading.value = false
    }
  }

  async function sendAiMessage() {
    const userText = aiInputText.value.trim()
    if (!userText || aiLoading.value) return

    aiMessages.value.push({ role: 'user', content: userText, timestamp: Date.now() })
    aiLoading.value = true
    aiResult.value = ''
    aiInputText.value = ''
    scrollAiMessagesToBottom()

    try {
      const result = await slideAi.chat(userText)
      aiResult.value = result
      aiMessages.value.push({ role: 'ai', content: result, timestamp: Date.now() })
      scrollAiMessagesToBottom()
    } catch (error) {
      message.error('AI 调用失败')
      aiMessages.value.push({ role: 'ai', content: '抱歉，AI 服务暂时不可用，请稍后重试。', timestamp: Date.now() })
      scrollAiMessagesToBottom()
    } finally {
      aiLoading.value = false
    }
  }

  function onAiKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendAiMessage()
    }
  }

  async function copyResult() {
    const ok = await copyToClipboard(aiResult.value)
    if (ok) message.success('已复制到剪贴板')
    else message.error('复制失败，请手动选择复制')
  }

  function applyResult() {
    if (currentSlide.value && aiResult.value) {
      if (aiResult.value.includes('##')) {
        const parsed = parseOutlineToSlides(aiResult.value)
        if (parsed.length > 0) {
          applyOutline(parsed)
          aiResult.value = ''
          return
        }
      }
      applyContent(aiResult.value)
      aiResult.value = ''
    }
  }

  async function aiGenerateOutline() {
    await executeAiAction('outline')
  }

  async function aiExpandContent() {
    const text = currentSlide.value?.title || currentSlide.value?.content || ''
    aiMessages.value.push({ role: 'user', content: '请帮我扩写当前幻灯片内容', timestamp: Date.now() })
    aiLoading.value = true
    aiResult.value = ''
    scrollAiMessagesToBottom()
    try {
      const result = await slideAi.executeAction('expand', text)
      aiResult.value = result
      aiMessages.value.push({ role: 'ai', content: result, timestamp: Date.now() })
      scrollAiMessagesToBottom()
    } catch (error) {
      message.error('AI 调用失败')
      aiMessages.value.push({ role: 'ai', content: '抱歉，AI 服务暂时不可用，请稍后重试。', timestamp: Date.now() })
      scrollAiMessagesToBottom()
    } finally {
      aiLoading.value = false
    }
  }

  async function aiGenerateNotes() {
    const text = currentSlide.value?.content || currentSlide.value?.title || ''
    aiMessages.value.push({ role: 'user', content: '请为当前幻灯片生成演讲备注', timestamp: Date.now() })
    aiLoading.value = true
    aiResult.value = ''
    scrollAiMessagesToBottom()
    try {
      const result = await slideAi.executeAction('notes', text)
      aiResult.value = result
      aiMessages.value.push({ role: 'ai', content: result, timestamp: Date.now() })
      scrollAiMessagesToBottom()
      applyNotes(result)
    } catch (error) {
      message.error('AI 调用失败')
      aiMessages.value.push({ role: 'ai', content: '抱歉，AI 服务暂时不可用，请稍后重试。', timestamp: Date.now() })
      scrollAiMessagesToBottom()
    } finally {
      aiLoading.value = false
    }
  }

  async function aiGenerateSlides() {
    const topic = aiInputText.value || fileName.value
    aiMessages.value.push({ role: 'user', content: `请为我生成关于"${topic}"的演示文稿`, timestamp: Date.now() })
    aiLoading.value = true
    isGeneratingSlides.value = true
    aiResult.value = ''
    scrollAiMessagesToBottom()
    try {
      const result = await slideAi.generateOutline(topic)
      aiResult.value = result
      aiMessages.value.push({ role: 'ai', content: result, timestamp: Date.now() })
      scrollAiMessagesToBottom()
      const parsed = parseOutlineToSlides(result)
      if (parsed.length > 0) {
        applyOutline(parsed)
      }
    } catch (error) {
      message.error('AI 调用失败')
      aiMessages.value.push({ role: 'ai', content: '抱歉，AI 服务暂时不可用，请稍后重试。', timestamp: Date.now() })
      scrollAiMessagesToBottom()
    } finally {
      aiLoading.value = false
      isGeneratingSlides.value = false
    }
  }

  async function aiDesignSuggest() {
    const text = currentSlide.value?.content || currentSlide.value?.title || ''
    aiMessages.value.push({ role: 'user', content: '请为当前幻灯片提供设计建议', timestamp: Date.now() })
    aiLoading.value = true
    aiResult.value = ''
    scrollAiMessagesToBottom()
    try {
      const result = await slideAi.executeAction('design', text)
      aiResult.value = result
      aiMessages.value.push({ role: 'ai', content: result, timestamp: Date.now() })
      scrollAiMessagesToBottom()
    } catch (error) {
      message.error('AI 调用失败')
      aiMessages.value.push({ role: 'ai', content: '抱歉，AI 服务暂时不可用，请稍后重试。', timestamp: Date.now() })
      scrollAiMessagesToBottom()
    } finally {
      aiLoading.value = false
    }
  }

  function parseOutlineToSlides(markdown: string): Slide[] {
    const lines = markdown.split('\n')
    const result: Slide[] = []
    let current: Slide | null = null
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const match = trimmed.match(/^##+\s+(.+)$/)
      if (match) {
        if (current) result.push(current)
        current = {
          id: `slide-${Date.now()}-${result.length}`,
          layout: result.length === 0 ? 'title' : 'title-content',
          title: match[1],
          content: '',
          elements: []
        }
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (current) {
          current.content += (current.content ? '\n' : '') + trimmed.slice(2)
        }
      }
    }
    if (current) result.push(current)
    if (result.length === 0) {
      return [{
        id: `slide-${Date.now()}`,
        layout: 'title',
        title: '未命名演示文稿',
        subtitle: '',
        elements: []
      }]
    }
    return result
  }

  // ==================== 幻灯片数据 ====================
  const slides = ref<Slide[]>([
    {
      id: 'slide-1',
      layout: 'title',
      title: '欢迎使用',
      subtitle: '点击添加副标题',
      theme: 'light',
      elements: [],
      notes: ''
    }
  ])
  const currentSlideIndex = ref(0)
  const currentSlide = computed<Slide | undefined>(() => slides.value[currentSlideIndex.value])
  const currentLayout = computed(() => currentSlide.value?.layout || 'title')

  // ==================== 顶栏 / Ribbon 状态 ====================
  const activeTab = ref('home')
  const selectedFont = ref('Inter')
  const selectedFontSize = ref(24)
  const isBold = ref(false)
  const isItalic = ref(false)
  const isUnderline = ref(false)
  const textColor = ref('#000000')
  const textAlign = ref('left')
  const isBulletList = ref(false)
  const isNumberedList = ref(false)
  const canUndo = ref(false)
  const canRedo = ref(false)
  const zoomLevel = ref(100)
  const zoomPercent = computed(() => `${zoomLevel.value}%`)

  // ==================== 右侧面板 ====================
  const rightPanel = ref<'theme' | 'background' | 'layout' | null>('theme')
  const rightPanelTitle = computed(() => {
    const titles: Record<string, string> = {
      theme: '主题背景',
      background: '背景',
      layout: '布局'
    }
    return titles[rightPanel.value || ''] || ''
  })
  function toggleRightPanel(panel: 'theme' | 'background' | 'layout') {
    rightPanel.value = rightPanel.value === panel ? null : panel
  }

  // ==================== 主题 ====================
  const currentTheme = ref('light')
  const currentThemeColor = computed(() => {
    const theme = THEMES.find(t => t.key === (currentSlide.value?.theme || currentTheme.value))
    return theme?.textColor || '#000000'
  })
  const currentThemeColorSecondary = computed(() => {
    const theme = THEMES.find(t => t.key === (currentSlide.value?.theme || currentTheme.value))
    return theme?.textColor === '#ffffff' ? 'rgba(255,255,255,0.8)' : '#5f6368'
  })
  function applyTheme(theme: string) {
    currentTheme.value = theme
    if (currentSlide.value) {
      currentSlide.value.theme = theme
      handleContentChange()
    }
    message.success('已应用主题')
  }

  // ==================== 背景 ====================
  function applyBackgroundColor(color: string) {
    if (currentSlide.value) {
      currentSlide.value.background = color
      handleContentChange()
    }
  }

  // ==================== 幻灯片版式 ====================
  function applyLayout(layout: string) {
    if (!currentSlide.value) return
    currentSlide.value.layout = layout
    const config = SLIDE_LAYOUTS.find(l => l.key === layout)
    if (config) {
      if (!config.hasTitle) delete currentSlide.value.title
      else if (currentSlide.value.title === undefined) currentSlide.value.title = ''

      if (!config.hasSubtitle) delete currentSlide.value.subtitle
      else if (currentSlide.value.subtitle === undefined) currentSlide.value.subtitle = ''

      if (!config.hasContent) delete currentSlide.value.content
      else if (currentSlide.value.content === undefined) currentSlide.value.content = ''
    }
    handleContentChange()
  }

  // ==================== 切换效果 ====================
  const currentTransition = ref('none')
  function applyTransition(transition: string) {
    currentTransition.value = transition
    if (currentSlide.value) {
      currentSlide.value.transition = transition
      handleContentChange()
    }
    message.success('已应用切换效果')
  }

  // ==================== 动画效果 ====================
  const currentAnimation = ref('none')
  function applyAnimation(animation: string) {
    currentAnimation.value = animation
    if (currentSlide.value) {
      currentSlide.value.animation = animation
      handleContentChange()
    }
    message.success('已应用动画效果')
  }

  // ==================== 演讲者备注 ====================
  const showNotes = ref(false)
  const currentSlideNotes = computed({
    get: () => currentSlide.value?.notes || '',
    set: (val: string) => {
      if (currentSlide.value) {
        currentSlide.value.notes = val
      }
    }
  })
  function toggleNotes() {
    showNotes.value = !showNotes.value
  }
  function handleSaveNotes() {
    handleContentChange()
  }

  // ==================== 画布样式 ====================
  const presentMode = ref(false)
  const slideTransitioning = ref(false)
  const canvasStyle = computed(() => ({
    transform: presentMode.value ? 'scale(1)' : `scale(${zoomLevel.value / 100})`,
    background: currentSlide.value?.background || getThemeBackground(currentSlide.value?.theme) || '#ffffff'
  }))
  function getThemeBackground(themeKey?: string): string {
    const theme = THEMES.find(t => t.key === themeKey)
    return theme?.preview || '#ffffff'
  }

  // ==================== 幻灯片操作 ====================
  function addSlide() {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      layout: 'title-content',
      title: '',
      content: '',
      theme: currentTheme.value,
      elements: [],
      notes: ''
    }
    slides.value.splice(currentSlideIndex.value + 1, 0, newSlide)
    currentSlideIndex.value++
    handleContentChange()
  }

  function duplicateSlide() {
    if (!currentSlide.value) return
    const duplicated: Slide = {
      ...JSON.parse(JSON.stringify(currentSlide.value)),
      id: `slide-${Date.now()}`
    }
    slides.value.splice(currentSlideIndex.value + 1, 0, duplicated)
    currentSlideIndex.value++
    handleContentChange()
  }

  function deleteSlide() {
    slides.value.splice(currentSlideIndex.value, 1)
    if (currentSlideIndex.value >= slides.value.length) {
      currentSlideIndex.value = Math.max(0, slides.value.length - 1)
    }
    handleContentChange()
  }

  function deleteSlideByIndex(index: number) {
    slides.value.splice(index, 1)
    if (currentSlideIndex.value >= index) {
      currentSlideIndex.value = Math.max(0, currentSlideIndex.value - 1)
    }
    if (slides.value.length === 0) {
      addSlide()
    }
    handleContentChange()
  }

  function selectSlide(index: number) {
    currentSlideIndex.value = index
  }

  function getSlideStyle(slide: Slide) {
    return {
      background: slide.background || getThemeBackground(slide.theme) || '#ffffff'
    }
  }

  function getSlideDisplayTitle(slide: Slide): string {
    const rawTitle = slide.title || (slide.elements?.find(e => e.type === 'text')?.content || '')
    return rawTitle.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()
  }

  // ==================== 内容编辑 ====================
  function handleTitleFocus() {
    // 标题获取焦点时的处理
  }
  function handleTitleBlur() {
    handleContentChange()
  }
  function handleSubtitleFocus() {
    // 副标题获取焦点时的处理
  }
  function handleSubtitleBlur() {
    handleContentChange()
  }
  function handleContentChange() {
    saveStatus.value = 'unsaved'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveProject()
    }, 1000)
  }

  // ==================== 元素拖拽 ====================
  const draggingElement = ref<SlideElement | null>(null)
  const dragOffset = ref({ x: 0, y: 0 })
  function startDrag(event: MouseEvent, el: SlideElement) {
    draggingElement.value = el
    dragOffset.value = {
      x: event.clientX - el.x,
      y: event.clientY - el.y
    }
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }
  function onDrag(event: MouseEvent) {
    if (!draggingElement.value) return
    draggingElement.value.x = event.clientX - dragOffset.value.x
    draggingElement.value.y = event.clientY - dragOffset.value.y
  }
  function stopDrag() {
    draggingElement.value = null
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    handleContentChange()
  }
  function deleteElement(id: string) {
    if (!currentSlide.value?.elements) return
    currentSlide.value.elements = currentSlide.value.elements.filter(e => e.id !== id)
    handleContentChange()
  }

  // ==================== 插入操作 ====================
  function insertTextBox() {
    if (!currentSlide.value) return
    if (!currentSlide.value.elements) currentSlide.value.elements = []
    currentSlide.value.elements.push({
      id: `el-${Date.now()}`,
      type: 'text',
      x: 100,
      y: 100,
      width: 300,
      height: 80,
      content: '新文本框'
    })
    handleContentChange()
    message.success('已添加文本框')
  }
  function insertImage() {
    message.info('插入图片功能开发中')
  }
  function insertShape() {
    if (!currentSlide.value) return
    if (!currentSlide.value.elements) currentSlide.value.elements = []
    currentSlide.value.elements.push({
      id: `el-${Date.now()}`,
      type: 'shape',
      x: 150,
      y: 150,
      width: 120,
      height: 120,
      style: { background: '#e0e0e0', borderRadius: '8px' }
    })
    handleContentChange()
  }
  function insertTable() {
    message.info('插入表格功能开发中')
  }

  // ==================== 格式操作 ====================
  function toggleBold() { isBold.value = !isBold.value }
  function toggleItalic() { isItalic.value = !isItalic.value }
  function toggleUnderline() { isUnderline.value = !isUnderline.value }
  function setTextAlign(align: string) {
    textAlign.value = align
  }
  function toggleBulletList() {
    isBulletList.value = !isBulletList.value
    if (isBulletList.value) isNumberedList.value = false
  }
  function toggleNumberedList() {
    isNumberedList.value = !isNumberedList.value
    if (isNumberedList.value) isBulletList.value = false
  }
  function clearFormat() {
    isBold.value = false
    isItalic.value = false
    isUnderline.value = false
    textColor.value = '#000000'
    textAlign.value = 'left'
    isBulletList.value = false
    isNumberedList.value = false
  }

  // ==================== 撤销重做缩放 ====================
  function undo() { message.info('撤销') }
  function redo() { message.info('重做') }
  function handleZoomSelect(key: number) {
    zoomLevel.value = key
  }
  function handleCopy() {
    message.info('复制功能开发中')
  }
  function handlePaste() {
    message.info('粘贴功能开发中')
  }

  // ==================== 保存导出 ====================
  function handleBack() {
    router.back()
  }
  function handleSaveFileName() {
    handleContentChange()
  }
  function handleSave() {
    saveProject()
  }
  async function saveProject() {
    saveStatus.value = 'saving'
    try {
      const content = JSON.stringify({ slides: slides.value })
      await updateProject(projectId, {
        name: fileName.value,
        content
      })
      store.updateProject(projectId, {
        name: fileName.value,
        content
      })
      saveStatus.value = 'saved'
      message.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      saveStatus.value = 'unsaved'
      message.warning('保存失败，请重试')
    }
  }
  function handleExport() {
    const data = {
      fileName: fileName.value,
      slides: slides.value
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName.value}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('演示文稿已导出')
  }

  // ==================== 放映模式 ====================
  function startSlideshow() {
    presentMode.value = true
    currentSlideIndex.value = 0
    message.success('按 ESC 或点击退出按钮退出放映')
  }
  function exitSlideshow() {
    presentMode.value = false
  }
  function nextSlide() {
    if (currentSlideIndex.value < slides.value.length - 1) {
      triggerTransition()
      currentSlideIndex.value++
    }
  }
  function prevSlide() {
    if (currentSlideIndex.value > 0) {
      triggerTransition()
      currentSlideIndex.value--
    }
  }
  function triggerTransition() {
    slideTransitioning.value = true
    setTimeout(() => {
      slideTransitioning.value = false
    }, 300)
  }
  function handleKeydown(event: KeyboardEvent) {
    if (presentMode.value) {
      if (event.key === 'Escape') exitSlideshow()
      if (event.key === 'ArrowRight' || event.key === ' ') nextSlide()
      if (event.key === 'ArrowLeft') prevSlide()
    } else {
      if (event.key === 'F5') {
        event.preventDefault()
        startSlideshow()
      }
    }
  }

  // ==================== AI 应用入口（供 SlideAiPanel 调用） ====================
  function applyOutline(parsed: Slide[]) {
    if (parsed.length > 0) {
      slides.value = parsed
      currentSlideIndex.value = 0
      message.success(`已生成 ${parsed.length} 页幻灯片`)
      handleContentChange()
    }
  }
  function applyContent(text: string) {
    if (currentSlide.value) {
      currentSlide.value.content = text
      handleContentChange()
      message.success('已应用到当前幻灯片')
    }
  }
  function applyNotes(text: string) {
    if (currentSlide.value) {
      currentSlide.value.notes = text
      handleContentChange()
      message.success('已生成演讲备注')
    }
  }

  // ==================== 初始化 ====================
  async function init() {
    let project = store.getProjectById(projectId)
    if (!project) {
      try {
        const res = await getProjectDetail(projectId)
        const data = res.data as any
        if (data.code === 200 || data.status === 200) {
          const apiProject = data.data
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
            techStack: apiProject.label ? [apiProject.label] : [],
            plugins: apiProject.plugins || [],
            files: apiProject.files || [],
            content: apiProject.content || '',
            team: []
          })
          project = store.getProjectById(projectId)
        }
      } catch (error) {
        console.error('加载项目详情失败:', error)
      }
    }

    if (project) {
      fileName.value = project.name || '无标题演示文稿'
      if (project.content) {
        try {
          const parsed = JSON.parse(project.content)
          if (Array.isArray(parsed.slides)) {
            slides.value = parsed.slides.map((s: any) => ({
              ...s,
              elements: s.elements || [],
              notes: s.notes || ''
            }))
          }
        } catch {
          // 解析失败使用默认
        }
      }
    }

    window.addEventListener('keydown', handleKeydown)
  }

  function cleanup() {
    window.removeEventListener('keydown', handleKeydown)
  }

  return {
    fileName,
    saveStatus,
    showAiPanel,
    toggleAiPanel,
    slideAiActions,
    aiMessages,
    aiResult,
    aiLoading,
    isGeneratingSlides,
    aiInputText,
    aiMessagesRef,
    executeAiAction,
    sendAiMessage,
    onAiKeydown,
    copyResult,
    applyResult,
    aiGenerateOutline,
    aiExpandContent,
    aiGenerateNotes,
    aiGenerateSlides,
    aiDesignSuggest,
    renderMessageContent,
    scrollAiMessagesToBottom,
    isMarkdown,
    renderedMarkdown,
    slides,
    currentSlideIndex,
    currentSlide,
    currentLayout,
    presentMode,
    slideTransitioning,
    zoomLevel,
    zoomPercent,
    canvasStyle,
    activeTab,
    ribbonTabs: RIBBON_TABS,
    selectedFont,
    selectedFontSize,
    isBold,
    isItalic,
    isUnderline,
    textColor,
    textAlign,
    isBulletList,
    isNumberedList,
    canUndo,
    canRedo,
    fontOptions: FONT_OPTIONS,
    fontSizeOptions: FONT_SIZE_OPTIONS,
    zoomOptions: ZOOM_OPTIONS,
    rightPanel,
    rightPanelTitle,
    toggleRightPanel,
    currentTheme,
    themes: THEMES,
    currentThemeColor,
    currentThemeColorSecondary,
    applyTheme,
    backgroundColors: BACKGROUND_COLORS,
    applyBackgroundColor,
    slideLayouts: SLIDE_LAYOUTS,
    applyLayout,
    currentTransition,
    transitions: TRANSITIONS,
    applyTransition,
    currentAnimation,
    animations: ANIMATIONS,
    applyAnimation,
    showNotes,
    currentSlideNotes,
    toggleNotes,
    handleSaveNotes,
    addSlide,
    duplicateSlide,
    deleteSlide,
    deleteSlideByIndex,
    selectSlide,
    getSlideStyle,
    getSlideDisplayTitle,
    handleTitleFocus,
    handleTitleBlur,
    handleSubtitleFocus,
    handleSubtitleBlur,
    handleContentChange,
    draggingElement,
    dragOffset,
    startDrag,
    onDrag,
    stopDrag,
    deleteElement,
    insertTextBox,
    insertImage,
    insertShape,
    insertTable,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    setTextAlign,
    toggleBulletList,
    toggleNumberedList,
    clearFormat,
    undo,
    redo,
    handleZoomSelect,
    handleCopy,
    handlePaste,
    handleBack,
    handleSaveFileName,
    handleSave,
    saveProject,
    handleExport,
    startSlideshow,
    exitSlideshow,
    nextSlide,
    prevSlide,
    handleKeydown,
    applyOutline,
    applyContent,
    applyNotes,
    init,
    cleanup
  }
}

// ==================== 注入辅助 ====================

export type SlideEditorContext = ReturnType<typeof createSlideEditor>

export const SLIDE_EDITOR_KEY: InjectionKey<SlideEditorContext> = Symbol('slide-editor')

export function useSlideEditorContext(): SlideEditorContext {
  const ctx = inject(SLIDE_EDITOR_KEY)
  if (!ctx) {
    throw new Error('SlideEditorContext 未提供，请在 SlideEditorView 中调用 provide(SLIDE_EDITOR_KEY, createSlideEditor())')
  }
  return ctx
}
