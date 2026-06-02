<template>
  <div class="user-management-view">
    <!-- 页头 -->
    <header class="page-header">
      <div class="header-left">
        <h2 class="page-title">用户管理</h2>
        <span class="page-subtitle">管理平台所有用户信息</span>
      </div>
      <div class="header-right">
        <div class="search-box">
          <Search class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索用户..."
            class="search-input"
            @input="handleSearch"
          />
        </div>
        <button class="filter-btn" @click="showFilter = !showFilter">
          <Filter class="btn-icon" />
          筛选
        </button>
      </div>
    </header>

    <!-- 筛选栏 -->
    <div v-if="showFilter" class="filter-bar">
      <div class="filter-group">
        <label>用户状态</label>
        <select v-model="filterStatus" class="filter-select">
          <option value="">全部</option>
          <option value="active">活跃</option>
          <option value="inactive">未激活</option>
          <option value="banned">已封禁</option>
        </select>
      </div>
      <div class="filter-group">
        <label>注册时间</label>
        <select v-model="filterDate" class="filter-select">
          <option value="">全部</option>
          <option value="today">今天</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
        </select>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="content-area">
      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-value">{{ totalUsers }}</span>
          <span class="stat-label">总用户数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ activeUsers }}</span>
          <span class="stat-label">活跃用户</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ newUsersToday }}</span>
          <span class="stat-label">今日新增</span>
        </div>
      </div>

      <!-- 用户表格 -->
      <div class="table-card">
        <div class="table-header">
          <h3 class="table-title">用户列表</h3>
          <div class="table-actions">
            <button class="action-btn" @click="refreshUsers">
              <RefreshCw class="icon" />
            </button>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>
                  <input v-model="selectAll" type="checkbox" @change="toggleSelectAll" />
                </th>
                <th>用户信息</th>
                <th>邮箱</th>
                <th>状态</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>
                  <input v-model="selectedUsers" type="checkbox" :value="user.id" />
                </td>
                <td>
                  <div class="user-info">
                    <img :src="user.avatar" :alt="user.username" class="user-avatar" />
                    <span class="user-name">{{ user.username }}</span>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <span :class="['status-badge', user.status]">
                    {{ getStatusText(user.status) }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>
                  <div class="action-btns">
                    <button class="action-btn-small" @click="viewUser(user)">
                      <Eye class="icon" />
                    </button>
                    <button class="action-btn-small" @click="editUser(user)">
                      <Edit2 class="icon" />
                    </button>
                    <button class="action-btn-small danger" @click="deleteUser(user)">
                      <Trash2 class="icon" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <button 
            class="page-btn" 
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <ChevronLeft class="icon" />
          </button>
          <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
          <button 
            class="page-btn" 
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <ChevronRight class="icon" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

// ==================== 状态管理 ====================

/** 搜索关键词 */
const searchQuery = ref('')
/** 显示筛选 */
const showFilter = ref(false)
/** 筛选状态 */
const filterStatus = ref('')
/** 筛选日期 */
const filterDate = ref('')
/** 当前页码 */
const currentPage = ref(1)
/** 每页数量 */
const pageSize = 10
/** 选中的用户 */
const selectedUsers = ref<number[]>([])
/** 全选 */
const selectAll = ref(false)

// ==================== 模拟数据 ====================

const totalUsers = ref(1247)
const activeUsers = ref(892)
const newUsersToday = ref(23)

const users = ref([
  { id: 1, username: '张三', email: 'zhangsan@example.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', status: 'active', createdAt: '2024-01-15T08:30:00' },
  { id: 2, username: '李四', email: 'lisi@example.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', status: 'active', createdAt: '2024-01-14T14:20:00' },
  { id: 3, username: '王五', email: 'wangwu@example.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80', status: 'inactive', createdAt: '2024-01-13T09:15:00' },
  { id: 4, username: '赵六', email: 'zhaoliu@example.com', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80', status: 'active', createdAt: '2024-01-12T16:45:00' },
  { id: 5, username: '钱七', email: 'qianqi@example.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80', status: 'banned', createdAt: '2024-01-11T11:30:00' },
  { id: 6, username: '孙八', email: 'sunba@example.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80', status: 'active', createdAt: '2024-01-10T13:20:00' },
  { id: 7, username: '周九', email: 'zhoujiu@example.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80', status: 'active', createdAt: '2024-01-09T10:10:00' },
  { id: 8, username: '吴十', email: 'wushi@example.com', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80', status: 'inactive', createdAt: '2024-01-08T15:30:00' }
])

// ==================== 计算属性 ====================

/** 过滤后的用户 */
const filteredUsers = computed(() => {
  let result = users.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  }

  // 状态过滤
  if (filterStatus.value) {
    result = result.filter(user => user.status === filterStatus.value)
  }

  return result
})

/** 总页数 */
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize))

