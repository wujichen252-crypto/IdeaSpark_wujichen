<template>
  <div class="excel-editor">
    <!-- Nexus Header -->
    <header class="excel-header">
      <div class="header-left">
        <button class="nexus-back-btn" @click="$router.back" title="返回">
          <ArrowLeft class="back-icon" />
          <span class="back-text">返回</span>
        </button>
        <div class="header-divider" ></div>
        <div class="file-icon excel-icon">
          <Grid3X3 class="nexus-icon" />
        </div>
        <div class="file-meta">
          <input
            v-model="fileName"
            class="filename-input"
            placeholder="工作簿1"
            @blur="handleSave"
            @keydown.enter="handleSave"
          />
          <span class="save-status" :class="saveStatus">
            <CheckCircle v-if="saveStatus === 'saved'" class="status-icon" />
            <Clock v-else-if="saveStatus === 'saving'" class="status-icon" />
            <Circle v-else class="status-icon" />
            {{ saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中...' : '未保存' }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <button
          class="nexus-icon-btn"
          :class="{ active: showAiPanel }"
          title="AI 助手"
          @click="showAiPanel = !showAiPanel"
        >
          <Sparkles class="nexus-icon" />
        </button>
        <div class="header-divider" ></div>
        <button class="nexus-icon-btn" title="导出 CSV" @click="handleExportCsv">
          <Download class="nexus-icon" />
        </button>
        <button class="nexus-pill-btn" @click="handleSave">
          <Save class="nexus-icon" />
          保存
        </button>
      </div>
    </header>

    <!-- Nexus Ribbon -->
    <div class="excel-ribbon">
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
      <div class="ribbon-content">
        <!-- 文件 -->
        <div v-if="activeTab === 'file'" class="ribbon-panel">
          <div class="ribbon-group">
            <span class="group-title">文件操作</span>
            <div class="group-content">
              <button class="nexus-pill-btn" @click="handleSave">
                <Save class="nexus-icon" />
                保存
              </button>
              <button class="nexus-pill-btn" @click="handleExportCsv">
                <Download class="nexus-icon" />
                导出 CSV
              </button>
              <button class="nexus-pill-btn" @click="handleExportJson">
                <Download class="nexus-icon" />
                导出 JSON
              </button>
            </div>
          </div>
        </div>

        <!-- 开始 -->
        <div v-if="activeTab === 'home'" class="ribbon-panel">
          <div class="ribbon-group">
            <span class="group-title">剪贴板</span>
            <div class="group-content">
              <button class="nexus-pill-btn" @click="pasteSelection">
                <ClipboardPaste class="nexus-icon" />
                粘贴
              </button>
              <div class="btn-row">
                <button class="nexus-ghost-btn" @click="copySelection">
                  <Copy class="nexus-icon" />
                  复制
                </button>
                <button class="nexus-ghost-btn" @click="clearCell">
                  <Eraser class="nexus-icon" />
                  清除
                </button>
              </div>
            </div>
          </div>

          <div class="group-divider" ></div>

          <div class="ribbon-group">
            <span class="group-title">字体</span>
            <div class="group-content">
              <div class="font-row">
                <select
                  v-model="selectedFont"
                  class="nexus-font-select"
                  @change="applyStyleToSelection('fontFamily', selectedFont)"
                >
                  <option v-for="f in fontOptions" :key="f" :value="f">{{ f }}</option>
                </select>
                <select
                  v-model="selectedFontSize"
                  class="nexus-size-select"
                  @change="applyStyleToSelection('fontSize', selectedFontSize)"
                >
                  <option v-for="s in fontSizeOptions" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div class="format-row">
                <button class="nexus-toggle-btn" :class="{ active: isBold }" @click="toggleFormat('bold')">
                  <Bold class="nexus-icon" />
                </button>
                <button class="nexus-toggle-btn" :class="{ active: isItalic }" @click="toggleFormat('italic')">
                  <Italic class="nexus-icon" />
                </button>
                <button class="nexus-toggle-btn" :class="{ active: isUnderline }" @click="toggleFormat('underline')">
                  <Underline class="nexus-icon" />
                </button>
                <div class="color-picker-wrap">
                  <input
                    v-model="fontColor"
                    type="color"
                    class="color-input"
                    @change="applyStyleToSelection('color', fontColor)"
                  />
                  <span class="color-bar" :style="{ backgroundColor: fontColor }" ></span>
                </div>
              </div>
            </div>
          </div>

          <div class="group-divider" ></div>

          <div class="ribbon-group">
            <span class="group-title">对齐</span>
            <div class="group-content">
              <div class="btn-row">
                <button class="nexus-toggle-btn" :class="{ active: cellAlign === 'left' }" @click="setAlign('left')">
                  <AlignLeft class="nexus-icon" />
                </button>
                <button class="nexus-toggle-btn" :class="{ active: cellAlign === 'center' }" @click="setAlign('center')">
                  <AlignCenter class="nexus-icon" />
                </button>
                <button class="nexus-toggle-btn" :class="{ active: cellAlign === 'right' }" @click="setAlign('right')">
                  <AlignRight class="nexus-icon" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 插入 -->
        <div v-if="activeTab === 'insert'" class="ribbon-panel">
          <div class="ribbon-group">
            <span class="group-title">函数</span>
            <div class="group-content">
              <div class="pill-row">
                <button class="nexus-mini-pill" @click="insertSum">SUM</button>
                <button class="nexus-mini-pill" @click="insertAverage">AVERAGE</button>
                <button class="nexus-mini-pill" @click="insertCount">COUNT</button>
                <button class="nexus-mini-pill" @click="insertFormula('MAX')">MAX</button>
                <button class="nexus-mini-pill" @click="insertFormula('MIN')">MIN</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 公式 -->
        <div v-if="activeTab === 'formula'" class="ribbon-panel">
          <div class="ribbon-group">
            <span class="group-title">函数库</span>
            <div class="group-content">
              <div class="pill-row">
                <button class="nexus-mini-pill" @click="insertFormula('SUM')">SUM</button>
                <button class="nexus-mini-pill" @click="insertFormula('AVERAGE')">AVERAGE</button>
                <button class="nexus-mini-pill" @click="insertFormula('COUNT')">COUNT</button>
                <button class="nexus-mini-pill" @click="insertFormula('MAX')">MAX</button>
                <button class="nexus-mini-pill" @click="insertFormula('MIN')">MIN</button>
                <button class="nexus-mini-pill" @click="insertFormula('IF')">IF</button>
                <button class="nexus-mini-pill" @click="insertFormula('VLOOKUP')">VLOOKUP</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据 -->
        <div v-if="activeTab === 'data'" class="ribbon-panel">
          <div class="ribbon-group">
            <span class="group-title">AI 智能</span>
            <div class="group-content">
              <button class="nexus-pill-btn ai-toggle ai-generate-btn" :class="{ active: showAiPanel }" @click="showAiPanel = true; aiSmartGenerate()">
                <Rocket class="nexus-icon" />
                智能生成
              </button>
              <button class="nexus-pill-btn ai-toggle" :class="{ active: showAiPanel }" @click="showAiPanel = true; aiAnalyzeData()">
                <Sparkles class="nexus-icon" />
                数据分析
              </button>
              <button class="nexus-pill-btn ai-toggle" :class="{ active: showAiPanel }" @click="showAiPanel = true; aiGenerateFormula()">
                <FunctionSquare class="nexus-icon" />
                生成公式
              </button>
              <button class="nexus-pill-btn ai-toggle" :class="{ active: showAiPanel }" @click="showAiPanel = true; aiCleanData()">
                <Wand class="nexus-icon" />
                数据清洗
              </button>
              <button class="nexus-pill-btn ai-toggle" :class="{ active: showAiPanel }" @click="showAiPanel = true; aiChartSuggestion()">
                <BarChart3 class="nexus-icon" />
                图表建议
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Formula Bar -->
    <div class="formula-bar">
      <div class="cell-ref-box">{{ selectedRef }}</div>
      <div class="formula-input-wrap">
        <FunctionSquare class="nexus-icon formula-icon" />
        <input
          v-model="formulaInput"
          class="formula-input"
          placeholder="输入公式或值"
          @keydown.enter="applyFormulaBar"
          @input="autoSaveFormulaBar"
        />
      </div>
    </div>

    <!-- Main Editor -->
    <div class="editor-body">
      <div class="excel-main">
        <div class="spreadsheet-container">
          <div class="grid-wrapper">
            <!-- Header row -->
            <div class="grid-row header-row">
              <div class="corner-cell" @click="selectAll"></div>
              <div
                v-for="(col, ci) in columns"
                :key="'h' + col"
                :class="['column-header', { active: isColSelected(ci) }]"
                @click="selectColumn(ci)"
              >
                {{ col }}
              </div>
            </div>

            <!-- Data rows -->
            <div v-for="row in rowCount" :key="row" class="grid-row">
              <div
                :class="['row-header', { active: isRowSelected(row) }]"
                @click="selectRow(row)"
              >
                {{ row }}
              </div>
              <div
                v-for="(col, ci) in columns"
                :key="col + row"
                :class="[
                  'cell',
                  {
                    selected: isCellSelected(col + row),
                    'in-range': isInRange(col + row),
                    editing: editingRef === col + row,
                    'is-formula': !!cellData[col + row]?.formula
                  }
                ]"
                :style="getCellStyle(col + row)"
                @mousedown.stop="onCellMouseDown(col + row, $event)"
                @mouseenter="onCellMouseEnter(col + row)"
                @dblclick.stop="startEdit()"
              >
                <template v-if="editingRef === col + row">
                  <input
                    v-model="editValue"
                    class="cell-editor"
                    @keydown="handleEditKeydown"
                    @blur="confirmEdit"
                    @input="autoSaveEdit"
                    @click.stop
                  />
                </template>
                <template v-else>
                  {{ formatDisplay(col + row) }}
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NexusAiSidebar
        v-if="showAiPanel"
        :session-id="aiSessionId"
        :quick-actions="aiQuickActions"
        @apply="handleAiApply"
        @action="handleAiAction"
      />
    </div>

    <!-- Footer -->
    <footer class="excel-footer">
      <div class="sheet-controls">
        <button class="nexus-icon-btn sheet-add-btn" @click="addSheet" title="添加工作表">
          <Plus class="nexus-icon" />
        </button>
      </div>
      <div class="sheet-tabs">
        <div
          v-for="(sheet, idx) in sheets"
          :key="idx"
          :class="['sheet-tab', { active: currentSheetIndex === idx }]"
          @click="switchSheet(idx)"
        >
          {{ sheet.name }}
        </div>
      </div>
      <div class="status-text">{{ selectedRef }} {{ selectionSize }}</div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  evaluateFormula,
  parseCellRef,
  getCellRef,
  getRangeCells
} from '@/utils/formulaEngine'
import NexusAiSidebar from '@/components/ai/NexusAiSidebar.vue'
import type { QuickAction } from '@/components/ai/NexusAiSidebar.vue'
import { useExcelAi, AI_QUICK_ACTIONS, type ExcelContext, type AiResult } from '@/composables/useExcelAi'
import { createProjectFile, updateProjectFile, getProjectFileDetail } from '@/api/projectFile'
import {
  ArrowLeft,
  Grid3X3,
  CheckCircle,
  Clock,
  Circle,
  Sparkles,
  Download,
  Save,
  ClipboardPaste,
  Copy,
  Eraser,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FunctionSquare,
  Wand,
  BarChart3,
  Plus,
  Rocket
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const projectId = route.params.id as string
const fileId = route.params.fileId as string | undefined

/* ─── Constants ── */
const ROW_COUNT = 50
const COL_COUNT = 26
const columns = Array.from({ length: COL_COUNT }, (_, i) => {
  let result = ''
  let n = i + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    result = String.fromCharCode(65 + rem) + result
    n = Math.floor((n - 1) / 26)
  }
  return result
})
const rowCount = ROW_COUNT

