<template>
  <div class="message-center-view">
    <header class="page-header">
      <div class="header-left">
        <h2 class="page-title">消息中心</h2>
        <span class="page-subtitle">查看系统通知和消息</span>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}条未读</span>
      </div>
      <div class="header-actions">
        <button class="action-btn" :disabled="unreadCount === 0" @click="markAllAsRead">
          全部已读
        </button>
        <button class="action-btn secondary" :disabled="readCount === 0" @click="deleteRead">
          删除已读
        </button>
      </div>
    </header>

    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <Loader2 class="loading-icon" />
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="notifications.length === 0" class="empty-state">
        <Bell class="empty-icon" />
        <h3>暂无消息</h3>
        <p>当有新消息时会在这里显示</p>
      </div>

      <!-- 消息列表 -->
      <div v-else class="message-list">
        <div 
          v-for="msg in notifications" 
          :key="msg.id" 
          :class="['message-item', { unread: !msg.isRead }]"
          @click="handleMessageClick(msg)"
        >
          <div class="message-icon" :class="msg.type.toLowerCase()">
            <UserPlus v-if="msg.type === 'FOLLOW'" />
            <Heart v-else-if="msg.type === 'LIKE'" />
            <MessageCircle v-else-if="msg.type === 'COMMENT'" />
            <Briefcase v-else-if="msg.type === 'PROJECT'" />
            <Bell v-else />
          </div>
          <div class="message-content">
            <h4 class="message-title">{{ msg.title }}</h4>
            <p class="message-text">{{ msg.content }}</p>
            <span class="message-time">{{ msg.timeAgo }}</span>
          </div>
          <div class="message-actions">
            <button 
              v-if="!msg.isRead" 
              class="read-btn"
              @click.stop="markAsRead(msg.id)"
            >
              标为已读
            </button>
            <button class="delete-btn" @click.stop="deleteMessage(msg.id)">
              <X class="delete-icon" />
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          :disabled="currentPage === 1" 
          class="page-btn"
          @click="changePage(currentPage - 1)"
        >
          <ChevronLeft />
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          :disabled="currentPage === totalPages" 
          class="page-btn"
          @click="changePage(currentPage + 1)"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Bell, 
  UserPlus, 
  Heart, 
  MessageCircle, 
  Briefcase,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import * as notificationApi from '@/api/notification'
import type { Notification } from '@/api/notification'
import { useAppDialog } from '@/composables/useAppDialog'

const router = useRouter()
const { confirm } = useAppDialog()

const notifications = ref<Notification[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const pageSize = 20

const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)
const readCount = computed(() => notifications.value.filter(n => n.isRead).length)

/**
 * 获取消息列表
 */
