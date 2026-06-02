<template>
  <div class="notifications-page">
    <div class="page-header">
      <div class="container header-content">
        <div class="header-left">
          <n-button
quaternary
circle
class="back-btn"
@click="handleBack">
            <template #icon>
              <n-icon :component="ArrowBack" />
            </template>
          </n-button>
          <div class="header-text">
            <h1>消息通知</h1>
            <p class="subtitle">查看所有系统通知、评论和项目动态</p>
          </div>
        </div>
        <div class="header-actions">
          <n-button secondary size="small" @click="markAllAsRead">
            <template #icon>
              <n-icon :component="CheckmarkDone" />
            </template>
            一键已读
          </n-button>
          <n-button
secondary
size="small"
class="ml-2"
@click="clearRead">
            <template #icon>
              <n-icon :component="TrashOutline" />
            </template>
            删除已读
          </n-button>
        </div>
      </div>
    </div>

    <div class="container content-container">
      <n-card :bordered="false" class="notifications-card">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <n-spin size="large" />
          <p>加载中...</p>
        </div>

        <!-- 消息列表 -->
        <n-tabs v-else type="line" animated>
          <n-tab-pane name="all" tab="全部">
            <div class="notification-list">
              <div
                v-for="item in allNotifications"
                :key="item.id"
                class="notification-item"
                :class="{ unread: !item.isRead }"
              >
                <div class="icon-wrapper" :class="item.type.toLowerCase()">
                  <n-icon v-if="item.type === 'SYSTEM'" :component="NotificationsOutline" />
                  <n-icon v-else-if="item.type === 'COMMENT'" :component="ChatbubbleOutline" />
                  <n-icon v-else-if="item.type === 'LIKE'" :component="HeartOutline" />
                  <n-icon v-else :component="InformationCircleOutline" />
                </div>
                <div class="content">
                  <div class="title-row">
                    <span class="title">{{ item.title }}</span>
                    <span class="time">{{ item.timeAgo }}</span>
                  </div>
                  <p class="description">{{ item.content }}</p>
                </div>
                <div class="actions">
                  <n-button
                    v-if="!item.isRead"
                    size="tiny"
                    secondary
                    type="primary"
                    @click="markAsRead(item.id)"
                  >
                    标为已读
                  </n-button>
                </div>
              </div>
              <n-empty v-if="allNotifications.length === 0" description="暂无消息" class="mt-8" />
            </div>
          </n-tab-pane>
          <n-tab-pane name="unread" tab="未读">
            <div class="notification-list">
              <div v-for="item in unreadNotifications" :key="item.id" class="notification-item unread">
                <div class="icon-wrapper" :class="item.type.toLowerCase()">
                  <n-icon v-if="item.type === 'SYSTEM'" :component="NotificationsOutline" />
                  <n-icon v-else-if="item.type === 'COMMENT'" :component="ChatbubbleOutline" />
                  <n-icon v-else-if="item.type === 'LIKE'" :component="HeartOutline" />
                  <n-icon v-else :component="InformationCircleOutline" />
                </div>
                <div class="content">
                  <div class="title-row">
                    <span class="title">{{ item.title }}</span>
                    <span class="time">{{ item.timeAgo }}</span>
                  </div>
                  <p class="description">{{ item.content }}</p>
                </div>
                <div class="actions">
                  <n-button
size="tiny"
secondary
type="primary"
@click="markAsRead(item.id)">
                    标为已读
                  </n-button>
                </div>
              </div>
              <n-empty v-if="unreadNotifications.length === 0" description="暂无未读消息" class="mt-8" />
            </div>
          </n-tab-pane>
          <n-tab-pane name="system" tab="系统通知">
            <div class="notification-list">
              <div
                v-for="item in systemNotifications"
                :key="item.id"
                class="notification-item"
                :class="{ unread: !item.isRead }"
              >
                <div class="icon-wrapper system">
                  <n-icon :component="NotificationsOutline" />
                </div>
                <div class="content">
                  <div class="title-row">
                    <span class="title">{{ item.title }}</span>
                    <span class="time">{{ item.timeAgo }}</span>
                  </div>
                  <p class="description">{{ item.content }}</p>
                </div>
              </div>
              <n-empty v-if="systemNotifications.length === 0" description="暂无系统通知" class="mt-8" />
            </div>
          </n-tab-pane>
        </n-tabs>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NotificationsOutline, 
  ChatbubbleOutline, 
  HeartOutline, 
  InformationCircleOutline,
  ArrowBack,
  CheckmarkDone,
  TrashOutline
} from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import * as notificationApi from '@/api/notification'
import type { Notification } from '@/api/notification'

