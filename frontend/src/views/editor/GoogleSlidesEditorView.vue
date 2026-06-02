<template>
  <div class="google-slides-editor">
    <!-- 顶部菜单栏 -->
    <header class="gs-header">
      <div class="gs-header-left">
        <!-- Logo -->
        <div class="gs-logo">
          <div class="gs-logo-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="#fbbc04" d="M4 4h6v6H4z"/>
              <path fill="#ea4335" d="M14 4h6v6h-6z"/>
              <path fill="#34a853" d="M4 14h6v6H4z"/>
              <path fill="#4285f4" d="M14 14h6v6h-6z"/>
            </svg>
          </div>
        </div>
        <!-- 文档信息 -->
        <div class="gs-doc-info">
          <input
            v-model="fileName"
            class="gs-doc-title"
            placeholder="无标题演示文稿"
            @blur="handleSaveFileName"
          />
          <div class="gs-doc-menu">
            <span
              v-for="menu in topMenus"
              :key="menu.key"
              class="gs-menu-item"
              @click="handleMenuClick(menu.key)"
            >
              {{ menu.label }}
            </span>
          </div>
        </div>
      </div>
      <div class="gs-header-right">
        <n-space size="small">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button text class="gs-header-btn" @click="showAiPanel = !showAiPanel">
                <n-icon :size="20">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"/>
                  </svg>
                </n-icon>
              </n-button>
            </template>
            AI 助手
          </n-tooltip>
          <n-button class="gs-share-btn" type="primary" size="small">
            <n-icon :size="16">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
              </svg>
            </n-icon>
            共享
          </n-button>
          <n-avatar
            :size="32"
            class="gs-user-avatar"
          >
            {{ userInitial }}
          </n-avatar>
        </n-space>
      </div>
    </header>

    <!-- 工具栏 -->
    <div class="gs-toolbar">
      <div class="gs-toolbar-left">
        <!-- 撤销/重做 -->
        <n-button
text
size="small"
:disabled="!canUndo"
@click="undo">
          <n-icon :size="18">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
            </svg>
          </n-icon>
        </n-button>
        <n-button
