<template>
  <div class="create-project-view">
    <!-- 全局噪点纹理 -->
    <div class="grain-overlay"></div>

    <!-- 页面容器 -->
    <div class="page-container">
      <!-- 页头 -->
      <header class="page-header">
        <button class="back-btn" @click="router.back()">
          <ArrowLeft class="icon" />
          返回
        </button>
        <div class="header-content">
          <p class="header-subtitle">New Project</p>
          <h1 class="header-title">创建新项目</h1>
          <p class="header-desc">填写基本信息，开启你的创作之旅</p>
        </div>
      </header>

      <!-- 表单主体 -->
      <main class="form-main">
        <form class="create-form" @submit.prevent="handleCreate">
          <!-- 基本信息 -->
          <section class="form-section">
            <h2 class="section-title">
              <FileText class="title-icon" />
              基本信息
            </h2>

            <div class="form-grid">
              <!-- 项目名称 -->
              <div class="form-item full-width">
                <label class="form-label">
                  项目名称 <span class="required">*</span>
                </label>
                <input
                  v-model="formData.name"
                  type="text"
                  class="form-input"
                  placeholder="为你的项目起个名字"
                  maxlength="50"
                />
                <span class="input-hint">{{ formData.name.length }}/50</span>
              </div>

              <!-- 所属团队 -->
              <div class="form-item full-width">
                <label class="form-label">
                  所属团队 <span class="required">*</span>
                </label>
                <select v-model="formData.teamId" class="form-select">
                  <option value="">请选择团队</option>
                  <option v-for="team in teamList" :key="team.uuid" :value="team.uuid">
                    {{ team.name }}
                  </option>
                </select>
                <p class="field-hint">仅团队所有者或管理员可以创建项目</p>
              </div>

              <!-- 项目分类 -->
              <div class="form-item">
                <label class="form-label">项目分类</label>
                <select v-model="formData.category" class="form-select">
                  <option value="">请选择分类</option>
                  <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                  </option>
                </select>
              </div>

              <!-- 项目类型 -->
              <div class="form-item">
                <label class="form-label">项目类型</label>
                <div class="type-radio-group">
                  <button
                    v-for="type in typeOptions"
                    :key="type.value"
                    type="button"
                    :class="['type-btn', { active: formData.type === type.value }]"
                    @click="formData.type = type.value"
                  >
                    <component :is="type.icon" class="type-icon" />
                    <span>{{ type.label }}</span>
                  </button>
                </div>
              </div>

              <!-- 项目描述 -->
              <div class="form-item full-width">
                <label class="form-label">项目简介</label>
                <textarea
                  v-model="formData.description"
                  class="form-textarea"
                  placeholder="简要描述你的项目目标、功能和特色..."
                  maxlength="500"
                  rows="4"
                ></textarea>
                <span class="input-hint">{{ formData.description.length }}/500</span>
              </div>
            </div>
          </section>

          <!-- 封面与标签 -->
          <section class="form-section">
            <h2 class="section-title">
              <ImageIcon class="title-icon" />
              封面与标签
            </h2>

            <div class="form-grid">
              <!-- 封面上传 -->
              <div class="form-item">
                <label class="form-label">项目封面</label>
                <div
                  class="cover-upload"
                  :class="{ 'has-cover': formData.coverUrl, 'uploading': coverUploading }"
                  @click="triggerCoverUpload"
                  @dragover.prevent
                  @drop.prevent="handleCoverDrop"
                >
                  <img
v-if="formData.coverUrl"
:src="formData.coverUrl"
alt="封面"
class="cover-preview" />
                  <template v-else>
                    <UploadCloud v-if="!coverUploading" class="upload-icon" />
                    <div v-else class="upload-spinner"></div>
                    <p class="upload-text">{{ coverUploading ? '上传中...' : '点击或拖拽上传封面' }}</p>
                    <p class="upload-hint">建议尺寸 1200×630px</p>
                  </template>
                  <input
