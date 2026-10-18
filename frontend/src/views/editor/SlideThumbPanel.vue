<template>
  <aside v-if="!editor.presentMode.value" class="se-slide-panel">
    <div class="se-slide-list">
      <div
        v-for="(slide, index) in editor.slides.value"
        :key="slide.id"
        :class="['se-slide-thumb', { active: editor.currentSlideIndex.value === index }]"
        @click="editor.selectSlide(index)"
      >
        <div class="se-thumb-number">{{ index + 1 }}</div>
        <div class="se-thumb-preview" :style="editor.getSlideStyle(slide)">
          <div class="se-thumb-content">
            <div v-if="editor.getSlideDisplayTitle(slide)" class="se-thumb-title">{{ editor.getSlideDisplayTitle(slide) }}</div>
            <div v-if="slide.subtitle" class="se-thumb-subtitle">{{ slide.subtitle }}</div>
          </div>
        </div>
        <button
          class="se-thumb-delete"
          @click.stop="editor.deleteSlideByIndex(index)"
          title="删除幻灯片"
        >
          <n-icon size="12"><X /></n-icon>
        </button>
      </div>
    </div>
    <div class="se-slide-actions">
      <button class="nexus-pill-btn nexus-pill-dark se-add-slide-btn" @click="editor.addSlide()">
        <n-icon size="14"><Plus /></n-icon>
        添加幻灯片
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { Plus, X } from 'lucide-vue-next'
import { useSlideEditorContext } from '@/composables/useSlideEditor'

const editor = useSlideEditorContext()
</script>
