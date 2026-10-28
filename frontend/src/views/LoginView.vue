<template>
  <div class="auth-page">
    <!-- 左栏：品牌陈述（桌面）／紧凑页头（移动） -->
    <section class="auth-brand">
      <RouterLink to="/" class="brand-mark" aria-label="返回 IdeaSpark 首页">
        <img :src="logoIcon" alt="" class="brand-mark__icon" width="28" height="28" />
        <span class="brand-mark__word">IDEASPARK</span>
      </RouterLink>

      <div class="brand-body">
        <p class="brand-eyebrow">创意孵化平台</p>
        <h1 class="brand-headline">从灵感到落地，<br />只需一句话。</h1>

        <ol class="brand-steps">
          <li v-for="step in STEPS" :key="step.no" class="brand-step">
            <span class="brand-step__no">{{ step.no }}</span>
            <span class="brand-step__title">{{ step.title }}</span>
            <span class="brand-step__desc">{{ step.desc }}</span>
          </li>
        </ol>
      </div>

      <p class="brand-foot">© 2026 IdeaSpark</p>
    </section>

    <!-- 右栏：登录 / 注册共用同一套表单视图 -->
    <section class="auth-form" aria-labelledby="auth-title">
      <div class="auth-form__inner">
        <div class="mode-switch" role="group" aria-label="切换登录或注册">
          <button
            type="button"
            class="mode-switch__btn"
            :aria-pressed="!isSignUp"
            :disabled="loading"
            @click="setMode(false)">
            登录
          </button>
          <button
            type="button"
            class="mode-switch__btn"
            :aria-pressed="isSignUp"
            :disabled="loading"
            @click="setMode(true)">
            注册
          </button>
        </div>

        <header class="form-head">
          <h2 id="auth-title" class="form-head__title">{{ modeCopy.title }}</h2>
          <p class="form-head__desc">{{ modeCopy.desc }}</p>
        </header>

        <form class="form" novalidate @submit.prevent="handleSubmit">
          <!-- 注册专有：用户名 -->
          <div v-if="isSignUp" class="field" :class="{ 'field--invalid': errors.username }">
            <label class="field__label" for="signup-username">用户名</label>
            <div class="field__control">
              <input
                id="signup-username"
                v-model="signUpModel.username"
                class="field__input"
                type="text"
                autocomplete="username"
                placeholder="用于展示的名字"
                :disabled="loading"
                :aria-invalid="Boolean(errors.username)"
                :aria-describedby="errors.username ? 'signup-username-error' : undefined"
                @input="clearError('username')" />
            </div>
            <p v-if="errors.username" id="signup-username-error" class="field__error" role="alert">
              {{ errors.username }}
            </p>
          </div>

          <!-- 邮箱 -->
          <div class="field" :class="{ 'field--invalid': errors.email }">
            <label class="field__label" :for="isSignUp ? 'signup-email' : 'login-email'">邮箱</label>
            <div class="field__control">
              <input
                :id="isSignUp ? 'signup-email' : 'login-email'"
                v-model="emailModel"
                class="field__input"
                type="email"
                autocomplete="email"
                placeholder="name@example.com"
                :disabled="loading"
                :aria-invalid="Boolean(errors.email)"
                :aria-describedby="errors.email ? 'auth-email-error' : undefined"
                @input="clearError('email')" />
            </div>
            <p v-if="errors.email" id="auth-email-error" class="field__error" role="alert">
              {{ errors.email }}
            </p>
          </div>

          <!-- 密码 -->
          <div class="field" :class="{ 'field--invalid': errors.password }">
            <label class="field__label" :for="isSignUp ? 'signup-password' : 'login-password'">密码</label>
            <div class="field__control">
              <input
                :id="isSignUp ? 'signup-password' : 'login-password'"
                v-model="passwordModel"
                class="field__input field__input--with-action"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="isSignUp ? 'new-password' : 'current-password'"
                placeholder="输入密码"
                :disabled="loading"
                :aria-invalid="Boolean(errors.password)"
                :aria-describedby="errors.password ? 'auth-password-error' : undefined"
                @input="clearError('password')" />
              <button
                type="button"
                class="field__action"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword">
                {{ showPassword ? '隐藏' : '显示' }}
              </button>
            </div>
            <p v-if="errors.password" id="auth-password-error" class="field__error" role="alert">
              {{ errors.password }}
            </p>
          </div>

          <div v-if="!isSignUp" class="form-aside">
            <button type="button" class="link-btn" @click="router.push('/forgot-password')">
              忘记密码？
            </button>
          </div>

          <button type="submit" class="submit" :disabled="loading" :aria-busy="loading">
            {{ loading ? '处理中…' : modeCopy.submit }}
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/store'
import { login as apiLogin, register as apiRegister } from '@/api/user'
import logoIcon from '@/assets/logo-icon.svg'