/* ─── Cell Data Model ─── */
interface CellStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  align?: 'left' | 'center' | 'right'
  backgroundColor?: string
  fontSize?: number
  fontFamily?: string
}

interface CellData {
  value: string
  computedValue: string | number
  formula?: string
  style: CellStyle
}

const cellData = reactive<Record<string, CellData>>({})

function ensureCell(ref: string): CellData {
  if (!cellData[ref]) {
    cellData[ref] = { value: '', computedValue: '', style: {} }
  }
  return cellData[ref]
}

/* ─── Formula Evaluation ─── */
const computing = new Set<string>()
const computeCache = new Map<string, any>()

function clearComputeCache() {
  computeCache.clear()
}

function getCellComputedValue(ref: string): any {
  if (computeCache.has(ref)) return computeCache.get(ref)
  if (computing.has(ref)) return '#REF!'

  const cell = cellData[ref]
  if (!cell) return 0

  if (cell.formula) {
    computing.add(ref)
    try {
      const result = evaluateFormula(cell.formula, getCellComputedValue)
      computeCache.set(ref, result)
      return result
    } catch (e: any) {
      const err = e?.message?.startsWith('#') ? e.message : '#VALUE!'
      computeCache.set(ref, err)
      return err
    } finally {
      computing.delete(ref)
    }
  }

  const val = cell.value
  if (val === '') return ''
  const num = Number(val)
  if (!Number.isNaN(num) && val.trim() !== '') {
    computeCache.set(ref, num)
    return num
  }
  computeCache.set(ref, val)
  return val
}