text
size="small"
:disabled="!canRedo"
@click="redo">
          <n-icon :size="18">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
            </svg>
          </n-icon>
        </n-button>
        <n-divider vertical />
        
        <!-- 打印/拼写检查 -->
        <n-button text size="small" @click="print">
          <n-icon :size="18">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
            </svg>
          </n-icon>
        </n-button>
        <n-button text size="small" @click="spellCheck">
          <n-icon :size="18">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </n-icon>
        </n-button>
        <n-divider vertical />
        
        <!-- 缩放 -->
        <n-dropdown :options="zoomOptions" @select="handleZoomSelect">
          <n-button text size="small" class="gs-zoom-btn">
            {{ zoomPercent }}
            <n-icon :size="14">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            </n-icon>
          </n-button>
        </n-dropdown>
      </div>

      <div class="gs-toolbar-center">
        <!-- 字体 -->
        <n-select
          v-model:value="selectedFont"
          :options="fontOptions"
          size="small"
          class="gs-font-select"
          :bordered="false"
        />
        <n-select
          v-model:value="selectedFontSize"
          :options="fontSizeOptions"
          size="small"
          class="gs-size-select"
          :bordered="false"
        />
        <n-divider vertical />
        
        <!-- 加粗/斜体/下划线 -->
        <n-button
          text
          size="small"
          :class="['gs-format-btn', { active: isBold }]"
          @click="toggleBold"
        >
          <span class="gs-format-icon gs-bold">B</span>
        </n-button>
        <n-button
          text
          size="small"
          :class="['gs-format-btn', { active: isItalic }]"
          @click="toggleItalic"
        >
          <span class="gs-format-icon gs-italic">I</span>
        </n-button>
        <n-button
          text
          size="small"
          :class="['gs-format-btn', { active: isUnderline }]"
          @click="toggleUnderline"
        >
          <span class="gs-format-icon gs-underline">U</span>
        </n-button>
        <n-divider vertical />
        
        <!-- 文字颜色 -->
        <n-dropdown trigger="click">
          <n-button text size="small" class="gs-color-btn">
            <span class="gs-color-icon" :style="{ color: textColor }">A</span>
            <n-icon :size="12">
              <svg viewBox="0 0 24 24" width="12" height="12">
                <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            </n-icon>
          </n-button>
          <template #overlay>
            <n-color-picker
              v-model:value="textColor"
              :swatches="colorSwatches"
              @complete="handleTextColorChange"
            />
          </template>
        </n-dropdown>
        <n-divider vertical />
        
        <!-- 对齐方式 -->
        <n-button
          text
          size="small"
          :class="['gs-format-btn', { active: textAlign === 'left' }]"
          @click="setTextAlign('left')"
        >
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
            </svg>
          </n-icon>
        </n-button>
        <n-button
          text
          size="small"
          :class="['gs-format-btn', { active: textAlign === 'center' }]"
          @click="setTextAlign('center')"
        >
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
            </svg>
          </n-icon>
        </n-button>
        <n-button
          text
          size="small"
          :class="['gs-format-btn', { active: textAlign === 'right' }]"
          @click="setTextAlign('right')"
        >
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
            </svg>
          </n-icon>
        </n-button>
        <n-divider vertical />
        
        <!-- 列表 -->
        <n-button
          text
          size="small"
          :class="['gs-format-btn', { active: isBulletList }]"
          @click="toggleBulletList"
        >
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
            </svg>
          </n-icon>
        </n-button>
        <n-button
          text
          size="small"
          :class="['gs-format-btn', { active: isNumberedList }]"
          @click="toggleNumberedList"
        >
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
            </svg>
          </n-icon>
        </n-button>
        <n-divider vertical />
        
        <!-- 缩进 -->
        <n-button text size="small" @click="decreaseIndent">
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M11 17h10v-2H11v2zm-8-5l4 4V8l-4 4zm0 9h18v-2H3v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/>
            </svg>
          </n-icon>
        </n-button>
        <n-button text size="small" @click="increaseIndent">
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm8-4h10v-2H11v2zm8-4H11V7h10v2zM7 11l4-4v8l-4-4zM3 3v2h18V3H3z"/>
            </svg>
          </n-icon>
        </n-button>
        <n-divider vertical />
        
        <!-- 清除格式 -->
        <n-button text size="small" @click="clearFormat">
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM12 6c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm-5 12h10v-1c0-2.33-4.67-3.5-7-3.5S5 14.67 5 17v1z"/>
            </svg>
          </n-icon>
        </n-button>
      </div>

      <div class="gs-toolbar-right">
        <!-- 背景/布局/主题/过渡 -->
        <n-button
          text
          size="small"
          :class="['gs-tool-btn', { active: rightPanel === 'background' }]"
          @click="toggleRightPanel('background')"
        >
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </n-icon>
          背景
        </n-button>
        <n-button
          text
          size="small"
          :class="['gs-tool-btn', { active: rightPanel === 'layout' }]"
          @click="toggleRightPanel('layout')"
        >
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h4v4H7V7zm0 6h4v4H7v-4zm6-6h4v4h-4V7zm0 6h4v4h-4v-4z"/>
            </svg>
          </n-icon>
          布局
        </n-button>
        <n-button
          text
          size="small"
          :class="['gs-tool-btn', { active: rightPanel === 'theme' }]"
          @click="toggleRightPanel('theme')"
        >
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </n-icon>
          主题背景
        </n-button>
        <n-button
          text
          size="small"
          :class="['gs-tool-btn', { active: rightPanel === 'transition' }]"
          @click="toggleRightPanel('transition')"
        >
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M4 18h16c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2zM4 5h16v11H4V5zM1 19h22v2H1z"/>
            </svg>
          </n-icon>
          过渡
        </n-button>
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="gs-main">
      <!-- 左侧幻灯片面板 -->
      <aside class="gs-slide-panel">
        <div class="gs-slide-list">
          <div
            v-for="(slide, index) in slides"
            :key="slide.id"
            :class="['gs-slide-thumb', { active: currentSlideIndex === index }]"
            @click="selectSlide(index)"
          >
            <div class="gs-thumb-number">{{ index + 1 }}</div>
            <div class="gs-thumb-preview" :style="getSlideStyle(slide)">
              <div class="gs-thumb-content">
                <div v-if="slide.title" class="gs-thumb-title">{{ slide.title }}</div>
                <div v-if="slide.subtitle" class="gs-thumb-subtitle">{{ slide.subtitle }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="gs-slide-actions">
          <n-button
text
size="small"
class="gs-add-slide-btn"
@click="addSlide">
            <n-icon :size="16">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </n-icon>
            添加幻灯片
          </n-button>
        </div>
      </aside>

      <!-- 中间编辑区 -->
      <main class="gs-edit-area">
        <!-- 标尺 -->
        <div class="gs-ruler gs-ruler-top">
          <div
v-for="n in 20"
:key="n"
class="gs-ruler-mark"
:style="{ left: `${n * 5}%` }">
            <span v-if="n % 2 === 0" class="gs-ruler-number">{{ n * 5 }}</span>
          </div>
        </div>
        <div class="gs-ruler gs-ruler-left">
          <div
v-for="n in 12"
:key="n"
class="gs-ruler-mark-v"
:style="{ top: `${n * 8}%` }">
            <span v-if="n % 2 === 0" class="gs-ruler-number-v">{{ n * 8 }}</span>
          </div>
        </div>
        
        <!-- 画布容器 -->
        <div class="gs-canvas-wrapper">
          <div
            class="gs-canvas"
            :style="canvasStyle"
          >
            <div v-if="currentSlide" class="gs-slide-content">
              <!-- 标题 -->
              <div
                v-if="currentSlide.title !== undefined"
                class="gs-slide-title"
                contenteditable="true"
                @input="updateTitle($event)"
                @blur="handleContentChange"
                :style="titleStyle"
              >
                {{ currentSlide.title || '点击可添加标题' }}
              </div>
              <!-- 副标题 -->
              <div
                v-if="currentSlide.subtitle !== undefined"
                class="gs-slide-subtitle"
                contenteditable="true"
                @input="updateSubtitle($event)"
                @blur="handleContentChange"
                :style="subtitleStyle"
              >
                {{ currentSlide.subtitle || '点击可添加副标题' }}
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- 右侧面板 -->
      <aside v-if="rightPanel" class="gs-right-panel">
        <div class="gs-panel-header">
          <span>{{ rightPanelTitle }}</span>
          <n-button text size="small" @click="rightPanel = null">
            <n-icon :size="16">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </n-icon>
          </n-button>
        </div>
        
        <!-- 主题背景面板 -->
        <div v-if="rightPanel === 'theme'" class="gs-panel-content">
          <div class="gs-theme-section">
            <div class="gs-section-title">此演示文稿中的主题背景</div>
            <n-select v-model:value="currentTheme" :options="themeOptions" size="small" />
          </div>
          <div class="gs-theme-grid">
            <div
              v-for="theme in themes"
              :key="theme.key"
              :class="['gs-theme-item', { active: currentTheme === theme.key }]"
              @click="applyTheme(theme.key)"
            >
              <div class="gs-theme-preview" :style="{ background: theme.preview }">
                <div class="gs-theme-text">
                  <div class="gs-theme-title">点击可添加标题</div>
                  <div class="gs-theme-subtitle">点击可添加副标题</div>
                </div>
              </div>
              <div class="gs-theme-name">{{ theme.name }}</div>
            </div>
          </div>
          <n-button class="gs-import-theme-btn" block dashed>
            导入主题背景
          </n-button>
        </div>

        <!-- 背景面板 -->
        <div v-if="rightPanel === 'background'" class="gs-panel-content">
          <div class="gs-bg-section">
            <div class="gs-section-title">颜色</div>
            <div class="gs-color-grid">
              <div
                v-for="color in backgroundColors"
                :key="color"
                class="gs-color-item"
                :style="{ background: color }"
                @click="applyBackgroundColor(color)"
              ></div>
            </div>
          </div>
          <div class="gs-bg-section">
            <div class="gs-section-title">图片</div>
            <n-button block dashed @click="insertBackgroundImage">
              <n-icon :size="16">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </n-icon>
              选择图片
            </n-button>
          </div>
        </div>

        <!-- 布局面板 -->
        <div v-if="rightPanel === 'layout'" class="gs-panel-content">
          <div class="gs-layout-grid">
            <div
              v-for="layout in slideLayouts"
              :key="layout.key"
              :class="['gs-layout-item', { active: currentLayout === layout.key }]"
              @click="applyLayout(layout.key)"
            >
              <div class="gs-layout-preview">
                <div class="gs-layout-inner" :class="layout.key">
                  <div v-if="layout.hasTitle" class="gs-layout-bar gs-layout-title-bar" ></div>
                  <div v-if="layout.hasContent" class="gs-layout-bar gs-layout-content-bar" ></div>
                  <div v-if="layout.hasSubtitle" class="gs-layout-bar gs-layout-subtitle-bar" ></div>
                </div>
              </div>
              <div class="gs-layout-name">{{ layout.name }}</div>
            </div>
          </div>
        </div>

        <!-- 过渡面板 -->
        <div v-if="rightPanel === 'transition'" class="gs-panel-content">
          <div class="gs-transition-list">
            <div
              v-for="trans in transitions"
              :key="trans.key"
              :class="['gs-transition-item', { active: currentTransition === trans.key }]"
              @click="applyTransition(trans.key)"
            >
              <n-icon :size="20">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" :d="trans.svgPath"/>
                </svg>
              </n-icon>
              <span>{{ trans.name }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- AI 面板 -->
      <aside v-if="showAiPanel" class="gs-ai-panel">
        <div class="gs-ai-header">
          <span class="gs-ai-title">
            <n-icon :size="18">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"/>
              </svg>
            </n-icon>
            AI 助手
          </span>
          <n-button text size="small" @click="showAiPanel = false">
            <n-icon :size="16">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </n-icon>
          </n-button>
        </div>
        <div class="gs-ai-content">
          <div class="gs-ai-placeholder">
            <p>AI 助手功能即将上线</p>
            <p class="gs-ai-subtitle">可以帮助您生成幻灯片内容、优化文案等</p>
          </div>
        </div>
      </aside>
    </div>

    <!-- 底部备注区 -->
    <footer class="gs-notes-area">
      <div class="gs-notes-header" @click="toggleNotes">
        <n-icon :size="14">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" :d="showNotes ? 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z' : 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z'"/>
          </svg>
        </n-icon>
        <span>演讲者备注</span>
      </div>
      <div v-show="showNotes" class="gs-notes-content">
        <textarea
          v-model="currentSlideNotes"
          class="gs-notes-input"
          placeholder="点击以添加演讲者备注"
          @blur="handleSaveNotes"
        ></textarea>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'

// 路由和状态
const route = useRoute()
const router = useRouter()
const message = useMessage()
const projectId = route.params.id as string
const fileId = route.params.fileId as string | undefined

// 用户信息
const userInitial = computed(() => {
  // 简化处理，实际应该从store获取
  return 'U'
})

// 文件信息
const fileName = ref('无标题演示文稿')
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
let saveTimer: ReturnType<typeof setTimeout> | null = null

// 顶部菜单
const topMenus = [
  { key: 'file', label: '文件' },
  { key: 'edit', label: '编辑' },
  { key: 'view', label: '查看' },
  { key: 'insert', label: '插入' },
  { key: 'format', label: '格式' },
  { key: 'slide', label: '幻灯片' },
  { key: 'arrange', label: '排列' },
  { key: 'tools', label: '工具' },
  { key: 'extensions', label: '扩展程序' },
  { key: 'help', label: '帮助' }
]

// 工具栏状态
const selectedFont = ref('Arial')
const selectedFontSize = ref(24)
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)
const textColor = ref('#000000')
const textAlign = ref('left')
const isBulletList = ref(false)
const isNumberedList = ref(false)
const canUndo = ref(false)
const canRedo = ref(false)
const zoomLevel = ref(100)

const zoomPercent = computed(() => `${zoomLevel.value}%`)

const fontOptions = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Roboto', value: 'Roboto' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '宋体', value: 'SimSun' },
  { label: '黑体', value: 'SimHei' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Georgia', value: 'Georgia' }
]

const fontSizeOptions = [
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10', value: 10 },
  { label: '11', value: 11 },
  { label: '12', value: 12 },
  { label: '14', value: 14 },
  { label: '16', value: 16 },
  { label: '18', value: 18 },
  { label: '20', value: 20 },
  { label: '24', value: 24 },
  { label: '28', value: 28 },
  { label: '32', value: 32 },
  { label: '36', value: 36 },
  { label: '40', value: 40 },
  { label: '44', value: 44 },
  { label: '48', value: 48 },
  { label: '54', value: 54 },
  { label: '60', value: 60 },
  { label: '66', value: 66 },
  { label: '72', value: 72 },
  { label: '80', value: 80 },
  { label: '88', value: 88 },
  { label: '96', value: 96 }
]

const zoomOptions = [
  { label: '50%', key: 50 },
  { label: '75%', key: 75 },
  { label: '90%', key: 90 },
  { label: '100%', key: 100 },
  { label: '125%', key: 125 },
  { label: '150%', key: 150 },
  { label: '200%', key: 200 }
]

const colorSwatches = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'
]

