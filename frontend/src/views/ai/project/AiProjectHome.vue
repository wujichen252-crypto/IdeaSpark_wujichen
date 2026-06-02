<template>
  <div class="ai-project-home">
    <!-- Grain Overlay -->
    <div class="grain" ></div>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-backdrop" :style="heroStyle" ></div>
        <div class="hero-overlay" ></div>
        <div class="hero-content">
          <div class="hero-meta-top">
            <span v-if="store.projectInfo.category" class="project-category">
              {{ store.projectInfo.category }}
            </span>
            <span class="status-badge" :class="store.projectInfo.status">
              {{ statusText }}
            </span>
          </div>
          <h2 class="hero-title">{{ store.projectInfo.name || '未命名项目' }}</h2>
          <p class="hero-subtitle">{{ store.projectInfo.description || '暂无一句话介绍...' }}</p>
          <div class="hero-stats">
            <div class="stat-item">
              <Clock class="w-3.5 h-3.5" />
              <span>更新于 {{ formatDate(store.projectInfo.updatedAt) }}</span>
            </div>
            <span class="stat-dot" ></span>
            <div class="stat-item">
              <Users class="w-3.5 h-3.5" />
              <span>成员 {{ store.projectInfo.team?.length || 1 }}</span>
            </div>
            <span class="stat-dot" ></span>
            <div class="stat-item">
              <TrendingUp class="w-3.5 h-3.5" />
              <span>进度 {{ progressPercentage }}%</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Left Column -->
        <div class="left-column">
          <!-- Project Info Card -->
          <section class="glass-card info-card">
            <div class="card-header">
              <div class="card-title-group">
                <div class="title-icon">
                  <FileText class="w-4 h-4" />
                </div>
                <h3>项目信息</h3>
              </div>
            </div>
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">项目名称</span>
                <span class="info-value">{{ store.projectInfo.name || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">项目简介</span>
                <span class="info-value muted">{{ store.projectInfo.description || '暂无描述' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">项目分类</span>
                <span class="info-value">{{ store.projectInfo.category || '未分类' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">标签</span>
                <div class="info-value">
                  <template v-if="store.projectInfo.tags?.length">
                    <span v-for="tag in store.projectInfo.tags" :key="tag" class="tag">{{ tag }}</span>
                  </template>
                  <span v-else class="muted">暂无标签</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Files Overview Card -->
          <section class="glass-card files-card">
            <div class="card-header">
              <div class="card-title-group">
                <div class="title-icon">
                  <FolderOpen class="w-4 h-4" />
                </div>
                <h3>文件概览</h3>
              </div>
              <a href="#" class="view-all-link">
                查看全部
                <ChevronRight class="w-3.5 h-3.5" />
              </a>
            </div>
            
            <div class="stats-row">
              <div v-for="(stat, index) in fileStats" :key="index" class="stat-card">
                <span class="stat-number">{{ stat.value }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </div>

            <div class="recent-files">
              <h4 class="section-subtitle">最近文件</h4>
              <div class="empty-state">
                <div class="empty-icon">
                  <FileX class="w-10 h-10" />
                </div>
                <p>暂无文件记录</p>
              </div>
            </div>
          </section>

          <!-- Quick Actions Card -->
          <section class="glass-card quick-card">
            <div class="card-header">
              <div class="card-title-group">
                <div class="title-icon">
                  <Zap class="w-4 h-4" />
                </div>
                <h3>快捷入口</h3>
              </div>
            </div>
            <div class="quick-actions">
              <button class="quick-btn" @click="router.push({ name: 'AiProjectWorkbench' })">
                <div class="quick-icon">
                  <LayoutGrid class="w-5 h-5" />
                </div>
                <div class="quick-text">
                  <span class="quick-title">打开项目插件</span>
                  <span class="quick-desc">进入工作台继续创作</span>
                </div>
                <ArrowRight class="w-4 h-4 arrow" />
              </button>
            </div>
          </section>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <!-- Progress Card -->
          <section class="glass-card progress-card">
            <div class="progress-header">
              <span class="progress-label">当前进度</span>
              <span class="progress-value">{{ progressPercentage }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar" :style="{ width: progressPercentage + '%' }" ></div>
            </div>
            <div class="stage-info">
              <div class="stage-badge">
                <span class="stage-dot" ></span>
                <span class="stage-name">{{ store.currentModuleData.label }}</span>
              </div>
              <p class="stage-desc">{{ store.currentModuleData.description }}</p>
            </div>
            <button class="btn-primary" @click="router.push({ name: 'AiProjectWorkbench' })">
              <span>进入工作台</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </section>

          <!-- Team Card -->
          <section class="glass-card team-card">
            <div class="card-header">
              <div class="card-title-group">
                <div class="title-icon">
                  <Users class="w-4 h-4" />
                </div>
                <h3>项目成员</h3>
              </div>
              <span class="member-count">{{ store.projectInfo.team?.length || 1 }} 人</span>
            </div>
            <div class="team-list">
              <div v-for="member in store.projectInfo.team" :key="member.id" class="team-member">
                <div class="member-avatar" :style="member.avatar ? { backgroundImage: `url(${member.avatar})` } : {}">
                  <span v-if="!member.avatar">{{ member.name?.charAt(0) || '?' }}</span>
                </div>
                <div class="member-info">
                  <span class="member-name">{{ member.name }}</span>
                  <span class="member-role">{{ member.id === 'ai' ? 'AI 助手' : '项目负责人' }}</span>
                </div>
                <span v-if="member.role === 'owner'" class="owner-badge">Owner</span>
              </div>
            </div>
          </section>

          <!-- Timeline Card -->
          <section class="glass-card timeline-card">
            <div class="card-header">
              <div class="card-title-group">
                <div class="title-icon">
                  <History class="w-4 h-4" />
                </div>
                <h3>最近动态</h3>
              </div>
            </div>
            <div class="timeline">
              <div v-for="(item, index) in timelineItems" :key="index" class="timeline-item">
                <div v-if="index < timelineItems.length - 1" class="timeline-line" ></div>
                <div class="timeline-dot" :class="{ active: index === 0 }" ></div>
                <div class="timeline-content">
                  <p class="timeline-title">{{ item.title }}</p>
                  <p class="timeline-time">{{ item.time }}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAiWorkshopStore } from '@/store'
import {
  ArrowRight,
  Clock,
  Users,
  TrendingUp,
  FileText,
  FolderOpen,
  ChevronRight,
  FileX,
  Zap,
  LayoutGrid,
  History
} from 'lucide-vue-next'

const router = useRouter()
const store = useAiWorkshopStore()

// 进度百分比
const progressPercentage = computed(() => {
  const total = store.moduleOrder.length
  const current = store.moduleOrder.indexOf(store.currentModule)
  return Math.round((current / total) * 100)
})

// 状态文本
const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    'active': '进行中',
    'completed': '已完成',
    'paused': '已暂停',
    'draft': '草稿'
  }
  return statusMap[store.projectInfo.status || 'active'] || '进行中'
})

// Hero背景样式
const heroStyle = computed(() => {
  if (store.projectInfo.cover) {
    return { backgroundImage: `url(${store.projectInfo.cover})` }
  }
  return { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }
})

// 文件统计
const fileStats = [
  { label: '文件总数', value: 0 },
  { label: '文档', value: 0 },
  { label: '表格', value: 0 },
  { label: '演示', value: 0 }
]

// 时间线数据
const timelineItems = computed(() => [
  { title: '项目初始化', time: formatDate(store.projectInfo.updatedAt) },
  { title: '进入构思阶段', time: formatDate(store.projectInfo.updatedAt ? store.projectInfo.updatedAt + 100000 : Date.now()) },
  ...(store.currentModule !== 'idea' ? [{ title: '进入规划阶段', time: '刚刚' }] : [])
])

// 格式化日期
function formatDate(ts: number | undefined) {
  if (!ts) return '-'
  const date = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const mins = Math.floor(diff / (1000 * 60))
      return mins === 0 ? '刚刚' : `${mins}分钟前`
    }
    return `${hours}小时前`
  }
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped lang="scss">
// Nexus Design System Variables
$bg-primary: #fafafa;
$bg-white: #ffffff;
$text-primary: #111827;
$text-secondary: #6b7280;
$text-muted: #9ca3af;
$border-color: #e5e7eb;
$success-color: #10b981;
$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

.ai-project-home {
  min-height: 100vh;
  background: $bg-primary;
  position: relative;
  padding-bottom: 48px;
}

// Grain Texture
.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.02;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

// Buttons
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 20px;
  background: $text-primary;
  color: $bg-white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s $ease-out-expo;
  margin-top: 16px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

// Main Content
.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
  position: relative;
  z-index: 2;
}

// Hero Section
.hero-section {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 24px;
  min-height: 280px;
  display: flex;
  align-items: flex-end;
}

.hero-backdrop {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(0px);
  transform: scale(1.02);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.85) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 1;
  padding: 32px;
  width: 100%;
  color: $bg-white;
}

.hero-meta-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.project-category {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  
  &.active {
    background: rgba(16, 185, 129, 0.2);
    color: #6ee7b7;
  }
  
  &.draft {
    background: rgba(156, 163, 175, 0.2);
    color: #d1d5db;
  }
  
  &.completed {
    background: rgba(59, 130, 246, 0.2);
    color: #93c5fd;
  }
}

.hero-title {
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 24px;
  max-width: 600px;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .stat-dot {
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
  }
}

// Content Grid
.content-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

// Glass Card
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
  transition: all 0.4s $ease-out-expo;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.08);
  }
  
  & + .glass-card {
    margin-top: 20px;
  }
}

