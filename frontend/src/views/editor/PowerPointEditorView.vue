<template>
  <div class="ppt-editor">
    <!-- 顶部标题栏 -->
    <header class="ppt-title-bar">
      <div class="title-bar-left">
        <n-button text class="back-btn" @click="handleBack">
          <template #icon>
            <n-icon :component="ArrowBackOutline" />
          </template>
        </n-button>
        <div class="file-info">
          <n-input
            v-model:value="fileName"
            class="filename-input"
            :bordered="false"
            placeholder="演示文稿1"
            @blur="handleSaveFileName"
          />
          <div class="save-status">
            <n-tag
              v-if="saveStatus === 'saved'"
              type="success"
              size="small"
              :bordered="false"
            >
              已保存
            </n-tag>
            <n-tag
              v-else-if="saveStatus === 'saving'"
              type="warning"
              size="small"
              :bordered="false"
            >
              保存中...
            </n-tag>
          </div>
        </div>
      </div>
      <div class="title-bar-right">
        <n-space size="small">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button size="small" quaternary @click="showAiPanel = !showAiPanel">
                <template #icon>
                  <n-icon :component="SparklesOutline" />
                </template>
              </n-button>
            </template>
            AI 助手
          </n-tooltip>
          <n-button size="small" @click="handleExport">
            <template #icon>
              <n-icon :component="DownloadOutline" />
            </template>
            导出
          </n-button>
          <n-button type="primary" size="small" @click="handleSave">
            保存
          </n-button>
        </n-space>
      </div>
    </header>

    <!-- Ribbon 工具栏 -->
    <div class="ppt-ribbon">
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
      <div class="ribbon-content">
        <!-- 文件菜单 -->
        <div v-if="activeTab === 'file'" class="ribbon-panel">
          <div class="ribbon-group">
            <div class="ribbon-group-title">信息</div>
            <div class="ribbon-group-content">
              <n-button text class="ribbon-btn">
                <template #icon>
                  <n-icon :component="InformationCircleOutline" />
                </template>
                <span>属性</span>
              </n-button>
            </div>
          </div>
          <div class="ribbon-group">
            <div class="ribbon-group-title">保存</div>
            <div class="ribbon-group-content">
              <n-button text class="ribbon-btn" @click="handleSave">
                <template #icon>
                  <n-icon :component="SaveOutline" />
                </template>
                <span>保存</span>
              </n-button>
              <n-button text class="ribbon-btn" @click="handleExport">
                <template #icon>
                  <n-icon :component="DownloadOutline" />
                </template>
                <span>另存为</span>
              </n-button>
            </div>
          </div>
          <div class="ribbon-group">
            <div class="ribbon-group-title">打印</div>
            <div class="ribbon-group-content">
              <n-button text class="ribbon-btn">
                <template #icon>
                  <n-icon :component="PrintOutline" />
                </template>
                <span>打印</span>
              </n-button>
            </div>
          </div>
        </div>

        <!-- 开始菜单 -->
        <div v-if="activeTab === 'home'" class="ribbon-panel">
          <div class="ribbon-group">
            <div class="ribbon-group-title">幻灯片</div>
            <div class="ribbon-group-content">
              <n-button text class="ribbon-btn" @click="addSlide">
                <template #icon>
                  <n-icon :component="AddCircleOutline" />
                </template>
                <span>新建幻灯片</span>
              </n-button>
              <n-button text class="ribbon-btn" @click="duplicateSlide">
                <template #icon>
                  <n-icon :component="CopyOutline" />
                </template>
                <span>复制</span>
              </n-button>
              <n-button text class="ribbon-btn" @click="deleteSlide">
                <template #icon>
                  <n-icon :component="TrashOutline" />
                </template>
                <span>删除</span>
              </n-button>
            </div>
          </div>
          <div class="ribbon-group">
            <div class="ribbon-group-title">字体</div>
            <div class="ribbon-group-content vertical">
              <div class="font-row">
                <n-select
                  v-model:value="selectedFont"
                  :options="fontOptions"
                  size="small"
                  class="font-select"
                />
                <n-select
                  v-model:value="selectedFontSize"
                  :options="fontSizeOptions"
                  size="small"
                  class="size-select"
                />
              </div>
              <div class="font-row">
                <n-button
text
size="small"
:type="isBold ? 'primary' : 'default'"
@click="toggleBold">
                  <template #icon>
                    <span style="font-weight: bold; font-size: 14px;">B</span>
                  </template>
                </n-button>
                <n-button
text
size="small"
:type="isItalic ? 'primary' : 'default'"
@click="toggleItalic">
                  <template #icon>
                    <span style="font-style: italic; font-size: 14px;">I</span>
                  </template>
                </n-button>
                <n-button
