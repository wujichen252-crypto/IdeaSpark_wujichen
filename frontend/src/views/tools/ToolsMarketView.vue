<template>
  <div class="tools-market">
    <!-- 页面头部 -->
    <div class="market-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">工具市场</h1>
          <p class="page-subtitle">探索强大的创意工具，提升你的工作效率</p>
        </div>
        <div class="header-search">
          <n-input
            v-model:value="searchKeyword"
            placeholder="搜索工具名称、标签..."
            clearable
            class="search-input"
          >
            <template #prefix>
              <n-icon :component="SearchOutline" />
            </template>
          </n-input>
        </div>
      </div>
    </div>

    <!-- 分类筛选 -->
    <div class="filter-bar">
      <div class="filter-content">
        <div class="filter-tabs">
          <button
            v-for="tab in categoryTabs"
            :key="tab.value"
            :class="['filter-tab', { active: activeCategory === tab.value }]"
            @click="activeCategory = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 工具列表 -->
    <div class="tools-section">
      <div class="tools-content">
        <!-- 我的工具 -->
        <template v-if="activeCategory === 'my'">
          <div v-if="myToolsList.length === 0" class="empty-state">
            <n-empty description="您还没有获取任何工具，快去工具市场看看吧" />
          </div>
          <div v-else class="tools-grid">
            <ToolMarketCard
              v-for="tool in myToolsList"
              :key="tool.id"
              :tool="tool"
              :owned="true"
              @detail="openDetail"
              @free-use="handleFreeUse"
              @purchase="openPurchase"
            />
          </div>
        </template>

        <!-- 全部分类：分栏展示 -->
        <template v-else-if="activeCategory === 'all'">
          <div v-if="freeList.length" class="section-block">
            <div class="section-title-bar">
              <n-tag type="success" size="small" round>免费</n-tag>
              <h3 class="section-title">官方工具</h3>
              <p class="section-subtitle">IdeaSpark 提供的免费基础工具</p>
            </div>
            <div class="tools-grid">
              <ToolMarketCard
                v-for="tool in freeList"
                :key="tool.id"
                :tool="tool"
                :owned="isOwned(tool.key)"
                @detail="openDetail"
                @free-use="handleFreeUse"
                @purchase="openPurchase"
              />
            </div>
          </div>

          <div v-if="proList.length" class="section-block">
            <div class="section-title-bar">
              <n-tag type="error" size="small" round>Pro</n-tag>
              <h3 class="section-title">高级工具</h3>
              <p class="section-subtitle">释放更多专业功能，释放无限创意</p>
            </div>
            <div class="tools-grid">
              <ToolMarketCard
                v-for="tool in proList"
                :key="tool.id"
                :tool="tool"
                :owned="isOwned(tool.key)"
                @detail="openDetail"
                @free-use="handleFreeUse"
                @purchase="openPurchase"
              />
            </div>
          </div>
        </template>

        <!-- 其他分类：单列表 -->
        <template v-else>
          <div v-if="filteredTools.length === 0" class="empty-state">
            <n-empty description="没有找到匹配的工具" />
          </div>
          <div v-else class="tools-grid">
            <ToolMarketCard
              v-for="tool in filteredTools"
              :key="tool.id"
              :tool="tool"
              :owned="isOwned(tool.key)"
              @detail="openDetail"
              @free-use="handleFreeUse"
              @purchase="openPurchase"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- 工具详情弹窗 -->
    <n-modal
      v-model:show="showDetailModal"
      preset="card"
      :title="selectedTool?.name"
      style="width: 520px; max-width: 90vw"
      :bordered="false"
      segmented
    >
      <div v-if="selectedTool" class="detail-body">
        <div class="detail-header">
          <div class="detail-icon" :style="{ backgroundColor: resolveColor(selectedTool.color) }">
            <component :is="getIcon(selectedTool.icon)" class="detail-icon-svg" />
          </div>
          <div class="detail-meta">
            <h2 class="detail-name">{{ selectedTool.name }}</h2>
            <div class="detail-badges">
              <n-tag
v-if="selectedTool.source === 'official'"
type="success"
size="small"
round>
                官方免费
              </n-tag>
              <n-tag
