import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 性能指标接口
 * @interface PerformanceMetrics
 */
interface PerformanceMetrics {
  /** 首次内容绘制时间 */
  fcp: number | null
  /** 最大内容绘制时间 */
  lcp: number | null
  /** 首次输入延迟 */
  fid: number | null
  /** 累积布局偏移 */
  cls: number | null
  /** 首字节时间 */
  ttfb: number | null
  /** 资源加载时间 */
  resourceLoadTime: number | null
  /** DOM 解析时间 */
  domParseTime: number | null
  /** 总加载时间 */
  totalLoadTime: number | null
}

/**
 * 性能监控选项
 * @interface PerformanceMonitorOptions
 */
interface PerformanceMonitorOptions {
  /** 是否启用日志输出 */
  enableLogging?: boolean
  /** 是否上报性能数据 */
  enableReporting?: boolean
  /** 上报 URL */
  reportUrl?: string
  /** 性能阈值（超过则警告） */
  thresholds?: {
    fcp?: number
    lcp?: number
    fid?: number
    cls?: number
  }
}

/**
 * 性能监控 Composable
 * @description 用于监控和分析页面性能指标
 * @param options - 监控选项
 * @returns 性能指标和工具方法
 * @example
 * const { metrics, startMonitoring, stopMonitoring } = usePerformanceMonitor({
 *   enableLogging: true,
 *   thresholds: { lcp: 2500, fid: 100 }
 * })
 */
export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const {
    enableLogging = false,
    enableReporting = false,
    reportUrl = '',
    thresholds = {
      fcp: 1800,
      lcp: 2500,
      fid: 100,
      cls: 0.1
    }
  } = options

  // 性能指标状态
  const metrics = ref<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    resourceLoadTime: null,
    domParseTime: null,
    totalLoadTime: null
  })

  // 观察器引用
  let lcpObserver: PerformanceObserver | null = null
  let fidObserver: PerformanceObserver | null = null
  let clsObserver: PerformanceObserver | null = null

  /**
   * 获取导航计时数据
   * @description 从 Performance API 获取页面导航相关的时间数据
   */
  const getNavigationTiming = (): void => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!navigation) return

    metrics.value.ttfb = navigation.responseStart - navigation.startTime
    metrics.value.domParseTime = navigation.domComplete - navigation.domInteractive
    metrics.value.totalLoadTime = navigation.loadEventEnd - navigation.startTime
    metrics.value.resourceLoadTime = navigation.loadEventEnd - navigation.responseEnd

    if (enableLogging) {
      console.log('[Performance] Navigation Timing:', {
        TTFB: `${metrics.value.ttfb}ms`,
        DOM解析: `${metrics.value.domParseTime}ms`,
        总加载时间: `${metrics.value.totalLoadTime}ms`,
        资源加载时间: `${metrics.value.resourceLoadTime}ms`
      })
    }
  }

  /**
   * 测量首次内容绘制 (FCP)
   * @description 监控页面首次内容绘制的时间
   */
  const measureFCP = (): void => {
    const paintEntries = performance.getEntriesByType('paint')
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    
    if (fcpEntry) {
      metrics.value.fcp = fcpEntry.startTime
      
      if (enableLogging) {
        console.log(`[Performance] FCP: ${metrics.value.fcp}ms`)
      }

      // 检查是否超过阈值
      if (thresholds.fcp && metrics.value.fcp > thresholds.fcp) {
        console.warn(`[Performance] FCP 超过阈值: ${metrics.value.fcp}ms > ${thresholds.fcp}ms`)
      }
    }
  }

  /**
   * 测量最大内容绘制 (LCP)
   * @description 使用 PerformanceObserver 监控 LCP
   */
  const measureLCP = (): void => {
    if (!('PerformanceObserver' in window)) return

    lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]

      if (lastEntry) {
        metrics.value.lcp = lastEntry.startTime

        if (enableLogging) {
          console.log(`[Performance] LCP: ${metrics.value.lcp}ms`, lastEntry)
        }

        // 检查是否超过阈值
        if (thresholds.lcp && metrics.value.lcp > thresholds.lcp) {
          console.warn(`[Performance] LCP 超过阈值: ${metrics.value.lcp}ms > ${thresholds.lcp}ms`)
        }
      }
    })

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
  }

  /**
   * 测量首次输入延迟 (FID)
   * @description 监控用户首次交互的响应时间
   */
  const measureFID = (): void => {
    if (!('PerformanceObserver' in window)) return

    fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEventTiming
        metrics.value.fid = fidEntry.processingStart - fidEntry.startTime

        if (enableLogging) {
          console.log(`[Performance] FID: ${metrics.value.fid}ms`)
        }

        // 检查是否超过阈值
        if (thresholds.fid && metrics.value.fid > thresholds.fid) {
          console.warn(`[Performance] FID 超过阈值: ${metrics.value.fid}ms > ${thresholds.fid}ms`)
        }
      })
    })

    fidObserver.observe({ entryTypes: ['first-input'] })
  }

  /**
   * 测量累积布局偏移 (CLS)
   * @description 监控页面布局的稳定性
   */
  const measureCLS = (): void => {
    if (!('PerformanceObserver' in window)) return

    let clsValue = 0

    clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      
      entries.forEach((entry) => {
        const layoutShiftEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value
        }
      })

      metrics.value.cls = clsValue

      if (enableLogging) {
        console.log(`[Performance] CLS: ${metrics.value.cls}`)
      }

      // 检查是否超过阈值
      if (thresholds.cls && metrics.value.cls > thresholds.cls) {
        console.warn(`[Performance] CLS 超过阈值: ${metrics.value.cls} > ${thresholds.cls}`)
      }
    })

    clsObserver.observe({ entryTypes: ['layout-shift'] })
  }

  /**
   * 上报性能数据
   * @description 将性能数据发送到指定端点
   */
  const reportMetrics = (): void => {
    if (!enableReporting || !reportUrl) return

    const data = {
      url: window.location.href,
      timestamp: Date.now(),
      metrics: metrics.value,
      userAgent: navigator.userAgent,
      connection: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType
    }

    // 使用 sendBeacon 确保数据可靠发送
    if (navigator.sendBeacon) {
      navigator.sendBeacon(reportUrl, JSON.stringify(data))
    } else {
      fetch(reportUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(() => undefined)
    }
  }

  /**
   * 开始监控
   * @description 启动所有性能监控
   */
  const startMonitoring = (): void => {
    // 等待页面加载完成
    if (document.readyState === 'complete') {
      initMonitoring()
    } else {
      window.addEventListener('load', initMonitoring)
    }
  }

  /**
   * 初始化监控
   * @description 在页面加载完成后初始化所有监控
   */
  const initMonitoring = (): void => {
    getNavigationTiming()
    measureFCP()
    measureLCP()
    measureFID()
    measureCLS()

    // 页面卸载前上报数据
    window.addEventListener('beforeunload', reportMetrics)
  }

  /**
   * 停止监控
   * @description 停止所有性能监控并清理资源
   */
  const stopMonitoring = (): void => {
    lcpObserver?.disconnect()
    fidObserver?.disconnect()
    clsObserver?.disconnect()

    lcpObserver = null
    fidObserver = null
    clsObserver = null

    window.removeEventListener('beforeunload', reportMetrics)
  }

  // 自动启动监控
  onMounted(() => {
    startMonitoring()
  })

  // 清理
  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    metrics,
    startMonitoring,
    stopMonitoring,
    reportMetrics
  }
}

export default usePerformanceMonitor
