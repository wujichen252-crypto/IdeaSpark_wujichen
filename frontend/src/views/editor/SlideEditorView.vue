<template>
  <div
class="slide-editor"
:class="{ 'present-mode': presentMode }"
tabindex="0"
@keydown="handleKeydown">
    <!-- 顶部标题栏 -->
    <header v-if="!presentMode" class="se-header">
      <div class="se-header-left">
        <!-- 返回按钮 -->
        <button class="nexus-icon-btn" @click="handleBack" title="返回">
          <n-icon size="18"><ArrowLeft /></n-icon>
        </button>
        <!-- Logo -->
        <div class="se-logo">
          <n-icon size="20" color="var(--nexus-text-primary)"><Presentation /></n-icon>
        </div>
        <!-- 文档信息 -->
        <div class="se-doc-info">
          <input
            v-model="fileName"
            class="se-doc-title"
            placeholder="无标题演示文稿"
            @blur="handleSaveFileName"
          />
          <div class="se-save-status">
            <span v-if="saveStatus === 'saved'" class="se-status-dot se-status-saved" ></span>
            <span v-else-if="saveStatus === 'saving'" class="se-status-text">保存中...</span>
            <span v-else class="se-status-text">未保存</span>
          </div>
        </div>
      </div>
      <div class="se-header-right">
        <button class="nexus-icon-btn" title="AI 助手" @click="showAiPanel = !showAiPanel">
          <n-icon size="18"><Sparkles /></n-icon>
        </button>
        <button class="nexus-pill-btn nexus-pill-outline" @click="handleExport">
          <n-icon size="14"><Download /></n-icon>
          导出
        </button>
        <button class="nexus-pill-btn nexus-pill-dark" @click="handleSave">
          <n-icon size="14"><Save /></n-icon>
          保存
        </button>
      </div>
    </header>

    <!-- Ribbon 工具栏 -->
    <div v-if="!presentMode" class="se-toolbar">
      <!-- 快速访问工具栏 -->
      <div class="quick-access-toolbar">
        <button
class="nexus-icon-btn"
:disabled="!canUndo"
@click="undo"
title="撤销">
          <n-icon size="16"><Undo2 /></n-icon>
        </button>
        <button
