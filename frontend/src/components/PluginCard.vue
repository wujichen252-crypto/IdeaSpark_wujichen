<template>
  <n-card hoverable size="small" class="plugin-card">
    <div class="plugin-header">
      <div class="plugin-icon" :style="{ backgroundColor: color }">
        <n-icon :component="icon" color="#fff" size="24" />
      </div>
      <div class="plugin-info">
        <div class="plugin-name">{{ title }}</div>
        <div class="plugin-author">{{ author }}</div>
      </div>
    </div>
    <div class="plugin-desc">
      {{ desc }}
    </div>
    <div class="plugin-footer">
      <div class="plugin-users">
        <n-icon :component="PeopleOutline" /> {{ stats }}
      </div>
      <n-button
size="small"
secondary
type="success"
class="install-btn"
@click.stop="$emit('install')">
安装
</n-button>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { PeopleOutline } from '@vicons/ionicons5'
import { NCard, NIcon, NButton } from 'naive-ui'

defineProps<{
  title: string
  author: string
  desc: string
  icon: Component
  color: string
  stats: string
}>()

defineEmits<{
  (e: 'install'): void
}>()
</script>

<style scoped lang="scss">
.plugin-card {
  border-radius: var(--nexus-radius-md);
  border: 1px solid var(--nexus-divider);
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  cursor: pointer;
  
  &:hover {
    border-color: var(--nexus-border-strong);
    background-color: var(--nexus-bg-subtle);
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .plugin-header {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    
    .plugin-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--nexus-radius-md);
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }
    
    .plugin-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      
      .plugin-name {
        font-weight: 600;
        color: var(--nexus-gray-800);
        font-size: var(--nexus-font-size-base);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .plugin-author {
        font-size: var(--nexus-font-size-xs);
        color: var(--nexus-text-tertiary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
  
  .plugin-desc {
    font-size: var(--nexus-font-size-sm);
    color: var(--nexus-text-secondary);
    line-height: var(--nexus-leading-compact);
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    height: 39px; // 2 lines
  }
  
  .plugin-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    
    .plugin-users {
      font-size: var(--nexus-font-size-xs);
      color: var(--nexus-text-quaternary);
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
