<template>
  <div ref="backgroundEl" class="hero__background">
    <div class="parallax-wrapper">
      <div class="stars-layer"></div>
      <ShootingStars />
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
      <div class="grid-overlay"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ShootingStars from './ShootingStars.vue'

const backgroundEl = ref<HTMLElement | null>(null)

/**
 * 更新背景视差变量
 * @param clientX 鼠标 X 坐标
 * @param clientY 鼠标 Y 坐标
 */
function setMousePosition(clientX: number, clientY: number) {
  if (!backgroundEl.value) return
  const x = (clientX / window.innerWidth - 0.5) * 20
  const y = (clientY / window.innerHeight - 0.5) * 20
  backgroundEl.value.style.setProperty('--mouse-x', `${x}px`)
  backgroundEl.value.style.setProperty('--mouse-y', `${y}px`)
}

defineExpose({ setMousePosition })
</script>

<style scoped>
.hero__background {
  position: absolute;
  inset: 0;
  background: #050505;
  overflow: hidden;
  z-index: 0;
}

.stars-layer {
  position: absolute;
  inset: -50%;
  width: 200%;
  height: 200%;
  background-image: radial-gradient(1px 1px at 20px 30px, #eee, rgba(0, 0, 0, 0)),
    radial-gradient(1px 1px at 40px 70px, #fff, rgba(0, 0, 0, 0)),
    radial-gradient(1px 1px at 50px 160px, #ddd, rgba(0, 0, 0, 0)),
    radial-gradient(1px 1px at 90px 40px, #fff, rgba(0, 0, 0, 0)),
    radial-gradient(1px 1px at 130px 80px, #fff, rgba(0, 0, 0, 0)),
    radial-gradient(1.5px 1.5px at 160px 120px, #ddd, rgba(0, 0, 0, 0));
  background-size: 200px 200px;
  opacity: 0.5;
  animation: stars-rotate 100s linear infinite;
}

@keyframes stars-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.8;
  mix-blend-mode: screen;
  animation: float-orb 10s infinite ease-in-out;
}

.orb-1 {
  top: -10%;
  left: -10%;
  width: 60vw;
  height: 60vw;
  background: radial-gradient(circle, #4ade80 0%, transparent 60%);
  animation-delay: 0s;
}

.orb-2 {
  bottom: -20%;
  right: -10%;
  width: 70vw;
  height: 70vw;
  background: radial-gradient(circle, #3b82f6 0%, transparent 60%);
  animation-delay: -3s;
}

.orb-3 {
  top: 30%;
  left: 30%;
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, #a855f7 0%, transparent 60%);
  animation-delay: -6s;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  animation: grid-move 20s linear infinite;
}

@keyframes grid-move {
  0% {
    transform: perspective(500px) rotateX(0deg) translateY(0);
    background-position: 0 0;
  }
  100% {
    transform: perspective(500px) rotateX(0deg) translateY(0);
    background-position: 0 50px;
  }
}

@keyframes float-orb {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.8;
  }
  33% {
    transform: translate(50px, -80px) scale(1.1);
    opacity: 0.6;
  }
  66% {
    transform: translate(-40px, 40px) scale(0.9);
    opacity: 0.9;
  }
}
</style>