// 右侧面板
const rightPanel = ref<'theme' | 'background' | 'layout' | 'transition' | null>('theme')
const rightPanelTitle = computed(() => {
  const titles: Record<string, string> = {
    theme: '主题背景',
    background: '背景',
    layout: '布局',
    transition: '过渡'
  }
  return titles[rightPanel.value || ''] || ''
})

// 主题
const currentTheme = ref('light')
const themeOptions = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' }
]

const themes = [
  { key: 'light', name: '纯浅色', preview: '#ffffff', textColor: '#000000' },
  { key: 'dark', name: '纯深色', preview: '#1a1a2e', textColor: '#ffffff' },
  { key: 'blue', name: '蓝色', preview: '#e3f2fd', textColor: '#1565c0' },
  { key: 'green', name: '绿色', preview: '#e8f5e9', textColor: '#2e7d32' },
  { key: 'red', name: '红色', preview: '#ffebee', textColor: '#c62828' },
  { key: 'purple', name: '紫色', preview: '#f3e5f5', textColor: '#6a1b9a' }
]

// 背景颜色
const backgroundColors = [
  '#ffffff', '#f5f5f5', '#eeeeee', '#e0e0e0', '#bdbdbd', '#9e9e9e',
  '#757575', '#616161', '#424242', '#212121', '#000000', '#ffebee',
  '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935',
  '#d32f2f', '#c62828', '#b71c1c', '#fce4ec', '#f8bbd9', '#f48fb1'
]

