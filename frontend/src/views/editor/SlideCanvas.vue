<template>
  <main class="se-edit-area" :class="{ 'present-area': editor.presentMode.value }">
    <div class="se-canvas-wrapper" :class="{ 'present-wrapper': editor.presentMode.value }">
      <div
        class="se-canvas"
        :class="{ 'present-canvas': editor.presentMode.value, 'fade-in': editor.slideTransitioning.value }"
        :style="editor.canvasStyle.value"
      >
        <div v-if="editor.currentSlide.value" class="se-slide-content" :class="editor.currentSlide.value.layout">
          <!-- 传统字段兼容渲染 -->
          <EditableText
            v-if="editor.currentSlide.value.title !== undefined"
            v-model="editor.currentSlide.value.title"
            class="se-slide-title"
            :style="{ color: editor.currentThemeColor.value }"
            @focus="editor.handleTitleFocus()"
            @blur="editor.handleTitleBlur()"
          />
          <EditableText
            v-if="editor.currentSlide.value.subtitle !== undefined"
            v-model="editor.currentSlide.value.subtitle"
            class="se-slide-subtitle"
            :style="{ color: editor.currentThemeColorSecondary.value }"
            @focus="editor.handleSubtitleFocus()"
            @blur="editor.handleSubtitleBlur()"
          />
          <EditableText
            v-if="editor.currentSlide.value.content !== undefined"
            v-model="editor.currentSlide.value.content"
            class="se-slide-body"
            @blur="editor.handleContentChange()"
          />

          <!-- 新元素系统 -->
          <div
            v-for="el in (editor.currentSlide.value?.elements || [])"
            :key="el.id"
            class="se-element"
            :class="`se-element-${el.type}`"
            :style="{
              left: `${el.x}px`,
              top: `${el.y}px`,
              width: `${el.width}px`,
              height: `${el.height}px`
            }"
            @mousedown="editor.startDrag($event, el)"
          >
            <EditableText
              v-if="el.type === 'text'"
              :key="el.id"
              v-model="el.content!"
              class="se-element-text"
              @blur="editor.handleContentChange()"
            />
            <div v-else-if="el.type === 'shape'" class="se-element-shape" :style="el.style || {}"></div>
            <img
              v-else-if="el.type === 'image'"
              class="se-element-image"
              :src="el.content"
              draggable="false"
            />
            <button class="se-element-delete" @mousedown.stop @click="editor.deleteElement(el.id)">
              <n-icon size="12"><X /></n-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- 放映控制 -->
      <div v-if="editor.presentMode.value" class="se-present-controls">
        <button class="nexus-icon-btn nexus-icon-dark" @click="editor.prevSlide()">
          <n-icon size="20"><ChevronLeft /></n-icon>
        </button>
        <span class="se-present-counter">{{ editor.currentSlideIndex.value + 1 }} / {{ editor.slides.value.length }}</span>
        <button class="nexus-icon-btn nexus-icon-dark" @click="editor.nextSlide()">
          <n-icon size="20"><ChevronRight /></n-icon>
        </button>
        <button class="nexus-icon-btn nexus-icon-ghost se-present-exit" @click="editor.exitSlideshow()">
          <n-icon size="18"><X /></n-icon>
        </button>
      </div>

      <!-- 放映备注 -->
      <div v-if="editor.presentMode.value && editor.currentSlide.value?.notes" class="se-present-notes">
        {{ editor.currentSlide.value.notes }}
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import EditableText from '@/components/EditableText.vue'
import { useSlideEditorContext } from '@/composables/useSlideEditor'

const editor = useSlideEditorContext()
</script>
