<template>
  <div class="workbench-view">
    <!-- 全局噪点纹理 -->
    <div class="grain-overlay"></div>

    <div class="workbench-layout">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <!-- 用户信息卡片 -->
        <div class="user-card">
          <img :src="currentUserAvatar" :alt="userStore.userInfo?.username" class="user-avatar" />
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
              <img :src="team.avatarUrl || getTeamAvatar(team.uuid, team.name)" :alt="team.name" class="team-avatar-sm" />
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
import { getCurrentUserAvatar, getTeamAvatar } from '@/utils/avatar'
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

/** 当前用户头像：与顶栏 / 社区 / 个人中心共用同一套生成规则 */
const currentUserAvatar = computed(() =>
  getCurrentUserAvatar(
    userStore.userInfo?.avatar,
    userStore.userInfo?.id,
    userStore.userInfo?.username
  )
)

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
        // 与团队导航、团队详情共用同一套兜底头像
        avatarUrl: team.avatarUrl || getTeamAvatar(team.uuid, team.name)
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
$color-bg: var(--nexus-bg);
$color-white: var(--nexus-white);
$color-black: var(--nexus-accent);
$color-gray-900: var(--nexus-text-primary);
$color-gray-700: var(--nexus-gray-700);
$color-gray-600: var(--nexus-text-tertiary);
$color-gray-500: var(--nexus-text-tertiary);
$color-gray-400: var(--nexus-text-quaternary);
$color-gray-200: var(--nexus-border);
$color-gray-50: var(--nexus-bg-subtle);
$color-danger: var(--nexus-error);

.workbench-view {
  /* 页面滚动模型：与市场 / 社区入口页保持一致，不再自建 100vh 内层滚动壳。
     高度要扣掉全局顶栏，否则「顶栏内边距 + 100vh」会凭空多出 56px 空白滚动条。 */
  min-height: calc(100vh - var(--header-height));
  background: $color-bg;
  position: relative;
}

  .grain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: var(--nexus-z-raised);
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

.workbench-layout {
  display: flex;
  /* 工作台是「操作台」而非内容展示页：采用参考形态的铺满式布局，
     侧栏固定贴左、内容区吃满剩余宽度，不再用居中定宽壳夹出大片空白。 */
  width: 100%;
  margin: 0 auto;
}

/* 内层滚动移除后，改由页面滚动。部分子页（通知 / 设置 / 安全 / 用户管理）自带
   position:sticky 的页头，其 top 需从 0 避让到顶栏高度，否则会滑到全局顶栏下面。
   多带一层 .main-content 是为了压过子组件自身同权重的 .page-header 规则。 */
:deep(.main-content .page-header) {
  top: var(--header-height);
}

// ==================== 侧边栏 ====================
.sidebar {
  width: 272px;
  flex: 0 0 272px;
  background: $color-white;
  display: flex;
  flex-direction: column;
  /* 与社区左栏同一种做法：随页面滚动并吸附在顶栏下方，而非独立固定层 */
  position: sticky;
  top: var(--header-height);
  align-self: flex-start;
  height: calc(100vh - var(--header-height));
  z-index: var(--nexus-z-sticky);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-gray-200;
    border-radius: var(--nexus-radius-sm);
  }
}

// 用户卡片
.user-card {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;

  .user-name {
    font-size: var(--nexus-font-size-lg);
    font-weight: 600;
    color: $color-gray-900;
    margin-bottom: 6px;
  }

  .user-desc {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--nexus-font-size-base);
    color: $color-gray-400;
    cursor: pointer;
    transition: color 0.3s ease;

    &:hover {
      color: $color-gray-600;
    }

    .edit-icon {
      width: 14px;
      height: 14px;
    }
  }
}

// 导航菜单
.sidebar-nav {
  flex: 1;
  padding: 20px 16px;
}

.nav-group {
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 0;
  }
}

.nav-group-title {
  padding: 0 16px;
  margin-bottom: 10px;
  font-size: var(--nexus-font-size-sm);
  font-weight: 500;
  color: $color-gray-400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 16px;
  border-radius: var(--nexus-radius-sm);
  font-size: var(--nexus-font-size-base);
  color: $color-gray-600;
  text-decoration: none;
  transition: color 0.3s ease, background-color 0.3s ease;
  margin-bottom: 4px;
  position: relative;
  cursor: pointer;

  .nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .nav-label {
    flex: 1;
  }

  .nav-badge {
    padding: 3px 9px;
    border-radius: var(--nexus-radius-full);
    font-size: var(--nexus-font-size-xs);
    font-weight: 500;

    &.red {
      background: rgba(239, 68, 68, 0.1);
      color: $color-danger;
    }
  }

  .team-avatar-sm {
    width: 24px;
    height: 24px;
    border-radius: var(--nexus-radius-sm);
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
  min-width: 0;
  background: $color-bg;
}
</style>
