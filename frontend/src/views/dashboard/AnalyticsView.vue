<template>
  <div class="analytics-view">
    <!-- 页头 -->
    <header class="page-header">
      <div class="header-left">
        <h2 class="page-title">数据分析</h2>
        <span class="page-subtitle">深度洞察平台运营数据</span>
      </div>
      <div class="header-right">
        <div class="date-range-picker">
          <button 
            v-for="range in dateRanges" 
            :key="range.value"
            :class="['range-btn', { active: selectedRange === range.value }]"
            @click="selectedRange = range.value"
          >
            {{ range.label }}
          </button>
        </div>
        <button class="export-btn" @click="exportData">
          <Download class="btn-icon" />
          导出数据
        </button>
      </div>
    </header>

    <!-- 内容区 -->
    <div class="content-area">
      <!-- 核心指标卡片 -->
      <div class="metrics-grid">
        <div 
          v-for="(metric, index) in coreMetrics" 
          :key="metric.label"
          class="metric-card"
          :style="{ animationDelay: `${0.1 + index * 0.1}s` }"
        >
          <div class="metric-header">
            <span class="metric-label">{{ metric.label }}</span>
            <span :class="['metric-change', metric.changeType]">
              <TrendingUp v-if="metric.changeType === 'up'" class="change-icon" />
              <TrendingDown v-else class="change-icon" />
              {{ metric.change }}
            </span>
          </div>
          <div class="metric-value">{{ metric.value }}</div>
          <div class="metric-chart">
            <div ref="metricChartRef" class="sparkline"></div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <!-- 用户增长趋势 -->
        <div class="chart-card large" :style="{ animationDelay: '0.5s' }">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">用户增长趋势</h3>
              <p class="chart-desc">新注册用户与活跃用户对比</p>
            </div>
            <div class="chart-legend">
              <span class="legend-item">
                <span class="legend-dot primary"></span>
                新注册用户
              </span>
              <span class="legend-item">
                <span class="legend-dot secondary"></span>
                活跃用户
              </span>
            </div>
          </div>
          <div ref="userGrowthChartRef" class="chart-container"></div>
        </div>

        <!-- 双列图表 -->
        <div class="charts-row">
          <!-- 项目分布 -->
          <div class="chart-card" :style="{ animationDelay: '0.6s' }">
            <div class="chart-header">
              <h3 class="chart-title">项目分布</h3>
              <p class="chart-desc">按类别统计</p>
            </div>
            <div ref="projectDistributionChartRef" class="chart-container"></div>
          </div>

          <!-- 用户来源 -->
          <div class="chart-card" :style="{ animationDelay: '0.7s' }">
            <div class="chart-header">
              <h3 class="chart-title">用户来源</h3>
              <p class="chart-desc">访问渠道分析</p>
            </div>
            <div ref="userSourceChartRef" class="chart-container"></div>
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="data-section" :style="{ animationDelay: '0.8s' }">
        <div class="section-header">
          <h3 class="section-title">热门项目排行</h3>
          <div class="section-actions">
            <button class="action-btn" @click="refreshData">
              <RefreshCw class="icon" />
            </button>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>项目名称</th>
                <th>类别</th>
                <th>浏览量</th>
                <th>点赞数</th>
                <th>转化率</th>
                <th>趋势</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(project, index) in topProjects" :key="project.id">
                <td>
                  <span :class="['rank-badge', { top: index < 3 }]">{{ index + 1 }}</span>
                </td>
                <td>
                  <div class="project-info">
                    <img :src="project.coverImage" :alt="project.name" class="project-thumb" />
                    <span class="project-name">{{ project.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="category-tag">{{ project.category }}</span>
                </td>
                <td>{{ formatNumber(project.viewsCount) }}</td>
                <td>{{ formatNumber(project.likesCount) }}</td>
                <td>
                  <div class="conversion-rate">
                    <div class="rate-bar">
                      <div class="rate-fill" :style="{ width: project.conversionRate + '%' }"></div>
                    </div>
                    <span class="rate-value">{{ project.conversionRate }}%</span>
                  </div>
                </td>
                <td>
                  <span :class="['trend-indicator', project.trend]">
                    <ArrowUp v-if="project.trend === 'up'" class="trend-icon" />
                    <ArrowDown v-else class="trend-icon" />
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  Download,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-vue-next'
import type { Ref } from 'vue'

// ==================== 状态管理 ====================

/** 选中的日期范围 */
const selectedRange = ref('7d')

/** 日期范围选项 */
const dateRanges = [
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' },
  { label: '1年', value: '1y' }
]

/** 核心指标数据 */
const coreMetrics = [
  { label: '总用户数', value: '12,847', change: '+23.5%', changeType: 'up' },
  { label: '活跃用户', value: '3,256', change: '+15.2%', changeType: 'up' },
  { label: '项目总数', value: '1,432', change: '+8.7%', changeType: 'up' },
  { label: '平均停留时长', value: '12m 34s', change: '-2.1%', changeType: 'down' }
]

/** 热门项目数据 */
const topProjects = [
  { id: 1, name: '智能照明系统', category: '科技创新', viewsCount: 15234, likesCount: 892, conversionRate: 12.5, trend: 'up', coverImage: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=100&q=80' },
  { id: 2, name: '极简家具系列', category: '设计创意', viewsCount: 12890, likesCount: 756, conversionRate: 10.2, trend: 'up', coverImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&q=80' },
  { id: 3, name: '海洋清洁计划', category: '可持续发展', viewsCount: 9876, likesCount: 623, conversionRate: 8.9, trend: 'down', coverImage: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=100&q=80' },
  { id: 4, name: '数字艺术画廊', category: '文化艺术', viewsCount: 8654, likesCount: 534, conversionRate: 7.5, trend: 'up', coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80' },
  { id: 5, name: '智能家居中枢', category: '科技创新', viewsCount: 7234, likesCount: 445, conversionRate: 6.8, trend: 'down', coverImage: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=100&q=80' }
]

// ==================== 图表引用 ====================

const userGrowthChartRef: Ref<HTMLElement | null> = ref(null)
const projectDistributionChartRef: Ref<HTMLElement | null> = ref(null)
const userSourceChartRef: Ref<HTMLElement | null> = ref(null)

// ==================== 方法 ====================

/**
 * 格式化数字
 */
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

/**
 * 导出数据
 */
function exportData() {
  console.log('导出数据')
}

/**
 * 刷新数据
 */
function refreshData() {
  console.log('刷新数据')
}

/**
 * 初始化用户增长图表
 */
const initUserGrowthChart = () => {
  nextTick(() => {
    if (userGrowthChartRef.value) {
      const chart = echarts.init(userGrowthChartRef.value)
      chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '0', right: '0', bottom: '20px', top: '20px', containLabel: true },
        xAxis: {
          type: 'category',
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#9ca3af' }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#f3f4f6' } },
          axisLabel: { color: '#9ca3af' }
        },
        series: [
          {
            name: '新注册用户',
            type: 'bar',
            data: [120, 200, 150, 80, 70, 110, 130],
            itemStyle: { color: '#000000', borderRadius: [4, 4, 0, 0] }
          },
          {
            name: '活跃用户',
            type: 'line',
            data: [80, 150, 120, 60, 50, 90, 100],
            smooth: true,
            lineStyle: { color: '#10b981', width: 2 },
            itemStyle: { color: '#10b981' }
          }
        ]
      })
      window.addEventListener('resize', () => chart.resize())
    }
  })
}

/**
 * 初始化项目分布图表
 */
const initProjectDistributionChart = () => {
  nextTick(() => {
    if (projectDistributionChartRef.value) {
      const chart = echarts.init(projectDistributionChartRef.value)
      chart.setOption({
        backgroundColor: 'transparent',
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 4,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: { show: false },
            data: [
              { value: 42, name: '科技创新', itemStyle: { color: '#000000' } },
              { value: 28, name: '设计创意', itemStyle: { color: '#6b7280' } },
              { value: 18, name: '可持续发展', itemStyle: { color: '#9ca3af' } },
              { value: 12, name: '文化艺术', itemStyle: { color: '#d1d5db' } }
            ]
          }
        ]
      })
      window.addEventListener('resize', () => chart.resize())
    }
  })
}

/**
 * 初始化用户来源图表
 */
const initUserSourceChart = () => {
  nextTick(() => {
    if (userSourceChartRef.value) {
      const chart = echarts.init(userSourceChartRef.value)
      chart.setOption({
        backgroundColor: 'transparent',
        radar: {
          indicator: [
            { name: '搜索引擎', max: 100 },
            { name: '社交媒体', max: 100 },
            { name: '直接访问', max: 100 },
            { name: '外部链接', max: 100 },
            { name: '邮件营销', max: 100 }
          ],
          axisName: { color: '#6b7280' },
          splitArea: { areaStyle: { color: ['#f9fafb', '#ffffff'] } }
        },
        series: [
          {
            type: 'radar',
            data: [
              {
                value: [85, 70, 60, 45, 30],
                name: '用户来源',
                areaStyle: { color: 'rgba(0, 0, 0, 0.1)' },
                lineStyle: { color: '#000000' },
                itemStyle: { color: '#000000' }
              }
            ]
          }
        ]
      })
      window.addEventListener('resize', () => chart.resize())
    }
  })
}

onMounted(() => {
  initUserGrowthChart()
  initProjectDistributionChart()
  initUserSourceChart()
})
</script>

<style scoped lang="scss">
$color-bg: #fafafa;
$color-white: #ffffff;
$color-black: #000000;
$color-gray-900: #111827;
$color-gray-600: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-200: #e5e7eb;
$color-gray-100: #f3f4f6;
$color-gray-50: #f9fafb;
$color-success: #10b981;
$color-danger: #ef4444;

$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

.analytics-view {
  min-height: 100vh;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(250, 250, 250, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: $color-gray-900;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: $color-gray-400;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.date-range-picker {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: $color-white;
  border: 1px solid $color-gray-200;
  border-radius: 8px;
}

.range-btn {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  color: $color-gray-600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: $color-gray-900;
  }

  &.active {
    background: $color-black;
    color: $color-white;
  }
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: $color-white;
  border: 1px solid $color-gray-200;
  border-radius: 8px;
  font-size: 14px;
  color: $color-gray-600;
  cursor: pointer;
  transition: all 0.3s ease;

  .btn-icon {
    width: 16px;
    height: 16px;
  }

  &:hover {
    border-color: $color-black;
    color: $color-gray-900;
  }
}

.content-area {
  padding: 32px;
  max-width: 1280px;
  margin: 0 auto;
}

// 核心指标卡片
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.metric-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 24px;
  animation: slideUp 0.6s $ease-out-expo forwards;
  opacity: 0;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-label {
  font-size: 13px;
  color: $color-gray-400;
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;

  &.up {
    color: $color-success;
  }

  &.down {
    color: $color-danger;
  }

  .change-icon {
    width: 14px;
    height: 14px;
  }
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: $color-gray-900;
  margin-bottom: 16px;
}

.metric-chart {
  height: 40px;
}

.sparkline {
  width: 100%;
  height: 100%;
}

// 图表区域
.charts-section {
  margin-bottom: 32px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  animation: slideUp 0.6s $ease-out-expo forwards;
  opacity: 0;

  &.large {
    .chart-container {
      height: 320px;
    }
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: $color-gray-900;
  margin-bottom: 4px;
}

.chart-desc {
  font-size: 13px;
  color: $color-gray-400;
}

.chart-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: $color-gray-600;

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.primary {
      background: $color-black;
    }

    &.secondary {
      background: $color-success;
    }
  }
}

.chart-container {
  width: 100%;
  height: 240px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

// 数据表格区域
.data-section {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 24px;
  animation: slideUp 0.6s $ease-out-expo forwards;
  opacity: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: $color-gray-900;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: $color-gray-100;
  }

  .icon {
    width: 16px;
    height: 16px;
    color: $color-gray-600;
  }
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  th {
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 500;
    color: $color-gray-400;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: left;
    border-bottom: 1px solid $color-gray-100;
  }

  td {
    padding: 16px;
    border-bottom: 1px solid $color-gray-50;
    font-size: 14px;
    color: $color-gray-600;
  }
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: $color-gray-100;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  color: $color-gray-600;

  &.top {
    background: $color-black;
    color: $color-white;
  }
}

.project-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.project-name {
  font-weight: 500;
  color: $color-gray-900;
}

.category-tag {
  display: inline-block;
  padding: 4px 12px;
  background: $color-gray-100;
  border-radius: 9999px;
  font-size: 12px;
  color: $color-gray-600;
}

.conversion-rate {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rate-bar {
  width: 80px;
  height: 6px;
  background: $color-gray-100;
  border-radius: 3px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  background: $color-black;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.rate-value {
  font-size: 13px;
  font-weight: 500;
  color: $color-gray-900;
  min-width: 40px;
}

.trend-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;

  &.up {
    background: rgba(16, 185, 129, 0.1);
    color: $color-success;
  }

  &.down {
    background: rgba(239, 68, 68, 0.1);
    color: $color-danger;
  }

  .trend-icon {
    width: 16px;
    height: 16px;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