class="nexus-icon-btn"
:disabled="!canRedo"
@click="redo"
title="重做">
          <n-icon size="16"><Redo2 /></n-icon>
        </button>
        <button class="nexus-icon-btn" @click="handleSave" title="保存">
          <n-icon size="16"><Save /></n-icon>
        </button>
      </div>

      <!-- Ribbon 选项卡 -->
      <div class="ribbon-tabs">
        <div
          v-for="tab in ribbonTabs"
          :key="tab.key"
          :class="['ribbon-tab', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>

      <!-- 右侧操作区 -->
      <div class="ribbon-actions">
        <n-dropdown :options="zoomOptions" @select="handleZoomSelect">
          <button class="nexus-pill-btn nexus-pill-ghost">
            {{ zoomPercent }}
            <n-icon size="12"><ChevronDown /></n-icon>
          </button>
        </n-dropdown>
        <div class="se-divider" ></div>
        <button class="nexus-pill-btn nexus-pill-dark" @click="startSlideshow">
          <n-icon size="14"><Play /></n-icon>
          放映
        </button>
      </div>
    </div>

    <!-- Ribbon 面板 -->
    <div v-if="!presentMode" class="ribbon-panel">
      <!-- 开始选项卡 -->
      <template v-if="activeTab === 'home'">
        <div class="ribbon-group">
          <span class="group-title">剪贴板</span>
          <div class="group-content">
            <button class="nexus-ghost-btn" @click="handleCopy" title="复制">
              <n-icon size="18"><Copy /></n-icon>
              <span>复制</span>
            </button>
            <button class="nexus-ghost-btn" @click="handlePaste" title="粘贴">
              <n-icon size="18"><ClipboardPaste /></n-icon>
              <span>粘贴</span>
            </button>
          </div>
        </div>

        <div class="ribbon-group">
          <span class="group-title">字体</span>
          <div class="group-content">
            <div class="font-controls">
              <n-select
                v-model:value="selectedFont"
                :options="fontOptions"
                size="tiny"
                class="se-font-select"
                :bordered="false"
              />
              <n-select
                v-model:value="selectedFontSize"
                :options="fontSizeOptions"
                size="tiny"
                class="se-size-select"
                :bordered="false"
              />
            </div>
            <div class="format-buttons">
              <button :class="['nexus-toggle-btn', { active: isBold }]" @click="toggleBold" title="加粗">
                <span class="format-letter format-bold">B</span>
              </button>
              <button :class="['nexus-toggle-btn', { active: isItalic }]" @click="toggleItalic" title="斜体">
                <span class="format-letter format-italic">I</span>
              </button>
              <button :class="['nexus-toggle-btn', { active: isUnderline }]" @click="toggleUnderline" title="下划线">
                <span class="format-letter format-underline">U</span>
              </button>
            </div>
          </div>
        </div>

        <div class="ribbon-group">
          <span class="group-title">段落</span>
          <div class="group-content">
            <div class="align-buttons">
              <button :class="['nexus-toggle-btn', { active: textAlign === 'left' }]" @click="setTextAlign('left')">
                <n-icon size="16"><AlignLeft /></n-icon>
              </button>
              <button :class="['nexus-toggle-btn', { active: textAlign === 'center' }]" @click="setTextAlign('center')">
                <n-icon size="16"><AlignCenter /></n-icon>
              </button>
              <button :class="['nexus-toggle-btn', { active: textAlign === 'right' }]" @click="setTextAlign('right')">
                <n-icon size="16"><AlignRight /></n-icon>
              </button>
            </div>
            <div class="list-buttons">
              <button :class="['nexus-toggle-btn', { active: isBulletList }]" @click="toggleBulletList">
                <n-icon size="16"><List /></n-icon>
              </button>
              <button :class="['nexus-toggle-btn', { active: isNumberedList }]" @click="toggleNumberedList">
                <n-icon size="16"><ListOrdered /></n-icon>
              </button>
            </div>
          </div>
        </div>

        <div class="ribbon-group">
          <span class="group-title">AI 助手</span>
          <div class="group-content">
            <button class="nexus-pill-btn ai-toggle" @click="aiGenerateOutline">
              <Sparkles class="nexus-icon" />
              生成大纲
            </button>
            <button class="nexus-pill-btn ai-toggle" @click="aiExpandContent">
              <Sparkles class="nexus-icon" />
              扩写内容
            </button>
            <button class="nexus-pill-btn ai-toggle" @click="aiGenerateNotes">
              <Sparkles class="nexus-icon" />
              演讲备注
            </button>
          </div>
        </div>
      </template>

      <!-- 插入选项卡 -->
      <template v-if="activeTab === 'insert'">
        <div class="ribbon-group">
          <span class="group-title">插入元素</span>
          <div class="group-content">
            <button class="nexus-pill-btn" @click="insertTextBox">
              <n-icon size="16"><Type /></n-icon>
              文本框
            </button>
            <button class="nexus-pill-btn" @click="insertImage">
              <n-icon size="16"><Image /></n-icon>
              图片
            </button>
            <button class="nexus-pill-btn" @click="insertShape">
              <n-icon size="16"><Square /></n-icon>
              形状
            </button>
            <button class="nexus-pill-btn" @click="insertTable">
              <n-icon size="16"><Table /></n-icon>
              表格
            </button>
          </div>
        </div>

        <div class="ribbon-group">
          <span class="group-title">AI 生成</span>
          <div class="group-content">
            <button class="nexus-pill-btn ai-toggle" @click="aiGenerateSlides">
              <Sparkles class="nexus-icon" />
              生成幻灯片
            </button>
            <button class="nexus-pill-btn ai-toggle" @click="aiDesignSuggest">
              <Sparkles class="nexus-icon" />
              设计建议
            </button>
          </div>
        </div>
      </template>

      <!-- 设计选项卡 -->
      <template v-if="activeTab === 'design'">
        <div class="ribbon-group">
          <span class="group-title">主题</span>
          <div class="group-content theme-grid">
            <div
              v-for="theme in themes.slice(0, 6)"
              :key="theme.key"
              :class="['theme-item', { active: currentTheme === theme.key }]"
              @click="applyTheme(theme.key)"
            >
              <div class="theme-preview" :style="{ background: theme.preview }">
                <div class="theme-text" :style="{ color: theme.textColor }">Aa</div>
              </div>
              <span class="theme-name">{{ theme.name }}</span>
            </div>
          </div>
        </div>

        <div class="ribbon-group">
          <span class="group-title">背景</span>
          <div class="group-content">
            <div class="color-grid">
              <div
                v-for="color in backgroundColors.slice(0, 8)"
                :key="color"
                class="color-item"
                :style="{ background: color }"
                @click="applyBackgroundColor(color)"
              ></div>
            </div>
          </div>
        </div>

        <div class="ribbon-group">
          <span class="group-title">版式</span>
          <div class="group-content layout-grid">
            <div
              v-for="layout in slideLayouts.slice(0, 4)"
              :key="layout.key"
              :class="['layout-item', { active: currentLayout === layout.key }]"
              @click="applyLayout(layout.key)"
            >
              <div class="layout-preview">
                <div class="layout-inner" :class="layout.key">
                  <div v-if="layout.hasTitle" class="layout-bar layout-title-bar" ></div>
                  <div v-if="layout.hasContent" class="layout-bar layout-content-bar" ></div>
                </div>
              </div>
              <span class="layout-name">{{ layout.name }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 切换选项卡 -->
      <template v-if="activeTab === 'transition'">
        <div class="ribbon-group">
          <span class="group-title">切换效果</span>
          <div class="group-content">
            <div class="transition-grid">
              <div
                v-for="trans in transitions"
                :key="trans.key"
                :class="['transition-item', { active: currentTransition === trans.key }]"
                @click="applyTransition(trans.key)"
              >
                <span>{{ trans.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 动画选项卡 -->
      <template v-if="activeTab === 'animation'">
        <div class="ribbon-group">
          <span class="group-title">动画效果</span>
          <div class="group-content">
            <div class="animation-grid">
              <div
                v-for="anim in animations"
                :key="anim.key"
                :class="['animation-item', { active: currentAnimation === anim.key }]"
                @click="applyAnimation(anim.key)"
              >
                <span>{{ anim.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 主体区域 -->
    <div class="se-main" :class="{ 'present-main': presentMode }">
      <!-- 左侧幻灯片面板 -->
      <aside v-if="!presentMode" class="se-slide-panel">
        <div class="se-slide-list">
          <div
            v-for="(slide, index) in slides"
            :key="slide.id"
            :class="['se-slide-thumb', { active: currentSlideIndex === index }]"
            @click="selectSlide(index)"
          >
            <div class="se-thumb-number">{{ index + 1 }}</div>
            <div class="se-thumb-preview" :style="getSlideStyle(slide)">
              <div class="se-thumb-content">
                <div v-if="getSlideDisplayTitle(slide)" class="se-thumb-title">{{ getSlideDisplayTitle(slide) }}</div>
                <div v-if="slide.subtitle" class="se-thumb-subtitle">{{ slide.subtitle }}</div>
              </div>
            </div>
            <!-- 删除按钮 -->
            <button
              class="se-thumb-delete"
              @click.stop="deleteSlideByIndex(index)"
              title="删除幻灯片"
            >
              <n-icon size="12"><X /></n-icon>
            </button>
          </div>
        </div>
        <div class="se-slide-actions">
          <button class="nexus-pill-btn nexus-pill-dark se-add-slide-btn" @click="addSlide">
            <n-icon size="14"><Plus /></n-icon>
            添加幻灯片
          </button>
        </div>
      </aside>

      <!-- 中间编辑区 / 放映区 -->
      <main class="se-edit-area" :class="{ 'present-area': presentMode }">
        <!-- 画布容器 -->
        <div class="se-canvas-wrapper" :class="{ 'present-wrapper': presentMode }">
          <div
            class="se-canvas"
            :class="{ 'present-canvas': presentMode, 'fade-in': slideTransitioning }"
            :style="canvasStyle"
          >
            <div v-if="currentSlide" class="se-slide-content" :class="currentSlide.layout">
              <!-- 传统字段兼容渲染 -->
              <EditableText
                v-if="currentSlide.title !== undefined"
                v-model="currentSlide.title"
                class="se-slide-title"
                :style="{ color: currentThemeColor }"
                @focus="handleTitleFocus"
                @blur="handleTitleBlur"
              />
              <EditableText
                v-if="currentSlide.subtitle !== undefined"
                v-model="currentSlide.subtitle"
                class="se-slide-subtitle"
                :style="{ color: currentThemeColorSecondary }"
                @focus="handleSubtitleFocus"
                @blur="handleSubtitleBlur"
              />
              <EditableText
                v-if="currentSlide.content !== undefined"
                v-model="currentSlide.content"
                class="se-slide-body"
                @blur="handleContentChange"
              />

              <!-- 新元素系统 -->
              <div
                v-for="el in (currentSlide?.elements || [])"
                :key="el.id"
                class="se-element"
                :class="`se-element-${el.type}`"
                :style="{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`
                }"
                @mousedown="startDrag($event, el)"
              >
                <EditableText
                  v-if="el.type === 'text'"
                  :key="el.id"
                  v-model="el.content!"
                  class="se-element-text"
                  @blur="handleContentChange"
                />
                <div v-else-if="el.type === 'shape'" class="se-element-shape" :style="el.style || {}" ></div>
                <img
v-else-if="el.type === 'image'"
class="se-element-image"
:src="el.content"
draggable="false" />
                <!-- 删除按钮 -->
                <button class="se-element-delete" @mousedown.stop @click="deleteElement(el.id)">
                  <n-icon size="12"><X /></n-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- 放映控制 -->
          <div v-if="presentMode" class="se-present-controls">
            <button class="nexus-icon-btn nexus-icon-dark" @click="prevSlide">
              <n-icon size="20"><ChevronLeft /></n-icon>
            </button>
            <span class="se-present-counter">{{ currentSlideIndex + 1 }} / {{ slides.length }}</span>
            <button class="nexus-icon-btn nexus-icon-dark" @click="nextSlide">
              <n-icon size="20"><ChevronRight /></n-icon>
            </button>
            <button class="nexus-icon-btn nexus-icon-ghost se-present-exit" @click="exitSlideshow">
              <n-icon size="18"><X /></n-icon>
            </button>
          </div>

          <!-- 放映备注 -->
          <div v-if="presentMode && currentSlide?.notes" class="se-present-notes">
            {{ currentSlide.notes }}
          </div>
        </div>
      </main>

      <!-- 右侧面板 -->
      <aside v-if="!presentMode && rightPanel" class="se-right-panel">
        <div class="se-panel-header">
          <span>{{ rightPanelTitle }}</span>
          <button class="nexus-icon-btn" @click="rightPanel = null">
            <n-icon size="16"><X /></n-icon>
          </button>
        </div>

        <!-- 主题面板 -->
        <div v-if="rightPanel === 'theme'" class="se-panel-content">
          <div class="se-section-title">预设主题</div>
          <div class="se-theme-grid">
            <div
              v-for="theme in themes"
              :key="theme.key"
              :class="['se-theme-item', { active: currentTheme === theme.key }]"
              @click="applyTheme(theme.key)"
            >
              <div class="se-theme-preview" :style="{ background: theme.preview }">
                <div class="se-theme-text" :style="{ color: theme.textColor }">
                  <div class="se-theme-preview-title">标题</div>
                  <div class="se-theme-preview-sub">副标题</div>
                </div>
              </div>
              <div class="se-theme-name">{{ theme.name }}</div>
            </div>
          </div>
        </div>

        <!-- 背景面板 -->
        <div v-if="rightPanel === 'background'" class="se-panel-content">
          <div class="se-section-title">颜色</div>
          <div class="se-color-grid">
            <div
              v-for="color in backgroundColors"
              :key="color"
              class="se-color-item"
              :style="{ background: color }"
              @click="applyBackgroundColor(color)"
            ></div>
          </div>
        </div>

        <!-- 布局面板 -->
        <div v-if="rightPanel === 'layout'" class="se-panel-content">
          <div class="se-layout-grid">
            <div
              v-for="layout in slideLayouts"
              :key="layout.key"
              :class="['se-layout-item', { active: currentLayout === layout.key }]"
              @click="applyLayout(layout.key)"
            >
              <div class="se-layout-preview">
                <div class="se-layout-inner" :class="layout.key">
                  <div v-if="layout.hasTitle" class="se-layout-bar se-layout-title-bar" ></div>
                  <div v-if="layout.hasContent" class="se-layout-bar se-layout-content-bar" ></div>
                  <div v-if="layout.hasSubtitle" class="se-layout-bar se-layout-subtitle-bar" ></div>
                </div>
              </div>
              <div class="se-layout-name">{{ layout.name }}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- AI 面板 -->
      <div v-if="!presentMode && showAiPanel" class="se-ai-panel">
        <div class="ai-panel-header">
          <div class="ai-panel-title">
            <n-icon size="16"><Sparkles /></n-icon>
            <span>IdeaSpark AI</span>
          </div>
          <button class="nexus-icon-btn" @click="showAiPanel = false">
            <n-icon size="16"><X /></n-icon>
          </button>
        </div>

        <!-- 对话消息区域 -->
        <div class="ai-messages-area" ref="aiMessagesRef">
          <!-- 欢迎消息 - 只在没有任何消息时显示 -->
          <div class="ai-welcome" v-if="aiMessages.length === 0 && !aiLoading">
            <div class="ai-avatar">
              <n-icon size="20"><Sparkles /></n-icon>
            </div>
            <div class="ai-welcome-text">
              <p>你好！我是 IdeaSpark AI 助手。</p>
              <p>我可以帮助你生成大纲、扩写内容、添加演讲备注或提供设计建议。</p>
            </div>
          </div>

          <!-- 快捷操作 - 只在没有任何消息时显示 -->
          <div class="ai-quick-actions" v-if="aiMessages.length === 0 && !aiLoading">
            <button
              v-for="action in slideAi.actions"
              :key="action.key"
              class="nexus-pill-btn ai-action-btn"
              @click="executeAiAction(action.key)"
            >
              <Sparkles class="nexus-icon" />
              {{ action.label }}
            </button>
          </div>

          <!-- 消息列表 -->
          <div class="ai-messages-list" v-if="aiMessages.length > 0">
            <div
              v-for="(msg, index) in aiMessages"
              :key="index"
              class="ai-message"
              :class="msg.role"
            >
              <div class="message-avatar">
                <n-icon v-if="msg.role === 'ai'" size="14"><Sparkles /></n-icon>
                <n-icon v-else size="14"><User /></n-icon>
              </div>
              <div class="message-content">
                <div class="message-bubble" v-html="renderMessageContent(msg.content)"></div>
              </div>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="aiLoading" class="ai-loading">
            <div class="loading-dots">
              <div class="dot" ></div>
              <div class="dot" ></div>
              <div class="dot" ></div>
            </div>
            <span>AI 正在思考中...</span>
          </div>
        </div>

        <!-- 结果操作按钮 - 当有AI结果时显示 -->
        <div v-if="aiResult && !aiLoading" class="ai-result-actions">
          <button class="nexus-ghost-btn" @click="copyResult">
            <n-icon size="14"><Copy /></n-icon>
            复制
          </button>
          <button class="nexus-ghost-btn" @click="applyResult">
            <n-icon size="14"><Check /></n-icon>
            应用
          </button>
        </div>

        <!-- 输入框 -->
        <div class="ai-input-area">
          <textarea
            v-model="aiInputText"
            class="ai-textarea"
            placeholder="输入您的想法... (Shift + Enter 换行)"
            rows="1"
            @keydown="onAiKeydown"
          ></textarea>
          <button
            class="nexus-send-btn"
            :disabled="!aiInputText.trim() || aiLoading"
            @click="sendAiMessage"
          >
            <n-icon size="16"><Send /></n-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- AI生成PPT全局加载遮罩 -->
    <div v-if="aiLoading && isGeneratingSlides" class="ai-generating-overlay">
      <div class="ai-generating-content">
        <div class="ai-generating-spinner">
          <n-icon size="48" color="#10b981"><Sparkles /></n-icon>
        </div>
        <div class="ai-generating-text">AI 正在生成演示文稿...</div>
        <div class="ai-generating-subtext">请稍候，正在为您创建精彩内容</div>
      </div>
    </div>

    <!-- 底部备注区 -->
    <footer v-if="!presentMode" class="se-notes-area" :class="{ collapsed: !showNotes }">
      <div class="se-notes-header" @click="toggleNotes">
        <n-icon size="14"><component :is="showNotes ? ChevronDown : ChevronUp" /></n-icon>
        <span>演讲者备注</span>
      </div>
      <div v-show="showNotes" class="se-notes-content">
        <textarea
          v-model="currentSlideNotes"
          class="se-notes-input"
          placeholder="点击添加演讲者备注..."
          @blur="handleSaveNotes"
        ></textarea>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  Sparkles,
  Presentation,
  ArrowLeft,
  Save,
  Download,
  Play,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Type,
  Image,
  Square,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Send,
  Check,
  User
} from 'lucide-vue-next'
import { useSlideAi } from '@/composables/useSlideAi'
import { useAiWorkshopStore } from '@/store/modules/aiWorkshop'
import { getProjectDetail, updateProject } from '@/api/project'
import EditableText from '@/components/EditableText.vue'

// ==================== 类型定义 ====================

interface SlideElement {
  id: string
  type: 'text' | 'image' | 'shape'
  x: number
  y: number
  width: number
  height: number
  content?: string
  style?: Record<string, any>
}

interface Slide {
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

// ==================== 路由和状态 ====================

const route = useRoute()
const router = useRouter()
const message = useMessage()
const store = useAiWorkshopStore()
const projectId = route.params.id as string
const fileId = route.params.fileId as string | undefined

// ==================== 文件信息 ====================

const fileName = ref('无标题演示文稿')
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
let saveTimer: ReturnType<typeof setTimeout> | null = null

// ==================== AI ====================

const slideAi = useSlideAi(fileName.value)
const showAiPanel = ref(false)
const aiResult = ref('')
const aiLoading = ref(false)
const isGeneratingSlides = ref(false) // 是否正在生成幻灯片
const aiInputText = ref('')
const aiMessagesRef = ref<HTMLElement | null>(null)

// 对话消息列表
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
  // 简单的markdown渲染转换（不依赖marked库）
  return aiResult.value
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
})

/**
 * 渲染消息内容（支持简单的Markdown）
 * @param content 消息内容
 */
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

/**
 * 滚动消息区域到底部
 */
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

  // 添加用户消息
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

    // 添加AI回复消息
    aiMessages.value.push({
      role: 'ai',
      content: result,
      timestamp: Date.now()
    })

    scrollAiMessagesToBottom()
  } catch (error) {
    message.error('AI 调用失败')
    // 添加错误消息
    aiMessages.value.push({
      role: 'ai',
      content: '抱歉，AI 服务暂时不可用，请稍后重试。',
      timestamp: Date.now()
    })
  } finally {
    aiLoading.value = false
  }
}

