<template>
  <footer v-if="!editor.presentMode.value" class="se-notes-area" :class="{ collapsed: !editor.showNotes.value }">
    <div class="se-notes-header" @click="editor.toggleNotes()">
      <n-icon size="14"><component :is="editor.showNotes.value ? ChevronDown : ChevronUp" /></n-icon>
      <span>演讲者备注</span>
    </div>
    <div v-show="editor.showNotes.value" class="se-notes-content">
      <textarea
        v-model="editor.currentSlideNotes.value"
        class="se-notes-input"
        placeholder="点击添加演讲者备注..."
        @blur="editor.handleSaveNotes()"
      ></textarea>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useSlideEditorContext } from '@/composables/useSlideEditor'

const editor = useSlideEditorContext()
</script>
