<template>
  <div class="project-management-view">
    <header class="page-header">
      <div class="header-left">
        <h2 class="page-title">项目管理</h2>
        <span class="page-subtitle">管理所有项目信息</span>
      </div>
      <div class="header-right">
        <button class="create-btn" @click="createProject">
          <Plus class="btn-icon" />
          新建项目
        </button>
      </div>
    </header>

    <div class="content-area">
      <div class="projects-grid">
        <div v-for="project in projects" :key="project.id" class="project-card">
          <img :src="project.coverImage" :alt="project.name" class="project-cover" />
          <div class="project-info">
            <h3 class="project-name">{{ project.name }}</h3>
            <p class="project-desc">{{ project.description }}</p>
            <div class="project-meta">
              <span class="meta-item">
                <Eye class="meta-icon" />
                {{ project.viewsCount }}
              </span>
              <span class="meta-item">
                <Heart class="meta-icon" />
                {{ project.likesCount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Eye, Heart } from 'lucide-vue-next'

const projects = ref([
  { id: 1, name: '智能照明系统', description: '基于AI的智能照明控制方案', coverImage: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&q=80', viewsCount: 1523, likesCount: 89 },
  { id: 2, name: '极简家具系列', description: '现代简约风格家具设计', coverImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80', viewsCount: 1289, likesCount: 76 },
  { id: 3, name: '海洋清洁计划', description: '海洋垃圾清理与回收项目', coverImage: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=400&q=80', viewsCount: 987, likesCount: 62 }
])

function createProject() {
  console.log('创建新项目')
}
</script>

<style scoped lang="scss">
$color-gray-900: var(--nexus-text-primary);
$color-gray-600: var(--nexus-text-tertiary);
$color-gray-400: var(--nexus-text-quaternary);
$color-gray-200: var(--nexus-border);
$color-gray-100: var(--nexus-divider);

.project-management-view {
  min-height: 100vh;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: var(--nexus-z-header);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(250, 250, 250, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(230, 230, 230, 0.5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: var(--nexus-font-size-lg);
  font-weight: 600;
  color: $color-gray-900;
  margin: 0;
}

.page-subtitle {
  font-size: var(--nexus-font-size-base);
  color: $color-gray-400;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--nexus-accent);
  border: none;
  border-radius: var(--nexus-radius-sm);
  font-size: var(--nexus-font-size-base);
  color: var(--nexus-white);
  cursor: pointer;

  .btn-icon {
    width: 16px;
    height: 16px;
  }
}

.content-area {
  padding: 32px;
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
  border-radius: var(--nexus-radius-lg);
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

.project-cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.project-info {
  padding: 20px;
}

.project-name {
  font-size: var(--nexus-font-size-md);
  font-weight: 600;
  color: $color-gray-900;
  margin-bottom: 8px;
}

.project-desc {
  font-size: var(--nexus-font-size-base);
  color: $color-gray-600;
  margin-bottom: 16px;
  line-height: var(--nexus-leading-compact);
}

.project-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--nexus-font-size-sm);
  color: $color-gray-400;
}

.meta-icon {
  width: 14px;
  height: 14px;
}
</style>
