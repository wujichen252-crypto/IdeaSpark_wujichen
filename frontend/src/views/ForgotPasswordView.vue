<template>
  <div class="forgot-password-page">
    <!-- 动态背景层 -->
    <div class="aurora-bg">
      <div class="aurora-blob blob-1"></div>
      <div class="aurora-blob blob-2"></div>
      <div class="aurora-blob blob-3"></div>
    </div>

    <!-- 主容器 -->
    <div class="container">
      <div class="form-content">
        <h1>找回密码</h1>
        <p class="description">请输入您的注册邮箱，我们将向您发送重置密码的链接。</p>

        <div class="input-group">
          <div class="custom-input-wrapper">
            <input
v-model="email"
type="email"
placeholder="邮箱"
class="custom-input" />
            <span class="input-border"></span>
          </div>
        </div>

        <button class="action-btn" :disabled="loading" @click="handleResetPassword">
          <span v-if="!loading">发送重置链接</span>
          <span v-else class="loader"></span>
        </button>

        <div class="back-link" @click="$router.push('/login')">返回登录</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { forgotPassword } from '@/api/user'

const router = useRouter()
const message = useMessage()

const email = ref('')
const loading = ref(false)

/**
 * 处理重置密码请求
 * @description 校验邮箱并调用后端接口发送重置链接
 */
async function handleResetPassword(): Promise<void> {
  if (!email.value) {
    message.warning('请输入邮箱')
    return
  }

  // 简单的邮箱格式校验
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    message.warning('请输入有效的邮箱地址')
    return
  }

  loading.value = true
  try {
    const res = await forgotPassword(email.value)
    if (res.data.status === 200) {
      message.success('重置链接已发送至您的邮箱，请查收')
      // 发送成功后跳转到登录页
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      message.error(res.data.message || '发送失败，请稍后重试')
    }
  } catch (error: any) {
    console.error('发送重置邮件失败:', error)
    message.error(error.response?.data?.message || '发送失败，请检查网络连接')
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

.forgot-password-page {
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
.forgot-password-page::before {
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
  min-height: 400px;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-content {
  background: $bg-surface;
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 40px;
  width: 100%;
  text-align: center;
  color: $text-color;
}

h1 {
  font-weight: 800;
  margin: 0 0 12px 0;
  font-size: 1.8rem;
  letter-spacing: 0.06em;
  color: $text-color;
}

.description {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  margin: 0 0 30px;
  color: $text-secondary;
}

.input-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
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

.back-link {
  margin-top: 20px;
  font-size: 14px;
  color: $text-secondary;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: #4f46e5;
    text-decoration: underline;
  }
}

.loader {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