async function sendAiMessage() {
  const userText = aiInputText.value.trim()
  if (!userText || aiLoading.value) return

  // 添加用户消息
  aiMessages.value.push({
    role: 'user',
    content: userText,
    timestamp: Date.now()
  })

  aiLoading.value = true
  aiResult.value = ''
  aiInputText.value = ''

  scrollAiMessagesToBottom()

  try {
    const result = await slideAi.chat(userText)
    aiResult.value = result

    // 添加AI回复消息
    aiMessages.value.push({
      role: 'ai',
      content: result,
      timestamp: Date.now()
    })

    scrollAiMessagesToBottom()
  } catch (error) {
    message.error('AI 调用失败')
    // 添加错误消息
    aiMessages.value.push({
      role: 'ai',
      content: '抱歉，AI 服务暂时不可用，请稍后重试。',
      timestamp: Date.now()
    })
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

function copyResult() {
  navigator.clipboard.writeText(aiResult.value)
  message.success('已复制到剪贴板')
}

function applyResult() {
  if (currentSlide.value && aiResult.value) {
    // 尝试解析 AI 返回的大纲并生成幻灯片
    if (aiResult.value.includes('##')) {
      const parsed = parseOutlineToSlides(aiResult.value)
      if (parsed.length > 0) {
        slides.value = parsed
        currentSlideIndex.value = 0
        message.success(`已生成 ${parsed.length} 页幻灯片`)
        handleContentChange()
        aiResult.value = ''
        return
      }
    }
    // 否则应用到当前页内容
    currentSlide.value.content = aiResult.value
    handleContentChange()
    message.success('已应用到当前幻灯片')
    aiResult.value = ''
  }
}

// AI 快捷操作
async function aiGenerateOutline() {
  await executeAiAction('outline')
}

async function aiExpandContent() {
  const text = currentSlide.value?.title || currentSlide.value?.content || ''

  // 添加用户消息
  aiMessages.value.push({
    role: 'user',
    content: '请帮我扩写当前幻灯片内容',
    timestamp: Date.now()
  })

  aiLoading.value = true
  aiResult.value = ''

  scrollAiMessagesToBottom()

  try {
    const result = await slideAi.executeAction('expand', text)
    aiResult.value = result

    // 添加AI回复消息
    aiMessages.value.push({
      role: 'ai',
      content: result,
      timestamp: Date.now()
    })

    scrollAiMessagesToBottom()
  } catch (error) {
    message.error('AI 调用失败')
    aiMessages.value.push({
      role: 'ai',
      content: '抱歉，AI 服务暂时不可用，请稍后重试。',
      timestamp: Date.now()
    })
    scrollAiMessagesToBottom()
  } finally {
    aiLoading.value = false
  }
}

async function aiGenerateNotes() {
  const text = currentSlide.value?.content || currentSlide.value?.title || ''

  // 添加用户消息
  aiMessages.value.push({
    role: 'user',
    content: '请为当前幻灯片生成演讲备注',
    timestamp: Date.now()
  })

  aiLoading.value = true
  aiResult.value = ''

  scrollAiMessagesToBottom()

  try {
    const result = await slideAi.executeAction('notes', text)
    aiResult.value = result

    // 添加AI回复消息
    aiMessages.value.push({
      role: 'ai',
      content: result,
      timestamp: Date.now()
    })

    scrollAiMessagesToBottom()

    if (currentSlide.value) {
      currentSlide.value.notes = result
      handleContentChange()
      message.success('已生成演讲备注')
    }
  } catch (error) {
    message.error('AI 调用失败')
    aiMessages.value.push({
      role: 'ai',
      content: '抱歉，AI 服务暂时不可用，请稍后重试。',
      timestamp: Date.now()
    })
    scrollAiMessagesToBottom()
  } finally {
    aiLoading.value = false
  }
}

/**
 * AI生成幻灯片
 */
async function aiGenerateSlides() {
  const topic = aiInputText.value || fileName.value

  // 添加用户消息
  aiMessages.value.push({
    role: 'user',
    content: `请为我生成关于"${topic}"的演示文稿`,
    timestamp: Date.now()
  })

  aiLoading.value = true
  isGeneratingSlides.value = true // 标记正在生成幻灯片
  aiResult.value = ''

  scrollAiMessagesToBottom()

  try {
    const result = await slideAi.generateOutline(topic)
    aiResult.value = result

    // 添加AI回复消息
    aiMessages.value.push({
      role: 'ai',
      content: result,
      timestamp: Date.now()
    })

    scrollAiMessagesToBottom()

    const parsed = parseOutlineToSlides(result)
    if (parsed.length > 0) {
      slides.value = parsed
      currentSlideIndex.value = 0
      message.success(`已生成 ${parsed.length} 页幻灯片`)
      handleContentChange()
    }
  } catch (error) {
    message.error('AI 调用失败')
    aiMessages.value.push({
      role: 'ai',
      content: '抱歉，AI 服务暂时不可用，请稍后重试。',
      timestamp: Date.now()
    })
    scrollAiMessagesToBottom()
  } finally {
    aiLoading.value = false
    isGeneratingSlides.value = false // 重置生成状态
  }
}

async function aiDesignSuggest() {
  const text = currentSlide.value?.content || currentSlide.value?.title || ''

  // 添加用户消息
  aiMessages.value.push({
    role: 'user',
    content: '请为当前幻灯片提供设计建议',
    timestamp: Date.now()
  })

  aiLoading.value = true
  aiResult.value = ''

  scrollAiMessagesToBottom()

  try {
    const result = await slideAi.executeAction('design', text)
    aiResult.value = result

    // 添加AI回复消息
    aiMessages.value.push({
      role: 'ai',
      content: result,
      timestamp: Date.now()
    })

    scrollAiMessagesToBottom()
  } catch (error) {
    message.error('AI 调用失败')
    aiMessages.value.push({
      role: 'ai',
      content: '抱歉，AI 服务暂时不可用，请稍后重试。',
      timestamp: Date.now()
    })
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

// ==================== Ribbon 选项卡 ====================

const activeTab = ref('home')
const ribbonTabs = [
  { key: 'home', label: '开始' },
  { key: 'insert', label: '插入' },
  { key: 'design', label: '设计' },
  { key: 'transition', label: '切换' },
  { key: 'animation', label: '动画' }
]

// ==================== 工具栏状态 ====================

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

const fontOptions = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Roboto', value: 'Roboto' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '宋体', value: 'SimSun' },
  { label: '黑体', value: 'SimHei' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Georgia', value: 'Georgia' }
]

const fontSizeOptions = [
  { label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 },
  { label: '11', value: 11 }, { label: '12', value: 12 }, { label: '14', value: 14 },
  { label: '16', value: 16 }, { label: '18', value: 18 }, { label: '20', value: 20 },
  { label: '24', value: 24 }, { label: '28', value: 28 }, { label: '32', value: 32 },
  { label: '36', value: 36 }, { label: '40', value: 40 }, { label: '44', value: 44 },
  { label: '48', value: 48 }, { label: '54', value: 54 }, { label: '60', value: 60 },
  { label: '66', value: 66 }, { label: '72', value: 72 }, { label: '80', value: 80 },
  { label: '88', value: 88 }, { label: '96', value: 96 }
]

const zoomOptions = [
  { label: '50%', key: 50 }, { label: '75%', key: 75 }, { label: '90%', key: 90 },
  { label: '100%', key: 100 }, { label: '125%', key: 125 }, { label: '150%', key: 150 },
  { label: '200%', key: 200 }
]

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

const themes = [
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

const currentThemeColor = computed(() => {
  const theme = themes.find(t => t.key === (currentSlide.value?.theme || currentTheme.value))
  return theme?.textColor || '#000000'
})

const currentThemeColorSecondary = computed(() => {
  const theme = themes.find(t => t.key === (currentSlide.value?.theme || currentTheme.value))
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

const backgroundColors = [
  '#ffffff', '#f5f5f5', '#eeeeee', '#e0e0e0', '#bdbdbd', '#9e9e9e',
  '#757575', '#616161', '#424242', '#212121', '#000000', '#ffebee',
  '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935',
  '#d32f2f', '#c62828', '#b71c1c', '#fce4ec', '#f8bbd9', '#f48fb1'
]

function applyBackgroundColor(color: string) {
  if (currentSlide.value) {
    currentSlide.value.background = color
    handleContentChange()
  }
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
const currentSlide = computed(() => slides.value[currentSlideIndex.value])

// ==================== 幻灯片版式 ====================

const currentLayout = computed(() => currentSlide.value?.layout || 'title')

const slideLayouts = [
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

function applyLayout(layout: string) {
  if (!currentSlide.value) return
  currentSlide.value.layout = layout
  const config = slideLayouts.find(l => l.key === layout)
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
const transitions = [
  { key: 'none', name: '无' },
  { key: 'fade', name: '淡入淡出' },
  { key: 'slide', name: '滑动' },
  { key: 'push', name: '推进' },
  { key: 'zoom', name: '缩放' },
  { key: 'split', name: '分割' }
]

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
const animations = [
  { key: 'none', name: '无' },
  { key: 'appear', name: '出现' },
  { key: 'fade', name: '淡出' },
  { key: 'fly', name: '飞入' },
  { key: 'float', name: '浮入' },
  { key: 'split', name: '劈裂' },
  { key: 'wipe', name: '擦除' }
]

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

const canvasStyle = computed(() => ({
  transform: presentMode.value ? 'scale(1)' : `scale(${zoomLevel.value / 100})`,
  background: currentSlide.value?.background || getThemeBackground(currentSlide.value?.theme) || '#ffffff'
}))

function getThemeBackground(themeKey?: string): string {
  const theme = themes.find(t => t.key === themeKey)
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

/**
 * 根据索引删除幻灯片
 * @param index - 要删除的幻灯片索引
 */
function deleteSlideByIndex(index: number) {
  slides.value.splice(index, 1)
  // 如果删除的是当前选中的幻灯片或之前的幻灯片，需要调整当前索引
  if (currentSlideIndex.value >= index) {
    currentSlideIndex.value = Math.max(0, currentSlideIndex.value - 1)
  }
  // 如果删除后没有幻灯片了，自动创建一张空白幻灯片
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

/**
 * 获取幻灯片显示的标题文本
 * @param slide - 幻灯片对象
 * @returns 处理后的标题文本（换行符替换为空格）
 */
function getSlideDisplayTitle(slide: Slide): string {
  const rawTitle = slide.title || (slide.elements?.find(e => e.type === 'text')?.content || '')
  // 将换行符替换为空格，避免在缩略图中显示为字面量 \n
  return rawTitle.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()
}

// ==================== 内容编辑 ====================

/**
 * 选中元素内所有文本
 * @param element - 要选中内容的HTML元素
 */
function selectAllText(element: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(element)
  const selection = window.getSelection()
  if (selection) {
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

/**
 * 处理标题焦点事件
 */
function handleTitleFocus() {
  // 标题获取焦点时的处理
}

/**
 * 处理标题失焦事件
 */
function handleTitleBlur() {
  handleContentChange()
}

/**
 * 处理副标题焦点事件
 */
function handleSubtitleFocus() {
  // 副标题获取焦点时的处理
}

/**
 * 处理副标题失焦事件
 */
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

const presentMode = ref(false)
const slideTransitioning = ref(false)

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

// ==================== 初始化 ====================

onMounted(async () => {
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
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
@import '@/styles/nexus.scss';

.slide-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--nexus-bg);
  overflow: hidden;
  font-family: var(--nexus-font-ui);
}

// ==================== Nexus 按钮系统 ====================

.nexus-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--nexus-radius-full);
  border: none;
  background: transparent;
  color: var(--nexus-text-primary);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover:not(:disabled) {
    background: var(--nexus-divider);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.nexus-icon-dark {
  background: var(--nexus-text-primary);
  color: var(--nexus-text-inverse);

  &:hover {
    background: var(--nexus-text-secondary);
  }
}

.nexus-icon-ghost {
  background: transparent;
  color: var(--nexus-text-secondary);

  &:hover {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
  }
}

.nexus-pill-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--nexus-radius-full);
  border: none;
  background: transparent;
  color: var(--nexus-text-primary);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover:not(:disabled) {
    background: var(--nexus-divider);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.nexus-pill-dark {
  background: var(--nexus-text-primary);
  color: var(--nexus-text-inverse);

  &:hover {
    background: var(--nexus-text-secondary);
    transform: translateY(-1px);
  }
}

.nexus-pill-outline {
  background: var(--nexus-surface);
  color: var(--nexus-text-primary);
  border: 1px solid var(--nexus-border);

  &:hover {
    background: var(--nexus-bg);
    border-color: var(--nexus-text-secondary);
  }
}

.nexus-pill-ghost {
  color: var(--nexus-text-secondary);

  &:hover {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
  }
}

.nexus-ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--nexus-radius-md);
  border: none;
  background: transparent;
  color: var(--nexus-text-secondary);
  font-size: 12px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
  }
}

.nexus-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--nexus-radius-md);
  border: 1px solid var(--nexus-border);
  background: transparent;
  color: var(--nexus-text-primary);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    background: var(--nexus-divider);
    border-color: var(--nexus-text-secondary);
  }

  &.active {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
    border-color: var(--nexus-text-primary);
  }
}

.nexus-send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--nexus-radius-full);
  border: none;
  background: var(--nexus-text-primary);
  color: var(--nexus-text-inverse);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover:not(:disabled) {
    background: var(--nexus-text-secondary);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.ai-toggle {
  background: var(--nexus-surface);
  border: 1px solid var(--nexus-border);
  color: var(--nexus-text-primary);

  &:hover {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
    border-color: var(--nexus-text-primary);
  }

  .nexus-icon {
    color: #10b981;
  }
}

.ai-action-btn {
  background: var(--nexus-surface);
  border: 1px solid var(--nexus-border);

  &:hover {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);

    .nexus-icon {
      color: #ffffff;
    }
  }

  .nexus-icon {
    color: #10b981;
  }
}

// ==================== 顶部标题栏 ====================

.se-header {
  height: 56px;
  background: var(--nexus-surface);
  border-bottom: 1px solid var(--nexus-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.se-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.se-logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--nexus-radius-lg);
  background: var(--nexus-divider);
}

.se-doc-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.se-doc-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--nexus-text-primary);
  border: none;
  background: transparent;
  padding: 2px 4px;
  border-radius: var(--nexus-radius-sm);
  width: 280px;
  font-family: var(--nexus-font-ui);

  &:hover {
    background: var(--nexus-divider);
  }

  &:focus {
    outline: none;
    background: var(--nexus-surface);
    box-shadow: 0 0 0 2px var(--nexus-text-primary);
  }
}

.se-save-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.se-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.se-status-text {
  font-size: 12px;
  color: var(--nexus-text-tertiary);
}

.se-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

// ==================== Ribbon 工具栏 ====================

.se-toolbar {
  height: 48px;
  background: var(--nexus-surface);
  border-bottom: 1px solid var(--nexus-border);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  flex-shrink: 0;
}

.quick-access-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ribbon-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.ribbon-tab {
  padding: 6px 16px;
  border-radius: var(--nexus-radius-full);
  font-size: 13px;
  font-weight: 500;
  color: var(--nexus-text-secondary);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
  }

  &.active {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
  }
}

.ribbon-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.se-divider {
  width: 1px;
  height: 24px;
  background: var(--nexus-border);
  margin: 0 4px;
}

// ==================== Ribbon 面板 ====================

.ribbon-panel {
  height: 100px;
  background: var(--nexus-surface);
  border-bottom: 1px solid var(--nexus-border);
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 16px;
  flex-shrink: 0;
  overflow-x: auto;
}

.ribbon-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.group-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--nexus-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.group-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.font-controls {
  display: flex;
  gap: 8px;
}

.se-font-select {
  width: 140px;

  :deep(.n-base-selection) {
    border-radius: var(--nexus-radius-full);
    background: var(--nexus-surface);
  }
}

.se-size-select {
  width: 70px;

  :deep(.n-base-selection) {
    border-radius: var(--nexus-radius-full);
    background: var(--nexus-surface);
  }
}

.format-buttons,
.align-buttons,
.list-buttons {
  display: flex;
  gap: 4px;
}

.format-letter {
  font-size: 14px;
  font-family: 'Times New Roman', serif;

  &.format-bold {
    font-weight: bold;
  }

  &.format-italic {
    font-style: italic;
  }

  &.format-underline {
    text-decoration: underline;
  }
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.theme-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  border-radius: var(--nexus-radius-md);
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--nexus-shadow-sm);
  }

  &.active {
    border-color: var(--nexus-text-primary);
  }
}

.theme-preview {
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-text {
  font-size: 12px;
  font-weight: 600;
}

.theme-name {
  font-size: 10px;
  color: var(--nexus-text-secondary);
  text-align: center;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.color-item {
  aspect-ratio: 1;
  border-radius: var(--nexus-radius-sm);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 150ms;

  &:hover {
    transform: scale(1.1);
    border-color: var(--nexus-border);
  }
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.layout-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  border-radius: var(--nexus-radius-md);
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    border-color: var(--nexus-border);
  }

  &.active {
    border-color: var(--nexus-text-primary);
  }
}

.layout-preview {
  aspect-ratio: 16 / 9;
  background: var(--nexus-divider);
  padding: 8px;
}

.layout-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.layout-bar {
  background: var(--nexus-border);
  border-radius: 2px;

  &.layout-title-bar {
    height: 6px;
    width: 60%;
  }

  &.layout-content-bar {
    flex: 1;
  }
}

.layout-name {
  font-size: 10px;
  color: var(--nexus-text-secondary);
  text-align: center;
}

.transition-grid,
.animation-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.transition-item,
.animation-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border-radius: var(--nexus-radius-md);
  cursor: pointer;
  transition: all 150ms;

  &:hover {
    background: var(--nexus-divider);
  }

  &.active {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
  }

  span {
    font-size: 11px;
    font-weight: 500;
  }
}

// ==================== 主体区域 ====================

.se-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// ==================== 左侧幻灯片面板 ====================

.se-slide-panel {
  width: 220px;
  background: var(--nexus-surface);
  border-right: 1px solid var(--nexus-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.se-slide-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.se-slide-thumb {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  cursor: pointer;

  &:hover {
    .se-thumb-preview {
      border-color: var(--nexus-border);
    }
  }

  &.active {
    .se-thumb-preview {
      border-color: var(--nexus-text-primary);
      border-width: 2px;
    }
  }
}

.se-thumb-number {
  font-size: 11px;
  color: var(--nexus-text-tertiary);
  width: 20px;
  text-align: right;
  padding-top: 6px;
  font-weight: 500;
}

.se-thumb-preview {
  flex: 1;
  aspect-ratio: 16 / 9;
  background: var(--nexus-surface);
  border: 1px solid var(--nexus-border);
  border-radius: var(--nexus-radius-lg);
  overflow: hidden;
  padding: 10px;
  transition: all 200ms var(--nexus-ease);
}

.se-thumb-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.se-thumb-title {
  font-size: 8px;
  font-weight: 600;
  color: var(--nexus-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.se-thumb-subtitle {
  font-size: 6px;
  color: var(--nexus-text-secondary);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.se-thumb-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: var(--nexus-radius-full);
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0;
  transition: all 200ms var(--nexus-ease);
  z-index: 10;

  &:hover {
    background: rgba(220, 38, 38, 1);
    transform: scale(1.1);
  }
}

.se-slide-thumb {
  position: relative;

  &:hover {
    .se-thumb-delete {
      display: flex;
      opacity: 1;
    }
  }
}

.se-slide-actions {
  padding: 12px 16px;
  border-top: 1px solid var(--nexus-border);
}

.se-add-slide-btn {
  width: 100%;
  justify-content: center;
}

// ==================== 中间编辑区 ====================

.se-edit-area {
  flex: 1;
  display: flex;
  background: var(--nexus-bg);
  position: relative;
  overflow: auto;
}

.se-canvas-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.se-canvas {
  width: 960px;
  height: 540px;
  background: var(--nexus-surface);
  border-radius: var(--nexus-radius-xl);
  box-shadow: var(--nexus-shadow-sm);
  position: relative;
  transform-origin: center center;
  transition: transform 200ms var(--nexus-ease), opacity 300ms var(--nexus-ease);
  overflow: hidden;
}

.se-slide-content {
  width: 100%;
  height: 100%;
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  position: relative;

  &.blank {
    padding: 0;
  }

  &.title-only,
  &.section {
    justify-content: center;
  }

  &.title-content,
  &.title-two-content,
  &.content-caption,
  &.comparison {
    align-items: flex-start;
    justify-content: flex-start;
  }
}

.se-slide-title {
  font-size: 40px;
  font-weight: 600;
  color: var(--nexus-text-primary);
  text-align: center;
  outline: none;
  width: 100%;
  line-height: 1.2;
  border: 1px dashed transparent;
  border-radius: 4px;
  padding: 4px 8px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--nexus-border);
  }

  &:focus {
    border-color: var(--nexus-text-primary);
    border-style: solid;
  }

  &:empty::before {
    content: '点击添加标题';
    color: var(--nexus-text-tertiary);
  }
}

.se-slide-subtitle {
  font-size: 20px;
  font-weight: 400;
  color: var(--nexus-text-secondary);
  text-align: center;
  outline: none;
  width: 100%;
  border: 1px dashed transparent;
  border-radius: 4px;
  padding: 4px 8px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--nexus-border);
  }

  &:focus {
    border-color: var(--nexus-text-primary);
    border-style: solid;
  }

  &:empty::before {
    content: '点击添加副标题';
    color: var(--nexus-text-tertiary);
  }
}

.se-slide-body {
  flex: 1;
  font-size: 18px;
  color: var(--nexus-text-primary);
  outline: none;
  width: 100%;
  line-height: 1.6;
  white-space: pre-wrap;
  border: 1px dashed transparent;
  border-radius: 4px;
  padding: 4px 8px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--nexus-border);
  }

  &:focus {
    border-color: var(--nexus-text-primary);
    border-style: solid;
  }

  &:empty::before {
    content: '点击添加内容';
    color: var(--nexus-text-tertiary);
  }
}

