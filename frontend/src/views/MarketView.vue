<template>
  <div class="market-view">
    <!-- 全局噪点纹理 -->
    <div class="grain-overlay"></div>

    <!-- 页面标题区 -->
    <header class="page-hero">
      <div class="hero-inner">
        <p class="hero-subtitle">Project Market</p>
        <h1 class="hero-title">
          发现下一个<br/>
          <span class="hero-title-accent">非凡项目</span>
        </h1>
        <p class="hero-description">
          精心策划的创新项目集合，连接 visionary 创作者与前瞻性投资者
        </p>
      </div>
    </header>

    <!-- 筛选栏 - 玻璃拟态 -->
    <div class="filter-bar">
      <div class="filter-inner">
        <!-- 分类标签 -->
        <div class="category-pills">
          <button
            v-for="cat in categories"
            :key="cat.value"
            :class="['pill-btn', { active: category === cat.value }]"
            @click="selectCategory(cat.value)"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- 搜索和排序 -->
        <div class="filter-tools">
          <div class="search-box">
            <Search class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索项目..."
              @keyup.enter="handleSearch"
            />
          </div>
          <!-- 自定义排序下拉菜单 -->
          <div class="custom-sort-dropdown" ref="sortDropdownRef">
            <button
              class="sort-trigger"
              :class="{ 'is-open': isSortDropdownOpen }"
              @click="toggleSortDropdown"
            >
              <span class="sort-label">{{ currentSortLabel }}</span>
              <ChevronDown class="sort-arrow" :class="{ 'is-open': isSortDropdownOpen }" />
            </button>
            <Transition name="dropdown">
              <div v-show="isSortDropdownOpen" class="sort-dropdown-menu">
                <div
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  :class="['sort-option', { active: sort === opt.value }]"
                  @click="selectSort(opt.value)"
                >
                  <span class="option-label">{{ opt.label }}</span>
                  <Check v-if="sort === opt.value" class="option-check" />
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- 主体内容 -->
    <main class="main-content">
      <!-- 统计 -->
      <div class="content-header">
        <span class="total-count">{{ totalCount }} 个精选项目</span>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="loadError" class="empty-state error-state">
        <div class="empty-icon">
          <FolderOpen />
        </div>
        <h3>加载失败</h3>
        <p>{{ loadError }}</p>
        <button class="retry-btn" @click="loadProjects">重试</button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="projects.length === 0" class="empty-state">
        <div class="empty-icon">
          <FolderOpen />
        </div>
        <h3>还没有公开项目</h3>
        <p>这里会展示创作者们分享的公开项目</p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
          你可以调整筛选条件，或者成为第一个分享项目的人
        </p>
        <div style="margin-top: 16px; display: flex; gap: 12px;">
          <button class="retry-btn" @click="loadProjects">刷新</button>
          <button class="retry-btn secondary" @click="resetFilters">重置筛选</button>
        </div>
      </div>

      <!-- 项目网格 -->
      <div v-else class="projects-grid">
        <article
          v-for="(project, index) in projects"
          :key="index"
          class="project-card"
          :style="{ animationDelay: `${index * 0.1}s` }"
          @click="goToProject(project)"
        >
          <!-- 封面图 -->
          <div class="card-image-wrap">
            <img
              :src="project.projectImage || getDefaultCover(project.projectName)"
              :alt="project.projectName"
              class="card-image"
              loading="lazy"
            />
            <div class="card-image-overlay">
              <span class="view-hint">
                查看详情
                <ArrowUpRight class="view-icon" />
              </span>
            </div>
            <span class="category-badge">{{ project.tags?.[0] || '项目' }}</span>
          </div>

          <!-- 内容 -->
          <div class="card-content">
            <h3 class="card-title">{{ project.projectName }}</h3>
            <p class="card-desc">{{ project.ownerName }} 的项目</p>

            <!-- 作者信息 -->
            <div class="card-author" @click="goToUser(project.ownerId)">
              <img
                :src="project.ownerAvatar || getDefaultAvatar(project.ownerName)"
                :alt="project.ownerName"
                class="author-avatar"
              />
              <span class="author-name">{{ project.ownerName || '匿名' }}</span>
            </div>

            <!-- 统计 -->
            <div class="card-stats">
              <span class="stat-item" @click.stop="toggleFavorite(project)">
                <Heart class="stat-icon" :class="{ liked: isProjectLiked(project.projectId) }" />
                {{ formatNumber(project.likeCount) }}
              </span>
            </div>
          </div>
        </article>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          :disabled="page === 1"
          class="page-btn"
          @click="handlePageChange(page - 1)"
        >
          <ChevronLeft />
        </button>
        <div class="page-numbers">
          <button
            v-for="p in displayedPages"
            :key="p"
            :class="['page-number', { active: page === p }]"
            @click="handlePageChange(p)"
          >
            {{ p }}
          </button>
        </div>
        <button
          :disabled="page === totalPages"
          class="page-btn"
          @click="handlePageChange(page + 1)"
        >
          <ChevronRight />
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Ref, ComputedRef } from 'vue'
import { getOtherUserAvatar } from '@/utils/avatar'
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Eye,
  ArrowUpRight,
  FolderOpen,
  Check
} from 'lucide-vue-next'
import { getProjectList } from '@/api/market'
import { likeProject, unlikeProject, checkLiked } from '@/api/project'
import { useAppDialog } from '@/composables/useAppDialog'
import { useUserStore } from '@/store'
import type { MarketProject } from '@/api/market'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { showWarning } = useAppDialog()