function recalcAll() {
  clearComputeCache()
  for (const ref in cellData) {
    const cell = cellData[ref]
    if (!cell) continue
    if (cell.formula) {
      cell.computedValue = getCellComputedValue(ref)
    } else {
      const val = cell.value
      const num = Number(val)
      cell.computedValue = !Number.isNaN(num) && val.trim() !== '' ? num : val
    }
  }
}

/* ─── File State ─── */
const fileName = ref('工作簿1')
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')

/**
 * 保存 Excel 文件到服务器
 */
async function handleSave() {
  if (!projectId) {
    message.error('项目 ID 不存在')
    return
  }

  saveStatus.value = 'saving'

  try {
    // 先将当前 cellData 同步到当前工作表
    const currentSheet = sheets.value[currentSheetIndex.value]
    if (currentSheet) {
      currentSheet.data = JSON.parse(JSON.stringify(cellData))
    }

    // 准备保存的数据
    const fileContent = JSON.stringify({
      sheets: sheets.value,
      currentSheetIndex: currentSheetIndex.value,
      fileName: fileName.value
    })

    if (fileId) {
      // 更新已有文件
      await updateProjectFile(projectId, fileId, {
        name: fileName.value,
        content: fileContent,
        type: 'sheet'
      })
    } else {
      // 创建新文件
      const res = await createProjectFile(projectId, {
        name: fileName.value,
        content: fileContent,
        type: 'sheet'
      })
      // 更新 URL 中的 fileId
      if (res.data?.data?.id) {
        router.replace({
          params: { ...route.params, fileId: res.data.data.id }
        })
      }
    }

    saveStatus.value = 'saved'
    message.success('已保存')
  } catch (error) {
    saveStatus.value = 'unsaved'
    message.error('保存失败，请重试')
    console.error('保存失败:', error)
  }
}

/**
 * 加载 Excel 文件内容
 */
async function loadFileData() {
  if (!projectId || !fileId) return

  try {
    const res = await getProjectFileDetail(projectId, fileId)
    const fileData = res.data?.data

    if (fileData?.content) {
      try {
        const parsed = JSON.parse(fileData.content)

        // 恢复文件名
        if (parsed.fileName) {
          fileName.value = parsed.fileName
        }

        // 恢复工作表数据
        if (parsed.sheets && parsed.sheets.length > 0) {
          sheets.value = parsed.sheets
        }

        // 恢复当前工作表索引
        const targetIndex = parsed.currentSheetIndex ?? 0
        currentSheetIndex.value = targetIndex

        // 清空当前单元格数据
        for (const key in cellData) {
          delete (cellData as any)[key]
        }

        // 加载当前工作表的数据
        const targetSheet = sheets.value[targetIndex]
        if (targetSheet?.data) {
          for (const [ref, cell] of Object.entries(targetSheet.data)) {
            cellData[ref] = JSON.parse(JSON.stringify(cell))
          }
        }

        // 兼容旧格式：如果保存的是 cellData 直接存储格式
        if (!targetSheet?.data && parsed.cellData) {
          for (const [ref, cell] of Object.entries(parsed.cellData)) {
            cellData[ref] = JSON.parse(JSON.stringify(cell))
          }
          // 同步到当前工作表
          sheets.value[targetIndex]!.data = JSON.parse(JSON.stringify(parsed.cellData))
        }

        recalcAll()
        saveStatus.value = 'saved'
        message.success('文件加载成功')
      } catch (parseError) {
        console.error('解析文件内容失败:', parseError)
        message.error('文件格式错误')
      }
    }
  } catch (error) {
    console.error('加载文件失败:', error)
    message.error('加载文件失败')
  }
}

function setUnsaved() {
  if (saveStatus.value === 'saved') saveStatus.value = 'unsaved'
}

/* ─── Ribbon ─── */
const activeTab = ref('home')
const ribbonTabs = [
  { key: 'file', label: '文件' },
  { key: 'home', label: '开始' },
  { key: 'insert', label: '插入' },
  { key: 'formula', label: '公式' },
  { key: 'data', label: '数据' }
]

const fontOptions = ['Inter', 'Arial', 'Microsoft YaHei', 'SimSun', 'Calibri']
const fontSizeOptions = [8, 9, 10, 11, 12, 14, 16, 18, 20]

const selectedFont = ref('Inter')
const selectedFontSize = ref(11)
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)
const fontColor = ref('#000000')
const cellAlign = ref<'left' | 'center' | 'right'>('left')

/* ─── Selection ─── */
const selectedRef = ref('A1')
const editingRef = ref<string | null>(null)
const editValue = ref('')
const selectionRange = ref<{ start: string; end: string } | null>(null)
const isSelecting = ref(false)
const selectionStartRef = ref<string | null>(null)

/* ─── Formula Bar ─── */
const formulaInput = ref('')