v-else
type="error"
size="small"
round>专业版</n-tag>
              <span v-if="selectedTool.source === 'premium'" class="detail-price">
                ¥{{ selectedTool.price }}/月
              </span>
            </div>
          </div>
        </div>
        <p class="detail-desc">{{ selectedTool.description }}</p>
        <div class="detail-features">
          <h4>功能亮点</h4>
          <ul>
            <li>在线实时编辑，无需安装任何软件</li>
            <li>云端自动保存，随时随地继续创作</li>
            <li>支持多种格式导入导出</li>
            <li>与 IdeaSpark 项目无缝集成</li>
          </ul>
        </div>
        <div class="detail-tags" v-if="selectedTool.tags">
          <n-tag
            v-for="tag in selectedTool.tags.split(',')"
            :key="tag"
            size="small"
            round
            :bordered="false"
          >
            {{ tag.trim() }}
          </n-tag>
        </div>
      </div>
      <template #footer>
        <div class="detail-footer">
          <n-button @click="showDetailModal = false">关闭</n-button>
          <n-button
            v-if="selectedTool && isOwned(selectedTool.key)"
            type="success"
            disabled
          >
            已拥有
          </n-button>
          <n-button
            v-else-if="selectedTool?.source === 'official'"
            type="success"
            @click="handleFreeUse(selectedTool); showDetailModal = false"
          >
            免费使用
          </n-button>
          <n-button
            v-else
            type="primary"
            @click="openPurchase(selectedTool!); showDetailModal = false"
          >
            立即开通
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 购买/订阅弹窗 -->
    <n-modal
      v-model:show="showPurchaseModal"
      preset="card"
      title="开通工具"
      style="width: 480px; max-width: 90vw"
      :bordered="false"
      segmented
    >
      <div v-if="purchaseTool" class="purchase-body">
        <div class="purchase-summary">
          <div class="purchase-icon" :style="{ backgroundColor: resolveColor(purchaseTool.color) }">
            <component :is="getIcon(purchaseTool.icon)" class="purchase-icon-svg" />
          </div>
          <div class="purchase-info">
            <h3 class="purchase-name">{{ purchaseTool.name }}</h3>
            <p class="purchase-desc">{{ purchaseTool.description }}</p>
          </div>
        </div>
        <div class="purchase-divider" ></div>
        <div class="purchase-plan">
          <div class="plan-row">
            <span class="plan-label">订阅周期</span>
            <n-radio-group v-model:value="purchaseMonths" size="small">
              <n-radio-button :value="1">1个月</n-radio-button>
              <n-radio-button :value="3">3个月</n-radio-button>
              <n-radio-button :value="12">12个月</n-radio-button>
            </n-radio-group>
          </div>
          <div class="plan-row total">
            <span class="plan-label">应付金额</span>
            <span class="plan-price">
              <span class="currency">¥</span>
              <span class="amount">{{ totalPrice }}</span>
            </span>
          </div>
        </div>
        <div class="purchase-divider" ></div>
        <div class="purchase-pay">
          <div class="pay-title">选择支付方式</div>
          <n-radio-group v-model:value="payMethod" class="pay-options">
            <n-radio value="alipay">
              <div class="pay-option">
                <div class="pay-icon alipay">支</div>
                <span>支付宝</span>
              </div>
            </n-radio>
            <n-radio value="wechat">
              <div class="pay-option">
                <div class="pay-icon wechat">微</div>
                <span>微信支付</span>
              </div>
            </n-radio>
          </n-radio-group>
        </div>
      </div>
      <template #footer>
        <div class="purchase-footer">
          <n-button @click="showPurchaseModal = false">取消</n-button>
          <n-button type="primary" :loading="purchaseLoading" @click="confirmPurchase">
            确认支付 ¥{{ totalPrice }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
import type { Component } from 'vue'
import {
  DocumentTextOutline,
  DocumentOutline,
  GridOutline,
  EaselOutline,
  SparklesOutline,
  ImageOutline,
  VideocamOutline,
  MusicalNotesOutline,
  ColorPaletteOutline,
  CodeSlashOutline,
  BarChartOutline,
  LanguageOutline
} from '@vicons/ionicons5'
import { getPlugins, type Plugin } from '@/api/plugin'
import {
  getMyPlugins,
  getMyPluginKeys,
  acquireFreePlugin,
  purchasePlugin
} from '@/api/userPlugin'
import ToolMarketCard from './components/ToolMarketCard.vue'

const message = useMessage()

const iconMap: Record<string, Component> = {
  DocumentTextOutline,
  DocumentOutline,
  GridOutline,
  EaselOutline,
  SparklesOutline,
  ImageOutline,
  VideocamOutline,
  MusicalNotesOutline,
  ColorPaletteOutline,
  CodeSlashOutline,
  BarChartOutline,
  LanguageOutline
}

// 所有工具列表
const allTools = ref<Plugin[]>([])
// 用户已拥有的插件Key列表
const ownedPluginKeys = ref<string[]>([])
// 搜索关键词
const searchKeyword = ref('')
// 当前分类
const activeCategory = ref('all')
// 加载状态
const loading = ref(false)

// 弹窗状态
const showDetailModal = ref(false)
const selectedTool = ref<Plugin | null>(null)

const showPurchaseModal = ref(false)
const purchaseTool = ref<Plugin | null>(null)
const purchaseMonths = ref(1)
const payMethod = ref('alipay')
const purchaseLoading = ref(false)

/**
 * 分类标签
 */
const categoryTabs = [
  { label: '全部', value: 'all' },
  { label: '我的工具', value: 'my' },
  { label: '官方免费', value: 'official' },
  { label: 'AI 工具', value: 'ai' },
  { label: '媒体处理', value: 'media' },
  { label: '设计工具', value: 'design' },
  { label: '开发工具', value: 'dev' },
  { label: '数据分析', value: 'data' }
]

/**
 * 过滤后的工具列表
 */
const filteredTools = computed(() => {
  let result = allTools.value.filter(t => Boolean(t.isActive))

  // 分类筛选
  if (activeCategory.value === 'official') {
    result = result.filter(t => t.source === 'official')
  } else if (activeCategory.value !== 'all' && activeCategory.value !== 'my') {
    result = result.filter(t => {
      const category = (t.category || '').toLowerCase()
      const tags = (t.tags || '').toLowerCase()
      const keyword = activeCategory.value.toLowerCase()
      return category.includes(keyword) || tags.includes(keyword)
    })
  }

  // 搜索筛选
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (keyword) {
    result = result.filter(
      t =>
        t.name.toLowerCase().includes(keyword) ||
        (t.description || '').toLowerCase().includes(keyword) ||
        (t.tags || '').toLowerCase().includes(keyword) ||
        (t.category || '').toLowerCase().includes(keyword)
    )
  }

  return result
})

/**
 * 我的工具列表
 */
const myToolsList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  let result = allTools.value.filter(t => ownedPluginKeys.value.includes(t.key || ''))
  if (keyword) {
    result = result.filter(
      t =>
        t.name.toLowerCase().includes(keyword) ||
        (t.description || '').toLowerCase().includes(keyword) ||
        (t.tags || '').toLowerCase().includes(keyword)
    )
  }
  return result
})

