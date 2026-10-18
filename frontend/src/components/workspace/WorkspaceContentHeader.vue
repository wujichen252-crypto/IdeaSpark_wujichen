<template>
  <div class="content-header">
    <div class="content-header-inner">
      <div class="content-title">{{ ws.currentTitle.value }}</div>
      <div class="content-actions">
        <n-space size="small">
          <template v-if="ws.activeMenuKey.value === 'home'">
            <n-button
v-if="!ws.isHomeEditing.value"
size="small"
:disabled="!ws.project.value"
@click="ws.startHomeEdit">编辑信息</n-button>
            <template v-else>
              <n-button size="small" @click="ws.cancelHomeEdit">取消</n-button>
              <n-button
type="primary"
size="small"
:loading="ws.saving.value"
@click="ws.saveHomeEdit">保存</n-button>
            </template>
          </template>
        </n-space>
        <n-button
          v-if="ws.activeMenuKey.value === 'settings'"
          type="primary"
          size="small"
          :disabled="!ws.project.value"
          :loading="ws.saving.value"
          @click="ws.saveSettings"
        >
          保存设置
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NSpace, NButton } from 'naive-ui'
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace'

const ws = useProjectWorkspaceContext()
</script>
