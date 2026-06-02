<template>
  <div class="feasibility-module">
    <n-grid :x-gap="16" :y-gap="16" :cols="2">
      <!-- 左列：商业与市场 -->
      <n-grid-item>
        <n-card title="商业可行性评估" size="small" class="h-full">
          <template #header-extra>
            <n-button
text
size="tiny"
type="primary"
@click="askAI('分析这个项目的商业变现模式和潜在市场规模')">
              <template #icon><n-icon><TrendingUpOutline /></n-icon></template>
              AI 评估
            </n-button>
          </template>
          
          <n-form label-placement="top">
            <n-form-item label="变现模式 (Monetization)">
              <n-input
v-model:value="monetization"
type="textarea"
placeholder="例如：订阅制、广告、按次付费..."
:autosize="{ minRows: 2 }" />
            </n-form-item>
            <n-form-item label="获客渠道 (Acquisition)">
              <n-input
v-model:value="acquisition"
type="textarea"
placeholder="用户从哪里来？SEO、社交媒体、地推..."
:autosize="{ minRows: 2 }" />
            </n-form-item>
             <n-form-item label="成本结构 (Cost Structure)">
              <n-input
v-model:value="costStructure"
type="textarea"
placeholder="主要成本在哪里？服务器、人力、营销..."
:autosize="{ minRows: 2 }" />
            </n-form-item>
          </n-form>
        </n-card>
      </n-grid-item>

      <!-- 右列：风险与实现 -->
      <n-grid-item>
        <n-card title="风险与实现难度" size="small" class="h-full">
           <template #header-extra>
            <n-button
text
size="tiny"
type="primary"
@click="askAI('列出这个项目可能面临的法律和运营风险')">
              <template #icon><n-icon><WarningOutline /></n-icon></template>
              AI 预警
            </n-button>
          </template>

          <n-form label-placement="top">
             <n-form-item label="技术实现难度评估 (非代码)">
              <n-rate v-model:value="techDifficulty" :count="5" />
              <span class="ml-2 text-gray-500">{{ difficultyLabel }}</span>
            </n-form-item>
            <n-form-item label="潜在风险清单">
              <n-dynamic-input v-model:value="risks" placeholder="风险点" />
            </n-form-item>
            <n-form-item label="法律/合规问题">
               <n-input
v-model:value="legalIssues"
type="textarea"
placeholder="数据隐私、版权、资质许可..."
:autosize="{ minRows: 3 }" />
            </n-form-item>
          </n-form>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 底部：评估报告 -->
    <div class="report-section mt-4">
      <n-card title="可行性评估报告 (Feasibility Report)" size="small">
         <template #header-extra>
            <n-button
size="small"
type="primary"
secondary
@click="generateReport">
              <template #icon><n-icon><DocumentTextOutline /></n-icon></template>
              生成评估报告
            </n-button>
        </template>
        <n-input
          v-model:value="reportContent"
          type="textarea"
          placeholder="此处将生成完整的可行性评估报告..."
          :autosize="{ minRows: 10 }"
          class="doc-editor"
        />
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  TrendingUpOutline, 
  WarningOutline, 
  DocumentTextOutline 
} from '@vicons/ionicons5'
import { useAiModuleData } from '@/composables/useAiModule'

const {
  monetization,
  acquisition,
  costStructure,
  techDifficulty,
  risks,
  legalIssues,
  reportContent
} = useAiModuleData('feasibility', {
  monetization: '',
  acquisition: '',
  costStructure: '',
  techDifficulty: 3,
  risks: [''],
  legalIssues: '',
  reportContent: ''
})

const difficultyLabel = computed(() => {
  const labels = ['极易', '简单', '中等', '困难', '极难']
  return labels[techDifficulty.value - 1] || '中等'
})

const askAI = (prompt: string) => {
  const event = new CustomEvent('ai-prompt', { detail: prompt })
  window.dispatchEvent(event)
}

const generateReport = () => {
  const prompt = `基于以下信息生成一份可行性评估报告：
  1. 变现模式：${monetization.value}
  2. 获客渠道：${acquisition.value}
  3. 成本结构：${costStructure.value}
  4. 实现难度：${difficultyLabel.value}
  5. 风险清单：${risks.value.join(', ')}
  6. 法律合规：${legalIssues.value}
  `
  askAI(prompt)
}
</script>

<style scoped>
.feasibility-module {
  height: 100%;
}
</style>