interface SignInModel {
  email: string
  password: string
}

interface SignUpModel {
  username: string
  email: string
  password: string
}

/** 品牌陈述的编号条目：与首页「产品理念」同源，保持页面间叙事一致 */
const STEPS = [
  { no: '01', title: '捕捉灵感', desc: '把碎片化想法快速沉淀为可执行方向。' },
  { no: '02', title: '拆解需求', desc: '补全用户、场景、痛点与价值主张。' },
  { no: '03', title: '交付成果', desc: '产出 PRD、原型与可执行计划。' }
] as const

/** 邮箱格式预检：仅拦截明显无效输入，最终以服务端校验为准 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const isSignUp = ref(false)
const loading = ref(false)
const showPassword = ref(false)

const signInModel = reactive<SignInModel>({ email: '', password: '' })
const signUpModel = reactive<SignUpModel>({ username: '', email: '', password: '' })

/** 字段级校验信息：空串表示通过 */
const errors = reactive<Record<'username' | 'email' | 'password', string>>({
  username: '',
  email: '',
  password: ''
})

/**
 * 邮箱双向绑定：登录与注册各有一份数据模型，视图只绑定一份
 * @description 避免登录 / 注册两套表单标记重复，切换模式时字段值各自保留。
 */
const emailModel = computed({
  get: (): string => (isSignUp.value ? signUpModel.email : signInModel.email),
  set: (value: string) => {
    if (isSignUp.value) signUpModel.email = value
    else signInModel.email = value
  }
})

/** 密码双向绑定：同上，登录/注册共用同一输入控件 */
const passwordModel = computed({
  get: (): string => (isSignUp.value ? signUpModel.password : signInModel.password),
  set: (value: string) => {
    if (isSignUp.value) signUpModel.password = value
    else signInModel.password = value
  }
})

/** 当前模式下的标题文案 */
const modeCopy = computed(() =>
  isSignUp.value
    ? { title: '创建账号', desc: '填写基础信息，立即开始你的第一个项目。', submit: '创建账号' }
    : { title: '登录', desc: '使用注册邮箱进入你的工作台。', submit: '登录' }
)

/**
 * 清空单个字段的错误提示
 * @param field - 字段名
 */
function clearError(field: keyof typeof errors): void {
  errors[field] = ''
}

/**
 * 切换登录 / 注册模式
 * @param next - true 表示注册模式
 */
function setMode(next: boolean): void {
  if (isSignUp.value === next || loading.value) return
  isSignUp.value = next
  showPassword.value = false
  errors.username = ''
  errors.email = ''
  errors.password = ''
}

/**
 * 校验当前表单
 * @returns 全部字段通过时返回 true
 */
function validate(): boolean {
  const email = emailModel.value.trim()
  const password = passwordModel.value

  errors.username = ''
  errors.email = ''
  errors.password = ''

  if (isSignUp.value && !signUpModel.username.trim()) {
    errors.username = '请输入用户名'
  }
  if (!email) {
    errors.email = '请输入邮箱'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = '邮箱格式不正确，请检查后重试'
  }
  if (!password) {
    errors.password = '请输入密码'
  }

  return !errors.username && !errors.email && !errors.password
}

/**
 * 提交表单：按当前模式分发到登录或注册
 */
async function handleSubmit(): Promise<void> {
  if (loading.value || !validate()) return
  if (isSignUp.value) await handleRegister()
  else await handleLogin()
}

/**
 * 执行登录流程
 */
