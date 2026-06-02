<template>
  <div class="workbench-view">
    <!-- 全局噪点纹理 -->
    <div class="grain-overlay"></div>

    <div class="workbench-layout">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <!-- 用户信息卡片 -->
        <div class="user-card">
          <img :src="userStore.userInfo?.avatar || defaultAvatar" :alt="userStore.userInfo?.username" class="user-avatar" />
          <div class="user-info">
            <h3 class="user-name">{{ userStore.userInfo?.username || '无迹尘' }}</h3>
            <p class="user-desc" @click="$router.push('/workbench/settings')">
              <Edit3 class="edit-icon" />
              添加个人描述
            </p>
          </div>
        </div>

        <!-- 导航菜单 -->
        <nav class="sidebar-nav">
          <!-- 工作分组 -->
          <div class="nav-group">
            <div class="nav-group-title">工作</div>
            <router-link
              v-for="item in workMenu"
              :key="item.path"
              :to="item.path"
              :class="['nav-item', { active: isActive(item.path) }]"
            >
              <component :is="item.icon" class="nav-icon" />
              <span class="nav-label">{{ item.label }}</span>
            </router-link>
          </div>

          <!-- 团队分组 -->
          <div class="nav-group">
            <div class="nav-group-title">团队</div>
            <router-link
              v-for="(team, index) in teamList"
              :key="index"
              :to="`/workbench/team/${team.uuid}`"
              :class="['nav-item', { active: isTeamActive(team.uuid) }]"
            >
              <img :src="team.avatarUrl || defaultTeamAvatar" :alt="team.name" class="team-avatar-sm" />
              <span class="nav-label">{{ team.name }}</span>
            </router-link>
            <button class="nav-item create-team" @click="openCreateTeamModal">
              <Plus class="nav-icon" />
              <span class="nav-label">创建团队</span>
            </button>
          </div>

          <!-- 个人分组 -->
          <div class="nav-group">
            <div class="nav-group-title">个人</div>
            <router-link
              v-for="item in personalMenu"
              :key="item.path"
              :to="item.path"
              :class="['nav-item', { active: isActive(item.path) }]"
            >
              <component :is="item.icon" class="nav-icon" />
              <span class="nav-label">{{ item.label }}</span>
              <span v-if="item.badge" :class="['nav-badge', item.badgeClass]">
                {{ item.badge }}
              </span>
            </router-link>
          </div>
        </nav>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <router-view />
      </main>
    </div>

    <!-- 创建团队弹窗 -->
    <n-modal
v-model:show="showCreateTeamModal"
preset="card"
title="创建团队"
style="width: 480px">
      <n-form
        ref="createTeamFormRef"
        :model="createTeamForm"
        :rules="createTeamRules"
        label-placement="left"
        label-width="80px"
      >
        <n-form-item label="团队名称" path="name">
          <n-input
            v-model:value="createTeamForm.name"
            placeholder="请输入团队名称"
            maxlength="50"
            show-count
          />
        </n-form-item>
        <n-form-item label="团队描述" path="description">
          <n-input
            v-model:value="createTeamForm.description"
            type="textarea"
            placeholder="请输入团队描述（可选）"
            maxlength="200"
            show-count
            :rows="3"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateTeamModal = false">取消</n-button>
          <n-button type="primary" :loading="creatingTeam" @click="handleCreateTeam">创建</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { getMyTeams, createCollaborationTeam } from '@/api/team'
import { getUnreadCount } from '@/api/notification'
import type { Team } from '@/api/types'
import type { FormInst, FormRules } from 'naive-ui'
import {
  Clock,
  FolderOpen,
  Bell,
  Settings,
  Shield,
  Plus,
  Edit3
} from 'lucide-vue-next'
import { useMessage } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const message = useMessage()

const defaultAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80'
const defaultTeamAvatar = 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&q=80'

// 创建团队弹窗相关
const showCreateTeamModal = ref(false)
const createTeamFormRef = ref<FormInst | null>(null)
const creatingTeam = ref(false)
const createTeamForm = reactive({
  name: '',
  description: ''
})
const createTeamRules: FormRules = {
  name: [
    { required: true, message: '请输入团队名称', trigger: 'blur' },
    { min: 2, max: 50, message: '团队名称长度应为 2-50 个字符', trigger: 'blur' }
  ]
}

// 打开创建团队弹窗
function openCreateTeamModal() {
  createTeamForm.name = ''
  createTeamForm.description = ''
  showCreateTeamModal.value = true
}

// 创建团队
async function handleCreateTeam() {
  try {
    await createTeamFormRef.value?.validate()
  } catch {
    return
  }

  creatingTeam.value = true
  try {
    const res = await createCollaborationTeam({
      name: createTeamForm.name.trim(),
      description: createTeamForm.description.trim() || undefined
    })

    if (res.data.status === 201) {
      message.success('团队创建成功')
      showCreateTeamModal.value = false
      // 刷新团队列表
      await fetchMyTeams()
      // 跳转到新创建的团队页面
      const teamUuid = res.data.data?.team?.uuid
      if (teamUuid) {
        router.push(`/workbench/team/${teamUuid}`)
      }
    } else {
      message.error(res.data.message || '创建失败')
    }
  } catch (error: any) {
    console.error('创建团队失败:', error)
    // 优先使用服务器返回的错误信息
    const serverMessage = error?.response?.data?.message
    const serverStatus = error?.response?.data?.status
    if (serverMessage) {
      // 根据状态码提供更具体的错误提示
      if (serverStatus === 409) {
        message.error('团队名称已存在，请使用其他名称')
      } else {
        message.error(serverMessage)
      }
    } else {
      message.error('创建团队失败，请稍后重试')
    }
  } finally {
    creatingTeam.value = false
  }
}

