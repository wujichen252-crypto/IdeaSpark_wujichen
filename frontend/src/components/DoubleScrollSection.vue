<template>
  <section ref="sectionRef" class="double-scroll-section">
    <div class="section-header">
      <h2 class="section-title">社区回响</h2>
      <p class="section-subtitle">倾听来自全球开发者的灵感与洞见，汇聚科技与人文的思考</p>
    </div>

    <div class="scroll-row top-row">
      <div class="scroll-track scroll-left" :class="{ 'is-active': isInView }">
        <!-- 第一组数据 -->
        <div class="scroll-set">
          <div
            v-for="(item, index) in topRowData"
            :key="`top-1-${index}`"
            class="scroll-card-wrapper"
          >
            <n-card class="quote-card" :bordered="false">
              <div class="card-content">
                <p class="card-quote">“{{ item.quote }}”</p>
                <div class="card-footer">
                  <img
v-if="item.avatar"
:src="item.avatar"
class="card-avatar-img"
loading="lazy"
decoding="async"
fetchpriority="low" />
                  <div v-else class="css-avatar" :style="getAvatarStyle(item.author)">
                    {{ item.author.charAt(0) }}
                  </div>
                  <p class="card-author">{{ item.author }}</p>
                </div>
              </div>
            </n-card>
          </div>
        </div>
        <!-- 复制一组数据实现无缝滚动 -->
        <div class="scroll-set">
          <div
            v-for="(item, index) in topRowData"
            :key="`top-2-${index}`"
            class="scroll-card-wrapper"
          >
            <n-card class="quote-card" :bordered="false">
              <div class="card-content">
                <p class="card-quote">“{{ item.quote }}”</p>
                <div class="card-footer">
                  <img
v-if="item.avatar"
:src="item.avatar"
class="card-avatar-img"
loading="lazy"
decoding="async"
fetchpriority="low" />
                  <div v-else class="css-avatar" :style="getAvatarStyle(item.author)">
                    {{ item.author.charAt(0) }}
                  </div>
                  <p class="card-author">{{ item.author }}</p>
                </div>
              </div>
            </n-card>
          </div>
        </div>
      </div>
    </div>

    <div class="scroll-row bottom-row">
      <div class="scroll-track scroll-right" :class="{ 'is-active': isInView }">
        <!-- 第二组数据 -->
        <div class="scroll-set">
          <div
            v-for="(item, index) in bottomRowData"
            :key="`bottom-1-${index}`"
            class="scroll-card-wrapper"
          >
            <n-card class="quote-card" :bordered="false">
              <div class="card-content">
                <p class="card-quote">“{{ item.quote }}”</p>
                <div class="card-footer">
                  <img
v-if="item.avatar"
:src="item.avatar"
class="card-avatar-img"
loading="lazy"
decoding="async"
fetchpriority="low" />
                  <div v-else class="css-avatar" :style="getAvatarStyle(item.author)">
                    {{ item.author.charAt(0) }}
                  </div>
                  <p class="card-author">{{ item.author }}</p>
                </div>
              </div>
            </n-card>
          </div>
        </div>
        <!-- 复制一组数据实现无缝滚动 -->
        <div class="scroll-set">
          <div
            v-for="(item, index) in bottomRowData"
            :key="`bottom-2-${index}`"
            class="scroll-card-wrapper"
          >
            <n-card class="quote-card" :bordered="false">
              <div class="card-content">
                <p class="card-quote">“{{ item.quote }}”</p>
                <div class="card-footer">
                  <img
v-if="item.avatar"
:src="item.avatar"
class="card-avatar-img"
loading="lazy"
decoding="async"
fetchpriority="low" />
                  <div v-else class="css-avatar" :style="getAvatarStyle(item.author)">
                    {{ item.author.charAt(0) }}
                  </div>
                  <p class="card-author">{{ item.author }}</p>
                </div>
              </div>
            </n-card>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// 生成随机渐变色
