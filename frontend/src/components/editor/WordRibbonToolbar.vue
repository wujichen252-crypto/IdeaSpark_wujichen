<template>
  <div class="word-ribbon-toolbar">
    <!-- 快速访问工具栏 -->
    <div class="quick-access-toolbar">
      <div class="quick-access-left">
        <button class="nexus-icon-btn" @click="handleBack" title="返回">
          <n-icon size="18"><ArrowBackOutline /></n-icon>
        </button>
        <div class="nexus-divider-v" ></div>
        <button
          class="nexus-icon-btn"
          :disabled="!canUndo"
          title="撤销 (Ctrl+Z)"
          @click="handleUndo"
        >
          <n-icon size="16"><ArrowUndoOutline /></n-icon>
        </button>
        <button
          class="nexus-icon-btn"
          :disabled="!canRedo"
          title="重做 (Ctrl+Y)"
          @click="handleRedo"
        >
          <n-icon size="16"><ArrowRedoOutline /></n-icon>
        </button>
        <button class="nexus-icon-btn" title="保存 (Ctrl+S)" @click="handleSave">
          <n-icon size="16"><SaveOutline /></n-icon>
        </button>
      </div>

      <div class="document-title">
        <input
          v-model="localTitle"
          class="title-input"
          placeholder="无标题文档"
          @blur="handleTitleChange"
          @keydown.enter="handleTitleChange"
        />
      </div>

      <div class="quick-access-right">
        <span v-if="saveStatus === 'saved'" class="save-status saved">
          <n-icon size="14"><CheckmarkCircleOutline /></n-icon>
          已保存
        </span>
        <span v-else-if="saveStatus === 'saving'" class="save-status saving">
          <n-icon size="14"><TimeOutline /></n-icon>
          保存中...
        </span>
        <span v-else class="save-status unsaved">
          <n-icon size="14"><EllipseOutline /></n-icon>
          未保存
        </span>

        <div class="nexus-divider-v" ></div>

        <button
          class="nexus-icon-btn"
          :class="{ active: showAiPanel }"
          title="AI 助手"
          @click="toggleAiPanel"
        >
          <n-icon size="16"><SparklesOutline /></n-icon>
        </button>

        <button class="nexus-icon-btn" title="导出" @click="handleExport">
          <n-icon size="16"><DownloadOutline /></n-icon>
        </button>

        <button class="nexus-icon-btn" title="打印" @click="handlePrint">
          <n-icon size="16"><PrintOutline /></n-icon>
        </button>
      </div>
    </div>

    <!-- Ribbon 选项卡 -->
    <div class="ribbon-tabs">
      <div
        v-for="tab in ribbonTabs"
        :key="tab.key"
        :class="['ribbon-tab', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- Ribbon 功能区 -->
    <div class="ribbon-content">
      <!-- 开始选项卡 -->
      <template v-if="activeTab === 'home'">
        <div class="ribbon-group">
          <div class="group-title">剪贴板</div>
          <div class="group-content">
            <button class="nexus-pill-btn" @click="handlePaste">
              <n-icon size="14"><ClipboardOutline /></n-icon>
              粘贴
            </button>
            <div class="btn-row">
              <button class="nexus-ghost-btn" @click="handleCut">
                <n-icon size="14"><CutOutline /></n-icon>
                剪切
              </button>
              <button class="nexus-ghost-btn" @click="handleCopy">
                <n-icon size="14"><CopyOutline /></n-icon>
                复制
              </button>
            </div>
          </div>
        </div>

        <div class="group-divider" ></div>

        <div class="ribbon-group">
          <div class="group-title">字体</div>
          <div class="group-content">
            <div class="font-row">
              <n-select
                v-model:value="fontFamily"
                :options="fontOptions"
                size="small"
                class="font-select nexus-nui-select"
                @update:value="handleFontChange"
              />
              <n-select
                v-model:value="fontSize"
                :options="fontSizeOptions"
                size="small"
                class="size-select nexus-nui-select"
                @update:value="handleFontSizeChange"
              />
            </div>
            <div class="format-row">
              <button
                :class="['nexus-toggle-btn', { active: isBold }]"
                title="加粗 (Ctrl+B)"
                @click="toggleBold"
              >
                <b>B</b>
              </button>
              <button
                :class="['nexus-toggle-btn', { active: isItalic }]"
                title="斜体 (Ctrl+I)"
                @click="toggleItalic"
              >
                <i>I</i>
              </button>
              <button
                :class="['nexus-toggle-btn', { active: isUnderline }]"
                title="下划线 (Ctrl+U)"
                @click="toggleUnderline"
              >
                <u>U</u>
              </button>
              <button
                :class="['nexus-toggle-btn', { active: isStrikethrough }]"
                title="删除线"
                @click="toggleStrikethrough"
              >
                <s>S</s>
              </button>
              <div class="nexus-divider-v" ></div>
              <button class="nexus-icon-btn" title="下标" @click="applySubscript">
                <n-icon size="14"><Subscript /></n-icon>
              </button>
              <button class="nexus-icon-btn" title="上标" @click="applySuperscript">
                <n-icon size="14"><Superscript /></n-icon>
              </button>
            </div>
            <div class="color-row">
              <div class="color-picker-wrap">
                <button class="nexus-icon-btn" title="字体颜色" @click="handleFontColor">
                  <n-icon size="14"><Palette /></n-icon>
                </button>
                <div class="color-bar" :style="{ backgroundColor: fontColor }" ></div>
              </div>
              <div class="color-picker-wrap">
                <button class="nexus-icon-btn" title="突出显示" @click="handleHighlightColor">
                  <n-icon size="14"><Highlighter /></n-icon>
                </button>
                <div class="color-bar" :style="{ backgroundColor: highlightColor }" ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="group-divider" ></div>

        <div class="ribbon-group">
          <div class="group-title">段落</div>
          <div class="group-content">
            <div class="btn-row">
              <button
                :class="['nexus-toggle-btn', { active: blockTag === 'h1' }]"
                title="标题 1"
                @click="applyHeading(1)"
              >
                <n-icon size="14"><Type /></n-icon>
                H1
              </button>
              <button
                :class="['nexus-toggle-btn', { active: blockTag === 'h2' }]"
                title="标题 2"
                @click="applyHeading(2)"
              >
                <n-icon size="14"><TextOutline /></n-icon>
                H2
              </button>
              <button
                :class="['nexus-toggle-btn', { active: blockTag === 'h3' }]"
                title="标题 3"
                @click="applyHeading(3)"
              >
                <n-icon size="14"><TextOutline /></n-icon>
                H3
              </button>
            </div>
            <div class="btn-row">
              <button
                :class="['nexus-toggle-btn', { active: isUnorderedList }]"
                title="项目符号"
                @click="applyBulletList"
              >
                <n-icon size="14"><ListOutline /></n-icon>
              </button>
              <button
                :class="['nexus-toggle-btn', { active: isOrderedList }]"
                title="编号"
                @click="applyNumberedList"
              >
                <n-icon size="14"><ReorderTwoOutline /></n-icon>
              </button>
              <button class="nexus-icon-btn" title="任务列表" @click="applyTaskList">
                <n-icon size="14"><CheckmarkCircleOutline /></n-icon>
              </button>
            </div>
            <div class="btn-row">
              <button
                :class="['nexus-toggle-btn', { active: align === 'left' }]"
                title="左对齐"
                @click="alignLeft"
              >
                <n-icon size="14"><AlignLeft /></n-icon>
              </button>
              <button
                :class="['nexus-toggle-btn', { active: align === 'center' }]"
                title="居中"
                @click="alignCenter"
              >
                <n-icon size="14"><AlignCenter /></n-icon>
              </button>
              <button
                :class="['nexus-toggle-btn', { active: align === 'right' }]"
                title="右对齐"
                @click="alignRight"
              >
                <n-icon size="14"><AlignRight /></n-icon>
              </button>
            </div>
          </div>
        </div>

        <div class="group-divider" ></div>

        <div class="ribbon-group">
          <div class="group-title">样式</div>
          <div class="group-content">
            <div class="btn-row">
              <button class="nexus-ghost-btn" @click="applyQuote">
                <n-icon size="14"><ChatbubbleOutline /></n-icon>
                引用
              </button>
              <button class="nexus-ghost-btn" @click="applyCode">
                <n-icon size="14"><CodeOutline /></n-icon>
                代码
              </button>
            </div>
            <div class="btn-row">
              <button class="nexus-ghost-btn" @click="applyLink">
                <n-icon size="14"><LinkOutline /></n-icon>
                链接
              </button>
              <button class="nexus-ghost-btn" @click="applyImage">
                <n-icon size="14"><ImageOutline /></n-icon>
                图片
              </button>
            </div>
          </div>
        </div>

        <div class="group-divider" ></div>

        <div class="ribbon-group">
          <div class="group-title">AI 助手</div>
          <div class="group-content">
            <button
              :class="['nexus-pill-btn', 'ai-toggle', { active: showAiPanel }]"
              @click="toggleAiPanel"
            >
              <n-icon size="14"><SparklesOutline /></n-icon>
              {{ showAiPanel ? '收起 AI' : '展开 AI' }}
            </button>
            <div class="ai-pills">
              <button
                v-for="action in aiActions"
                :key="action.key"
                class="nexus-mini-pill"
                @click="handleAiAction(action.key)"
              >
                {{ action.label }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- 插入选项卡 -->
      <template v-if="activeTab === 'insert'">
        <div class="ribbon-group">
          <div class="group-title">表格</div>
          <div class="group-content">
            <div class="table-picker-wrap">
              <button class="nexus-pill-btn" @click="showTablePicker = !showTablePicker">
                <n-icon size="16"><GridOutline /></n-icon>
                插入表格
              </button>
              <div v-if="showTablePicker" class="table-picker-popover">
                <div class="table-picker-label">{{ tableRows }} × {{ tableCols }}</div>
                <div class="table-picker-grid">
                  <div
                    v-for="r in 6"
                    :key="r"
                    class="table-picker-row"
                  >
                    <div
                      v-for="c in 8"
                      :key="`${r}-${c}`"
                      :class="['table-picker-cell', {
                        hovered: r <= hoverRow && c <= hoverCol,
                        selected: r <= tableRows && c <= tableCols
                      }]"
                      @mouseenter="hoverRow = r; hoverCol = c"
                      @click="confirmTable(r, c)"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="group-divider" ></div>

        <div class="ribbon-group">
          <div class="group-title">图片</div>
          <div class="group-content">
            <button class="nexus-pill-btn" @click="insertImage">
              <n-icon size="16"><ImageOutline /></n-icon>
              插入图片
            </button>
          </div>
        </div>

        <div class="group-divider" ></div>

        <div class="ribbon-group">
          <div class="group-title">链接</div>
          <div class="group-content">
            <button class="nexus-pill-btn" @click="insertLink">
              <n-icon size="16"><LinkOutline /></n-icon>
              插入链接
            </button>
          </div>
        </div>

        <div class="group-divider" ></div>

        <div class="ribbon-group">
          <div class="group-title">特殊字符</div>
          <div class="group-content">
            <div class="special-chars">
              <button
                v-for="char in specialChars"
                :key="char"
                class="nexus-char-btn"
                @click="insertSpecialChar(char)"
              >
                {{ char }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- 布局选项卡 -->
      <template v-if="activeTab === 'layout'">
        <div class="ribbon-group">
          <div class="group-title">视图模式</div>
          <div class="group-content">
            <n-radio-group
              :value="localViewMode"
              size="small"
              @update:value="handleViewModeChange"
            >
              <n-radio-button value="typora">所见即所得</n-radio-button>
              <n-radio-button value="split">分栏预览</n-radio-button>
              <n-radio-button value="source">源码编辑</n-radio-button>
            </n-radio-group>
          </div>
        </div>

        <div class="group-divider" ></div>

        <div class="ribbon-group">
          <div class="group-title">页面设置</div>
          <div class="group-content">
            <button class="nexus-pill-btn" @click="toggleFullScreen">
              <n-icon size="14"><ExpandOutline v-if="!isFullScreen" /><ContractOutline v-else /></n-icon>
              {{ isFullScreen ? '退出全屏' : '全屏编辑' }}
            </button>
          </div>
        </div>
      </template>

      <!-- 文件选项卡 -->
      <template v-if="activeTab === 'file'">
        <div class="ribbon-group">
          <div class="group-title">文件操作</div>
          <div class="group-content">
            <button class="nexus-pill-btn" @click="handleExport">
              <n-icon size="16"><DownloadOutline /></n-icon>
              导出文档
            </button>
            <button class="nexus-pill-btn" @click="handlePrint">
              <n-icon size="16"><PrintOutline /></n-icon>
              打印
            </button>
          </div>
        </div>

        <div class="group-divider" ></div>

        <div class="ribbon-group">
          <div class="group-title">分享</div>
          <div class="group-content">
            <button class="nexus-pill-btn" @click="handleShare">
              <n-icon size="16"><ShareOutline /></n-icon>
              分享文档
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Subscript,
  Superscript,
  Type,
  Palette,
  Highlighter
} from 'lucide-vue-next'
import {
  ArrowBackOutline,
  ArrowUndoOutline,
  ArrowRedoOutline,
  SaveOutline,
  CheckmarkCircleOutline,
  TimeOutline,
  EllipseOutline,
  ClipboardOutline,
  CutOutline,
  CopyOutline,
  SparklesOutline,
  GridOutline,
  ImageOutline,
  LinkOutline,
  DownloadOutline,
  PrintOutline,
  ShareOutline,
  ExpandOutline,
  ContractOutline,
  ChatbubbleOutline,
  CodeOutline,
  ListOutline,
  ReorderTwoOutline
} from '@vicons/ionicons5'
import {
  NIcon,
  NSelect,
  NRadioGroup,
  NRadioButton
} from 'naive-ui'

