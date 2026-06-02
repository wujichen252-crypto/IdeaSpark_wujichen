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
$color-gray-900: #111827;
$color-gray-600: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-200: #e5e7eb;
$color-gray-100: #f3f4f6;

.my-teams-view {
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

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.team-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
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
  border-radius: 12px;
  object-fit: cover;
}

.team-info {
  flex: 1;
}

.team-name {
  font-size: 16px;
  font-weight: 600;
  color: $color-gray-900;
  margin-bottom: 4px;
}

.team-desc {
  font-size: 14px;
  color: $color-gray-600;
}

.team-badge {
  padding: 4px 10px;
  background: $color-gray-100;
  border-radius: 9999px;
  font-size: 11px;
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
  font-size: 20px;
  font-weight: 600;
  color: $color-gray-900;
}

.stat-label {
  font-size: 13px;
  color: $color-gray-400;
}

.team-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &.primary {
    background: #000;
    border: none;
    color: #fff;

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