watch(selectedRef, (ref) => {
  const cell = cellData[ref]
  formulaInput.value = cell?.formula ? '=' + cell.formula : (cell?.value ?? '')
  updateFormatStateFromCell(ref)
})

watch(editValue, (val) => {
  if (editingRef.value) {
    formulaInput.value = val
  }
})

watch(formulaInput, (val) => {
  if (editingRef.value) {
    editValue.value = val
  }
})

function updateFormatStateFromCell(ref: string) {
  const cell = cellData[ref]
  if (!cell) {
    isBold.value = false
    isItalic.value = false
    isUnderline.value = false
    fontColor.value = '#000000'
    cellAlign.value = 'left'
    selectedFont.value = 'Inter'
    selectedFontSize.value = 11
    return
  }
  const s = cell.style
  isBold.value = !!s.bold
  isItalic.value = !!s.italic
  isUnderline.value = !!s.underline
  fontColor.value = s.color || '#000000'
  cellAlign.value = (s.align as any) || 'left'
  selectedFont.value = s.fontFamily || 'Inter'
  selectedFontSize.value = s.fontSize || 11
}

function isCellSelected(ref: string): boolean {
  if (editingRef.value === ref) return true
  if (selectedRef.value === ref && !selectionRange.value) return true
  return false
}

function isInRange(ref: string): boolean {
  if (!selectionRange.value) return false
  const { col, row } = parseCellRef(ref)
  const s = parseCellRef(selectionRange.value.start)
  const e = parseCellRef(selectionRange.value.end)
  const minCol = Math.min(s.col, e.col)
  const maxCol = Math.max(s.col, e.col)
  const minRow = Math.min(s.row, e.row)
  const maxRow = Math.max(s.row, e.row)
  return col >= minCol && col <= maxCol && row >= minRow && row <= maxRow
}

function isRowSelected(row: number): boolean {
  if (!selectionRange.value) return false
  const s = parseCellRef(selectionRange.value.start)
  const e = parseCellRef(selectionRange.value.end)
  const minRow = Math.min(s.row, e.row)
  const maxRow = Math.max(s.row, e.row)
  return row >= minRow && row <= maxRow
}

function isColSelected(colIndex: number): boolean {
  if (!selectionRange.value) return false
  const s = parseCellRef(selectionRange.value.start)
  const e = parseCellRef(selectionRange.value.end)
  const minCol = Math.min(s.col, e.col)
  const maxCol = Math.max(s.col, e.col)
  return colIndex >= minCol && colIndex <= maxCol
}

function selectAll() {
  selectionRange.value = { start: 'A1', end: getCellRef(COL_COUNT - 1, ROW_COUNT) }
  selectedRef.value = 'A1'
}

function selectRow(row: number) {
  selectedRef.value = getCellRef(0, row)
  selectionRange.value = { start: getCellRef(0, row), end: getCellRef(COL_COUNT - 1, row) }
  editingRef.value = null
}

function selectColumn(col: number) {
  selectedRef.value = getCellRef(col, 1)
  selectionRange.value = { start: getCellRef(col, 1), end: getCellRef(col, ROW_COUNT) }
  editingRef.value = null
}

/* ─── Editing ─── */
function startEdit(initialChar?: string) {
  if (editingRef.value) return
  editingRef.value = selectedRef.value
  const cell = cellData[selectedRef.value]
  editValue.value = initialChar ?? (cell?.formula ? '=' + cell.formula : cell?.value ?? '')
  nextTick(() => {
    const input = document.querySelector('.cell-editor') as HTMLInputElement | null
    if (input) {
      input.focus()
      if (!initialChar) input.select()
    }
  })
}

/**
 * 确认编辑并保存单元格内容
 */
function confirmEdit() {
  if (!editingRef.value) return
  const ref = editingRef.value
  const val = editValue.value
  const cell = ensureCell(ref)

  if (val.startsWith('=')) {
    cell.formula = val.slice(1)
    cell.value = val
  } else {
    cell.formula = undefined
    cell.value = val
  }

  recalcAll()
  editingRef.value = null
  setUnsaved()
}

/**
 * 实时保存编辑内容（输入时自动保存）
 */
function autoSaveEdit() {
  if (!editingRef.value) return
  const ref = editingRef.value
  const val = editValue.value
  const cell = ensureCell(ref)

  if (val.startsWith('=')) {
    cell.formula = val.slice(1)
    cell.value = val
  } else {
    cell.formula = undefined
    cell.value = val
  }

  recalcAll()
  setUnsaved()
}

function cancelEdit() {
  editingRef.value = null
  const cell = cellData[selectedRef.value]
  formulaInput.value = cell?.formula ? '=' + cell.formula : cell?.value ?? ''
}

function handleEditKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    confirmEdit()
    moveSelection(0, 1)
  } else if (e.key === 'Tab') {
    e.preventDefault()
    confirmEdit()
    moveSelection(e.shiftKey ? -1 : 1, 0)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancelEdit()
  }
}

/* ─── Navigation ─── */
function moveSelection(dc: number, dr: number) {
  const { col, row } = parseCellRef(selectedRef.value)
  const newCol = Math.max(0, Math.min(COL_COUNT - 1, col + dc))
  const newRow = Math.max(1, Math.min(ROW_COUNT, row + dr))
  selectedRef.value = getCellRef(newCol, newRow)
  selectionRange.value = null
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if (editingRef.value) {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveSelection(0, -1)
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveSelection(0, 1)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    moveSelection(-1, 0)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    moveSelection(1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    startEdit()
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    clearCell()
  } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    startEdit(e.key)
  } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    e.preventDefault()
    copySelection()
  } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault()
    pasteSelection()
  }
}

/* ─── Mouse Selection ─── */
function onCellMouseDown(ref: string, e: MouseEvent) {
  selectedRef.value = ref
  isSelecting.value = true
  selectionStartRef.value = ref
  selectionRange.value = null
  editingRef.value = null
}

function onCellMouseEnter(ref: string) {
  if (!isSelecting.value || !selectionStartRef.value) return
  selectionRange.value = { start: selectionStartRef.value, end: ref }
}

/**
 * 全局鼠标抬起事件 - 结束框选
 */
