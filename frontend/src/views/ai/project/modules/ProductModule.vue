<template>
  <div class="product-module">
    <n-grid :x-gap="16" :y-gap="16" :cols="2">
      <!-- 左列：功能规划 -->
      <n-grid-item>
        <n-card title="MVP 功能清单 (最小可行性产品)" size="small" class="h-full">
          <template #header-extra>
            <n-button
text
size="tiny"
type="primary"
@click="askAI('帮我规划 MVP 的核心功能列表，只要最关键的 3-5 个')">
              <template #icon><n-icon><ListOutline /></n-icon></template>
              AI 规划
            </n-button>
          </template>
          <n-dynamic-input
            v-model:value="features"
            placeholder="输入核心功能点"
            :min="1"
          />
          <div class="sub-section mt-4">
            <div class="label">不做什么 (产品边界)</div>
            <n-input
              v-model:value="boundaries"
              type="textarea"
              placeholder="明确这一阶段不做什，防止范围蔓延..."
              :autosize="{ minRows: 3 }"
            />
          </div>
        </n-card>
      </n-grid-item>

      <!-- 右列：用户流程 -->
      <n-grid-item>
        <n-card title="核心用户流程 (User Flow)" size="small" class="h-full">
          <template #header-extra>
            <n-button
text
size="tiny"
type="primary"
@click="askAI('设计一个用户完成核心任务的标准流程步骤')">
              <template #icon><n-icon><GitNetworkOutline /></n-icon></template>
              AI 设计
            </n-button>
          </template>
          <n-steps vertical size="small" :current="userFlows.length">
            <n-step
              v-for="(step, index) in userFlows"
              :key="index"
              :title="'步骤 ' + (index + 1)"
            >
              <n-input v-model:value="userFlows[index]" placeholder="用户操作..." size="small" />
            </n-step>
            <n-step title="结束" status="finish" />
          </n-steps>
          <div class="mt-2">
            <n-button
dashed
size="small"
block
@click="userFlows.push('')">
添加步骤
</n-button>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 底部：结构图与文档 -->
    <div class="structure-section mt-4">
      <n-card title="产品方案文档 (Output)" size="small">
        <template #header-extra>
           <n-button
size="small"
type="primary"
secondary
@click="generateDoc">
             <template #icon><n-icon><DocumentTextOutline /></n-icon></template>
             生成方案文档
           </n-button>
        </template>
        <n-tabs type="segment">
          <n-tab-pane name="doc" tab="完整方案文档">
            <n-input
              v-model:value="docContent"
              type="textarea"
              placeholder="此处将生成完整的产品方案文档..."
              :autosize="{ minRows: 12 }"
              class="doc-editor"
            />
          </n-tab-pane>
          <n-tab-pane name="structure" tab="功能结构树">
            <n-input
              v-model:value="structureContent"
              type="textarea"
              placeholder="- 首页
  - Banner
  - 推荐列表
- 个人中心
  - 设置"
              :autosize="{ minRows: 12 }"
              class="code-editor"
            />
          </n-tab-pane>
        </n-tabs>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ListOutline, 
  GitNetworkOutline, 
  DocumentTextOutline 
} from '@vicons/ionicons5'
import { useAiModuleData } from '@/composables/useAiModule'

const {
  features,
  boundaries,
  userFlows,
  docContent,
  structureContent
} = useAiModuleData('product', {
  features: ['', '', ''],
  boundaries: '',
  userFlows: ['用户打开应用', '点击开始按钮', '完成任务'],
  docContent: '',
  structureContent: ''
})

const askAI = (prompt: string) => {
  const event = new CustomEvent('ai-prompt', { detail: prompt })
  window.dispatchEvent(event)
}

const generateDoc = () => {
  const prompt = `基于以下信息生成一份产品方案文档：
  1. MVP 功能列表：${features.value.join(', ')}
  2. 产品边界（不做什么）：${boundaries.value}
  3. 用户流程：${userFlows.value.join(' -> ')}
  `
  askAI(prompt)
}
</script>

<style scoped lang="scss">
.product-module {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mt-4 {
  margin-top: 16px;
}

.h-full {
  height: 100%;
}

.label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #666;
}

.doc-editor, .code-editor {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  background-color: #fafafc;
}
</style>