ref="coverInputRef"
type="file"
accept="image/*"
hidden
@change="handleCoverChange" />
                </div>
              </div>

              <!-- 标签 -->
              <div class="form-item">
                <label class="form-label">项目标签</label>
                <div class="tags-container">
                  <div class="tags-input-wrap">
                    <input
                      v-model="tagInput"
                      type="text"
                      class="tags-input"
                      placeholder="输入标签后按回车添加"
                      @keydown.enter.prevent="addTag"
                    />
                  </div>
                  <div class="tags-list">
                    <span v-for="(tag, index) in formData.tags" :key="index" class="tag-item">
                      {{ tag }}
                      <button type="button" class="tag-remove" @click="removeTag(index)">
                        <X class="x-icon" />
                      </button>
                    </span>
                  </div>
                  <p class="tags-hint">添加标签有助于其他用户发现你的项目</p>
                </div>
              </div>
            </div>
          </section>

          <!-- 设置 -->
          <section class="form-section">
            <h2 class="section-title">
              <Settings class="title-icon" />
              项目设置
            </h2>

            <div class="form-grid">
              <!-- 可见性 -->
              <div class="form-item">
                <label class="form-label">可见性</label>
                <div class="visibility-group">
                  <button
                    v-for="vis in visibilityOptions"
                    :key="vis.value"
                    type="button"
                    :class="['visibility-btn', { active: formData.visibility === vis.value }]"
                    @click="formData.visibility = vis.value"
                  >
                    <component :is="vis.icon" class="vis-icon" />
                    <div class="vis-info">
                      <span class="vis-label">{{ vis.label }}</span>
                      <span class="vis-desc">{{ vis.desc }}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="handleSaveDraft">
              <Save class="btn-icon" />
              保存草稿
            </button>
            <button type="submit" class="btn-primary" :disabled="!canSubmit || creating">
              <template v-if="creating">
                <span class="spinner"></span>
                创建中...
              </template>
              <template v-else>
                <Rocket class="btn-icon" />
                创建项目
              </template>
            </button>
          </div>
        </form>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAiWorkshopStore } from '@/store'
import { createProject } from '@/api/project'
import { uploadFile } from '@/api/file'
import { getMyTeams } from '@/api/team'
import type { TeamDetail } from '@/api/types'

const aiStore = useAiWorkshopStore()
import {
  ArrowLeft,
  FileText,
  ImageIcon,
  Settings,
  UploadCloud,
  X,
  Save,
  Rocket,
  Smartphone,
  FileCode,
  Eye,
  EyeOff
} from 'lucide-vue-next'

const router = useRouter()
const message = useMessage()

// ==================== 表单数据 ====================

/** 表单数据 */
const formData = reactive({
  name: '',
  teamId: '',
  category: '',
  type: 'app' as 'app' | 'document',
  description: '',
  coverUrl: '',
  tags: [] as string[],
  visibility: 'private' as 'private' | 'public'
})

/** 标签输入 */
const tagInput = ref('')
/** 封面上传 input 引用 */
const coverInputRef = ref<HTMLInputElement | null>(null)
/** 创建中状态 */
const creating = ref(false)
/** 封面上传中状态 */
const coverUploading = ref(false)
/** 团队列表 */
const teamList = ref<TeamDetail[]>([])

// ==================== 选项定义 ====================

/** 分类选项 */
const categoryOptions = [
  { label: 'SaaS 产品', value: 'saas' },
  { label: 'APP / 小程序', value: 'app-mobile' },
  { label: '内容产品', value: 'content' },
  { label: '工具型产品', value: 'tool' },
  { label: '电商平台', value: 'ecommerce' },
  { label: '人工智能', value: 'ai' },
  { label: '游戏', value: 'game' },
  { label: '其他', value: 'other' }
]

/** 类型选项 */
const typeOptions: { label: string; value: 'app' | 'document'; icon: typeof Smartphone }[] = [
  { label: '应用', value: 'app', icon: Smartphone },
  { label: '文档', value: 'document', icon: FileCode }
]

/** 可见性选项 */
const visibilityOptions: { label: string; desc: string; value: 'private' | 'public'; icon: typeof EyeOff }[] = [
  { label: '私有', desc: '仅自己和被邀请的成员可见', value: 'private', icon: EyeOff },
  { label: '公开', desc: '所有人都可以查看', value: 'public', icon: Eye }
]

// ==================== 计算属性 ====================

/**
 * 是否可以提交
 */
const canSubmit = computed(() => {
  return formData.name.trim().length > 0 && formData.teamId.length > 0
})

// ==================== 生命周期 ====================

onMounted(async () => {
  await loadTeams()
  loadDraft()
})

/**
 * 加载草稿
 */