const props = withDefaults(defineProps<{
  title?: string
  saveStatus?: 'saved' | 'saving' | 'unsaved'
  canUndo?: boolean
  canRedo?: boolean
  showAiPanel?: boolean
  viewMode?: 'typora' | 'split' | 'source'
  isFullScreen?: boolean
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  isStrikethrough?: boolean
  isOrderedList?: boolean
  isUnorderedList?: boolean
  blockTag?: string
  align?: string
  fontColor?: string
  highlightColor?: string
}>(), {
  title: '',
  saveStatus: 'saved',
  canUndo: false,
  canRedo: false,
  showAiPanel: false,
  viewMode: 'typora',
  isFullScreen: false,
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  isOrderedList: false,
  isUnorderedList: false,
  blockTag: 'p',
  align: 'left',
  fontColor: '#000000',
  highlightColor: '#ffff00'
})

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'save'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'title-change', value: string): void
  (e: 'toggle-ai'): void
  (e: 'ai-action', action: string): void
  (e: 'view-mode-change', mode: 'typora' | 'split' | 'source'): void
  (e: 'export'): void
  (e: 'print'): void
  (e: 'share'): void
  (e: 'toggle-fullscreen'): void
  (e: 'format', type: string, value?: any): void
  (e: 'insert', type: string, value?: any): void
  (e: 'insert-table', size: { rows: number; cols: number }): void
}>()