const router = useRouter()
const message = useMessage()

// 消息数据
const notifications = ref<Notification[]>([])
const loading = ref(false)

const allNotifications = computed(() => notifications.value)
const unreadNotifications = computed(() => notifications.value.filter(n => !n.isRead))
const systemNotifications = computed(() => notifications.value.filter(n => n.type === 'SYSTEM'))

/**
 * 获取消息列表
 */
async function fetchNotifications() {
  loading.value = true
  try {
    const res = await notificationApi.getNotifications({ page: 1, size: 100 })
    if (res.data.status === 200) {
      notifications.value = res.data.data.notifications || []
    }
  } catch (error) {
    console.error('获取消息列表失败:', error)
    message.error('获取消息列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 返回控制台
 */
function handleBack() {
  router.push('/dashboard')
}

/**
 * 标记全部已读
 */
async function markAllAsRead() {
  if (notifications.value.every(n => n.isRead)) {
    message.info('没有未读消息')
    return
  }
  try {
    const res = await notificationApi.markAllAsRead()
    if (res.data.status === 200) {
      notifications.value = notifications.value.map(n => ({ ...n, isRead: true }))
      message.success('已全部标记为已读')
    }
  } catch (error) {
    console.error('标记已读失败:', error)
    message.error('操作失败，请稍后重试')
  }
}

/**
 * 删除已读消息
 */
async function clearRead() {
  const unreadCount = notifications.value.filter(n => !n.isRead).length
  if (notifications.value.length === unreadCount) {
    message.info('没有可删除的已读消息')
    return
  }
  try {
    const res = await notificationApi.deleteReadNotifications()
    if (res.data.status === 200) {
      notifications.value = notifications.value.filter(n => !n.isRead)
      message.success('已删除所有已读消息')
    }
  } catch (error) {
    console.error('删除已读消息失败:', error)
    message.error('操作失败，请稍后重试')
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
        message.success('已标记为已读')
      }
    }
  } catch (error) {
    console.error('标记已读失败:', error)
    message.error('操作失败')
  }
}

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped lang="scss">
.notifications-page {
  min-height: 100vh;
  background-color: #ffffff;
  padding-top: 64px;
  padding-bottom: 40px;
}

.page-header {
  background-color: #ffffff;
  padding: 40px 0 24px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .header-left {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .back-btn {
    margin-top: 4px;
  }

  h1 {
    font-size: 32px;
    font-weight: 800;
    margin: 0 0 8px;
    color: #000000;
    letter-spacing: -0.5px;
  }

  .subtitle {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.5);
    margin: 0;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
  }
}

.ml-2 {
  margin-left: 8px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}

.notifications-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 16px;
  color: #999;
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  padding: 24px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s;
  gap: 20px;

  &:last-child {
    border-bottom: none;
  }

  &.unread {
    .title {
      font-weight: 700;
      color: #000;
      &::after {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        background-color: #000;
        border-radius: 50%;
        margin-left: 8px;
        vertical-align: middle;
      }
    }
  }

  .icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 22px;
    background-color: #f5f5f5;
    color: #000;
    transition: all 0.3s ease;
  }
  
  &:hover .icon-wrapper {
    background-color: #000;
    color: #fff;
  }

  .content {
    flex: 1;
    padding-top: 2px;
  }

  .title-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    align-items: flex-start;
  }

  .title {
    font-size: 16px;
    color: #111;
    font-weight: 600;
  }

  .time {
    font-size: 12px;
    color: #999;
    white-space: nowrap;
    margin-left: 12px;
  }

  .description {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin: 0;
  }

  .actions {
    display: flex;
    align-items: center;
    padding-left: 10px;
  }
}

:deep(.n-tabs .n-tabs-nav.n-tabs-nav--line-type .n-tabs-nav-scroll-content) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.n-tabs .n-tabs-tab) {
  padding-bottom: 12px;
}

:deep(.n-button.n-button--primary-type) {
  --n-color: #000 !important;
  --n-color-hover: #333 !important;
  --n-color-pressed: #000 !important;
  --n-border: 1px solid #000 !important;
  --n-border-hover: 1px solid #333 !important;
  --n-border-pressed: 1px solid #000 !important;
  --n-text-color: #fff !important;
  --n-text-color-hover: #fff !important;
  --n-text-color-pressed: #fff !important;
  --n-text-color-focus: #fff !important;
}
</style>