const getAvatarStyle = (name: string) => {
  const colors = [
    ['#ff9a9e', '#fecfef'],
    ['#a18cd1', '#fbc2eb'],
    ['#84fab0', '#8fd3f4'],
    ['#cfd9df', '#e2ebf0'],
    ['#fccb90', '#d57eeb'],
    ['#e0c3fc', '#8ec5fc'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe']
  ]
  // 简单的 hash
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  const [c1, c2] = colors[index] ?? ['#111827', '#374151']
  
  return {
    background: `linear-gradient(135deg, ${c1}, ${c2})`,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    width: '48px',
    height: '48px',
    borderRadius: '50%'
  }
}

// 模拟数据：14条
const allData = [
  {
    quote: 'IdeaSpark 的 AI PPT 功能简直是救星，帮我节省了数小时的排版时间！',
    author: 'Alex Chen',
    avatar: 'https://i.pravatar.cc/150?u=Alex'
  },
  {
    quote: '捕捉灵感从未如此简单，碎片化的想法终于有了归宿。',
    author: 'Sarah Wang',
    avatar: 'https://i.pravatar.cc/150?u=Sarah'
  },
  {
    quote: '在这里我找到了志同道合的创意伙伴，社区氛围非常棒。',
    author: 'Jason Lee',
    avatar: 'https://i.pravatar.cc/150?u=Jason'
  },
  {
    quote: '智能编辑器的润色功能让我的技术文档看起来更专业了。',
    author: 'Emily Zhang',
    avatar: 'https://i.pravatar.cc/150?u=Emily'
  },
  {
    quote: '项目协同空间的设计非常直观，团队配合效率提升了 50%。',
    author: 'David Liu',
    avatar: 'https://i.pravatar.cc/150?u=David'
  },
  {
    quote: '每一个闪现的火花都值得被认真对待，这就是 IdeaSpark 的魅力。',
    author: 'Linda Smith',
    avatar: 'https://i.pravatar.cc/150?u=Linda'
  },
  {
    quote: '从想法到方案，AI 辅助的每一个步骤都充满了惊喜。',
    author: 'Kevin Ho',
    avatar: 'https://i.pravatar.cc/150?u=Kevin'
  },
  {
    quote: '简洁而不简单，这就是我一直在寻找的创意孵化器。',
    author: 'Rachel Sun',
    avatar: 'https://i.pravatar.cc/150?u=Rachel'
  },
  {
    quote: '在广场上看到了很多惊艳的作品，这里真的是灵感的源泉。',
    author: 'Michael Tan',
    avatar: 'https://i.pravatar.cc/150?u=Michael'
  },
  {
    quote: 'API 接口非常丰富，扩展性极强，开发者必备。',
    author: 'Thomas Brown',
    avatar: 'https://i.pravatar.cc/150?u=Thomas'
  },
  {
    quote: '沉浸式的创作体验，让我能专注于内容本身。',
    author: 'Sophie Green',
    avatar: 'https://i.pravatar.cc/150?u=Sophie'
  },
  {
    quote: 'IdeaSpark 重新定义了灵感管理，推荐给所有内容创作者。',
    author: 'Chris Miller',
    avatar: 'https://i.pravatar.cc/150?u=Chris'
  },
  {
    quote: '多端同步非常流畅，随时随地记录灵感。',
    author: 'Anna White',
    avatar: 'https://i.pravatar.cc/150?u=Anna'
  },
  {
    quote: '用 AI 赋予创意生命，让每个人都能成为创造者。',
    author: 'IdeaSpark 团队',
    avatar: 'https://i.pravatar.cc/150?u=Team'
  }
]

// 将数据分为两组
const mid = Math.ceil(allData.length / 2)
const topRowData = ref(allData.slice(0, mid))
const bottomRowData = ref(allData.slice(mid))

const sectionRef = ref<HTMLElement | null>(null)
const isInView = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!('IntersectionObserver' in window)) {
    isInView.value = true
    return
  }

  observer = new IntersectionObserver(
    entries => {
      isInView.value = entries.some(entry => entry.isIntersecting)
    },
    { root: null, threshold: 0 }
  )

  if (sectionRef.value) observer.observe(sectionRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style scoped lang="scss">
.double-scroll-section {
  width: 100%; /* 适配 style.css 中的全局流式布局，100% 即 100vw */
  overflow: hidden;
  padding: 80px 0;
  background-color: #000; /* 深色背景 */
  display: flex;
  flex-direction: column;
  gap: 40px; /* 两行之间的间距 */
}

.section-header {
  text-align: center;
  margin-bottom: 20px;
  padding: 0 24px;
}

.section-title {
  font-size: 2.5rem;
  color: #fff;
  margin: 0 0 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #999;
  margin: 0;
  font-weight: 400;
}

.scroll-row {
  width: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  
  /* 鼠标悬浮在行上时，暂停该行的动画 */
  &:hover .scroll-track {
    animation-play-state: paused;
  }
  
  /* 左右渐变遮罩，增强滚动效果 (改为黑色渐变) */
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    width: 100px;
    height: 100%;
    z-index: 2;
    pointer-events: none;
  }
  
  &::before {
    left: 0;
    background: linear-gradient(to right, #000, transparent);
  }
  
  &::after {
    right: 0;
    background: linear-gradient(to left, #000, transparent);
  }
}

.scroll-track {
  display: flex;
  gap: 24px;
  width: max-content;
  animation-play-state: paused;
  will-change: transform;
}

.scroll-track.is-active {
  animation-play-state: running;
}

.scroll-set {
  display: flex;
  gap: 24px;
}

/* 滚动卡片容器 */
.scroll-card-wrapper {
  flex-shrink: 0;
  padding: 10px 0; /* 给 hover 上浮留出空间，防止被裁剪 */
}

/* 卡片样式 */
.quote-card {
  width: 420px; /* 更长一点 */
  height: 180px;
  border-radius: 0; /* 长方形，无圆角 */
  background-color: #1a1a1a; /* 深灰卡片背景 */
  border: 1px solid #333; /* 轻微边框 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: flex-start; /* 内容左对齐 */
  text-align: left;
  
  /* Naive UI 卡片内容 */
  :deep(.n-card__content) {
    display: flex;
    flex-direction: column;
    justify-content: space-between; /* 上下分布 */
    padding: 24px;
    height: 100%;
    width: 100%;
  }

  /* 悬浮交互 */
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
    /* 边框变亮 */
    border-color: var(--n-color-target, #fff); 
  }
}

.card-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 100%;
}

.card-quote {
  font-size: 1.1rem;
  color: #fff; /* 白色字体 */
  line-height: 1.6;
  font-style: normal; /* 可选：取消斜体，看喜好，这里先保持正常 */
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto; /* 推到底部 */
}

.card-avatar {
  border-radius: 0; /* 强制正方形 */
}

.card-avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #333;
}

.card-author {
  font-size: 0.9rem;
  color: #ccc; /* 浅灰作者名 */
  font-weight: 500;
  margin: 0;
}

/* 动画定义 */
@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    /* 移动 50% 宽度（因为内容复制了一份）加上 gap 的一半调整 */
    /* 简单做法：移动 -50% */
    transform: translateX(calc(-50% - 12px)); /* 12px 是 gap: 24px 的一半 */
  }
}

@keyframes scroll-right {
  0% {
    /* 从 -50% 开始往回走 */
    transform: translateX(calc(-50% - 12px));
  }
  100% {
    transform: translateX(0);
  }
}

/* 应用动画 */
.scroll-left {
  animation: scroll-left 40s linear infinite;
}

.scroll-right {
  animation: scroll-right 45s linear infinite; /* 稍微错开速度 */
}

@media (prefers-reduced-motion: reduce) {
  .scroll-left,
  .scroll-right {
    animation: none !important;
    transform: none !important;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .quote-card {
    width: 300px; /* 移动端稍微窄一点 */
    height: 180px;
  }
  
  .double-scroll-section {
    padding: 40px 0;
    gap: 24px;
  }
}
</style>
