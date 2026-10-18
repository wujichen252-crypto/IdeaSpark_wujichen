<template>
  <!-- 用户卡片 -->
  <div class="user-card glass-panel" :style="{ animationDelay: '0.1s' }">
    <div class="user-header">
      <div class="story-ring">
        <img
          :src="ctx.defaultAvatar.value"
          :alt="ctx.userStore.userInfo?.username"
          class="user-avatar-lg"
          @error="ctx.handleImageError"
        />
      </div>
      <div class="online-dot"></div>
    </div>
    <div class="user-info">
      <h3 class="user-name">{{ ctx.userStore.userInfo?.username || '创造者' }}</h3>
      <p class="user-role">{{ ctx.userStore.userInfo?.role || '产品设计师' }}</p>
    </div>
    <div class="user-stats">
      <div class="stat-item">
        <span class="stat-value">{{ ctx.userStats.posts }}</span>
        <span class="stat-label">帖子</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ ctx.userStats.followers }}</span>
        <span class="stat-label">关注者</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ ctx.userStats.following }}</span>
        <span class="stat-label">关注</span>
      </div>
    </div>
    <button class="edit-btn" @click="goProfile">编辑资料</button>
  </div>

  <!-- 热门话题 -->
  <div class="topics-card glass-panel" :style="{ animationDelay: '0.15s' }">
    <h4 class="card-title">
      <TrendingUp class="title-icon" />
      热门话题
    </h4>
    <div class="topics-list">
      <a
        v-for="topic in ctx.hotTopics.value"
        :key="topic.name"
        class="topic-item"
        @click="ctx.searchQuery.value = topic.name"
      >
        <span class="topic-name">#{{ topic.name }}</span>
        <span class="topic-count">{{ topic.count }} 帖子</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { TrendingUp } from 'lucide-vue-next'
import { useCommunityContext } from '@/composables/useCommunity'

const ctx = useCommunityContext()
const router = useRouter()
function goProfile() {
  router.push('/profile')
}
</script>