// ==================== 方法 ====================

/**
 * 获取状态文本
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    active: '活跃',
    inactive: '未激活',
    banned: '已封禁'
  }
  return statusMap[status] || status
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

/**
 * 搜索处理
 */
function handleSearch() {
  currentPage.value = 1
}

/**
 * 刷新用户列表
 */
function refreshUsers() {
  console.log('刷新用户列表')
}

/**
 * 查看用户
 */
function viewUser(user: any) {
  console.log('查看用户:', user)
}

/**
 * 编辑用户
 */
function editUser(user: any) {
  console.log('编辑用户:', user)
}

/**
 * 删除用户
 */
function deleteUser(user: any) {
  console.log('删除用户:', user)
}

/**
 * 切换全选
 */
function toggleSelectAll() {
  if (selectAll.value) {
    selectedUsers.value = filteredUsers.value.map(u => u.id)
  } else {
    selectedUsers.value = []
  }
}
</script>

<style scoped lang="scss">
$color-bg: #fafafa;
$color-white: #ffffff;
$color-black: #000000;
$color-gray-900: #111827;
$color-gray-600: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-200: #e5e7eb;
$color-gray-100: #f3f4f6;
$color-gray-50: #f9fafb;
$color-success: #10b981;
$color-warning: #f59e0b;
$color-danger: #ef4444;

.user-management-view {
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

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: $color-gray-400;
  }

  .search-input {
    width: 240px;
    padding: 8px 16px 8px 40px;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: 8px;
    font-size: 14px;
    color: $color-gray-900;

    &::placeholder {
      color: $color-gray-400;
    }

    &:focus {
      outline: none;
      border-color: $color-black;
    }
  }
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: $color-white;
  border: 1px solid $color-gray-200;
  border-radius: 8px;
  font-size: 14px;
  color: $color-gray-600;
  cursor: pointer;

  .btn-icon {
    width: 16px;
    height: 16px;
  }
}

.filter-bar {
  display: flex;
  gap: 24px;
  padding: 16px 32px;
  background: $color-white;
  border-bottom: 1px solid $color-gray-200;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    font-size: 14px;
    color: $color-gray-600;
  }
}

.filter-select {
  padding: 6px 12px;
  background: $color-white;
  border: 1px solid $color-gray-200;
  border-radius: 6px;
  font-size: 14px;
  color: $color-gray-900;
}

.content-area {
  padding: 32px;
  max-width: 1280px;
  margin: 0 auto;
}

// 统计行
.stats-row {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: $color-gray-900;
}

.stat-label {
  font-size: 13px;
  color: $color-gray-400;
}

// 表格卡片
.table-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: $color-gray-900;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: $color-gray-100;
  }

  .icon {
    width: 16px;
    height: 16px;
    color: $color-gray-600;
  }
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 16px;
    text-align: left;
    border-bottom: 1px solid $color-gray-100;
  }

  th {
    font-size: 12px;
    font-weight: 500;
    color: $color-gray-400;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td {
    font-size: 14px;
    color: $color-gray-600;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 500;
  color: $color-gray-900;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;

  &.active {
    background: rgba(16, 185, 129, 0.1);
    color: $color-success;
  }

  &.inactive {
    background: $color-gray-100;
    color: $color-gray-600;
  }

  &.banned {
    background: rgba(239, 68, 68, 0.1);
    color: $color-danger;
  }
}

.action-btns {
  display: flex;
  gap: 8px;
}

.action-btn-small {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: $color-gray-100;
  }

  &.danger:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .icon {
    width: 14px;
    height: 14px;
    color: $color-gray-600;
  }

  &.danger .icon {
    color: $color-danger;
  }
}

// 分页
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-white;
  border: 1px solid $color-gray-200;
  border-radius: 8px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon {
    width: 16px;
    height: 16px;
    color: $color-gray-600;
  }
}

.page-info {
  font-size: 14px;
  color: $color-gray-600;
}
</style>