// Card Header
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .title-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 10px;
    color: $text-secondary;
  }
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
    letter-spacing: -0.01em;
  }
}

.view-all-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: $text-secondary;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    color: $text-primary;
    gap: 6px;
  }
}

// Info Card
.info-card {
  .info-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .info-row {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 16px;
    align-items: flex-start;
  }
  
  .info-label {
    font-size: 13px;
    color: $text-muted;
    padding-top: 2px;
  }
  
  .info-value {
    font-size: 14px;
    color: $text-primary;
    line-height: 1.5;
    
    &.muted {
      color: $text-muted;
    }
    
    .tag {
      display: inline-flex;
      padding: 4px 10px;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      margin-right: 6px;
      margin-bottom: 4px;
    }
  }
}

// Files Card
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  text-align: center;
  padding: 16px 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  
  .stat-number {
    display: block;
    font-size: 28px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 4px;
    font-feature-settings: 'tnum';
    letter-spacing: -0.02em;
  }
  
  .stat-label {
    font-size: 12px;
    color: $text-muted;
  }
}

.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  
  .empty-icon {
    color: $border-color;
    margin-bottom: 12px;
  }
  
  p {
    font-size: 13px;
    color: $text-muted;
  }
}

// Quick Card
.quick-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s $ease-out-expo;
  text-align: left;
  
  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-color: $border-color;
    
    .arrow {
      transform: translateX(4px);
    }
  }
  
  .quick-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $bg-white;
    border-radius: 12px;
    color: $text-secondary;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  
  .quick-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .quick-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
  }
  
  .quick-desc {
    font-size: 12px;
    color: $text-muted;
  }
  
  .arrow {
    color: $text-muted;
    transition: transform 0.2s;
  }
}

