<template>
  <div class="compose">
    <div class="compose__head">
      <h1 class="compose__title">发布动态</h1>
      <p class="compose__desc">分享你的创意、灵感或遇到的问题。</p>
    </div>

    <div class="compose__body">
      <!-- 主编辑区：一张"纸"，用发丝线分段，不用卡片与阴影 -->
      <main class="compose__main">
        <!-- 标题 -->
        <section class="block">
          <div class="block__head">
            <label class="block__label" for="post-title">
              标题
              <span class="block__optional">可选</span>
            </label>
            <span class="block__meta" aria-live="polite">{{ title.length }} / {{ TITLE_MAX }}</span>
          </div>
          <input
            id="post-title"
            v-model="title"
            class="input-title"
            type="text"
            :maxlength="TITLE_MAX"
            placeholder="给你的动态起个标题"
            :disabled="submitting" />
        </section>

        <!-- 正文 -->
        <section class="block">
          <div class="block__head">
            <label class="block__label" for="post-content">正文</label>
            <span class="block__meta" aria-live="polite">{{ content.length }} / {{ CONTENT_MAX }}</span>
          </div>
          <textarea
            id="post-content"
            ref="contentRef"
            v-model="content"
            class="input-body"
            :maxlength="CONTENT_MAX"
            placeholder="写下你的想法…"
            :aria-invalid="Boolean(contentError)"
            :aria-describedby="contentError ? 'post-content-error' : undefined"
            :disabled="submitting"
            @input="contentError = ''"></textarea>
          <p v-if="contentError" id="post-content-error" class="block__error" role="alert">
            {{ contentError }}
          </p>
        </section>

        <!-- 媒体 -->
        <section class="block">
          <div class="block__head">
            <span class="block__label">图片 / 视频</span>
            <span class="block__meta">{{ attachments.length }} / {{ MEDIA_MAX }}</span>
          </div>

          <div class="media">
            <div v-for="item in attachments" :key="item.id" class="media__item">
              <img
                v-if="item.kind === 'image'"
                :src="item.preview"
                :alt="item.name"
                class="media__thumb" />
              <video v-else :src="item.preview" class="media__thumb" muted playsinline></video>

              <span v-if="item.status === 'uploading'" class="media__state">上传中</span>
              <span v-else-if="item.status === 'error'" class="media__state media__state--error">
                失败
              </span>

              <button
                type="button"
                class="media__remove"
                :aria-label="`移除 ${item.name}`"
                @click="removeAttachment(item.id)">
                <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.6" fill="none" />
                </svg>
              </button>
            </div>

            <label v-if="attachments.length < MEDIA_MAX" class="media__add">
              <input
                type="file"
                class="media__file"
                accept="image/*,video/*"
                multiple
                :disabled="submitting"
                @change="handleFiles" />
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5" fill="none" />
              </svg>
              <span class="media__add-text">添加</span>
            </label>
          </div>
          <p class="block__hint">支持图片与短视频，最多 {{ MEDIA_MAX }} 个。</p>
        </section>
      </main>

      <!-- 右侧设置栏 -->
      <aside class="compose__rail">
        <!-- 话题 -->
        <section class="rail-block">
          <h2 class="rail-block__title">话题</h2>
          <div class="chips">
            <span v-for="tag in topics" :key="tag" class="chip">
              {{ tag }}
              <button
                type="button"
                class="chip__remove"
                :aria-label="`移除话题 ${tag}`"
                @click="removeTopic(tag)">
                <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" fill="none" />
                </svg>
              </button>
            </span>
          </div>
          <input
            v-model="topicInput"
            class="rail-input"
            type="text"
            placeholder="输入后回车添加"
            :maxlength="TOPIC_MAX"
            :disabled="submitting"
            @keydown.enter.prevent="addTopic(topicInput)" />
          <div class="suggest">
            <button
              v-for="opt in availableTopicOptions"
              :key="opt.value"
              type="button"
              class="suggest__item"
              @click="addTopic(opt.value)">
              {{ opt.label }}
            </button>
          </div>
        </section>

        <!-- 可见性 -->
        <section class="rail-block">
          <h2 class="rail-block__title">谁可以看</h2>
          <div class="vis">
            <label v-for="opt in VISIBILITY_OPTIONS" :key="opt.value" class="vis__option">
              <input
                v-model="visibility"
                class="vis__input"
                type="radio"
                name="post-visibility"
                :value="opt.value"
                :disabled="submitting" />
              <span class="vis__body">
                <span class="vis__name">{{ opt.label }}</span>
                <span class="vis__desc">{{ opt.desc }}</span>
              </span>
            </label>
          </div>
        </section>

        <!-- 操作 -->
        <div class="rail-actions">
          <button
            type="button"
            class="btn btn--primary"
            :disabled="submitting"
            :aria-busy="submitting"
            @click="handleSubmit">
            {{ submitting ? '发布中…' : '立即发布' }}
          </button>
          <button type="button" class="btn btn--ghost" :disabled="submitting" @click="handleCancel">
            取消
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { COMMUNITY_TOPIC_OPTIONS } from '@/constants/community'
import { createPost } from '@/api/community/post'
import { uploadFile } from '@/api/file'
import type { PostVisibility } from '@/api/types'

