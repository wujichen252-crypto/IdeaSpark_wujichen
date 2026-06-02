<template>
  <div class="workbench-home">
    <!-- 粘性页头 -->
    <header class="sticky-header">
      <div class="header-left">
        <p class="header-date">{{ currentDate }}</p>
        <h1 class="header-greeting">{{ greeting }}, {{ userStore.userInfo?.username || '创造者' }}</h1>
      </div>
      <div class="header-right">
        <div class="focus-mode">
          <Zap class="focus-icon" />
          <span class="focus-label">专注模式</span>
          <label class="toggle-switch">
            <input v-model="focusMode" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <button class="icon-btn" @click="$router.push('/notifications')">
          <Bell class="icon" />
          <span class="notification-dot"></span>
        </button>
      </div>
    </header>

    <!-- 内容容器 -->
    <div class="content-container">
      <!-- 顶部区域：计时器 + 概览 -->
      <div class="top-section">
        <!-- 专注计时器 -->
        <div class="timer-card glass-panel" :style="{ animationDelay: '0.1s' }">
          <div class="timer-decoration"></div>
          <div class="timer-content">
            <p class="timer-label">当前专注</p>
            <div class="timer-circle-wrap">
              <svg class="timer-svg" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#f3f4f6"
                  stroke-width="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#000000"
                  stroke-width="3"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="timerOffset"
                  stroke-linecap="round"
                  class="timer-progress"
                />
              </svg>
              <div class="timer-display">
                <span class="timer-time">{{ formattedTime }}</span>
                <span class="timer-unit">分钟</span>
              </div>
            </div>
            <div class="timer-controls">
              <button class="control-btn primary" @click="toggleTimer">
                <Play v-if="!timerRunning" class="control-icon play" />
                <Pause v-else class="control-icon" />
              </button>
              <button class="control-btn" @click="resetTimer">
                <RotateCcw class="control-icon" />
              </button>
              <button class="control-btn" @click="skipTimer">
                <SkipForward class="control-icon" />
              </button>
            </div>
          </div>
        </div>

        <!-- 今日概览 -->
        <div class="overview-card glass-panel" :style="{ animationDelay: '0.2s' }">
          <div class="overview-header">
            <div>
              <h2 class="overview-title">今日概览</h2>
              <p class="overview-subtitle">你还有 {{ pendingTasks }} 个任务待完成</p>
            </div>
            <div class="overview-percent">
              <span class="percent-value">{{ completionRate }}</span>
              <span class="percent-label">完成度</span>
            </div>
          </div>

          <div class="progress-list">
            <div class="progress-item">
              <div class="progress-header">
                <span class="progress-label">任务进度</span>
                <span class="progress-value">{{ completedTasks }}/{{ totalTasks }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill black" :style="{ width: taskProgress + '%' }"></div>
              </div>
            </div>

            <div class="progress-item">
              <div class="progress-header">
                <span class="progress-label">专注时间</span>
                <span class="progress-value">{{ focusTime }}/{{ targetFocusTime }} 小时</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill gray" :style="{ width: focusProgress + '%' }"></div>
              </div>
            </div>

            <div class="progress-item">
              <div class="progress-header">
                <span class="progress-label">项目推进</span>
                <span class="progress-value">{{ milestones }}/{{ totalMilestones }} 里程碑</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill light" :style="{ width: milestoneProgress + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="overview-footer">
            <div class="team-avatars">
              <img
                v-for="(member, idx) in teamMembers.slice(0, 3)"
                :key="idx"
                :src="member.avatar"
                :alt="member.name"
                class="team-avatar"
              />
              <div v-if="teamMembers.length > 3" class="team-avatar more">
                +{{ teamMembers.length - 3 }}
              </div>
            </div>
            <button class="view-detail-btn">
              查看详情
              <ArrowRight class="btn-icon" />
            </button>
          </div>
        </div>
      </div>

      <!-- 中间区域：待办 + 日历 -->
      <div class="middle-section">
        <!-- 待办事项 -->
        <div class="tasks-section">
          <div class="section-header" :style="{ animationDelay: '0.3s' }">
            <h2 class="section-title">待办事项</h2>
            <div class="filter-tabs">
              <button
                v-for="tab in taskTabs"
                :key="tab.value"
                :class="['filter-tab', { active: taskFilter === tab.value }]"
                @click="taskFilter = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="task-list">
            <div
              v-for="(task, index) in filteredTasks"
              :key="task.id"
              :class="['task-card glass-panel', `priority-${task.priority}`, { completed: task.completed }]"
              :style="{ animationDelay: `${0.4 + index * 0.1}s` }"
              draggable="true"
              @click="toggleTask(task)"
            >
              <div class="task-content">
                <div :class="['task-checkbox', { checked: task.completed }]">
                  <Check v-if="task.completed" class="check-icon" />
                </div>
                <div class="task-body">
                  <div class="task-header">
                    <h3 class="task-title">{{ task.title }}</h3>
                    <span :class="['priority-badge', task.priority]">
                      {{ priorityLabels[task.priority] }}
                    </span>
                  </div>
                  <p class="task-desc">{{ task.description }}</p>
                  <div class="task-meta">
                    <span class="meta-item">
                      <Clock class="meta-icon" />
                      {{ task.time }}
                    </span>
                    <span v-if="task.comments" class="meta-item">
                      <MessageCircle class="meta-icon" />
                      {{ task.comments }} 条评论
                    </span>
                    <span v-if="task.assignee" class="meta-item">
                      <img :src="task.assignee.avatar" :alt="task.assignee.name" class="assignee-avatar" />
                      指派给 {{ task.assignee.name }}
                    </span>
                  </div>
                </div>
                <button class="task-more" @click.stop>
                  <MoreVertical class="more-icon" />
                </button>
              </div>
            </div>
          </div>

          <button class="add-task-btn" :style="{ animationDelay: '0.8s' }" @click="showAddTask = true">
            <Plus class="btn-icon" />
            添加新任务
          </button>
        </div>

        <!-- 迷你日历 -->
        <div class="calendar-card glass-panel" :style="{ animationDelay: '0.4s' }">
          <div class="calendar-header">
            <h3 class="calendar-title">{{ calendarMonth }}</h3>
            <div class="calendar-nav">
              <button class="nav-arrow" @click="prevMonth">
                <ChevronLeft class="arrow-icon" />
              </button>
              <button class="nav-arrow" @click="nextMonth">
                <ChevronRight class="arrow-icon" />
              </button>
            </div>
          </div>

          <div class="calendar-weekdays">
            <span v-for="day in weekdays" :key="day" class="weekday">{{ day }}</span>
          </div>

          <div class="calendar-grid">
            <button
              v-for="(day, idx) in calendarDays"
              :key="idx"
              :class="['calendar-day', { empty: !day.day, active: day.isToday, 'has-event': day.hasEvent }]"
              :disabled="!day.day"
            >
              {{ day.day }}
            </button>
          </div>

          <div class="calendar-events">
            <p class="events-title">今日日程</p>
            <div class="event-list">
              <div v-for="event in todayEvents" :key="event.id" class="event-item">
                <span class="event-time">{{ event.time }}</span>
                <div :class="['event-card', event.type]">
                  <p class="event-name">{{ event.name }}</p>
                  <p class="event-info">{{ event.info }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部区域：快捷访问 -->
      <div class="bottom-section">
        <!-- 最近文件 -->
        <div class="files-card glass-panel" :style="{ animationDelay: '0.9s' }">
          <div class="card-header">
            <h3 class="card-title">最近文件</h3>
            <button class="view-all">查看全部</button>
          </div>
          <div class="files-list">
            <div
              v-for="file in recentFiles"
              :key="file.name"
              class="file-item"
            >
              <div :class="['file-icon', file.type]">
                <component :is="file.icon" class="icon" />
              </div>
              <div class="file-info">
                <p class="file-name">{{ file.name }}</p>
                <p class="file-time">{{ file.time }}</p>
              </div>
              <ArrowRight class="file-arrow" />
            </div>
          </div>
        </div>

        <!-- 快速备忘 -->
        <div class="notes-card glass-panel" :style="{ animationDelay: '1.0s' }">
          <div class="card-header">
            <h3 class="card-title">快速备忘</h3>
            <button class="edit-btn">
              <Edit3 class="edit-icon" />
            </button>
          </div>
          <div class="note-paper" contenteditable="true" v-html="noteContent"></div>
        </div>

        <!-- 团队动态 -->
        <div class="activity-card glass-panel" :style="{ animationDelay: '1.1s' }">
          <div class="card-header">
            <h3 class="card-title">团队动态</h3>
            <div class="team-avatars-sm">
              <img
                v-for="(member, idx) in teamMembers.slice(0, 2)"
                :key="idx"
                :src="member.avatar"
                :alt="member.name"
                class="avatar-sm"
              />
              <div v-if="teamMembers.length > 2" class="avatar-sm more">
                +{{ teamMembers.length - 2 }}
              </div>
            </div>
          </div>
          <div class="activity-list">
            <div v-for="activity in teamActivity" :key="activity.id" class="activity-item">
              <img :src="activity.user.avatar" :alt="activity.user.name" class="activity-avatar" />
              <div class="activity-content">
                <p class="activity-text">
                  <span class="user-name">{{ activity.user.name }}</span>
                  {{ activity.action }}
                  <span v-if="activity.target" class="target">{{ activity.target }}</span>
                </p>
                <p class="activity-time">{{ activity.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 浮动添加按钮 -->
    <button class="floating-btn" @click="showAddTask = true">
      <Plus class="floating-icon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useUserStore } from '@/store'
import {
  Zap,
  Bell,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  ArrowRight,
  Clock,
  MessageCircle,
  Check,
  MoreVertical,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Figma,
  Image,
  FileText
} from 'lucide-vue-next'
import type { Ref } from 'vue'

const userStore = useUserStore()

// ==================== 状态管理 ====================

/** 专注模式 */
const focusMode: Ref<boolean> = ref(false)
/** 计时器运行状态 */
const timerRunning: Ref<boolean> = ref(false)
/** 计时器时间（秒） */
const timerSeconds: Ref<number> = ref(25 * 60)
/** 计时器总时间 */
const totalTime: number = 25 * 60
/** 圆周长 */
const circumference: number = 2 * Math.PI * 45
/** 计时器间隔 */
let timerInterval: ReturnType<typeof setInterval> | null = null

/** 任务筛选 */
const taskFilter: Ref<string> = ref('all')
/** 显示添加任务 */
const showAddTask: Ref<boolean> = ref(false)
/** 当前月份 */
const currentMonth: Ref<Date> = ref(new Date())
/** 备忘内容 */
const noteContent: Ref<string> = ref(`下周待办：
- 完成控制台页面动效优化
- 整理设计规范 v3.0
- 与开发团队对接交互细节

灵感记录：
参考 Dieter Rams 的 Less but Better 原则，简化信息层级...`)

// ==================== 配置数据 ====================

/** 任务标签 */
const taskTabs = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' }
]

/** 优先级标签 */
const priorityLabels: Record<string, string> = {
  high: '高优',
  medium: '中优',
  low: '低优'
}

/** 星期 */
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// ==================== 计算属性 ====================

/** 当前日期 */
const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

/** 问候语 */
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早安'
  if (hour < 14) return '午安'
  if (hour < 18) return '下午好'
  return '晚上好'
})

/** 格式化时间 */
const formattedTime = computed(() => {
  const minutes = Math.floor(timerSeconds.value / 60)
  const seconds = timerSeconds.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

/** 计时器偏移 */
const timerOffset = computed(() => {
  return circumference - (timerSeconds.value / totalTime) * circumference
})

/** 任务数据 */
interface Task {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  time: string
  comments?: number
  assignee?: { name: string; avatar: string }
  completed: boolean
}

const tasks: Ref<Task[]> = ref([
  { id: '1', title: '完成项目市场页面设计评审', description: '与产品团队确认最终交互细节，准备开发交付', priority: 'high', time: '14:00 - 15:30', comments: 3, completed: false },
  { id: '2', title: '更新设计系统文档', description: '补充新的组件使用规范与代码示例', priority: 'medium', time: '16:00 截止', assignee: { name: 'Alex', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&q=80' }, completed: false },
  { id: '3', title: '整理本周设计灵感', description: '收集并分类保存到 Notion 灵感库', priority: 'low', time: '本周内', completed: false },
  { id: '4', title: '晨会同步与站会', description: '已完成 · 09:00 - 09:30', priority: 'medium', time: '09:00 - 09:30', completed: true }
])

/** 筛选后的任务 */
const filteredTasks = computed(() => {
  if (taskFilter.value === 'active') {
    return tasks.value.filter(t => !t.completed)
  }
  if (taskFilter.value === 'completed') {
    return tasks.value.filter(t => t.completed)
  }
  return tasks.value
})

/** 待完成任务数 */
const pendingTasks = computed(() => tasks.value.filter(t => !t.completed).length)

/** 已完成任务数 */
const completedTasks = computed(() => tasks.value.filter(t => t.completed).length)

/** 总任务数 */
const totalTasks = computed(() => tasks.value.length)

/** 任务进度 */
const taskProgress = computed(() => Math.round((completedTasks.value / totalTasks.value) * 100) || 0)

/** 完成率 */
const completionRate = computed(() => taskProgress.value + '%')

/** 专注时间 */
const focusTime = computed(() => 2.5)

/** 目标专注时间 */
const targetFocusTime = computed(() => 4)

/** 专注进度 */
const focusProgress = computed(() => Math.round((focusTime.value / targetFocusTime.value) * 100))

/** 里程碑 */
const milestones = computed(() => 3)

/** 总里程碑 */
const totalMilestones = computed(() => 5)

/** 里程碑进度 */
const milestoneProgress = computed(() => Math.round((milestones.value / totalMilestones.value) * 100))

/** 团队成员 */
const teamMembers = [
  { name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&q=80' },
  { name: 'Alex', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&q=80' },
  { name: 'Maria', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&q=80' },
  { name: 'David', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&q=80' },
  { name: 'Emma', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&q=80' }
]

/** 日历月份 */
const calendarMonth = computed(() => {
  return currentMonth.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

/** 日历天数 */
const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const today = new Date()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDay = new Date(year, month, 1).getDay()
  const eventDays = [5, 12, 18, 25]

  const days: { day: number; isToday: boolean; hasEvent: boolean }[] = []

  // 空白天数
  for (let i = 0; i < startDay; i++) {
    days.push({ day: 0, isToday: false, hasEvent: false })
  }

  // 实际天数
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isToday: today.getDate() === i && today.getMonth() === month && today.getFullYear() === year,
      hasEvent: eventDays.includes(i)
    })
  }

  return days
})

/** 今日日程 */
const todayEvents = [
  { id: '1', time: '14:00', name: '设计评审会议', info: '会议室 A · 1.5小时', type: 'primary' },
  { id: '2', time: '16:00', name: '文档更新截止', info: '个人任务', type: 'secondary' }
]

/** 最近文件 */
const recentFiles = [
  { name: 'Project-Market-v2.fig', time: '2小时前', type: 'figma', icon: Figma },
  { name: 'Design-System-Doc.md', time: '5小时前', type: 'doc', icon: FileText },
  { name: 'Assets-2026.zip', time: '昨天', type: 'image', icon: Image }
]

/** 团队动态 */
const teamActivity = [
  { id: '1', user: { name: 'Alex', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&q=80' }, action: '完成了', target: '首页原型', time: '10分钟前' },
  { id: '2', user: { name: 'Maria', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&q=80' }, action: '评论了你的设计稿', time: '1小时前' },
  { id: '3', user: { name: 'David', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&q=80' }, action: '分享了', target: '灵感链接', time: '2小时前' }
]

// ==================== 方法 ====================

/**
 * 切换计时器
 */
function toggleTimer(): void {
  if (timerRunning.value) {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  } else {
    timerInterval = setInterval(() => {
      if (timerSeconds.value > 0) {
        timerSeconds.value--
      } else {
        if (timerInterval) {
          clearInterval(timerInterval)
          timerInterval = null
        }
      }
    }, 1000)
  }
  timerRunning.value = !timerRunning.value
}

/**
 * 重置计时器
 */
function resetTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  timerRunning.value = false
  timerSeconds.value = totalTime
}

/**
 * 跳过计时器
 */
function skipTimer(): void {
  resetTimer()
}

/**
 * 切换任务状态
 * @param task - 任务对象
 */
function toggleTask(task: Task): void {
  task.completed = !task.completed
}

/**
 * 上个月
 */
function prevMonth(): void {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

/**
 * 下个月
 */
function nextMonth(): void {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped lang="scss">
// ==================== 设计令牌 ====================
$color-bg: #fafafa;
$color-white: #ffffff;
$color-black: #000000;
$color-gray-900: #111827;
$color-gray-800: #1f2937;
$color-gray-700: #374151;
$color-gray-600: #6b7280;
$color-gray-500: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-300: #d1d5db;
$color-gray-200: #e5e7eb;
$color-gray-100: #f3f4f6;
$color-gray-50: #f9fafb;
$color-success: #10b981;
$color-warning: #f59e0b;
$color-danger: #ef4444;
$color-blue: #3b82f6;
$color-purple: #a855f7;

$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

// ==================== 玻璃面板 ====================
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.7s $ease-out-expo forwards;
  opacity: 0;
}

// ==================== 页头 ====================
.sticky-header {
  position: sticky;
  top: 56px;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: rgba(250, 250, 250, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
}

.header-left {
  .header-date {
    font-size: 12px;
    color: $color-gray-400;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
  }

  .header-greeting {
    font-size: 24px;
    font-weight: 600;
    color: $color-gray-900;
    margin: 0;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.focus-mode {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: $color-white;
  border: 1px solid $color-gray-200;
  border-radius: 9999px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  .focus-icon {
    width: 16px;
    height: 16px;
    color: $color-warning;
  }

  .focus-label {
    font-size: 14px;
    font-weight: 500;
    color: $color-gray-700;
  }
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background-color: $color-black;

      &::before {
        transform: translateX(20px);
      }
    }
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: $color-gray-200;
    border-radius: 20px;
    transition: 0.3s;

    &::before {
      position: absolute;
      content: '';
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: $color-white;
      border-radius: 50%;
      transition: 0.3s;
    }
  }
}

.icon-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: $color-gray-100;
  }

  .icon {
    width: 20px;
    height: 20px;
    color: $color-gray-600;
  }

  .notification-dot {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 8px;
    height: 8px;
    background: $color-danger;
    border-radius: 50%;
    border: 2px solid $color-bg;
  }
}

// ==================== 内容容器 ====================
.content-container {
  padding: 32px;
  max-width: 1280px;
  margin: 0 auto;
}

// ==================== 顶部区域 ====================
.top-section {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

// 计时器卡片
.timer-card {
  padding: 32px;
  position: relative;
  overflow: hidden;
}

.timer-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 128px;
  height: 128px;
  background: linear-gradient(135deg, $color-gray-100, transparent);
  border-radius: 50%;
  transform: translate(30%, -30%);
  opacity: 0.5;
}

.timer-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.timer-label {
  font-size: 14px;
  color: $color-gray-500;
  margin-bottom: 24px;
}

.timer-circle-wrap {
  position: relative;
  width: 192px;
  height: 192px;
  margin: 0 auto 24px;
}

.timer-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-progress {
  transition: stroke-dashoffset 1s linear;
}

.timer-display {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .timer-time {
    font-size: 36px;
    font-weight: 600;
    color: $color-gray-900;
    font-variant-numeric: tabular-nums;
  }

  .timer-unit {
    font-size: 12px;
    color: $color-gray-400;
    margin-top: 4px;
  }
}

.timer-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.control-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid $color-gray-200;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: $color-gray-50;
  }

  &.primary {
    background: $color-black;
    border-color: $color-black;

    .control-icon {
      color: $color-white;
    }

    &:hover {
      transform: scale(1.05);
    }
  }

  .control-icon {
    width: 20px;
    height: 20px;
    color: $color-gray-600;

    &.play {
      margin-left: 2px;
    }
  }
}

// 概览卡片
.overview-card {
  padding: 32px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.overview-title {
  font-size: 20px;
  font-weight: 600;
  color: $color-gray-900;
  margin-bottom: 4px;
}

.overview-subtitle {
  font-size: 14px;
  color: $color-gray-500;
}

.overview-percent {
  text-align: right;

  .percent-value {
    font-size: 30px;
    font-weight: 600;
    color: $color-gray-900;
  }

  .percent-label {
    display: block;
    font-size: 12px;
    color: $color-gray-400;
  }
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.progress-item {
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .progress-label {
    font-size: 14px;
    color: $color-gray-600;
  }

  .progress-value {
    font-size: 14px;
    font-weight: 500;
    color: $color-gray-900;
  }
}

.progress-bar {
  height: 8px;
  background: $color-gray-100;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s ease;

  &.black {
    background: $color-black;
  }

  &.gray {
    background: $color-gray-400;
  }

  &.light {
    background: $color-gray-300;
  }
}

.overview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid $color-gray-100;
}

.team-avatars {
  display: flex;

  .team-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid $color-white;
    object-fit: cover;
    margin-left: -8px;

    &:first-child {
      margin-left: 0;
    }

    &.more {
      background: $color-gray-100;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: $color-gray-600;
    }
  }
}

.view-detail-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 14px;
  color: $color-gray-500;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: $color-black;
  }

  .btn-icon {
    width: 16px;
    height: 16px;
  }
}

// ==================== 中间区域 ====================
.middle-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

// 待办事项
.tasks-section {
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  animation: slideUp 0.7s $ease-out-expo forwards;
  opacity: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: $color-gray-900;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 9999px;
  font-size: 14px;
  color: $color-gray-600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: $color-gray-100;
  }

  &.active {
    background: $color-black;
    color: $color-white;
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 0, 0, 0.1);
  }

  &.priority-high {
    border-left: 3px solid $color-danger;
  }

  &.priority-medium {
    border-left: 3px solid $color-warning;
  }

  &.priority-low {
    border-left: 3px solid $color-success;
  }

  &.completed {
    opacity: 0.6;

    .task-title {
      text-decoration: line-through;
    }
  }
}

.task-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid $color-gray-300;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.3s ease;

  &.checked {
    background: $color-black;
    border-color: $color-black;
  }

  .check-icon {
    width: 14px;
    height: 14px;
    color: $color-white;
  }
}

.task-body {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: $color-gray-900;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;

  &.high {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }

  &.medium {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
  }

  &.low {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }
}

.task-desc {
  font-size: 14px;
  color: $color-gray-500;
  margin-bottom: 12px;
}

.task-meta {
  display: flex;
  align-items: center;
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

  .assignee-avatar {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    object-fit: cover;
  }
}

.task-more {
  background: none;
  border: none;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;

  .task-card:hover & {
    opacity: 1;
  }

  .more-icon {
    width: 16px;
    height: 16px;
    color: $color-gray-400;
  }
}

.add-task-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 2px dashed $color-gray-300;
  border-radius: 16px;
  font-size: 14px;
  color: $color-gray-500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  animation: slideUp 0.7s $ease-out-expo forwards;
  opacity: 0;

  &:hover {
    border-color: $color-gray-400;
    color: $color-gray-700;
  }

  .btn-icon {
    width: 16px;
    height: 16px;
  }
}

// 日历卡片
.calendar-card {
  padding: 24px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.calendar-title {
  font-size: 16px;
  font-weight: 600;
  color: $color-gray-900;
}

.calendar-nav {
  display: flex;
  gap: 4px;
}

.nav-arrow {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: $color-gray-100;
  }

  .arrow-icon {
    width: 16px;
    height: 16px;
    color: $color-gray-600;
  }
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
  text-align: center;
}

.weekday {
  font-size: 12px;
  color: $color-gray-400;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  position: relative;
  width: 32px;
  height: 32px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled):not(.active) {
    background: rgba(0, 0, 0, 0.03);
  }

  &.empty {
    cursor: default;
  }

  &.active {
    background: $color-black;
    color: $color-white;
  }

  &.has-event::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background: $color-black;
    border-radius: 50%;
  }

  &.active.has-event::after {
    background: $color-white;
  }
}

.calendar-events {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid $color-gray-100;
}

.events-title {
  font-size: 12px;
  color: $color-gray-400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-item {
  display: flex;
  gap: 12px;
}

.event-time {
  width: 48px;
  font-size: 12px;
  color: $color-gray-500;
  padding-top: 4px;
}

.event-card {
  flex: 1;
  padding: 12px;
  background: $color-gray-50;
  border-radius: 12px;
  border-left: 2px solid $color-black;

  &.secondary {
    border-left-color: $color-gray-300;
  }
}

.event-name {
  font-size: 14px;
  font-weight: 500;
  color: $color-gray-900;
}

.event-info {
  font-size: 12px;
  color: $color-gray-500;
  margin-top: 4px;
}

// ==================== 底部区域 ====================
.bottom-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.files-card,
.notes-card,
.activity-card {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: $color-gray-900;
}

.view-all {
  background: none;
  border: none;
  font-size: 12px;
  color: $color-gray-500;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: $color-black;
  }
}

.edit-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: $color-gray-100;
  }

  .edit-icon {
    width: 16px;
    height: 16px;
    color: $color-gray-500;
  }
}

// 文件列表
.files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: $color-white;
    transform: translateX(4px);
  }
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.figma {
    background: rgba(59, 130, 246, 0.1);
  }

  &.doc {
    background: rgba(168, 85, 247, 0.1);
  }

  &.image {
    background: rgba(249, 115, 22, 0.1);
  }

  .icon {
    width: 20px;
    height: 20px;

    &.figma {
      color: $color-blue;
    }

    &.doc {
      color: $color-purple;
    }

    &.image {
      color: #f97316;
    }
  }
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: $color-gray-900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-time {
  font-size: 12px;
  color: $color-gray-500;
}

