<template>
  <div class="my-projects-view">
    <header class="page-header">
      <div class="header-left">
        <h2 class="page-title">我的项目</h2>
        <span class="page-subtitle">管理你创建和参与的项目</span>
      </div>
      <div class="header-right">
        <button class="primary-btn" @click="$router.push('/create')">
          <Plus class="btn-icon" />
          新建项目
        </button>
      </div>
    </header>

    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <Loader2 class="loading-icon" />
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="retry-btn" @click="fetchMyProjects">重试</button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="projects.length === 0" class="empty-state">
        <FolderOpen class="empty-icon" />
        <h3>还没有项目</h3>
        <p>创建你的第一个项目，开启创新之旅</p>
        <button class="primary-btn" @click="$router.push('/create')">
          <Plus class="btn-icon" />
          创建项目
        </button>
      </div>

      <!-- 项目列表 -->
      <div v-else class="projects-grid">
        <div v-for="project in projects" :key="project.id" class="project-card">
          <div class="project-cover">
            <img :src="project.coverUrl || defaultCover" :alt="project.name" />
            <div class="project-overlay">
              <button class="action-btn" @click="editProject(project)">
                <Edit2 class="icon" />
              </button>
              <button class="action-btn" @click="deleteProject(project)">
                <Trash2 class="icon" />
              </button>
            </div>
          </div>
          <div class="project-info">
            <h3 class="project-name">{{ project.name }}</h3>
            <p class="project-desc">{{ project.description }}</p>
            <div class="project-meta">
              <span class="meta-item">
                <FolderOpen class="meta-icon" />
                {{ project.category }}
              </span>
              <span :class="['status-badge', project.status]">
                {{ getStatusText(project.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Edit2, Trash2, FolderOpen, Loader2 } from 'lucide-vue-next'
import { getMyProjects } from '@/api/project'
import type { Project } from '@/api/types'
import { useAppDialog } from '@/composables/useAppDialog'

const defaultCover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'

const projects = ref<Project[]>([])
const loading = ref(false)
const error = ref('')
const { confirm } = useAppDialog()

// 获取我的项目列表
async function fetchMyProjects() {
  loading.value = true
  error.value = ''
  try {
    const res = await getMyProjects({ page: 1, size: 100 })
    if (res.data.status === 200) {
      projects.value = res.data.data.projects || []
    } else {
      error.value = res.data.message || '获取项目列表失败'
    }
  } catch (err: any) {
    console.error('获取项目列表失败:', err)
    error.value = err.response?.data?.message || '获取项目列表失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    active: '进行中',
    draft: '草稿',
    completed: '已完成',
    archived: '已归档',
    ACTIVE: '进行中',
    INACTIVE: '已暂停',
    ARCHIVED: '已归档'
  }
  return statusMap[status] || status
}

function editProject(project: Project) {
  console.log('编辑项目:', project)
  // TODO: 跳转到项目编辑页面
}

async function deleteProject(project: Project) {
  if (await confirm(`确定要删除项目"${project.name}"吗？`)) {
    console.log('删除项目:', project)
    // TODO: 调用删除项目 API
  }
}

onMounted(() => {
  fetchMyProjects()
})
</script>

<style scoped lang="scss">
$color-gray-900: #111827;
$color-gray-700: #374151;
$color-gray-600: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-200: #e5e7eb;
$color-gray-100: #f3f4f6;
$color-success: #10b981;

.my-projects-view {
  min-height: 100vh;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(250, 250, 250, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: $color-gray-900;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: $color-gray-400;
}

.primary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #000;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  color: #fff;
  cursor: pointer;

  .btn-icon {
    width: 16px;
    height: 16px;
  }
}

.content-area {
  padding: 32px 32px 80px;
  max-width: 1280px;
  margin: 0 auto;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.project-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);

    .project-overlay {
      opacity: 1;
    }
  }
}

.project-cover {
  position: relative;
  height: 180px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.project-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #fff;
    transform: scale(1.1);
  }

  .icon {
    width: 18px;
    height: 18px;
    color: $color-gray-700;
  }
}

.project-info {
  padding: 20px;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: $color-gray-900;
  margin-bottom: 8px;
}

.project-desc {
  font-size: 14px;
  color: $color-gray-600;
  margin-bottom: 16px;
  line-height: 1.5;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: $color-gray-400;

  .meta-icon {
    width: 14px;
    height: 14px;
  }
}

.status-badge {
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;

  &.active, &.ACTIVE {
    background: rgba(16, 185, 129, 0.1);
    color: #15803d;
  }

  &.draft {
    background: $color-gray-100;
    color: $color-gray-600;
  }

  &.completed {
    background: rgba(59, 130, 246, 0.1);
    color: #1d4ed8;
  }

  &.INACTIVE, &.ARCHIVED {
    background: $color-gray-100;
    color: $color-gray-600;
  }
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;
  color: $color-gray-400;

  .loading-icon {
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 错误状态
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;
  color: $color-gray-600;

  .retry-btn {
    padding: 8px 24px;
    background: $color-gray-900;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: $color-gray-700;
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;

  .empty-icon {
    width: 64px;
    height: 64px;
    color: $color-gray-300;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $color-gray-900;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: $color-gray-400;
    margin-bottom: 24px;
  }

  .primary-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #000;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    color: #fff;
    cursor: pointer;

    .btn-icon {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
