<template>
  <div class="account-settings-view">
    <header class="page-header">
      <div class="header-left">
        <h2 class="page-title">账户设置</h2>
        <span class="page-subtitle">管理你的个人信息和偏好</span>
      </div>
    </header>

    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else class="settings-grid">
        <!-- 个人信息 -->
        <div class="settings-card">
          <h3 class="card-title">个人信息</h3>
          <div class="avatar-section">
            <img :src="user.avatar || defaultAvatar" alt="头像" class="user-avatar" />
            <button class="change-avatar-btn" @click="handleAvatarChange">更换头像</button>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="onAvatarSelected"
            />
          </div>
          <div class="form-group">
            <label>用户名</label>
            <input v-model="user.username" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input
v-model="user.email"
type="email"
class="form-input"
disabled />
          </div>
          <div class="form-group">
            <label>个人简介</label>
            <textarea
v-model="user.bio"
class="form-textarea"
rows="3"
placeholder="介绍一下你自己..."></textarea>
          </div>
          <div class="form-group">
            <label>所在地区</label>
            <input
v-model="user.address"
type="text"
class="form-input"
placeholder="例如：北京, 中国" />
          </div>
          <div class="form-group">
            <label>个人网站</label>
            <input
v-model="user.perWebsite"
type="url"
class="form-input"
placeholder="https://example.com" />
          </div>
          <button class="save-btn" @click="saveProfile" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存更改' }}
          </button>
        </div>

        <!-- 通知设置 -->
        <div class="settings-card">
          <h3 class="card-title">通知设置</h3>
          <div class="toggle-list">
            <div class="toggle-item">
              <div class="toggle-info">
                <span class="toggle-label">系统通知</span>
                <span class="toggle-desc">接收系统更新和维护通知</span>
              </div>
              <label class="toggle">
                <input v-model="settings.isNotifSys" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="toggle-item">
              <div class="toggle-info">
                <span class="toggle-label">动态通知</span>
                <span class="toggle-desc">接收关注和互动相关通知</span>
              </div>
              <label class="toggle">
                <input v-model="settings.isNotifTrends" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="toggle-item">
              <div class="toggle-info">
                <span class="toggle-label">帖子通知</span>
                <span class="toggle-desc">接收帖子评论和点赞通知</span>
              </div>
              <label class="toggle">
                <input v-model="settings.isNotifPost" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <button class="save-btn" @click="saveSettings" :disabled="isSavingSettings">
            {{ isSavingSettings ? '保存中...' : '保存设置' }}
          </button>
        </div>

        <!-- 隐私设置 -->
        <div class="settings-card">
          <h3 class="card-title">隐私设置</h3>
          <div class="toggle-list">
            <div class="toggle-item">
              <div class="toggle-info">
                <span class="toggle-label">隐藏个人信息</span>
                <span class="toggle-desc">其他用户无法查看你的详细资料</span>
              </div>
              <label class="toggle">
                <input v-model="settings.isHide" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <button class="save-btn" @click="saveSettings" :disabled="isSavingSettings">
            {{ isSavingSettings ? '保存中...' : '保存设置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { getCurrentUser, updateUser } from '@/api/user'
import { useUserStore } from '@/store/user'
import type { User } from '@/api/types'

const userStore = useUserStore()
const message = useMessage()
const defaultAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80'

// 加载状态
const isLoading = ref(true)
const isSaving = ref(false)
const isSavingSettings = ref(false)

// 头像上传
const avatarInput = ref<HTMLInputElement | null>(null)

// 用户数据
const user = ref<User>({
  id: 0,
  username: '',
  email: '',
  avatar: '',
  bio: '',
  address: '',
  perWebsite: ''
})

// 设置数据
const settings = ref({
  isNotifSys: true,
  isNotifTrends: true,
  isNotifPost: false,
  isHide: false
})

/**
 * 加载用户信息
 */
async function loadUserInfo() {
  isLoading.value = true
  try {
    const res = await getCurrentUser()
    if (res.data.status === 200 && res.data.data) {
      const userData = res.data.data
      user.value = {
        ...userData,
        bio: userData.bio || '',
        address: userData.address || '',
        perWebsite: userData.perWebsite || ''
      }
      // 更新 store 中的用户信息
      const { id, avatar, cover, bio, position, address, perWebsite, phone, ...rest } = userData
      userStore.updateProfile({
        ...rest,
        id: String(id),
        avatar: avatar || '',
        cover: cover || undefined,
        bio: bio || undefined,
        position: position || undefined,
        address: address || undefined,
        perWebsite: perWebsite || undefined,
        phone: phone || undefined
      } as any)
    } else {
      message.error(res.data.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    message.error('获取用户信息失败')
  } finally {
    isLoading.value = false
  }
}

/**
 * 保存个人信息
 */
async function saveProfile() {
  if (!user.value.username.trim()) {
    message.error('用户名不能为空')
    return
  }

  isSaving.value = true
  try {
    const res = await updateUser({
      username: user.value.username,
      bio: user.value.bio || null,
      address: user.value.address || null,
      perWebsite: user.value.perWebsite || null
    })

    if (res.data.status === 200) {
      message.success('个人信息保存成功')
      // 更新 store 中的用户信息
      userStore.updateProfile({
        username: user.value.username,
        avatar: user.value.avatar || '',
        bio: user.value.bio || undefined,
        address: user.value.address || undefined,
        perWebsite: user.value.perWebsite || undefined
      } as any)
    } else {
      message.error(res.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存个人信息失败:', error)
    message.error('保存失败，请稍后重试')
  } finally {
    isSaving.value = false
  }
}

/**
 * 保存设置
 */
async function saveSettings() {
  isSavingSettings.value = true
  try {
    const res = await updateUser({
      isHide: settings.value.isHide,
      isNotifSys: settings.value.isNotifSys,
      isNotifTrends: settings.value.isNotifTrends,
      isNotifPost: settings.value.isNotifPost
    })

    if (res.data.status === 200) {
      message.success('设置保存成功')
    } else {
      message.error(res.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    message.error('保存失败，请稍后重试')
  } finally {
    isSavingSettings.value = false
  }
}

/**
 * 触发头像选择
 */
function handleAvatarChange() {
  avatarInput.value?.click()
}

/**
 * 处理头像选择
 */
async function onAvatarSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // TODO: 实现头像上传功能
  message.info('头像上传功能开发中...')
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped lang="scss">
$color-gray-900: #111827;
$color-gray-600: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-200: #e5e7eb;
$color-gray-100: #f3f4f6;

.account-settings-view {
  min-height: 100vh;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(250, 250, 250, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: $color-gray-900;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: $color-gray-400;
}

.content-area {
  padding: 32px 32px 80px;
  max-width: 1280px;
  margin: 0 auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: $color-gray-600;
  gap: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid $color-gray-200;
  border-top-color: $color-gray-900;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.settings-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: $color-gray-900;
  margin-bottom: 20px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.change-avatar-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid $color-gray-200;
  border-radius: 8px;
  font-size: 14px;
  color: $color-gray-600;
  cursor: pointer;

  &:hover {
    border-color: #000;
    color: #000;
  }
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    color: $color-gray-600;
    margin-bottom: 8px;
  }
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid $color-gray-200;
  border-radius: 8px;
  font-size: 14px;
  color: $color-gray-900;

  &:focus {
    outline: none;
    border-color: #000;
  }

  &:disabled {
    background: $color-gray-100;
    color: $color-gray-400;
    cursor: not-allowed;
  }
}

.form-textarea {
  resize: vertical;
}

.save-btn {
  padding: 10px 24px;
  background: #000;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  margin-top: 8px;

  &:hover:not(:disabled) {
    background: $color-gray-900;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-label {
  font-size: 14px;
  color: $color-gray-900;
}

.toggle-desc {
  font-size: 12px;
  color: $color-gray-400;
}

.toggle {
  position: relative;
  width: 44px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background: #000;
    }

    &:checked + .toggle-slider:before {
      transform: translateX(20px);
    }
  }
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $color-gray-200;
  border-radius: 24px;
  transition: 0.3s;

  &:before {
    content: '';
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: #fff;
    border-radius: 50%;
    transition: 0.3s;
  }
}
</style>
