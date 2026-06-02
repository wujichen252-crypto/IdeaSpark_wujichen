<template>
  <div class="ai-project-create">
    <div class="create-layout">
      <!-- 左侧：AI 引导对话区 -->
      <div class="chat-panel">
        <div class="panel-header">
          <div class="header-nav">
             <n-button text @click="router.back()">
              <template #icon><n-icon><ArrowBack /></n-icon></template>
              返回
            </n-button>
          </div>
          <h3>AI 项目引导官</h3>
          <p>告诉我你想做什么，我来帮你规划项目</p>
        </div>
        
        <div ref="messagesRef" class="messages-container">
          <div
v-for="msg in messages"
:key="msg.id"
class="message-item"
:class="msg.role">
            <div class="avatar">
              <n-avatar
:src="msg.role === 'ai' ? 'https://api.dicebear.com/7.x/bottts/svg?seed=ai' : undefined" 
                       :color="msg.role === 'user' ? '#18a058' : undefined">
                {{ msg.role === 'user' ? '我' : 'AI' }}
              </n-avatar>
            </div>
            <div class="content">
              <div class="bubble" :class="{ loading: false }">
                <template v-for="(token, tIdx) in tokenizeChatText(msg.content)" :key="tIdx">
                  <strong v-if="token.kind === 'bold'">{{ token.text }}</strong>
                  <br v-else-if="token.kind === 'br'" />
                  <span v-else>{{ token.text }}</span>
                </template>
              </div>
            </div>
          </div>
          <div v-if="loading" class="message-item ai">
            <div class="avatar">
              <n-avatar src="https://api.dicebear.com/7.x/bottts/svg?seed=ai" />
            </div>
            <div class="content">
              <div class="bubble loading">
                <n-spin size="small" />
              </div>
            </div>
          </div>
        </div>

        <div class="input-area">
          <n-input
            v-model:value="inputValue"
            type="textarea"
            placeholder="例如：我想策划一场校园歌手大赛，或者开发一个电商网站..."
            :autosize="{ minRows: 2, maxRows: 4 }"
            :disabled="loading || isFinished"
            @keydown.enter.prevent="sendMessage"
          />
          <n-button
type="primary"
class="send-btn"
:disabled="!inputValue.trim() || loading || isFinished"
@click="sendMessage">
            <template #icon>
              <n-icon><PaperPlaneOutline /></n-icon>
            </template>
          </n-button>
        </div>
      </div>

      <!-- 右侧：项目预览与确认区 -->
      <div class="preview-panel">
        <div class="panel-header">
          <h3>项目概览</h3>
          <p>AI 将根据对话自动完善信息</p>
        </div>

        <div class="preview-content">
          <div v-if="!projectData.name && !projectData.description" class="empty-state">
            <n-empty description="等待对话开始..." size="large">
              <template #icon>
                <n-icon size="64" color="#ddd">
                  <SparklesOutline />
                </n-icon>
              </template>
            </n-empty>
          </div>
          <n-card v-else :bordered="false" class="preview-card">
          <n-form
            ref="formRef"
            :model="projectData"
            label-placement="top"
          >
            <n-form-item label="项目名称">
              <n-input v-model:value="projectData.name" placeholder="等待 AI 生成..." readonly />
            </n-form-item>
            
            <n-form-item label="项目分类">
              <n-input v-model:value="projectData.category" placeholder="等待 AI 生成..." readonly />
            </n-form-item>
            
            <n-form-item label="项目简介">
              <n-input
                v-model:value="projectData.description"
                type="textarea"
                placeholder="等待 AI 生成..."
                :autosize="{ minRows: 3, maxRows: 6 }"
                readonly
              />
            </n-form-item>

            <n-divider />
            <plugin-selector v-model:model-value="selectedPlugins" />

            <n-divider />
            <div class="draft-actions">
              <n-button
secondary
block
:loading="savingDraft"
@click="saveDraft">
                保存为草稿
              </n-button>
            </div>

            <div v-if="canCreate" class="action-area">
              <n-divider />
              <n-alert title="项目信息已就绪" type="success" style="margin-bottom: 16px;">
                AI 已收集足够信息，可以开始项目了。
              </n-alert>
              <n-button
