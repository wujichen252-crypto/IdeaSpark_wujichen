<template>
  <div class="edit-profile-page">
    <!-- 噪点纹理层 -->
    <div class="grain-overlay"></div>

    <div class="edit-profile-container">
      <!-- 页面头部 -->
      <header class="page-header glass-panel">
        <div class="header-left">
          <h1 class="page-title">编辑个人资料</h1>
          <span v-if="hasUnsavedChanges" class="unsaved-badge">未保存的修改</span>
        </div>
        <button class="btn btn-secondary" @click="$router.push('/profile')">
          <ArrowLeft class="btn-icon" />
          返回个人中心
        </button>
      </header>

      <div class="content-grid">
        <!-- 左侧表单 -->
        <div class="form-section glass-panel">
          <form @submit.prevent="handleValidateButtonClick">
            <!-- 头像上传 -->
            <div class="form-group">
              <label class="form-label">头像</label>
              <div class="avatar-uploader">
                <div class="avatar-preview">
                  <img :src="formValue.avatar || defaultAvatar" :alt="formValue.username" class="avatar-img" />
                </div>
                <label class="upload-btn" :class="{ 'is-loading': uploading }">
                  <input
                    type="file"
                    accept="image/*"
                    class="file-input"
                    :disabled="uploading"
                    @change="handleAvatarChange"
                  />
                  <span v-if="uploading">上传中...</span>
                  <span v-else>更换头像</span>
                </label>
              </div>
            </div>

            <!-- 背景图片上传 -->
            <div class="form-group">
              <label class="form-label">个人中心背景图</label>
              <div class="cover-uploader">
                <div class="cover-preview" :style="{ backgroundImage: `url(${formValue.cover || defaultCover})` }">
                  <div class="cover-overlay"></div>
                </div>
                <div class="cover-upload-actions">
                  <label class="upload-btn" :class="{ 'is-loading': uploadingCover }">
                    <input
                      type="file"
                      accept="image/*"
                      class="file-input"
                      :disabled="uploadingCover"
                      @change="handleCoverChange"
                    />
                    <span v-if="uploadingCover">上传中...</span>
                    <span v-else>{{ formValue.cover ? '更换背景' : '上传背景' }}</span>
                  </label>
                  <button
                    v-if="formValue.cover"
                    type="button"
                    class="btn btn-text"
                    @click="formValue.cover = ''"
                  >
                    删除背景
                  </button>
                </div>
              </div>
            </div>

            <!-- 用户名 -->
            <div class="form-group">
              <label class="form-label">
                用户名
                <span class="required">*</span>
              </label>
              <input
                v-model="formValue.username"
                type="text"
                class="form-input"
                placeholder="请输入用户名"
                required
              />
            </div>

            <!-- 职位 / 角色 -->
            <div class="form-group">
              <label class="form-label">职位 / 角色</label>
              <input
                v-model="formValue.role"
                type="text"
                class="form-input"
                placeholder="例如：全栈开发者"
              />
            </div>

            <!-- 个人简介 -->
            <div class="form-group">
              <label class="form-label">个人简介</label>
              <textarea
                v-model="formValue.bio"
                class="form-textarea"
                placeholder="介绍一下你自己..."
                rows="4"
              ></textarea>
            </div>

            <!-- 所在地区 -->
            <div class="form-group">
              <label class="form-label">所在地区</label>
              <input
                v-model="formValue.location"
                type="text"
                class="form-input"
                placeholder="例如：北京, 中国"
              />
            </div>

            <!-- 个人网站 -->
            <div class="form-group">
              <label class="form-label">个人网站</label>
              <input
                v-model="formValue.website"
                type="url"
                class="form-input"
                placeholder="https://example.com"
              />
            </div>

            <!-- 表单操作 -->
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isSaving">
                <Save v-if="!isSaving" class="btn-icon" />
                <span v-else class="loading-spinner"></span>
                {{ isSaving ? '保存中...' : '保存修改' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="$router.push('/profile')">
                取消
              </button>
            </div>
          </form>
        </div>

        <!-- 右侧预览 -->
        <div class="preview-section">
          <h3 class="preview-title">预览</h3>
          <div class="preview-card glass-panel">
            <div class="preview-header">
              <img :src="formValue.avatar || defaultAvatar" :alt="formValue.username" class="preview-avatar" />
              <div class="preview-info">
                <div class="preview-name">{{ formValue.username || '用户名' }}</div>
                <div class="preview-role">{{ formValue.role || '职位' }}</div>
              </div>
            </div>
            <div class="preview-bio">{{ formValue.bio || '个人简介...' }}</div>
            <div v-if="formValue.location" class="preview-meta">
              <MapPin class="meta-icon" />
              <span>{{ formValue.location }}</span>
            </div>
            <div v-if="formValue.website" class="preview-meta">
              <Link class="meta-icon" />
              <span>{{ formValue.website }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { ArrowLeft, Save, MapPin, Link } from 'lucide-vue-next'
import { uploadFile } from '@/api/file'
import { updateUser } from '@/api/user'
import { useUserStore } from '@/store'
import { getCurrentUserAvatar } from '@/utils/avatar'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { confirm, showError, showSuccess } = useAppDialog()
const uploading = ref(false)
const uploadingCover = ref(false)
const hasUnsavedChanges = ref(false)
const isSaving = ref(false)

// 默认头像 - 使用统一的头像工具函数
const defaultAvatar = computed(() => {
  return getCurrentUserAvatar(
    userStore.userInfo?.avatar,
    userStore.userInfo?.id,
    userStore.userInfo?.username
  )
})
// 默认背景图
const defaultCover = 'https://picsum.photos/seed/my_cover/1200/400'

// 保存原始数据用于比较
const originalData = reactive({
  avatar: '',
  cover: '',
  username: '',
  role: '',
  bio: '',
  location: '',
  website: ''
})

// 表单数据
const formValue = reactive({
  avatar: '',
  cover: '',
  username: '',
  role: '',
  bio: '',
  location: '',
  website: ''
})

onMounted(() => {
  // 从 store 加载用户信息
  const userInfo = userStore.userInfo
  if (userInfo) {
    formValue.avatar = userInfo.avatar || ''
    formValue.cover = userInfo.cover || ''
    formValue.username = userInfo.username
    formValue.role = userInfo.role || ''
    formValue.bio = userInfo.bio || ''
    formValue.location = userInfo.address || ''
    formValue.website = userInfo.perWebsite || ''

    // 保存原始数据
    originalData.avatar = formValue.avatar
    originalData.cover = formValue.cover
    originalData.username = formValue.username
    originalData.role = formValue.role
    originalData.bio = formValue.bio
    originalData.location = formValue.location
    originalData.website = formValue.website
  }

  // 监听表单数据变化
  watch(
    () => ({ ...formValue }),
    (newValue) => {
      hasUnsavedChanges.value =
        newValue.avatar !== originalData.avatar ||
        newValue.cover !== originalData.cover ||
        newValue.username !== originalData.username ||
        newValue.role !== originalData.role ||
        newValue.bio !== originalData.bio ||
        newValue.location !== originalData.location ||
        newValue.website !== originalData.website
    },
    { deep: true }
  )

  // 监听浏览器关闭/刷新事件
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

/**
 * 处理浏览器关闭/刷新事件
 */
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value && !isSaving.value) {
    event.preventDefault()
    event.returnValue = ''
    return ''
  }
}

/**
 * 路由离开前的守卫
 */
onBeforeRouteLeave(async (to, from) => {
  if (hasUnsavedChanges.value && !isSaving.value) {
    const confirmed = await confirm('您有未保存的修改，确定要离开吗？')
    if (confirmed) {
      hasUnsavedChanges.value = false
      return true
    }
    return false
  }
  return true
})

/**
 * 处理头像文件选择
 */
const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const res = await uploadFile(file)
    const { url } = res.data.data
    formValue.avatar = url
  } catch (error) {
    console.error('头像上传失败:', error)
    showError('头像上传失败，请重试')
  } finally {
    uploading.value = false
    // 清空 input 以便可以再次选择同一文件
    target.value = ''
  }
}

/**
 * 处理背景图片文件选择
 */
const handleCoverChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingCover.value = true
  try {
    const res = await uploadFile(file)
    const { url } = res.data.data
    formValue.cover = url
  } catch (error) {
    console.error('背景图片上传失败:', error)
    showError('背景图片上传失败，请重试')
  } finally {
    uploadingCover.value = false
    // 清空 input 以便可以再次选择同一文件
    target.value = ''
  }
}

