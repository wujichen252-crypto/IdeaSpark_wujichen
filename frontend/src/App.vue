<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
import { zhCN, dateZhCN } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'
import AppHeader from '@/layouts/AppHeader.vue'
import NexusNoise from '@/components/NexusNoise.vue'
import { useUserStore } from '@/store'

const userStore = useUserStore()

/**
 * Nexus Design System Theme Overrides for Naive UI
 * Transforms Naive UI's default green theme into a minimalist black/white/grey system
 */
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#000000',
    primaryColorHover: '#374151',
    primaryColorPressed: '#111827',
    primaryColorSuppl: '#000000',
    infoColor: '#6b7280',
    infoColorHover: '#4b5563',
    infoColorPressed: '#374151',
    infoColorSuppl: '#6b7280',
    successColor: '#10b981',
    successColorHover: '#34d399',
    successColorPressed: '#059669',
    successColorSuppl: '#10b981',
    warningColor: '#f59e0b',
    warningColorHover: '#fbbf24',
    warningColorPressed: '#d97706',
    warningColorSuppl: '#f59e0b',
    errorColor: '#ef4444',
    errorColorHover: '#f87171',
    errorColorPressed: '#dc2626',
    errorColorSuppl: '#ef4444',
    bodyColor: '#fafafa',
    cardColor: '#ffffff',
    modalColor: '#ffffff',
    popoverColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: '#e5e7eb',
    dividerColor: '#f3f4f6',
    hoverColor: 'rgba(0, 0, 0, 0.04)',
    tableHeaderColor: '#fafafa',
    inputColor: '#ffffff',
    inputColorDisabled: '#f9fafb',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'SF Mono', Monaco, 'Cascadia Code', monospace",
    fontWeight: '400',
    fontWeightStrong: '600',
    borderRadius: '12px',
    borderRadiusSmall: '8px',
    heightSmall: '32px',
    heightMedium: '40px',
    heightLarge: '48px'
  },
  Button: {
    borderRadiusSmall: '9999px',
    borderRadiusMedium: '9999px',
    borderRadiusLarge: '9999px',
    fontWeight: '500'
  },
  Input: {
    borderRadius: '9999px',
    caretColor: '#000000',
    borderHover: '1px solid #9ca3af',
    borderFocus: '1px solid #000000'
  },
  Card: {
    borderRadius: '16px',
    color: '#ffffff',
    colorModal: '#ffffff',
    boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.04)'
  },
  Tag: {
    borderRadius: '9999px',
    fontSizeTiny: '12px',
    fontSizeSmall: '12px',
    fontSizeMedium: '13px',
    fontSizeLarge: '14px'
  },
  Badge: {
    borderRadius: '9999px'
  },
  Avatar: {
    borderRadius: '9999px'
  },
  Tooltip: {
    borderRadius: '8px',
    color: '#111827',
    textColor: '#ffffff'
  },
  Dropdown: {
    borderRadius: '12px',
    optionHeightSmall: '32px',
    optionHeightMedium: '40px',
    optionHeightLarge: '48px'
  },
  Menu: {
    borderRadius: '12px'
  },
  Slider: {
    fillColor: '#000000',
    fillColorHover: '#374151'
  },
  Switch: {
    railColorActive: '#000000'
  },
  Tabs: {
    tabBorderRadius: '9999px',
    tabFontWeightActive: '600'
  },
  Drawer: {
    borderRadius: '24px 0 0 24px'
  }
}

// Determine if the header should be hidden
const isHeaderHidden = computed(() => {
  const hiddenRouteNames = [
    'AiProjectWorkbench',
    'AiProjectSettings',
    'AiProjectCreate',
    'AiProjectManagement',
    'DocumentEditor',
    'ProjectWorkspace',
    'ProjectFileEditor',
    'GoogleSlidesEditor',
    'ExcelEditor',
    'SlideEditor'
  ]
  const hiddenPaths = ['/login', '/forgot-password', '/reset-password']
  return hiddenRouteNames.includes(route.name as string) || hiddenPaths.includes(route.path)
})

// 全屏页面（不需要顶部 padding 来避让 Header）
const shouldPadMain = computed(() => {
  if (isHeaderHidden.value) return false
  const fullScreenPaths = ['/', '/login', '/forgot-password', '/reset-password']
  return !fullScreenPaths.includes(route.path)
})

onMounted(() => {
  userStore.init()
})
</script>

<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <NexusNoise />
          <AppHeader v-if="!isHeaderHidden" />
          <main :class="['app-main', { 'app-main--with-header': shouldPadMain }]">
            <router-view />
          </main>
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
/* Global scrollbar override */
html {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

::selection {
  background-color: #000000;
  color: #ffffff;
}
</style>

<style scoped>
.app-main {
  min-height: 100vh;
  position: relative;
  isolation: isolate;
}

.app-main--with-header {
  padding-top: 64px;
}
</style>
