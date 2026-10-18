<template>
  <div v-if="ctx.showImageModal.value" class="image-modal" @click="ctx.closeImageModal()">
    <button class="modal-close" @click="ctx.closeImageModal()">
      <X class="close-icon" />
    </button>
    <img :src="ctx.modalImage.value" alt="预览图片" class="modal-image" />
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useCommunityContext } from '@/composables/useCommunity'

const ctx = useCommunityContext()
</script>
