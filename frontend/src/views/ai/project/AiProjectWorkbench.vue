<template>
  <div class="ai-project-workbench">
    <!-- 顶部工具栏 (可选，如果觉得 Layout 的 Header 够了可以不加，这里加一个面包屑或者模块标题) -->
    
    <div class="workbench-container">
      <!-- 左侧：模块导航 (侧边栏) -->
      <div class="nav-sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
        <div class="sidebar-header">
          <div class="header-controls">
            <n-button
quaternary
circle
size="small"
@click="handleBackToList">
              <template #icon><n-icon><ArrowBackOutline /></n-icon></template>
            </n-button>
            <n-button text @click="isSidebarCollapsed = !isSidebarCollapsed">
              <template #icon>
                <n-icon size="20"><MenuOutline /></n-icon>
              </template>
            </n-button>
          </div>
          <span v-if="!isSidebarCollapsed" class="project-title">{{ projectInfo.name || '未命名项目' }}</span>
        </div>
        
        <div class="nav-menu">
          <n-menu 
            :options="menuOptions" 
            :value="currentModule" 
            :collapsed="isSidebarCollapsed"
            :collapsed-width="64"
            :collapsed-icon-size="24"
            @update:value="handleModuleChange"
          />
        </div>

        <div class="sidebar-footer">
          <n-button 
            v-if="!isSidebarCollapsed"
            block 
            quaternary
            class="settings-btn"
            @click="handleToSettings"
          >
            <template #icon><n-icon><SettingsOutline /></n-icon></template>
            项目设置
          </n-button>
          <n-button 
            v-else
            quaternary 
            circle
            @click="handleToSettings"
          >
             <template #icon><n-icon><SettingsOutline /></n-icon></template>
          </n-button>
        </div>
      </div>

      <!-- 中间与右侧：分割面板布局 -->
      <div ref="splitLayoutRef" class="split-layout">
<!-- 主工作区 -->
        <div class="main-panel" :style="{ flex: `1 1 0%` }">
          <div class="panel-header">
            <div class="module-info">
              <h3>{{ currentModuleData.label }}</h3>
              <span v-if="currentModuleData.description" class="desc">{{ currentModuleData.description }}</span>
            </div>
            <div class="header-actions">
               <n-button-group size="small">
                 <n-button secondary type="primary" @click="handleExport">
                    <template #icon><n-icon><DownloadOutline /></n-icon></template>
                    导出
                 </n-button>
               </n-button-group>
            </div>
          </div>
          
          <div class="panel-content workspace-content">
            <!-- 首页概览 -->
            <div v-if="currentModule === 'home'" class="dashboard-view">
              <!-- 项目基本信息卡片 -->
              <div class="project-header-card">
                <div class="ph-content">
                  <div class="ph-badge">
                    <n-tag
type="primary"
size="small"
round
bordered>
{{ projectInfo.category || '未分类' }}
</n-tag>
                    <n-tag
:type="projectInfo.status === 'completed' ? 'success' : 'info'"
size="small"
round
bordered
class="ml-2">
                      {{ projectInfo.status === 'completed' ? '已完成' : (projectInfo.status === 'draft' ? '草稿' : '进行中') }}
                    </n-tag>
                  </div>
                  <h1 class="ph-title">{{ projectInfo.name || '未命名项目' }}</h1>
                  <p class="ph-desc">{{ projectInfo.description || '暂无一句话介绍...' }}</p>
                </div>
              </div>

              <!-- 启动项目卡片 -->
              <div v-if="projectInfo.status === 'draft'" class="launch-section mt-6" style="margin-top: 24px;">
                <n-card>
                  <n-result status="info" title="准备好开始执行了吗？" description="完成构思后，将项目转入执行阶段，开启看板管理、团队协作等高级功能。">
                    <template #footer>
                      <n-button type="primary" size="large" @click="handleLaunchProject">
                        启动项目
                      </n-button>
                    </template>
                  </n-result>
                </n-card>
              </div>

              <div class="section mt-4">
                <h4>项目健康度</h4>
                <div class="health-grid">
                  <div class="health-card">
                    <div class="label">想法清晰度</div>
                    <n-progress
