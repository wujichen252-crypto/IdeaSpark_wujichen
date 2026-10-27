/**
 * Axios 请求封装单元测试
 * @description 覆盖 JWT 注入、统一业务错误提示、401 并发刷新队列、刷新失败登出与白名单静默
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const handlers: Record<'request' | 'response' | 'responseError', any> = {}
  const messageError = vi.fn()
  // 使用可调用对象模拟 axios 实例：既支持 service(config)，也支持 service.post()
  const http: any = vi.fn()
  http.post = vi.fn()
  http.interceptors = {
    request: {
      use: (onFulfilled: any) => {
        handlers.request = onFulfilled
      }
    },
    response: {
      use: (onFulfilled: any, onRejected: any) => {
        handlers.response = onFulfilled
        handlers.responseError = onRejected
      }
    }
  }
  return { handlers, messageError, http }
})

vi.mock('axios', () => ({
  default: { create: () => mocks.http }
}))

vi.mock('naive-ui', () => ({
  createDiscreteApi: () => ({ message: { error: mocks.messageError } })
}))

vi.mock('@/store', () => ({
  useUserStore: () => ({ logout: vi.fn(), updateToken: vi.fn() })
}))

// 屏蔽响应拦截器在 DEV 下的日志输出
vi.spyOn(console, 'log').mockImplementation(() => undefined)

let requestModule: typeof import('../request')

/**
 * 构造 401 错误对象
 * @param config - 原始请求配置
 */
function create401(config: Record<string, unknown>): any {
  return { response: { status: 401 }, config }
}

beforeEach(async () => {
  vi.clearAllMocks()
  mocks.http.mockReset()
  mocks.http.post.mockReset()
  localStorage.clear()
  window.history.replaceState({}, '', '/')
  vi.resetModules()
  requestModule = await import('../request')
})

describe('请求拦截器', () => {
  it('存在 token 时注入 Bearer 认证头', () => {
    localStorage.setItem('token', 'token-abc')
    const config: any = { headers: {} }

    mocks.handlers.request(config)

    expect(config.headers.Authorization).toBe('Bearer token-abc')
  })

  it('不存在 token 时不写入认证头', () => {
    const config: any = { headers: {} }

    mocks.handlers.request(config)

    expect(config.headers.Authorization).toBeUndefined()
  })
})

describe('响应成功拦截器', () => {
  it('业务成功时原样返回响应', () => {
    const response: any = { data: { status: 200, message: 'ok', data: { id: 1 } }, config: {} }

    expect(mocks.handlers.response(response)).toBe(response)
  })

  it('无 status 字段的响应（如数组）原样返回', () => {
    const response: any = { data: [1, 2, 3], config: {} }

    expect(mocks.handlers.response(response)).toBe(response)
  })

  it('业务失败时提示友好文案并抛出业务错误', async () => {
    const response: any = { data: { status: 404, message: '项目不存在' }, config: {} }

    await expect(mocks.handlers.response(response)).rejects.toThrow('项目不存在')
    expect(mocks.messageError).toHaveBeenCalledWith('资源不存在: 项目不存在')
  })

  it('500 以上业务状态提示服务器错误', async () => {
    const response: any = { data: { status: 500, message: '内部错误' }, config: {} }

    await expect(mocks.handlers.response(response)).rejects.toThrow('内部错误')
    expect(mocks.messageError).toHaveBeenCalledWith('服务器错误: 内部错误')
  })
})

describe('401 自动刷新', () => {
  it('无 refreshToken 时清理登录态并跳转登录页', async () => {
    const push = vi.fn()
    requestModule.setRouter({ currentRoute: { value: { name: 'Home' } }, push } as any)
    localStorage.setItem('token', 'stale-token')

    const error = create401({ headers: {} })
    await expect(mocks.handlers.responseError(error)).rejects.toBe(error)

    expect(localStorage.getItem('token')).toBeNull()
    expect(mocks.messageError).toHaveBeenCalledWith('登录已过期，请重新登录')
    expect(push).toHaveBeenCalledWith('/login')
  })

  it('白名单页面下静默失败，不清登出也不跳转', async () => {
    const push = vi.fn()
    requestModule.setRouter({ currentRoute: { value: { name: 'Market' } }, push } as any)
    localStorage.setItem('token', 'guest-token')
    window.history.replaceState({}, '', '/market')

    const error = create401({ headers: {} })
    await expect(mocks.handlers.responseError(error)).rejects.toBe(error)

    expect(localStorage.getItem('token')).toBe('guest-token')
    expect(push).not.toHaveBeenCalled()
    expect(mocks.messageError).not.toHaveBeenCalled()
  })

  it('并发 401 只触发一次刷新，成功后重放全部挂起请求', async () => {
    localStorage.setItem('refreshToken', 'refresh-1')
    let resolveRefresh: (value: unknown) => void = () => undefined
    mocks.http.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve
      })
    )
    mocks.http.mockResolvedValue({ data: { status: 200 } })

    const reqA: any = { headers: {}, url: '/a' }
    const reqB: any = { headers: {}, url: '/b' }
    const pendingA = mocks.handlers.responseError(create401(reqA))
    const pendingB = mocks.handlers.responseError(create401(reqB))

    expect(mocks.http.post).toHaveBeenCalledTimes(1)

    resolveRefresh({ data: { status: 200, data: { token: 'new-token', refreshToken: 'refresh-2' } } })
    await Promise.all([pendingA, pendingB])

    expect(localStorage.getItem('token')).toBe('new-token')
    expect(localStorage.getItem('refreshToken')).toBe('refresh-2')
    expect(reqA.headers.Authorization).toBe('Bearer new-token')
    expect(reqB.headers.Authorization).toBe('Bearer new-token')
    expect(mocks.http).toHaveBeenCalledTimes(2)
  })

  it('刷新失败时清理登录态并跳转登录页', async () => {
    const push = vi.fn()
    requestModule.setRouter({ currentRoute: { value: { name: 'Home' } }, push } as any)
    localStorage.setItem('token', 'stale-token')
    localStorage.setItem('refreshToken', 'refresh-1')
    mocks.http.post.mockReturnValue(Promise.reject(new Error('refresh failed')))

    const error = create401({ headers: {} })
    await expect(mocks.handlers.responseError(error)).rejects.toBeTruthy()

    expect(localStorage.getItem('token')).toBeNull()
    expect(push).toHaveBeenCalledWith('/login')
    expect(mocks.messageError).toHaveBeenCalledWith('登录已过期，请重新登录')
  })
})

describe('其他错误处理', () => {
  it('已取消的请求直接透传，不触发刷新', async () => {
    const error: any = { code: 'ERR_CANCELED' }

    await expect(mocks.handlers.responseError(error)).rejects.toBe(error)
    expect(mocks.http.post).not.toHaveBeenCalled()
  })

  it('网络错误提示检查网络设置', async () => {
    const error: any = { message: 'Network Error', config: {} }

    await expect(mocks.handlers.responseError(error)).rejects.toBe(error)
    expect(mocks.messageError).toHaveBeenCalledWith('网络连接失败，请检查网络设置')
  })
})
