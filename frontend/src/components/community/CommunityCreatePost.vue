<template>
  <div class="create-post glass-panel" :style="{ animationDelay: '0.2s' }">
    <div class="create-inner">
      <img
        :src="ctx.defaultAvatar.value"
        :alt="ctx.userStore.userInfo?.username"
        class="create-avatar"
        @error="ctx.handleImageError"
      />
      <div class="create-content">
        <textarea
          v-model="ctx.postContent.value"
          placeholder="分享你的想法..."
          class="create-textarea"
          @input="ctx.autoResize"
        ></textarea>
        <div class="create-actions">
          <button
            :class="['publish-btn', { active: ctx.postContent.value.trim() }]"
            :disabled="!ctx.postContent.value.trim()"
            @click="ctx.handlePublish()"
          >
            发布
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCommunityContext } from '@/composables/useCommunity'

const ctx = useCommunityContext()
</script>
