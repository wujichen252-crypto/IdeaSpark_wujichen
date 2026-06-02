<template>
  <div class="login-page">
    <!-- 返回首页 Logo -->
    <div class="back-home" @click="router.push('/')">
      <img src="@/assets/logo-ideaspark.svg" alt="IdeaSpark" />
    </div>

    <!-- 高级感背景层 -->
    <div class="luxury-bg">
      <div class="bg-image"></div>
      <div class="bg-overlay"></div>
      <div class="bg-gradient"></div>
    </div>

    <!-- ========== 桌面端：双面板滑动卡片 ========== -->
    <div class="auth-card desktop-card" :class="{ 'right-panel-active': isSignUp }">
      <!-- 注册面板 -->
      <div class="form-panel sign-up-panel">
        <div class="panel-content">
          <h1>创建账号</h1>
          <div class="social-container">
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button
circle
size="large"
class="social-btn"
disabled>
                  <template #icon><n-icon><GoogleIcon /></n-icon></template>
                </n-button>
              </template>
              即将上线
            </n-tooltip>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button
circle
size="large"
class="social-btn"
disabled>
                  <template #icon><n-icon><GithubIcon /></n-icon></template>
                </n-button>
              </template>
              即将上线
            </n-tooltip>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button
circle
size="large"
class="social-btn"
disabled>
                  <template #icon><n-icon><LinkedinIcon /></n-icon></template>
                </n-button>
              </template>
              即将上线
            </n-tooltip>
          </div>
          <span class="divider-text">或使用邮箱注册</span>

          <div class="input-group">
            <div class="custom-input-wrapper">
              <input
v-model="signUpModel.username"
type="text"
placeholder="用户名"
class="custom-input"/>
              <span class="input-border"></span>
            </div>
            <div class="custom-input-wrapper">
              <input
v-model="signUpModel.email"
type="email"
placeholder="邮箱"
class="custom-input"/>
              <span class="input-border"></span>
            </div>
            <div class="custom-input-wrapper">
              <input
v-model="signUpModel.password"
type="password"
placeholder="密码"
class="custom-input"/>
              <span class="input-border"></span>
            </div>
          </div>

          <n-button
class="action-btn"
color="#111111"
text-color="#fff"
:loading="loading"
@click="handleRegister">
注册
</n-button>
        </div>
      </div>

      <!-- 登录面板 -->
      <div class="form-panel sign-in-panel">
        <div class="panel-content">
          <h1>登录</h1>
          <div class="social-container">
            <n-tooltip v-for="(icon, idx) in socialIcons" :key="idx" trigger="hover">
              <template #trigger>
                <n-button
circle
size="large"
class="social-btn"
disabled>
                  <template #icon><n-icon><component :is="icon" /></n-icon></template>
                </n-button>
              </template>
              即将上线
            </n-tooltip>
          </div>
          <span class="divider-text">或使用您的账号</span>

          <div class="input-group">
            <div class="custom-input-wrapper">
              <input
v-model="signInModel.email"
type="email"
placeholder="邮箱"
class="custom-input"/>
              <span class="input-border"></span>
            </div>
            <div class="custom-input-wrapper">
              <input
v-model="signInModel.password"
type="password"
placeholder="密码"
class="custom-input"/>
              <span class="input-border"></span>
            </div>
          </div>

          <a class="forgot-link" @click.prevent="$router.push('/forgot-password')">忘记密码?</a>

          <n-button
class="action-btn"
color="#111111"
text-color="#fff"
:loading="loading"
@click="handleLogin">
登录
</n-button>
        </div>
      </div>

      <!-- 覆盖层 -->
      <div class="overlay-container">
        <div class="overlay">
          <div class="overlay-panel overlay-left">
            <h1>欢迎回来!</h1>
            <p>保持联系，请使用您的个人信息登录，继续您的创意之旅。</p>
            <n-button
class="ghost-btn"
color="#111111"
text-color="#fff"
@click="isSignUp = false">
登录
</n-button>
          </div>
          <div class="overlay-panel overlay-right">
            <h1>你好，朋友!</h1>
            <p>输入您的个人信息，开始与 IdeaSpark 一起的创造旅程。</p>
            <n-button
class="ghost-btn"
color="#111111"
text-color="#fff"
@click="isSignUp = true">
注册
</n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 移动端：单卡片切换 ========== -->
    <div class="auth-card mobile-card">
      <div class="mobile-header">
        <h1>{{ isSignUp ? '创建账号' : '欢迎回来' }}</h1>
        <p>{{ isSignUp ? '输入您的个人信息，开启创意之旅' : '请使用您的账号登录，继续创作' }}</p>
      </div>

      <div class="mobile-form">
        <!-- 社交登录 -->
        <div class="social-container">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button
