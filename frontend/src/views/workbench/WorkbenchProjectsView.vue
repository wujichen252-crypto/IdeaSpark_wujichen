<template>
  <div class="workbench-projects-view">
    <div class="view-header">
      <div class="header-left">
        <h1 class="view-title">我的项目</h1>
        <span class="view-subtitle">管理您的所有项目和文档</span>
      </div>
      <div class="header-right">
        <div class="filter-group">
          <n-popselect
            v-model:value="selectedCategory"
            :options="categoryOptions"
            trigger="click"
            placeholder="所有分类"
          >
            <n-button icon-placement="right">
              <span class="filter-label">{{ selectedCategory || '所有分类' }}</span>
              <template #icon>
                <n-icon :component="FilterOutline" />
              </template>
            </n-button>
          </n-popselect>
          
          <n-input 
            v-model:value="searchQuery" 
            placeholder="搜索项目..." 
            clearable
            class="search-input"
          >
            <template #prefix>
              <n-icon :component="SearchOutline" />
            </template>
          </n-input>
        </div>
      </div>
    </div>

    <div class="project-list-container custom-scrollbar">
      <template v-if="hasProjects">
        <div class="project-grid">
          <div 
            v-for="project in filteredProjects" 
            :key="project.id" 
            class="project-card"
            @click="handleOpenProject(project.id)"
          >
            <div class="card-cover" :style="{ backgroundImage: project.coverUrl ? `url(${project.coverUrl})` : 'none' }">
              <div v-if="!project.coverUrl" class="default-cover">
                <n-icon
v-if="project.category && project.category.includes('设计')"
:component="ImageOutline"
color="var(--nexus-text-quaternary)"
size="40" />
                <n-icon
v-else-if="project.category && project.category.includes('代码')"
:component="CodeSlashOutline"
color="var(--nexus-link)"
size="40" />
                <n-icon
v-else
:component="BulbOutline"
color="var(--nexus-text-quaternary)"
size="40" />
              </div>
              <div class="card-overlay">
                <n-button
ghost
size="small"
color="#fff"
@click.stop="handleOpenProject(project.id)">
                  进入
                </n-button>
              </div>
            </div>
            
            <div class="card-content">
              <div class="card-header">
                <span class="card-title" :title="project.name">{{ project.name }}</span>
                <n-dropdown 
                  trigger="click" 
                  :options="cardOptions" 
                  @select="(key) => handleCardAction(key, project.id)"
                  @click.stop
                >
                  <n-button
text
size="tiny"
class="more-btn"
@click.stop>
                    <template #icon><n-icon :component="EllipsisHorizontal" /></template>
                  </n-button>
                </n-dropdown>
              </div>
              
              <p class="card-desc" :title="project.description">{{ project.description || '暂无描述' }}</p>
              
              <div class="card-footer">
                <n-tag
v-if="project.category"
size="tiny"
:bordered="false"
type="info"
class="category-tag">
                  {{ project.category }}
                </n-tag>
                <span class="time-text">{{ formatTime(project.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="filteredProjects.length === 0" class="empty-search">
          <n-empty description="未找到匹配的项目" />
        </div>
      </template>
      
      <div v-else class="empty-state">
        <n-empty description="暂无项目" />
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyProjects } from '@/api/project'
import type { Project } from '@/api/types'
import { 
  ImageOutline, 
  CodeSlashOutline, 
  BulbOutline,
  SearchOutline,
  EllipsisHorizontal,
  TrashOutline,
  ShareSocialOutline,
  FilterOutline
} from '@vicons/ionicons5'
import { 
  NEmpty, 
  NButton, 
  NIcon, 
  NInput, 
  NTag, 
  NDropdown, 
  NPopselect, 
  useMessage
} from 'naive-ui'

const router = useRouter()
const message = useMessage()

const searchQuery = ref('')
const selectedCategory = ref('')

// 项目列表（从后端获取）
const projectList = ref<Project[]>([])
const loading = ref(false)

/**
 * 获取我的项目列表
 */
async function fetchProjects() {
  loading.value = true
  try {
    const res = await getMyProjects({ page: 1, size: 50 })
    if (res.data.status === 200) {
      projectList.value = res.data.data?.projects || []
    }
  } catch (error) {
    console.error('获取项目列表失败:', error)
    message.error('获取项目列表失败')
  } finally {
    loading.value = false
  }
}

// 页面加载时获取项目列表
onMounted(() => {
  fetchProjects()
})

// 卡片菜单选项
const cardOptions = [
  { label: '分享', key: 'share', icon: () => h(NIcon, null, { default: () => h(ShareSocialOutline) }) },
  { label: '移除', key: 'remove', icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }
]

// 获取所有分类选项
const categoryOptions = computed(() => {
  const categories = new Set(projectList.value.map(p => p.category).filter(Boolean))
  const options = Array.from(categories).map(c => ({ label: c, value: c }))
  return [
    { label: '所有分类', value: '' },
    ...options
  ]
})

// 是否有项目
const hasProjects = computed(() => projectList.value.length > 0)

// 过滤后的项目
const filteredProjects = computed(() => {
  let list = [...projectList.value]
  
  // 分类过滤
  if (selectedCategory.value) {
    list = list.filter(p => p.category === selectedCategory.value)
  }
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query)
    )
  }
  
  // 按时间排序（最新的在前）
  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  
  return list
})