type="dashboard"
:percentage="85"
color="#18a058"
:size="100">
                      <template #default>
                        <div class="score">8.5</div>
                      </template>
                    </n-progress>
                    <div class="tips">AI 评价：核心痛点抓得很准</div>
                  </div>
                  <div class="health-card">
                    <div class="label">可执行性</div>
                    <n-progress
type="dashboard"
:percentage="60"
color="#2080f0"
:size="100">
                      <template #default>
                        <div class="score">6.0</div>
                      </template>
                    </n-progress>
                    <div class="tips">AI 评价：需补充具体推广方案</div>
                  </div>
                </div>
              </div>

              <div class="section mt-4">
                <h4>项目进度</h4>
                <n-steps :current="currentStepIndex" status="process">
                  <n-step title="创意" description="痛点与需求" />
                  <n-step title="产品" description="方案与MVP" />
                  <n-step title="品牌" description="定位与文案" />
                  <n-step title="交付" description="文档与汇报" />
                </n-steps>
              </div>
            </div>

            <!-- 模块视图 -->
            <div v-else class="module-view-wrapper h-full">
              <component 
                :is="currentModuleComponent" 
                v-if="currentModuleComponent" 
              />
              
              <!-- 通用模块视图 (Fallback) -->
              <div v-else class="module-view">
                <div class="checklist-section">
                  <div class="section-header">
                    <h4>核心行动清单</h4>
                    <n-tag type="info" size="small" round>AI 推荐</n-tag>
                  </div>
                  <n-list hoverable clickable>
                    <n-list-item v-for="task in currentModuleData.checklist" :key="task.id" @click="handleTaskClick(task)">
                      <template #prefix>
                        <n-checkbox :checked="task.completed" @update:checked="(v: boolean) => store.toggleChecklistItem(currentModule, task.id)" @click.stop />
                      </template>
                      <div class="task-content">
                        <span :class="{ 'completed': task.completed }">{{ task.label }}</span>
                      </div>
                      <template #suffix>
                        <n-button
size="tiny"
quaternary
circle
@click.stop="askAI(task)">
                          <template #icon><n-icon><ChatbubbleEllipsesOutline /></n-icon></template>
                        </n-button>
                      </template>
                    </n-list-item>
                  </n-list>
                </div>

                <div class="content-editor-section">
                  <div class="editor-header">
                    <h4>{{ currentEditorTitle }}</h4>
                  </div>
                  <n-input
                    type="textarea"
                    class="main-editor"
                    :placeholder="editorPlaceholder"
                    :value="editorContent"
                    @update:value="handleEditorUpdate"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 拖拽分割条 -->
        <div 
          class="resizer" 
          @mousedown="startResize"
        >
          <div class="resizer-handle"></div>
        </div>

        <!-- AI 助手面板 -->
        <div class="assistant-panel" :style="{ width: `${assistantWidth}px` }">
          <div class="panel-header">
            <div class="flex items-center gap-2">
              <n-icon color="#18a058"><Sparkles /></n-icon>
              <span>AI 团队</span>
              <n-tag
size="small"
type="success"
round
class="ml-2">
{{ currentAIRole }}
</n-tag>
            </div>
            <div class="header-actions">
              <!-- 宽屏切换按钮 -->
              <n-button
size="tiny"
quaternary
circle
@click="toggleWideMode">
                <template #icon>
                   <n-icon><component :is="isWideMode ? ResizeOutline : ExpandOutline" /></n-icon>
                </template>
              </n-button>
            </div>
          </div>
          <div class="chat-container">
            <AiChatArea 
              ref="chatAreaRef"
              :session-id="currentProjectId || 'workbench'" 
              mode="full" 
              :system-context="currentSystemContext"
              fluid
            />
          </div>
        </div>