// 幻灯片数据
interface Slide {
  id: string
  layout: string
  title?: string
  subtitle?: string
  background?: string
  theme?: string
  notes?: string
}

const slides = ref<Slide[]>([
  {
    id: 'slide-1',
    layout: 'title',
    title: '',
    subtitle: '',
    theme: 'light',
    notes: ''
  }
])
const currentSlideIndex = ref(0)
const currentSlide = computed(() => slides.value[currentSlideIndex.value])

// 幻灯片版式
const currentLayout = computed(() => currentSlide.value?.layout || 'title')

const slideLayouts = [
  { key: 'blank', name: '空白', hasTitle: false, hasContent: false, hasSubtitle: false },
  { key: 'title', name: '标题', hasTitle: true, hasContent: false, hasSubtitle: true },
  { key: 'title-content', name: '标题和内容', hasTitle: true, hasContent: true, hasSubtitle: false },
  { key: 'title-two-content', name: '标题和两栏内容', hasTitle: true, hasContent: true, hasSubtitle: false },
  { key: 'section', name: '节标题', hasTitle: true, hasContent: false, hasSubtitle: false },
  { key: 'caption', name: '标题和说明', hasTitle: true, hasContent: true, hasSubtitle: false }
]

// 过渡效果
const currentTransition = ref('none')
const transitions = [
  { key: 'none', name: '无', svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' },
  { key: 'fade', name: '淡入', svgPath: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' },
  { key: 'slide', name: '滑动', svgPath: 'M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z' },
  { key: 'zoom', name: '缩放', svgPath: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' },
  { key: 'flip', name: '翻转', svgPath: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z' }
]

// 演讲者备注
const showNotes = ref(false)

// AI 面板
const showAiPanel = ref(false)

// 画布样式
const canvasStyle = computed(() => ({
  transform: `scale(${zoomLevel.value / 100})`,
  background: currentSlide.value?.background || '#ffffff'
}))

// 标题样式
const titleStyle = computed(() => ({
  color: themes.find(t => t.key === currentSlide.value?.theme)?.textColor || '#000000'
}))

// 副标题样式
const subtitleStyle = computed(() => ({
  color: themes.find(t => t.key === currentSlide.value?.theme)?.textColor || '#5f6368'
}))

// 当前幻灯片备注
const currentSlideNotes = computed({
  get: () => currentSlide.value?.notes || '',
  set: (val: string) => {
    if (currentSlide.value) {
      currentSlide.value.notes = val
    }
  }
})

// 初始化
onMounted(() => {
  // 简化处理，实际应该从API加载
  console.log('Google Slides Editor mounted, projectId:', projectId)
})

// 方法
function handleMenuClick(menu: string) {
  message.info(`点击菜单: ${menu}`)
}

function handleSaveFileName() {
  handleContentChange()
}

function handleContentChange() {
  saveStatus.value = 'unsaved'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveProject()
  }, 1000)
}

async function saveProject() {
  saveStatus.value = 'saving'
  // 简化处理，实际应该调用API
  setTimeout(() => {
    saveStatus.value = 'saved'
    message.success('已保存')
  }, 500)
}

// 缩放
function handleZoomSelect(key: number) {
  zoomLevel.value = key
}

// 格式操作
function toggleBold() {
  isBold.value = !isBold.value
}

function toggleItalic() {
  isItalic.value = !isItalic.value
}

function toggleUnderline() {
  isUnderline.value = !isUnderline.value
}

function setTextAlign(align: string) {
  textAlign.value = align
}

function toggleBulletList() {
  isBulletList.value = !isBulletList.value
  if (isBulletList.value) isNumberedList.value = false
}

function toggleNumberedList() {
  isNumberedList.value = !isNumberedList.value
  if (isNumberedList.value) isBulletList.value = false
}

function increaseIndent() {
  message.info('增加缩进')
}

function decreaseIndent() {
  message.info('减少缩进')
}

function clearFormat() {
  isBold.value = false
  isItalic.value = false
  isUnderline.value = false
  textColor.value = '#000000'
  textAlign.value = 'left'
  isBulletList.value = false
  isNumberedList.value = false
}

function handleTextColorChange(color: string) {
  textColor.value = color
}

// 工具栏操作
function undo() {
  message.info('撤销')
}

function redo() {
  message.info('重做')
}

function print() {
  message.info('打印')
}

function spellCheck() {
  message.info('拼写检查')
}

// 幻灯片操作
function addSlide() {
  const newSlide: Slide = {
    id: `slide-${Date.now()}`,
    layout: 'title',
    title: '',
    subtitle: '',
    theme: 'light',
    notes: ''
  }
  slides.value.push(newSlide)
  currentSlideIndex.value = slides.value.length - 1
  handleContentChange()
}

function selectSlide(index: number) {
  currentSlideIndex.value = index
}

function getSlideStyle(slide: Slide) {
  const theme = themes.find(t => t.key === slide.theme)
  return {
    background: slide.background || theme?.preview || '#ffffff'
  }
}

// 右侧面板
function toggleRightPanel(panel: 'theme' | 'background' | 'layout' | 'transition') {
  if (rightPanel.value === panel) {
    rightPanel.value = null
  } else {
    rightPanel.value = panel
  }
}

// 主题
function applyTheme(theme: string) {
  currentTheme.value = theme
  if (currentSlide.value) {
    currentSlide.value.theme = theme
    handleContentChange()
  }
}

// 背景
function applyBackgroundColor(color: string) {
  if (currentSlide.value) {
    currentSlide.value.background = color
    handleContentChange()
  }
}

function insertBackgroundImage() {
  message.info('插入背景图片')
}

// 版式
function applyLayout(layout: string) {
  if (currentSlide.value) {
    currentSlide.value.layout = layout
    const layoutConfig = slideLayouts.find(l => l.key === layout)
    if (layoutConfig) {
      if (!layoutConfig.hasTitle) delete currentSlide.value.title
      else if (currentSlide.value.title === undefined) currentSlide.value.title = ''
      
      if (!layoutConfig.hasSubtitle) delete currentSlide.value.subtitle
      else if (currentSlide.value.subtitle === undefined) currentSlide.value.subtitle = ''
    }
    handleContentChange()
  }
}

// 过渡
function applyTransition(transition: string) {
  currentTransition.value = transition
  message.success('已应用过渡效果')
}

// 内容编辑
function updateTitle(event: Event) {
  if (currentSlide.value) {
    currentSlide.value.title = (event.target as HTMLElement).innerText
  }
}

function updateSubtitle(event: Event) {
  if (currentSlide.value) {
    currentSlide.value.subtitle = (event.target as HTMLElement).innerText
  }
}

// 备注
function toggleNotes() {
  showNotes.value = !showNotes.value
}

function handleSaveNotes() {
  handleContentChange()
}
</script>

<style scoped lang="scss">
.google-slides-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: #f8f9fa;
  overflow: hidden;
  font-family: 'Roboto', 'Microsoft YaHei', sans-serif;
}

// 顶部菜单栏
.gs-header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #dadce0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;

  .gs-header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .gs-logo {
      .gs-logo-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: #f1f3f4;
      }
    }

    .gs-doc-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .gs-doc-title {
        font-size: 18px;
        font-weight: 400;
        color: #202124;
        border: none;
        background: transparent;
        padding: 2px 8px;
        border-radius: 4px;
        width: 300px;

        &:hover {
          background: #f1f3f4;
        }

        &:focus {
          outline: none;
          background: #e8f0fe;
        }
      }

      .gs-doc-menu {
        display: flex;
        gap: 8px;

        .gs-menu-item {
          font-size: 13px;
          color: #5f6368;
          padding: 2px 8px;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background: #f1f3f4;
            color: #202124;
          }
        }
      }
    }
  }

  .gs-header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .gs-header-btn {
      color: #5f6368;

      &:hover {
        color: #202124;
        background: #f1f3f4;
      }
    }

    .gs-share-btn {
      background: #1a73e8;
      border-radius: 4px;
      font-weight: 500;

      &:hover {
        background: #1557b0;
      }
    }

    .gs-user-avatar {
      cursor: pointer;
    }
  }
}

