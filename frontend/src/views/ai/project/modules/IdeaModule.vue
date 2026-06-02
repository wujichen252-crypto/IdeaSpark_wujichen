<template>
  <div class="idea-module">
    <!-- 顶部：核心思考卡片 -->
    <div class="analysis-cards">
      <n-grid :x-gap="16" :y-gap="16" :cols="3">
        <n-grid-item>
          <n-card title="用户痛点" size="small" class="analysis-card">
            <template #header-extra>
              <n-button
text
size="tiny"
type="primary"
@click="askAI('帮我分析目标用户的核心痛点')">
                <template #icon><n-icon><BulbOutline /></n-icon></template>
                AI 分析
              </n-button>
            </template>
            <n-input
              v-model:value="painPoints"
              type="textarea"
              placeholder="用户面临的最大问题是什么？为什么现有的解决方案不够好？"
              :autosize="{ minRows: 4, maxRows: 8 }"
            />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="目标用户" size="small" class="analysis-card">
            <template #header-extra>
              <n-button
text
size="tiny"
type="primary"
@click="askAI('帮我描绘目标用户画像')">
                <template #icon><n-icon><PeopleOutline /></n-icon></template>
                AI 画像
              </n-button>
            </template>
            <n-input
              v-model:value="targetUsers"
              type="textarea"
              placeholder="谁会使用这个产品？他们的年龄、职业、兴趣是什么？"
              :autosize="{ minRows: 4, maxRows: 8 }"
            />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="核心价值" size="small" class="analysis-card">
             <template #header-extra>
              <n-button
text
size="tiny"
type="primary"
@click="askAI('帮我提炼产品的核心价值主张')">
                <template #icon><n-icon><DiamondOutline /></n-icon></template>
                AI 提炼
              </n-button>
            </template>
            <n-input
              v-model:value="coreValue"
              type="textarea"
              placeholder="我们提供什么独特的价值？一句话介绍这个产品。"
              :autosize="{ minRows: 4, maxRows: 8 }"
            />
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>

    <!-- 中部：竞品分析 (简版) -->
    <div class="competitor-section mt-4">
      <n-card title="竞品思路对比" size="small">
        <n-dynamic-input
          v-model:value="competitors"
          preset="pair"
          key-placeholder="竞品名称"
          value-placeholder="优缺点分析"
        />
        <div class="mt-2 text-right">
           <n-button size="small" dashed @click="askAI('帮我列出潜在的竞品并分析优劣势')">
             <template #icon><n-icon><SearchOutline /></n-icon></template>
             让 AI 寻找竞品
           </n-button>
        </div>
      </n-card>
    </div>

    <!-- 底部：需求文档输出 -->
    <div class="document-section mt-4">
      <n-card title="需求分析说明书 (Output)" size="small">
        <template #header-extra>
           <n-button
size="small"
type="primary"
secondary
@click="generateDoc">
             <template #icon><n-icon><DocumentTextOutline /></n-icon></template>
             生成文档
           </n-button>
        </template>
        <n-input
          v-model:value="docContent"
          type="textarea"
          placeholder="此处将生成完整的需求分析说明书..."
          :autosize="{ minRows: 10 }"
          class="doc-editor"
        />
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  BulbOutline, 
  PeopleOutline, 
  DiamondOutline, 
  SearchOutline, 
  DocumentTextOutline 
} from '@vicons/ionicons5'
import { useAiModuleData } from '@/composables/useAiModule'

const {
  painPoints,
  targetUsers,
  coreValue,
  competitors,
  docContent
} = useAiModuleData('idea', {
  painPoints: '',
  targetUsers: '',
  coreValue: '',
  competitors: [{ key: '', value: '' }],
  docContent: ''
})

const askAI = (prompt: string) => {
  // 触发 AI 对话 (通过 EventBus 或者 Store Action)
  // 这里简单模拟，实际上应该调用 Chat 组件的方法
  // 由于 Chat 组件在兄弟节点，可以通过 Store 传递意图，或者 EventBus
  // 为了简单，我们这里假设用户会手动去右边输入，这里只是 Copy to Clipboard 或者 提示
  
  // 更好的方式：调用 chatStore.setInput(prompt)
  // 但是 chatStore 目前没有 setInput。
  // 我们可以在 workbench 监听事件。
  
  // 临时方案：
  const event = new CustomEvent('ai-prompt', { detail: prompt })
  window.dispatchEvent(event)
}

const generateDoc = () => {
  const prompt = `基于以下信息生成一份需求分析说明书：
  1. 用户痛点：${painPoints.value}
  2. 目标用户：${targetUsers.value}
  3. 核心价值：${coreValue.value}
  4. 竞品分析：${JSON.stringify(competitors.value)}
  `
  askAI(prompt)
}
</script>

<style scoped lang="scss">
.idea-module {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mt-4 {
  margin-top: 16px;
}

.text-right {
  text-align: right;
}

.doc-editor {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  background-color: #fafafc;
}
</style>