.file-arrow {
  width: 16px;
  height: 16px;
  color: $color-gray-400;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.3s ease;

  .file-item:hover & {
    opacity: 1;
    transform: translateX(0);
  }
}

// 备忘录
.note-paper {
  background: linear-gradient(to bottom, #fef9c3, #fef9c3);
  background-image:
    linear-gradient(90deg, transparent 19px, #eab308 19px, #eab308 20px, transparent 20px),
    linear-gradient(#eab308 1px, transparent 1px);
  background-size: 100% 1.5rem;
  line-height: 1.5rem;
  border-radius: 12px;
  padding: 16px;
  height: 160px;
  overflow-y: auto;
  font-size: 14px;
  color: $color-gray-700;

  &:focus {
    outline: none;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
}

// 团队动态
.team-avatars-sm {
  display: flex;

  .avatar-sm {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid $color-white;
    object-fit: cover;
    margin-left: -6px;

    &:first-child {
      margin-left: 0;
    }

    &.more {
      background: $color-gray-100;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: $color-gray-600;
    }
  }
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
}

.activity-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  color: $color-gray-600;

  .user-name {
    font-weight: 500;
    color: $color-gray-900;
  }

  .target {
    color: $color-gray-900;
  }
}

.activity-time {
  font-size: 12px;
  color: $color-gray-400;
  margin-top: 2px;
}

// ==================== 浮动按钮 ====================
.floating-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  background: $color-black;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s $ease-out-expo;
  z-index: 50;

  &:hover {
    transform: scale(1.1) rotate(90deg);
    box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.3);
  }

  .floating-icon {
    width: 24px;
    height: 24px;
    color: $color-white;
  }
}

// ==================== 动画 ====================
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .content-container {
    padding: 20px;
  }

  .sticky-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .focus-mode {
    display: none;
  }
}
</style>