type="primary"
block
size="large"
:loading="creating"
@click="createProject">
                生成项目并进入看板
              </n-button>
            </div>
          </n-form>
        </n-card>
        
        <n-divider />
        <draft-box />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAiWorkshopStore } from '@/store/modules/aiWorkshop'
import { PaperPlaneOutline, ArrowBack, SparklesOutline } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import PluginSelector from '@/components/ai/PluginSelector.vue'
import DraftBox from '@/components/ai/DraftBox.vue'

const router = useRouter()
const aiWorkshopStore = useAiWorkshopStore()
const message = useMessage()

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
}

const messages = ref<Message[]>([
  {
    id: '1',
    role: 'ai',
    content: '你好！我是你的 AI 项目引导官。请告诉我，你想做一个什么项目？'
  }
])

const inputValue = ref('')
const loading = ref(false)
const isFinished = ref(false)
const canCreate = ref(false)
const creating = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

const projectData = ref({
  name: '',
  category: '',
  description: ''
})
const selectedPlugins = ref<string[]>([])
const savingDraft = ref(false)

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

type ChatToken = { kind: 'text' | 'bold' | 'br'; text?: string }

const tokenizeBold = (input: string): ChatToken[] => {
  const tokens: ChatToken[] = []
  const boldRegex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = boldRegex.exec(input)) !== null) {
    const start = match.index
    const end = start + match[0].length
    if (start > lastIndex) tokens.push({ kind: 'text', text: input.slice(lastIndex, start) })
    tokens.push({ kind: 'bold', text: match[1] || '' })
    lastIndex = end
  }
  if (lastIndex < input.length) tokens.push({ kind: 'text', text: input.slice(lastIndex) })
  return tokens
}

const tokenizeChatText = (text: string): ChatToken[] => {
  const lines = (text || '').split('\n')
  const out: ChatToken[] = []
  for (let i = 0; i < lines.length; i += 1) {
    out.push(...tokenizeBold(lines[i] || ''))
    if (i < lines.length - 1) out.push({ kind: 'br' })
  }
  return out
}

const conversationStep = ref(0) // 0: init, 1: clarifying, 2: ready

// 模拟 AI 引导逻辑
const processAiResponse = async (userText: string) => {
  loading.value = true
  
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const text = userText.toLowerCase()
  let aiReply = ''
  
  if (conversationStep.value === 0) {
    // 第一步：用户输入了初步想法
    // 简单的关键词匹配来推测分类
    let category = '工具型产品'
    if (text.includes('saas') || text.includes('平台') || text.includes('服务') || text.includes('系统')) category = 'SaaS 产品'
    else if (text.includes('app') || text.includes('小程序') || text.includes('应用') || text.includes('手机')) category = 'APP / 小程序'
    else if (text.includes('文章') || text.includes('视频') || text.includes('号') || text.includes('内容') || text.includes('ip')) category = '内容产品'
    else if (text.includes('工具') || text.includes('脚本') || text.includes('插件') || text.includes('计算')) category = '工具型产品'

    projectData.value.name = '我的' + category.split(' ')[0] + '项目'
    projectData.value.category = category
    projectData.value.description = userText

    conversationStep.value = 1
    
    // 根据分类提出针对性问题
    if (category === 'SaaS 产品') aiReply = '这个 SaaS 想法听起来很有潜力！\n请问你的**目标客户**是谁？他们目前最大的**痛点**是什么？'
    else if (category === 'APP / 小程序') aiReply = '做移动端产品最重要的是场景。\n用户会在**什么场景**下使用你的产品？主要解决什么**核心问题**？'
    else if (category === '内容产品') aiReply = '做内容最重要的是定位。\n你想发布在**哪个平台**？主要面向**哪类读者/观众**？'
    else if (category === '工具型产品') aiReply = '工具产品需要简单高效。\n请用一句话描述：用户用你的工具**主要能完成什么具体任务**？'
    else aiReply = '明白。为了帮你更好地规划，请告诉我：这个项目你最看重的一个**核心目标**是什么？'

  } else if (conversationStep.value === 1) {
    // 第二步：用户回答了细节
    projectData.value.description += '\n\n补充信息：' + userText
    
    // 完善项目名称 (简单的模拟)
    if (projectData.value.name.startsWith('我的')) {
      // 尝试提取关键词作为名字 (伪逻辑)
      const keywords = userText.substring(0, 10).replace(/[.,，。]/g, '')
      if (keywords.length > 2) {
        projectData.value.name = keywords + ' - ' + projectData.value.category.split(' ')[0]
      }
    }

    aiReply = '收到！我已经为你生成了初步的项目路径和任务清单。\n\n点击右侧按钮，我们直接开始把想法变成现实！🚀'
    canCreate.value = true
    isFinished.value = true
    conversationStep.value = 2
  }

  messages.value.push({
    id: Date.now().toString(),
    role: 'ai',
    content: aiReply
  })
  
  loading.value = false
  scrollToBottom()
}

