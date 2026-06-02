<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import type { MenuOption } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import { PersonOutline } from '@vicons/ionicons5'

import { useUserStore } from '@/store'
import logoIcon from '@/assets/logo-icon.svg'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const activeKey = ref<string | null>('home')
const isScrolled = ref(false)

// 防抖函数
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 静态菜单选项，避免频繁重新计算
const allMenuOptions: MenuOption[] = [
  { key: 'workbench', label: '工作台' },
  { key: 'market', label: '项目市场' },
  { key: 'tools', label: '工具市场' },
  { key: 'community', label: '社区动态' }
]

// 根据路由动态计算菜单选项
const menuOptions = computed<MenuOption[]>(() => {
  // 首页只显示极简菜单（或者干脆不显示菜单，只显示登录按钮）
  if (route.path === '/') {
    return []
  }
  // 内部页面显示完整功能菜单
  return allMenuOptions
})

// 路由映射表，提高导航性能
const routeMap: Record<string, string> = {
  home: '/',
  workbench: '/workbench',
  market: '/market',
  tools: '/tools',
  community: '/community'
}

// 监听路由变化更新 activeKey
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/workbench')) activeKey.value = 'workbench'
    else if (path === '/market') activeKey.value = 'market'
    else if (path === '/tools') activeKey.value = 'tools'
    else if (path === '/community') activeKey.value = 'community'
    else activeKey.value = null
  },
  { immediate: true }
)

// 移除动画与粒子效果，简化为静态 Logo 显示

/**
 * 处理菜单切换
 * @param key - 菜单项 key
 */
function onUpdateMenu(key: string) {
  // 使用映射表快速查找路由
  const targetRoute = routeMap[key]
  if (targetRoute && route.path !== targetRoute) {
    // 直接跳转，不等待 nextTick
    router.push(targetRoute).catch((err) => {
      // 忽略重复导航的错误
      if (err.name !== 'NavigationDuplicated') {
        console.error('导航错误:', err)
      }
    })
  }
}

/**
 * 监听滚动事件
 * 同时也负责根据路由判断 Header 状态
 */
function handleScroll() {
  const isHome = route.path === '/'
  const shouldBeScrolled = !isHome || window.scrollY > 100

  // 更新状态
  if (isScrolled.value !== shouldBeScrolled) {
    isScrolled.value = shouldBeScrolled
  }
}

// 防抖处理的滚动事件
const debouncedHandleScroll = debounce(handleScroll, 16) // 约60fps

// 监听路由变化，及时更新 Header 状态
watch(
  () => route.path,
  async () => {
    // 路由切换时，重新评估 Header 状态
    await nextTick()
    handleScroll()
  }
)

onMounted(() => {
  window.addEventListener('scroll', debouncedHandleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', debouncedHandleScroll)
})

// 删除动画相关的 DOM refs 与初始化逻辑
</script>

<template>
  <header
    class="app-header"
    :class="{ 'is-scrolled': isScrolled, 'is-home': route.path === '/' }"
    role="banner"
    aria-label="顶部导航栏"
  >
    <div class="app-header__content">
      <!-- 1. Left: Logo -->
      <div v-if="route.path !== '/'" class="header-left">
        <div class="brand-logo" @click.prevent="onUpdateMenu('home')">
          <img :src="logoIcon" class="brand-logo-icon" alt="Logo Icon" />
          <img src="@/assets/logo-ideaspark.svg" class="brand-logo-image" alt="IdeaSpark Logo" />
        </div>
      </div>

      <!-- 2. Center: Menu -->
      <div class="header-center">
        <n-menu
          v-model:value="activeKey"
          mode="horizontal"
          :options="menuOptions"
          class="custom-menu"
          :responsive="false"
          @update:value="onUpdateMenu"
        />
      </div>

      <!-- 3. Right: User Actions -->
      <div class="header-right">
        <n-space v-if="route.path !== '/'" align="center" :size="16">
          <!-- 已登录状态 -->
          <n-dropdown
            v-if="userStore.isLoggedIn"
            trigger="hover"
            :options="[
              { label: '个人中心', key: 'profile' },
              { label: '退出登录', key: 'logout' }
            ]"
            @select="
              (key) => {
                if (key === 'profile') router.push('/profile')
                if (key === 'logout') {
                  userStore.logout()
                  router.push('/')
                }
              }
            "
          >
            <div class="user-avatar-wrapper">
              <n-avatar
                round
                size="small"
                :src="userStore.userInfo?.avatar"
                style="cursor: pointer"
              />
              <span class="username ml-2">{{ userStore.userInfo?.username }}</span>
            </div>
          </n-dropdown>

          <!-- 未登录状态 -->
          <n-button
v-else
quaternary
class="login-btn"
@click="router.push('/login')">
            <template #icon
              >