// ==================== 状态管理 ====================

/** 搜索关键词 */
const searchQuery: Ref<string> = ref('')
/** 当前分类 */
const category: Ref<string> = ref('all')
/** 排序方式 */
const sort: Ref<string> = ref('newest')
/** 当前页码 */
const page: Ref<number> = ref(1)
/** 每页数量 */
const pageSize: Ref<number> = ref(12)
/** 加载状态 */
const loading: Ref<boolean> = ref(false)
/** 加载错误信息 */
const loadError: Ref<string> = ref('')
/** 项目列表 */
const projects: Ref<MarketProject[]> = ref([])
/** 项目总数 */
const totalCount: Ref<number> = ref(0)
/** 排序下拉菜单是否打开 */
const isSortDropdownOpen: Ref<boolean> = ref(false)
/** 排序下拉菜单引用 */
const sortDropdownRef: Ref<HTMLElement | null> = ref(null)
/** 已点赞的项目ID集合 */
const likedProjectIds: Ref<Set<string>> = ref(new Set())

// ==================== 常量定义 ====================

/** 分类选项 */
const categories = [
  { label: '全部项目', value: 'all' },
  { label: '科技创新', value: 'frontend' },
  { label: '设计创意', value: 'design' },
  { label: '人工智能', value: 'ai' },
  { label: '移动开发', value: 'mobile' },
  { label: '后端服务', value: 'backend' }
]

/** 排序选项 */
const sortOptions = [
  { label: '最新发布', value: 'newest' },
  { label: '最多关注', value: 'likes' },
  { label: '最多浏览', value: 'views' }
]

// ==================== 计算属性 ====================

/**
 * 计算总页数
 */
const totalPages: ComputedRef<number> = computed(() => Math.ceil(totalCount.value / pageSize.value))

/**
 * 计算当前排序标签
 */
const currentSortLabel: ComputedRef<string> = computed(() => {
  const option = sortOptions.find(opt => opt.value === sort.value)
  return option?.label || '最新发布'
})

/**
 * 计算显示的页码范围
 */
const displayedPages: ComputedRef<number[]> = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, page.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// ==================== 工具函数 ====================

/**
 * 获取默认项目封面
 * @param name - 项目名称
 * @returns 封面图片URL
 */
function getDefaultCover(name: string | undefined): string {
  const colors = ['1a1a2e', '16213e', '0f3460', '533483', '1e3a5f']
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0
  const color = colors[colorIndex]
  return `https://placehold.co/600x400/${color}/ffffff?text=${encodeURIComponent('Project')}`
}

