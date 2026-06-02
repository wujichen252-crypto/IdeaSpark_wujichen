<template>
  <n-card class="tool-card" hoverable>
    <div class="tool-content">
      <div class="tool-icon" :style="{ backgroundColor: resolveColor(tool.color) }">
        <component :is="getIcon(tool.icon)" class="icon-svg" />
      </div>
      <div class="tool-info">
        <div class="tool-title-row">
          <h3 class="tool-name">{{ tool.name }}</h3>
          <n-tag
v-if="tool.source === 'official'"
type="success"
size="tiny"
round>
            免费
          </n-tag>
          <n-tag
v-else
type="error"
size="tiny"
round>Pro</n-tag>
        </div>
        <p class="tool-desc">{{ tool.description }}</p>
        <div class="tool-meta">
          <span class="meta-item">
            <n-icon size="14"><PeopleOutline /></n-icon>
            <span>{{ formatUsageCount(tool.usageCount) }} 使用</span>
          </span>
          <span v-if="tool.source === 'premium'" class="meta-item price">
            <span>¥{{ tool.price }}/月</span>
          </span>
        </div>
        <div v-if="tool.tags" class="tool-tags">
          <n-tag
            v-for="tag in tool.tags.split(',').slice(0, 3)"
            :key="tag"
            size="tiny"
            round
            :bordered="false"
            class="tag-item"
          >
            {{ tag.trim() }}
          </n-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="tool-footer">
        <n-button
text
type="primary"
size="small"
@click="emit('detail', tool)">
          查看详情
        </n-button>
        <n-button
          v-if="owned"
          type="success"
          size="small"
          disabled
        >
          已拥有
        </n-button>
        <n-button
          v-else-if="tool.source === 'official'"
          type="success"
          size="small"
          @click="emit('freeUse', tool)"
        >
          免费使用
        </n-button>
        <n-button
          v-else
          type="primary"
          size="small"
          @click="emit('purchase', tool)"
        >
          立即开通
        </n-button>
      </div>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { PeopleOutline } from '@vicons/ionicons5'
import type { Component } from 'vue'
import {
  DocumentTextOutline,
  DocumentOutline,
  GridOutline,
  EaselOutline,
  SparklesOutline,
  ImageOutline,
  VideocamOutline,
  MusicalNotesOutline,
  ColorPaletteOutline,
  CodeSlashOutline,
  BarChartOutline,
  LanguageOutline
} from '@vicons/ionicons5'
import type { Plugin } from '@/api/plugin'

const props = defineProps<{
  tool: Plugin
  owned?: boolean
}>()

const emit = defineEmits<{
  detail: [tool: Plugin]
  freeUse: [tool: Plugin]
  purchase: [tool: Plugin]
}>()

const iconMap: Record<string, Component> = {
  DocumentTextOutline,
  DocumentOutline,
  GridOutline,
  EaselOutline,
  SparklesOutline,
  ImageOutline,
  VideocamOutline,
  MusicalNotesOutline,
  ColorPaletteOutline,
  CodeSlashOutline,
  BarChartOutline,
  LanguageOutline
}

function getIcon(iconName: string): Component {
  return iconMap[iconName] || DocumentTextOutline
}

function resolveColor(color?: string): string {
  if (!color) return '#64748b'
  return color.startsWith('#') ? color : `#${color}`
}

function formatUsageCount(count?: number): string {
  const num = count || 0
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}
</script>

<style scoped lang="scss">
.tool-card {
  border-radius: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.15);
  }

  :deep(.n-card__content) {
    padding: 20px;
  }

  :deep(.n-card__footer) {
    padding: 12px 20px;
    border-top: 1px solid #f0f0f0;
  }
}

.tool-content {
  display: flex;
  gap: 16px;
}

.tool-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .icon-svg {
    width: 28px;
    height: 28px;
    color: #fff;
  }
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.tool-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.tool-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tool-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .price {
    color: #ef4444;
    font-weight: 600;
  }
}

.tool-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .tag-item {
    background: #f3f4f6;
    color: #6b7280;
  }
}

.tool-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