// 工具栏
.gs-toolbar {
  height: 48px;
  background: #ffffff;
  border-bottom: 1px solid #dadce0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;

  .gs-toolbar-left,
  .gs-toolbar-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .gs-toolbar-center {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    justify-content: center;
  }

  .gs-zoom-btn {
    font-size: 13px;
    color: #5f6368;
  }

  .gs-font-select {
    width: 120px;
  }

  .gs-size-select {
    width: 70px;
  }

  .gs-format-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;

    &:hover {
      background: #f1f3f4;
    }

    &.active {
      background: #e8f0fe;
      color: #1a73e8;
    }

    .gs-format-icon {
      font-size: 14px;
      font-family: 'Times New Roman', serif;

      &.gs-bold {
        font-weight: bold;
      }

      &.gs-italic {
        font-style: italic;
      }

      &.gs-underline {
        text-decoration: underline;
      }
    }
  }

  .gs-color-btn {
    display: flex;
    align-items: center;
    gap: 2px;

    .gs-color-icon {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .gs-tool-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 13px;
    color: #5f6368;

    &:hover {
      background: #f1f3f4;
      color: #202124;
    }

    &.active {
      background: #e8f0fe;
      color: #1a73e8;
    }
  }
}

// 主体区域
.gs-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// 左侧幻灯片面板
.gs-slide-panel {
  width: 220px;
  background: #f8f9fa;
  border-right: 1px solid #dadce0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .gs-slide-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;

    .gs-slide-thumb {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      cursor: pointer;

      &:hover {
        .gs-thumb-preview {
          border-color: #dadce0;
        }
      }

      &.active {
        .gs-thumb-preview {
          border-color: #1a73e8;
          box-shadow: 0 0 0 2px #e8f0fe;
        }
      }

      .gs-thumb-number {
        font-size: 12px;
        color: #5f6368;
        width: 20px;
        text-align: right;
        padding-top: 8px;
      }

      .gs-thumb-preview {
        flex: 1;
        aspect-ratio: 16 / 9;
        background: #ffffff;
        border: 1px solid #dadce0;
        border-radius: 4px;
        overflow: hidden;
        padding: 12px;
        transition: all 0.2s;

        .gs-thumb-content {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .gs-thumb-title {
            font-size: 8px;
            font-weight: 500;
            color: #202124;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .gs-thumb-subtitle {
            font-size: 6px;
            color: #5f6368;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
        }
      }
    }
  }

  .gs-slide-actions {
    padding: 12px 16px;
    border-top: 1px solid #dadce0;

    .gs-add-slide-btn {
      width: 100%;
      justify-content: center;
      color: #1a73e8;

      &:hover {
        background: #e8f0fe;
      }
    }
  }
}

