<template>
  <div class="ai-project-layout">
    <div class="layout-content">
      <router-view v-slot="{Component}">
        <keep-alive include="AiProjectWorkbench">
          <component :is="Component" v-if="currentProject" />
        </keep-alive>
      </router-view>
      <div v-if="!currentProject" class="loading-state">
        <n-spin size="large" description="正在加载项目信息..." />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAiWorkshopStore } from '@/store/modules/aiWorkshop'

const route = useRoute()
const store = useAiWorkshopStore()

const currentProject = computed(() => {
  if (!store.currentProjectId) return null
  return {
    id: store.currentProjectId,
    title: store.projectInfo.name || '未命名项目'
  }
})

// 确保路由参数变化时更新当前项目
watch(
  () => route.params.id,
  (newId) => {
    if (newId && typeof newId === 'string' && newId !== store.currentProjectId) {
      store.initProject(newId)
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.ai-project-layout {
  height: 100vh;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.layout-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.loading-state {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