const activeTab = ref('home')
const localTitle = ref(props.title)
const localViewMode = ref(props.viewMode)
const fontFamily = ref('Microsoft YaHei')
const fontSize = ref('14')
const showTablePicker = ref(false)
const tableRows = ref(3)
const tableCols = ref(3)
const hoverRow = ref(0)
const hoverCol = ref(0)

const ribbonTabs = [
  { key: 'file', label: '文件' },
  { key: 'home', label: '开始' },
  { key: 'insert', label: '插入' },
  { key: 'layout', label: '布局' }
]

const fontOptions = [
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '宋体', value: 'SimSun' },
  { label: '黑体', value: 'SimHei' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' }
]

const fontSizeOptions = [
  { label: '10', value: '10' },
  { label: '12', value: '12' },
  { label: '14', value: '14' },
  { label: '16', value: '16' },
  { label: '18', value: '18' },
  { label: '20', value: '20' },
  { label: '24', value: '24' },
  { label: '28', value: '28' },
  { label: '32', value: '32' }
]

const aiActions = [
  { key: 'continue', label: '续写' },
  { key: 'polish', label: '润色' },
  { key: 'format', label: '智能排版' },
  { key: 'summary', label: '摘要' },
  { key: 'toc', label: '目录' }
]

const specialChars = ['—', '–', '…', '©', '®', '™', '°', '±', '×', '÷', '←', '→']

