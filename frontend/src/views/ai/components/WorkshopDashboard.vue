<template>
  <div class="workshop-dashboard-wrapper">
    <div class="workshop-dashboard">
      <div class="dashboard-header">
        <div class="header-text">
          <h1>AI 创新工坊</h1>
          <p>
            从灵感到落地，全流程 AI 辅助创作平台
            <n-button
text
type="primary"
size="small"
@click="router.push('/ai/intro')">
              (了解更多)
            </n-button>
          </p>
        </div>
        <n-button
type="primary"
size="large"
class="create-btn"
@click="router.push('/ai/workshop/start')">
          <template #icon><n-icon><Add /></n-icon></template>
          创建新项目
        </n-button>
      </div>

      <!-- 统计概览 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="icon-box purple"><n-icon><RocketOutline /></n-icon></div>
          <div class="info">
            <div class="value">{{ totalProjects }}</div>
            <div class="label">进行中项目</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon-box blue"><n-icon><DocumentsOutline /></n-icon></div>
          <div class="info">
            <div class="value">{{ totalArtifacts }}</div>
            <div class="label">已生成产物</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon-box green"><n-icon><TimeOutline /></n-icon></div>
          <div class="info">
            <div class="value">{{ totalDuration }}</div>
            <div class="label">本周协作时长</div>
          </div>
        </div>
      </div>

      <!-- 项目列表 -->
      <div class="projects-section">
        <div class="section-header">
          <div class="header-tabs">
             <div 
               class="tab-item" 
               :class="{ active: activeTab === 'draft' }"
               @click="activeTab = 'draft'"
             >
               草稿箱 ({{ draftCount }})
             </div>
             <div 
               class="tab-item" 
               :class="{ active: activeTab === 'project' }"
               @click="activeTab = 'project'"
             >
               我的项目 ({{ activeProjectCount }})
             </div>
          </div>
          <div class="filters">
            <div class="left-filters">
              <n-input
v-model:value="searchQuery"
placeholder="搜索项目..."
clearable
class="search-input">
                <template #prefix><n-icon><Search /></n-icon></template>
              </n-input>
              <n-select v-model:value="sortBy" :options="sortOptions" class="sort-select" />
            </div>
            <n-radio-group v-model:value="filterType" size="medium">
              <n-radio-button value="all">全部</n-radio-button>
              <n-radio-button value="coding">软件研发</n-radio-button>
              <n-radio-button value="design">UI/UX设计</n-radio-button>
              <n-radio-button value="writing">产品/市场</n-radio-button>
            </n-radio-group>
          </div>
        </div>

        <div class="project-grid">
          <div 
            v-for="project in paginatedProjects" 
            :key="project.id" 
            class="project-card"
            @click="openProject(project.id)"
          >
            <div class="card-badges">
              <div class="badge visibility" :class="project.visibility || 'private'">
                {{ project.visibility === 'public' ? '公开' : '私有' }}
              </div>
              <div class="badge status" :class="project.currentModule">
                {{ formatModule(project.currentModule) }}
              </div>
            </div>
            
            <div class="card-actions" @click.stop>
              <n-dropdown trigger="click" :options="projectOptions" @select="(key) => handleAction(key, project)">
                <n-button text class="action-btn">
                  <n-icon size="20"><EllipsisVertical /></n-icon>
                </n-button>
              </n-dropdown>
            </div>

            <div class="card-icon" :class="getProjectType(project.category)">
              <n-icon v-if="getProjectType(project.category) === 'coding'"><CodeSlashOutline /></n-icon>
              <n-icon v-else-if="getProjectType(project.category) === 'design'"><ColorPaletteOutline /></n-icon>
              <n-icon v-else-if="getProjectType(project.category) === 'writing'"><CreateOutline /></n-icon>
              <n-icon v-else><BulbOutline /></n-icon>
            </div>
            <h3 class="card-title">{{ project.name }}</h3>
            <p class="card-desc">{{ project.description }}</p>
            <div class="card-footer">
              <span class="time">更新于 {{ formatTime(project.updatedAt) }}</span>
              <div class="progress-dots">
                <span 
                  v-for="(moduleKey, index) in store.moduleOrder" 
                  :key="moduleKey" 
                  class="dot"
                  :class="{ active: store.moduleOrder.indexOf(project.currentModule) >= index }"
                ></span>
              </div>
            </div>
          </div>

          <!-- 空状态占位 -->
          <div v-if="paginatedProjects.length === 0" class="empty-placeholder">
            <n-empty description="没有找到相关项目" />
          </div>
        </div>

        <div v-if="totalProjects > pageSize" class="pagination-container">
          <n-pagination
            v-model:page="page"
            :page-size="pageSize"
            :item-count="totalProjects"
            @update:page="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import { useAiWorkshopStore, type ProjectModule, type ProjectSummary } from '@/store/modules/aiWorkshop'
