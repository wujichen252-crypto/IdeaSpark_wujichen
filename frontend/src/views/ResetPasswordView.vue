<template>
  <div class="reset-password-page">
    <!-- 动态背景层 -->
    <div class="aurora-bg">
      <div class="aurora-blob blob-1"></div>
      <div class="aurora-blob blob-2"></div>
      <div class="aurora-blob blob-3"></div>
    </div>

    <!-- 主容器 -->
    <div class="container">
      <div class="form-content">
        <h1>重置密码</h1>
        <p class="description">请设置您的新密码，建议使用强密码以保障账户安全。</p>

        <div class="input-group">
          <div class="custom-input-wrapper">
            <input
v-model="password"
type="password"
placeholder="新密码"
class="custom-input" />
            <span class="input-border"></span>
          </div>
          <div class="custom-input-wrapper">
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="确认新密码"
              class="custom-input"
            />
            <span class="input-border"></span>
          </div>
        </div>

        <button class="action-btn" :disabled="loading" @click="handleConfirmReset">
          <span v-if="!loading">确认修改</span>
          <span v-else class="loader"></span>
        </button>

        <div class="back-link" @click="$router.push('/login')">返回登录</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { validateResetToken, resetPassword } from '@/api/user'

const router = useRouter()
const route = useRoute()
const message = useMessage()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const token = ref('')
const isValidating = ref(true)

/**
 * 页面加载时验证令牌
 */
onMounted(async () => {
  const queryToken = route.query.token as string
  if (!queryToken) {
    message.error('重置链接无效，请重新申请')
    router.push('/forgot-password')
    return
  }

  token.value = queryToken

  try {
    const res = await validateResetToken(queryToken)
    if (res.data.status !== 200) {
      message.error(res.data.message || '重置链接无效或已过期')
      router.push('/forgot-password')
    }
  } catch (error: any) {
    console.error('验证令牌失败:', error)
    message.error(error.response?.data?.message || '重置链接无效或已过期')
    router.push('/forgot-password')
  } finally {
    isValidating.value = false
  }
})

/**
 * 处理确认重置密码
 * @description 校验两次密码是否一致，调用后端接口重置密码
 */
async function handleConfirmReset(): Promise<void> {
  if (!password.value || !confirmPassword.value) {
    message.warning('请输入新密码')
    return
  }

  if (password.value !== confirmPassword.value) {
    message.warning('两次输入的密码不一致')
    return
  }

  if (password.value.length < 6) {
    message.warning('密码长度至少需要6位')
    return
  }

  loading.value = true
  try {
    const res = await resetPassword(token.value, password.value)
    if (res.data.status === 200) {
      message.success('密码重置成功，请使用新密码登录')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      message.error(res.data.message || '重置失败，请稍后重试')
    }
  } catch (error: any) {
    console.error('重置密码失败:', error)
    message.error(error.response?.data?.message || '重置失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use 'sass:color';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap');

/* 全局变量 - 白色 + 浅蓝 + 黑色引导 */
$text-color: #0f172a;
$text-secondary: #475569;
$bg-root: #ffffff;
$bg-surface: #ffffff;
$bg-soft-blue: #f2f6ff;
$bg-soft-blue-2: #eef3ff;
$bg-soft-blue-3: #eaf0ff;
$action-primary: #3e5be6;
$action-hover: #4a6cf7;
$action-active: #3248c2;
$border-color: #e5e7eb;

/* 全局样式 */
* {
  box-sizing: border-box;
}

.reset-password-page {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 100dvh;
  padding-top: 0;
  background:
    radial-gradient(1200px circle at 20% -10%, rgba(62, 91, 230, 0.08), transparent 60%),
    radial-gradient(800px circle at 80% 110%, rgba(62, 91, 230, 0.06), transparent 60%),
    linear-gradient(180deg, #ffffff 0%, #f3f7ff 60%, #e4edff 100%);
  font-family:
    'Inter',
    'HarmonyOS Sans SC',
    'HarmonyOS Sans',
    'PingFang SC',
    'Microsoft YaHei',
    'Noto Sans SC',
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Arial,
    sans-serif;
  overflow: hidden;
  position: relative;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
}

/* 微噪点纹理覆盖层 */
.reset-password-page::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.06;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncA type='table' tableValues='0 0 0 0 0 0 0 0 0 0.08'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(%23noise)'/></svg>");
}

/* --- 动态流体背景（黑白版） --- */
.aurora-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  background: #ffffff;
}

.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.12;
  animation: float 10s infinite ease-in-out;
}

.blob-1 {
  top: -10%;
  left: -10%;
  width: 50vw;
  height: 50vw;
  background: #e5ecff;
  animation-delay: 0s;
}

.blob-2 {
  bottom: -10%;
  right: -10%;
  width: 60vw;
  height: 60vw;
  background: #dde7ff;
  animation-delay: -2s;
}

.blob-3 {
  top: 40%;
  left: 40%;
  width: 40vw;
  height: 40vw;
  background: radial-gradient(circle, #e7eeff 0%, #f3f7ff 100%);
  transform: translate(-50%, -50%);
  animation-delay: -4s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* --- 主容器 --- */
.container {
  background: $bg-surface;
  border-radius: 20px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
  position: relative;
  overflow: hidden;
  width: 400px;
  max-width: 90%;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 10;
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.form-content {
  padding: 0 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 100%;
  justify-content: center;
}

h1 {
  font-weight: 800;
  margin: 0 0 12px;
  color: $text-color;
  font-size: 28px;
  letter-spacing: -0.5px;
}

.description {
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 30px;
  line-height: 1.5;
}

.input-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.custom-input-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 5px;

  .custom-input {
    background-color: transparent;
    border: none;
    border-bottom: 1px solid $border-color;
    padding: 12px 5px;
    width: 100%;
    box-sizing: border-box;
    border-radius: 0;
    color: $text-color;
    outline: none;
    transition: all 0.3s;

    &::placeholder {
      color: rgba(71, 85, 105, 0.6);
    }

    &:focus {
      background-color: transparent;
      border-bottom-color: transparent;
      box-shadow: none;
    }
  }

  .input-border {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: #000000;
    transition: width 0.4s ease;
    display: block;
  }

  .custom-input:focus + .input-border {
    width: 100%;
  }
}

.action-btn {
  border-radius: 14px;
  border: 1px solid #111111;
  background-color: #111111;
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
  margin-top: 10px;
  cursor: pointer;
  width: 100%;

  &:active {
    transform: scale(0.98);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.12);
  }

  &:hover {
    background-color: #000000;
    border-color: #000000;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #111111;
    border-color: #111111;
  }
}

/* Loading Spinner */
.loader {
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.back-link {
  margin-top: 24px;
  font-size: 13px;
  color: $text-secondary;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.3s;
}

.back-link:hover {
  color: #111111;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .container {
    width: 100%;
    height: 100%;
    border-radius: 0;
    box-shadow: none;
  }

  .form-content {
    padding: 0 24px;
  }
}
</style>