text
size="small"
:type="isUnderline ? 'primary' : 'default'"
@click="toggleUnderline">
                  <template #icon>
                    <span style="text-decoration: underline; font-size: 14px;">U</span>
                  </template>
                </n-button>
                <n-divider vertical />
                <n-button text size="small" @click="toggleAlign('left')">
                  <template #icon>
                    <n-icon :component="ReturnUpBackOutline" />
                  </template>
                </n-button>
                <n-button text size="small" @click="toggleAlign('center')">
                  <template #icon>
                    <n-icon :component="CodeDownloadOutline" />
                  </template>
                </n-button>
                <n-button text size="small" @click="toggleAlign('right')">
                  <template #icon>
                    <n-icon :component="ReturnUpForwardOutline" />
                  </template>
                </n-button>
              </div>
            </div>
          </div>
          <div class="ribbon-group">
            <div class="ribbon-group-title">段落</div>
            <div class="ribbon-group-content">
              <n-button text class="ribbon-btn" @click="addBulletList">
                <template #icon>
                  <n-icon :component="ListOutline" />
                </template>
                <span>项目符号</span>
              </n-button>
              <n-button text class="ribbon-btn" @click="addNumberedList">
                <template #icon>
                  <n-icon :component="ReorderTwoOutline" />
                </template>
                <span>编号</span>
              </n-button>
            </div>
          </div>
        </div>

        <!-- 插入菜单 -->
        <div v-if="activeTab === 'insert'" class="ribbon-panel">
          <div class="ribbon-group">
            <div class="ribbon-group-title">表格</div>
            <div class="ribbon-group-content">
              <n-button text class="ribbon-btn" @click="insertTable">
                <template #icon>
                  <n-icon :component="GridOutline" />
                </template>
                <span>表格</span>
              </n-button>
            </div>
          </div>
          <div class="ribbon-group">
            <div class="ribbon-group-title">图像</div>
            <div class="ribbon-group-content">
              <n-button text class="ribbon-btn" @click="insertImage">
                <template #icon>
                  <n-icon :component="ImageOutline" />
                </template>
                <span>图片</span>
              </n-button>
              <n-button text class="ribbon-btn" @click="insertShape">
                <template #icon>
                  <n-icon :component="ShapesOutline" />
                </template>
                <span>形状</span>
              </n-button>
              <n-button text class="ribbon-btn" @click="insertIcon">
                <template #icon>
                  <n-icon :component="HappyOutline" />
                </template>
                <span>图标</span>
              </n-button>
            </div>
          </div>
          <div class="ribbon-group">
            <div class="ribbon-group-title">文本</div>
            <div class="ribbon-group-content">
              <n-button text class="ribbon-btn" @click="insertTextBox">
                <template #icon>
                  <n-icon :component="TextOutline" />
                </template>
                <span>文本框</span>
              </n-button>
            </div>
          </div>
        </div>

        <!-- 设计菜单 -->
        <div v-if="activeTab === 'design'" class="ribbon-panel">
          <div class="ribbon-group">
            <div class="ribbon-group-title">主题</div>
            <div class="ribbon-group-content">
              <div class="theme-grid">
                <div
                  v-for="theme in themes"
                  :key="theme.key"
                  :class="['theme-item', { active: currentTheme === theme.key }]"
                  :style="{ background: theme.preview }"
                  @click="applyTheme(theme.key)"
                >
                  <span class="theme-name">{{ theme.name }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="ribbon-group">
            <div class="ribbon-group-title">变体</div>
            <div class="ribbon-group-content">
              <div class="variant-colors">
                <div
                  v-for="color in variantColors"
                  :key="color"
                  class="color-dot"
                  :style="{ background: color }"
                  @click="applyVariant(color)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 切换菜单 -->
        <div v-if="activeTab === 'transition'" class="ribbon-panel">
          <div class="ribbon-group">
            <div class="ribbon-group-title">切换效果</div>
            <div class="ribbon-group-content">
              <div class="transition-grid">
                <div
                  v-for="trans in transitions"
                  :key="trans.key"
                  :class="['transition-item', { active: currentTransition === trans.key }]"
                  @click="applyTransition(trans.key)"
                >
                  <div class="transition-preview" :class="trans.key">
                    <n-icon :component="trans.icon" />
                  </div>
                  <span class="transition-name">{{ trans.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 动画菜单 -->
        <div v-if="activeTab === 'animation'" class="ribbon-panel">
          <div class="ribbon-group">
            <div class="ribbon-group-title">动画效果</div>
            <div class="ribbon-group-content">
              <div class="animation-grid">
                <div
                  v-for="anim in animations"
                  :key="anim.key"
                  :class="['animation-item', { active: currentAnimation === anim.key }]"
                  @click="applyAnimation(anim.key)"
                >
                  <div class="animation-preview" :class="anim.key">
                    <n-icon :component="anim.icon" />
                  </div>
                  <span class="animation-name">{{ anim.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 幻灯片放映菜单 -->
        <div v-if="activeTab === 'slideshow'" class="ribbon-panel">
          <div class="ribbon-group">
            <div class="ribbon-group-title">开始放映</div>
            <div class="ribbon-group-content">
              <n-button text class="ribbon-btn" @click="startSlideshow">
                <template #icon>
                  <n-icon :component="PlayCircleOutline" />
                </template>
                <span>从头开始</span>
              </n-button>
              <n-button text class="ribbon-btn" @click="startSlideshowFromCurrent">
                <template #icon>
                  <n-icon :component="PlayOutline" />
                </template>
                <span>从当前幻灯片</span>
              </n-button>
            </div>
          </div>
          <div class="ribbon-group">
            <div class="ribbon-group-title">设置</div>
            <div class="ribbon-group-content">
              <n-button text class="ribbon-btn">
                <template #icon>
                  <n-icon :component="SettingsOutline" />
                </template>
                <span>设置放映</span>
              </n-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主体编辑区域 -->
    <div class="ppt-main">
      <!-- 左侧幻灯片缩略图面板 -->
      <aside class="slide-thumbnail-panel">
        <div class="thumbnail-header">
          <span class="thumbnail-title">幻灯片</span>
          <n-space size="small">
            <n-button text size="small" @click="addSlide">
              <template #icon>
                <n-icon :component="AddOutline" />
              </template>
            </n-button>
          </n-space>
        </div>
        <div class="thumbnail-list">
          <div
            v-for="(slide, index) in slides"
            :key="slide.id"
            :class="['thumbnail-item', { active: currentSlideIndex === index }]"
            @click="selectSlide(index)"
          >
            <div class="thumbnail-number">{{ index + 1 }}</div>
            <div class="thumbnail-preview" :style="getSlideStyle(slide)">
              <div class="slide-content-preview">
                <div v-if="slide.title" class="preview-title">{{ slide.title }}</div>
                <div v-if="slide.content" class="preview-content">{{ slide.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中间幻灯片编辑区 -->
      <main class="slide-edit-area">
        <div class="slide-canvas-container">
          <div
            class="slide-canvas"
            :style="canvasStyle"
            @click="handleCanvasClick"
          >
            <div v-if="currentSlide" class="slide-content">
              <!-- 标题区域 -->
              <div
                v-if="currentSlide.title !== undefined"
                class="slide-title-area"
                contenteditable="true"
                @input="updateTitle($event)"
                @blur="handleContentChange"
              >
                {{ currentSlide.title || '单击此处添加标题' }}
              </div>
              <!-- 副标题区域 -->
              <div
                v-if="currentSlide.subtitle !== undefined"
                class="slide-subtitle-area"
                contenteditable="true"
                @input="updateSubtitle($event)"
                @blur="handleContentChange"
              >
                {{ currentSlide.subtitle || '单击此处添加副标题' }}
              </div>
              <!-- 内容区域 -->
              <div
                v-if="currentSlide.content !== undefined"
                class="slide-body-area"
                contenteditable="true"
                @input="updateContent($event)"
                @blur="handleContentChange"
              >
                {{ currentSlide.content || '单击此处添加内容' }}
              </div>
            </div>
          </div>
        </div>
        <div class="slide-notes">
          <div class="notes-header">
            <span>备注</span>
            <n-button text size="small">
              <template #icon>
                <n-icon :component="ChevronUpOutline" />
              </template>
            </n-button>
          </div>
          <div class="notes-content">
            <n-input
              v-model:value="currentSlideNotes"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="添加演讲者备注..."
              :bordered="false"
              @blur="handleSaveNotes"
            />
          </div>
        </div>
      </main>

      <!-- 右侧属性面板 -->
      <aside v-if="showPropertiesPanel" class="properties-panel">
        <div class="properties-header">
          <span>格式</span>
        </div>
        <div class="properties-content">
          <n-collapse :default-expanded-names="['slide', 'background']">
            <n-collapse-item title="幻灯片" name="slide">
              <div class="property-group">
                <div class="property-label">版式</div>
                <div class="layout-grid">
                  <div
                    v-for="layout in slideLayouts"
                    :key="layout.key"
                    :class="['layout-item', { active: currentLayout === layout.key }]"
                    @click="applyLayout(layout.key)"
                  >
                    <div class="layout-preview">
                      <div class="layout-title-bar" ></div>
                      <div class="layout-content-area" ></div>
                    </div>
                    <span class="layout-name">{{ layout.name }}</span>
                  </div>
                </div>
              </div>
            </n-collapse-item>
            <n-collapse-item title="背景" name="background">
              <div class="property-group">
                <div class="property-label">填充</div>
                <n-radio-group v-model:value="backgroundType" vertical>
                  <n-radio value="solid">纯色填充</n-radio>
                  <n-radio value="gradient">渐变填充</n-radio>
                  <n-radio value="image">图片或纹理填充</n-radio>
                </n-radio-group>
                <div v-if="backgroundType === 'solid'" class="color-picker-row">
                  <div
                    v-for="color in backgroundColors"
                    :key="color"
                    class="color-option"
                    :style="{ background: color }"
                    @click="applyBackgroundColor(color)"
                  ></div>
                </div>
              </div>
            </n-collapse-item>
          </n-collapse>
        </div>
      </aside>

      <!-- AI 面板 -->
      <aside v-if="showAiPanel" class="ai-panel">
        <div class="ai-panel-header">
          <span class="ai-title">
            <n-icon :component="SparklesOutline" />
            AI 助手
          </span>
          <n-button text size="small" @click="showAiPanel = false">
            <template #icon>
              <n-icon :component="CloseOutline" />
            </template>
          </n-button>
        </div>
        <div class="ai-panel-content">
          <AiChatArea
            ref="chatRef"
            :session-id="`ppt:${projectId}`"
            mode="sidebar"
            :system-context="aiSystemContext"
            :fluid="true"
            @save-file="handleAiInsert"
          />
        </div>
      </aside>
    </div>

    <!-- 底部状态栏 -->
    <footer class="ppt-status-bar">
      <div class="status-left">
        <span class="status-item">幻灯片 {{ currentSlideIndex + 1 }} / {{ slides.length }}</span>
        <n-divider vertical />
        <span class="status-item">{{ currentLayoutName }}</span>
      </div>
      <div class="status-right">
        <n-button text size="small" @click="zoomOut">
          <template #icon>
            <n-icon :component="RemoveOutline" />
          </template>
        </n-button>
        <span class="zoom-level">{{ zoomLevel }}%</span>
        <n-button text size="small" @click="zoomIn">
          <template #icon>
            <n-icon :component="AddOutline" />
          </template>
        </n-button>
        <n-divider vertical />
        <n-button text size="small" @click="togglePropertiesPanel">
          <template #icon>
            <n-icon :component="OptionsOutline" />
          </template>
        </n-button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  ArrowBackOutline,
  AddCircleOutline,
  CopyOutline,
  TrashOutline,
  SaveOutline,
  DownloadOutline,
  PrintOutline,
  InformationCircleOutline,
  ListOutline,
  ReorderTwoOutline,
  GridOutline,
  ImageOutline,
  ShapesOutline,
  HappyOutline,
  TextOutline,
  PlayCircleOutline,
  PlayOutline,
  SettingsOutline,
  SparklesOutline,
  AddOutline,
  RemoveOutline,
  CloseOutline,
  OptionsOutline,
  ChevronUpOutline,
  FlashOutline,
  MoveOutline,
  ResizeOutline,
  FlameOutline,
  // 使用其他图标代替不存在的图标
  CreateOutline,
  CodeDownloadOutline,
  ReturnUpBackOutline,
  ReturnUpForwardOutline,
  ChevronBackOutline,
  ChevronForwardOutline,
  ChevronDownOutline
} from '@vicons/ionicons5'
import AiChatArea from '@/views/ai/components/AiChatArea.vue'
import { useAiWorkshopStore } from '@/store/modules/aiWorkshop'
import { getProjectDetail, updateProject } from '@/api/project'

// 路由和状态
const route = useRoute()
const router = useRouter()
const message = useMessage()
const store = useAiWorkshopStore()
const projectId = route.params.id as string

// 文件信息
const fileName = ref('演示文稿1')
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
let saveTimer: ReturnType<typeof setTimeout> | null = null

// Ribbon 标签
const activeTab = ref('home')
const ribbonTabs = [
  { key: 'file', label: '文件' },
  { key: 'home', label: '开始' },
  { key: 'insert', label: '插入' },
  { key: 'design', label: '设计' },
  { key: 'transition', label: '切换' },
  { key: 'animation', label: '动画' },
  { key: 'slideshow', label: '幻灯片放映' }
]

// 字体设置
const selectedFont = ref('Microsoft YaHei')
const selectedFontSize = ref(24)
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)

const fontOptions = [
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '宋体', value: 'SimSun' },
  { label: '黑体', value: 'SimHei' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' }
]

const fontSizeOptions = [
  { label: '10', value: 10 },
  { label: '12', value: 12 },
  { label: '14', value: 14 },
  { label: '16', value: 16 },
  { label: '18', value: 18 },
  { label: '20', value: 20 },
  { label: '24', value: 24 },
  { label: '28', value: 28 },
  { label: '32', value: 32 },
  { label: '36', value: 36 },
  { label: '40', value: 40 },
  { label: '44', value: 44 },
  { label: '48', value: 48 }
]

// 主题
const currentTheme = ref('default')
const themes = [
  { key: 'default', name: '默认', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { key: 'business', name: '商务', preview: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
  { key: 'creative', name: '创意', preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { key: 'nature', name: '自然', preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { key: 'elegant', name: '优雅', preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { key: 'dark', name: '深色', preview: 'linear-gradient(135deg, #434343 0%, #000000 100%)' }
]

const variantColors = ['#d32f2f', '#c2185b', '#7b1fa2', '#512da8', '#303f9f', '#1976d2', '#0288d1', '#0097a7', '#00796b', '#388e3c', '#689f38', '#afb42b', '#fbc02d', '#ffa000', '#f57c00', '#e64a19']

// 切换效果
const currentTransition = ref('none')
const transitions = [
  { key: 'none', name: '无', icon: FlashOutline },
  { key: 'fade', name: '淡入', icon: FlameOutline },
  { key: 'push', name: '推进', icon: MoveOutline },
  { key: 'wipe', name: '擦除', icon: FlashOutline },
  { key: 'split', name: '分割', icon: ResizeOutline },
  { key: 'reveal', name: '揭开', icon: FlashOutline }
]

// 动画效果
const currentAnimation = ref('none')
const animations = [
  { key: 'none', name: '无', icon: FlashOutline },
  { key: 'appear', name: '出现', icon: FlashOutline },
  { key: 'fade', name: '淡出', icon: FlameOutline },
  { key: 'fly', name: '飞入', icon: MoveOutline },
  { key: 'float', name: '浮入', icon: FlashOutline },
  { key: 'split', name: '劈裂', icon: ResizeOutline },
  { key: 'wipe', name: '擦除', icon: FlashOutline },
  { key: 'shape', name: '形状', icon: FlashOutline }
]

// 幻灯片数据
interface Slide {
  id: string
  layout: string
  title?: string
  subtitle?: string
  content?: string
  notes?: string
  background?: string
}

const slides = ref<Slide[]>([
  {
    id: 'slide-1',
    layout: 'title',
    title: '欢迎使用',
    subtitle: '单击此处添加副标题',
    notes: ''
  }
])
const currentSlideIndex = ref(0)
const currentSlide = computed(() => slides.value[currentSlideIndex.value])

// 幻灯片版式
const currentLayout = computed(() => currentSlide.value?.layout || 'title')
const currentLayoutName = computed(() => {
  const layout = slideLayouts.find(l => l.key === currentLayout.value)
  return layout?.name || '标题幻灯片'
})

const slideLayouts = [
  { key: 'title', name: '标题幻灯片' },
  { key: 'title-content', name: '标题和内容' },
  { key: 'section', name: '节标题' },
  { key: 'two-content', name: '两栏内容' },
  { key: 'comparison', name: '比较' },
  { key: 'title-only', name: '仅标题' },
  { key: 'blank', name: '空白' },
  { key: 'content-caption', name: '内容和标题' },
  { key: 'picture-caption', name: '图片和标题' }
]

// 背景设置
const backgroundType = ref('solid')
const backgroundColors = ['#ffffff', '#f5f5f5', '#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575', '#424242', '#212121', '#ffebee', '#fce4ec', '#f3e5f5', '#ede7f6', '#e8eaf6', '#e3f2fd', '#e1f5fe', '#e0f7fa']

// 面板显示控制
const showPropertiesPanel = ref(true)
const showAiPanel = ref(false)

// 缩放
const zoomLevel = ref(100)

// AI 系统上下文
const aiSystemContext = computed(() => {
  const slideInfo = currentSlide.value
  return [
    '你是一个 PPT 演示文稿助手。',
    `当前正在编辑《${fileName.value}》的第 ${currentSlideIndex.value + 1} 页。`,
    '你可以帮助用户：',
    '1. 生成幻灯片内容大纲',
    '2. 优化标题和文案',
    '3. 提供设计建议',
    '4. 生成演讲者备注',
    '当前幻灯片内容：',
    `标题：${slideInfo?.title || '（无标题）'}`,
    `内容：${slideInfo?.content || '（无内容）'}`
  ].join('\n')
})

// 当前幻灯片备注
const currentSlideNotes = computed({
  get: () => currentSlide.value?.notes || '',
  set: (val: string) => {
    if (currentSlide.value) {
      currentSlide.value.notes = val
    }
  }
})

// 画布样式
const canvasStyle = computed(() => ({
  transform: `scale(${zoomLevel.value / 100})`,
  background: currentSlide.value?.background || '#ffffff'
}))

// 初始化
onMounted(async () => {
  // 尝试从 store 或后端加载项目数据
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
    fileName.value = project.name || '演示文稿1'
    // 尝试解析已有的幻灯片内容
    if (project.content) {
      try {
        const parsed = JSON.parse(project.content)
        if (Array.isArray(parsed.slides)) {
          slides.value = parsed.slides
        }
      } catch {
        // 如果解析失败，使用默认幻灯片
      }
    }
  }
})

// 方法
function handleBack() {
  router.back()
}

function handleSaveFileName() {
  handleContentChange()
}

function handleSave() {
  saveProject()
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

function handleContentChange() {
  saveStatus.value = 'unsaved'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveProject()
  }, 1000)
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
  } catch (error) {
    console.error('保存失败:', error)
    saveStatus.value = 'unsaved'
    message.warning('保存失败，请重试')
  }
}

// 幻灯片操作
function addSlide() {
  const newSlide: Slide = {
    id: `slide-${Date.now()}`,
    layout: 'title-content',
    title: '',
    content: ''
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
  if (slides.value.length <= 1) {
    message.warning('至少需要保留一张幻灯片')
    return
  }
  slides.value.splice(currentSlideIndex.value, 1)
  if (currentSlideIndex.value >= slides.value.length) {
    currentSlideIndex.value = slides.value.length - 1
  }
  handleContentChange()
}

function selectSlide(index: number) {
  currentSlideIndex.value = index
}

// 字体样式
function toggleBold() {
  isBold.value = !isBold.value
}

function toggleItalic() {
  isItalic.value = !isItalic.value
}

function toggleUnderline() {
  isUnderline.value = !isUnderline.value
}

function toggleAlign(align: string) {
  message.info(`文本对齐: ${align}`)
}

// 列表
function addBulletList() {
  message.info('添加项目符号列表')
}

function addNumberedList() {
  message.info('添加编号列表')
}

// 插入
function insertTable() {
  message.info('插入表格')
}

function insertImage() {
  message.info('插入图片')
}

function insertShape() {
  message.info('插入形状')
}

function insertIcon() {
  message.info('插入图标')
}

function insertTextBox() {
  message.info('插入文本框')
}

// 主题和设计
function applyTheme(theme: string) {
  currentTheme.value = theme
  message.success(`已应用主题: ${themes.find(t => t.key === theme)?.name}`)
}

function applyVariant(color: string) {
  message.info(`应用变体颜色: ${color}`)
}

// 切换和动画
function applyTransition(transition: string) {
  currentTransition.value = transition
  message.success(`已应用切换效果: ${transitions.find(t => t.key === transition)?.name}`)
}

function applyAnimation(animation: string) {
  currentAnimation.value = animation
  message.success(`已应用动画效果: ${animations.find(a => a.key === animation)?.name}`)
}

// 幻灯片放映
function startSlideshow() {
  message.info('从头开始放映')
}

function startSlideshowFromCurrent() {
  message.info('从当前幻灯片开始放映')
}

// 版式
function applyLayout(layout: string) {
  if (currentSlide.value) {
    currentSlide.value.layout = layout
    // 根据版式调整字段
    switch (layout) {
      case 'title':
        currentSlide.value.title = currentSlide.value.title || ''
        currentSlide.value.subtitle = currentSlide.value.subtitle || ''
        delete currentSlide.value.content
        break
      case 'title-content':
        currentSlide.value.title = currentSlide.value.title || ''
        currentSlide.value.content = currentSlide.value.content || ''
        delete currentSlide.value.subtitle
        break
      case 'title-only':
        currentSlide.value.title = currentSlide.value.title || ''
        delete currentSlide.value.subtitle
        delete currentSlide.value.content
        break
      case 'blank':
        delete currentSlide.value.title
        delete currentSlide.value.subtitle
        delete currentSlide.value.content
        break
      default:
        currentSlide.value.title = currentSlide.value.title || ''
        currentSlide.value.content = currentSlide.value.content || ''
    }
    handleContentChange()
  }
}

// 背景
function applyBackgroundColor(color: string) {
  if (currentSlide.value) {
    currentSlide.value.background = color
    handleContentChange()
  }
}

// 内容编辑
function updateTitle(event: Event) {
  if (currentSlide.value) {
    currentSlide.value.title = (event.target as HTMLElement).innerText
  }
}

function updateSubtitle(event: Event) {
  if (currentSlide.value) {
    currentSlide.value.subtitle = (event.target as HTMLElement).innerText
  }
}

function updateContent(event: Event) {
  if (currentSlide.value) {
    currentSlide.value.content = (event.target as HTMLElement).innerText
  }
}

function handleCanvasClick() {
  // 处理画布点击
}

function handleSaveNotes() {
  handleContentChange()
}

function handleAiInsert(payload: { code: string; lang: string }) {
  // 处理 AI 生成的内容
  if (currentSlide.value && payload.code) {
    try {
      const aiContent = JSON.parse(payload.code)
      if (aiContent.title) currentSlide.value.title = aiContent.title
      if (aiContent.content) currentSlide.value.content = aiContent.content
      handleContentChange()
      message.success('已应用 AI 生成的内容')
    } catch {
      // 如果不是 JSON，直接作为内容
      if (currentSlide.value) {
        currentSlide.value.content = payload.code
        handleContentChange()
      }
    }
  }
}

// 缩放
function zoomIn() {
  if (zoomLevel.value < 200) {
    zoomLevel.value += 10
  }
}

function zoomOut() {
  if (zoomLevel.value > 50) {
    zoomLevel.value -= 10
  }
}

// 面板控制
function togglePropertiesPanel() {
  showPropertiesPanel.value = !showPropertiesPanel.value
}

// 获取幻灯片样式
function getSlideStyle(slide: Slide) {
  return {
    background: slide.background || '#ffffff'
  }
}
</script>

<style scoped lang="scss">
.ppt-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: #f3f2f1;
  overflow: hidden;
}

// 标题栏
.ppt-title-bar {
  height: 48px;
  background: #ffffff;
  border-bottom: 1px solid #e1dfdd;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;

  .title-bar-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .back-btn {
      font-size: 18px;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .filename-input {
        width: 200px;
        font-size: 14px;
        font-weight: 600;

        :deep(.n-input__input) {
          padding: 4px 8px;
        }
      }
    }
  }

  .title-bar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

// Ribbon 工具栏
.ppt-ribbon {
  background: #ffffff;
  border-bottom: 1px solid #e1dfdd;
  flex-shrink: 0;

  .ribbon-tabs {
    display: flex;
    padding: 0 16px;
    border-bottom: 1px solid #e1dfdd;

    .ribbon-tab {
      padding: 8px 16px;
      font-size: 13px;
      color: #323130;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;

      &:hover {
        background: #f3f2f1;
      }

      &.active {
        color: #0078d4;
        border-bottom-color: #0078d4;
        font-weight: 600;
      }

      &:first-child {
        background: #0078d4;
        color: #ffffff;
        border-bottom-color: #0078d4;

        &:hover {
          background: #106ebe;
        }

        &.active {
          background: #0078d4;
        }
      }
    }
  }

  .ribbon-content {
    padding: 8px 16px;
    min-height: 80px;

    .ribbon-panel {
      display: flex;
      gap: 16px;
    }

    .ribbon-group {
      display: flex;
      flex-direction: column;
      border-right: 1px solid #e1dfdd;
      padding-right: 16px;

      &:last-child {
        border-right: none;
      }

      .ribbon-group-title {
        font-size: 11px;
        color: #605e5c;
        margin-bottom: 4px;
        text-align: center;
      }

      .ribbon-group-content {
        display: flex;
        gap: 4px;

        &.vertical {
          flex-direction: column;
          gap: 8px;

          .font-row {
            display: flex;
            gap: 4px;
            align-items: center;

            .font-select {
              width: 120px;
            }

            .size-select {
              width: 60px;
            }
          }
        }
      }

      .ribbon-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 4px 8px;
        border-radius: 4px;

        &:hover {
          background: #f3f2f1;
        }

        span {
          font-size: 11px;
        }
      }
    }
  }
}

// 主题网格
.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  .theme-item {
    width: 60px;
    height: 40px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: flex-end;
    padding: 4px;
    border: 2px solid transparent;

    &:hover {
      border-color: #0078d4;
    }

    &.active {
      border-color: #0078d4;
    }

    .theme-name {
      font-size: 10px;
      color: #ffffff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
  }
}

// 变体颜色
.variant-colors {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;

  .color-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    cursor: pointer;
    border: 1px solid rgba(0, 0, 0, 0.1);

    &:hover {
      transform: scale(1.2);
    }
  }
}

// 切换效果网格
.transition-grid,
.animation-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;

  .transition-item,
  .animation-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    border: 2px solid transparent;

    &:hover {
      background: #f3f2f1;
    }

    &.active {
      border-color: #0078d4;
      background: #f3f2f1;
    }

    .transition-preview,
    .animation-preview {
      width: 40px;
      height: 30px;
      background: #f3f2f1;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #605e5c;
    }

    .transition-name,
    .animation-name {
      font-size: 11px;
      color: #323130;
    }
  }
}

// 主体区域
.ppt-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// 左侧缩略图面板
.slide-thumbnail-panel {
  width: 200px;
  background: #f3f2f1;
  border-right: 1px solid #e1dfdd;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .thumbnail-header {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-bottom: 1px solid #e1dfdd;

    .thumbnail-title {
      font-size: 13px;
      font-weight: 600;
      color: #323130;
    }
  }

  .thumbnail-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;

    .thumbnail-item {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      cursor: pointer;

      &:hover {
        .thumbnail-preview {
          border-color: #0078d4;
        }
      }

      &.active {
        .thumbnail-preview {
          border-color: #0078d4;
          box-shadow: 0 0 0 2px #0078d4;
        }
      }

      .thumbnail-number {
        font-size: 12px;
        color: #605e5c;
        width: 20px;
        text-align: right;
        padding-top: 4px;
      }

      .thumbnail-preview {
        flex: 1;
        aspect-ratio: 16 / 9;
        background: #ffffff;
        border: 1px solid #e1dfdd;
        border-radius: 4px;
        overflow: hidden;
        padding: 8px;

        .slide-content-preview {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .preview-title {
            font-size: 8px;
            font-weight: 600;
            color: #323130;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .preview-content {
            font-size: 6px;
            color: #605e5c;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
        }
      }
    }
  }
}

// 中间编辑区
.slide-edit-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #e1dfdd;
  overflow: hidden;

  .slide-canvas-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    overflow: auto;

    .slide-canvas {
      width: 960px;
      height: 540px;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      position: relative;
      transform-origin: center center;
      transition: transform 0.2s;

      .slide-content {
        width: 100%;
        height: 100%;
        padding: 48px;
        display: flex;
        flex-direction: column;
        gap: 24px;

        .slide-title-area {
          font-size: 36px;
          font-weight: 600;
          color: #323130;
          outline: none;
          min-height: 48px;

          &:empty::before {
            content: '单击此处添加标题';
            color: #a19f9d;
          }
        }

        .slide-subtitle-area {
          font-size: 20px;
          color: #605e5c;
          outline: none;
          min-height: 28px;

          &:empty::before {
            content: '单击此处添加副标题';
            color: #a19f9d;
          }
        }

        .slide-body-area {
          flex: 1;
          font-size: 18px;
          color: #323130;
          outline: none;
          line-height: 1.6;

          &:empty::before {
            content: '单击此处添加内容';
            color: #a19f9d;
          }
        }
      }
    }
  }

  .slide-notes {
    height: 120px;
    background: #ffffff;
    border-top: 1px solid #e1dfdd;
    display: flex;
    flex-direction: column;

    .notes-header {
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background: #f3f2f1;
      font-size: 12px;
      font-weight: 600;
      color: #323130;
    }

    .notes-content {
      flex: 1;
      padding: 8px 16px;

      :deep(.n-input) {
        height: 100%;
      }
    }
  }
}