</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted, onUnmounted, watch } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAiWorkshopStore, type ProjectModule, type StageChecklistItem } from '@/store/modules/aiWorkshop'
import { 
  Sparkles, ChatbubbleEllipsesOutline, HomeOutline, BulbOutline, 
  ConstructOutline, MegaphoneOutline, ColorPaletteOutline, 
  DocumentTextOutline, WarningOutline, MenuOutline,
  DownloadOutline, ResizeOutline, ExpandOutline,
  ArrowBackOutline, SettingsOutline
} from '@vicons/ionicons5'
import { NIcon, useMessage } from 'naive-ui'
import AiChatArea from '../components/AiChatArea.vue'
import IdeaModule from './modules/IdeaModule.vue'
import ProductModule from './modules/ProductModule.vue'
import BrandModule from './modules/BrandModule.vue'
import UiModule from './modules/UiModule.vue'
import FeasibilityModule from './modules/FeasibilityModule.vue'
import DocsModule from './modules/DocsModule.vue'

const route = useRoute()
const router = useRouter()
const store = useAiWorkshopStore()
const { currentModuleData, currentProjectId, projectInfo, currentModule } = storeToRefs(store)
const message = useMessage()

const chatAreaRef = ref()
const isSidebarCollapsed = ref(false)

const handleBackToList = () => {
  router.push('/ai/workshop')
}

const handleToSettings = () => {
  router.push({
    name: 'AiProjectSettings',
    params: { id: currentProjectId.value }
  })
}

const handleLaunchProject = () => {
  store.activateProject()
  message.success('项目已启动，进入执行阶段')
  router.push(`/ai/workshop/project/${currentProjectId.value}/manage`)
}

const assistantWidth = ref(450) // 默认 AI 窗口宽度
const isWideMode = ref(false)
const lastWidth = ref(450)

const currentModuleComponent = computed(() => {
  switch (currentModule.value) {
    case 'idea': return IdeaModule
    case 'product': return ProductModule
    case 'brand': return BrandModule
    case 'ui': return UiModule
    case 'feasibility': return FeasibilityModule
    case 'docs': return DocsModule
    default: return null
  }
})

// --- 路由与状态同步 ---
// 1. 路由变化 -> 更新 Store
watch(
  () => route.params.module,
  (newModule) => {
    if (newModule && typeof newModule === 'string') {
      if (store.modules[newModule as ProjectModule]) {
        store.currentModule = newModule as ProjectModule
      }
    }
  },
  { immediate: true }
)

// 2. Store 变化 -> 更新路由
const handleModuleChange = (key: string) => {
  store.currentModule = key as ProjectModule
  router.replace({ 
    name: 'AiProjectWorkbench', 
    params: { 
      id: currentProjectId.value,
      module: key 
    } 
  })
}

// --- 拖拽调整大小逻辑 ---
const splitLayoutRef = ref<HTMLElement | null>(null)
const isResizing = ref(false)

const startResize = () => {
  isResizing.value = true
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value || !splitLayoutRef.value) return
  
  const containerRect = splitLayoutRef.value.getBoundingClientRect()
  const newWidth = containerRect.right - e.clientX
  
  // 限制最小宽度和最大宽度
  if (newWidth > 300 && newWidth < containerRect.width - 300) {
    assistantWidth.value = newWidth
    // 如果在手动调整，取消宽屏模式标记，但不一定非要重置
    if (isWideMode.value && newWidth < 600) isWideMode.value = false
  }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

const toggleWideMode = () => {
  isWideMode.value = !isWideMode.value
  if (isWideMode.value) {
    lastWidth.value = assistantWidth.value
    // 设置为容器宽度的 50% 或固定大宽
    const containerWidth = splitLayoutRef.value?.clientWidth || 1200
    assistantWidth.value = Math.max(600, containerWidth * 0.5)
  } else {
    assistantWidth.value = lastWidth.value
  }
}

// --- 事件监听 ---
const handleAiPrompt = (e: Event) => {
  const customEvent = e as CustomEvent
  if (chatAreaRef.value && customEvent.detail) {
    chatAreaRef.value.handleSend(customEvent.detail)
  }
}

onMounted(() => {
  window.addEventListener('ai-prompt', handleAiPrompt)
  
  // Mobile adaptation: auto-collapse sidebar and set narrow mode
  if (window.innerWidth < 768) {
    isSidebarCollapsed.value = true
    // Assistant panel will be stacked, so width doesn't matter as much, 
    // but we can set it to a reasonable height if we were controlling height.
    // CSS will handle the layout change.
  }
})

onUnmounted(() => {
  window.removeEventListener('ai-prompt', handleAiPrompt)
})

