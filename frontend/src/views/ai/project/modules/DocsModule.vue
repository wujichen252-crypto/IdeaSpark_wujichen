<template>
  <div class="docs-module">
    <div class="header-section mb-4">
      <n-alert title="文档交付中心" type="info">
        这里汇集了项目全流程生成的所有关键文档。你可以预览、编辑并导出它们，作为项目的最终交付物。
      </n-alert>
    </div>

    <n-grid :x-gap="16" :y-gap="16" :cols="3">
      <!-- 文档列表 -->
      <n-grid-item>
        <n-card title="项目文档清单" size="small" class="h-full">
          <n-list hoverable clickable>
            <n-list-item v-for="doc in docs" :key="doc.id" @click="currentDoc = doc">
              <template #prefix>
                <n-icon :component="DocumentTextOutline" color="#18a058" />
              </template>
              <div class="flex justify-between items-center w-full">
                <span>{{ doc.title }}</span>
                <n-tag size="tiny" :type="doc.status === 'completed' ? 'success' : 'default'">
                  {{ doc.status === 'completed' ? '已生成' : '待生成' }}
                </n-tag>
              </div>
            </n-list-item>
          </n-list>
          <div class="mt-4">
             <n-button block dashed @click="askAI('帮我生成一份项目对外介绍 PPT 的大纲')">
               <template #icon><n-icon><AddOutline /></n-icon></template>
               生成新文档
             </n-button>
          </div>
        </n-card>
      </n-grid-item>

      <!-- 文档预览与编辑 -->
      <n-grid-item :span="2">
        <n-card :title="currentDoc?.title || '选择文档预览'" size="small" class="h-full">
          <template v-if="currentDoc" #header-extra>
            <n-space>
              <n-button
size="tiny"
secondary
type="primary"
@click="askAI(`帮我润色这篇文档：${currentDoc.title}`)">
                <template #icon><n-icon><SparklesOutline /></n-icon></template>
                AI 润色
              </n-button>
              <n-button size="tiny" type="primary" @click="handleExport">
                <template #icon><n-icon><DownloadOutline /></n-icon></template>
                导出 PDF
              </n-button>
            </n-space>
          </template>
          
          <div v-if="currentDoc" class="doc-preview">
            <n-input
              v-model:value="currentDoc.content"
              type="textarea"
              :autosize="{ minRows: 15 }"
              class="doc-editor-full"
              placeholder="文档内容..."
            />
          </div>
          <div v-else class="empty-preview">
            <n-empty description="请从左侧选择一个文档查看" />
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { 
  DocumentTextOutline, 
  DownloadOutline, 
  SparklesOutline,
  AddOutline
} from '@vicons/ionicons5'
import { useAiModuleData } from '@/composables/useAiModule'

interface ProjectDoc {
  id: string
  title: string
  type: string
  status: 'pending' | 'completed'
  content: string
}

const defaultDocs: ProjectDoc[] = [
  { id: 'prd', title: '需求分析说明书', type: 'analysis', status: 'completed', content: '# 需求分析说明书\n\n## 1. 背景...' },
  { id: 'solution', title: '产品方案文档', type: 'solution', status: 'completed', content: '# 产品方案文档\n\n## 1. 功能...' },
  { id: 'brand', title: '品牌手册', type: 'brand', status: 'completed', content: '# 品牌手册\n\n## 1. 核心...' },
  { id: 'visual', title: '视觉方向说明书', type: 'visual', status: 'pending', content: '' },
  { id: 'feasibility', title: '可行性评估报告', type: 'feasibility', status: 'pending', content: '' },
  { id: 'pitch', title: '项目路演 PPT 大纲', type: 'pitch', status: 'pending', content: '' }
]

const { docs } = useAiModuleData('docs', {
  docs: defaultDocs
})

const currentDoc = ref<ProjectDoc | null>(null)

watchEffect(() => {
  if (!currentDoc.value && docs.value && docs.value.length > 0) {
    currentDoc.value = docs.value[0] ?? null
  }
})

const askAI = (prompt: string) => {
  const event = new CustomEvent('ai-prompt', { detail: prompt })
  window.dispatchEvent(event)
}

const handleExport = () => {
  console.log('Exporting:', currentDoc.value?.title)
  // Implement export logic here
}
</script>

<style scoped>
.docs-module {
  height: 100%;
}
.doc-editor-full {
  font-family: monospace;
}
.empty-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}
</style>
