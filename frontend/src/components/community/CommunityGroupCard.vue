<template>
  <div
    class="group-card glass-panel"
    :style="{ animationDelay: `${0.3 + index * 0.1}s` }"
    @click="ctx.selectGroupById(group.id)"
  >
    <div class="group-cover-wrapper">
      <img
        :src="group.coverUrl || defaultCover"
        class="group-cover"
        @error="ctx.handleImageError"
      />
      <div class="group-overlay"></div>
    </div>
    <div class="group-card-body">
      <img
        :src="group.iconUrl || ctx.defaultGroupIcon"
        :alt="group.name"
        class="group-card-icon"
        @error="ctx.handleImageError"
      />
      <div class="group-card-info">
        <h3 class="group-card-name">{{ group.name }}</h3>
        <p class="group-card-keyword">#{{ group.keyword || '通用圈子' }}</p>
      </div>
      <p class="group-card-desc">{{ group.description || '这个圈子还没有描述...' }}</p>
      <div class="group-card-footer">
        <span class="member-count">
          <Users class="count-icon" />
          {{ group.memberCount || 0 }} 成员
        </span>
        <button
          v-if="!ctx.isJoined(group.id)"
          class="join-btn-primary"
          @click.stop="ctx.handleJoinGroup(group)"
        >
          加入圈子
        </button>
        <div v-else class="joined-actions">
          <button
            class="joined-btn"
            @click.stop="ctx.selectGroupById(group.id)"
          >
            进入
          </button>
          <button
            class="quit-btn"
            title="退出圈子"
            @click.stop="ctx.handleQuitGroup(group)"
          >
            <X class="quit-icon" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Users, X } from 'lucide-vue-next'
import type { Group } from '@/api/types'
import { useCommunityContext } from '@/composables/useCommunity'

const props = defineProps<{ group: Group; index: number }>()
const ctx = useCommunityContext()
const defaultCover = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80'
</script>
