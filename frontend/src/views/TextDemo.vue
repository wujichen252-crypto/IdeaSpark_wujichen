<template>
  <div>
    <!-- 顶部导航栏 -->
    <n-layout-header bordered class="nav">
      <div class="nav-content">
        <div class="logo">IdeaSpark Market</div>
        <n-space align="center" size="large">
          <n-button text>首页</n-button>
          <n-button text>市场</n-button>
          <n-button text>关于</n-button>
        </n-space>
      </div>
    </n-layout-header>

    <n-layout>
      <!-- 搜索栏 + Tabs 分类 -->
      <div class="header-section">
        <n-input
          v-model:value="keyword"
          round
          size="large"
          placeholder="搜索你想要的内容..."
          class="search-box"
        />
        <n-tabs v-model:value="activeTab" type="line" animated>
          <n-tab name="all">全部</n-tab>
          <n-tab name="ui">UI 设计</n-tab>
          <n-tab name="code">代码模板</n-tab>
          <n-tab name="logo">Logo / 图形</n-tab>
        </n-tabs>
      </div>

      <!-- 筛选器 -->
      <div class="filter-bar">
        <n-space justify="space-between" align="center">
<!-- 左侧筛选 -->
          <n-space>
            <n-select
              v-model:value="sort"
              style="width: 160px"
              :options="sortOptions"
              placeholder="排序方式"
            />
            <n-select
              v-model:value="price"
              style="width: 160px"
              :options="priceOptions"
              placeholder="价格范围"
            />
          </n-space>

          <!-- 标签选择 -->
          <n-space>
            <n-tag
              checkable
              :checked="tag === '热门'"
              @update:checked="changeTag('热门', $event)"
            >
              热门
            </n-tag>
            <n-tag
              checkable
              :checked="tag === '最新'"
              @update:checked="changeTag('最新', $event)"
            >
              最新
            </n-tag>
            <n-tag
              checkable
              :checked="tag === '高评分'"
              @update:checked="changeTag('高评分', $event)"
            >
              高评分
            </n-tag>
          </n-space>
        </n-space>
      </div>

      <!-- 市场卡片内容区域 -->
      <n-grid
:cols="3"
x-gap="20"
y-gap="20"
class="market-grid">
        <n-gi v-for="item in items" :key="item.id">
          <n-card hoverable>
            <img :src="item.cover" class="cover" />
            <h3>{{ item.title }}</h3>
            <p class="desc">{{ item.desc }}</p>
            <n-space justify="space-between" align="center">
              <span class="price">¥ {{ item.price }}</span>
              <n-button round secondary size="small">查看</n-button>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>

      <!-- 分页器 -->
      <div class="pagination">
        <n-pagination v-model:page="page" :page-count="10" />
      </div>
    </n-layout>
  </div>
</template>

<script setup>
import { ref } from "vue";

const keyword = ref("");
const activeTab = ref("all");
const sort = ref(null);
const price = ref(null);
const tag = ref(null);
const page = ref(1);

const sortOptions = [
  { label: "最新", value: "new" },
  { label: "热门", value: "hot" },
  { label: "价格（低 → 高）", value: "price_low" },
  { label: "价格（高 → 低）", value: "price_high" }
];

const priceOptions = [
  { label: "免费", value: "free" },
  { label: "¥1 - ¥50", value: "1-50" },
  { label: "¥50 - ¥200", value: "50-200" },
  { label: "¥200+", value: "200+" }
];

const items = ref(
  Array.from({ length: 9 }).map((_, i) => ({
    id: i,
    title: "作品示例 " + (i + 1),
    desc: "这是一段作品的简短描述，用于演示布局效果。",
    price: Math.floor(Math.random() * 200),
    cover:
      "https://picsum.photos/400/300?random=" + (i + 1)
  }))
);

function changeTag(name, checked) {
  tag.value = checked ? name : null;
}
</script>

<style scoped>
.nav {
  height: 64px;
  display: flex;
  align-items: center;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.6);
  position: sticky;
  top: 0;
  z-index: 999;
}
.nav-content {
  width: 1200px;
  margin: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo {
  font-size: 20px;
  font-weight: bold;
}

.header-section {
  padding: 40px 0 20px;
  width: 1200px;
  margin: auto;
}
.search-box {
  width: 60%;
  margin: auto;
  display: block;
  margin-bottom: 20px;
}

.filter-bar {
  width: 1200px;
  margin: 0 auto 20px;
}

.market-grid {
  width: 1200px;
  margin: auto;
}

.cover {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 8px;
}

.desc {
  color: #888;
  font-size: 12px;
  margin-bottom: 8px;
}

.price {
  color: #2E8B57;
  font-weight: bold;
}

.pagination {
  width: 1200px;
  margin: 40px auto;
  display: flex;
  justify-content: center;
}
</style>