import { 
  Add, RocketOutline, DocumentsOutline, TimeOutline,
  CodeSlashOutline, ColorPaletteOutline, CreateOutline, BulbOutline,
  Search, EllipsisVertical, TrashOutline, SettingsOutline, CopyOutline
} from '@vicons/ionicons5'
import { useMessage, useDialog, NIcon } from 'naive-ui'

const router = useRouter()
const store = useAiWorkshopStore()
const message = useMessage()
const dialog = useDialog()

const activeTab = ref<'draft' | 'project'>('draft')
const draftCount = computed(() => store.projectList.filter(p => p.status === 'draft').length)
const activeProjectCount = computed(() => store.projectList.filter(p => p.status !== 'draft').length)

const filterType = ref('all')
const searchQuery = ref('')
const sortBy = ref('updated')
const page = ref(1)
const pageSize = ref(9)

const sortOptions = [
  { label: '最近更新', value: 'updated' },
  { label: '项目名称', value: 'name' },
  { label: '创建时间', value: 'created' },
  { label: '完成进度', value: 'progress' }
]

const processedProjects = computed(() => {
  let result = [...store.projectList]

  // 0. 状态筛选
  if (activeTab.value === 'draft') {
    result = result.filter(p => p.status === 'draft')
  } else {
    result = result.filter(p => p.status !== 'draft')
  }

  // 1. 分类筛选
  if (filterType.value !== 'all') {
    result = result.filter(p => {
      if (filterType.value === 'coding') return p.category.includes('代码') || p.category.includes('开发') || p.category.includes('研发') || p.category.includes('Full Stack') || p.category.includes('APP') || p.category.includes('小程序') || p.category.includes('SaaS')
      if (filterType.value === 'design') return p.category.includes('设计') || p.category.includes('UI') || p.category.includes('UX') || p.category.includes('Design')
      if (filterType.value === 'writing') return p.category.includes('文案') || p.category.includes('写作') || p.category.includes('策划') || p.category.includes('Product') || p.category.includes('市场') || p.category.includes('运营')
      return true
    })
  }

  // 2. 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
    )
  }

  // 3. 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'created':
        // 假设 id 包含时间戳或者有 createdAt 字段，这里暂时用 updatedAt 模拟
        return (b.updatedAt || 0) - (a.updatedAt || 0)
      case 'progress':
        return (b.progress || 0) - (a.progress || 0)
      case 'updated':
      default:
        return (b.updatedAt || 0) - (a.updatedAt || 0)
    }
  })

  return result
})

const paginatedProjects = computed(() => {
  const start = (page.value - 1) * pageSize.value
  const end = start + pageSize.value
  return processedProjects.value.slice(start, end)
})

const totalProjects = computed(() => processedProjects.value.length)

// 统计数据
const totalDuration = computed(() => {
  // 模拟计算：每个项目假设投入了一定时间，或者从 store 获取真实数据
  return (store.projectList.length * 2.5).toFixed(1) + 'h'
})

const totalArtifacts = computed(() => {
  // 模拟计算：每个项目产生的产物数量
  return store.projectList.reduce((acc, curr) => acc + (curr.status === 'active' ? 5 : 2), 0)
})

const handlePageChange = (p: number) => {
  page.value = p
}

type ProjectActionKey = 'delete' | 'edit' | 'clone'