/**
 * 获取默认用户头像
 * @param username - 用户名
 * @returns 头像图片 URL
 */
function getDefaultAvatar(username?: string): string {
  return getOtherUserAvatar(undefined, undefined, username)
}

/**
 * 格式化数字显示
 * @param num - 数字
 * @returns 格式化后的字符串
 */
function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// ==================== 数据加载 ====================

/**
 * 加载项目列表数据
 * @returns Promise<void>
 */
async function loadProjects(): Promise<void> {
  console.log('[项目市场] loadProjects 开始执行')
  loading.value = true
  loadError.value = ''
  try {
    const params: Record<string, unknown> = {
      page: page.value,
      size: pageSize.value
    }
    if (searchQuery.value.trim()) {
      params.keyword = searchQuery.value.trim()
    }
    if (category.value !== 'all') {
      params.category = category.value
    }

    console.log('[项目市场] 请求参数:', params)
    const res = await getProjectList(params)
    console.log('[项目市场] 完整响应:', res)
    console.log('[项目市场] res.data:', res.data)
    console.log('[项目市场] res.data 类型:', typeof res.data)
    
    // 检查 res.data 的结构
    if (!res.data) {
      console.error('[项目市场] res.data 为空')
      projects.value = []
      totalCount.value = 0
      return
    }
    
    // 将响应数据转为 any 类型以便灵活处理不同结构
    const responseData: any = res.data
    
    // 如果 res.data 直接包含 projects，说明后端没有包装 ApiResponse
    if (responseData.projects && Array.isArray(responseData.projects)) {
      console.log('[项目市场] 检测到直接返回的项目列表')
      projects.value = normalizeProjects(responseData.projects)
      totalCount.value = responseData.total || 0
      // 加载已点赞状态
      loadLikedStatus()
      return
    }
    
    // 标准 ApiResponse 结构
    const data: any = responseData.data
    console.log('[项目市场] res.data.data:', data)
    
    if (!data) {
      console.error('[项目市场] res.data.data 为空')
      projects.value = []
      totalCount.value = 0
      return
    }
    
    // 处理可能的不同字段名（content 或 projects）
    let projectList: any[] = []
    if (Array.isArray(data.projects)) {
      projectList = data.projects
    } else if (Array.isArray(data.content)) {
      projectList = data.content
    }
    
    console.log('[项目市场] 原始项目列表:', projectList)
    
    projects.value = normalizeProjects(projectList)
    totalCount.value = data.total || data.totalElements || 0

    // 加载已点赞状态
    loadLikedStatus()

    console.log('[项目市场] 处理后的 projects.value:', projects.value)
    console.log('[项目市场] totalCount:', totalCount.value)
  } catch (err: any) {
    console.error('[项目市场] 加载项目列表失败:', err)
    console.error('[项目市场] 错误响应:', err.response?.data)
    loadError.value = err.message || '网络请求失败，请检查网络连接'
    projects.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
    console.log('[项目市场] loadProjects 执行完成, projects:', projects.value)
  }
}

/**
 * 标准化项目数据
 * 将后端返回的数据映射为前端需要的格式
 * @param list - 原始项目列表
 * @returns 标准化后的项目列表
 */
function normalizeProjects(list: any[]): MarketProject[] {
  if (!Array.isArray(list)) {
    console.warn('[项目市场] normalizeProjects 接收到非数组:', list)
    return []
  }
  
  return list.map((item: any, index: number) => {
    console.log(`[项目市场] 处理第 ${index} 个项目:`, item)
    
    // 处理字段映射，兼容不同命名风格
    const project: MarketProject = {
      projectId: item.projectId || item.id || item.project_id || '',
      projectName: item.projectName || item.name || item.project_name || '未命名项目',
      projectImage: item.projectImage || item.coverUrl || item.cover_url || item.image || '',
      ownerId: item.ownerId || item.owner_id || item.owner?.id || undefined,
      ownerName: item.ownerName || item.owner_name || item.owner?.username || item.owner?.name || '匿名用户',
      ownerAvatar: item.ownerAvatar || item.owner_avatar || item.owner?.avatar || '',
      likeCount: Number(item.likeCount || item.like_count || item.likes || 0),
      tags: Array.isArray(item.tags) ? item.tags : 
            (typeof item.tags === 'string' ? [item.tags] : [])
    }
    
    console.log(`[项目市场] 第 ${index} 个项目处理后:`, project)
    return project
  })
}

