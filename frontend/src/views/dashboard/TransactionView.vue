<template>
  <div class="transaction-view">
    <header class="page-header">
      <div class="header-left">
        <h2 class="page-title">交易记录</h2>
        <span class="page-subtitle">查看所有交易明细</span>
      </div>
    </header>

    <div class="content-area">
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>交易ID</th>
              <th>项目</th>
              <th>金额</th>
              <th>状态</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transactions" :key="tx.id">
              <td>#{{ tx.id }}</td>
              <td>{{ tx.project }}</td>
              <td class="amount">¥{{ tx.amount }}</td>
              <td>
                <span :class="['status-badge', tx.status]">{{ tx.statusText }}</span>
              </td>
              <td>{{ tx.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const transactions = ref([
  { id: 'TX001', project: '智能照明系统', amount: '25,000', status: 'success', statusText: '成功', time: '2024-01-15 14:30' },
  { id: 'TX002', project: '极简家具系列', amount: '8,000', status: 'pending', statusText: '处理中', time: '2024-01-15 12:15' },
  { id: 'TX003', project: '海洋清洁计划', amount: '50,000', status: 'success', statusText: '成功', time: '2024-01-14 16:45' }
])
</script>

<style scoped lang="scss">
$color-gray-900: #111827;
$color-gray-600: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-100: #f3f4f6;
$color-success: #10b981;
$color-warning: #f59e0b;

.transaction-view {
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

.content-area {
  padding: 32px;
  max-width: 1280px;
  margin: 0 auto;
}

.table-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 24px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 16px;
    text-align: left;
    border-bottom: 1px solid $color-gray-100;
  }

  th {
    font-size: 12px;
    font-weight: 500;
    color: $color-gray-400;
    text-transform: uppercase;
  }

  td {
    font-size: 14px;
    color: $color-gray-600;
  }

  .amount {
    font-weight: 600;
    color: $color-gray-900;
  }
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;

  &.success {
    background: rgba(16, 185, 129, 0.1);
    color: $color-success;
  }

  &.pending {
    background: rgba(245, 158, 11, 0.1);
    color: $color-warning;
  }
}
</style>
