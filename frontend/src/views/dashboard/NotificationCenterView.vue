<template>
  <div class="notification-center-view">
    <header class="page-header">
      <div class="header-left">
        <h2 class="page-title">通知中心</h2>
        <span class="page-subtitle">查看您的消息和通知</span>
      </div>
      <div class="header-right">
        <button class="secondary-btn" :disabled="loading || notifications.length === 0" @click="handleMarkAllRead">
          <Check class="btn-icon" />
          全部已读
        </button>
      </div>
    </header>

    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="notifications.length === 0" class="empty-state">
        <Bell class="empty-icon" />
        <p>暂无通知</p>
        <span class="empty-tip">当有新的消息时，会在这里显示</span>
      </div>

      <!-- 通知列表 -->
      <div v-else class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification-item', { unread: !notification.isRead }]"
        >
          <div :class="['notification-icon', getIconClass(notification.type)]">
            <component :is="getIcon(notification.type)" />
          </div>
          <div class="notification-content">
            <p class="notification-title">{{ notification.title }}</p>
            <p class="notification-text">{{ notification.content }}</p>
            <p class="notification-time">{{ notification.timeAgo }}</p>
          </div>
          <button
            v-if="!notification.isRead"
            class="mark-read-btn"
            @click="markAsRead(notification)"
          >
            标记已读
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Check, Heart, UserPlus, MessageSquare, Users, Bell, FileText } from 'lucide-vue-next'
import { getNotifications, markAsRead as markAsReadApi, markAllAsRead } from '@/api/notification'
import type { Notification } from '@/api/notification'
import { useMessage } from 'naive-ui'

const notifications = ref<Notification[]>([])
const loading = ref(false)
const message = useMessage()

// 获取图标组件
function getIcon(type: string) {
  const iconMap: Record<string, any> = {
    'LIKE': Heart,
    'FOLLOW': UserPlus,
    'COMMENT': MessageSquare,
    'PROJECT': FileText,
    'SYSTEM': Bell
  }
  return iconMap[type] || Bell
}

// 获取图标样式类
function getIconClass(type: string) {
  const classMap: Record<string, string> = {
    'LIKE': 'like',
    'FOLLOW': 'follow',
    'COMMENT': 'comment',
    'PROJECT': 'team',
    'SYSTEM': 'system'
  }
  return classMap[type] || 'system'
}

// 获取通知列表
async function fetchNotifications() {
  loading.value = true
  try {
    const response = await getNotifications({ page: 1, size: 50 })
    if (response.data?.data?.notifications) {
      notifications.value = response.data.data.notifications
    }
  } catch (error) {
    message.error('获取通知失败')
    console.error('获取通知失败:', error)
  } finally {
    loading.value = false
  }
}

// 标记单条已读
async function markAsRead(notification: Notification) {
  try {
    await markAsReadApi(notification.id)
    const index = notifications.value.findIndex(n => n.id === notification.id)
    if (index !== -1) {
      notifications.value[index] = { ...notifications.value[index], isRead: true } as any
    }
    message.success('已标记为已读')
  } catch (error) {
    message.error('标记已读失败')
    console.error('标记已读失败:', error)
  }
}

// 标记全部已读
async function handleMarkAllRead() {
  if (notifications.value.length === 0) return
  
  try {
    await markAllAsRead()
    notifications.value = notifications.value.map(n => ({ ...n, isRead: true }))
    message.success('已全部标记为已读')
  } catch (error) {
    message.error('标记全部已读失败')
    console.error('标记全部已读失败:', error)
  }
}

onMounted(() => {
  fetchNotifications()
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
$color-danger: #ef4444;

.notification-center-view {
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

.secondary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid $color-gray-200;
  border-radius: 8px;
  font-size: 14px;
  color: $color-gray-600;
  cursor: pointer;
  transition: all 0.3s ease;

  .btn-icon {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    border-color: $color-gray-400;
    color: $color-gray-900;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  transition: all 0.3s ease;

  &.unread {
    background: rgba(0, 0, 0, 0.02);
    border-left: 3px solid #000;
  }
}

.notification-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;

  &.like {
    background: rgba(239, 68, 68, 0.1);
    color: $color-danger;
  }

  &.follow {
    background: rgba(16, 185, 129, 0.1);
    color: $color-success;
  }

  &.comment {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  &.team {
    background: $color-gray-100;
    color: $color-gray-600;
  }

  &.system {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }
}

.notification-content {
  flex: 1;

  .notification-title {
    font-size: 14px;
    font-weight: 600;
    color: $color-gray-900;
    margin-bottom: 4px;
  }

  .notification-text {
    font-size: 14px;
    color: $color-gray-600;
    margin-bottom: 4px;
    line-height: 1.5;
  }

  .notification-time {
    font-size: 12px;
    color: $color-gray-400;
  }
}

.mark-read-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid $color-gray-200;
  border-radius: 6px;
  font-size: 12px;
  color: $color-gray-600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;

  &:hover {
    border-color: #000;
    color: #000;
  }
}
</style>
