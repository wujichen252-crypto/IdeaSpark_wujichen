<template>
  <div class="personal-security-view">
    <header class="page-header">
      <div class="header-left">
        <h2 class="page-title">安全记录</h2>
        <span class="page-subtitle">查看您的账户操作记录</span>
      </div>
    </header>

    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="securityLogs.length === 0" class="empty-state">
        <Shield class="empty-icon" />
        <p>暂无安全记录</p>
        <span class="empty-tip">您的账户操作记录将在这里显示</span>
      </div>

      <!-- 安全日志列表 -->
      <div v-else class="security-card">
        <div class="security-timeline">
          <div v-for="log in securityLogs" :key="log.id" class="timeline-item">
            <div :class="['timeline-icon', getIconClass(log.actionType)]">
              <component :is="getIcon(log.actionType)" />
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <h4 class="timeline-title">{{ getActionTitle(log.actionType) }}</h4>
                <span class="timeline-time">{{ log.timeAgo || formatTime(log.createdAt) }}</span>
              </div>
              <p class="timeline-desc">{{ log.description }}</p>
              <div class="timeline-meta">
                <span v-if="log.location" class="meta-item">
                  <MapPin class="meta-icon" />
                  {{ log.location }}
                </span>
                <span v-if="log.device" class="meta-item">
                  <Monitor class="meta-icon" />
                  {{ log.device }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { LogIn, Key, Shield, AlertTriangle, MapPin, Monitor } from 'lucide-vue-next'
import { getSecurityLogs } from '@/api/securityLog'
import type { SecurityLog } from '@/api/securityLog'
import { useMessage } from 'naive-ui'

const securityLogs = ref<SecurityLog[]>([])
const loading = ref(false)
const message = useMessage()

// 获取图标组件
function getIcon(actionType: string) {
  const iconMap: Record<string, any> = {
    'LOGIN': LogIn,
    'LOGOUT': LogIn,
    'PASSWORD_CHANGE': Key,
    'PROFILE_UPDATE': Shield,
    'PASSWORD_RESET': Key,
    'ABNORMAL_LOGIN': AlertTriangle
  }
  return iconMap[actionType] || Shield
}

// 获取图标样式类
function getIconClass(actionType: string) {
  const classMap: Record<string, string> = {
    'LOGIN': 'success',
    'LOGOUT': 'info',
    'PASSWORD_CHANGE': 'info',
    'PROFILE_UPDATE': 'info',
    'PASSWORD_RESET': 'warning',
    'ABNORMAL_LOGIN': 'warning'
  }
  return classMap[actionType] || 'info'
}

// 获取操作标题
function getActionTitle(actionType: string) {
  const titleMap: Record<string, string> = {
    'LOGIN': '登录成功',
    'LOGOUT': '退出登录',
    'PASSWORD_CHANGE': '修改密码',
    'PROFILE_UPDATE': '更新个人资料',
    'PASSWORD_RESET': '重置密码',
    'ABNORMAL_LOGIN': '异常登录提醒'
  }
  return titleMap[actionType] || actionType
}

// 格式化时间（后备方案）
function formatTime(createdAt: string) {
  if (!createdAt) return ''
  const date = new Date(createdAt)
  return date.toLocaleString('zh-CN')
}

// 获取安全日志列表
async function fetchSecurityLogs() {
  loading.value = true
  try {
    const response = await getSecurityLogs({ page: 1, size: 50 })
    if (response.data?.data?.logs) {
      securityLogs.value = response.data.data.logs
    }
  } catch (error) {
    message.error('获取安全记录失败')
    console.error('获取安全记录失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSecurityLogs()
})
</script>

<style scoped lang="scss">
$color-gray-900: #111827;
$color-gray-600: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-200: #e5e7eb;
$color-gray-100: #f3f4f6;
$color-gray-50: #f9fafb;
$color-success: #10b981;
$color-warning: #f59e0b;

.personal-security-view {
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

.content-area {
  padding: 32px 32px 80px;
  max-width: 1280px;
  margin: 0 auto;
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: $color-gray-400;

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid $color-gray-200;
    border-top-color: $color-gray-900;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
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
  color: $color-gray-400;

  .empty-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    font-size: 16px;
    font-weight: 500;
    color: $color-gray-600;
    margin-bottom: 8px;
  }

  .empty-tip {
    font-size: 14px;
  }
}

.security-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 24px;
}

.security-timeline {
  position: relative;
  padding-left: 40px;

  &:before {
    content: '';
    position: absolute;
    left: 16px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: $color-gray-200;
  }
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-icon {
  position: absolute;
  left: -32px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  z-index: 1;

  &.success {
    background: rgba(16, 185, 129, 0.1);
    color: $color-success;
  }

  &.info {
    background: $color-gray-100;
    color: $color-gray-600;
  }

  &.warning {
    background: rgba(245, 158, 11, 0.1);
    color: $color-warning;
  }
}

.timeline-content {
  padding-left: 16px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: $color-gray-900;
}

.timeline-time {
  font-size: 12px;
  color: $color-gray-400;
}

.timeline-desc {
  font-size: 13px;
  color: $color-gray-600;
  margin-bottom: 8px;
}

.timeline-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: $color-gray-400;

  .meta-icon {
    width: 12px;
    height: 12px;
  }
}
</style>