// Progress Card
.progress-card {
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .progress-label {
    font-size: 13px;
    color: $text-muted;
  }
  
  .progress-value {
    font-size: 24px;
    font-weight: 600;
    color: $text-primary;
    font-feature-settings: 'tnum';
  }
  
  .progress-track {
    height: 6px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 20px;
  }
  
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, $text-primary, #374151);
    border-radius: 3px;
    transition: width 0.6s $ease-out-expo;
  }
  
  .stage-info {
    padding: 16px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 12px;
  }
  
  .stage-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  
  .stage-dot {
    width: 8px;
    height: 8px;
    background: $success-color;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  }
  
  .stage-name {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
  }
  
  .stage-desc {
    font-size: 13px;
    color: $text-secondary;
    margin: 0;
    line-height: 1.5;
  }
}

// Team Card
.member-count {
  font-size: 12px;
  color: $text-muted;
  font-weight: 500;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 10px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: $text-primary;
}

.member-role {
  font-size: 12px;
  color: $text-muted;
}

.owner-badge {
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: $text-secondary;
}

// Timeline Card
.timeline {
  position: relative;
  padding-left: 8px;
}

.timeline-item {
  position: relative;
  padding: 0 0 20px 24px;
  
  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-line {
  position: absolute;
  left: 5px;
  top: 10px;
  bottom: -10px;
  width: 1px;
  background: $border-color;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 6px;
  width: 11px;
  height: 11px;
  background: $border-color;
  border: 2px solid $bg-white;
  border-radius: 50%;
  z-index: 1;
  
  &.active {
    background: $text-primary;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
  }
}

.timeline-content {
  margin-top: -2px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 3px;
}

.timeline-time {
  font-size: 12px;
  color: $text-muted;
}

// Animation
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

.glass-card {
  animation: slideUp 0.6s $ease-out-expo forwards;
  opacity: 0;
  
  @for $i from 1 through 10 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.05}s;
    }
  }
}

.hero-section {
  animation: slideUp 0.8s $ease-out-expo forwards;
}
</style>