// ==================== 元素系统 ====================

.se-element {
  position: absolute;
  cursor: move;
  user-select: none;

  &:hover {
    outline: 2px solid var(--nexus-text-primary);
  }

  .se-element-delete {
    position: absolute;
    top: -10px;
    right: -10px;
    width: 20px;
    height: 20px;
    border-radius: var(--nexus-radius-full);
    background: #ef4444;
    color: var(--nexus-text-inverse);
    border: none;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  &:hover .se-element-delete {
    display: flex;
  }
}

.se-element-text {
  width: 100%;
  height: 100%;
  padding: 8px;
  font-size: 14px;
  color: var(--nexus-text-primary);
  outline: none;
  overflow: auto;
  word-break: break-word;
  white-space: pre-wrap;
}

.se-element-shape {
  width: 100%;
  height: 100%;
}

.se-element-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

// ==================== 右侧面板 ====================

.se-right-panel {
  width: 300px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--nexus-radius-xl) 0 0 var(--nexus-radius-xl);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin: 8px 0 8px 0;
  overflow: hidden;
}

.se-panel-header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid var(--nexus-border);
  font-size: 14px;
  font-weight: 600;
  color: var(--nexus-text-primary);
}

.se-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
}

.se-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--nexus-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.se-theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.se-theme-item {
  cursor: pointer;
  border-radius: var(--nexus-radius-lg);
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--nexus-shadow-md);
  }

  &.active {
    border-color: var(--nexus-text-primary);
  }
}

