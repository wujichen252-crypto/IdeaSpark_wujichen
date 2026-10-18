<template>
  <div class="panel">
    <n-card size="small" title="成员管理" class="section-card">
      <n-empty v-if="ws.projectMembers.value.length === 0" description="暂无成员信息" size="small" />
      <n-list v-else hoverable clickable>
        <n-list-item v-for="m in ws.projectMembers.value" :key="m.id">
          <template #prefix>
            <n-avatar round size="small" :src="m.avatar || undefined">
              {{ (m.nickname || m.username || 'U').charAt(0) }}
            </n-avatar>
          </template>
          <div class="member-item">
            <div class="member-name">{{ m.nickname || m.username }}</div>
            <n-tag
              size="small"
              round
              :bordered="false"
              :type="m.role === 'owner' ? 'success' : 'default'"
            >
              {{ m.roleCn || (m.role === 'owner' ? '负责人' : '成员') }}
            </n-tag>
          </div>
        </n-list-item>
      </n-list>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { NCard, NEmpty, NList, NListItem, NAvatar, NTag } from 'naive-ui'
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace'

const ws = useProjectWorkspaceContext()
</script>