// ==================== 事件处理 ====================

/**
 * 跳转到用户主页
 * @param userId - 用户ID
 */
function goToUser(userId?: number): void {
  if (!userId) return
  router.push(`/user/${userId}`)
}

/**
 * 处理搜索
 * @returns void
 */
function handleSearch(): void {
  page.value = 1
  loadProjects()
}

/**
 * 选择分类
 * @param cat - 分类值
 * @returns void
 */
function selectCategory(cat: string): void {
  category.value = cat
  page.value = 1
  loadProjects()
}

/**
 * 处理排序变化
 * @returns void
 */
function handleSortChange(): void {
  page.value = 1
  loadProjects()
}

/**
 * 切换排序下拉菜单显示状态
 * @returns void
 */
function toggleSortDropdown(): void {
  isSortDropdownOpen.value = !isSortDropdownOpen.value
}

/**
 * 选择排序选项
 * @param value - 排序值
 * @returns void
 */
function selectSort(value: string): void {
  sort.value = value
  isSortDropdownOpen.value = false
  handleSortChange()
}

/**
 * 点击外部关闭下拉菜单
 * @param event - 鼠标事件
 * @returns void
 */
function handleClickOutside(event: MouseEvent): void {
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(event.target as Node)) {
    isSortDropdownOpen.value = false
  }
}

/**
 * 重置所有筛选条件
 * @returns void
 */
function resetFilters(): void {
  searchQuery.value = ''
  category.value = 'all'
  sort.value = 'newest'
  page.value = 1
  loadProjects()
}

/**
 * 处理页码变化
 * @param newPage - 新页码
 * @returns void
 */