type Visibility = 'public' | 'followers' | 'private'

/** 本地附件：保留了上传状态与本地预览地址 */
interface Attachment {
  id: string
  name: string
  kind: 'image' | 'video'
  preview: string
  url: string
  status: 'uploading' | 'done' | 'error'
}

const TITLE_MAX = 50
const CONTENT_MAX = 2000
const MEDIA_MAX = 9
const TOPIC_MAX = 20

const VISIBILITY_OPTIONS: Array<{ value: Visibility; label: string; desc: string }> = [
  { value: 'public', label: '公开', desc: '社区内所有人可见' },
  { value: 'followers', label: '仅粉丝', desc: '只有关注你的人可见' },
  { value: 'private', label: '仅自己', desc: '作为私人草稿保存' }
]

const router = useRouter()
const message = useMessage()

const title = ref('')
const content = ref('')
const topics = ref<string[]>([])
const topicInput = ref('')
const visibility = ref<Visibility>('public')
const attachments = ref<Attachment[]>([])
const submitting = ref(false)
const contentError = ref('')
const contentRef = ref<HTMLTextAreaElement | null>(null)

/** 尚未被选中的推荐话题 */
const availableTopicOptions = computed(() =>
  COMMUNITY_TOPIC_OPTIONS.filter(opt => !topics.value.includes(opt.value))
)

/**
 * 添加话题
 * @param raw - 原始输入，允许带 # 前缀
 * @description 去重、去空白并限制长度，超过 5 个不再接受。
 */
function addTopic(raw: string): void {
  const value = raw.trim().replace(/^#/, '').slice(0, TOPIC_MAX)
  topicInput.value = ''
  if (!value || topics.value.includes(value)) return
  if (topics.value.length >= 5) {
    message.warning('最多添加 5 个话题')
    return
  }
  topics.value.push(value)
}

/**
 * 移除话题
 * @param tag - 话题值
 */
function removeTopic(tag: string): void {
  topics.value = topics.value.filter(item => item !== tag)
}

/**
 * 逐张上传选中的文件
 * @param event - 文件选择框的 change 事件
 * @description 预览地址使用 objectURL，移除或卸载时统一释放，避免内存泄漏。
 */
async function handleFiles(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length === 0) return

  const room = MEDIA_MAX - attachments.value.length
  if (files.length > room) {
    message.warning(`最多上传 ${MEDIA_MAX} 个文件，已为你保留前 ${room} 个`)
  }

  const accepted = files.slice(0, Math.max(room, 0))
  for (const file of accepted) {
    const item: Attachment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      kind: file.type.startsWith('video/') ? 'video' : 'image',
      preview: URL.createObjectURL(file),
      url: '',
      status: 'uploading'
    }
    attachments.value.push(item)
    await uploadAttachment(item, file)
  }
}

/**
 * 上传单个附件并回写状态
 * @param item - 附件记录
 * @param file - 原始文件对象
 */
async function uploadAttachment(item: Attachment, file: File): Promise<void> {
  try {
    const res = await uploadFile(file)
    const url = res.data?.data?.url
    if (!url) throw new Error('接口未返回文件地址')
    item.url = url
    item.status = 'done'
  } catch {
    item.status = 'error'
    message.error(`${item.name} 上传失败`)
  }
}

/**
 * 移除附件并释放本地预览地址
 * @param id - 附件 ID
 */
function removeAttachment(id: string): void {
  const target = attachments.value.find(item => item.id === id)
  if (target) URL.revokeObjectURL(target.preview)
  attachments.value = attachments.value.filter(item => item.id !== id)
}

