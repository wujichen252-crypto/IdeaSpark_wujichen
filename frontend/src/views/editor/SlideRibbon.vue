<template>
  <template v-if="!editor.presentMode.value">
    <!-- 顶部标题栏 -->
    <header class="se-header">
      <div class="se-header-left">
        <button
          class="nexus-icon-btn"
          @click="editor.handleBack()"
          title="返回"
        >
          <n-icon size="18"><ArrowLeft /></n-icon>
        </button>
        <div class="se-logo">
          <n-icon size="20" color="var(--nexus-text-primary)"><Presentation /></n-icon>
        </div>
        <div class="se-doc-info">
          <input
            v-model="editor.fileName.value"
            class="se-doc-title"
            placeholder="无标题演示文稿"
            @blur="editor.handleSaveFileName()"
          />
          <div class="se-save-status">
            <span v-if="editor.saveStatus.value === 'saved'" class="se-status-dot se-status-saved"></span>
            <span v-else-if="editor.saveStatus.value === 'saving'" class="se-status-text">保存中...</span>
            <span v-else class="se-status-text">未保存</span>
          </div>
        </div>
      </div>
      <div class="se-header-right">
        <button
          class="nexus-icon-btn"
          title="AI 助手"
          @click="editor.toggleAiPanel()"
        >
          <n-icon size="18"><Sparkles /></n-icon>
        </button>
        <button class="nexus-pill-btn nexus-pill-outline" @click="editor.handleExport()">
          <n-icon size="14"><Download /></n-icon>
          导出
        </button>
        <button class="nexus-pill-btn nexus-pill-dark" @click="editor.handleSave()">
          <n-icon size="14"><Save /></n-icon>
          保存
        </button>
      </div>
    </header>

    <!-- Ribbon 工具栏 -->
    <div class="se-toolbar">
      <div class="quick-access-toolbar">
        <button
          class="nexus-icon-btn"
          :disabled="!editor.canUndo.value"
          @click="editor.undo()"
          title="撤销"
        >
          <n-icon size="16"><Undo2 /></n-icon>
        </button>
        <button
          class="nexus-icon-btn"
          :disabled="!editor.canRedo.value"
          @click="editor.redo()"
          title="重做"
        >
          <n-icon size="16"><Redo2 /></n-icon>
        </button>
        <button class="nexus-icon-btn" @click="editor.handleSave()" title="保存">
          <n-icon size="16"><Save /></n-icon>
        </button>
      </div>

      <div class="ribbon-tabs">
        <div
          v-for="tab in editor.ribbonTabs"
          :key="tab.key"
          :class="['ribbon-tab', { active: editor.activeTab.value === tab.key }]"
          @click="editor.activeTab.value = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>

      <div class="ribbon-actions">
        <n-dropdown :options="editor.zoomOptions" @select="editor.handleZoomSelect($event)">
          <button class="nexus-pill-btn nexus-pill-ghost">
            {{ editor.zoomPercent.value }}
            <n-icon size="12"><ChevronDown /></n-icon>
          </button>
        </n-dropdown>
        <div class="se-divider"></div>
        <button class="nexus-pill-btn nexus-pill-dark" @click="editor.startSlideshow()">
          <n-icon size="14"><Play /></n-icon>
          放映
        </button>
      </div>
    </div>

    <!-- Ribbon 面板 -->
    <div class="ribbon-panel">
      <template v-if="editor.activeTab.value === 'home'">
        <div class="ribbon-group">
          <span class="group-title">剪贴板</span>
          <div class="group-content">
            <button class="nexus-ghost-btn" @click="editor.handleCopy()" title="复制">
              <n-icon size="18"><Copy /></n-icon>
              <span>复制</span>
            </button>
            <button class="nexus-ghost-btn" @click="editor.handlePaste()" title="粘贴">
              <n-icon size="18"><ClipboardPaste /></n-icon>
              <span>粘贴</span>
            </button>
          </div>
        </div>
        <div class="ribbon-group">
          <span class="group-title">字体</span>
          <div class="group-content">
            <div class="font-controls">
              <n-select
                v-model:value="editor.selectedFont.value"
                :options="editor.fontOptions"
                size="tiny"
                class="se-font-select"
                :bordered="false"
              />
              <n-select
                v-model:value="editor.selectedFontSize.value"
                :options="editor.fontSizeOptions"
                size="tiny"
                class="se-size-select"
                :bordered="false"
              />
            </div>
            <div class="format-buttons">
              <button :class="['nexus-toggle-btn', { active: editor.isBold.value }]" @click="editor.toggleBold()" title="加粗">
                <span class="format-letter format-bold">B</span>
              </button>
              <button :class="['nexus-toggle-btn', { active: editor.isItalic.value }]" @click="editor.toggleItalic()" title="斜体">
                <span class="format-letter format-italic">I</span>
              </button>
              <button :class="['nexus-toggle-btn', { active: editor.isUnderline.value }]" @click="editor.toggleUnderline()" title="下划线">
                <span class="format-letter format-underline">U</span>
              </button>
            </div>
          </div>
        </div>
        <div class="ribbon-group">
          <span class="group-title">段落</span>
          <div class="group-content">
            <div class="align-buttons">
              <button :class="['nexus-toggle-btn', { active: editor.textAlign.value === 'left' }]" @click="editor.setTextAlign('left')">
                <n-icon size="16"><AlignLeft /></n-icon>
              </button>
              <button :class="['nexus-toggle-btn', { active: editor.textAlign.value === 'center' }]" @click="editor.setTextAlign('center')">
                <n-icon size="16"><AlignCenter /></n-icon>
              </button>
              <button :class="['nexus-toggle-btn', { active: editor.textAlign.value === 'right' }]" @click="editor.setTextAlign('right')">
                <n-icon size="16"><AlignRight /></n-icon>
              </button>
            </div>
            <div class="list-buttons">
              <button :class="['nexus-toggle-btn', { active: editor.isBulletList.value }]" @click="editor.toggleBulletList()">
                <n-icon size="16"><List /></n-icon>
              </button>
              <button :class="['nexus-toggle-btn', { active: editor.isNumberedList.value }]" @click="editor.toggleNumberedList()">
                <n-icon size="16"><ListOrdered /></n-icon>
              </button>
            </div>
          </div>
        </div>
        <div class="ribbon-group">
          <span class="group-title">AI 助手</span>
          <div class="group-content">
            <button class="nexus-pill-btn ai-toggle" @click="editor.aiGenerateOutline()">
              <Sparkles class="nexus-icon" />
              生成大纲
            </button>
            <button class="nexus-pill-btn ai-toggle" @click="editor.aiExpandContent()">
              <Sparkles class="nexus-icon" />
              扩写内容
            </button>
            <button class="nexus-pill-btn ai-toggle" @click="editor.aiGenerateNotes()">
              <Sparkles class="nexus-icon" />
              演讲备注
            </button>
          </div>
        </div>
      </template>

      <template v-if="editor.activeTab.value === 'insert'">
        <div class="ribbon-group">
          <span class="group-title">插入元素</span>
          <div class="group-content">
            <button class="nexus-pill-btn" @click="editor.insertTextBox()">
              <n-icon size="16"><Type /></n-icon>
              文本框
            </button>
            <button class="nexus-pill-btn" @click="editor.insertImage()">
              <n-icon size="16"><Image /></n-icon>
              图片
            </button>
            <button class="nexus-pill-btn" @click="editor.insertShape()">
              <n-icon size="16"><Square /></n-icon>
              形状
            </button>
            <button class="nexus-pill-btn" @click="editor.insertTable()">
              <n-icon size="16"><Table /></n-icon>
              表格
            </button>
          </div>
        </div>
        <div class="ribbon-group">
          <span class="group-title">AI 生成</span>
          <div class="group-content">
            <button class="nexus-pill-btn ai-toggle" @click="editor.aiGenerateSlides()">
              <Sparkles class="nexus-icon" />
              生成幻灯片
            </button>
            <button class="nexus-pill-btn ai-toggle" @click="editor.aiDesignSuggest()">
              <Sparkles class="nexus-icon" />
              设计建议
            </button>
          </div>
        </div>
      </template>

      <template v-if="editor.activeTab.value === 'design'">
        <div class="ribbon-group">
          <span class="group-title">主题</span>
          <div class="group-content theme-grid">
            <div
              v-for="theme in editor.themes.slice(0, 6)"
              :key="theme.key"
              :class="['theme-item', { active: editor.currentTheme.value === theme.key }]"
              @click="editor.applyTheme(theme.key)"
            >
              <div class="theme-preview" :style="{ background: theme.preview }">
                <div class="theme-text" :style="{ color: theme.textColor }">Aa</div>
              </div>
              <span class="theme-name">{{ theme.name }}</span>
            </div>
          </div>
        </div>
        <div class="ribbon-group">
          <span class="group-title">背景</span>
          <div class="group-content">
            <div class="color-grid">
              <div
                v-for="color in editor.backgroundColors.slice(0, 8)"
                :key="color"
                class="color-item"
                :style="{ background: color }"
                @click="editor.applyBackgroundColor(color)"
              ></div>
            </div>
          </div>
        </div>
        <div class="ribbon-group">
          <span class="group-title">版式</span>
          <div class="group-content layout-grid">
            <div
              v-for="layout in editor.slideLayouts.slice(0, 4)"
              :key="layout.key"
              :class="['layout-item', { active: editor.currentLayout.value === layout.key }]"
              @click="editor.applyLayout(layout.key)"
            >
              <div class="layout-preview">
                <div class="layout-inner" :class="layout.key">
                  <div v-if="layout.hasTitle" class="layout-bar layout-title-bar"></div>
                  <div v-if="layout.hasContent" class="layout-bar layout-content-bar"></div>
                </div>
              </div>
              <span class="layout-name">{{ layout.name }}</span>
            </div>
          </div>
        </div>
      </template>

      <template v-if="editor.activeTab.value === 'transition'">
        <div class="ribbon-group">
          <span class="group-title">切换效果</span>
          <div class="group-content">
            <div class="transition-grid">
              <div
                v-for="trans in editor.transitions"
                :key="trans.key"
                :class="['transition-item', { active: editor.currentTransition.value === trans.key }]"
                @click="editor.applyTransition(trans.key)"
              >
                <span>{{ trans.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-if="editor.activeTab.value === 'animation'">
        <div class="ribbon-group">
          <span class="group-title">动画效果</span>
          <div class="group-content">
            <div class="animation-grid">
              <div
                v-for="anim in editor.animations"
                :key="anim.key"
                :class="['animation-item', { active: editor.currentAnimation.value === anim.key }]"
                @click="editor.applyAnimation(anim.key)"
              >
                <span>{{ anim.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </template>
</template>

<script setup lang="ts">
import {
  Sparkles,
  Presentation,
  ArrowLeft,
  Save,
  Download,
  Play,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Type,
  Image,
  Square,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  ChevronDown
} from 'lucide-vue-next'
import { useSlideEditorContext } from '@/composables/useSlideEditor'

const editor = useSlideEditorContext()
</script>
