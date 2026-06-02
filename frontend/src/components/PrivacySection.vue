<template>
  <section class="privacy-section">
    <div class="section-header">
      <h2 class="section-title">隐私与安全</h2>
      <p class="section-subtitle">我们始终将您的数据安全与隐私保护放在首位，采用行业领先的加密技术与合规标准</p>
    </div>

    <div class="cards-container">
      <n-card
        v-for="(item, index) in privacyData"
        :key="index"
        class="privacy-card"
        :bordered="false"
      >
        <div class="card-content">
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-desc">{{ item.desc }}</p>
        </div>
      </n-card>
    </div>
  </section>
</template>

<script setup lang="ts">
const privacyData = [
  {
    title: '端到端加密',
    desc: '您的所有通信数据均采用军用级 AES-256 端到端加密传输，确保信息在传输过程中不被任何第三方窃取或篡改，即便是我们作为平台方也无法查看您的私密对话内容。'
  },
  {
    title: '零知识证明',
    desc: '我们遵循最小权限原则，构建了基于零知识证明的身份验证体系。这意味着我们在验证您的身份时，无需收集或存储您的原始密码与敏感生物特征，从源头上杜绝了隐私泄露的风险。'
  },
  {
    title: '合规与审计',
    desc: '严格遵守 GDPR、CCPA 等国际隐私保护法规，定期接受第三方安全机构的渗透测试与合规审计。我们提供透明的数据管理工具，让您随时掌控自己的数据权利，包括导出、更正与彻底删除。'
  }
]
</script>

<style scoped lang="scss">
.privacy-section {
  width: 100%;
  padding: 80px 0;
  background-color: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 60px;
}

.section-header {
  text-align: center;
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
  max-width: 800px;
}

.cards-container {
  display: flex;
  justify-content: center;
  gap: 24px;
  width: 100%;
  max-width: 1400px;
  padding: 0 24px;
  flex-wrap: wrap;
}

.privacy-card {
  width: 420px;
  /* 高度自适应，但保持一定的最小高度以对齐 */
  min-height: 240px;
  border-radius: 0; /* 长方形，无圆角 */
  background-color: #1a1a1a;
  border: 1px solid #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: default;

  /* Naive UI 卡片内容 */
  :deep(.n-card__content) {
    padding: 32px;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
    border-color: var(--n-color-target, #fff);
  }
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.card-title {
  font-size: 1.25rem;
  color: #fff;
  font-weight: 700; /* 加粗体 */
  margin: 0;
  line-height: 1.4;
}

.card-desc {
  font-size: 1rem;
  color: #ccc; /* 略浅于标题 */
  line-height: 1.7;
  margin: 0;
  font-weight: 400;
}

/* 移动端适配 */
@media (max-width: 1024px) {
  .cards-container {
    flex-direction: column;
    align-items: center;
  }
  
  .privacy-card {
    width: 100%;
    max-width: 420px;
    min-height: auto;
  }
}
</style>
