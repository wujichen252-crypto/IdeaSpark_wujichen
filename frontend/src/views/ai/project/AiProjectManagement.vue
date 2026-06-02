<template>
  <div class="project-management-container">
    <n-layout has-sider class="full-height">
      <!-- 左侧侧边栏 -->
      <n-layout-sider
        bordered
        width="240"
        :native-scrollbar="false"
        class="management-sider"
      >
        <div class="sider-content">
          <!-- 返回按钮区 -->
          <div class="back-section">
            <n-button text class="back-btn" @click="handleBack">
              <template #icon>
                <n-icon size="18"><ArrowBack /></n-icon>
              </template>
              返回工坊列表
            </n-button>
          </div>

          <!-- 项目信息区 -->
          <div class="project-profile">
            <div class="project-avatar">
              <n-avatar
                :size="48"
                :style="{ backgroundColor: stringToColor(projectInfo.name || 'P') }"
              >
                {{ (projectInfo.name || 'P')[0] }}
              </n-avatar>
            </div>
            <h2 class="project-name">{{ projectInfo.name }}</h2>
            <div class="project-status">
              <n-tag
type="success"
size="small"
round
bordered>
                <template #icon><n-icon><RadioButtonOn /></n-icon></template>
                执行中
              </n-tag>
            </div>
          </div>

          <!-- 导航菜单 -->
          <div class="nav-menu">
            <n-menu
              v-model:value="activeKey"
              :options="menuOptions"
              :indent="24"
            />
          </div>
        </div>
      </n-layout-sider>

      <!-- 右侧主要内容区 -->
      <n-layout-content class="main-content">
        <!-- 顶部通栏 -->
        <div class="content-header">
          <div class="header-title">
            <h2>{{ currentTitle }}</h2>
            <span class="subtitle">{{ currentSubtitle }}</span>
          </div>
          <div class="header-actions">
            <!-- 团队头像组 -->
            <div class="team-avatars mr-4">
              <n-avatar-group :options="teamAvatars" :size="32" :max="3" />
            </div>
            <!-- 邀请按钮 -->
            <n-button
type="primary"
secondary
round
@click="showInviteModal = true">
              <template #icon><n-icon><PersonAddOutline /></n-icon></template>
              邀请成员
            </n-button>
            <n-divider vertical />
            <n-button circle secondary>
              <template #icon><n-icon><SettingsOutline /></n-icon></template>
            </n-button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="content-body custom-scrollbar">
<!-- 1. 任务看板 -->
          <div v-if="activeKey === 'board'" class="view-wrapper board-view">
            <AiProjectBoard />
          </div>

          <!-- 2. 项目概览 -->
          <div v-if="activeKey === 'overview'" class="view-wrapper overview-view">
            <div class="stats-grid">
              <n-card size="small" class="stat-card">
                <div class="stat-label">总体进度</div>
                <div class="stat-value">
                  <n-progress type="line" :percentage="projectInfo.progress || 0" indicator-placement="inside" />
                </div>
              </n-card>
              <n-card size="small" class="stat-card">
                <div class="stat-label">待办任务</div>
                <div class="stat-value number">{{ pendingTasksCount }}</div>
              </n-card>
              <n-card size="small" class="stat-card">
                <div class="stat-label">团队规模</div>
                <div class="stat-value number">{{ projectInfo.team?.length || 0 }}</div>
              </n-card>
            </div>

            <div class="detail-grid mt-6">
              <n-card title="项目描述" size="medium" class="desc-card">
                <div class="html-content">{{ projectDescriptionText }}</div>
              </n-card>
              
              <div class="right-col">
                <n-card size="medium" class="message-card mb-4">
                  <template #header>
                    <div class="flex items-center gap-2">
                      <n-icon color="#18a058"><ChatbubbleEllipsesOutline /></n-icon>
                      <span>开发者寄语</span>
                    </div>
                  </template>
                  <p class="message-text">{{ projectInfo.developerMessage || '暂无寄语' }}</p>
                </n-card>

                <n-card title="项目公告" size="medium">
                  <n-timeline>
                    <n-timeline-item
                      v-for="item in projectInfo.announcements"
                      :key="item.id"
                      type="info"
                      :title="item.title"
                      :content="item.content"
                      :time="new Date(item.date).toLocaleDateString()"
                    />
                    <n-timeline-item v-if="!projectInfo.announcements?.length" content="暂无最新公告" />
                  </n-timeline>
                </n-card>
              </div>
            </div>
          </div>

          <!-- 3. 团队成员 -->
          <div v-if="activeKey === 'team'" class="view-wrapper team-view">
             <div class="team-list-container">
               <n-list bordered clickable>
                 <n-list-item v-for="member in projectInfo.team" :key="member.id">
                   <template #prefix>
                     <n-avatar round size="large" :src="member.avatar || undefined">
                        {{ member.name[0] }}
                     </n-avatar>
                   </template>
                   <div class="member-info">
                     <div class="name">{{ member.name }}</div>
                     <div class="role-tags mt-1">
                       <n-tag size="small" :type="member.role === 'owner' ? 'success' : 'default'">
                         {{ member.role === 'owner' ? '项目负责人' : '成员' }}
                       </n-tag>
                     </div>
                   </div>
                   <template #suffix>
                     <div v-if="member.id !== 'me'" class="actions">
                       <n-button size="small" type="error" secondary>移除</n-button>
                     </div>
                   </template>
                 </n-list-item>
               </n-list>
             </div>
          </div>

          <!-- 4. 设置 -->
          <div v-if="activeKey === 'settings'" class="view-wrapper settings-view">
            <AiProjectSettings embedded />
          </div>