.se-theme-preview {
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.se-theme-text {
  text-align: center;
}

.se-theme-preview-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
}

.se-theme-preview-sub {
  font-size: 9px;
  opacity: 0.8;
}

.se-theme-name {
  padding: 8px;
  font-size: 12px;
  color: var(--nexus-text-secondary);
  text-align: center;
  background: var(--nexus-bg);
}

.se-color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.se-color-item {
  aspect-ratio: 1;
  border-radius: var(--nexus-radius-full);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 150ms;

  &:hover {
    transform: scale(1.1);
    border-color: var(--nexus-border);
  }
}

.se-layout-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.se-layout-item {
  cursor: pointer;
  border-radius: var(--nexus-radius-lg);
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    border-color: var(--nexus-border);
  }

  &.active {
    border-color: var(--nexus-text-primary);
  }
}

.se-layout-preview {
  aspect-ratio: 16 / 9;
  background: var(--nexus-bg);
  padding: 12px;
}

.se-layout-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.se-layout-bar {
  background: var(--nexus-border);
  border-radius: 2px;

  &.se-layout-title-bar {
    height: 8px;
    width: 60%;
  }

  &.se-layout-content-bar {
    flex: 1;
  }

  &.se-layout-subtitle-bar {
    height: 6px;
    width: 40%;
  }
}

