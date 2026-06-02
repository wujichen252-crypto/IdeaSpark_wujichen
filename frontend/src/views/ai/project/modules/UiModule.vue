<template>
  <div class="ui-module">
    <n-grid :x-gap="16" :y-gap="16" :cols="24">
      <!-- 左侧：视觉风格定义 -->
      <n-grid-item :span="10">
        <n-card title="视觉风格 (Visual Style)" size="small" class="h-full">
          <template #header-extra>
            <n-button
text
size="tiny"
type="primary"
@click="askAI('根据我的产品定位，推荐 3 种合适的视觉风格')">
              <template #icon><n-icon><ColorPaletteOutline /></n-icon></template>
              AI 推荐
            </n-button>
          </template>
          
          <n-form label-placement="top">
            <n-form-item label="整体风格">
              <n-select v-model:value="visualStyle" :options="styleOptions" placeholder="选择风格" />
            </n-form-item>
            
            <n-form-item label="主色调 (Primary Color)">
              <div class="flex gap-2 items-center">
                <n-color-picker v-model:value="primaryColor" :show-alpha="false" />
                <n-input v-model:value="primaryColor" placeholder="#HEX" />
              </div>
            </n-form-item>

            <n-form-item label="辅助色 (Secondary Colors)">
              <n-dynamic-tags v-model:value="secondaryColors" />
            </n-form-item>

            <n-form-item label="设计关键词">
              <n-select
                v-model:value="designKeywords"
                multiple
                filterable
                tag
                placeholder="输入或选择关键词"
                :options="keywordOptions"
              />
            </n-form-item>
          </n-form>
        </n-card>
      </n-grid-item>

      <!-- 右侧：Logo 与 结构 -->
      <n-grid-item :span="14">
        <n-flex vertical size="medium">
          <n-card title="Logo 概念设计" size="small">
             <template #header-extra>
                <n-button
text
size="tiny"
type="primary"
@click="askAI('基于品牌名称和调性，生成 3 个 Logo 设计创意描述')">
                  <template #icon><n-icon><ShapesOutline /></n-icon></template>
                  AI 构思
                </n-button>
             </template>
             <n-input
                v-model:value="logoConcept"
                type="textarea"
                placeholder="描述 Logo 的形状、隐喻和视觉元素..."
                :autosize="{ minRows: 3, maxRows: 5 }"
              />
          </n-card>

          <n-card title="页面结构草案 (Layout)" size="small" class="flex-1">
             <template #header-extra>
                <n-button
text
size="tiny"
type="primary"
@click="askAI('为首页规划一个高转化率的区块结构')">
                  <template #icon><n-icon><LayersOutline /></n-icon></template>
                  AI 规划
                </n-button>
             </template>
             <n-input
                v-model:value="layoutStructure"
                type="textarea"
                placeholder="- 顶部导航 (Logo + 登录)\n- Hero 区域 (Slogan + CTA)\n- 核心功能展示 (3列布局)\n..."
                :autosize="{ minRows: 6 }"
                class="code-editor"
              />
          </n-card>
        </n-flex>
      </n-grid-item>
    </n-grid>

    <!-- 底部：交付物 -->
    <div class="deliverables-section mt-4">
      <n-card title="视觉方向说明书 (Visual Guide)" size="small">
          <template #header-extra>
            <n-button
size="small"
type="primary"
secondary
@click="generateGuide">
              <template #icon><n-icon><DocumentTextOutline /></n-icon></template>
              生成视觉指南
            </n-button>
        </template>
        <n-input
          v-model:value="guideContent"
          type="textarea"
          placeholder="此处将生成完整的视觉方向说明书..."
          :autosize="{ minRows: 8 }"
          class="doc-editor"
        />
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ColorPaletteOutline, 
  ShapesOutline, 
  LayersOutline,
  DocumentTextOutline 
} from '@vicons/ionicons5'
import { useAiModuleData } from '@/composables/useAiModule'

const {
  visualStyle,
  primaryColor,
  secondaryColors,
  designKeywords,
  logoConcept,
  layoutStructure,
  guideContent
} = useAiModuleData('ui', {
  visualStyle: null,
  primaryColor: '#18A058',
  secondaryColors: ['#FFFFFF', '#000000'],
  designKeywords: [],
  logoConcept: '',
  layoutStructure: '',
  guideContent: ''
})

const styleOptions = [
  { label: '极简主义 (Minimalist)', value: 'minimalist' },
  { label: '扁平化 (Flat)', value: 'flat' },
  { label: '科技感 (Futuristic)', value: 'futuristic' },
  { label: '新拟态 (Neumorphism)', value: 'neumorphism' },
  { label: '手绘风 (Hand-drawn)', value: 'hand-drawn' },
  { label: '复古 (Retro)', value: 'retro' }
]

const keywordOptions = [
  { label: '干净', value: 'clean' },
  { label: '留白', value: 'whitespace' },
  { label: '圆角', value: 'rounded' },
  { label: '渐变', value: 'gradient' },
  { label: '高对比度', value: 'high-contrast' }
]

const askAI = (prompt: string) => {
  const context = `当前视觉设定：风格=${visualStyle.value}, 主色=${primaryColor.value}, 关键词=${designKeywords.value.join(',')}`
  const fullPrompt = `${context}\n请求：${prompt}`
  const event = new CustomEvent('ai-prompt', { detail: fullPrompt })
  window.dispatchEvent(event)
}

const generateGuide = () => {
  const prompt = `基于以下信息生成一份视觉方向说明书：
  1. 风格：${visualStyle.value}
  2. 颜色：主色 ${primaryColor.value}, 辅助色 ${secondaryColors.value.join(', ')}
  3. Logo 概念：${logoConcept.value}
  4. 页面结构：\n${layoutStructure.value}
  `
  askAI(prompt)
}
</script>

<style scoped>
.ui-module {
  height: 100%;
}
</style>