<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { Component } from 'vue'

import { zhCN, dateZhCN } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'
import NexusNoise from '@/components/NexusNoise.vue'
import { useUserStore } from '@/store'

import DefaultLayout from '@/layouts/DefaultLayout.vue'
import EditorLayout from '@/layouts/EditorLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'

const route = useRoute()
const userStore = useUserStore()

/**
 * 读取 :root 上的 Nexus 设计令牌
 * @description 设计令牌的唯一事实来源是 `styles/variables.scss`。此处运行时读取，
 * 避免在 TS 侧再抄写一份色值 / 圆角，消除"令牌与主题双轨"。
 * @param name 令牌名（不含 `--nexus-` 前缀）
 * @returns 令牌值字符串；令牌缺失时返回空串并在开发环境告警
 */
function token(name: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--nexus-${name}`)
    .trim()
  if (!value && import.meta.env.DEV) {
    console.warn(`[nexus] 未找到设计令牌 --nexus-${name}`)
  }
  return value
}

/**
 * Nexus Design System Theme Overrides for Naive UI
 * Transforms Naive UI's default green theme into a minimalist black/white/grey system.
 * 与 `styles/variables.scss` 同源：色值 / 圆角 / 字体栈均从令牌读取，
 * 仅 Naive UI 内部的派生色阶（hover / pressed / suppl）与控件尺寸保留字面量。
 */
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: token('accent'),
    primaryColorHover: token('accent-hover'),
    primaryColorPressed: token('gray-900'),
    primaryColorSuppl: token('accent'),
    infoColor: token('text-tertiary'),
    infoColorHover: token('text-secondary'),
    infoColorPressed: token('gray-700'),
    infoColorSuppl: token('text-tertiary'),
    successColor: token('success'),
    successColorHover: '#34d399',
    successColorPressed: '#059669',
    successColorSuppl: token('success'),
    warningColor: token('warning'),
    warningColorHover: '#fbbf24',
    warningColorPressed: '#d97706',
    warningColorSuppl: token('warning'),
    errorColor: token('error'),
    errorColorHover: '#f87171',
    errorColorPressed: '#dc2626',
    errorColorSuppl: token('error'),
    bodyColor: token('bg'),
    cardColor: token('bg-elevated'),
    modalColor: token('bg-elevated'),
    popoverColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: token('border'),
    dividerColor: token('divider'),
    hoverColor: 'rgba(0, 0, 0, 0.04)',
    tableHeaderColor: token('bg'),
    inputColor: token('bg-elevated'),
    inputColorDisabled: token('bg-subtle'),
    fontFamily: token('font-ui'),
    fontFamilyMono: token('font-mono'),
    fontWeight: '400',
    fontWeightStrong: '600',
    borderRadius: token('radius-md'),
    borderRadiusSmall: token('radius-sm'),
    heightSmall: '32px',
    heightMedium: '40px',
    heightLarge: '48px'
  },
  Button: {
    borderRadiusSmall: token('radius-full'),
    borderRadiusMedium: token('radius-full'),
    borderRadiusLarge: token('radius-full'),
    fontWeight: '500'
  },
  Input: {
    borderRadius: token('radius-full'),
    caretColor: token('accent'),
    borderHover: `1px solid ${token('text-quaternary')}`,
    borderFocus: `1px solid ${token('accent')}`
  },
  Card: {
    borderRadius: token('radius-lg'),
    color: token('bg-elevated'),
    colorModal: token('bg-elevated'),
    boxShadow: token('shadow-md')
  },
  Tag: {
    borderRadius: token('radius-full'),
    fontSizeTiny: token('font-size-xs'),
    fontSizeSmall: token('font-size-xs'),
    fontSizeMedium: token('font-size-sm'),
    fontSizeLarge: token('font-size-base')
  },
  Badge: {
    borderRadius: token('radius-full')
  },
  Avatar: {
    borderRadius: token('radius-full')
  },
  Tooltip: {
    borderRadius: token('radius-sm'),
    color: token('text-primary'),
    textColor: token('text-inverse')
  },
  Dropdown: {
    borderRadius: token('radius-md'),
    optionHeightSmall: '32px',
    optionHeightMedium: '40px',
    optionHeightLarge: '48px'
  },
  Menu: {
    borderRadius: token('radius-md')
  },
  Slider: {
    fillColor: token('accent'),
    fillColorHover: token('accent-hover')
  },
  Switch: {
    railColorActive: token('accent')
  },
  Tabs: {
    tabBorderRadius: token('radius-full'),
    tabFontWeightActive: '600'
  },
  Drawer: {
    borderRadius: `${token('radius-xl')} 0 0 ${token('radius-xl')}`
  }
}

// 布局调度：按 route.meta.layout 选择骨架，默认 default。
// 硬编码的 hiddenRouteNames / hiddenPaths / shouldPadMain 已移除（映射见 router/index.ts）。
const LAYOUTS: Record<string, Component> = {
  default: DefaultLayout,
  editor: EditorLayout,
  auth: AuthLayout,
  blank: BlankLayout
}
const layoutComponent = computed<Component>(
  () => LAYOUTS[(route.meta.layout as string) || 'default'] || DefaultLayout
)

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
          <component :is="layoutComponent">
            <router-view />
          </component>
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>
