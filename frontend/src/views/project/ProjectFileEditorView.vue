<template>
  <div class="project-file-editor">
    <ProjectFileEditorHeader />

    <div class="editor-body">
      <n-empty v-if="!ctx.file.value" description="未找到该文件" />

      <div v-else class="editor-container" :class="{ 'ai-open': ctx.showAi.value }">
        <!-- Markdown 编辑器 -->
        <div v-if="ctx.editorKind.value === 'markdown'" class="editor-markdown">
          <MarkdownEditor
            v-model="ctx.content.value"
            :show-ai="ctx.showAi.value"
            :session-id="ctx.mdSessionId.value"
            :system-context="ctx.mdSystemContext.value"
            :file-name="ctx.file.value?.name || '未命名文档'"
            view-mode="typora"
            @update:show-ai="v => ctx.showAi.value = v"
            @change="ctx.scheduleAutoSave"
            @save-file="ctx.handleAiInsert" />
        </div>

        <!-- CSV 编辑器 -->
        <div v-else-if="ctx.editorKind.value === 'csv'" class="editor-csv-host">
          <CsvPanel />
        </div>

        <!-- Slides 编辑器 -->
        <div v-else-if="ctx.editorKind.value === 'slides'" class="editor-slides-host">
          <SlidesPanel />
        </div>

        <!-- Word 文档编辑器 -->
        <div v-else-if="ctx.editorKind.value === 'doc'" class="editor-doc">
          <DocEditor
            v-model="ctx.content.value"
            :title="ctx.file.value?.name || '未命名文档'"
            @change="ctx.handleDocContentChange"
            @save="ctx.handleDocSave"
            @back="ctx.handleBack"
            @title-change="ctx.handleTitleChange" />
        </div>

        <!-- 纯文本编辑器 -->
        <div v-else class="editor-single">
          <div class="nexus-glass-panel text-editor-wrapper">
            <n-input
              v-model:value="ctx.content.value"
              type="textarea"
              :autosize="{ minRows: 22 }"
              placeholder="开始编辑..."
              class="mono-editor nexus-mono-input"
              @input="ctx.scheduleAutoSave" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { NEmpty, NInput } from 'naive-ui'
import { createProjectFileEditor, PROJECT_FILE_EDITOR_KEY } from '@/composables/useProjectFileEditor'
import ProjectFileEditorHeader from '@/components/editor/ProjectFileEditorHeader.vue'
import CsvPanel from '@/components/editor/CsvPanel.vue'
import SlidesPanel from '@/components/editor/SlidesPanel.vue'
import DocEditor from '@/components/editor/DocEditor.vue'
import MarkdownEditor from '@/components/markdown/MarkdownEditor.vue'

const ctx = createProjectFileEditor()
provide(PROJECT_FILE_EDITOR_KEY, ctx)
</script>

<style scoped lang="scss" src="./ProjectFileEditorView.scss" />
