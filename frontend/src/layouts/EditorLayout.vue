<script setup lang="ts">
// 全屏编辑布局：无全局顶栏、无避让 padding，供各类编辑器（文档/幻灯片/表格/白板/思维导图/流程图）使用。
// 编辑器自身负责内部头部（如 EmbeddedEditor 的返回/标题/保存/导出条）。
</script>

<template>
  <main class="app-main">
    <slot></slot>
  </main>
</template>