circle
size="large"
class="social-btn"
disabled>
                <template #icon><n-icon><GoogleIcon /></n-icon></template>
              </n-button>
            </template>
            即将上线
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button
circle
size="large"
class="social-btn"
disabled>
                <template #icon><n-icon><GithubIcon /></n-icon></template>
              </n-button>
            </template>
            即将上线
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button
circle
size="large"
class="social-btn"
disabled>
                <template #icon><n-icon><LinkedinIcon /></n-icon></template>
              </n-button>
            </template>
            即将上线
          </n-tooltip>
        </div>
        <span class="divider-text">{{ isSignUp ? '或使用邮箱注册' : '或使用您的账号' }}</span>

        <!-- 注册 -->
        <template v-if="isSignUp">
          <div class="input-group">
            <n-input v-model:value="signUpModel.username" placeholder="用户名" size="large" />
            <n-input v-model:value="signUpModel.email" placeholder="邮箱" size="large" />
            <n-input
              v-model:value="signUpModel.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password-on="mousedown"
            />
          </div>
          <n-button
class="action-btn"
color="#111111"
text-color="#fff"
block
:loading="loading"
@click="handleRegister">
注册
</n-button>
        </template>

        <!-- 登录 -->
        <template v-else>
          <div class="input-group">
            <n-input v-model:value="signInModel.email" placeholder="邮箱" size="large" />
            <n-input
              v-model:value="signInModel.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password-on="mousedown"
            />
          </div>
          <a class="forgot-link" @click.prevent="$router.push('/forgot-password')">忘记密码?</a>
          <n-button
class="action-btn"
color="#111111"
text-color="#fff"
block
:loading="loading"
@click="handleLogin">
登录
</n-button>
        </template>
      </div>

      <div class="mobile-footer">
        <span>{{ isSignUp ? '已有账号？' : '还没有账号？' }}</span>
        <a class="mobile-toggle-link" @click="isSignUp = !isSignUp">{{ isSignUp ? '去登录' : '去注册' }}</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/store'
import { LogoGoogle, LogoGithub, LogoLinkedin } from '@vicons/ionicons5'
import { login as apiLogin, register as apiRegister } from '@/api/user'

const GoogleIcon = LogoGoogle
const GithubIcon = LogoGithub
const LinkedinIcon = LogoLinkedin

// 社交图标数组，用于桌面端登录面板的循环渲染
const socialIcons = [LogoGoogle, LogoGithub, LogoLinkedin]

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const isSignUp = ref(false)
const loading = ref(false)

// 登录表单数据模型
interface SignInModel {
  email: string
  password: string
}

// 注册表单数据模型
interface SignUpModel {
  username: string
  email: string
  password: string
}

const signInModel = reactive<SignInModel>({ email: '', password: '' })
const signUpModel = reactive<SignUpModel>({ username: '', email: '', password: '' })

/**
 * 执行登录流程
 */
async function handleLogin(): Promise<void> {
  if (!signInModel.email || !signInModel.password) {
    message.warning('请填写完整信息')
    return
  }

  loading.value = true
  try {
    const res = await apiLogin({ email: signInModel.email, password: signInModel.password })
    const responseData = res.data.data
    const authToken = responseData.token
    const refreshToken = responseData.refreshToken
    const user = responseData.user || responseData.userInfo

    if (!authToken || !refreshToken || !user) {
      message.error('登录响应数据格式错误')
      return
    }

    userStore.login(
      {
        id: String(user.id),
        username: user.username,
        email: user.email,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        role: user.role || '用户',
        stats: { likes: 0, followers: 0, following: 0 }
      },
      authToken,
      refreshToken
    )
    message.success('登录成功')
    await router.replace('/dashboard')
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 执行注册流程
 */
async function handleRegister(): Promise<void> {
  if (!signUpModel.username || !signUpModel.email || !signUpModel.password) {
    message.warning('请填写完整信息')
    return
  }

  loading.value = true
  try {
    await apiRegister({
      username: signUpModel.username,
      email: signUpModel.email,
      password: signUpModel.password
    })
    message.success('注册成功，请登录')
    signInModel.email = signUpModel.email
    signInModel.password = signUpModel.password
    isSignUp.value = false
  } catch {
    // 错误已由 request 拦截器统一提示
  } finally {
    loading.value = false
  }
}

/**
 * 复制文本到剪贴板
 * @param text - 要复制的文本
 */
async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    message.success('已复制到剪贴板')
  }
}

</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap');

$text-primary: #0f172a;
$text-secondary: #475569;
$border-color: #e5e7eb;
$overlay-bg: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%);

.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  padding: 20px;
  font-family: 'Inter', 'HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  position: relative;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

.back-home {
  position: fixed;
  top: 15px;
  left: 40px;
  z-index: 100;
  cursor: pointer;
  opacity: 1;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }

  img {
    height: 55px;
    display: block;
    filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.25));
  }
}

