<template>
  <div class="community-view">
    <!-- 全局噪点纹理 -->
    <div class="grain-overlay"></div>

    <!-- 主布局 -->
    <div class="main-layout">
      <!-- 左侧边栏 -->
      <aside class="left-sidebar">
        <CommunityLeftSidebar />
      </aside>

      <!-- 中间内容区 -->
      <main class="feed-main">
        <CommunityFeedMain />
      </main>

      <!-- 右侧边栏 -->
      <aside class="right-sidebar">
        <CommunityRightSidebar />
      </aside>
    </div>

    <!-- 浮动发布按钮 (移动端) -->
    <button class="floating-btn" @click="ctx.openCreateModal()">
      <Plus class="floating-icon" />
    </button>

    <!-- 图片预览模态框 -->
    <CommunityImageModal />
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { Plus } from 'lucide-vue-next'
import { createCommunity, COMMUNITY_KEY } from '@/composables/useCommunity'
import CommunityLeftSidebar from '@/components/community/CommunityLeftSidebar.vue'
import CommunityRightSidebar from '@/components/community/CommunityRightSidebar.vue'
import CommunityFeedMain from '@/components/community/CommunityFeedMain.vue'
import CommunityImageModal from '@/components/community/CommunityImageModal.vue'

const ctx = createCommunity()
provide(COMMUNITY_KEY, ctx)
</script>

<style lang="scss" src="./CommunityView.scss" />