// 中间编辑区
.gs-edit-area {
  flex: 1;
  display: flex;
  background: #f8f9fa;
  position: relative;
  overflow: auto;

  .gs-ruler {
    position: absolute;
    background: #ffffff;
    z-index: 10;

    &.gs-ruler-top {
      top: 0;
      left: 24px;
      right: 0;
      height: 24px;
      border-bottom: 1px solid #dadce0;
    }

    &.gs-ruler-left {
      left: 0;
      top: 24px;
      bottom: 0;
      width: 24px;
      border-right: 1px solid #dadce0;
    }

    .gs-ruler-mark {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: #dadce0;

      .gs-ruler-number {
        position: absolute;
        top: 4px;
        left: 2px;
        font-size: 9px;
        color: #5f6368;
      }
    }

    .gs-ruler-mark-v {
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: #dadce0;

      .gs-ruler-number-v {
        position: absolute;
        left: 4px;
        top: 2px;
        font-size: 9px;
        color: #5f6368;
      }
    }
  }

  .gs-canvas-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
    margin-left: 24px;
    margin-top: 24px;

    .gs-canvas {
      width: 960px;
      height: 540px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      position: relative;
      transform-origin: center center;
      transition: transform 0.2s;

      .gs-slide-content {
        width: 100%;
        height: 100%;
        padding: 48px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;

        .gs-slide-title {
          font-size: 40px;
          font-weight: 400;
          color: #202124;
          text-align: center;
          outline: none;
          width: 100%;

          &:empty::before {
            content: '点击可添加标题';
            color: #bdc1c6;
          }
        }

        .gs-slide-subtitle {
          font-size: 20px;
          font-weight: 400;
          color: #5f6368;
          text-align: center;
          outline: none;
          width: 100%;

          &:empty::before {
            content: '点击可添加副标题';
            color: #bdc1c6;
          }
        }
      }
    }
  }
}