const handleAction = (key: ProjectActionKey, project: ProjectSummary) => {
  if (key === 'delete') {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除项目 "${project.name}" 吗？此操作不可恢复。`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: () => {
        store.deleteProject(project.id)
        message.success('项目已删除')
      }
    })
  } else if (key === 'edit') {
    openProject(project.id)
  } else if (key === 'clone') {
    message.info('复制项目功能开发中...')
  }
}

const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const projectOptions = [
  { label: '打开项目', key: 'edit', icon: renderIcon(SettingsOutline) },
  { label: '复制副本', key: 'clone', icon: renderIcon(CopyOutline) },
  { type: 'divider', key: 'd1' },
  { label: '删除项目', key: 'delete', icon: renderIcon(TrashOutline), props: { style: 'color: #d03050' } }
]

const openProject = (id: string) => {
  console.log('Opening project:', id)
  try {
    store.initProject(id)
    const project = store.projectList.find(p => p.id === id)
    if (project?.status === 'draft') {
      router.push(`/ai/workshop/project/${id}/workbench`)
    } else {
      router.push(`/ai/workshop/project/${id}/manage`)
    }
  } catch (error) {
    console.error('Failed to open project:', error)
  }
}

const formatModule = (moduleKey: ProjectModule) => {
  const map: Record<ProjectModule, string> = {
    home: '项目概览',
    idea: '创意与需求',
    product: '产品方案',
    brand: '品牌与表达',
    ui: '视觉方向',
    feasibility: '可行性评估',
    docs: '文档中心'
  }
  return map[moduleKey] || moduleKey
}

const getProjectType = (category: string) => {
  if (category.includes('代码') || category.includes('开发') || category.includes('研发') || category.includes('Full Stack')) return 'coding'
  if (category.includes('设计') || category.includes('UI') || category.includes('UX') || category.includes('Design')) return 'design'
  if (category.includes('文案') || category.includes('写作') || category.includes('策划') || category.includes('Product') || category.includes('市场') || category.includes('运营')) return 'writing'
  return 'other'
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString()
}
</script>

<style scoped lang="scss">
.workshop-dashboard-wrapper {
  min-height: 100vh;
  width: 100%;
  background-color: #f5f7fa; /* 移动到最外层容器 */
  box-sizing: border-box;
}

.workshop-dashboard {
  padding: 88px 24px 24px;
  max-width: 1200px;
  margin: 0 auto;
  /* min-height: 100vh;  移除，由 wrapper 控制 */
  box-sizing: border-box;
  /* background-color: #f5f7fa; 移除 */
}

.header-tabs {
  display: flex;
  gap: 24px;
  margin-right: auto;
  
  .tab-item {
    font-size: 18px;
    font-weight: 600;
    color: #666;
    cursor: pointer;
    padding-bottom: 8px;
    position: relative;
    transition: all 0.3s;
    
    &.active {
      color: #18a058;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -24px; /* Align with header border */
        left: 0;
        width: 100%;
        height: 3px;
        background: #18a058;
        border-radius: 2px;
      }
    }
    
    &:hover {
      color: #18a058;
    }
  }
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  
  .header-text {
    h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      color: #1f2225;
    }
    
    p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 40px;
  
  .stat-card {
    background: #fff;
    padding: 24px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: transform 0.2s;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    .icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      
      &.purple { background: #f3e8ff; color: #9333ea; }
      &.blue { background: #e0f2fe; color: #0284c7; }
      &.green { background: #dcfce7; color: #16a34a; }
    }
    
    .info {
      .value {
        font-size: 24px;
        font-weight: 700;
        color: #1f2225;
        line-height: 1.2;
      }
      .label {
        font-size: 14px;
        color: #666;
        margin-top: 4px;
      }
    }
  }
}

.projects-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .filters {
      display: flex;
      align-items: center;
      gap: 24px;

      .left-filters {
        display: flex;
        align-items: center;
        gap: 12px;

        .search-input {
          width: 200px;
        }

        .sort-select {
          width: 120px;
        }
      }
    }
    
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  
  .project-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    border: 1px solid transparent;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
      border-color: #18a058;

      .card-actions {
        opacity: 1;
        pointer-events: auto;
      }
    }
    
    .card-actions {
      position: absolute;
      top: 16px;
      right: 12px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
      z-index: 10;
      
      .action-btn {
        padding: 4px;
        color: #999;
        
        &:hover {
          color: #333;
          background-color: rgba(0,0,0,0.05);
        }
      }
    }

    .card-badges {
      position: absolute;
      top: 16px;
      right: 48px;
      display: flex;
      gap: 8px;
    }

    .badge {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      background: #f5f7fa;
      color: #666;
      
      &.status.execute {
        background: #e0f2fe;
        color: #0284c7;
      }

      &.visibility {
        &.public {
          background: #d1fae5;
          color: #059669;
        }
        &.private {
          background: #f3f4f6;
          color: #6b7280;
        }
      }
    }
    
    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 16px;
      background: #f5f7fa;
      color: #666;
      
      &.coding { background: #e0f2fe; color: #0284c7; }
      &.design { background: #fce7f3; color: #db2777; }
      &.writing { background: #fef3c7; color: #d97706; }
    }
    
    .card-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2225;
    }
    
    .card-desc {
      margin: 0 0 20px 0;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .time {
        font-size: 12px;
        color: #999;
      }
      
      .progress-dots {
        display: flex;
        gap: 4px;
        
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #eee;
          
          &.active {
            background: #18a058;
          }
        }
      }
    }
  }
}

.empty-placeholder {
  grid-column: 1 / -1;
  padding: 48px 0;
}

.pagination-container {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}
</style>
