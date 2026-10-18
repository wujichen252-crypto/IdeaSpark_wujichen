<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'

const route = useRoute()
// 默认布局：固定顶栏 + 内容区。
// 首页等全幅页（透明导航悬浮于 hero 之上）通过 meta.headerPad=false 关闭避让 padding，
// 其余页面给内容区加上避让固定顶栏的 padding。
const shouldPad = computed(() => route.meta.headerPad !== false)
</script>

<template>
  <AppHeader />
  <main :class="['app-main', { 'app-main--with-header': shouldPad }]">
    <slot></slot>
  </main>
</template>