/**
 * 校验正文
 * @returns 通过时返回 true
 */
function validate(): boolean {
  if (!content.value.trim()) {
    contentError.value = '请输入正文内容后再发布'
    contentRef.value?.focus()
    return false
  }
  if (attachments.value.some(item => item.status === 'uploading')) {
    message.warning('附件仍在上传，请稍候')
    return false
  }
  contentError.value = ''
  return true
}

/**
 * 提交发布
 * @description 参数映射沿用后端既有约定：tags / images 为 JSON 字符串，visibility 为大写枚举。
 */
async function handleSubmit(): Promise<void> {
  if (submitting.value || !validate()) return

  submitting.value = true
  try {
    const urls = attachments.value
      .filter(item => item.status === 'done' && item.url)
      .map(item => item.url)

    const res = await createPost({
      title: title.value.trim(),
      content: content.value.trim(),
      tags: topics.value.length > 0 ? JSON.stringify(topics.value) : undefined,
      images: urls.length > 0 ? JSON.stringify(urls) : undefined,
      visibility: visibility.value.toUpperCase() as PostVisibility,
      channel: '动态'
    })

    if (res.data && (res.data.status === 201 || res.data.status === 200)) {
      message.success('发布成功')
      router.push('/community')
    } else {
      message.error(res.data?.message || '发布失败')
    }
  } catch (error) {
    const response = error as { response?: { data?: { message?: string } } }
    message.error(response.response?.data?.message || '发布失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

/** 离开编辑页：附件预览地址必须释放 */
onBeforeUnmount(() => {
  attachments.value.forEach(item => URL.revokeObjectURL(item.preview))
})

/**
 * 取消编辑并返回社区
 */
function handleCancel(): void {
  router.back()
}
</script>

<style scoped lang="scss">
/* 发布页：创作者工具的单页编辑器。
   结构上是一张"纸"（主编辑区）+ 右侧固定设置栏；不使用卡片、阴影与模态残留。 */
/* 顶栏避让由 DefaultLayout 的 .app-main--with-header 统一负责，此处不得重复加 padding */
.compose {
  min-height: calc(100vh - var(--header-height));
  padding: 0 0 var(--nexus-space-12);
  /* 深一档的画布：白面靠底色差浮起来，完全不需要描边或投影 */
  background: var(--nexus-bg-sunken);
  color: var(--nexus-text-primary);
  font-family: var(--nexus-font-ui);
  -webkit-font-smoothing: antialiased;
}

.compose__head {
  max-width: 1024px;
  margin: 0 auto;
  padding: var(--nexus-space-8) var(--nexus-space-6) var(--nexus-space-6);
}

.compose__title {
  margin: 0 0 var(--nexus-space-1);
  font-size: var(--nexus-font-size-xl);
  font-weight: 600;
  line-height: var(--nexus-leading-display);
  letter-spacing: -0.01em;
}

.compose__desc {
  margin: 0;
  font-size: var(--nexus-font-size-sm);
  line-height: var(--nexus-leading-normal);
  color: var(--nexus-text-tertiary);
}

.compose__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: var(--nexus-space-10);
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 var(--nexus-space-6);
  align-items: start;
}

/* ── 主编辑区 ── 无边框：白面浮在深一档画布上，不用描边也不用投影 */
.compose__main {
  min-width: 0;
  background: var(--nexus-bg-elevated);
  border-radius: var(--nexus-radius-lg);
  padding: var(--nexus-space-2) var(--nexus-space-8) var(--nexus-space-8);
}

/* 区块之间靠留白分区，不画分隔线 */
.block {
  padding: var(--nexus-space-6) 0;
}

.block:last-child {
  padding-bottom: 0;
}

.block__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--nexus-space-4);
  margin-bottom: var(--nexus-space-3);
}

.block__label {
  display: flex;
  align-items: baseline;
  gap: var(--nexus-space-2);
  font-size: var(--nexus-font-size-xs);
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--nexus-text-secondary);
}

.block__optional {
  font-weight: 400;
  color: var(--nexus-text-quaternary);
}

.block__meta {
  font-size: var(--nexus-font-size-xs);
  font-variant-numeric: tabular-nums;
  color: var(--nexus-text-quaternary);
}

.block__error {
  margin: var(--nexus-space-2) 0 0;
  font-size: var(--nexus-font-size-xs);
  line-height: var(--nexus-leading-compact);
  color: var(--nexus-error-text);
}