// 右侧面板
.gs-right-panel {
  width: 280px;
  background: #ffffff;
  border-left: 1px solid #dadce0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .gs-panel-header {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid #dadce0;
    font-size: 14px;
    font-weight: 500;
    color: #202124;
  }

  .gs-panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;

    .gs-section-title {
      font-size: 12px;
      font-weight: 500;
      color: #5f6368;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .gs-theme-section {
      margin-bottom: 16px;
    }

    .gs-theme-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;

      .gs-theme-item {
        cursor: pointer;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid transparent;
        transition: all 0.2s;

        &:hover {
          border-color: #dadce0;
        }

        &.active {
          border-color: #1a73e8;
        }

        .gs-theme-preview {
          aspect-ratio: 16 / 9;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;

          .gs-theme-text {
            text-align: center;

            .gs-theme-title {
              font-size: 12px;
              font-weight: 500;
              margin-bottom: 4px;
            }

            .gs-theme-subtitle {
              font-size: 9px;
            }
          }
        }

        .gs-theme-name {
          padding: 8px;
          font-size: 12px;
          color: #5f6368;
          text-align: center;
          background: #f8f9fa;
        }
      }
    }

    .gs-import-theme-btn {
      margin-top: 16px;
    }

    .gs-bg-section {
      margin-bottom: 24px;

      .gs-color-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;

        .gs-color-item {
          aspect-ratio: 1;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;

          &:hover {
            transform: scale(1.1);
            border-color: #dadce0;
          }
        }
      }
    }

    .gs-layout-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      .gs-layout-item {
        cursor: pointer;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid transparent;
        transition: all 0.2s;

        &:hover {
          border-color: #dadce0;
        }

        &.active {
          border-color: #1a73e8;
        }

        .gs-layout-preview {
          aspect-ratio: 16 / 9;
          background: #f8f9fa;
          padding: 12px;

          .gs-layout-inner {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 4px;

            .gs-layout-bar {
              background: #dadce0;
              border-radius: 2px;

              &.gs-layout-title-bar {
                height: 8px;
                width: 60%;
              }

              &.gs-layout-content-bar {
                flex: 1;
              }

              &.gs-layout-subtitle-bar {
                height: 6px;
                width: 40%;
              }
            }
          }
        }

        .gs-layout-name {
          padding: 8px;
          font-size: 12px;
          color: #5f6368;
          text-align: center;
          background: #f8f9fa;
        }
      }
    }

    .gs-transition-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .gs-transition-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #f1f3f4;
        }

        &.active {
          background: #e8f0fe;
          color: #1a73e8;
        }

        span {
          font-size: 14px;
        }
      }
    }
  }
}