watch(() => props.title, (v) => { localTitle.value = v })
watch(() => props.viewMode, (v) => { localViewMode.value = v })

function handleBack() { emit('back') }
function handleSave() { emit('save') }
function handleUndo() { emit('undo') }
function handleRedo() { emit('redo') }
function handleTitleChange() { emit('title-change', localTitle.value) }
function toggleAiPanel() { emit('toggle-ai') }
function handleAiAction(key: string) { emit('ai-action', key) }
function handleViewModeChange(val: string) { emit('view-mode-change', val as 'typora' | 'split' | 'source') }
function handleExport() { emit('export') }
function handlePrint() { emit('print') }
function handleShare() { emit('share') }
function toggleFullScreen() { emit('toggle-fullscreen') }

function handlePaste() { emit('format', 'paste') }
function handleCut() { emit('format', 'cut') }
function handleCopy() { emit('format', 'copy') }

function handleFontChange(val: string) { emit('format', 'font-family', val) }
function handleFontSizeChange(val: string) { emit('format', 'font-size', val) }

function toggleBold() { emit('format', 'bold') }
function toggleItalic() { emit('format', 'italic') }
function toggleUnderline() { emit('format', 'underline') }
function toggleStrikethrough() { emit('format', 'strikethrough') }
function applySubscript() { emit('format', 'subscript') }
function applySuperscript() { emit('format', 'superscript') }