.se-layout-name {
  padding: 8px;
  font-size: 12px;
  color: var(--nexus-text-secondary);
  text-align: center;
  background: var(--nexus-bg);
}

// ==================== AI 面板 ====================

.se-ai-panel {
  width: 320px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--nexus-radius-xl) 0 0 var(--nexus-radius-xl);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin: 8px 0 8px 0;
  overflow: hidden;
}

.ai-panel-header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid var(--nexus-border);
  flex-shrink: 0;
}

.ai-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--nexus-text-primary);
}

// 消息区域
.ai-messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 欢迎消息
.ai-welcome {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 4px;
}

.ai-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--nexus-radius-full);
  background: var(--nexus-text-primary);
  color: var(--nexus-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-welcome-text {
  font-size: 12px;
  color: var(--nexus-text-secondary);
  line-height: 1.5;

  p {
    margin: 0 0 4px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

// 快捷操作
.ai-quick-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 4px;
}

// 消息列表
.ai-messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-message {
  display: flex;
  gap: 8px;
  align-items: flex-start;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;
    }

    .message-bubble {
      background: var(--nexus-text-primary);
      color: var(--nexus-text-inverse);
      border-radius: 12px 12px 4px 12px;
    }
  }

  &.ai {
    .message-bubble {
      background: var(--nexus-divider);
      color: var(--nexus-text-primary);
      border-radius: 4px 12px 12px 12px;
    }
  }
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--nexus-radius-full);
  background: var(--nexus-divider);
  color: var(--nexus-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.message-bubble {
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  max-width: 100%;
}

// 加载状态
.ai-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--nexus-text-secondary);
  padding: 8px 4px;
}

