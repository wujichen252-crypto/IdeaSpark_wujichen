<template>
  <div class="create-post-container">
    <div class="create-content">
      <n-card
:bordered="false"
title="发布新动态"
size="large"
class="editor-card">
        <template #header-extra>
          <n-button text @click="$router.back()">
            <template #icon><n-icon :component="CloseOutline" /></template>
          </n-button>
        </template>

        <n-form ref="formRef" :model="formValue" :rules="rules">
          <!-- 标题输入 (可选) -->
          <n-form-item label="标题 (可选)" path="title">
            <n-input 
              v-model:value="formValue.title" 
              placeholder="给你的动态起个标题..." 
              size="large"
              maxlength="50"
              show-count
            />
          </n-form-item>

          <!-- 内容输入 -->
          <n-form-item label="正文内容" path="content">
            <n-input
              v-model:value="formValue.content"
              type="textarea"
              placeholder="分享你的创意、灵感或遇到的问题..."
              :autosize="{ minRows: 8, maxRows: 20 }"
              size="large"
              show-count
              maxlength="2000"
            />
          </n-form-item>

          <!-- 图片上传 -->
          <n-form-item label="图片/视频" path="images">
            <n-upload
              v-model:file-list="fileList"
              list-type="image-card"
              :max="9"
              :custom-request="handleCustomUpload"
            >
              点击上传
            </n-upload>
          </n-form-item>

          <!-- 话题/标签 -->
          <n-form-item label="添加话题" path="topics">
            <n-select
              v-model:value="formValue.topics"
              multiple
              filterable
              tag
              placeholder="输入话题后回车，如 #Vue3"
              :options="topicOptions"
            />
          </n-form-item>

          <!-- 可见性 -->
          <n-form-item label="谁可以看" path="visibility">
            <n-radio-group v-model:value="formValue.visibility" name="visibility">
              <n-space>
                <n-radio value="public">公开</n-radio>
                <n-radio value="followers">仅粉丝</n-radio>
                <n-radio value="private">仅自己</n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>
        </n-form>

        <template #action>
          <div class="form-actions">
            <n-button size="large" @click="$router.back()">取消</n-button>
            <n-button
type="primary"
size="large"
:loading="submitting"
@click="handleSubmit">
              立即发布
            </n-button>
          </div>
        </template>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, type UploadFileInfo, type UploadCustomRequestOptions } from 'naive-ui'
import { CloseOutline } from '@vicons/ionicons5'
import { COMMUNITY_TOPIC_OPTIONS } from '@/constants/community'
import { createPost } from '@/api/community/post'
import { uploadFile } from '@/api/file'
import type { PostVisibility } from '@/api/types'

const router = useRouter()
const message = useMessage()
const submitting = ref(false)

const formValue = reactive({
  title: '',
  content: '',
  topics: [],
  visibility: 'public'
})

const fileList = ref<UploadFileInfo[]>([])

const rules = {
  content: {
    required: true,
    message: '请输入正文内容',
    trigger: 'blur'
  }
}

const topicOptions = COMMUNITY_TOPIC_OPTIONS

/**
 * 自定义上传：走真实文件上传接口（阿里云 OSS），成功后把 URL 写回文件项
 * @param options - naive-ui 自定义上传回调参数
 */
const handleCustomUpload = async ({ file, onFinish, onError }: UploadCustomRequestOptions) => {
  if (!file.file) {
    onError()
    return
  }
  try {
    const res = await uploadFile(file.file)
    const url = res.data?.data?.url
    if (url) {
      file.url = url
      onFinish()
    } else {
      message.error('上传失败：接口未返回文件地址')
      onError()
    }
  } catch {
    message.error('图片上传失败，请重试')
    onError()
  }
}

/**
 * 提交发布
 */
const handleSubmit = async () => {
  if (!formValue.content) {
    message.warning('请输入正文内容')
    return
  }
  
  submitting.value = true
  try {
    // 准备请求参数
    const params = {
      title: formValue.title,
      content: formValue.content,
      // 将 topics 数组转为 JSON 字符串存储在 tags 字段
      tags: formValue.topics.length > 0 ? JSON.stringify(formValue.topics) : undefined,
      // 仅收集上传成功且已拿到真实 OSS 地址的图片
      images: (() => {
        const urls = fileList.value
          .filter(f => f.status === 'finished' && f.url)
          .map(f => f.url as string)
        return urls.length > 0 ? JSON.stringify(urls) : undefined
      })(),
      visibility: formValue.visibility.toUpperCase() as PostVisibility,
      channel: '动态' // 默认频道
    }
    
    const res = await createPost(params)
    
    if (res.data && (res.data.status === 201 || res.data.status === 200)) {
      message.success('发布成功！')
      router.push('/community')
    } else {
      message.error(res.data?.message || '发布失败')
    }
  } catch (error: any) {
    console.error('发布动态失败:', error)
    message.error(error.response?.data?.message || '发布失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.create-post-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-top: 76px;
  padding-bottom: 40px;
  display: flex;
  justify-content: center;
}

.create-content {
  width: 100%;
  max-width: 800px;
  padding: 0 20px;
}

.editor-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 16px;
}

:deep(.n-upload-trigger + .n-upload-file-list) {
  margin-top: 8px;
}
</style>