const sendMessage = () => {
  if (!inputValue.value.trim() || loading.value) return
  
  const text = inputValue.value
  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: text
  })
  
  inputValue.value = ''
  scrollToBottom()
  
  processAiResponse(text)
}

const createProject = async () => {
  creating.value = true
  // 使用新的 addProject 方法
  const newProject = aiWorkshopStore.addProject({
    name: projectData.value.name || '未命名项目',
    description: projectData.value.description,
    category: projectData.value.category || '未分类',
    type: 'app' // 默认为应用类型
  })
  
  // 如果需要，这里可以保留 applyTemplate 逻辑，但需要确认 store 中是否支持
  // 目前 store 中没有看到 applyTemplate，暂时注释掉或忽略
  // aiWorkshopStore.applyTemplate(projectData.value.category)
  
  message.success('项目创建成功，正在跳转工作台...')
  
  setTimeout(() => {
    router.push(`/project/${newProject.id}`)
  }, 1000)
}

/**
 * 保存草稿
 */
const saveDraft = async () => {
  if (!projectData.value.description) {
    message.warning('请先在左侧描述你的项目想法')
    return
  }
  savingDraft.value = true
  const draftId = 'draft_' + Date.now()
  aiWorkshopStore.initProject(draftId)
  aiWorkshopStore.setProjectInfo({
    name: projectData.value.name || '未命名项目',
    description: projectData.value.description,
    category: projectData.value.category || '未分类',
    status: 'draft',
    plugins: selectedPlugins.value
  })
  aiWorkshopStore.saveProject()
  message.success('草稿已保存')
  savingDraft.value = false
}
</script>

<style scoped lang="scss">
.ai-project-create {
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  background-color: #f5f7fa;
  display: flex;
  padding: 20px;
}

.create-layout {
  display: flex;
  width: 1200px;
  height: calc(100vh - 40px);
  min-height: 600px;
  max-height: 900px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin: auto;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #eee;
  background-color: #fafafc;

  .panel-header {
    padding: 20px 24px;
    border-bottom: 1px solid #eee;
    background: #fff;
    
    .header-nav {
      margin-bottom: 12px;
    }

    h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
    }
    
    p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .message-item {
      display: flex;
      gap: 12px;
      max-width: 80%;
      
      &.user {
        align-self: flex-end;
        flex-direction: row-reverse;
        
        .bubble {
          background-color: #e7f5ee;
          color: #333;
          border-radius: 12px 0 12px 12px;
        }
      }
      
      &.ai {
        align-self: flex-start;
        
        .bubble {
          background-color: #fff;
          border: 1px solid #eee;
          border-radius: 0 12px 12px 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      }

      .bubble {
        padding: 12px 16px;
        line-height: 1.5;
        font-size: 15px;
        
        &.loading {
          padding: 8px 16px;
        }
      }
    }
  }

  .input-area {
    padding: 20px 24px;
    background: #fff;
    border-top: 1px solid #eee;
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }
}

.preview-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  background: #fff;

  .panel-header {
    padding: 20px 24px;
    border-bottom: 1px solid #eee;
    
    h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
    }
    
    p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
  }

  .preview-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;

    .empty-state {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

@media (max-width: 768px) {
  .ai-project-create {
    padding: 10px;
  }

  .create-layout {
    width: 100%;
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 20px);
    max-height: none;
  }

  .chat-panel {
    height: 60vh;
    border-right: none;
    border-bottom: 1px solid #eee;

    .messages-container {
      padding: 16px;
      
      .message-item {
        max-width: 90%;
      }
    }
  }

  .preview-panel {
    width: 100%;
    height: auto;
    min-height: 40vh;
  }
}
</style>