.loading-dots {
  display: flex;
  gap: 4px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: var(--nexus-radius-full);
    background: var(--nexus-text-secondary);
    animation: loading-bounce 1.4s infinite ease-in-out;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

// 结果操作按钮
.ai-result-actions {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--nexus-border);
  border-bottom: 1px solid var(--nexus-border);
  background: var(--nexus-bg);
  flex-shrink: 0;
}

// 输入区域
.ai-input-area {
  padding: 12px;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-shrink: 0;
  background: var(--nexus-surface);
}

.ai-textarea {
  flex: 1;
  padding: 8px 12px;
  border-radius: var(--nexus-radius-lg);
  border: 1px solid var(--nexus-border);
  background: var(--nexus-bg);
  font-size: 13px;
  font-family: var(--nexus-font-ui);
  color: var(--nexus-text-primary);
  resize: none;
  transition: all 200ms var(--nexus-ease);
  min-height: 36px;
  max-height: 100px;
  line-height: 1.4;

  &:focus {
    outline: none;
    border-color: var(--nexus-text-primary);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
  }

  &::placeholder {
    color: var(--nexus-text-tertiary);
  }
}

// ==================== 底部备注区 ====================

.se-notes-area {
  background: var(--nexus-surface);
  border-top: 1px solid var(--nexus-border);
  flex-shrink: 0;
  transition: all 200ms var(--nexus-ease);

  &.collapsed {
    .se-notes-header {
      border-bottom: none;
    }
  }
}

