<template>
  <div class="panel plugin-panel">
    <div class="plugin-toolbar">
      <div class="toolbar-left">
        <n-radio-group v-model:value="ws.marketFilter.value" size="small">
          <n-radio-button value="all">全部</n-radio-button>
          <n-radio-button value="official">官方</n-radio-button>
          <n-radio-button value="community">社区</n-radio-button>
        </n-radio-group>
      </div>
      <div class="toolbar-right">
        <n-input
          v-model:value="ws.keyword.value"
          placeholder="搜索插件/工具..."
          clearable
          size="small"
          class="search-input"
        />
        <n-button type="primary" size="small" @click="ws.goToToolMarket">
          <template #icon>
            <n-icon><ExtensionPuzzleOutline /></n-icon>
          </template>
          去工具市场
        </n-button>
      </div>
    </div>

    <div class="plugin-sections">
      <n-card size="small" class="section-card" title="已启用（当前项目）">
        <div v-if="ws.enabledPlugins.value.length" class="plugin-grid">
          <n-card
            v-for="p in ws.enabledPlugins.value"
            :key="p.id"
            size="small"
            hoverable
            class="plugin-card"
          >
            <div class="plugin-card-body">
              <div class="plugin-icon" :style="{ background: p.color || '#3b82f6' }">
                <n-icon :component="ws.getPluginIcon(p.icon)" size="20" color="#fff" />
              </div>
              <div class="plugin-info">
                <div class="plugin-name">{{ p.name }}</div>
                <div class="plugin-desc">{{ p.description }}</div>
              </div>
            </div>
            <template #footer>
              <div class="plugin-footer">
                <n-tag
size="small"
round
:bordered="false"
type="success">
                  已启用
                </n-tag>
                <n-button
                  size="tiny"
                  secondary
                  type="error"
                  @click="ws.togglePlugin(p.id)"
                >
                  停用
                </n-button>
              </div>
            </template>
          </n-card>
        </div>
        <n-empty v-else description="暂无启用的插件" size="small" />
      </n-card>

      <n-card size="small" class="section-card" title="我的插件">
        <div v-if="ws.filteredMyPlugins.value.length" class="plugin-grid">
          <n-card
            v-for="p in ws.filteredMyPlugins.value"
            :key="p.id"
            size="small"
            hoverable
            class="plugin-card"
          >
            <div class="plugin-card-body">
              <div class="plugin-icon" :style="{ background: p.color || '#3b82f6' }">
                <n-icon :component="ws.getPluginIcon(p.icon)" size="20" color="#fff" />
              </div>
              <div class="plugin-info">
                <div class="plugin-name">{{ p.name }}</div>
                <div class="plugin-desc">{{ p.description }}</div>
              </div>
            </div>
            <template #footer>
              <div class="plugin-footer">
                <n-tag
                  size="small"
                  round
                  :bordered="false"
                  :type="p.source === 'official' ? 'info' : 'warning'"
                >
                  {{ p.source === 'official' ? '官方' : p.source === 'premium' ? '高级' : '社区' }}
                </n-tag>
                <n-button
                  size="tiny"
                  type="primary"
                  @click="ws.togglePlugin(p.id)"
                >
                  启用
                </n-button>
              </div>
            </template>
          </n-card>
        </div>
        <n-empty v-else description="暂无拥有的插件，去工具市场看看吧" size="small">
          <template #extra>
            <n-button type="primary" size="small" @click="ws.goToToolMarket">
              去工具市场
            </n-button>
          </template>
        </n-empty>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  NRadioGroup,
  NRadioButton,
  NInput,
  NButton,
  NCard,
  NIcon,
  NTag,
  NEmpty
} from 'naive-ui'
import { ExtensionPuzzleOutline } from '@vicons/ionicons5'
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace'

const ws = useProjectWorkspaceContext()
</script>