@media (max-width: 768px) {
  .back-home {
    top: 20px;
    left: 20px;

    img {
      height: 90px;
    }
  }
}

/* 高级感背景 */
.luxury-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

/* 背景图片层 - 使用 Unsplash 高质量抽象艺术图 */
.bg-image {
  position: absolute;
  inset: 0;
  background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transform: scale(1.1);
  animation: subtleZoom 20s infinite alternate ease-in-out;
}

/* 深色遮罩层 - 增强文字可读性 */
.bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.75) 0%,
    rgba(30, 41, 59, 0.65) 50%,
    rgba(15, 23, 42, 0.8) 100%
  );
  backdrop-filter: blur(2px);
}

/* 渐变光效层 - 增加高级感 */
.bg-gradient {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
  animation: gradientShift 15s infinite alternate ease-in-out;
}

@keyframes subtleZoom {
  0% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1.2);
  }
}

@keyframes gradientShift {
  0% {
    opacity: 0.8;
  }
  100% {
    opacity: 1;
  }
}

/* ========== 测试账号卡片样式 ========== */
.test-account-card {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  min-width: 240px;
  animation: slideInRight 0.5s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.test-account-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.test-account-icon {
  font-size: 18px;
}

.test-account-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
}

.test-account-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.test-account-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.test-account-label {
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}

.test-account-value {
  color: #1e293b;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  background: rgba(99, 102, 241, 0.08);
  padding: 4px 8px;
  border-radius: 6px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.copy-btn:hover {
  background: #6366f1;
  color: #fff;
  transform: scale(1.05);
}

.copy-btn:active {
  transform: scale(0.95);
}

.test-account-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.auto-fill-btn {
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.auto-fill-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.auto-fill-btn:active {
  transform: translateY(0);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .test-account-card {
    top: auto;
    bottom: 20px;
    right: 20px;
    left: 20px;
    min-width: auto;
    animation: slideInUp 0.5s ease-out;
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

/* ========== 公共元素样式 ========== */
h1 {
  font-weight: 800;
  margin: 0 0 12px;
  font-size: 2rem;
  letter-spacing: 0.04em;
  line-height: 1.2;
  color: $text-primary;
}

p {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.7;
  margin: 0 0 24px;
  color: $text-secondary;
}

.divider-text {
  display: block;
  font-size: 12px;
  margin: 16px 0;
  letter-spacing: 0.06em;
  color: $text-secondary;
}

.social-container {
  margin: 8px 0;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.social-btn {
  border: 1px solid $border-color;
  background: #fff;
  color: $text-secondary;

  &:hover:not(:disabled) {
    background: #f2f6ff;
    border-color: rgba(74, 108, 247, 0.3);
    color: $text-primary;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.input-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.custom-input-wrapper {
  position: relative;
  width: 100%;

  .custom-input {
    width: 100%;
    border: none;
    border-bottom: 1px solid $border-color;
    padding: 12px 4px;
    background: transparent;
    color: $text-primary;
    outline: none;
    transition: border-color 0.3s;
    font-size: 14px;

    &::placeholder {
      color: rgba(71, 85, 105, 0.5);
    }

    &:focus {
      border-bottom-color: transparent;
    }
  }

  .input-border {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: #000;
    transition: width 0.4s ease;
  }

  .custom-input:focus + .input-border {
    width: 100%;
  }
}

.forgot-link {
  display: block;
  color: $text-secondary;
  font-size: 13px;
  text-decoration: none;
  margin: 16px 0 8px;
  text-align: right;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #111111;
  }
}

.action-btn {
  --btn-color: #111111;
  --btn-hover: #000000;

  border-radius: 14px;
  border: 1px solid var(--btn-color);
  background-color: var(--btn-color);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 45px;
  letter-spacing: 0.5px;
  transition:
    transform 80ms ease-in,
    background 0.3s,
    box-shadow 0.3s,
    border-color 0.3s;
  margin-top: 20px;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
  }

  &:hover {
    background-color: var(--btn-hover);
    border-color: var(--btn-hover);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.12);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--btn-color);
    border-color: var(--btn-color);
  }
}

.ghost-btn {
  @extend .action-btn;
  background-color: transparent;
  border-color: #fff;
  color: #fff;

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    box-shadow: none;
    color: #fff;
  }
}

/* ========== 桌面端双面板卡片 ========== */
.desktop-card {
  display: none;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  position: relative;
  overflow: hidden;
  width: clamp(760px, 58vw, 1000px);
  min-height: 520px;
  max-height: 640px;
  z-index: 10;
  backdrop-filter: blur(20px);
}

@media (min-width: 769px) {
  .desktop-card {
    display: block;
  }
}

.form-panel {
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.6s ease-in-out;
}

.panel-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 clamp(28px, 3.5vw, 56px);
  height: 100%;
  text-align: center;
}

.sign-in-panel {
  left: 0;
  width: 50%;
  z-index: 2;
  opacity: 1;
}

.desktop-card.right-panel-active .sign-in-panel {
  transform: translateX(100%);
  opacity: 0;
}

.sign-up-panel {
  left: 0;
  width: 50%;
  opacity: 0;
  z-index: 1;
}

.desktop-card.right-panel-active .sign-up-panel {
  transform: translateX(100%);
  opacity: 1;
  z-index: 5;
  animation: show 0.6s;
}

@keyframes show {
  0%,
  49.99% {
    opacity: 0;
    z-index: 1;
  }
  50%,
  100% {
    opacity: 1;
    z-index: 5;
  }
}

.overlay-container {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: transform 0.6s ease-in-out;
  z-index: 100;
}

.desktop-card.right-panel-active .overlay-container {
  transform: translateX(-100%);
}

.overlay {
  background: $overlay-bg;
  color: #fff;
  position: relative;
  left: -100%;
  height: 100%;
  width: 200%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
  background-size: 200% 200%;
  animation: gradientMove 8s ease infinite;
}

@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.desktop-card.right-panel-active .overlay {
  transform: translateX(50%);
}

.overlay-panel {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 clamp(28px, 3.5vw, 56px);
  text-align: center;
  top: 0;
  height: 100%;
  width: 50%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;

  h1 {
    color: #fff;
  }

  p {
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 30px;
  }
}

.overlay-left {
  transform: translateX(-20%);
}

.desktop-card.right-panel-active .overlay-left {
  transform: translateX(0);
}

.overlay-right {
  right: 0;
  transform: translateX(0);
}

.desktop-card.right-panel-active .overlay-right {
  transform: translateX(20%);
}

/* 覆盖 Naive UI 默认的绿色 focus / hover 光晕与文字颜色 */
:deep(.n-button) {
  &:not(.n-button--disabled):focus,
  &:not(.n-button--disabled):focus-visible {
    outline: none;
    box-shadow: none !important;
  }

  &::before,
  &::after {
    display: none !important;
  }
}

/* action-btn：强制白字，hover/focus/pressed 都不变绿 */
:deep(.n-button.action-btn) {
  color: #fff !important;

  &:hover,
  &:focus,
  &:active {
    color: #fff !important;
  }

  .n-button__content {
    color: #fff !important;
  }

  &:not(.n-button--disabled):focus,
  &:not(.n-button--disabled):focus-visible {
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1) !important;
  }
}