function handleFontColor() { emit('format', 'font-color', props.fontColor) }
function handleHighlightColor() { emit('format', 'highlight-color', props.highlightColor) }

function applyHeading(level: number) { emit('format', 'heading', level) }
function applyBulletList() { emit('format', 'bullet-list') }
function applyNumberedList() { emit('format', 'numbered-list') }
function applyTaskList() { emit('format', 'task-list') }
function alignLeft() { emit('format', 'align-left') }
function alignCenter() { emit('format', 'align-center') }
function alignRight() { emit('format', 'align-right') }

function applyQuote() { emit('format', 'quote') }
function applyCode() { emit('format', 'code') }
function applyLink() { emit('format', 'link') }
function applyImage() { emit('format', 'image') }
function insertLink() { emit('insert', 'link') }
function insertImage() { emit('insert', 'image') }
function insertSpecialChar(char: string) { emit('insert', 'special-char', char) }

function confirmTable(rows: number, cols: number) {
  tableRows.value = rows
  tableCols.value = cols
  showTablePicker.value = false
  emit('insert-table', { rows, cols })
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.table-picker-wrap')) {
    showTablePicker.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped lang="scss">
.word-ribbon-toolbar {
  background: var(--nexus-bg-elevated);
  border-bottom: 1px solid var(--nexus-border);
  font-family: var(--nexus-font-ui);
  flex-shrink: 0;
}

/* 快速访问工具栏 */
.quick-access-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--nexus-bg);
  border-bottom: 1px solid var(--nexus-border);
}

.quick-access-left,
.quick-access-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.document-title {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 400px;
}

.title-input {
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  color: var(--nexus-text-primary);
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
  padding: 4px 12px;
  border-radius: var(--nexus-radius-md);
  transition: background 200ms var(--nexus-ease);

  &::placeholder {
    color: var(--nexus-text-tertiary);
  }

  &:hover {
    background: var(--nexus-divider);
  }

  &:focus {
    background: var(--nexus-divider);
  }
}

.save-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--nexus-radius-full);

  &.saved {
    color: var(--nexus-success);
    background: rgba(16, 185, 129, 0.08);
  }

  &.saving {
    color: var(--nexus-warning);
    background: rgba(245, 158, 11, 0.08);
  }

  &.unsaved {
    color: var(--nexus-text-tertiary);
    background: var(--nexus-divider);
  }
}

/* Nexus 通用按钮 */
.nexus-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--nexus-radius-full);
  border: none;
  background: transparent;
  color: var(--nexus-text-secondary);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);
  font-family: var(--nexus-font-ui);

  &:hover {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &.active {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
  }
}

