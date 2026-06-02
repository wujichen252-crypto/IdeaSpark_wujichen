<template>
  <div class="security-log-view">
    <header class="page-header">
      <div class="header-left">
        <h2 class="page-title">安全日志</h2>
        <span class="page-subtitle">查看账户安全相关记录</span>
      </div>
    </header>

    <div class="content-area">
      <div class="log-card">
        <div class="log-timeline">
          <div v-for="log in logs" :key="log.id" class="log-item">
            <div class="log-icon" :class="log.type">
              <component :is="log.icon" />
            </div>
            <div class="log-content">
              <div class="log-header">
                <h4 class="log-title">{{ log.title }}</h4>
                <span class="log-time">{{ log.time }}</span>
              </div>
              <p class="log-desc">{{ log.description }}</p>
              <div class="log-meta">
                <span class="log-ip">IP: {{ log.ip }}</span>
                <span class="log-device">{{ log.device }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LogIn, Shield, Key, AlertTriangle } from 'lucide-vue-next'

const logs = ref([
  { id: 1, title: '登录成功', description: '账户在 Chrome 浏览器登录成功', time: '2024-01-15 14:30:25', ip: '192.168.1.1', device: 'Windows 11', type: 'success', icon: LogIn },
  { id: 2, title: '密码修改', description: '账户密码已成功修改', time: '2024-01-14 10:15:33', ip: '192.168.1.1', device: 'Windows 11', type: 'info', icon: Key },
  { id: 3, title: '安全验证', description: '两步验证已启用', time: '2024-01-13 16:45:12', ip: '192.168.1.1', device: 'iPhone 15', type: 'success', icon: Shield },
  { id: 4, title: '异常登录尝试', description: '检测到来自未知设备的登录尝试', time: '2024-01-12 08:20:45', ip: '203.0.113.1', device: 'Unknown', type: 'warning', icon: AlertTriangle }
])
</script>

<style scoped lang="scss">
$color-gray-900: #111827;
$color-gray-600: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-200: #e5e7eb;
$color-gray-100: #f3f4f6;
$color-success: #10b981;
$color-warning: #f59e0b;

.security-log-view {
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

.log-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 24px;
}

.log-timeline {
  position: relative;
  padding-left: 40px;

  &:before {
    content: '';
    position: absolute;
    left: 16px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: $color-gray-200;
  }
}

.log-item {
  position: relative;
  padding-bottom: 24px;

  &:last-child {
    padding-bottom: 0;
  }
}

.log-icon {
  position: absolute;
  left: -32px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  z-index: 1;

  &.success {
    background: rgba(16, 185, 129, 0.1);
    color: $color-success;
  }

  &.info {
    background: $color-gray-100;
    color: $color-gray-600;
  }

  &.warning {
    background: rgba(245, 158, 11, 0.1);
    color: $color-warning;
  }
}

.log-content {
  padding-left: 16px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.log-title {
  font-size: 14px;
  font-weight: 600;
  color: $color-gray-900;
}

.log-time {
  font-size: 12px;
  color: $color-gray-400;
}

.log-desc {
  font-size: 13px;
  color: $color-gray-600;
  margin-bottom: 8px;
}

.log-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: $color-gray-400;
}
</style>