// AI 面板
.gs-ai-panel {
  width: 340px;
  background: #ffffff;
  border-left: 1px solid #dadce0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .gs-ai-header {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid #dadce0;
    background: #f8f9fa;

    .gs-ai-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #1a73e8;
    }
  }

  .gs-ai-content {
    flex: 1;
    overflow: hidden;
    padding: 16px;

    .gs-ai-placeholder {
      text-align: center;
      padding: 40px 20px;
      color: #5f6368;

      p {
        margin: 0 0 8px;
        font-size: 16px;
      }

      .gs-ai-subtitle {
        font-size: 13px;
        color: #9aa0a6;
      }
    }
  }
}

// 底部备注区
.gs-notes-area {
  background: #ffffff;
  border-top: 1px solid #dadce0;
  flex-shrink: 0;

  .gs-notes-header {
    height: 32px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    background: #f8f9fa;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    color: #5f6368;

    &:hover {
      background: #f1f3f4;
    }
  }

  .gs-notes-content {
    padding: 12px 16px;

    .gs-notes-input {
      width: 100%;
      min-height: 60px;
      border: none;
      resize: vertical;
      font-size: 14px;
      line-height: 1.5;
      color: #202124;
      background: transparent;

      &:focus {
        outline: none;
      }

      &::placeholder {
        color: #bdc1c6;
      }
    }
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .gs-right-panel {
    width: 240px;
  }
}

@media (max-width: 992px) {
  .gs-slide-panel {
    width: 180px;
  }

  .gs-right-panel {
    display: none;
  }
}
</style>