// 导航菜单配置
function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = [
  { label: '项目首页', key: 'home', icon: renderIcon(HomeOutline) },
  { label: '创意与需求', key: 'idea', icon: renderIcon(BulbOutline) },
  { label: '产品方案', key: 'product', icon: renderIcon(ConstructOutline) },
  { label: '品牌与表达', key: 'brand', icon: renderIcon(MegaphoneOutline) },
  { label: '视觉方向', key: 'ui', icon: renderIcon(ColorPaletteOutline) },
  { label: '可行性评估', key: 'feasibility', icon: renderIcon(WarningOutline) },
  { label: '文档中心', key: 'docs', icon: renderIcon(DocumentTextOutline) }
]

// 进度条索引
const currentStepIndex = computed(() => {
  const map: Record<string, number> = { home: 0, idea: 0, product: 1, brand: 2, ui: 2, feasibility: 3, docs: 3 }
  return map[currentModule.value] || 0
})

// AI 角色与上下文
const currentAIRole = computed(() => {
  const roles: Record<string, string> = {
    home: '项目经理',
    idea: '产品经理',
    product: '架构师',
    brand: '营销专家',
    ui: '设计总监',
    feasibility: '商业顾问',
    docs: '技术作家'
  }
  return roles[currentModule.value] || 'AI 助手'
})

const currentSystemContext = computed(() => {
  return `你现在的角色是${currentAIRole.value}。
当前项目阶段：${currentModuleData.value.label}。
任务说明：${currentModuleData.value.description}。
请只提供策略、建议、文案或方案，绝对不要生成代码。`
})

// 编辑器相关
const editorContent = ref('')
const handleEditorUpdate = (v: string) => { editorContent.value = v }

const currentEditorTitle = computed(() => {
  const titles: Record<string, string> = {
    idea: '需求分析草稿',
    product: '功能设计草稿',
    brand: '文案构思',
    ui: '视觉风格描述',
    feasibility: '风险评估笔记',
    docs: '文档内容'
  }
  return titles[currentModule.value] || '笔记'
})

const editorPlaceholder = computed(() => {
  if (currentModule.value === 'idea') return '在这里记录用户痛点、核心需求...'
  if (currentModule.value === 'product') return '在这里规划功能模块、用户流程...'
  if (currentModule.value === 'brand') return '在这里构思 Slogan、品牌故事...'
  return '在这里记录你的想法...'
})

// 交互操作
const handleTaskClick = (task: StageChecklistItem) => {
  console.log('Task clicked:', task)
}

const askAI = (task: StageChecklistItem) => {
  console.log('Ask AI about:', task.label)
}

const handleExport = () => {
  console.log('Exporting document...')
}
</script>

<style scoped lang="scss">
.ai-project-workbench {
  height: 100%;
  background-color: #f5f7fa;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.workbench-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧侧边栏 */
.nav-sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #eef0f5;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative; /* 为绝对定位的 header 提供锚点 */
  
  &.collapsed {
    width: 64px;
    
    .project-title {
      display: none;
    }
  }

  .sidebar-header {
    position: absolute; /* 悬浮定位 */
    top: 0;
    left: 0;
    width: 100%;
    z-index: 10;
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    background: rgba(155, 158, 240, 0.9); /* #9B9EF0 半透明 */
    backdrop-filter: blur(20px);          /* 毛玻璃效果 */
    gap: 8px;
    
    .project-title {
      font-weight: 600;
      font-size: 14px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
  
  .nav-menu {
    flex: 1;
    overflow-y: auto;
    padding-top: 60px; /* 为悬浮 header 留出空间 */
  }

  .sidebar-footer {
    padding: 12px;
    border-top: 1px solid #f5f7fa;
    display: flex;
    justify-content: center;
    
    .settings-btn {
      justify-content: flex-start;
    }
  }
}

/* 分割布局 */
.split-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* 主面板 */
.main-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  min-width: 300px;
  position: relative; /* 为绝对定位的 header 提供锚点 */
  
  .panel-header {
    position: absolute; /* 悬浮定位 */
    top: 0;
    left: 0;
    width: 100%;
    z-index: 10;
    height: 60px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    background: rgba(155, 158, 240, 0.9); /* #9B9EF0 半透明 */
    backdrop-filter: blur(20px);          /* 毛玻璃效果 */
    
    .module-info {
      h3 {
        margin: 0;
        font-size: 16px;
        color: #333;
        margin-bottom: 4px;
      }
      .desc {
        font-size: 12px;
        color: #666;
      }
    }
  }
  
  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    padding-top: 84px; /* 60px header + 24px padding */
    
    &.workspace-content {
      background-color: #f5f7fa;
    }

    .module-view-wrapper {
      height: 100%;
    }
  }
}