async function fetchNotifications(page = 1) {
  loading.value = true
  try {
    const res = await notificationApi.getNotifications({ 
      page, 
      size: pageSize 
    })
    if (res.data.status === 200) {
      notifications.value = res.data.data.notifications || []
      totalPages.value = res.data.data.totalPages || 1
      total.value = res.data.data.total || 0
      currentPage.value = page
    }
  } catch (error) {
    console.error('获取消息列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 切换页码
 */
function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return
  fetchNotifications(page)
}

/**
 * 处理消息点击
 */
function handleMessageClick(msg: Notification) {
  // 根据消息类型跳转到相关页面
  if (msg.relatedId && msg.relatedType) {
    switch (msg.relatedType) {
      case 'POST':
        router.push(`/community/post/${msg.relatedId}`)
        break
      case 'PROJECT':
        router.push(`/market/projects/${msg.relatedId}`)
        break
      case 'USER':
        router.push(`/profile/${msg.relatedId}`)
        break
    }
  }
  // 标记为已读
  if (!msg.isRead) {
    markAsRead(msg.id)
  }
}

/**
 * 标记单条消息为已读
 */
async function markAsRead(id: number) {
  try {
    const res = await notificationApi.markAsRead(id)
    if (res.data.status === 200) {
      const index = notifications.value.findIndex(n => n.id === id)
      if (index !== -1) {
        notifications.value[index] = { ...notifications.value[index], isRead: true } as any
      }
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

/**
 * 标记所有消息为已读
 */
async function markAllAsRead() {
  try {
    const res = await notificationApi.markAllAsRead()
    if (res.data.status === 200) {
      notifications.value = notifications.value.map(n => ({ ...n, isRead: true }))
    }
  } catch (error) {
    console.error('标记全部已读失败:', error)
  }
}

/**
 * 删除已读消息
 */
async function deleteRead() {
  try {
    const res = await notificationApi.deleteReadNotifications()
    if (res.data.status === 200) {
      notifications.value = notifications.value.filter(n => !n.isRead)
    }
  } catch (error) {
    console.error('删除已读消息失败:', error)
  }
}

/**
 * 删除单条消息
 */
async function deleteMessage(id: number) {
  if (!await confirm('确定要删除这条消息吗？')) return
  try {
    const res = await notificationApi.deleteNotification(id)
    if (res.data.status === 200) {
      notifications.value = notifications.value.filter(n => n.id !== id)
    }
  } catch (error) {
    console.error('删除消息失败:', error)
  }
}

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped lang="scss">
$color-gray-900: #111827;
$color-gray-700: #374151;
$color-gray-600: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-200: #e5e7eb;
$color-gray-100: #f3f4f6;
$color-gray-50: #f9fafb;
$color-blue: #3b82f6;
$color-green: #10b981;
$color-red: #ef4444;
$color-purple: #a855f7;

.message-center-view {
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

.unread-badge {
  padding: 2px 8px;
  background: $color-red;
  color: white;
  font-size: 12px;
  border-radius: 9999px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  background: $color-gray-900;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.secondary {
    background: white;
    color: $color-gray-700;
    border: 1px solid $color-gray-200;
  }
}

.content-area {
  padding: 32px;
  max-width: 1280px;
  margin: 0 auto;
}

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
  }
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  &.unread {
    background: rgba(59, 130, 246, 0.05);
    border-left: 3px solid $color-blue;

    .message-title::after {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      background: $color-red;
      border-radius: 50%;
      margin-left: 8px;
      vertical-align: middle;
    }
  }
}

.message-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-gray-100;
  border-radius: 50%;
  color: $color-gray-600;
  flex-shrink: 0;

  &.follow {
    background: rgba(168, 85, 247, 0.1);
    color: $color-purple;
  }

  &.like {
    background: rgba(239, 68, 68, 0.1);
    color: $color-red;
  }

  &.comment {
    background: rgba(59, 130, 246, 0.1);
    color: $color-blue;
  }

  &.project {
    background: rgba(16, 185, 129, 0.1);
    color: $color-green;
  }

  &.system {
    background: rgba(0, 0, 0, 0.05);
    color: $color-gray-700;
  }
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-title {
  font-size: 14px;
  font-weight: 600;
  color: $color-gray-900;
  margin-bottom: 4px;
}

.message-text {
  font-size: 13px;
  color: $color-gray-600;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-time {
  font-size: 12px;
  color: $color-gray-400;
}

.message-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.read-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid $color-gray-200;
  border-radius: 6px;
  font-size: 12px;
  color: $color-gray-600;
  cursor: pointer;

  &:hover {
    border-color: $color-blue;
    color: $color-blue;
  }
}

.delete-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: $color-gray-400;
  cursor: pointer;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: $color-red;
  }

  .delete-icon {
    width: 16px;
    height: 16px;
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;

  .page-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid $color-gray-200;
    border-radius: 8px;
    color: $color-gray-600;
    cursor: pointer;

    &:hover:not(:disabled) {
      border-color: $color-gray-900;
      color: $color-gray-900;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .page-info {
    font-size: 14px;
    color: $color-gray-600;
  }
}
</style>