async function handleLogin(): Promise<void> {
  loading.value = true
  try {
    const res = await apiLogin({ email: signInModel.email.trim(), password: signInModel.password })
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
        // 不得在此伪造头像：真实头像为空时必须保持空，
        // 否则会把「临时兜底图」当成用户真实头像持久化，
        // 导致社区等直接读后端 avatar 的页面显示成另一张脸。
        avatar: user.avatar || '',
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
 * @description 注册成功后带回邮箱与密码，直接切到登录模式减少一次输入
 */
async function handleRegister(): Promise<void> {
  loading.value = true
  try {
    await apiRegister({
      username: signUpModel.username.trim(),
      email: signUpModel.email.trim(),
      password: signUpModel.password
    })
    message.success('注册成功，请登录')
    signInModel.email = signUpModel.email.trim()
    signInModel.password = signUpModel.password
    setMode(false)
  } catch {
    // 错误已由 request 拦截器统一提示
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
/* 认证页：编辑式双栏。左栏承载品牌叙事（浅底），右栏承载单一任务（白底），
   两者只靠底色深浅分区，不使用描边、卡片、渐变球或外部背景图。 */
.auth-page {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  min-height: 100dvh;
  background: var(--nexus-bg-elevated);
  color: var(--nexus-text-primary);
  font-family: var(--nexus-font-ui);
  -webkit-font-smoothing: antialiased;
}

/* ── 左栏 ── */
.auth-brand {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--nexus-space-12);
  padding: clamp(32px, 4vw, 56px) clamp(32px, 5vw, 72px);
  /* 深一档的底色代替竖向分隔线 */
  background: var(--nexus-bg-sunken);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: var(--nexus-space-3);
  width: fit-content;
  color: var(--nexus-text-primary);
  text-decoration: none;
}

.brand-mark__icon {
  display: block;
  width: 28px;
  height: 28px;
  border-radius: var(--nexus-radius-sm);
}

.brand-mark__word {
  font-size: var(--nexus-font-size-base);
  font-weight: 600;
  letter-spacing: 0.18em;
  transition: color var(--nexus-duration-fast) var(--nexus-ease);
}

.brand-mark:hover .brand-mark__word {
  color: var(--nexus-text-secondary);
}

.brand-body {
  display: flex;
  flex-direction: column;
  gap: var(--nexus-space-8);
  max-width: 520px;
}

.brand-eyebrow {
  margin: 0;
  font-size: var(--nexus-font-size-xs);
  letter-spacing: 0.2em;
  color: var(--nexus-text-tertiary);
}

.brand-headline {
  margin: 0;
  font-size: clamp(32px, 3.4vw, 40px);
  font-weight: 600;
  line-height: var(--nexus-leading-display);
  letter-spacing: -0.02em;
}

.brand-steps {
  max-width: 440px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.brand-step {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  column-gap: var(--nexus-space-4);
  row-gap: 2px;
  padding: var(--nexus-space-4) 0;
}

.brand-step__no {
  font-size: var(--nexus-font-size-xs);
  line-height: var(--nexus-leading-compact);
  font-variant-numeric: tabular-nums;
  color: var(--nexus-text-tertiary);
}

.brand-step__title {
  font-size: var(--nexus-font-size-base);
  font-weight: 500;
  line-height: var(--nexus-leading-compact);
}

.brand-step__desc {
  grid-column: 2;
  font-size: var(--nexus-font-size-sm);
  line-height: var(--nexus-leading-normal);
  color: var(--nexus-text-tertiary);
}

.brand-foot {
  margin: 0;
  font-size: var(--nexus-font-size-xs);
  color: var(--nexus-text-tertiary);
}

/* ── 右栏 ── */
.auth-form {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(32px, 6vw, 64px) clamp(24px, 5vw, 64px);
  background: var(--nexus-bg-elevated);
}

.auth-form__inner {
  width: 100%;
  max-width: 368px;
}

.mode-switch {
  display: inline-flex;
  gap: 2px;
  margin-bottom: var(--nexus-space-8);
  padding: 3px;
  background: var(--nexus-bg-sunken);
  border-radius: var(--nexus-radius-md);
}

.mode-switch__btn {
  padding: 7px 20px;
  border: 0;
  border-radius: calc(var(--nexus-radius-md) - 3px);
  background: transparent;
  font-family: inherit;
  font-size: var(--nexus-font-size-sm);
  font-weight: 500;
  color: var(--nexus-text-tertiary);
  cursor: pointer;
  transition:
    color var(--nexus-duration-fast) var(--nexus-ease),
    background-color var(--nexus-duration-fast) var(--nexus-ease);
}

.mode-switch__btn:hover:not(:disabled) {
  color: var(--nexus-text-primary);
}

.mode-switch__btn[aria-pressed='true'] {
  background: var(--nexus-bg-elevated);
  color: var(--nexus-text-primary);
  box-shadow: var(--nexus-shadow-sm);
}

.mode-switch__btn:disabled {
  cursor: progress;
}

.form-head {
  margin-bottom: var(--nexus-space-6);
}

.form-head__title {
  margin: 0 0 6px;
  font-size: var(--nexus-font-size-xl);
  font-weight: 600;
  line-height: var(--nexus-leading-display);
  letter-spacing: -0.01em;
}

.form-head__desc {
  margin: 0;
  font-size: var(--nexus-font-size-sm);
  line-height: var(--nexus-leading-normal);
  color: var(--nexus-text-tertiary);
}

/* ── 字段 ── */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: var(--nexus-space-4);
}

.field__label {
  font-size: var(--nexus-font-size-xs);
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--nexus-text-secondary);
}

.field__control {
  position: relative;
}

/* 无边框输入：靠底色区分可编辑区域，焦点才显形（填充式而非描边式） */
.field__input {
  width: 100%;
  height: 44px;
  padding: 0 var(--nexus-space-4);
  border: 0;
  border-radius: var(--nexus-radius-md);
  background: var(--nexus-bg-sunken);
  font-family: inherit;
  font-size: var(--nexus-font-size-base);
  color: var(--nexus-text-primary);
  transition: background-color var(--nexus-duration-fast) var(--nexus-ease);
}

.field__input::placeholder {
  color: var(--nexus-text-quaternary);
}

.field__input:hover:not(:disabled) {
  background: var(--nexus-gray-200);
}

/* 焦点环绘制在填充区内侧（offset 为负），显示为焦点态而不是常驻边框 */
.field__input:focus-visible {
  background: var(--nexus-bg-elevated);
  outline: 2px solid var(--nexus-gray-500);
  outline-offset: -2px;
}

.field__input:disabled {
  background: var(--nexus-bg-subtle);
  color: var(--nexus-text-tertiary);
  cursor: not-allowed;
}

.field__input--with-action {
  padding-right: 56px;
}

/* 错误态：左侧细红条，不额外套一圈红框 */
.field--invalid .field__input {
  box-shadow: inset 2px 0 0 var(--nexus-error);
}

.field--invalid .field__input:focus-visible {
  outline-color: var(--nexus-error);
}

.field__action {
  position: absolute;
  top: 50%;
  right: 6px;
  height: 30px;
  padding: 0 var(--nexus-space-2);
  transform: translateY(-50%);
  border: 0;
  border-radius: var(--nexus-radius-sm);
  background: transparent;
  font-family: inherit;
  font-size: var(--nexus-font-size-xs);
  color: var(--nexus-text-tertiary);
  cursor: pointer;
  transition: color var(--nexus-duration-fast) var(--nexus-ease);
}

.field__action:hover {
  color: var(--nexus-text-primary);
}

.field__error {
  margin: 2px 0 0;
  font-size: var(--nexus-font-size-xs);
  line-height: var(--nexus-leading-compact);
  color: var(--nexus-error-text);
}

.form-aside {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--nexus-space-2);
}

.link-btn {
  padding: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: var(--nexus-font-size-xs);
  color: var(--nexus-text-tertiary);
  cursor: pointer;
  transition: color var(--nexus-duration-fast) var(--nexus-ease);
}

.link-btn:hover {
  color: var(--nexus-text-primary);
  text-decoration: underline;
}

/* ── 主操作 ── */
.submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  margin-top: var(--nexus-space-6);
  border: 0;
  border-radius: var(--nexus-radius-md);
  background: var(--nexus-accent);
  color: var(--nexus-text-inverse);
  font-family: inherit;
  font-size: var(--nexus-font-size-base);
  font-weight: 500;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background-color var(--nexus-duration-fast) var(--nexus-ease);
}

.submit:hover:not(:disabled) {
  background: var(--nexus-accent-hover);
}

.submit:disabled {
  opacity: 0.5;
  cursor: progress;
}

/* ── 响应式：低于 1024px 收成单列，品牌区退化为页头 ── */
@media (max-width: 1023px) {
  .auth-page {
    /* 单列时品牌区按内容高度、表单占满剩余高度，避免两行均分把页头撑高 */
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
  }

  .auth-brand {
    justify-content: flex-start;
    gap: var(--nexus-space-6);
    padding: var(--nexus-space-8) var(--nexus-space-6);
  }

  .brand-body {
    gap: var(--nexus-space-4);
  }

  .brand-headline {
    font-size: var(--nexus-font-size-xl);
  }

  .brand-steps,
  .brand-foot {
    display: none;
  }

  .auth-form {
    padding: var(--nexus-space-8) var(--nexus-space-6) var(--nexus-space-12);
  }

  .auth-form__inner {
    max-width: 420px;
    margin: 0 auto;
  }
}

/* 小屏只留品牌标记，把首屏高度让给表单 */
@media (max-width: 639px) {
  .brand-body {
    display: none;
  }

  .auth-brand {
    padding: var(--nexus-space-4) var(--nexus-space-5);
  }
}
</style>