/* 拖拽条 */
.resizer {
  width: 1px;
  background: #eef0f5;
  cursor: col-resize;
  position: relative;
  z-index: 10;
  transition: background 0.2s;
  
  &:hover, &:active {
    background: #18a058;
    
    .resizer-handle {
      background: #18a058;
      border-color: #fff;
    }
  }
  
  .resizer-handle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    background: #fff;
    border: 1px solid #eef0f5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    pointer-events: none; // Let click pass through to parent
    
    &::after {
      content: '';
      width: 4px;
      height: 4px;
      background: #ccc;
      border-radius: 50%;
    }
  }
}

/* AI 助手面板 */
.assistant-panel {
  background: #fff;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #eef0f5;
  min-width: 300px;
  position: relative; /* 为绝对定位的 header 提供锚点 */
  
  .panel-header {
    position: absolute; /* 悬浮定位 */
    top: 0;
    left: 0;
    width: 100%;
    z-index: 10;
    height: 60px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    background: rgba(230, 244, 254, 0.9); /* #E6F4FE 半透明 */
    backdrop-filter: blur(20px);          /* 毛玻璃效果 */
  }
  
  .chat-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    padding-top: 76px; /* 60px header + 16px padding */
  }
}

/* 通用样式 (健康度等) */
.dashboard-view {
  max-width: 900px;
  margin: 0 auto;
  
  .project-header-card {
    background: white;
    border-radius: 8px;
    padding: 24px;
    border: 1px solid #eef0f5;
    margin-bottom: 24px;
    
    .ph-badge {
      margin-bottom: 12px;
    }
    
    .ph-title {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #1f2225;
    }
    
    .ph-desc {
      margin: 0;
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }
  }

  .section {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #eef0f5;
    
    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #333;
    }
  }
  
  .health-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    
    .health-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      background: #fafbfc;
      border-radius: 8px;
      
      .label {
        font-size: 14px;
        color: #666;
        margin-bottom: 12px;
      }
      
      .score {
        font-size: 20px;
        font-weight: bold;
        color: #333;
      }
      
      .tips {
        margin-top: 12px;
        font-size: 12px;
        color: #999;
        text-align: center;
      }
    }
  }
}

.module-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .checklist-section {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      
      h4 {
        margin: 0;
        font-size: 14px;
      }
    }
    
    .completed {
      text-decoration: line-through;
      color: #aaa;
    }
  }
  
  .content-editor-section {
    flex: 1;
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    
    .editor-header {
      margin-bottom: 12px;
      h4 {
        margin: 0;
        font-size: 14px;
      }
    }
    
    .main-editor {
      flex: 1;
      :deep(textarea) {
        height: 100%;
        resize: none;
        border: none;
        padding: 0;
        &:focus {
          box-shadow: none;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .nav-sidebar {
    position: absolute;
    z-index: 100;
    height: 100%;
    box-shadow: 2px 0 8px rgba(0,0,0,0.1);
    
    /* Keep collapsed width at 64px so toggle is visible */
    &.collapsed {
      width: 64px;
    }
    
    &:not(.collapsed) {
      width: 240px;
    }
  }

  .split-layout {
    flex-direction: column;
    padding-left: 64px; /* Make room for the collapsed sidebar */
  }

  .resizer {
    display: none;
  }

  .assistant-panel {
    width: 100% !important;
    border-left: none;
    border-top: 1px solid #eef0f5;
    flex: 1;
    min-height: 400px;
    min-width: 0;
  }
  
  .main-panel {
    flex: none;
    height: auto;
    min-height: 50vh;
    min-width: 0;
  }
}
</style>
