<template>
  <div class="optimized-image" :class="{ 'is-loading': !loaded, 'is-error': hasError }">
    <!-- WebP 格式图片（浏览器支持时优先加载） -->
    <picture v-if="supportsWebp && webpSrc">
      <source :srcset="webpSrc" type="image/webp" />
      <img
        v-lazy="src"
        :alt="alt"
        :width="width"
        :height="height"
        @load="onLoad"
        @error="onError"
      />
    </picture>
    <!-- 普通格式图片 -->
    <img
      v-else
      v-lazy="src"
      :alt="alt"
      :width="width"
      :height="height"
      @load="onLoad"
      @error="onError"
    />
    <!-- 加载状态遮罩 -->
    <div v-if="!loaded && !hasError" class="image-skeleton">
      <n-spin size="small" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

/**
 * 优化图片组件 Props 接口
 */
interface Props {
  /** 图片地址 */
  src: string
  /** WebP 格式图片地址（可选） */
  webpSrc?: string
  /** 图片替代文本 */
  alt?: string
  /** 图片宽度 */
  width?: number | string
  /** 图片高度 */
  height?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  webpSrc: '',
  width: undefined,
  height: undefined
})

/**
 * 加载状态
 */
const loaded = ref(false)
/**
 * 错误状态
 */
const hasError = ref(false)
/**
 * 浏览器是否支持 WebP
 */
const supportsWebp = ref(false)

/**
 * 图片加载完成回调
 */
function onLoad(): void {
  loaded.value = true
}

/**
 * 图片加载失败回调
 */
function onError(): void {
  hasError.value = true
  loaded.value = true
}

/**
 * 检测浏览器是否支持 WebP 格式
 */
function checkWebpSupport(): void {
  const canvas = document.createElement('canvas')
  if (canvas.getContext && canvas.getContext('2d')) {
    supportsWebp.value = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }
}

onMounted(() => {
  checkWebpSupport()
})
</script>

<style scoped lang="scss">
.optimized-image {
  position: relative;
  display: inline-block;
  overflow: hidden;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
  }

  &.is-loading img {
    opacity: 0;
  }

  &.is-error img {
    opacity: 0.5;
  }
}

.image-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}
</style>
