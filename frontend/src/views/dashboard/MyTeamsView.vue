<template>
  <div class="my-teams-view">
    <header class="page-header">
      <div class="header-left">
        <h2 class="page-title">我的团队</h2>
        <span class="page-subtitle">管理你加入的团队</span>
      </div>
      <div class="header-right">
        <button class="primary-btn" @click="createTeam">
          <Plus class="btn-icon" />
          创建团队
        </button>
      </div>
    </header>

    <div class="content-area">
      <div class="teams-list">
        <div v-for="team in teams" :key="team.uuid" class="team-card">
          <div class="team-header">
            <img :src="team.avatarUrl || defaultAvatar" :alt="team.name" class="team-avatar" />
            <div class="team-info">
              <h3 class="team-name">{{ team.name }}</h3>
              <p class="team-desc">{{ team.description || '暂无描述' }}</p>
            </div>
            <span v-if="team.isPersonal" class="team-badge">个人</span>
          </div>
          <div class="team-stats">
            <div class="stat-item">
              <span class="stat-value">{{ team.teamSize }}</span>
              <span class="stat-label">成员</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ team.projectCount || 0 }}</span>
              <span class="stat-label">项目</span>
            </div>
          </div>
          <div class="team-actions">
            <button class="action-btn primary" @click="viewTeam(team)">
              查看详情
            </button>
            <button class="action-btn secondary" @click="leaveTeam(team)">
              退出团队
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'

const defaultAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80'

const teams = ref([
  { uuid: '001', name: '创新设计工作室', description: '专注于产品设计与创新', isPersonal: false, teamSize: 8, projectCount: 12, avatarUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&q=80' },
  { uuid: '002', name: '我的个人空间', description: '个人项目集合', isPersonal: true, teamSize: 1, projectCount: 5, avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80' }
])

function createTeam() {
  console.log('创建团队')
}

function viewTeam(team: any) {
  console.log('查看团队:', team)
}

function leaveTeam(team: any) {
  console.log('退出团队:', team)
}
</script>

<style scoped lang="scss">
$color-gray-900: var(--nexus-text-primary);
$color-gray-600: var(--nexus-text-tertiary);
$color-gray-400: var(--nexus-text-quaternary);
$color-gray-200: var(--nexus-border);
$color-gray-100: var(--nexus-divider);

.my-teams-view {
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
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
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

.primary-btn {
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
  padding: 32px 32px 80px;
  max-width: 1280px;
  margin: 0 auto;
}

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.team-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--nexus-radius-lg);
  padding: 24px;
}

.team-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.team-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--nexus-radius-md);
  object-fit: cover;
}

.team-info {
  flex: 1;
}

.team-name {
  font-size: var(--nexus-font-size-md);
  font-weight: 600;
  color: $color-gray-900;
  margin-bottom: 4px;
}

.team-desc {
  font-size: var(--nexus-font-size-base);
  color: $color-gray-600;
}

.team-badge {
  padding: 4px 10px;
  background: $color-gray-100;
  border-radius: var(--nexus-radius-full);
  font-size: var(--nexus-font-size-xs);
  color: $color-gray-600;
}

.team-stats {
  display: flex;
  gap: 32px;
  padding: 16px 0;
  border-top: 1px solid $color-gray-100;
  border-bottom: 1px solid $color-gray-100;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: var(--nexus-font-size-lg);
  font-weight: 600;
  color: $color-gray-900;
}

.stat-label {
  font-size: var(--nexus-font-size-sm);
  color: $color-gray-400;
}

.team-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 8px 16px;
  border-radius: var(--nexus-radius-sm);
  font-size: var(--nexus-font-size-base);
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;

  &.primary {
    background: var(--nexus-accent);
    border: none;
    color: var(--nexus-white);

    &:hover {
      background: $color-gray-900;
    }
  }

  &.secondary {
    background: transparent;
    border: 1px solid $color-gray-200;
    color: $color-gray-600;

    &:hover {
      border-color: $color-gray-400;
      color: $color-gray-900;
    }
  }
}
</style>