function onGlobalMouseUp() {
  isSelecting.value = false
  // 如果选区只有一个单元格，则清除选区（视为单选）
  if (selectionRange.value && selectionRange.value.start === selectionRange.value.end) {
    selectionRange.value = null
  }
}

/**
 * 应用公式栏内容到单元格
 */
function applyFormulaBar() {
  if (editingRef.value) {
    confirmEdit()
    moveSelection(0, 1)
  } else {
    const ref = selectedRef.value
    const val = formulaInput.value
    const cell = ensureCell(ref)
    if (val.startsWith('=')) {
      cell.formula = val.slice(1)
      cell.value = val
    } else {
      cell.formula = undefined
      cell.value = val
    }
    recalcAll()
    setUnsaved()
    moveSelection(0, 1)
  }
}

/**
 * 公式栏实时自动保存
 */
function autoSaveFormulaBar() {
  if (editingRef.value) {
    // 如果在编辑单元格，同步公式栏内容到编辑值
    editValue.value = formulaInput.value
    autoSaveEdit()
  } else {
    // 直接保存到当前选中单元格
    const ref = selectedRef.value
    const val = formulaInput.value
    const cell = ensureCell(ref)
    if (val.startsWith('=')) {
      cell.formula = val.slice(1)
      cell.value = val
    } else {
      cell.formula = undefined
      cell.value = val
    }
    recalcAll()
    setUnsaved()
  }
}

/* ─── Formatting ── */
function getCellStyle(ref: string): Record<string, string> {
  const cell = cellData[ref]
  if (!cell) return {}
  const s = cell.style
  return {
    fontWeight: s.bold ? 'bold' : 'normal',
    fontStyle: s.italic ? 'italic' : 'normal',
    textDecoration: s.underline ? 'underline' : 'none',
    color: s.color || '#000000',
    textAlign: s.align || 'left',
    backgroundColor: s.backgroundColor || 'transparent',
    fontSize: (s.fontSize || 11) + 'px',
    fontFamily: s.fontFamily || "'Inter', sans-serif"
  }
}

function formatDisplay(ref: string): string {
  const cell = cellData[ref]
  if (!cell) return ''
  const v = cell.computedValue
  if (v === undefined || v === null) return ''
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return String(v)
    return String(parseFloat(v.toFixed(6)))
  }
  return String(v)
}

function toggleFormat(key: keyof CellStyle) {
  const refs = getSelectedRefs()
  refs.forEach((ref) => {
    const cell = ensureCell(ref)
    cell.style = { ...cell.style, [key]: !cell.style[key] }
  })
  if (refs.length === 1 && refs[0] === selectedRef.value) {
    updateFormatStateFromCell(selectedRef.value)
  }
  setUnsaved()
}

function setAlign(align: 'left' | 'center' | 'right') {
  cellAlign.value = align
  const refs = getSelectedRefs()
  refs.forEach((ref) => {
    const cell = ensureCell(ref)
    cell.style = { ...cell.style, align }
  })
  setUnsaved()
}

function applyStyleToSelection(key: keyof CellStyle, value: any) {
  const refs = getSelectedRefs()
  refs.forEach((ref) => {
    const cell = ensureCell(ref)
    cell.style = { ...cell.style, [key]: value }
  })
  setUnsaved()
}

function getSelectedRefs(): string[] {
  if (selectionRange.value) {
    return getRangeCells(selectionRange.value.start, selectionRange.value.end)
  }
  return [selectedRef.value]
}

/* ─── Clipboard ── */
async function copySelection() {
  const range = selectionRange.value
    ? { start: selectionRange.value.start, end: selectionRange.value.end }
    : { start: selectedRef.value, end: selectedRef.value }

  const s = parseCellRef(range.start)
  const e = parseCellRef(range.end)
  const minCol = Math.min(s.col, e.col)
  const maxCol = Math.max(s.col, e.col)
  const minRow = Math.min(s.row, e.row)
  const maxRow = Math.max(s.row, e.row)

  const rows: string[] = []
  for (let r = minRow; r <= maxRow; r++) {
    const cols: string[] = []
    for (let c = minCol; c <= maxCol; c++) {
      const ref = getCellRef(c, r)
      cols.push(cellData[ref]?.value ?? '')
    }
    rows.push(cols.join('\t'))
  }

  await navigator.clipboard.writeText(rows.join('\n'))
  message.success('已复制')
}

async function pasteSelection() {
  try {
    const text = await navigator.clipboard.readText()
    const rows = text.split('\n')
    const start = parseCellRef(selectedRef.value)

    rows.forEach((rowText, ri) => {
      if (!rowText && ri === rows.length - 1) return
      const cols = rowText.split('\t')
      cols.forEach((val, ci) => {
        const ref = getCellRef(start.col + ci, start.row + ri)
        const cell = ensureCell(ref)
        cell.value = val
        if (val.startsWith('=')) {
          cell.formula = val.slice(1)
        } else {
          cell.formula = undefined
        }
      })
    })

    recalcAll()
    setUnsaved()
    message.success('已粘贴')
  } catch {
    message.error('粘贴失败')
  }
}

function clearCell() {
  const refs = getSelectedRefs()
  refs.forEach((ref) => {
    const cell = cellData[ref]
    if (cell) {
      cell.value = ''
      cell.formula = undefined
      cell.computedValue = ''
    }
  })
  recalcAll()
  setUnsaved()
}

/* ─── Formula Insertion ─── */
function insertSum() {
  const { col, row } = parseCellRef(selectedRef.value)
  const endRow = Math.min(ROW_COUNT, row + 9)
  formulaInput.value = '=SUM(' + selectedRef.value + ':' + getCellRef(col, endRow) + ')'
  applyFormulaBar()
}

function insertAverage() {
  const { col, row } = parseCellRef(selectedRef.value)
  const endRow = Math.min(ROW_COUNT, row + 9)
  formulaInput.value = '=AVERAGE(' + selectedRef.value + ':' + getCellRef(col, endRow) + ')'
  applyFormulaBar()
}

function insertCount() {
  const { col, row } = parseCellRef(selectedRef.value)
  const endRow = Math.min(ROW_COUNT, row + 9)
  formulaInput.value = '=COUNT(' + selectedRef.value + ':' + getCellRef(col, endRow) + ')'
  applyFormulaBar()
}