.se-notes-header {
  height: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  background: var(--nexus-bg);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--nexus-text-secondary);
  border-bottom: 1px solid var(--nexus-border);
  transition: background 150ms;

  &:hover {
    background: var(--nexus-divider);
  }
}

.se-notes-content {
  padding: 12px 18px;
}

.se-notes-input {
  width: 100%;
  min-height: 60px;
  border: none;
  resize: vertical;
  font-size: 14px;
  line-height: 1.5;
  color: var(--nexus-text-primary);
  background: transparent;
  font-family: var(--nexus-font-ui);

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: var(--nexus-text-tertiary);
  }
}

// ==================== 放映模式 ====================

.present-mode {
  background: var(--nexus-text-primary);
}

.present-main {
  .se-edit-area {
    background: var(--nexus-text-primary);
  }
}

.present-area {
  .se-canvas-wrapper {
    padding: 0;
    margin: 0;
  }

  .se-canvas {
    border-radius: 0;
    box-shadow: none;
    width: 100vw;
    height: 100vh;
  }
}

.present-canvas {
  transition: opacity 300ms var(--nexus-ease);
}

.fade-in {
  animation: fadeIn 300ms var(--nexus-ease);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.se-present-controls {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  padding: 10px 24px;
  border-radius: var(--nexus-radius-full);
  z-index: 100;
}

.se-present-counter {
  color: var(--nexus-text-inverse);
  font-size: 14px;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

.se-present-exit {
  margin-left: 8px;
}

.se-present-notes {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 600px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.9);
  padding: 12px 20px;
  border-radius: var(--nexus-radius-lg);
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  z-index: 99;
}

// ==================== AI生成PPT全局加载遮罩 ====================

.ai-generating-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.ai-generating-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
  background: white;
  border-radius: var(--nexus-radius-xl);
  box-shadow: var(--nexus-shadow-lg);
  animation: slideUp 0.3s ease;
}

.ai-generating-spinner {
  animation: pulse 1.5s ease-in-out infinite;
}

.ai-generating-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--nexus-text-primary);
}

.ai-generating-subtext {
  font-size: 14px;
  color: var(--nexus-text-secondary);
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ==================== 响应式适配 ====================

@media (max-width: 1200px) {
  .se-right-panel,
  .se-ai-panel {
    width: 260px;
  }
}

@media (max-width: 992px) {
  .se-slide-panel {
    width: 180px;
  }

  .se-right-panel,
  .se-ai-panel {
    display: none;
  }
}

@media print {
  .se-header,
  .se-toolbar,
  .ribbon-panel,
  .se-slide-panel,
  .se-right-panel,
  .se-ai-panel,
  .se-notes-area,
  .se-present-controls {
    display: none !important;
  }

  .se-canvas {
    transform: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
}
</style>