<n-icon><PersonOutline /></n-icon
            >
</template>
            登录 / 注册
          </n-button>
        </n-space>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 56px;
  display: flex;
  align-items: center;
  background: transparent;
  border-bottom: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* 滚动状态 / 内部页面状态 */
  &.is-scrolled {
    height: 56px; /* 保持高度，与页面 padding-top 对齐 */
    background: transparent;
    backdrop-filter: none;
    border-bottom: none;
    box-shadow: none; /* 移除阴影，避免与下方内容头部重叠产生视觉脏感 */

    &:not(.is-home) {
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    /* CSS 状态控制作为 GSAP 的兜底 */
    .initial-logo-container {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateY(-10px);
      transition: all 0.4s ease-out;
    }

    .scrolled-logo-container {
      opacity: 1;
      visibility: visible;
      transform: scale(1) rotate(0deg);
      transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .app-header__content {
      max-width: 100%; /* 全宽显示，适应控制台等全屏布局 */
      padding: 0 24px;
    }

    /* Logo 适配 */
    .logo-title {
      color: #111; /* 深色文字 */
    }

    /* 菜单适配 */
    :deep(.custom-menu) {
      --n-item-text-color: #111111 !important;
      --n-item-text-color-hover: #111111 !important;
      --n-item-text-color-active: #111111 !important;
      --n-item-text-color-child-active: #111111 !important;
      --n-item-text-color-child-active-hover: #111111 !important;

      .n-menu-item {
        margin: 0 8px;
      }

      .n-menu-item:not(:last-child)::after {
        color: rgba(17, 17, 17, 0.35);
      }

      .n-menu-item-content-header {
        color: #111111 !important;
        font-weight: 800 !important;
        font-size: 16px !important;
      }
      .n-menu-item-content:hover .n-menu-item-content-header,
      .n-menu-item-content--selected .n-menu-item-content-header {
        color: #111111 !important;
        opacity: 0.9;
      }

      /* Hover 背景调整 */
      .n-menu-item-content:hover::before {
        background-color: rgba(0, 0, 0, 0.06) !important;
      }
    }

    /* 右侧图标/文字适配 */
    .icon-btn {
      color: #111111 !important;
      &:hover {
        background-color: rgba(0, 0, 0, 0.06) !important;
      }
    }

    .login-btn {
      color: #111111 !important;
      &:hover {
        color: #111111 !important;
        opacity: 0.8;
      }
    }

    .user-avatar-wrapper {
      background: rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.05);

      &:hover {
        background: rgba(0, 0, 0, 0.08);
      }

      .n-avatar {
        border: 1px solid #fff !important;
      }

      .username {
        color: #111111 !important;
      }
    }
  }
}

.app-header__content {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  position: relative;
  transition: all 0.3s ease;
}

/* 使用百分比布局，确保各区域有足够空间 */
.header-left {
  flex: 0 0 20%;
  min-width: 180px;
  display: flex;
  align-items: center;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-right {
  flex: 0 0 20%;
  min-width: 180px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.brand-logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  position: relative;
  height: 40px;
  width: 100%;
  max-width: 200px;
  gap: 8px;
}

.brand-logo-icon {
  height: 36px;
  display: block;
  border-radius: 8px;
}

.brand-logo-image {
  height: 45px;
  display: block;
}

/* ... Container Management ... */
.initial-logo-container {
  display: flex;
  align-items: center;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  transform-origin: left center;
  width: 100%;
  transition: all 0.4s ease-out; /* Add default transition */
}

.scrolled-logo-container {
  position: absolute;
  left: 0;
  top: 50%;
  margin-top: -25px;
  width: 50px;
  height: 50px;
  opacity: 0;
  visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  z-index: 20; /* 确保层级高于 initial-logo */
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); /* Add default transition */

  .art-pattern {
    width: 100%;
    height: 100%;
    filter: none;
  }
}

/* ... Particles ... */
.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.energy-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #4ade80;
  opacity: 0;
}

/* ... Logo Components ... */
.logo-icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  position: relative;
}

.logo-spark {
  width: 12px;
  height: 12px;
  background: #4ade80;
  transform: rotate(45deg);
  border-radius: 1px;
  position: relative;
}

.logo-content {
  display: flex;
  flex-direction: column;
  line-height: 1;
  justify-content: center;
}

.logo-title {
  font-size: 18px;
  font-weight: 900;
  color: #f0f0f0; /* Default dark mode / home page */
  letter-spacing: 2px;
  font-family: 'Orbitron', system-ui, sans-serif;
  display: flex;
  transition: color 0.3s ease;
}

.logo-title-char {
  display: inline-block;
  margin-right: 1px;
}

.logo-subtitle {
  font-size: 9px;
  color: #4ade80;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-top: 3px;
  font-weight: 700;
  opacity: 0.9;
  font-family: 'Montserrat', sans-serif;
}

