<template>
  <!-- Feed 标签页 -->
  <div class="feed-tabs-section" :style="{ animationDelay: '0.05s' }">
    <div class="nav-tabs">
      <button
        v-for="tab in ctx.feedTabs"
        :key="tab.key"
        :class="['nav-tab', { active: ctx.activeFeed.value === tab.key }]"
        @click="ctx.activeFeed.value = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>

  <!-- 搜索框 -->
  <div class="search-section" :style="{ animationDelay: '0.1s' }">
    <div class="search-box">
      <Search class="search-icon" />
      <input
        v-model="ctx.searchQuery.value"
        type="text"
        :placeholder="ctx.activeFeed.value === 'groups' ? '搜索圈子名称或关键字...' : '搜索社区帖子...'"
        class="search-input"
      />
    </div>
  </div>

  <!-- Stories -->
  <div class="stories-section" :style="{ animationDelay: '0.15s' }">
    <div class="stories-scroll">
      <!-- 添加 Story -->
      <button class="story-item add-story" @click="ctx.openCreateModal()">
        <div class="story-avatar add-avatar">
          <Plus class="add-icon" />
        </div>
        <span class="story-name">发布</span>
      </button>
      <!-- Story 列表 -->
      <button
        v-for="story in ctx.stories.value"
        :key="story.id"
        class="story-item"
        @click="ctx.viewStory(story)"
      >
        <div :class="['story-ring-sm', { viewed: story.viewed }]">
          <img
            :src="story.avatar"
            :alt="story.name"
            class="story-avatar"
            @error="ctx.handleImageError"
          />
        </div>
        <span class="story-name">{{ story.name }}</span>
      </button>
    </div>
  </div>

  <!-- 发布框 -->
  <CommunityCreatePost />

  <!-- 帖子列表 -->
  <div v-if="ctx.activeFeed.value !== 'groups'" class="posts-list">
    <CommunityPostCard
      v-for="(post, index) in ctx.filteredPosts.value"
      :key="post.id"
      :post="post"
      :index="index"
    />
  </div>

  <!-- 圈子列表 -->
  <div v-else class="groups-grid">
    <CommunityGroupCard
      v-for="(group, index) in ctx.filteredGroups.value"
      :key="group.id"
      :group="group"
      :index="index"
    />
  </div>

  <!-- 加载更多 -->
  <div v-if="ctx.activeFeed.value !== 'groups'" class="load-more" :style="{ animationDelay: '0.7s' }">
    <button class="load-more-btn" @click="ctx.loadMorePosts()">
      加载更多动态
    </button>
  </div>
</template>

<script setup lang="ts">
import { Search, Plus } from 'lucide-vue-next'
import { useCommunityContext } from '@/composables/useCommunity'
import CommunityCreatePost from '@/components/community/CommunityCreatePost.vue'
import CommunityPostCard from '@/components/community/CommunityPostCard.vue'
import CommunityGroupCard from '@/components/community/CommunityGroupCard.vue'

const ctx = useCommunityContext()
</script>
