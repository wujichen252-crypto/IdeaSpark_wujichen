<template>
  <section class="impact-section">
    <div class="impact-text">IDEASPARK</div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.impact-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: calc(var(--scrollbar-width, 0px) + var(--scrollbar-overlay-gap, 0px));
  height: 50vh; /* 调低高度 */
  background-color: #4ADE80;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  overflow: hidden;
  visibility: visible !important;
  opacity: 1 !important;
}

.impact-text {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 15vw;
  font-weight: 800;
  color: #000;
  line-height: 1;
  letter-spacing: 0.05em; /* 调整字间距 */
  white-space: nowrap;
  text-transform: uppercase;
  user-select: none;
  
  width: 100%;
  text-align: center;
  
  /* 移动端适配 */
  @media (max-width: 768px) {
    font-size: 18vw;
    letter-spacing: 0.02em; /* 移动端也稍微增加 */
  }
}
</style>