function handlePageChange(newPage: number): void {
  page.value = newPage
  loadProjects()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * 跳转到项目详情
 * @param project - 项目数据
 * @returns void
 */
function goToProject(project: MarketProject): void {
  if (project.projectId) {
    router.push(`/market/projects/${project.projectId}`)
  } else {
    console.warn('项目ID缺失，无法跳转详情页')
  }
}

/**
 * 检查项目是否已点赞
 * @param projectId - 项目ID
 * @returns 是否已点赞
 */
function isProjectLiked(projectId: string | undefined): boolean {
  return projectId ? likedProjectIds.value.has(projectId) : false
}

/**
 * 切换点赞状态
 * @param project - 项目数据
 * @returns void
 */
async function toggleFavorite(project: MarketProject): Promise<void> {
  if (!userStore.isLoggedIn) {
    await showWarning('请先登录')
    return
  }
  if (!project.projectId) return

  const projectId = project.projectId
  const isLiked = likedProjectIds.value.has(projectId)

  try {
    if (isLiked) {
      await unlikeProject(projectId)
      likedProjectIds.value.delete(projectId)
      project.likeCount = Math.max(0, (project.likeCount || 0) - 1)
    } else {
      await likeProject(projectId)
      likedProjectIds.value.add(projectId)
      project.likeCount = (project.likeCount || 0) + 1
    }
  } catch (error: any) {
    console.error('[项目市场] 点赞操作失败:', error)
    // 如果操作失败，不改变本地状态
  }
}

/**
 * 批量加载已点赞的项目ID
 */
async function loadLikedStatus(): Promise<void> {
  if (!userStore.isLoggedIn || projects.value.length === 0) return

  for (const project of projects.value) {
    if (project.projectId) {
      try {
        const res = await checkLiked(project.projectId)
        const data: any = res.data
        if (data.data?.liked) {
          likedProjectIds.value.add(project.projectId)
        }
      } catch (err) {
        // 忽略单个项目的错误
      }
    }
  }
}

// ==================== 生命周期 ====================

// 组件挂载时加载数据
onMounted(() => {
  console.log('[项目市场] onMounted 被调用')
  loadProjects()
  // 添加点击外部关闭下拉菜单的事件监听
  document.addEventListener('click', handleClickOutside)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 监听路由变化，重新加载数据
watch(() => route.path, (newPath) => {
  console.log('[项目市场] 路由变化:', newPath)
  if (newPath === '/market') {
    loadProjects()
  }
})
</script>

<style scoped lang="scss">
// ==================== 设计令牌 ====================
:root {
  --color-bg: #fafafa;
  --color-white: #ffffff;
  --color-black: #000000;
  --color-gray-900: #111827;
  --color-gray-600: #6b7280;
  --color-gray-400: #9ca3af;
  --color-gray-200: #e5e7eb;
  --color-gray-100: #f3f4f6;
  --color-gray-50: #f9fafb;
  --shadow-sm: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 12px 40px -12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 20px 40px -12px rgba(0, 0, 0, 0.1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;
}

// ==================== 全局样式 ====================
.market-view {
  min-height: 100vh;
  background: #fafafa;
  position: relative;
  padding-bottom: 80px;
}

// 噪点纹理
.grain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

// ==================== 页面标题区 ====================
.page-hero {
  padding: 80px 32px 48px;
  position: relative;
  z-index: 2;

  .hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    animation: slideUp 0.8s var(--ease-out-expo) forwards;
  }

  .hero-subtitle {
    font-size: 12px;
    font-weight: 500;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 16px;
  }

  .hero-title {
    font-size: 48px;
    font-weight: 600;
    line-height: 1.1;
    color: #111827;
    margin-bottom: 20px;
    letter-spacing: -0.02em;

    .hero-title-accent {
      font-style: italic;
      font-weight: 400;
      color: #9ca3af;
      font-family: 'Playfair Display', serif;
    }
  }

  .hero-description {
    font-size: 16px;
    color: #6b7280;
    line-height: 1.6;
    max-width: 480px;
  }
}

// ==================== 筛选栏 ====================
.filter-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 16px 32px;
  background: rgba(250, 250, 250, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
  animation: fadeIn 0.6s ease forwards;
  animation-delay: 0.2s;
  opacity: 0;

  .filter-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
  }
}

// 分类标签
.category-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .pill-btn {
    padding: 8px 20px;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: var(--radius-full);
    color: #6b7280;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s var(--ease-out-expo);

    &:hover {
      border-color: #111827;
      color: #111827;
    }

    &.active {
      background: #000000;
      border-color: #000000;
      color: #ffffff;
    }
  }
}

// 筛选工具
.filter-tools {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 16px;
    width: 16px;
    height: 16px;
    color: #9ca3af;
    pointer-events: none;
  }

  input {
    width: 240px;
    padding: 10px 16px 10px 44px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: var(--radius-full);
    font-size: 14px;
    color: #111827;
    transition: all 0.3s ease;

    &::placeholder {
      color: #9ca3af;
    }

    &:focus {
      outline: none;
      border-color: #000000;
    }
  }
}

// 自定义排序下拉菜单
.custom-sort-dropdown {
  position: relative;
}

.sort-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 10px 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-full);
  font-size: 14px;
  color: #111827;
  cursor: pointer;
  transition: all 0.3s var(--ease-out-expo);

  &:hover {
    border-color: #111827;
  }

  &.is-open {
    border-color: #000000;
  }
}

.sort-label {
  font-weight: 500;
  white-space: nowrap;
}

.sort-arrow {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  transition: transform 0.3s var(--ease-out-expo);

  &.is-open {
    transform: rotate(180deg);
  }
}

.sort-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 1rem;
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  z-index: 100;
  transform-origin: top right;
}

