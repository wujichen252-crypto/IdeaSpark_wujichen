<template>
  <div
    class="slide-editor"
    :class="{ 'present-mode': editor.presentMode.value }"
    tabindex="0"
    @keydown="editor.handleKeydown($event)"
  >
    <SlideRibbon />
    <div class="se-main" :class="{ 'present-main': editor.presentMode.value }">
      <SlideThumbPanel />
      <SlideCanvas />
      <SlideRightPanel />
      <SlideAiPanel />
    </div>
    <SlideNotesArea />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, provide } from 'vue'
import { createSlideEditor, SLIDE_EDITOR_KEY } from '@/composables/useSlideEditor'
import SlideRibbon from './SlideRibbon.vue'
import SlideThumbPanel from './SlideThumbPanel.vue'
import SlideRightPanel from './SlideRightPanel.vue'
import SlideCanvas from './SlideCanvas.vue'
import SlideAiPanel from './SlideAiPanel.vue'
import SlideNotesArea from './SlideNotesArea.vue'

const editor = createSlideEditor()
provide(SLIDE_EDITOR_KEY, editor)
onMounted(() => editor.init())
onBeforeUnmount(() => editor.cleanup())
</script>

<style lang="scss" src="./SlideEditorView.scss" />