const freeList = computed(() => filteredTools.value.filter(t => t.source === 'official'))
const proList = computed(() => filteredTools.value.filter(t => t.source === 'premium'))

/**
 * 计算总价
 */
const totalPrice = computed(() => {
  if (!purchaseTool.value || !purchaseTool.value.price) return 0
  const price = Number(purchaseTool.value.price)
  if (purchaseMonths.value === 12) {
    return Math.round(price * 12 * 0.9)
  }
  if (purchaseMonths.value === 3) {
    return Math.round(price * 3 * 0.95)
  }
  return Math.round(price * purchaseMonths.value)
})

function getIcon(iconName: string): Component {
  return iconMap[iconName] || DocumentTextOutline
}

function resolveColor(color?: string): string {
  if (!color) return '#64748b'
  return color.startsWith('#') ? color : `#${color}`
}

function isOwned(pluginKey?: string): boolean {
  return !!pluginKey && ownedPluginKeys.value.includes(pluginKey)
}

async function loadTools() {
  loading.value = true
  try {
    const res = await getPlugins('all')
    if (res.data.data?.plugins) {
      allTools.value = res.data.data.plugins
    }
  } catch (error) {
    console.error('加载工具列表失败:', error)
    message.error('加载工具列表失败')
  } finally {
    loading.value = false
  }
}

async function loadOwnedPlugins() {
  try {
    const res = await getMyPluginKeys()
    if (res.data.data?.pluginKeys) {
      ownedPluginKeys.value = res.data.data.pluginKeys
    }
  } catch (error) {
    console.error('加载我的插件失败:', error)
  }
}

function openDetail(tool: Plugin) {
  selectedTool.value = tool
  showDetailModal.value = true
}