function loadDraft(): void {
  try {
    const draftJson = localStorage.getItem('project_draft')
    if (draftJson) {
      const draft = JSON.parse(draftJson)
      // 恢复表单数据
      formData.name = draft.name || ''
      formData.teamId = draft.teamId || ''
      formData.category = draft.category || ''
      formData.type = draft.type || 'app'
      formData.description = draft.description || ''
      formData.coverUrl = draft.coverUrl || ''
      formData.tags = draft.tags || []
      formData.visibility = draft.visibility || 'private'
      
      if (formData.name) {
        message.info('已恢复上次保存的草稿')
      }
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
  }
}

// ==================== 数据加载 ====================

/**
 * 加载团队列表
 */
async function loadTeams() {
  try {
    const res = await getMyTeams({ page: 1, size: 100 })
    if (res.data.data) {
      teamList.value = res.data.data.teams
      // 如果有默认团队，自动选择
      if (teamList.value.length === 1 && teamList.value[0]?.uuid) {
        formData.teamId = teamList.value[0].uuid
      }
    }
  } catch (error) {
    console.error('加载团队列表失败:', error)
    message.error('加载团队列表失败')
  }
}

// ==================== 标签管理 ====================

/**
 * 添加标签
 */
function addTag(): void {
  const tag = tagInput.value.trim()
  if (tag && !formData.tags.includes(tag)) {
    if (formData.tags.length >= 6) {
      message.warning('最多添加 6 个标签')
      return
    }
    formData.tags.push(tag)
    tagInput.value = ''
  }
}

/**
 * 移除标签
 * @param index - 标签索引
 */
function removeTag(index: number): void {
  formData.tags.splice(index, 1)
}

// ==================== 封面上传 ====================

/**
 * 触发封面上传
 */
function triggerCoverUpload(): void {
  if (coverUploading.value) return
  coverInputRef.value?.click()
}

/**
 * 处理封面文件选择
 * @param event - 文件选择事件
 */
async function handleCoverChange(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadCover(file)
  }
}

/**
 * 处理封面拖放
 * @param event - 拖放事件
 */
async function handleCoverDrop(event: DragEvent): Promise<void> {
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    await uploadCover(file)
  }
}

/**
 * 上传封面文件
 * @param file - 图片文件
 */
async function uploadCover(file: File): Promise<void> {
  coverUploading.value = true
  try {
    const res = await uploadFile(file)
    if (res.data.data) {
      formData.coverUrl = res.data.data.url
      message.success('封面上传成功')
    }
  } catch (error) {
    console.error('封面上传失败:', error)
    message.error('封面上传失败')
  } finally {
    coverUploading.value = false
    // 清空 input 以便可以再次选择同一文件
    if (coverInputRef.value) {
      coverInputRef.value.value = ''
    }
  }
}

// ==================== 表单操作 ====================

/**
 * 保存草稿 - 创建本地项目作为草稿
 */
function handleSaveDraft(): void {
  if (!formData.name.trim()) {
    message.warning('请至少填写项目名称')
    return
  }

  try {
    // 创建草稿项目
    const draftProject = aiStore.addProject({
      name: formData.name.trim(),
      description: formData.description,
      category: getCategoryLabel(formData.category),
      type: formData.type,
      visibility: formData.visibility,
      cover: formData.coverUrl,
      tags: formData.tags,
      status: 'draft',
      progress: 0
    })
    
    // 同时保存草稿数据到单独的 key
    const draftData = {
      ...formData,
      projectId: draftProject.id,
      savedAt: Date.now()
    }
    localStorage.setItem('project_draft', JSON.stringify(draftData))
    
    message.success('草稿已保存')
  } catch (err) {
    console.error('保存草稿失败:', err)
    message.error('保存失败，请重试')
  }
}

/**
 * 创建项目
 */