/* ... Menu Styles ... */
:deep(.custom-menu) {
  --n-item-text-color-active: #4ade80 !important;
  --n-item-text-color-active-hover: #4ade80 !important;
  --n-item-icon-color: #ffffff !important;
  --n-item-icon-color-hover: #4ade80 !important;
  --n-item-icon-color-active: #4ade80 !important;
  --n-item-icon-color-active-hover: #4ade80 !important;
  --menu-gap: 160px;

  background-color: transparent !important;
  display: flex;
  align-items: center;
  gap: var(--menu-gap) !important;

  .n-menu-item {
    position: relative;
  }

  .n-menu-item:not(:last-child)::after {
    content: '|';
    position: absolute;
    right: calc(var(--menu-gap) * -0.5);
    top: 50%;
    transform: translate(50%, -50%);
    pointer-events: none;
    color: rgba(255, 255, 255, 0.55);
    font-weight: 300;
    font-size: 12px;
  }

  .n-menu-item-content {
    position: relative;
    padding: 0 16px !important;
    height: 36px;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;

    &:hover::before {
      background-color: rgba(255, 255, 255, 0.08) !important;
      border-radius: 18px;
    }

    &::before {
      background-color: transparent !important;
      left: 4px;
      right: 4px;
      transition: background-color 0.3s ease;
    }

    &::after {
      content: '';
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: 4px;
      height: 2px;
      background-color: #ffffff;
      border-radius: 2px;
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 0.2s ease;
      opacity: 0.9;
    }

    &:hover::after {
      transform: scaleX(1);
    }

    &.n-menu-item-content--selected::after {
      transform: scaleX(1);
    }
  }

  .n-menu-item-content-header {
    font-weight: 600 !important;
    letter-spacing: 0.3px;
    font-size: 15px !important;
    transition: all 0.3s ease;
    color: #ffffff !important;
    font-family:
      'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial,
      sans-serif !important;
  }

  .n-menu-item-content--selected .n-menu-item-content-header {
    color: #ffffff !important;
    font-weight: 600 !important;
  }

  .n-menu-item-content:hover .n-menu-item-content-header,
  .n-menu-item-content--selected:hover .n-menu-item-content-header {
    color: #ffffff !important;
    opacity: 0.9;
  }
}

.user-avatar-wrapper {
  display: flex;
  align-items: center;
  padding: 4px 8px 4px 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  transition: all 0.3s;
  cursor: pointer;
  max-width: 180px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .username {
    color: #fff;
    font-size: 13px;
    margin-right: 8px;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.3s;
  }
}

/* 响应式适配 */
@media screen and (max-width: 1200px) {
  .app-header__content {
    padding: 0 16px;
  }

  .header-left,
  .header-right {
    flex: 0 0 18%;
    min-width: 150px;
  }

  :deep(.custom-menu) {
    --menu-gap: 120px;

    .n-menu-item-content-header {
      font-size: 14px !important;
    }

    .n-menu-item-content {
      padding: 0 12px !important;
      height: 34px;
    }
  }
}

@media screen and (max-width: 992px) {
  .header-left,
  .header-right {
    flex: 0 0 16%;
    min-width: 120px;
  }

  .brand-logo {
    max-width: 160px;
  }

  :deep(.custom-menu) {
    --menu-gap: 80px;

    .n-menu-item-content-header {
      font-size: 13px !important;
      font-weight: 500 !important;
    }

    .n-menu-item-content {
      padding: 0 10px !important;
      height: 32px;
    }

    .n-menu-item:not(:last-child)::after {
      font-size: 10px;
    }
  }

  .user-avatar-wrapper {
    max-width: 140px;

    .username {
      font-size: 12px;
      max-width: 70px;
    }
  }
}

@media screen and (max-width: 768px) {
  .app-header__content {
    padding: 0 12px;
  }

  .header-left,
  .header-right {
    flex: 0 0 14%;
    min-width: 100px;
  }

  .brand-logo {
    max-width: 140px;
  }

  :deep(.custom-menu) {
    --menu-gap: 50px;

    .n-menu-item-content-header {
      font-size: 12px !important;
    }

    .n-menu-item-content {
      padding: 0 8px !important;
      height: 30px;
    }

    .n-menu-item-content-header {
      letter-spacing: 0;
    }
  }

  .user-avatar-wrapper {
    .username {
      display: none;
    }
  }
}

.login-btn {
  color: #fff !important;
  font-weight: 500;
  transition: color 0.3s;

  &:hover {
    color: #4ade80 !important;
  }
}

.icon-btn {
  color: #fff; /* Default color */
  transition: color 0.3s;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }
}

.ml-2 {
  margin-left: 8px;
}
</style>
