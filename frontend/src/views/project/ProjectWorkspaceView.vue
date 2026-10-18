<template>
  <n-layout class="project-workspace" has-sider>
    <n-layout-sider
      bordered
      width="260"
      :native-scrollbar="false"
      class="workspace-sider"
    >
      <WorkspaceSider />
    </n-layout-sider>

    <n-layout-content class="workspace-content">
      <WorkspaceContentHeader />
      <div class="content-body">
        <div class="content-body-inner">
          <n-empty v-if="!ws.project.value" description="项目不存在或加载失败" />
          <template v-else>
            <WorkspaceHomePanel v-if="ws.activeMenuKey.value === 'home'" />
            <WorkspaceFilesPanel v-else-if="ws.activeMenuKey.value === 'files'" />
            <WorkspaceMembersPanel v-else-if="ws.activeMenuKey.value === 'members'" />
            <WorkspaceSettingsPanel v-else-if="ws.activeMenuKey.value === 'settings'" />
            <WorkspacePluginsPanel v-else-if="ws.activeMenuKey.value === 'plugins'" />
          </template>
        </div>
      </div>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { provide, onMounted } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent, NEmpty } from 'naive-ui'
import { createProjectWorkspace, WORKSPACE_KEY } from '@/composables/useProjectWorkspace'
import WorkspaceSider from '@/components/workspace/WorkspaceSider.vue'
import WorkspaceContentHeader from '@/components/workspace/WorkspaceContentHeader.vue'
import WorkspaceHomePanel from '@/components/workspace/WorkspaceHomePanel.vue'
import WorkspaceFilesPanel from '@/components/workspace/WorkspaceFilesPanel.vue'
import WorkspaceMembersPanel from '@/components/workspace/WorkspaceMembersPanel.vue'
import WorkspaceSettingsPanel from '@/components/workspace/WorkspaceSettingsPanel.vue'
import WorkspacePluginsPanel from '@/components/workspace/WorkspacePluginsPanel.vue'

const ws = createProjectWorkspace()
provide(WORKSPACE_KEY, ws)
onMounted(() => ws.init())
</script>

<style lang="scss" src="./ProjectWorkspaceView.scss" />