async function handleCreate(): Promise<void> {
  if (!canSubmit.value) return

  creating.value = true

  try {
    // 准备请求参数
    const params = {
      name: formData.name.trim(),
      teamId: formData.teamId,
      visibility: formData.visibility,
      description: formData.description,
      category: getCategoryLabel(formData.category),
      coverUrl: formData.coverUrl,
      type: formData.type,
      tags: formData.tags
    }

    console.log('【创建项目】请求参数:', params)
    console.log('【创建项目】API地址:', import.meta.env.VITE_API_BASE_URL || '默认地址')

    // 调用后端 API 创建项目
    const res = await createProject(params)
    console.log('【创建项目】响应:', res)
    
    const newProject = res.data.data

    if (!newProject) {
      throw new Error('创建项目失败：响应数据为空')
    }

    console.log('【创建项目】创建成功，项目ID:', newProject.id)

    // 同步到本地 store（用于前端快速展示）
    aiStore.addProject({
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      category: newProject.category || '未分类',
      type: formData.type,
      cover: newProject.coverUrl,
      tags: formData.tags,
      status: (newProject.status || 'active') as 'active' | 'completed' | 'paused' | 'draft',
      visibility: (newProject.visibility || 'private') as 'public' | 'private',
      team: [
        { id: String(newProject.ownerId), name: '我', avatar: '', role: 'owner' }
      ]
    })
    
    message.success('项目创建成功！ID: ' + newProject.id)

    // 清除草稿
    localStorage.removeItem('project_draft')

    // 根据类型跳转不同页面
    setTimeout(() => {
      if (formData.type === 'document') {
        router.push(`/project/doc/${newProject.id}`)
      } else {
        router.push(`/project/workspace/${newProject.id}`)
      }
    }, 800)
  } catch (err: any) {
    console.error('【创建项目】失败:', err)
    console.error('【创建项目】错误详情:', {
      message: err.message,
      response: err.response,
      status: err.response?.status,
      data: err.response?.data
    })
    const errorMsg = err.response?.data?.message || err.message || '创建失败，请重试'
    message.error('创建失败: ' + errorMsg)
  } finally {
    creating.value = false
  }
}

/**
 * 获取分类显示名称
 * @param value - 分类值
 * @returns 分类名称
 */
function getCategoryLabel(value: string): string {
  const cat = categoryOptions.find(c => c.value === value)
  return cat?.label || '未分类'
}
</script>

<style scoped lang="scss">
// ==================== 设计令牌 ====================
:root {
  --color-bg: #fafafa;
  --color-white: #ffffff;
  --color-black: #000000;
  --color-gray-900: #111827;
  --color-gray-700: #374151;
  --color-gray-600: #6b7280;
  --color-gray-400: #9ca3af;
  --color-gray-200: #e5e7eb;
  --color-gray-100: #f3f4f6;
  --shadow-sm: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 12px 40px -12px rgba(0, 0, 0, 0.08);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;
}

// ==================== 全局样式 ====================
.create-project-view {
  min-height: 100vh;
  background: var(--color-bg);
  position: relative;
  padding-bottom: 80px;
}

// 噪点纹理
.grain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

// 页面容器
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
  position: relative;
  z-index: 2;
}

// ==================== 页头 ====================
.page-header {
  margin-bottom: 40px;
  animation: slideUp 0.8s var(--ease-out-expo) forwards;

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: transparent;
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-full);
    color: var(--color-gray-700);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 24px;

    .icon {
      width: 16px;
      height: 16px;
    }

    &:hover {
      border-color: var(--color-black);
      color: var(--color-black);
    }
  }

  .header-content {
    .header-subtitle {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-gray-400);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 12px;
    }

    .header-title {
      font-size: 36px;
      font-weight: 600;
      line-height: 1.2;
      color: var(--color-gray-900);
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .header-desc {
      font-size: 16px;
      color: var(--color-gray-600);
      line-height: 1.6;
    }
  }
}

// ==================== 表单主体 ====================
.form-main {
  animation: slideUp 0.8s var(--ease-out-expo) forwards;
  animation-delay: 0.15s;
  opacity: 0;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

// ==================== 表单区块 ====================
.form-section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-xl);
  padding: 32px;
  box-shadow: var(--shadow-sm);

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-gray-900);
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-gray-100);

    .title-icon {
      width: 20px;
      height: 20px;
      color: var(--color-gray-400);
    }
  }
}

// ==================== 表单网格 ====================
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  .full-width {
    grid-column: 1 / -1;
  }
}

// ==================== 表单项 ====================
.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .form-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-gray-700);

    .required {
      color: #ef4444;
    }
  }

  .input-hint {
    font-size: 12px;
    color: var(--color-gray-400);
    text-align: right;
  }

  .field-hint {
    font-size: 12px;
    color: var(--color-gray-400);
    margin-top: 4px;
  }
}

