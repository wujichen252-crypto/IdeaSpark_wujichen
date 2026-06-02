<template>
  <div class="ai-document-editor">
    <!-- 顶部导航栏 -->
    <header class="editor-header">
      <div class="header-left">
        <n-button text @click="handleBack">
          <template #icon>
            <n-icon :component="ArrowBackOutline" />
          </template>
        </n-button>
        <n-divider vertical />
        <div class="title-edit">
          <n-input 
            v-model:value="projectTitle" 
            placeholder="无标题文档" 
            :bordered="false"
            class="title-input"
            @blur="handleSaveTitle"
          />
        </div>
        <n-tag
v-if="saveStatus === 'saved'"
type="success"
size="small"
:bordered="false">
          已保存
        </n-tag>
        <n-tag
v-else-if="saveStatus === 'saving'"
type="warning"
size="small"
:bordered="false">
          保存中...
        </n-tag>
      </div>
      <div class="header-right">
        <n-button
secondary
type="primary"
size="small"
@click="handleExport">
          导出
        </n-button>
        <n-button
secondary
type="info"
size="small"
@click="showChat = !showChat">
          <template #icon>
            <n-icon :component="ChatboxEllipsesOutline" />
          </template>
          {{ showChat ? '收起对话' : '展开对话' }}
        </n-button>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="editor-body">
      <!-- 左侧编辑器 -->
      <div class="editor-container" :class="{ 'chat-open': showChat }">
        <n-input
          v-model:value="content"
          type="textarea"
          placeholder="# 开始撰写你的文档...\n\n你可以点击右上角的对话按钮，让 AI 帮你生成内容。"
          class="markdown-editor"
          :autosize="{ minRows: 20 }"
          @input="handleContentChange"
        />
      </div>

      <!-- 右侧 AI 对话栏 -->
      <div v-show="showChat" class="chat-sidebar">
        <AiChatArea 
          :session-id="projectId" 
          mode="sidebar" 
          :system-context="`你是一个文档写作助手，当前正在编辑的文档标题为《${projectTitle}》。请帮助用户撰写、润色或扩充文档内容。`"
          @save-file="handleAiCode"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAiWorkshopStore } from '@/store/modules/aiWorkshop'
import { 
  ArrowBackOutline, 
  ChatboxEllipsesOutline
} from '@vicons/ionicons5'
import { NInput, NButton, NIcon, NDivider, NTag, useMessage } from 'naive-ui'
import AiChatArea from '@/views/ai/components/AiChatArea.vue'

const route = useRoute()
const router = useRouter()
const store = useAiWorkshopStore()
const message = useMessage()

const projectId = route.params.id as string
const projectTitle = ref('')
const content = ref('')
const showChat = ref(true)
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
let saveTimer: number | null = null

// 初始化加载
onMounted(() => {
  const project = store.getProjectById(projectId)
  if (project) {
    projectTitle.value = project.name
    content.value = project.content || ''
  } else {
    message.error('未找到项目')
    router.push('/workbench')
  }
})

// 处理返回
const handleBack = () => {
  router.push('/workbench')
}

// 自动保存逻辑
const handleContentChange = () => {
  saveStatus.value = 'unsaved'
  if (saveTimer) clearTimeout(saveTimer)
  
  saveTimer = setTimeout(() => {
    saveProject()
  }, 1000)
}

const handleSaveTitle = () => {
  saveProject()
}

const saveProject = () => {
  saveStatus.value = 'saving'
  store.updateProject(projectId, {
    name: projectTitle.value,
    content: content.value
  })
  setTimeout(() => {
    saveStatus.value = 'saved'
  }, 500)
}

// 处理 AI 生成的代码/内容
const handleAiCode = (payload: { code: string, lang: string }) => {
  // 这里假设 AI 返回的内容应该追加到文档中
  // 或者可以做一个更复杂的插入逻辑
  const newContent = payload.code
  content.value += `\n\n${newContent}`
  handleContentChange()
  message.success('已应用 AI 生成的内容')
}

const handleExport = () => {
  message.info('导出功能开发中...')
}
</script>

<style scoped lang="scss">
.ai-document-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #f8fafc;
  color: #333; /* 强制字体颜色，防止暗色模式下文字不可见 */
  position: absolute; /* 强制覆盖 */
  top: 0;
  left: 0;
  z-index: 100;

  .editor-header {
    height: 60px;
    padding: 0 20px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .title-edit {
        width: 300px;
        
        .title-input {
          font-size: 16px;
          font-weight: 600;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .editor-body {
    flex: 1;
    display: flex;
    overflow: hidden;

    .editor-container {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      transition: width 0.3s ease;
      display: flex;
      justify-content: center;

      &.chat-open {
        // 当侧边栏打开时，编辑器容器可能需要调整
      }

      .markdown-editor {
        max-width: 800px;
        width: 100%;
        height: 100%;
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        font-size: 16px;
        line-height: 1.6;
        border: none;
        background: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border-radius: 8px;
        padding: 24px;

        :deep(.n-input__textarea-el) {
          height: 100% !important;
        }
      }
    }

    .chat-sidebar {
      width: 400px;
      border-left: 1px solid #e2e8f0;
      background: white;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
  }
}
</style>
