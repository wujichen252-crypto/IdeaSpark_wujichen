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
color="#f59e0b"
size="32" />
                <n-icon
v-else-if="project.category && project.category.includes('代码')"
:component="CodeSlashOutline"
color="#3b82f6"
size="32" />
                <n-icon
v-else
:component="BulbOutline"
color="#10b981"
size="32" />
              </div>
              <div class="card-overlay">
                <n-button
ghost
size="tiny"
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
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f9fafb;
  padding: 24px 32px;
  padding-top: calc(56px + 24px);
  width: 100%;
  box-sizing: border-box;
}

.view-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  
  .header-left {
    .view-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px 0;
    }
    
    .view-subtitle {
      color: #6b7280;
      font-size: 13px;
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
        width: 240px;
      }
    }
  }
}

.project-list-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.project-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 200px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-color: #d1d5db;
    
    .card-cover {
      .card-overlay {
        opacity: 1;
      }
    }
  }
  
  .card-cover {
    height: 100px;
    background-color: #f3f4f6;
    background-size: cover;
    background-position: center;
    position: relative;
    
    .default-cover {
      height: 100%;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
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
    padding: 12px;
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
        color: #1f2937;
        font-size: 14px;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        margin-right: 8px;
      }
      
      .more-btn {
        padding: 0 2px;
        color: #9ca3af;
        font-size: 16px;
        
        &:hover {
          color: #4b5563;
        }
      }
    }
    
    .card-desc {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
      margin: 0 0 auto 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 34px;
    }
    
    .card-footer {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .category-tag {
        background-color: #f3f4f6;
        color: #4b5563;
        font-size: 11px;
        padding: 0 6px;
      }
      
      .time-text {
        font-size: 11px;
        color: #9ca3af;
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
