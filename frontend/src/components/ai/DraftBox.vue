<template>
  <div class="draft-box">
    <div class="box-header">
      <h4>草稿箱</h4>
      <n-space>
        <n-switch v-model:value="autoSave">自动保存</n-switch>
      </n-space>
    </div>
    
    <n-empty v-if="drafts.length === 0" description="暂无草稿" size="small">
      <template #extra>
        <n-text depth="3">开始创建项目后可保存草稿</n-text>
      </template>
    </n-empty>
    
    <div v-else class="draft-list">
      <n-card 
        v-for="d in drafts" 
        :key="d.id" 
        :bordered="false" 
        class="draft-item" 
        hoverable
      >
        <div class="item-main">
          <div class="title">{{ d.name || '未命名项目' }}</div>
          <div class="meta">
            <span>分类：{{ d.category || '未分类' }}</span>
            <span>保存时间：{{ formatTime(d.updatedAt) }}</span>
          </div>
          <div v-if="(d.plugins || []).length" class="tags">
            <n-tag
v-for="p in (d.plugins || [])"
:key="p"
size="small"
round
class="mr-2">
{{ p }}
</n-tag>
          </div>
        </div>
        <div class="item-actions">
          <n-button size="small" type="primary" @click="continueProject(d.id)">继续</n-button>
          <n-button size="small" ghost @click="editSettings(d.id)">设置</n-button>
          <n-button
size="small"
type="error"
ghost
@click="deleteDraft(d.id)">
删除
</n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAiWorkshopStore } from '@/store/modules/aiWorkshop'

const router = useRouter()
const store = useAiWorkshopStore()

const autoSave = ref(false)

const drafts = computed(() => store.projectList.filter(p => p.status === 'draft'))

/**
 * 继续项目编辑
 * @param id 项目ID
 */
function continueProject(id: string) {
  const project = store.getProjectById(id)
  if (project && project.type === 'document') {
    router.push(`/project/doc/${id}`)
  } else {
    router.push(`/project/${id}`)
  }
}

/**
 * 进入项目设置
 * @param id 项目ID
 */
function editSettings(id: string) {
  store.initProject(id)
  router.push({ name: 'AiProjectSettings', params: { id } })
}

/**
 * 删除草稿
 * @param id 项目ID
 */
function deleteDraft(id: string) {
  store.deleteProject(id)
}

/**
 * 时间格式化
 * @param ts 时间戳
 */
function formatTime(ts: number) {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped lang="scss">
.draft-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h4 {
    margin: 0;
  }
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.draft-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .item-main {
    .title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 6px;
    }
    .meta {
      font-size: 12px;
      color: #6b7280;
      display: flex;
      gap: 12px;
    }
    .tags {
      margin-top: 8px;
    }
  }
}
</style>