// 工作菜单
const workMenu = [
  { path: '/workbench/recent', label: '最近打开', icon: Clock },
  { path: '/workbench/projects', label: '所有项目', icon: FolderOpen }
]

// 团队列表（从后端获取）
const teamList = ref<Team[]>([])
const loadingTeams = ref(false)

// 未读通知数量
const unreadCount = ref(0)

/**
 * 获取未读通知数量
 */
async function fetchUnreadCount() {
  try {
    const res = await getUnreadCount()
    if (res.data?.status === 200) {
      unreadCount.value = res.data.data?.count || 0
    }
  } catch (error) {
    console.error('获取未读通知数量失败:', error)
  }
}

/**
 * 获取我的团队列表
 */
async function fetchMyTeams() {
  loadingTeams.value = true
  try {
    const res = await getMyTeams({ page: 1, size: 20 })
    if (res.data.status === 200) {
      // 后端返回的是 Team[]，需要映射到前端需要的格式
      const teams = res.data.data?.teams || []
      teamList.value = teams.map(team => ({
        ...team,
        // 确保有 avatarUrl 字段
        avatarUrl: team.avatarUrl || defaultTeamAvatar
      }))
    }
  } catch (error) {
    console.error('获取团队列表失败:', error)
  } finally {
    loadingTeams.value = false
  }
}

// 页面加载时获取团队列表和未读通知数量
onMounted(() => {
  fetchMyTeams()
  fetchUnreadCount()
})

// 个人菜单（使用计算属性动态显示未读数量）
const personalMenu = computed(() => [
  { 
    path: '/workbench/notifications', 
    label: '通知中心', 
    icon: Bell, 
    badge: unreadCount.value > 0 ? String(unreadCount.value) : undefined, 
    badgeClass: 'red' 
  },
  { path: '/workbench/settings', label: '账户设置', icon: Settings },
  { path: '/workbench/security', label: '安全记录', icon: Shield }
])

// 判断是否激活
function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}

function isTeamActive(uuid: string): boolean {
  return route.path.includes(`/workbench/team/${uuid}`)
}


</script>

<style scoped lang="scss">
$color-bg: #fafafa;
$color-white: #ffffff;
$color-black: #000000;
$color-gray-900: #111827;
$color-gray-700: #374151;
$color-gray-600: #6b7280;
$color-gray-500: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-200: #e5e7eb;
$color-gray-100: #f3f4f6;
$color-gray-50: #f9fafb;
$color-danger: #ef4444;

.workbench-view {
  height: 100vh;
  background: $color-bg;
  position: relative;
  overflow: hidden;
}

  .grain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

.workbench-layout {
  display: flex;
  height: 100vh;
}

// ==================== 侧边栏 ====================
.sidebar {
  width: 240px;
  background: $color-white;
  border-right: 1px solid $color-gray-200;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  position: fixed;
  left: 0;
  top: 56px;
  z-index: 10;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-gray-200;
    border-radius: 2px;
  }
}

// 用户卡片
.user-card {
  padding: 20px 16px;
  border-bottom: 1px solid $color-gray-100;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;

  .user-name {
    font-size: 16px;
    font-weight: 600;
    color: $color-gray-900;
    margin-bottom: 4px;
  }

  .user-desc {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: $color-gray-400;
    cursor: pointer;
    transition: color 0.3s ease;

    &:hover {
      color: $color-gray-600;
    }

    .edit-icon {
      width: 12px;
      height: 12px;
    }
  }
}

// 导航菜单
.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
}

.nav-group {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.nav-group-title {
  padding: 0 12px;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 500;
  color: $color-gray-400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: $color-gray-600;
  text-decoration: none;
  transition: all 0.3s ease;
  margin-bottom: 4px;
  position: relative;
  cursor: pointer;

  .nav-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .nav-label {
    flex: 1;
  }

  .nav-badge {
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 500;

    &.red {
      background: rgba(239, 68, 68, 0.1);
      color: $color-danger;
    }
  }

  .team-avatar-sm {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  &:hover {
    color: $color-gray-900;
    background: $color-gray-50;
  }

  &.active {
    color: $color-gray-900;
    background: rgba(0, 0, 0, 0.03);
    font-weight: 500;
  }

  &.create-team {
    background: transparent;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: left;

    &:hover {
      color: $color-gray-900;
      background: $color-gray-50;
    }
  }
}

// ==================== 主内容区 ====================
.main-content {
  flex: 1;
  margin-left: 240px;
  min-height: calc(100vh - 56px);
  overflow-y: auto;
  background: $color-bg;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-gray-200;
    border-radius: 3px;
  }
}
</style>
