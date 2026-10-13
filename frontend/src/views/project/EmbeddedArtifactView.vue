<template>
  <EmbeddedEditor
    v-if="artifactType"
    :artifact-type="artifactType"
    :project-id="projectId"
    :file-id="fileId"
    :initial-name="fileName"
    :readonly="readonly"
  />
  <div v-else class="artifact-error">
    <n-empty description="不支持的资产类型" />
  </div>
</template>

<script setup lang="ts">
/**
 * 嵌入式资产编辑页
 * @description 路由入口，按 type 参数渲染统一壳组件 EmbeddedEditor
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import EmbeddedEditor from '@/components/embedded/EmbeddedEditor.vue'
import type { ArtifactType } from '@/components/embedded/types'

const VALID_TYPES: ArtifactType[] = ['whiteboard', 'mindmap', 'flow']

const route = useRoute()

const projectId = route.params.id as string
const fileId = route.params.fileId as string

const artifactType = computed<ArtifactType | null>(() => {
  const t = route.params.type as ArtifactType
  return VALID_TYPES.includes(t) ? t : null
})

const fileName = computed(() => (route.query.name as string) || '')
const readonly = computed(() => route.query.readonly === '1')
</script>

<style scoped lang="scss">
.artifact-error {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
