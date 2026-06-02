/**
 * API 请求缓存管理
 * @description 实现请求结果的缓存机制，减少重复请求
 */

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  /** 缓存数据 */
  data: T
  /** 过期时间戳 */
  expireAt: number
}

/**
 * 请求缓存管理类
 */
class RequestCache {
  /** 缓存存储对象 */
  private cache: Map<string, CacheItem<unknown>> = new Map()

  /**
   * 生成缓存键
   * @param url - 请求 URL
   * @param params - 请求参数
   * @returns 缓存键
   */
  private generateKey(url: string, params?: Record<string, unknown>): string {
    if (!params) return url
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&')
    return `${url}?${sortedParams}`
  }

  /**
   * 获取缓存数据
   * @param url - 请求 URL
   * @param params - 请求参数
   * @returns 缓存数据或 null
   */
  get<T>(url: string, params?: Record<string, unknown>): T | null {
    const key = this.generateKey(url, params)
    const item = this.cache.get(key) as CacheItem<T> | undefined

    if (!item) return null

    // 检查是否过期
    if (Date.now() > item.expireAt) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  /**
   * 设置缓存数据
   * @param url - 请求 URL
   * @param data - 缓存数据
   * @param params - 请求参数
   * @param ttl - 缓存有效期（毫秒），默认 5 分钟
   */
  set<T>(url: string, data: T, params?: Record<string, unknown>, ttl = 5 * 60 * 1000): void {
    const key = this.generateKey(url, params)
    const item: CacheItem<T> = {
      data,
      expireAt: Date.now() + ttl
    }
    this.cache.set(key, item as CacheItem<unknown>)
  }

  /**
   * 清除指定缓存
   * @param url - 请求 URL
   * @param params - 请求参数
   */
  clear(url: string, params?: Record<string, unknown>): void {
    const key = this.generateKey(url, params)
    this.cache.delete(key)
  }

  /**
   * 清除所有缓存
   */
  clearAll(): void {
    this.cache.clear()
  }

  /**
   * 清除过期的缓存项
   */
  clearExpired(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireAt) {
        this.cache.delete(key)
      }
    }
  }
}

/**
 * 请求缓存实例
 */
export const requestCache = new RequestCache()

/**
 * 缓存装饰器
 * @param ttl - 缓存有效期（毫秒）
 * @returns 装饰器函数
 */
export function withCache(ttl = 5 * 60 * 1000) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(
    target: T,
    context: ClassMethodDecoratorContext
  ): T {
    return async function (this: unknown, ...args: unknown[]): Promise<unknown> {
      const url = args[0] as string
      const params = args[1] as Record<string, unknown> | undefined

      // 尝试从缓存获取
      const cached = requestCache.get(url, params)
      if (cached !== null) {
        if (import.meta.env.DEV) {
          console.log(`[Cache] Hit: ${url}`)
        }
        return cached
      }

      // 执行原始请求
      const result = await target.apply(this, args)

      // 缓存结果
      requestCache.set(url, result, params, ttl)

      return result
    } as T
  }
}