</div>
      </n-layout-content>
    </n-layout>

    <!-- 邀请弹窗 -->
    <n-modal
v-model:show="showInviteModal"
preset="card"
title="邀请新成员"
style="width: 400px">
      <div class="p-4">
        <p class="mb-2 text-gray-500">通过邮箱邀请成员加入项目协作</p>
        <n-input placeholder="user@example.com" size="large">
          <template #prefix><n-icon><MailOutline /></n-icon></template>
        </n-input>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <n-button @click="showInviteModal = false">取消</n-button>
          <n-button type="primary" @click="showInviteModal = false">发送邀请</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAiWorkshopStore } from '@/store/modules/aiWorkshop'
import { 
  ArrowBack, 
  GridOutline, 
  StatsChartOutline, 
  PeopleOutline, 
  SettingsOutline,
  RadioButtonOn,
  PersonAddOutline,
  ChatbubbleEllipsesOutline,
  MailOutline
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { defineAsyncComponent } from 'vue'

/**
 * 异步加载子组件，避免循环依赖导致模块初始化顺序错误
 */
const AiProjectBoard = defineAsyncComponent(() => import('./AiProjectBoard.vue'))
const AiProjectSettings = defineAsyncComponent(() => import('./AiProjectSettings.vue'))

const router = useRouter()
const store = useAiWorkshopStore()
const { projectInfo, modules } = storeToRefs(store)

const activeKey = ref('board')
const showInviteModal = ref(false)

// 辅助函数：根据字符串生成颜色
const stringToColor = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase()
  return '#' + '00000'.substring(0, 6 - c.length) + c
}

const handleBack = () => {
  router.push('/ai/workshop')
}

// 菜单配置
const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const htmlToText = (html: string) => {
  const normalized = (html || '')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n')
    .replace(/<\/\s*div\s*>/gi, '\n')
  return normalized.replace(/<[^>]*>/g, '')
}

const projectDescriptionText = computed(() => {
  const raw = projectInfo.value.detailedDescription || ''
  const text = htmlToText(raw)
  return text.trim().length > 0 ? text : '暂无详细描述'
})

const menuOptions = [
  {
    label: '任务看板',
    key: 'board',
    icon: renderIcon(GridOutline)
  },
  {
    label: '项目概览',
    key: 'overview',
    icon: renderIcon(StatsChartOutline)
  },
  {
    label: '团队成员',
    key: 'team',
    icon: renderIcon(PeopleOutline)
  },
  {
    label: '项目设置',
    key: 'settings',
    icon: renderIcon(SettingsOutline)
  }
]

// 计算属性
const currentTitle = computed(() => {
  const map: Record<string, string> = {
    board: '任务看板',
    overview: '项目概览',
    team: '团队管理',
    settings: '项目设置'
  }
  return map[activeKey.value] || '项目管理'
})

const currentSubtitle = computed(() => {
  const map: Record<string, string> = {
    board: '全生命周期任务流转与状态追踪',
    overview: '项目进度、健康度与关键指标',
    team: '协作成员权限与角色管理',
    settings: '项目基础信息与偏好设置'
  }
  return map[activeKey.value] || ''
})

const teamAvatars = computed(() => {
  return (projectInfo.value.team || []).map(m => ({
    name: m.name,
    src: m.avatar
  }))
})

const pendingTasksCount = computed(() => {
  let count = 0
  Object.values(modules.value).forEach(m => {
    count += m.checklist.filter(t => !t.completed).length
  })
  return count
})
</script>

<style scoped lang="scss">
.project-management-container {
  height: 100vh;
  width: 100%;
  background-color: #f5f7fa;
}

.full-height {
  height: 100%;
}

.management-sider {
  background-color: #fff;
  box-shadow: 1px 0 5px rgba(0,0,0,0.05);
  z-index: 10;
  
  .sider-content {
    padding: 24px 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .back-section {
    padding: 0 20px;
    margin-bottom: 24px;
    
    .back-btn {
      color: #666;
      &:hover {
        color: #18a058;
      }
    }
  }
  
  .project-profile {
    padding: 0 24px;
    margin-bottom: 32px;
    
    .project-name {
      margin: 16px 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.main-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f9fafb;
}

.content-header {
  padding: 24px 32px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  
  .header-title {
    h2 {
      margin: 0;
      font-size: 20px;
      color: #1f2937;
    }
    .subtitle {
      font-size: 13px;
      color: #9ca3af;
      margin-top: 4px;
      display: block;
    }
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}

.content-body {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  
  .view-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    height: 100%;
  }
}

// 概览页样式
.overview-view {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    
    .stat-card {
      .stat-label {
        color: #6b7280;
        font-size: 13px;
        margin-bottom: 8px;
      }
      .stat-value {
        &.number {
          font-size: 28px;
          font-weight: bold;
          color: #111827;
        }
      }
    }
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
  }
  
  .message-card {
    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
    .message-text {
      font-style: italic;
      color: #374151;
      line-height: 1.6;
    }
  }
}

// 团队页样式
.team-view {
  .team-list-container {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    border: 1px solid #eee;
    
    .member-info {
      margin-left: 12px;
      .name {
        font-weight: 500;
        font-size: 16px;
      }
    }
  }
}

// 任务看板容器调整
.board-view {
  // 让看板充满高度
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mr-4 { margin-right: 16px; }
.mt-1 { margin-top: 4px; }
.mt-6 { margin-top: 24px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