function insertFormula(name: string) {
  formulaInput.value = '=' + name + '()'
  startEdit('=' + name + '()')
}

/* ─── Export ─── */
function handleExportCsv() {
  const rows: string[] = []
  for (let r = 1; r <= ROW_COUNT; r++) {
    const cols: string[] = []
    for (let c = 0; c < COL_COUNT; c++) {
      const ref = getCellRef(c, r)
      const val = cellData[ref]?.value ?? ''
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        cols.push('"' + val.replace(/"/g, '""') + '"')
      } else {
        cols.push(val)
      }
    }
    rows.push(cols.join(','))
  }
  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, fileName.value + '.csv')
}

function handleExportJson() {
  const data: Record<string, any> = {}
  for (const ref in cellData) {
    const cell = cellData[ref]
    if (!cell) continue
    if (cell.value || Object.keys(cell.style).length > 0) {
      data[ref] = {
        value: cell.value,
        formula: cell.formula,
        style: cell.style
      }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, fileName.value + '.json')
}

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

/* ─── Sheets ── */
interface Sheet {
  name: string
  data: Record<string, CellData>
}

const sheets = ref<Sheet[]>([{ name: 'Sheet1', data: {} }])
const currentSheetIndex = ref(0)

function addSheet() {
  const name = `Sheet${sheets.value.length + 1}`
  sheets.value.push({ name, data: {} })
  currentSheetIndex.value = sheets.value.length - 1
  for (const key in cellData) {
    delete (cellData as any)[key]
  }
  message.success(`已添加 ${name}`)
}

function switchSheet(index: number) {
  const currentSheet = sheets.value[currentSheetIndex.value]
  if (!currentSheet) return
  currentSheet.data = JSON.parse(JSON.stringify(cellData))
  currentSheetIndex.value = index
  const targetSheet = sheets.value[index]
  if (!targetSheet) return
  const data = targetSheet.data
  for (const key in cellData) {
    delete (cellData as any)[key]
  }
  for (const [ref, cell] of Object.entries(data)) {
    cellData[ref] = JSON.parse(JSON.stringify(cell))
  }
  recalcAll()
}

const selectionSize = computed(() => {
  if (!selectionRange.value) return ''
  const s = parseCellRef(selectionRange.value.start)
  const e = parseCellRef(selectionRange.value.end)
  const w = Math.abs(e.col - s.col) + 1
  const h = Math.abs(e.row - s.row) + 1
  return `${w}C × ${h}R`
})

/* ─── AI Integration ─── */
const showAiPanel = ref(false)
const excelAi = useExcelAi()

const aiSessionId = computed(() => `excel-${projectId}-${fileId || 'new'}`)

/**
 * 构建 Excel 上下文信息
 */
function buildExcelContext(): ExcelContext {
  const selectedData: any[][] = []
  let headers: string[] = []
  
  if (selectionRange.value) {
    const s = parseCellRef(selectionRange.value.start)
    const e = parseCellRef(selectionRange.value.end)
    
    for (let r = s.row; r <= e.row; r++) {
      const row: any[] = []
      for (let c = s.col; c <= e.col; c++) {
        const ref = getCellRef(c, r)
        row.push(cellData[ref] || {})
      }
      selectedData.push(row)
    }
    
    // 假设第一行是表头
    if (selectedData.length > 0 && selectedData[0]) {
      headers = selectedData[0].map(cell => cell?.value || '')
    }
  } else if (selectedRef.value) {
    const cell = cellData[selectedRef.value]
    selectedData.push([cell || {}])
  }
  
  return {
    fileName: fileName.value,
    sheetName: sheets.value[currentSheetIndex.value]?.name || 'Sheet1',
    selectedRange: selectionRange.value 
      ? `${selectionRange.value.start}:${selectionRange.value.end}`
      : selectedRef.value,
    selectedData,
    headers,
    dataSummary: {
      rowCount: selectedData.length,
      colCount: selectedData[0]?.length || 0,
      numericCols: [],
      hasHeaders: headers.length > 0
    }
  }
}

// 使用新的 AI 快捷操作，转换为 NexusAiSidebar 需要的格式
const aiQuickActions: QuickAction[] = AI_QUICK_ACTIONS.map(action => ({
  key: action.key,
  label: action.label,
  prompt: action.systemPrompt
}))

function getSelectedDataAsString(): string {
  if (!selectionRange.value) {
    const cell = cellData[selectedRef.value]
    return cell?.value ?? ''
  }
  const s = parseCellRef(selectionRange.value.start)
  const e = parseCellRef(selectionRange.value.end)
  const minCol = Math.min(s.col, e.col)
  const maxCol = Math.max(s.col, e.col)
  const minRow = Math.min(s.row, e.row)
  const maxRow = Math.max(s.row, e.row)
  const rows: string[] = []
  for (let r = minRow; r <= maxRow; r++) {
    const cols: string[] = []
    for (let c = minCol; c <= maxCol; c++) {
      cols.push(cellData[getCellRef(c, r)]?.value ?? '')
    }
    rows.push(cols.join('\t'))
  }
  return rows.join('\n')
}

/**
 * 处理 AI 生成内容的应用
 * 将内容写入当前选中的单元格，支持 Markdown 表格解析
 */
function handleAiApply(content: string) {
  const trimmed = content.trim()

  if (trimmed.startsWith('=')) {
    // 如果是公式，写入公式栏并应用
    formulaInput.value = trimmed
    applyFormulaBar()
    message.success('公式已应用')
    return
  }

  // 将普通文本内容写入当前选中的单元格
  const targetRef = selectedRef.value
  if (!targetRef) {
    message.warning('请先选择一个单元格')
    return
  }

  const startCell = parseCellRef(targetRef)
  const lines = trimmed.split('\n')

  // 检测是否为 Markdown 表格
  const isMarkdownTable = lines.some(line => line.trim().startsWith('|') && line.trim().endsWith('|'))

  if (isMarkdownTable) {
    // 解析 Markdown 表格
    let rowIndex = 0
    lines.forEach((line) => {
      const trimmedLine = line.trim()
      // 跳过分隔行 (如 |---|---|---|)
      if (trimmedLine.match(/^\|[-:\s|]+\|$/)) {
        return
      }
      // 解析表格行
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        const cells = trimmedLine
          .slice(1, -1) // 去掉首尾的 |
          .split('|')
          .map(cell => cell.trim())

        cells.forEach((cellValue, colIndex) => {
          const cellRef = getCellRef(startCell.col + colIndex, startCell.row + rowIndex)
          const cell = ensureCell(cellRef)
          cell.value = cellValue
          cell.formula = undefined
        })
        rowIndex++
      } else if (trimmedLine) {
        // 非表格行，按普通文本处理
        const cellRef = getCellRef(startCell.col, startCell.row + rowIndex)
        const cell = ensureCell(cellRef)
        cell.value = trimmedLine
        cell.formula = undefined
        rowIndex++
      }
    })
    message.success('表格已应用到单元格')
  } else {
    // 普通文本，按行分割写入
    lines.forEach((line, rowIndex) => {
      const cellRef = getCellRef(startCell.col, startCell.row + rowIndex)
      const cell = ensureCell(cellRef)
      cell.value = line
      cell.formula = undefined
    })
    message.success('内容已应用到单元格')
  }

  recalcAll()
  setUnsaved()
}

