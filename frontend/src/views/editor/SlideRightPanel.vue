<template>
  <aside v-if="!editor.presentMode.value && editor.rightPanel.value" class="se-right-panel">
    <div class="se-panel-header">
      <span>{{ editor.rightPanelTitle.value }}</span>
      <button class="nexus-icon-btn" @click="editor.rightPanel.value = null">
        <n-icon size="16"><X /></n-icon>
      </button>
    </div>

    <!-- 主题面板 -->
    <div v-if="editor.rightPanel.value === 'theme'" class="se-panel-content">
      <div class="se-section-title">预设主题</div>
      <div class="se-theme-grid">
        <div
          v-for="theme in editor.themes"
          :key="theme.key"
          :class="['se-theme-item', { active: editor.currentTheme.value === theme.key }]"
          @click="editor.applyTheme(theme.key)"
        >
          <div class="se-theme-preview" :style="{ background: theme.preview }">
            <div class="se-theme-text" :style="{ color: theme.textColor }">
              <div class="se-theme-preview-title">标题</div>
              <div class="se-theme-preview-sub">副标题</div>
            </div>
          </div>
          <div class="se-theme-name">{{ theme.name }}</div>
        </div>
      </div>
    </div>

    <!-- 背景面板 -->
    <div v-if="editor.rightPanel.value === 'background'" class="se-panel-content">
      <div class="se-section-title">颜色</div>
      <div class="se-color-grid">
        <div
          v-for="color in editor.backgroundColors"
          :key="color"
          class="se-color-item"
          :style="{ background: color }"
          @click="editor.applyBackgroundColor(color)"
        ></div>
      </div>
    </div>

    <!-- 布局面板 -->
    <div v-if="editor.rightPanel.value === 'layout'" class="se-panel-content">
      <div class="se-layout-grid">
        <div
          v-for="layout in editor.slideLayouts"
          :key="layout.key"
          :class="['se-layout-item', { active: editor.currentLayout.value === layout.key }]"
          @click="editor.applyLayout(layout.key)"
        >
          <div class="se-layout-preview">
            <div class="se-layout-inner" :class="layout.key">
              <div v-if="layout.hasTitle" class="se-layout-bar se-layout-title-bar"></div>
              <div v-if="layout.hasContent" class="se-layout-bar se-layout-content-bar"></div>
              <div v-if="layout.hasSubtitle" class="se-layout-bar se-layout-subtitle-bar"></div>
            </div>
          </div>
          <div class="se-layout-name">{{ layout.name }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useSlideEditorContext } from '@/composables/useSlideEditor'

const editor = useSlideEditorContext()
</script>
