<template>
  <div class="panel">
    <n-card size="small" title="项目设置" class="section-card">
      <n-form :model="ws.settingsForm" label-placement="left" label-width="90">
        <n-form-item label="项目名称" path="name">
          <n-input v-model:value="ws.settingsForm.name" placeholder="请输入项目名称" />
        </n-form-item>
        <n-form-item label="项目简介" path="description">
          <n-input
            v-model:value="ws.settingsForm.description"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="请输入项目简介"
          />
        </n-form-item>
        <n-form-item label="项目分类" path="category">
          <n-input v-model:value="ws.settingsForm.category" placeholder="例如：SaaS 产品 / APP / 文档" />
        </n-form-item>
        <n-form-item label="可见性" path="visibility">
          <n-select v-model:value="ws.settingsForm.visibility" :options="ws.visibilityOptions" />
        </n-form-item>
        <n-form-item label="允许 Fork" path="allowFork">
          <n-switch v-model:value="ws.settingsForm.allowFork" />
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NSelect, NSwitch } from 'naive-ui'
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace'

const ws = useProjectWorkspaceContext()
</script>
