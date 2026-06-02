<template>
  <div class="settings-page">
    <!-- 噪点纹理层 -->
    <div class="grain-overlay"></div>

    <div class="settings-container">
      <!-- 页面头部 -->
      <header class="page-header glass-panel">
        <div class="header-left">
          <h1 class="page-title">账号设置</h1>
        </div>
        <button class="btn btn-secondary" @click="$router.push('/profile')">
          <ArrowLeft class="btn-icon" />
          返回个人中心
        </button>
      </header>

      <!-- 标签页 -->
      <div class="tabs-wrapper glass-panel">
        <div class="tabs-header">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-btn', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="tabs-content">
          <!-- 安全设置 -->
          <div v-if="activeTab === 'security'" class="tab-pane">
            <div class="settings-list">
              <div class="setting-item">
                <div class="item-icon">
                  <Lock class="icon" />
                </div>
                <div class="item-content">
                  <div class="item-title">登录密码</div>
                  <div class="item-desc">已设置。定期修改密码可以保护账号安全。</div>
                </div>
                <button class="btn btn-outline" @click="showPasswordModal = true">修改</button>
              </div>

              <div class="setting-item">
                <div class="item-icon">
                  <Mail class="icon" />
                </div>
                <div class="item-content">
                  <div class="item-title">绑定邮箱</div>
                  <div class="item-desc">已绑定：{{ maskEmail(settings.email) }}</div>
                </div>
                <button class="btn btn-outline" @click="showEmailModal = true">换绑</button>
              </div>

              <div class="setting-item">
                <div class="item-icon">
                  <Smartphone class="icon" />
                </div>
                <div class="item-content">
                  <div class="item-title">绑定手机</div>
                  <div class="item-desc">{{ settings.phone ? '已绑定：' + maskPhone(settings.phone) : '未绑定' }}</div>
                </div>
                <button class="btn btn-outline" @click="showPhoneModal = true">
                  {{ settings.phone ? '换绑' : '绑定' }}
                </button>
              </div>

              <div class="setting-item">
                <div class="item-icon">
                  <Shield class="icon" />
                </div>
                <div class="item-content">
                  <div class="item-title">两步验证</div>
                  <div class="item-desc">{{ settings.twoFactorEnabled ? '已启用' : '未启用' }}</div>
                </div>
                <button class="btn btn-outline" @click="toggleTwoFactor">
                  {{ settings.twoFactorEnabled ? '管理' : '启用' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 通知设置 -->
          <div v-if="activeTab === 'notifications'" class="tab-pane">
            <div class="settings-list">
              <div class="setting-item">
                <div class="item-icon">
                  <Bell class="icon" />
                </div>
                <div class="item-content">
                  <div class="item-title">邮件通知</div>
                  <div class="item-desc">接收项目更新、评论回复等邮件通知</div>
                </div>
                <label class="toggle">
                  <input v-model="settings.emailNotifications" type="checkbox" @change="saveSettings" />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="item-icon">
                  <MessageSquare class="icon" />
                </div>
                <div class="item-content">
                  <div class="item-title">推送通知</div>
                  <div class="item-desc">接收浏览器推送通知</div>
                </div>
                <label class="toggle">
                  <input v-model="settings.pushNotifications" type="checkbox" @change="saveSettings" />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="item-icon">
                  <Megaphone class="icon" />
                </div>
                <div class="item-content">
                  <div class="item-title">营销邮件</div>
                  <div class="item-desc">接收产品更新、活动推广等营销邮件</div>
                </div>
                <label class="toggle">
                  <input v-model="settings.marketingEmails" type="checkbox" @change="saveSettings" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- 隐私设置 -->
          <div v-if="activeTab === 'privacy'" class="tab-pane">
            <div class="settings-list">
              <div class="setting-item">
                <div class="item-icon">
                  <Eye class="icon" />
                </div>
                <div class="item-content">
                  <div class="item-title">个人资料可见性</div>
                  <div class="item-desc">控制其他用户是否可以查看您的个人资料</div>
                </div>
                <select v-model="settings.profileVisibility" class="form-select" @change="saveSettings">
                  <option value="public">公开</option>
                  <option value="friends">仅好友</option>
                  <option value="private">私密</option>
                </select>
              </div>

              <div class="setting-item">
                <div class="item-icon">
                  <Users class="icon" />
                </div>
                <div class="item-content">
                  <div class="item-title">允许被搜索</div>
                  <div class="item-desc">允许其他用户通过用户名或邮箱搜索到您</div>
                </div>
                <label class="toggle">
                  <input v-model="settings.searchable" type="checkbox" @change="saveSettings" />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="item-icon">
                  <Activity class="icon" />
                </div>
                <div class="item-content">
                  <div class="item-title">在线状态</div>
                  <div class="item-desc">显示您的在线状态给其他用户</div>
                </div>
                <label class="toggle">
                  <input v-model="settings.showOnlineStatus" type="checkbox" @change="saveSettings" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 密码修改弹窗 -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="modal-content glass-panel">
        <div class="modal-header">
          <h3 class="modal-title">修改密码</h3>
          <button class="modal-close" @click="showPasswordModal = false">
            <X class="icon" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">当前密码</label>
            <input
v-model="passwordForm.currentPassword"
type="password"
class="form-input"
placeholder="请输入当前密码" />
          </div>
          <div class="form-group">
            <label class="form-label">新密码</label>
            <input
v-model="passwordForm.newPassword"
type="password"
class="form-input"
placeholder="请输入新密码" />
          </div>
          <div class="form-group">
            <label class="form-label">确认新密码</label>
            <input
v-model="passwordForm.confirmPassword"
type="password"
class="form-input"
placeholder="请再次输入新密码" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showPasswordModal = false">取消</button>
          <button class="btn btn-primary" @click="changePassword">确认修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAppDialog } from '@/composables/useAppDialog'
import {
  ArrowLeft,
  Lock,
  Mail,
  Smartphone,
  Shield,
  Bell,
  MessageSquare,
  Megaphone,
  Eye,
  Users,
  Activity,
  X
} from 'lucide-vue-next'

// 标签页配置
const tabs = [
  { key: 'security', label: '安全设置' },
  { key: 'notifications', label: '通知设置' },
  { key: 'privacy', label: '隐私设置' }
]

const activeTab = ref('security')

// 设置数据
const settings = reactive({
  email: 'admin@example.com',
  phone: '',
  twoFactorEnabled: false,
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
  profileVisibility: 'public',
  searchable: true,
  showOnlineStatus: true
})

// 密码修改弹窗
const showPasswordModal = ref(false)
const showEmailModal = ref(false)
const showPhoneModal = ref(false)

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const { showError } = useAppDialog()

/**
 * 隐藏邮箱
 */
function maskEmail(email: string): string {
  if (!email) return ''
  const [name, domain] = email.split('@')
  const maskedName = (name || '').slice(0, 2) + '***'
  return `${maskedName}@${domain || ''}`
}

/**
 * 隐藏手机号
 */
function maskPhone(phone: string): string {
  if (!phone) return ''
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

/**
 * 保存设置
 */
function saveSettings() {
  console.log('保存设置:', settings)
  // TODO: 调用 API 保存设置
}

/**
 * 切换两步验证
 */
function toggleTwoFactor() {
  settings.twoFactorEnabled = !settings.twoFactorEnabled
  saveSettings()
}

/**
 * 修改密码
 */
function changePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showError('两次输入的密码不一致')
    return
  }
  console.log('修改密码:', passwordForm)
  showPasswordModal.value = false
  // TODO: 调用 API 修改密码
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// ==================== 页面容器 ====================
.settings-page {
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
.settings-container {
  max-width: 900px;
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

    &:hover {
      background: #374151;
      transform: translateY(-2px);
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

  &.btn-outline {
    background: transparent;
    color: #6b7280;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;

    &:hover {
      border-color: #000;
      color: #000;
    }
  }
}

// ==================== 标签页区域 ====================
.tabs-wrapper {
  animation-delay: 0.1s;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  gap: 8px;
  padding: 24px 32px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  .tab-btn {
    padding: 12px 20px;
    background: transparent;
    border: none;
    font-size: 15px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    border-radius: 12px 12px 0 0;
    transition: all 0.3s $ease-out-expo;
    position: relative;

    &:hover {
      color: #1f2937;
      background: rgba(0, 0, 0, 0.03);
    }

    &.active {
      color: #000;
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: #000;
      }
    }
  }
}

.tabs-content {
  padding: 24px 32px 32px;
}

.tab-pane {
  animation: fadeIn 0.3s $ease-out-expo;
}

// ==================== 设置列表 ====================
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  transition: all 0.3s $ease-out-expo;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .item-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 12px;
    flex-shrink: 0;

    .icon {
      width: 24px;
      height: 24px;
      color: #6b7280;
    }
  }

  .item-content {
    flex: 1;
    min-width: 0;

    .item-title {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .item-desc {
      font-size: 13px;
      color: #6b7280;
    }
  }
}

// ==================== 开关样式 ====================
.toggle {
  position: relative;
  width: 48px;
  height: 26px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background: #000;
    }

    &:checked + .toggle-slider:before {
      transform: translateX(22px);
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
  background: #e5e7eb;
  border-radius: 26px;
  transition: 0.3s $ease-out-expo;

  &:before {
    content: '';
    position: absolute;
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background: #fff;
    border-radius: 50%;
    transition: 0.3s $ease-out-expo;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

// ==================== 下拉选择框 ====================
.form-select {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  cursor: pointer;
  transition: all 0.3s $ease-out-expo;

  &:focus {
    outline: none;
    border-color: #000;
  }
}

// ==================== 弹窗样式 ====================
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.2s $ease-out-expo;
}

.modal-content {
  width: 100%;
  max-width: 480px;
  margin: 24px;
  animation: slideUp 0.3s $ease-out-expo;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
  margin-bottom: 24px;

  .modal-title {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .modal-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.3s $ease-out-expo;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #111827;
    }

    .icon {
      width: 20px;
      height: 20px;
    }
  }
}

.modal-body {
  padding: 0 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  margin-top: 24px;
}

// ==================== 表单样式 ====================
.form-group {
  margin-bottom: 20px;

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
}

.form-input {
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
    border-color: #000;
  }
}

// ==================== 响应式适配 ====================
@media (max-width: 768px) {
  .settings-page {
    padding: 72px 16px 32px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .tabs-header {
    padding: 16px 20px 0;
    overflow-x: auto;

    .tab-btn {
      white-space: nowrap;
    }
  }

  .tabs-content {
    padding: 20px;
  }

  .setting-item {
    flex-wrap: wrap;
    gap: 12px;

    .item-content {
      width: 100%;
    }
  }
}
</style>
