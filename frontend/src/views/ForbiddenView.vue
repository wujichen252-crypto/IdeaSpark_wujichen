<template>
  <div class="forbidden-view">
    <div class="content">
      <div class="status-code">403</div>
      <h1 class="title">无权访问</h1>
      <p class="description">抱歉，您没有权限访问此页面，请联系管理员。</p>
      <router-link to="/" class="home-link">返回首页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.forbidden-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.content {
  padding: 40px;
}

.status-code {
  font-size: 96px;
  font-weight: 700;
  color: #d03050;
  line-height: 1;
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.description {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}

.home-link {
  display: inline-block;
  padding: 8px 24px;
  background-color: #18a058;
  color: #fff;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
}

.home-link:hover {
  opacity: 0.9;
}
</style>