function openPurchase(tool: Plugin) {
  purchaseTool.value = tool
  purchaseMonths.value = 1
  payMethod.value = 'alipay'
  showPurchaseModal.value = true
}

async function confirmPurchase() {
  if (!purchaseTool.value) return
  purchaseLoading.value = true
  try {
    await purchasePlugin(purchaseTool.value.key || '', purchaseMonths.value)
    message.success(`已成功开通 ${purchaseTool.value.name}（${purchaseMonths.value}个月）`)
    // 刷新拥有列表
    await loadOwnedPlugins()
    showPurchaseModal.value = false
  } catch (error: any) {
    message.error(error?.response?.data?.message || '支付失败，请重试')
  } finally {
    purchaseLoading.value = false
  }
}

async function handleFreeUse(tool: Plugin) {
  try {
    await acquireFreePlugin(tool.key || '')
    message.success(`${tool.name} 已添加到您的工具箱`)
    await loadOwnedPlugins()
  } catch (error: any) {
    message.error(error?.response?.data?.message || '获取失败')
  }
}

onMounted(() => {
  Promise.all([loadTools(), loadOwnedPlugins()])
})
</script>

<style scoped lang="scss">
.tools-market {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24px;
}

.market-header {
  margin-bottom: 24px;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .page-title {
    font-size: 32px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0 0 8px;
  }

  .page-subtitle {
    font-size: 16px;
    color: #6b7280;
    margin: 0;
  }

  .header-search {
    flex-shrink: 0;

    .search-input {
      width: 280px;
    }
  }
}

.filter-bar {
  max-width: 1200px;
  margin: 0 auto 24px;

  .filter-tabs {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .filter-tab {
    padding: 8px 18px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    font-size: 14px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      border-color: #111827;
      color: #111827;
    }

    &.active {
      background: #111827;
      border-color: #111827;
      color: #ffffff;
    }
  }
}

.tools-section {
  max-width: 1200px;
  margin: 0 auto;
}

.empty-state {
  padding: 80px 0;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.section-block {
  margin-bottom: 40px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;

  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
  }

  .section-subtitle {
    font-size: 13px;
    color: #9ca3af;
    margin: 0;
    width: 100%;
    padding-left: 0;
  }
}

/* Detail Modal */
.detail-body {
  .detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .detail-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;

    .detail-icon-svg {
      width: 32px;
      height: 32px;
      color: #fff;
    }
  }

  .detail-meta {
    .detail-name {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 8px;
    }

    .detail-badges {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .detail-price {
      font-size: 18px;
      font-weight: 700;
      color: #ef4444;
    }
  }

  .detail-desc {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.7;
    margin-bottom: 16px;
  }

  .detail-features {
    margin-bottom: 16px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 10px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;

      li {
        font-size: 13px;
        color: #6b7280;
        padding-left: 18px;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9ca3af;
        }
      }
    }
  }

  .detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Purchase Modal */
.purchase-body {
  .purchase-summary {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;

    .purchase-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      .purchase-icon-svg {
        width: 28px;
        height: 28px;
        color: #fff;
      }
    }

    .purchase-info {
      .purchase-name {
        font-size: 16px;
        font-weight: 600;
        color: #1a1a2e;
        margin: 0 0 4px;
      }

      .purchase-desc {
        font-size: 13px;
        color: #6b7280;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }

  .purchase-divider {
    height: 1px;
    background: #f0f0f0;
    margin: 16px 0;
  }

  .purchase-plan {
    .plan-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;

      &.total {
        margin-bottom: 0;
        align-items: flex-end;
      }
    }

    .plan-label {
      font-size: 14px;
      color: #6b7280;
    }

    .plan-price {
      color: #ef4444;

      .currency {
        font-size: 14px;
        font-weight: 600;
      }

      .amount {
        font-size: 28px;
        font-weight: 700;
      }
    }
  }

  .purchase-pay {
    .pay-title {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 12px;
    }

    .pay-options {
      display: flex;
      flex-direction: column;
      gap: 12px;

      :deep(.n-radio__label) {
        padding-left: 8px;
      }
    }

    .pay-option {
      display: flex;
      align-items: center;
      gap: 10px;

      .pay-icon {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        color: #fff;

        &.alipay {
          background: #1677ff;
        }

        &.wechat {
          background: #07c160;
        }
      }
    }
  }
}

.purchase-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .market-header {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .header-search .search-input {
      width: 100%;
      min-width: 260px;
    }
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>
