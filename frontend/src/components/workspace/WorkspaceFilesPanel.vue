<template>
  <div class="panel">
    <div class="files-toolbar">
      <n-input
v-model:value="ws.fileSearch.value"
placeholder="搜索文件..."
clearable
class="files-search" />
      <n-dropdown :options="ws.artifactCreateOptions" @select="ws.handleArtifactCreateSelect">
        <n-button>新建资产</n-button>
      </n-dropdown>
      <n-button type="primary" @click="ws.openAddFileModal">新增文件</n-button>
    </div>
    <n-card size="small" title="文件列表" class="section-card">
      <n-empty v-if="ws.filteredFiles.value.length === 0" description="暂无文件" />
      <n-list v-else hoverable clickable>
        <n-list-item
v-for="f in ws.filteredFiles.value"
:key="f.id"
class="file-row"
@click="ws.openFile(f)">
          <template #prefix>
            <div class="file-badge" :class="`file-${f.type}`"></div>
          </template>
          <div class="file-item">
            <div class="file-name">{{ f.name }}</div>
            <div class="file-meta">
              <span>{{ ws.formatDateTime(f.updatedAt) }}</span>
              <span v-if="typeof f.size === 'number'"> · {{ ws.formatSize(f.size) }}</span>
            </div>
          </div>
          <template #suffix>
            <div class="file-suffix" @click.stop>
              <n-tag
                size="small"
                round
                :bordered="false"
                :type="ws.fileTypeTagType(f.type)"
              >
                {{ ws.fileTypeLabel(f.type) }}
              </n-tag>
              <n-button
                class="file-delete-btn"
                size="tiny"
                text
                type="default"
                @click.stop="ws.handleDeleteFile(f)"
              >
                <template #icon>
                  <n-icon size="16"><TrashOutline /></n-icon>
                </template>
              </n-button>
            </div>
          </template>
        </n-list-item>
      </n-list>
    </n-card>

    <n-modal v-model:show="ws.showAddFileModal.value" preset="dialog" title="新增文件">
      <n-space vertical size="small">
        <n-select
v-model:value="ws.createFilePluginId.value"
:options="ws.createFilePluginOptions.value"
placeholder="请选择生成插件" />
        <n-input
v-model:value="ws.newFileTitle.value"
placeholder="请输入文件名称，例如：需求文档"
@keyup.enter="ws.confirmAddFile" />
        <n-space align="center">
          <n-switch v-model:value="ws.useAiGenerate.value" />
          <span style="font-size: 13px; color: #6b7280;">使用 AI 生成内容</span>
        </n-space>
        <n-space justify="end">
          <n-button @click="ws.cancelAddFile">取消</n-button>
          <n-button type="primary" @click="ws.confirmAddFile">确定</n-button>
        </n-space>
      </n-space>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import {
  NInput,
  NDropdown,
  NButton,
  NCard,
  NEmpty,
  NList,
  NListItem,
  NModal,
  NSpace,
  NTag,
  NIcon,
  NSwitch,
  NSelect
} from 'naive-ui'
import { TrashOutline } from '@vicons/ionicons5'
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace'

const ws = useProjectWorkspaceContext()
</script>