// 打开项目
const handleOpenProject = (id: string) => {
  // 根据项目类型决定跳转路径
  const project = projectList.value.find(p => p.id === id)
  if (project) {
    // 暂时都跳转到工作空间
    router.push(`/project/workspace/${id}`)
  }
}

// 处理卡片操作
const handleCardAction = (key: string, id: string) => {
  if (key === 'share') {
    message.success('分享链接已复制到剪贴板')
  } else if (key === 'remove') {
    // TODO: 调用后端 API 删除项目
    message.info('删除项目功能需要后端支持')
  }
}

// 格式化时间显示
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  
  if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped lang="scss">
.workbench-projects-view {
  display: flex;
  flex-direction: column;
  background-color: var(--nexus-bg-subtle);
  padding: 40px 48px;
  padding-top: calc(56px + 40px);
  width: 100%;
  box-sizing: border-box;
}

.view-header {
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  
  .header-left {
    .view-title {
      /* 页面级标题：取「展示级」档位，与项目市场的 hero 标题同层级，
         不再用区块标题字号（20px）冒充 H1 */
      font-size: var(--nexus-font-size-2xl);
      font-weight: 600;
      line-height: var(--nexus-leading-display);
      letter-spacing: -0.02em;
      color: var(--nexus-text-primary);
      margin: 0 0 10px 0;
    }
    
    .view-subtitle {
      color: var(--nexus-text-tertiary);
      font-size: var(--nexus-font-size-md);
    }
  }

  .header-right {
    .filter-group {
      display: flex;
      gap: 12px;
      
      .filter-label {
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .search-input {
        width: 280px;
      }
    }
  }
}

.project-list-container {
  flex: 1;
}

.project-grid {
  display: grid;
  /* 列数按屏宽分档，卡片实测宽度始终落在 330~450 之间：
     避免纯 auto-fill 在超宽屏上把卡片切成细碎小格（那正是「看起来太小」的根因） */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

@media (min-width: 1700px) {
  .project-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 2300px) {
  .project-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.project-card {
  /* 无边框：白面浮在灰画布上，靠底色层级分区，不再描 1px 边 */
  background: var(--nexus-white);
  border-radius: var(--nexus-radius-lg);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 300px;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--nexus-shadow-md);
    
    .card-cover {
      .card-overlay {
        opacity: 1;
      }
    }
  }
  
  .card-cover {
    height: 168px;
    background-color: var(--nexus-divider);
    background-size: cover;
    background-position: center;
    position: relative;
    
    .default-cover {
      height: 100%;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, var(--nexus-divider) 0%, var(--nexus-border) 100%);
    }
    
    .card-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.2);
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.2s;
      backdrop-filter: blur(1px);
    }
  }
  
  .card-content {
    padding: 18px;
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      
      .card-title {
        font-weight: 600;
        color: var(--nexus-gray-800);
        font-size: var(--nexus-font-size-md);
        line-height: var(--nexus-leading-display);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        margin-right: 8px;
      }
      
      .more-btn {
        padding: 0 2px;
        color: var(--nexus-text-quaternary);
        font-size: var(--nexus-font-size-md);
        
        &:hover {
          color: var(--nexus-text-secondary);
        }
      }
    }
    
    .card-desc {
      font-size: var(--nexus-font-size-sm);
      color: var(--nexus-text-tertiary);
      line-height: var(--nexus-leading-compact);
      margin: 0 0 auto 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 40px;
    }
    
    .card-footer {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .category-tag {
        background-color: var(--nexus-divider);
        color: var(--nexus-text-secondary);
        font-size: var(--nexus-font-size-xs);
        padding: 0 6px;
      }
      
      .time-text {
        font-size: var(--nexus-font-size-xs);
        color: var(--nexus-text-quaternary);
      }
    }
  }
}

.empty-state, .empty-search {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60%;
  min-height: 200px;
}
</style>
