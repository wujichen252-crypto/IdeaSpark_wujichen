<template>
  <div class="ai-sidebar">
    <div class="sidebar-header">
      <n-button
block
type="primary"
dashed
class="new-chat-btn"
@click="handleNewChat">
        <template #icon>
          <n-icon><Add /></n-icon>
        </template>
        开启新对话
      </n-button>
    </div>
    
    <div class="session-list">
      <div v-if="chatStore.sessions.length > 0" class="list-title">近期记录</div>
      <n-scrollbar>
        <div 
          v-for="session in chatStore.sessions" 
          :key="session.id"
          class="session-item"
          :class="{ active: session.id === chatStore.currentSessionId }"
          @click="chatStore.switchSession(session.id)"
        >
          <n-icon class="item-icon"><ChatbubbleEllipsesOutline /></n-icon>
          <div class="item-content">
            <div class="item-title">{{ session.title }}</div>
            <div class="item-date">{{ formatDate(session.lastUpdated) }}</div>
          </div>
          <div class="item-actions" @click.stop>
            <n-popconfirm @positive-click="chatStore.deleteSession(session.id)">
              <template #trigger>
                <n-button text size="tiny" class="delete-btn">
                  <n-icon><TrashOutline /></n-icon>
                </n-button>
              </template>
              确认删除此对话吗？
            </n-popconfirm>
          </div>
        </div>
      </n-scrollbar>
    </div>

    <div class="sidebar-footer">
      <div v-if="userStore.userInfo" class="user-info">
        <n-avatar round size="small" :src="userStore.userInfo.avatar" />
        <span class="username">{{ userStore.userInfo.username }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '@/store/chat'
import { useUserStore } from '@/store'
import { Add, ChatbubbleEllipsesOutline, TrashOutline } from '@vicons/ionicons5'

const chatStore = useChatStore()
const userStore = useUserStore()

function handleNewChat() {
  chatStore.createSession()
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
</script>

<style scoped lang="scss">
.ai-sidebar {
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa; // Light gray for sidebar
  border-right: 1px solid rgba(0,0,0,0.06);

  .sidebar-header {
    padding: 20px;
    
    .new-chat-btn {
      height: 44px;
      font-size: 15px;
      font-weight: 500;
      border-radius: 12px;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(74, 222, 128, 0.2);
      }
    }
  }

  .session-list {
    flex: 1;
    overflow: hidden;
    padding: 0 12px;

    .list-title {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 8px;
      padding-left: 8px;
    }

    .session-item {
      display: flex;
      align-items: center;
      padding: 12px;
      margin-bottom: 4px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      border: 1px solid transparent;

      &:hover {
        background-color: #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        
        .item-actions {
          opacity: 1;
        }
      }

      &.active {
        background-color: #fff;
        border-color: rgba(74, 222, 128, 0.3);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        
        .item-icon {
          color: #4ade80;
        }
        
        .item-title {
          font-weight: 600;
          color: #111827;
        }
      }

      .item-icon {
        font-size: 18px;
        color: #9ca3af;
        margin-right: 12px;
      }

      .item-content {
        flex: 1;
        overflow: hidden;
        
        .item-title {
          font-size: 14px;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }
        
        .item-date {
          font-size: 11px;
          color: #9ca3af;
        }
      }

      .item-actions {
        opacity: 0;
        transition: opacity 0.2s;
        
        .delete-btn {
          color: #ef4444;
          &:hover {
            background-color: rgba(239, 68, 68, 0.1);
          }
        }
      }
    }
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(0,0,0,0.06);
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .username {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }
    }
  }
}
</style>
