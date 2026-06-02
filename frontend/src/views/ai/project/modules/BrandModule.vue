<template>
  <div class="brand-module">
    <n-grid :x-gap="16" :y-gap="16" :cols="24">
      <!-- 左侧：品牌核心 -->
      <n-grid-item :span="8">
        <n-card title="品牌核心 (Identity)" size="small" class="h-full">
           <template #header-extra>
            <n-button
text
size="tiny"
type="primary"
@click="askAI('帮我想 5 个好听的中文产品名称，要朗朗上口')">
              <template #icon><n-icon><SparklesOutline /></n-icon></template>
              AI 起名
            </n-button>
          </template>
          
          <n-form label-placement="top">
            <n-form-item label="产品名称">
              <n-input v-model:value="brandName" placeholder="例如：意念方舟" />
            </n-form-item>
            <n-form-item label="Slogan (一句话卖点)">
              <n-input v-model:value="slogan" placeholder="例如：让所有人都能用 AI 把想法变成项目" />
            </n-form-item>
            <n-form-item label="品牌关键词">
              <n-dynamic-tags v-model:value="keywords" />
            </n-form-item>
             <n-form-item label="品牌调性 (Tone)">
              <n-select v-model:value="tone" :options="toneOptions" />
            </n-form-item>
          </n-form>
        </n-card>
      </n-grid-item>

      <!-- 右侧：文案生成 -->
      <n-grid-item :span="16">
        <n-card title="文案工坊 (Copywriting)" size="small" class="h-full">
          <n-tabs type="line" animated>
            <n-tab-pane name="homepage" tab="官网首屏文案">
              <div class="copy-toolbar">
                 <n-button size="tiny" dashed @click="askAI('根据品牌核心生成一段吸引人的官网首屏文案')">✨ 生成首屏文案</n-button>
              </div>
              <n-input
                v-model:value="homepageCopy"
                type="textarea"
                placeholder="主标题、副标题、CTA 按钮文案..."
                :autosize="{ minRows: 8 }"
                class="copy-editor"
              />
            </n-tab-pane>
            <n-tab-pane name="pitch" tab="一分钟 Pitch">
              <div class="copy-toolbar">
                 <n-button size="tiny" dashed @click="askAI('生成一段给投资人看的一分钟电梯演讲稿')">✨ 生成演讲稿</n-button>
              </div>
              <n-input
                v-model:value="pitchCopy"
                type="textarea"
                placeholder="向别人介绍你的项目..."
                :autosize="{ minRows: 8 }"
                class="copy-editor"
              />
            </n-tab-pane>
            <n-tab-pane name="story" tab="品牌故事">
              <div class="copy-toolbar">
                 <n-button size="tiny" dashed @click="askAI('基于痛点和愿景，写一个感人的品牌故事')">✨ 生成品牌故事</n-button>
              </div>
              <n-input
                v-model:value="storyCopy"
                type="textarea"
                placeholder="我们为什么做这个..."
                :autosize="{ minRows: 8 }"
                class="copy-editor"
              />
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 底部：交付物 -->
    <div class="deliverables-section mt-4">
      <n-card title="品牌手册 (Brand Guidelines)" size="small">
         <template #header-extra>
           <n-button
size="small"
type="primary"
secondary
@click="generateManual">
             <template #icon><n-icon><DocumentTextOutline /></n-icon></template>
             生成品牌手册
           </n-button>
        </template>
        <n-input
          v-model:value="manualContent"
          type="textarea"
          placeholder="此处将生成完整的品牌手册内容..."
          :autosize="{ minRows: 6 }"
          class="doc-editor"
        />
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  SparklesOutline, 
  DocumentTextOutline 
} from '@vicons/ionicons5'
import { useAiModuleData } from '@/composables/useAiModule'

const {
  brandName,
  slogan,
  keywords,
  tone,
  homepageCopy,
  pitchCopy,
  storyCopy,
  manualContent
} = useAiModuleData('brand', {
  brandName: '',
  slogan: '',
  keywords: ['创新', '高效', '智能'],
  tone: 'professional',
  homepageCopy: '',
  pitchCopy: '',
  storyCopy: '',
  manualContent: ''
})

const toneOptions = [
  { label: '专业严谨 (Professional)', value: 'professional' },
  { label: '亲和友善 (Friendly)', value: 'friendly' },
  { label: '极简科技 (Minimalist Tech)', value: 'tech' },
  { label: '充满活力 (Energetic)', value: 'energetic' },
  { label: '高端奢华 (Luxury)', value: 'luxury' }
]

const askAI = (prompt: string) => {
  const fullPrompt = `当前品牌信息：
  - 名称：${brandName.value}
  - Slogan：${slogan.value}
  - 关键词：${keywords.value.join(', ')}
  - 调性：${tone.value}
  
  请求：${prompt}`
  
  const event = new CustomEvent('ai-prompt', { detail: fullPrompt })
  window.dispatchEvent(event)
}

const generateManual = () => {
  const prompt = `请为项目"${brandName.value}"生成一份简易的品牌手册大纲，包含品牌核心、传播语、语气规范等。`
  askAI(prompt)
}
</script>

<style scoped lang="scss">
.brand-module {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.h-full {
  height: 100%;
}

.mt-4 {
  margin-top: 16px;
}

.copy-toolbar {
  margin-bottom: 12px;
  text-align: right;
}

.copy-editor, .doc-editor {
  background-color: #fafafc;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}
</style>