// 输入框
.form-input,
.form-select,
.form-textarea {
  padding: 12px 16px;
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  font-size: 14px;
  color: var(--color-gray-900);
  transition: all 0.3s ease;
  font-family: inherit;

  &::placeholder {
    color: var(--color-gray-400);
  }

  &:focus {
    outline: none;
    border-color: var(--color-black);
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
  }
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
}

// ==================== 类型选择 ====================
.type-radio-group {
  display: flex;
  gap: 12px;

  .type-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--color-white);
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-lg);
    font-size: 14px;
    font-weight: 500;
    color: var(--color-gray-600);
    cursor: pointer;
    transition: all 0.3s ease;

    .type-icon {
      width: 18px;
      height: 18px;
    }

    &:hover {
      border-color: var(--color-gray-400);
    }

    &.active {
      background: var(--color-black);
      border-color: var(--color-black);
      color: var(--color-white);
    }
  }
}

// ==================== 封面上传 ====================
.cover-upload {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--color-gray-100);
  border: 2px dashed var(--color-gray-200);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;

  &:hover:not(.uploading) {
    border-color: var(--color-gray-400);
    background: var(--color-white);
  }

  &.has-cover {
    border-style: solid;
    border-color: var(--color-gray-200);
    padding: 0;
  }

  &.uploading {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .upload-icon {
    width: 32px;
    height: 32px;
    color: var(--color-gray-400);
    margin-bottom: 8px;
  }

  .upload-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-gray-200);
    border-top-color: var(--color-gray-900);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 8px;
  }

  .upload-text {
    font-size: 14px;
    color: var(--color-gray-600);
    font-weight: 500;
    margin-bottom: 4px;
  }

  .upload-hint {
    font-size: 12px;
    color: var(--color-gray-400);
  }

  .cover-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

// ==================== 标签 ====================
.tags-container {
  .tags-input-wrap {
    .tags-input {
      width: 100%;
      padding: 10px 14px;
      background: var(--color-white);
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-lg);
      font-size: 14px;
      color: var(--color-gray-900);
      transition: all 0.3s ease;

      &::placeholder {
        color: var(--color-gray-400);
      }

      &:focus {
        outline: none;
        border-color: var(--color-black);
      }
    }
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;

    .tag-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--color-gray-100);
      border-radius: var(--radius-full);
      font-size: 13px;
      color: var(--color-gray-700);

      .tag-remove {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        background: transparent;
        border: none;
        border-radius: 50%;
        color: var(--color-gray-400);
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;

        .x-icon {
          width: 12px;
          height: 12px;
        }

        &:hover {
          background: rgba(0, 0, 0, 0.1);
          color: var(--color-gray-700);
        }
      }
    }
  }

  .tags-hint {
    font-size: 12px;
    color: var(--color-gray-400);
    margin-top: 8px;
  }
}

// ==================== 可见性选择 ====================
.visibility-group {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .visibility-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--color-white);
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.3s ease;

    .vis-icon {
      width: 20px;
      height: 20px;
      color: var(--color-gray-400);
      flex-shrink: 0;
    }

    .vis-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .vis-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--color-gray-700);
      }

      .vis-desc {
        font-size: 12px;
        color: var(--color-gray-400);
      }
    }

    &:hover {
      border-color: var(--color-gray-400);
    }

    &.active {
      border-color: var(--color-black);
      background: rgba(0, 0, 0, 0.02);

      .vis-icon {
        color: var(--color-black);
      }

      .vis-label {
        color: var(--color-black);
      }
    }
  }
}

// ==================== 操作按钮 ====================
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;

  .btn-secondary,
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: var(--radius-lg);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s var(--ease-out-expo);
    border: none;

    .btn-icon {
      width: 18px;
      height: 18px;
    }
  }

  .btn-secondary {
    background: var(--color-white);
    border: 1px solid var(--color-gray-200);
    color: var(--color-gray-700);

    &:hover {
      border-color: var(--color-black);
      color: var(--color-black);
    }
  }

  .btn-primary {
    background: var(--color-black);
    color: var(--color-white);
    min-width: 160px;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .page-container {
    padding: 20px 16px;
  }

  .page-header {
    .header-title {
      font-size: 28px;
    }
  }

  .form-section {
    padding: 24px 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;

    .btn-secondary,
    .btn-primary {
      width: 100%;
    }
  }
}
</style>