.block__hint {
  margin: var(--nexus-space-3) 0 0;
  font-size: var(--nexus-font-size-xs);
  line-height: var(--nexus-leading-compact);
  color: var(--nexus-text-quaternary);
}

/* 无边框输入：标题按展示级字号，正文按阅读级行高，均不加任何静态描边 */
.input-title {
  width: 100%;
  padding: 0 0 var(--nexus-space-2);
  border: 0;
  border-radius: 0;
  background: transparent;
  font-family: inherit;
  font-size: var(--nexus-font-size-lg);
  font-weight: 600;
  line-height: var(--nexus-leading-display);
  color: var(--nexus-text-primary);
}

.input-title::placeholder {
  color: var(--nexus-text-quaternary);
  font-weight: 400;
}

.input-body {
  display: block;
  width: 100%;
  min-height: 240px;
  padding: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: var(--nexus-font-size-base);
  line-height: var(--nexus-leading-prose);
  color: var(--nexus-text-primary);
  resize: vertical;
}

.input-body::placeholder {
  color: var(--nexus-text-quaternary);
}

.input-body[aria-invalid='true'] {
  box-shadow: inset 2px 0 0 var(--nexus-error);
  padding-left: var(--nexus-space-3);
}

/* 无边框控件统一焦点环：不抑制，保证键盘可达性 */
.input-title:focus-visible,
.input-body:focus-visible,
.rail-input:focus-visible {
  outline: 2px solid var(--nexus-gray-500);
  outline-offset: 2px;
}

.input-title:disabled,
.input-body:disabled,
.rail-input:disabled {
  color: var(--nexus-text-tertiary);
  cursor: not-allowed;
}

/* ── 媒体 ── */
.media {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nexus-space-2);
}

.media__item,
.media__add {
  position: relative;
  width: 96px;
  height: 96px;
  flex: 0 0 auto;
  border-radius: var(--nexus-radius-md);
  overflow: hidden;
}

.media__item {
  background: var(--nexus-bg-sunken);
}

.media__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.media__state {
  position: absolute;
  inset: auto 0 0 0;
  padding: 2px var(--nexus-space-2);
  background: rgba(23, 23, 23, 0.72);
  font-size: var(--nexus-font-size-xs);
  color: var(--nexus-text-inverse);
}

.media__state--error {
  background: var(--nexus-error);
}

.media__remove {
  position: absolute;
  top: var(--nexus-space-1);
  right: var(--nexus-space-1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: var(--nexus-radius-full);
  background: rgba(23, 23, 23, 0.7);
  color: var(--nexus-text-inverse);
  cursor: pointer;
  transition: background-color var(--nexus-duration-fast) var(--nexus-ease);
}

.media__remove:hover {
  background: var(--nexus-black);
}

.media__add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--nexus-space-1);
  background: var(--nexus-bg-sunken);
  color: var(--nexus-text-tertiary);
  cursor: pointer;
  transition:
    background-color var(--nexus-duration-fast) var(--nexus-ease),
    color var(--nexus-duration-fast) var(--nexus-ease);
}

.media__add:hover {
  background: var(--nexus-gray-200);
  color: var(--nexus-text-primary);
}

.media__add:focus-within {
  outline: 2px solid var(--nexus-gray-500);
  outline-offset: 2px;
}

.media__add-text {
  font-size: var(--nexus-font-size-xs);
}

/* 文件输入仅视觉隐藏，保持键盘可聚焦 */
.media__file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  clip-path: inset(50%);
  overflow: hidden;
}

/* ── 右侧设置栏 ── */
.compose__rail {
  position: sticky;
  top: calc(var(--header-height) + var(--nexus-space-6));
  display: flex;
  flex-direction: column;
  gap: var(--nexus-space-6);
  align-self: start;
}

.rail-block__title {
  margin: 0 0 var(--nexus-space-3);
  font-size: var(--nexus-font-size-xs);
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--nexus-text-secondary);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nexus-space-1);
  margin-bottom: var(--nexus-space-2);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--nexus-space-1);
  padding: 2px var(--nexus-space-2);
  border-radius: var(--nexus-radius-full);
  background: var(--nexus-bg-elevated);
  font-size: var(--nexus-font-size-xs);
  color: var(--nexus-text-secondary);
}

.chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--nexus-text-quaternary);
  cursor: pointer;
}

.chip__remove:hover {
  color: var(--nexus-text-primary);
}

.rail-input {
  width: 100%;
  height: 36px;
  padding: 0 var(--nexus-space-3);
  border: 0;
  border-radius: var(--nexus-radius-sm);
  background: var(--nexus-bg-elevated);
  font-family: inherit;
  font-size: var(--nexus-font-size-sm);
  color: var(--nexus-text-primary);
}

.rail-input::placeholder {
  color: var(--nexus-text-quaternary);
}

.rail-input:focus-visible {
  outline-offset: -2px;
}

.suggest {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nexus-space-1);
  margin-top: var(--nexus-space-2);
}

.suggest__item {
  padding: 2px var(--nexus-space-2);
  border: 0;
  border-radius: var(--nexus-radius-full);
  background: var(--nexus-bg-elevated);
  font-family: inherit;
  font-size: var(--nexus-font-size-xs);
  color: var(--nexus-text-tertiary);
  cursor: pointer;
  transition:
    background-color var(--nexus-duration-fast) var(--nexus-ease),
    color var(--nexus-duration-fast) var(--nexus-ease);
}

.suggest__item:hover {
  background: var(--nexus-bg-subtle);
  color: var(--nexus-text-primary);
}

/* 可见性：三选一，每项带一句解释 */
.vis {
  display: flex;
  flex-direction: column;
  gap: var(--nexus-space-1);
}

.vis__option {
  position: relative;
  display: flex;
  cursor: pointer;
}

.vis__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  clip-path: inset(50%);
}

.vis__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: var(--nexus-space-2) var(--nexus-space-3);
  border-radius: var(--nexus-radius-md);
  transition: background-color var(--nexus-duration-fast) var(--nexus-ease);
}

.vis__option:hover .vis__body {
  background: var(--nexus-bg-subtle);
}

/* 选中态用填充区分，不描边 */
.vis__input:checked ~ .vis__body {
  background: var(--nexus-bg-elevated);
}

.vis__input:checked ~ .vis__body .vis__name {
  font-weight: 600;
}

.vis__input:focus-visible ~ .vis__body {
  outline: 2px solid var(--nexus-gray-500);
  outline-offset: 1px;
}

.vis__name {
  font-size: var(--nexus-font-size-sm);
  font-weight: 500;
  color: var(--nexus-text-primary);
}

.vis__desc {
  font-size: var(--nexus-font-size-xs);
  line-height: var(--nexus-leading-compact);
  color: var(--nexus-text-tertiary);
}

/* ── 操作 ── */
.rail-actions {
  display: flex;
  flex-direction: column;
  gap: var(--nexus-space-2);
  padding-top: var(--nexus-space-4);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border: 0;
  border-radius: var(--nexus-radius-md);
  font-family: inherit;
  font-size: var(--nexus-font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color var(--nexus-duration-fast) var(--nexus-ease),
    color var(--nexus-duration-fast) var(--nexus-ease);
}

.btn--primary {
  background: var(--nexus-accent);
  color: var(--nexus-text-inverse);
}

.btn--primary:hover:not(:disabled) {
  background: var(--nexus-accent-hover);
}

.btn--ghost {
  background: transparent;
  color: var(--nexus-text-tertiary);
}

.btn--ghost:hover:not(:disabled) {
  color: var(--nexus-text-primary);
}

.btn:disabled {
  opacity: 0.5;
  cursor: progress;
}

.btn:focus-visible,
.chip__remove:focus-visible,
.suggest__item:focus-visible,
.media__remove:focus-visible {
  outline: 2px solid var(--nexus-gray-500);
  outline-offset: 2px;
}

/* ── 响应式 ── */
@media (max-width: 1099px) {
  .compose__body {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--nexus-space-8);
  }

  .compose__rail {
    position: static;
  }
}

@media (max-width: 639px) {
  .compose__head {
    padding: var(--nexus-space-6) var(--nexus-space-4) var(--nexus-space-4);
  }

  .compose__body {
    padding: 0 var(--nexus-space-4);
  }

  .compose__main {
    padding: var(--nexus-space-1) var(--nexus-space-5) var(--nexus-space-6);
    border-radius: var(--nexus-radius-md);
  }

  .input-body {
    min-height: 180px;
  }

  .media__item,
  .media__add {
    width: 84px;
    height: 84px;
  }
}
</style>