/**
 * 保存个人资料
 */
const handleValidateButtonClick = async () => {
  if (!formValue.username.trim()) {
    showError('请输入用户名')
    return
  }

  isSaving.value = true
  try {
    await updateUser({
      username: formValue.username,
      avatar: formValue.avatar,
      cover: formValue.cover,
      role: formValue.role,
      bio: formValue.bio,
      position: formValue.role,
      address: formValue.location,
      perWebsite: formValue.website
    })

    // 更新本地 store
    userStore.updateProfile({
      username: formValue.username,
      avatar: formValue.avatar,
      cover: formValue.cover,
      role: formValue.role,
      bio: formValue.bio,
      address: formValue.location,
      perWebsite: formValue.website
    })

    // 更新原始数据，清除修改标记
    Object.assign(originalData, formValue)
    hasUnsavedChanges.value = false

    showSuccess('个人资料保存成功')

    // 跳转到个人中心
    setTimeout(() => {
      router.push('/profile')
    }, 500)
  } catch (error) {
    console.error('保存失败:', error)
    showError('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped lang="scss">
// ==================== 动画变量 ====================
$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// ==================== 页面容器 ====================
.edit-profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative;
  padding: 80px 24px 48px;
}

// ==================== 噪点纹理 ====================
.grain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

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

// ==================== 内容容器 ====================
.edit-profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

// ==================== 页面头部 ====================
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .unsaved-badge {
    padding: 4px 12px;
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    font-size: 12px;
    font-weight: 500;
    border-radius: 20px;
  }
}

// ==================== 按钮样式 ====================
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s $ease-out-expo;

  .btn-icon {
    width: 16px;
    height: 16px;
  }

  &.btn-primary {
    background: #000000;
    color: white;
    border-radius: 9999px;

    &:hover:not(:disabled) {
      background: #374151;
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &.btn-secondary {
    background: transparent;
    color: #6b7280;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;

    &:hover {
      background: rgba(0, 0, 0, 0.03);
      color: #1f2937;
    }
  }
}

// ==================== 内容网格 ====================
.content-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

// ==================== 表单区域 ====================
.form-section {
  padding: 32px;
  animation-delay: 0.1s;
}

.form-group {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
  letter-spacing: -0.01em;

  .required {
    color: #ef4444;
    margin-left: 4px;
  }
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  color: #111827;
  transition: all 0.3s $ease-out-expo;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #000000;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

// ==================== 头像上传 ====================
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background: #f3f4f6;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.upload-btn {
  position: relative;
  padding: 10px 20px;
  background: transparent;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s $ease-out-expo;

  &:hover:not(.is-loading) {
    background: rgba(0, 0, 0, 0.03);
    color: #1f2937;
    border-color: #d1d5db;
  }

  &.is-loading {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
}

// ==================== 背景图上传 ====================
.cover-uploader {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cover-preview {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  background-color: #f3f4f6;
  border: 2px dashed #d1d5db;
  position: relative;
  overflow: hidden;

  .cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.3) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .cover-overlay {
    opacity: 1;
  }
}

.cover-upload-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-text {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 10px 20px;
  transition: all 0.3s $ease-out-expo;

  &:hover {
    color: #dc2626;
  }
}

// ==================== 表单操作 ====================
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

// ==================== 预览区域 ====================
.preview-section {
  animation: slideUp 0.7s $ease-out-expo 0.2s forwards;
  opacity: 0;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-card {
  padding: 24px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.preview-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-info {
  .preview-name {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
  }

  .preview-role {
    font-size: 14px;
    color: #6b7280;
  }
}

.preview-bio {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  .meta-icon {
    width: 14px;
    height: 14px;
  }
}

// ==================== 响应式适配 ====================
@media (max-width: 768px) {
  .edit-profile-page {
    padding: 72px 16px 32px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .form-section {
    padding: 24px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
