<template>
  <div class="not-found">
    <n-result
      status="404"
      title="404 页面不存在"
      description="您访问的页面不存在或已被移除"
    >
      <template #footer>
        <n-space>
          <n-button type="primary" @click="goHome">
            返回首页
          </n-button>
          <n-button @click="goBack">
            返回上一页
          </n-button>
        </n-space>
      </template>
    </n-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

/**
 * 返回首页
 */
function goHome(): void {
  router.push('/')
}

/**
 * 返回上一页
 */
function goBack(): void {
  router.back()
}
</script>

<style scoped lang="scss">
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
</style>
