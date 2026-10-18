<template>
  <div class="workspace-sider-inner">
    <div class="sider-top">
      <n-button text class="back-btn" @click="ws.handleBack">
        <template #icon>
          <n-icon><ArrowBack /></n-icon>
        </template>
        返回
      </n-button>
    </div>

    <div v-if="ws.project.value" class="project-profile">
      <n-avatar
        :size="44"
        :style="{ backgroundColor: ws.stringToColor(ws.project.value.name || 'P') }"
      >
        {{ (ws.project.value.name || 'P')[0] }}
      </n-avatar>
      <div class="project-meta">
        <div class="project-name">{{ ws.project.value.name || '未命名项目' }}</div>
        <div class="project-desc">{{ ws.project.value.description || '暂无简介' }}</div>
      </div>
    </div>
    <n-empty
v-else
description="项目不存在"
size="small"
class="project-empty" />

    <n-divider />

    <n-menu v-model:value="ws.activeMenuKey.value" :options="ws.menuOptions.value" />
  </div>
</template>

<script setup lang="ts">
import { NButton, NIcon, NAvatar, NEmpty, NDivider, NMenu } from 'naive-ui'
import { ArrowBack } from '@vicons/ionicons5'
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace'

const ws = useProjectWorkspaceContext()
</script>