/**
 * 处理 AI 快捷操作按钮点击
 */
async function handleAiAction(actionKey: string) {
  switch (actionKey) {
    case 'smart-generate':
      await aiSmartGenerate()
      break
    case 'smart-fill':
      await aiSmartFill()
      break
    case 'data-analysis':
      await aiAnalyzeData()
      break
    case 'formula-gen':
      await aiGenerateFormula()
      break
    case 'data-clean':
      await aiCleanData()
      break
    case 'visual-advice':
      await aiChartSuggestion()
      break
    case 'quick-stats':
      await aiQuickStats()
      break
    case 'trend-forecast':
      await aiTrendForecast()
      break
    case 'anomaly-detect':
      await aiAnomalyDetect()
      break
    default:
      await executeAiAction(actionKey)
  }
}

/**
 * 执行 AI 快捷操作（通用）
 */
async function executeAiAction(actionKey: string) {
  showAiPanel.value = true
  const context = buildExcelContext()
  
  const result = await excelAi.executeAction(actionKey as any, context)
  if (result) {
    message.success(`${actionKey} 分析完成`)
  }
}

/**
 * 数据分析
 */
async function aiAnalyzeData() {
  await executeAiAction('data-analysis')
}

/**
 * 生成公式
 */
async function aiGenerateFormula() {
  await executeAiAction('formula-gen')
}

/**
 * 数据清洗
 */
async function aiCleanData() {
  await executeAiAction('data-clean')
}

/**
 * 图表建议
 */
async function aiChartSuggestion() {
  await executeAiAction('visual-advice')
}

/**
 * 快速统计
 */
async function aiQuickStats() {
  await executeAiAction('quick-stats')
}

/**
 * 趋势预测
 */
async function aiTrendForecast() {
  await executeAiAction('trend-forecast')
}

/**
 * 异常检测
 */
async function aiAnomalyDetect() {
  await executeAiAction('anomaly-detect')
}

/**
 * 智能填充
 */
async function aiSmartFill() {
  showAiPanel.value = true
  const context = buildExcelContext()
  
  // 获取选中的示例数据
  const examples: string[] = context.selectedData
    .flat()
    .map(cell => String(cell?.value ?? ''))
    .filter(v => v !== undefined && v !== '')
  
  if (examples.length < 2) {
    message.warning('请至少选择 2 个示例单元格')
    return
  }
  
  const result = await excelAi.smartFill(examples, 5)
  if (result) {
    message.success('智能填充建议已生成')
  }
}

/**
 * 智能生成 - 根据描述生成完整表格
 */
async function aiSmartGenerate() {
  showAiPanel.value = true
  message.info('请在右侧 AI 面板中输入表格描述')
}

/* ─── Lifecycle ─── */
onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('mouseup', onGlobalMouseUp)
  if (fileId) {
    loadFileData()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('mouseup', onGlobalMouseUp)
})
</script>

<style scoped lang="scss">
.excel-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--nexus-bg);
  font-family: var(--nexus-font-ui);
  overflow: hidden;
}

/* ─── Header ─── */
.excel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--nexus-bg);
  border-bottom: 1px solid var(--nexus-border);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-divider {
  width: 1px;
  height: 20px;
  background: var(--nexus-border);
  margin: 0 4px;
}

.file-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--nexus-radius-md);
}

.excel-icon {
  background: rgba(16, 185, 129, 0.1);
  color: var(--nexus-success);
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filename-input {
  font-size: 14px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  color: var(--nexus-text-primary);
  background: transparent;
  border: none;
  outline: none;
  padding: 4px 8px;
  border-radius: var(--nexus-radius-md);
  transition: background 200ms var(--nexus-ease);
  min-width: 100px;

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
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--nexus-radius-full);
  color: var(--nexus-text-tertiary);

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

.status-icon {
  width: 12px;
  height: 12px;
}

/* ─── Nexus Buttons ─── */
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
  flex-shrink: 0;

  &:hover {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
  }

  &.active {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
  }
}

/**
 * 返回按钮样式 - 带文字的药丸形状，更明显
 */