// 右侧属性面板
.properties-panel {
  width: 280px;
  background: #ffffff;
  border-left: 1px solid #e1dfdd;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .properties-header {
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-bottom: 1px solid #e1dfdd;
    font-size: 13px;
    font-weight: 600;
    color: #323130;
  }

  .properties-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;

    .property-group {
      margin-bottom: 16px;

      .property-label {
        font-size: 12px;
        color: #605e5c;
        margin-bottom: 8px;
      }

      .layout-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;

        .layout-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          border: 2px solid transparent;

          &:hover {
            background: #f3f2f1;
          }

          &.active {
            border-color: #0078d4;
          }

          .layout-preview {
            width: 60px;
            height: 40px;
            background: #f3f2f1;
            border-radius: 4px;
            padding: 4px;
            display: flex;
            flex-direction: column;
            gap: 2px;

            .layout-title-bar {
              height: 6px;
              background: #c8c6c4;
              border-radius: 1px;
            }

            .layout-content-area {
              flex: 1;
              background: #e1dfdd;
              border-radius: 1px;
            }
          }

          .layout-name {
            font-size: 11px;
            color: #323130;
          }
        }
      }

      .color-picker-row {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 4px;
        margin-top: 8px;

        .color-option {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid rgba(0, 0, 0, 0.1);

          &:hover {
            transform: scale(1.1);
          }
        }
      }
    }
  }
}

// AI 面板
.ai-panel {
  width: 340px;
  background: #ffffff;
  border-left: 1px solid #e1dfdd;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .ai-panel-header {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid #e1dfdd;
    background: #f9f9f9;

    .ai-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #0078d4;
    }
  }

  .ai-panel-content {
    flex: 1;
    overflow: hidden;
  }
}

// 底部状态栏
.ppt-status-bar {
  height: 32px;
  background: #0078d4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: #ffffff;
  font-size: 12px;
  flex-shrink: 0;

  .status-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .zoom-level {
      min-width: 40px;
      text-align: center;
    }
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .properties-panel {
    width: 240px;
  }
}

@media (max-width: 992px) {
  .slide-thumbnail-panel {
    width: 160px;
  }

  .properties-panel {
    display: none;
  }
}
</style>