.nexus-pill-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--nexus-radius-full);
  border: 1px solid var(--nexus-border);
  background: var(--nexus-bg-elevated);
  color: var(--nexus-text-primary);
  font-size: 12px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);
  white-space: nowrap;

  &:hover {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
    border-color: var(--nexus-text-primary);
  }

  &.ai-toggle {
    &.active {
      background: var(--nexus-text-primary);
      color: var(--nexus-text-inverse);
      border-color: var(--nexus-text-primary);
    }
  }
}

.nexus-ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--nexus-radius-md);
  border: none;
  background: transparent;
  color: var(--nexus-text-secondary);
  font-size: 12px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
  }
}

.nexus-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--nexus-radius-md);
  border: none;
  background: transparent;
  color: var(--nexus-text-secondary);
  font-size: 12px;
  font-family: var(--nexus-font-ui);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
  }

  &.active {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
  }
}

.nexus-mini-pill {
  padding: 4px 10px;
  border-radius: var(--nexus-radius-full);
  border: none;
  background: var(--nexus-divider);
  color: var(--nexus-text-secondary);
  font-size: 11px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
  }
}

.nexus-divider-v {
  width: 1px;
  height: 20px;
  background: var(--nexus-border);
  margin: 0 4px;
}

.nexus-char-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  border-radius: var(--nexus-radius-md);
  border: none;
  background: transparent;
  color: var(--nexus-text-secondary);
  font-size: 14px;
  font-family: var(--nexus-font-ui);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
  }
}

/* Ribbon 选项卡 */
.ribbon-tabs {
  display: flex;
  padding: 0 16px;
  background: var(--nexus-bg);
  border-bottom: 1px solid var(--nexus-border);
  gap: 4px;
}

.ribbon-tab {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  color: var(--nexus-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 200ms var(--nexus-ease);
  user-select: none;

  &:hover {
    color: var(--nexus-text-primary);
  }

  &.active {
    color: var(--nexus-text-primary);
    border-bottom-color: var(--nexus-text-primary);
  }
}

/* Ribbon 功能区 */
.ribbon-content {
  display: flex;
  padding: 10px 16px;
  min-height: 96px;
  background: var(--nexus-bg-elevated);
  overflow-x: auto;
}

.ribbon-group {
  display: flex;
  flex-direction: column;
  padding: 0 10px;
  min-width: fit-content;
}

.group-title {
  font-size: 10px;
  font-weight: 600;
  font-family: var(--nexus-font-ui);
  color: var(--nexus-text-tertiary);
  text-align: center;
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px solid var(--nexus-border);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.group-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.group-divider {
  width: 1px;
  margin: 4px 6px;
  background: var(--nexus-border);
  flex-shrink: 0;
}

/* 行布局 */
.btn-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.font-row {
  display: flex;
  gap: 6px;
}

.font-select {
  width: 120px;
}

.size-select {
  width: 60px;
}

.nexus-nui-select {
  :deep(.n-base-selection) {
    border-radius: var(--nexus-radius-md) !important;
    background: var(--nexus-bg-elevated) !important;
    border-color: var(--nexus-border) !important;
  }
}

.format-row {
  display: flex;
  gap: 2px;
  align-items: center;
}

.color-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.color-picker-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.color-bar {
  width: 18px;
  height: 3px;
  border-radius: 2px;
}

/* AI */
.ai-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 140px;
}

/* 表格选择器 */
.table-picker-wrap {
  position: relative;
}

.table-picker-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 100;
  background: var(--nexus-bg-elevated);
  border: 1px solid var(--nexus-border);
  border-radius: var(--nexus-radius-lg);
  padding: 12px;
  box-shadow: var(--nexus-shadow-lg);
}

.table-picker-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--nexus-text-secondary);
  margin-bottom: 8px;
  text-align: center;
}

.table-picker-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.table-picker-row {
  display: flex;
  gap: 3px;
}

.table-picker-cell {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: var(--nexus-divider);
  cursor: pointer;
  transition: background 100ms ease;

  &.hovered,
  &.selected {
    background: var(--nexus-text-primary);
  }
}

/* 特殊字符 */
.special-chars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}
</style>