/* ghost-btn：强制白字 */
:deep(.n-button.ghost-btn) {
  color: #fff !important;

  &:hover,
  &:focus,
  &:active {
    color: #fff !important;
  }

  .n-button__content {
    color: #fff !important;
  }

  &:not(.n-button--disabled):focus,
  &:not(.n-button--disabled):focus-visible {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2) !important;
  }
}

/* ========== 移动端单卡片 ========== */
.mobile-card {
  display: none;
}

@media (max-width: 768px) {
  .mobile-card {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 420px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24px;
    padding: 32px 24px;
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    z-index: 10;
    backdrop-filter: blur(20px);
  }

  .mobile-header {
    text-align: center;
    margin-bottom: 8px;

    h1 {
      font-size: 1.6rem;
      margin-bottom: 6px;
    }

    p {
      margin-bottom: 0;
      font-size: 13px;
    }
  }

  .mobile-form {
    display: flex;
    flex-direction: column;

    .social-container {
      margin-bottom: 4px;
    }

    .action-btn {
      width: 100%;
      margin-top: 16px;
    }
  }

  .mobile-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 13px;
    color: $text-secondary;

    span {
      margin-right: 4px;
    }
  }

  .mobile-toggle-link {
    color: #111111;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>

<style>
/* 强制覆盖 Naive UI 按钮 hover 时的绿色文字 */
.login-page .n-button.action-btn,
.login-page .n-button.action-btn:hover,
.login-page .n-button.action-btn:focus,
.login-page .n-button.action-btn:active {
  color: #fff !important;
}

.login-page .n-button.action-btn .n-button__content,
.login-page .n-button.action-btn:hover .n-button__content,
.login-page .n-button.action-btn:focus .n-button__content,
.login-page .n-button.action-btn:active .n-button__content {
  color: #fff !important;
}

.login-page .n-button.ghost-btn,
.login-page .n-button.ghost-btn:hover,
.login-page .n-button.ghost-btn:focus,
.login-page .n-button.ghost-btn:active {
  color: #fff !important;
}

.login-page .n-button.ghost-btn .n-button__content,
.login-page .n-button.ghost-btn:hover .n-button__content,
.login-page .n-button.ghost-btn:focus .n-button__content,
.login-page .n-button.ghost-btn:active .n-button__content {
  color: #fff !important;
}
</style>
