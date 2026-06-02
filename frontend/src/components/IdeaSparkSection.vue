<template>
  <section class="ideaspark-section">
    <div class="content-wrapper">
      <!-- Main Title Section -->
      <div class="title-area">
        <h2 class="main-title">IDEASPARK</h2>
        <p class="sub-title">
          Ignite your creativity with cutting-edge tools designed for modern developers. 
          Transforming thoughts into reality, one line of code at a time.
        </p>
      </div>

      <!-- Divider Line -->
      <div class="divider"></div>

      <!-- Footer Area -->
      <div class="footer-content">
        <!-- Left Column: Logo & Copyright -->
        <div class="footer-left">
          <div class="footer-logo">
            <!-- Placeholder for Logo -->
            <div class="logo-placeholder"></div>
            <span class="logo-text">IDEASPARK</span>
          </div>
          <p class="copyright">© 2025 IDEASPARK 版权所有</p>
        </div>

        <!-- Right Column: Links -->
        <div class="footer-links">
          <div class="link-column">
            <h4 class="column-title">条款</h4>
            <ul class="link-list">
              <li>隐私政策</li>
              <li>服务条款</li>
              <li>Cookie 设置</li>
            </ul>
          </div>
          <div class="link-column">
            <h4 class="column-title">资源</h4>
            <ul class="link-list">
              <li>开发文档</li>
              <li>API 参考</li>
              <li>社区指南</li>
            </ul>
          </div>
          <div class="link-column">
            <h4 class="column-title">链接</h4>
            <ul class="link-list">
              <li>GitHub</li>
              <li>Twitter</li>
              <li>Discord</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Logic can be added here if needed in the future
</script>

<style scoped lang="scss">
.ideaspark-section {
  width: 100vw; /* 强制全屏宽度，覆盖滚动条区域 */
  margin-left: calc(50% - 50vw); /* 破框居中，确保背景色延伸到屏幕边缘 */
  padding: 100px 0 0; /* Remove bottom padding */
  background-color: #000; /* Consistent dark theme */
  display: flex;
  justify-content: center;
  color: #fff;
  position: relative;
  z-index: 10; /* 确保盖住底部的 ImpactSection */
}

.content-wrapper {
  width: 100%;
  max-width: 1440px; /* 统一为 1440px */
  padding: 0 32px; /* 统一为 32px */
  display: flex;
  flex-direction: column;
}

/* Title Area */
.title-area {
  text-align: left;
  margin-bottom: 80px;
}

.main-title {
  font-size: 5rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 16px;
  line-height: 1;
  letter-spacing: -2px;
  text-transform: uppercase;
  background: linear-gradient(to right, #fff, #666);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sub-title {
  font-size: 1.5rem;
  color: #666;
  font-weight: 400;
  max-width: 600px;
  margin: 0;
  line-height: 1.6;
}

/* Divider */
.divider {
  width: 100%;
  height: 1px;
  background-color: #333;
  margin-bottom: 60px;
}

/* Footer Area */
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 40px;
}

/* Left Column */
.footer-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 160px; /* Ensure spacing */
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.logo-placeholder {
  width: 32px;
  height: 32px;
  background-color: #fff;
  border-radius: 4px; /* Simple placeholder shape */
}

.logo-text {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.copyright {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

/* Right Column: Links */
.footer-links {
  display: flex;
  gap: 80px;
  flex-wrap: wrap;
}

.link-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.column-title {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.link-list li {
  font-size: 0.9rem;
  color: #888;
  cursor: pointer;
  transition: color 0.2s;
}

.link-list li:hover {
  color: #fff;
}

/* Mobile Adaptation */
@media (max-width: 768px) {
  .ideaspark-section {
    padding: 60px 0 40px;
  }

  .main-title {
    font-size: 3rem;
  }

  .sub-title {
    font-size: 1.1rem;
  }

  .footer-content {
    flex-direction: column;
    gap: 60px;
  }

  .footer-links {
    gap: 40px;
    width: 100%;
    justify-content: space-between;
  }

  .footer-left {
    min-height: auto;
  }
}
</style>
