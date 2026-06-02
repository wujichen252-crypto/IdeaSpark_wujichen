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
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  transition: all 0.2s ease;
  height: 100%;
  cursor: pointer;
  
  &:hover {
    border-color: #d1d5db;
    background-color: #f9fafb;
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
      border-radius: 10px;
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
        color: #1f2937;
        font-size: 15px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .plugin-author {
        font-size: 12px;
        color: #6b7280;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
  
  .plugin-desc {
    font-size: 13px;
    color: #4b5563;
    line-height: 1.5;
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
      font-size: 12px;
      color: #9ca3af;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