.sort-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 0.75rem;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s var(--ease-out-expo);

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }

  &.active {
    background: #000000;
    color: #ffffff;

    &:hover {
      background: #111827;
    }
  }
}

.option-label {
  font-weight: 500;
}

.option-check {
  width: 14px;
  height: 14px;
}

// 下拉菜单动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s var(--ease-out-expo);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

// ==================== 主体内容 ====================
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
  position: relative;
  z-index: 2;
}

.content-header {
  margin-bottom: 24px;
  animation: slideUp 0.6s var(--ease-out-expo) forwards;
  animation-delay: 0.3s;
  opacity: 0;

  .total-count {
    font-size: 14px;
    color: #6b7280;
  }
}

// ==================== 加载状态 ====================
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
  gap: 16px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 2px solid #e5e7eb;
    border-top-color: #000000;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  p {
    font-size: 14px;
    color: #9ca3af;
  }
}

// ==================== 空状态 ====================
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
  text-align: center;

  .empty-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d1d5db;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #9ca3af;
  }

  .retry-btn {
    padding: 10px 24px;
    background: #000000;
    border: none;
    border-radius: var(--radius-full);
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #333333;
      transform: translateY(-2px);
    }

    &.secondary {
      background: transparent;
      border: 1px solid #e5e7eb;
      color: #6b7280;

      &:hover {
        border-color: #111827;
        color: #111827;
        background: transparent;
      }
    }
  }

  &.error-state {
    .empty-icon {
      color: #ef4444;
    }

    h3 {
      color: #ef4444;
    }
  }
}

// ==================== 项目网格 ====================
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

// ==================== 项目卡片 ====================
.project-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.4s var(--ease-out-expo);
  animation: slideUp 0.6s var(--ease-out-expo) forwards;

  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg);

    .card-image {
      transform: scale(1.05);
    }

    .card-image-overlay {
      opacity: 1;
    }
  }
}

// 卡片图片
.card-image-wrap {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #f3f4f6;

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.8s var(--ease-out-expo);
  }

  .card-image-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 20px;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .view-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;

    .view-icon {
      width: 16px;
      height: 16px;
    }
  }

  .category-badge {
    position: absolute;
    top: 16px;
    left: 16px;
    padding: 6px 14px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 500;
    color: #111827;
  }
}

// 卡片内容
.card-content {
  padding: 24px;

  .card-title {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-desc {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}

// 作者信息
.card-author {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;

  .author-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
  }

  .author-name {
    font-size: 13px;
    color: #6b7280;
  }
}

// 统计信息
.card-stats {
  display: flex;
  gap: 20px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #9ca3af;

    .stat-icon {
      width: 16px;
      height: 16px;
      cursor: pointer;
      transition: all 0.3s ease;

      &.liked {
        fill: #ef4444;
        color: #ef4444;
      }
    }
  }
}

// ==================== 分页 ====================
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 48px;
  animation: fadeIn 0.6s ease forwards;
  animation-delay: 0.5s;
  opacity: 0;

  .page-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      border-color: #111827;
      color: #111827;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    svg {
      width: 18px;
      height: 18px;
    }
  }

  .page-numbers {
    display: flex;
    gap: 8px;
  }

  .page-number {
    min-width: 40px;
    height: 40px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: var(--radius-full);
    font-size: 14px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: #111827;
      color: #111827;
    }

    &.active {
      background: #000000;
      border-color: #000000;
      color: #ffffff;
    }
  }
}

// ==================== 动画 ====================
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ==================== 响应式 ====================
@media (max-width: 1024px) {
  .projects-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-hero {
    padding: 60px 20px 32px;

    .hero-title {
      font-size: 36px;
    }
  }

  .filter-bar {
    padding: 12px 20px;

    .filter-inner {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }
  }

  .category-pills {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .filter-tools {
    justify-content: space-between;

    .search-box input {
      width: 100%;
    }
  }

  .main-content {
    padding: 20px;
  }

  .projects-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