.nexus-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--nexus-radius-full);
  border: 1px solid var(--nexus-border);
  background: var(--nexus-bg-elevated);
  color: var(--nexus-text-secondary);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  cursor: pointer;
  transition: all 200ms var(--nexus-ease);
  flex-shrink: 0;

  &:hover {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
    border-color: var(--nexus-text-primary);
    transform: translateX(-2px);
  }

  &:active {
    transform: translateX(-2px) scale(0.98);
  }

  .back-icon {
    width: 16px;
    height: 16px;
  }

  .back-text {
    white-space: nowrap;
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

.nexus-icon {
  width: 16px;
  height: 16px;
}

/* ─── Ribbon ─── */
.excel-ribbon {
  background: var(--nexus-bg-elevated);
  border-bottom: 1px solid var(--nexus-border);
  flex-shrink: 0;
}

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

.ribbon-content {
  display: flex;
  padding: 10px 16px;
  min-height: 96px;
  background: var(--nexus-bg-elevated);
  overflow-x: auto;
}

.ribbon-panel {
  display: flex;
  gap: 0;
  width: 100%;
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

/* AI 智能组横向排列 */
.ribbon-group:has(.ai-toggle) .group-content {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.group-divider {
  width: 1px;
  margin: 4px 6px;
  background: var(--nexus-border);
  flex-shrink: 0;
}

.btn-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.font-row {
  display: flex;
  gap: 6px;
}

.nexus-font-select {
  padding: 4px 8px;
  border-radius: var(--nexus-radius-md);
  border: 1px solid var(--nexus-border);
  background: var(--nexus-bg-elevated);
  color: var(--nexus-text-primary);
  font-size: 12px;
  font-family: var(--nexus-font-ui);
  outline: none;
  cursor: pointer;
  width: 120px;
}

.nexus-size-select {
  padding: 4px 8px;
  border-radius: var(--nexus-radius-md);
  border: 1px solid var(--nexus-border);
  background: var(--nexus-bg-elevated);
  color: var(--nexus-text-primary);
  font-size: 12px;
  font-family: var(--nexus-font-ui);
  outline: none;
  cursor: pointer;
  width: 60px;
}

.format-row {
  display: flex;
  gap: 2px;
  align-items: center;
}

.color-picker-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.color-input {
  width: 0;
  height: 0;
  padding: 0;
  border: none;
  visibility: hidden;
  position: absolute;
}

.color-bar {
  width: 18px;
  height: 3px;
  border-radius: 2px;
  cursor: pointer;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ─── Formula Bar ─── */
.formula-bar {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  background: var(--nexus-bg);
  border-bottom: 1px solid var(--nexus-border);
  gap: 8px;
  flex-shrink: 0;
}

.cell-ref-box {
  width: 60px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--nexus-font-mono);
  color: var(--nexus-text-primary);
  background: var(--nexus-bg-elevated);
  border: 1px solid var(--nexus-border);
  border-radius: var(--nexus-radius-sm);
  flex-shrink: 0;
}

.formula-input-wrap {
  display: flex;
  align-items: center;
  flex: 1;
  height: 24px;
  background: var(--nexus-bg-elevated);
  border: 1px solid var(--nexus-border);
  border-radius: var(--nexus-radius-sm);
  padding: 0 8px;
  gap: 6px;
}

.formula-icon {
  width: 14px;
  height: 14px;
  color: var(--nexus-text-tertiary);
  flex-shrink: 0;
}

.formula-input {
  flex: 1;
  height: 100%;
  font-size: 12px;
  font-family: var(--nexus-font-mono);
  color: var(--nexus-text-primary);
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: var(--nexus-text-tertiary);
  }
}

/* ─── Editor Body ─── */
.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.excel-main {
  flex: 1;
  overflow: auto;
  background: var(--nexus-bg);
}

.spreadsheet-container {
  display: inline-block;
  min-width: 100%;
}

.grid-wrapper {
  display: inline-block;
}

.grid-row {
  display: flex;
}

.corner-cell {
  width: 40px;
  height: 24px;
  background: var(--nexus-bg-elevated);
  border-right: 1px solid var(--nexus-border);
  border-bottom: 1px solid var(--nexus-border);
  flex-shrink: 0;
  cursor: pointer;

  &:hover {
    background: var(--nexus-divider);
  }
}

.column-header {
  width: 80px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--nexus-font-ui);
  color: var(--nexus-text-secondary);
  background: var(--nexus-bg-elevated);
  border-right: 1px solid var(--nexus-border);
  border-bottom: 1px solid var(--nexus-border);
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--nexus-divider);
  }

  &.active {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
  }
}

.row-header {
  width: 40px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  color: var(--nexus-text-secondary);
  background: var(--nexus-bg-elevated);
  border-right: 1px solid var(--nexus-border);
  border-bottom: 1px solid var(--nexus-border);
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--nexus-divider);
  }

  &.active {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
  }
}

.cell {
  width: 80px;
  height: 24px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  font-size: 12px;
  font-family: var(--nexus-font-ui);
  color: var(--nexus-text-primary);
  background: var(--nexus-bg);
  border-right: 1px solid var(--nexus-border);
  border-bottom: 1px solid var(--nexus-border);
  flex-shrink: 0;
  cursor: cell;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    background: var(--nexus-divider);
  }

  &.selected {
    outline: 2px solid var(--nexus-text-primary);
    outline-offset: -1px;
    z-index: 1;
  }

  &.in-range {
    background: rgba(0, 0, 0, 0.04);
  }

  &.editing {
    padding: 0;
  }

  &.is-formula {
    color: var(--nexus-success);
  }
}

.cell-editor {
  width: 100%;
  height: 100%;
  font-size: 12px;
  font-family: var(--nexus-font-ui);
  color: var(--nexus-text-primary);
  background: var(--nexus-bg-elevated);
  border: none;
  outline: none;
  padding: 0 4px;
}

/* ─── Footer ─── */
.excel-footer {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  background: var(--nexus-bg-elevated);
  border-top: 1px solid var(--nexus-border);
  gap: 8px;
  flex-shrink: 0;
}

.sheet-controls {
  display: flex;
  align-items: center;
}

.sheet-add-btn {
  width: 24px;
  height: 24px;
}

.sheet-tabs {
  display: flex;
  gap: 2px;
  flex: 1;
  overflow-x: auto;
}

.sheet-tab {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--nexus-font-ui);
  color: var(--nexus-text-secondary);
  background: var(--nexus-bg);
  border: 1px solid var(--nexus-border);
  border-radius: var(--nexus-radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: all 200ms var(--nexus-ease);

  &:hover {
    background: var(--nexus-divider);
    color: var(--nexus-text-primary);
  }

  &.active {
    background: var(--nexus-text-primary);
    color: var(--nexus-text-inverse);
    border-color: var(--nexus-text-primary);
  }
}

.status-text {
  font-size: 11px;
  color: var(--nexus-text-tertiary);
  font-family: var(--nexus-font-mono);
  white-space: nowrap;
}
</style>
