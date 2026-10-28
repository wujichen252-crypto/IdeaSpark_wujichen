<template>
  <article
    class="post-card glass-panel"
    :style="{ animationDelay: `${0.3 + index * 0.1}s` }"
  >
    <!-- 帖子头部 -->
    <div class="post-header">
      <div class="author-info" @click="ctx.goToProfile(String(post.author?.id || ''))">
        <div class="story-ring-sm">
          <img
            :src="getOtherUserAvatar(post.author?.avatar, post.author?.id, post.author?.username)"
            :alt="post.author?.username"
            class="author-avatar"
            @error="ctx.handleImageError"
          />
        </div>
        <div class="author-meta">
          <h4 class="author-name">{{ post.author?.username || '匿名用户' }}</h4>
          <p class="post-time">{{ ctx.formatTime(post.createdAt) }} · {{ post.channel || '社区' }}</p>
        </div>
      </div>
      <button class="more-btn" @click.stop="ctx.showPostMenu(post)">
        <MoreHorizontal class="more-icon" />
      </button>
    </div>

    <!-- 帖子内容 -->
    <div class="post-body">
      <p class="post-text">{{ post.content }}</p>
      <!-- 图片网格 -->
      <div
        v-if="post.images && post.images.length"
        :class="['image-grid', `grid-${Math.min(post.images.length, 4)}`]"
      >
        <div
          v-for="(img, idx) in post.images.slice(0, 4)"
          :key="idx"
          class="image-item"
          @click="ctx.openImageModal(img)"
        >
          <img
            :src="img"
            :alt="`图片${idx + 1}`"
            class="post-image"
            @error="ctx.handleImageError"
          />
          <div v-if="idx === 3 && post.images.length > 4" class="image-more">
            +{{ post.images.length - 4 }}
          </div>
        </div>
      </div>
      <!-- 标签 -->
      <div v-if="post.tags && post.tags.length" class="post-tags">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="tag-link"
          @click="ctx.searchQuery.value = tag"
        >
          #{{ tag }}
        </span>
      </div>
    </div>

    <!-- 互动按钮 -->
    <div class="post-actions">
      <div class="actions-left">
        <button
          :class="['action-btn like-btn', { active: post.isLiked }]"
          @click="ctx.toggleLike(post)"
        >
          <Heart class="action-icon" />
          <span class="action-count">{{ ctx.formatCount(post.likesCount) }}</span>
        </button>
        <button class="action-btn" @click="ctx.openComments(post)">
          <MessageCircle class="action-icon" />
          <span class="action-count">{{ ctx.formatCount(post.commentsCount) }}</span>
        </button>
      </div>
    </div>

    <!-- 评论预览 -->
    <div class="comments-link">
      <button class="view-comments-btn" @click="ctx.openComments(post)">
        查看全部 {{ post.commentsCount }} 条评论
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { MoreHorizontal, Heart, MessageCircle } from 'lucide-vue-next'
import type { Post } from '@/api/types'
import { getOtherUserAvatar } from '@/utils/avatar'
import { useCommunityContext } from '@/composables/useCommunity'

const props = defineProps<{ post: Post; index: number }>()
const ctx = useCommunityContext()
</script>

<style scoped lang="scss">
.comments-link {
  margin-top: 16px;
  text-align: right;

  .view-comments-btn {
    background: none;
    border: none;
    padding: 0;
    color: var(--nexus-text-tertiary);
    font-size: var(--nexus-font-size-base);
    cursor: pointer;
    transition: color 0.18s ease;

    &:hover {
      color: var(--nexus-text-primary);
    }
  }
}
</style>
