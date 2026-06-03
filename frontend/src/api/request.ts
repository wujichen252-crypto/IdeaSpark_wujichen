import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { createDiscreteApi } from 'naive-ui'
import router from '@/router'
import { useUserStore } from '@/store'
import { refreshToken as refreshTokenApi } from './user'

// Define response structure (matches backend: { status, message, data })
export interface Result<T = unknown> {
  status: number
  message: string
  data: T
}

const { message } = createDiscreteApi(['message'])

/**
 * 获取当前可用的鉴权 Token
 * @description 直接从 localStorage 读取，避免频繁的 Pinia 操作
 */
function getAuthToken(): string | null {
  return localStorage.getItem('token')
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken')
}

/**
 * 清理本地登录状态
 * @description 优先调用 UserStore.logout；不可用时仅移除 localStorage token
 */
function clearAuthState(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  try {
    const userStore = useUserStore()
    userStore.logout()
  } catch {
    // 忽略错误
  }
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 60000,
})

// Request interceptor
function requestInterceptor(config: InternalAxiosRequestConfig) {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}

function requestErrorInterceptor(error: unknown) {
  return Promise.reject(error)
}

service.interceptors.request.use(requestInterceptor, requestErrorInterceptor)

// Response interceptor
let refreshPromise: Promise<string> | null = null
let refreshSubscribers: Array<(token: string) => void> = []

function onTokenRefreshed(newToken: string) {
    refreshSubscribers.forEach(callback => {
        try {
            callback(newToken)
        } catch {
        }
    })
    refreshSubscribers = []
}

function addRefreshSubscriber(callback: (token: string) => void) {
    refreshSubscribers.push(callback)
}

function responseSuccessInterceptor(response: AxiosResponse) {
  const res = response.data as Result<unknown>

  // 开发环境日志记录
  if (import.meta.env.DEV) {
    console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: res,
      config: {
        params: response.config.params,
        data: response.config.data
      }
    })
  }

  // 如果响应是数组或直接数据（没有 status 字段），直接返回
  if (Array.isArray(res) || (typeof res === 'object' && res !== null && !('status' in res))) {
    return response
  }

  // Backend returns status=200 for success, other values indicate errors
  if (res.status !== 200 && res.status !== 201) {
    const msg = res.message || '请求失败'

    // 根据状态码提供更友好的错误提示
    let userMessage = msg
    if (res.status === 400) {
      userMessage = `请求参数错误: ${msg}`
    } else if (res.status === 403) {
      userMessage = `权限不足: ${msg}`
    } else if (res.status === 404) {
      userMessage = `资源不存在: ${msg}`
    } else if (res.status === 409) {
      userMessage = `数据冲突: ${msg}`
    } else if (res.status >= 500) {
      userMessage = `服务器错误: ${msg}`
    }

    message.error(userMessage)
    return Promise.reject(new Error(msg))
  }

  return response
}

function responseErrorInterceptor(error: any): Promise<AxiosResponse> {
  const axiosError = error as AxiosError
  const status = axiosError.response?.status

  if (axiosError.code === 'ERR_CANCELED') {
    return Promise.reject(error)
  }

  const originalRequest = axiosError.config as InternalAxiosRequestConfig & { _retry?: boolean }

  if (status === 401 && !originalRequest._retry) {
    // 获取当前路由
    const currentPath = window.location.pathname
    const whiteList = ['/community', '/market', '/project']
    const isWhiteList = whiteList.some(path => currentPath.startsWith(path))

    const refreshTokenValue = getRefreshToken()
    if (!refreshTokenValue) {
      if (isWhiteList) {
        return Promise.reject(error)
      }
      message.error('登录已过期，请重新登录')
      clearAuthState()
      const currentName = router.currentRoute.value.name
      if (currentName !== 'Login') {
        router.push('/login')
      }
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (refreshPromise) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        addRefreshSubscriber((newToken: string) => {
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(service(originalRequest))
          } else {
            reject(error)
          }
        })
      })
    }

    refreshPromise = new Promise<string>((resolve, reject) => {
      refreshTokenApi(refreshTokenValue)
        .then((res) => {
          const data = res.data.data
          if (data && data.token && data.refreshToken) {
            localStorage.setItem('token', data.token)
            localStorage.setItem('refreshToken', data.refreshToken)
            try {
              const userStore = useUserStore()
              userStore.updateToken(data.token, data.refreshToken)
            } catch {
            }
            onTokenRefreshed(data.token)
            resolve(data.token)
          } else {
            reject(new Error('刷新响应格式异常'))
          }
        })
        .catch((err) => {
          refreshSubscribers.forEach(callback => {
            try {
              callback('')
            } catch {
            }
          })
          refreshSubscribers = []

          if (!isWhiteList) {
            message.error('登录已过期，请重新登录')
            clearAuthState()
            const currentName = router.currentRoute.value.name
            if (currentName !== 'Login') {
              router.push('/login')
            }
          }
          reject(err)
        })
        .finally(() => {
          refreshPromise = null
        })
    })

    return refreshPromise.then((newToken) => {
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return service(originalRequest)
    })
  }

  // 开发环境错误日志（401 已在上面静默处理）
  if (import.meta.env.DEV) {
    console.error('[API Error]', {
      url: axiosError.config?.url,
      method: axiosError.config?.method,
      status,
      error: axiosError.message,
      response: axiosError.response?.data
    })
  }

  // 根据状态码提供更友好的错误提示
  let userMessage = '网络异常，请稍后重试'
  if (status === 400) {
    userMessage = '请求参数错误，请检查输入'
  } else if (status === 403) {
    userMessage = '权限不足，无法访问此资源'
  } else if (status === 404) {
    userMessage = '请求的资源不存在'
  } else if (status === 409) {
    userMessage = '数据已存在，请更换名称后重试'
  } else if (status === 429) {
    userMessage = '请求过于频繁，请稍后再试'
  } else if (status && status >= 500) {
    userMessage = '服务器内部错误，请稍后再试'
  } else if (axiosError.message.includes('Network Error')) {
    userMessage = '网络连接失败，请检查网络设置'
  } else if (axiosError.message.includes('timeout')) {
    userMessage = '请求超时，请检查网络连接'
  }

  // 安全地处理服务器返回的错误信息，避免暴露内部细节
  const serverMessage =
    (axiosError.response?.data as { message?: string } | undefined)?.message
  if (serverMessage) {
    // 只允许显示业务级错误信息，过滤包含技术细节的内容
    const sensitiveKeywords = ['error', 'exception', 'trace', 'stack', 'sql', 'database']
    const isSensitive = sensitiveKeywords.some(keyword =>
      serverMessage.toLowerCase().includes(keyword)
    )
    if (!isSensitive && serverMessage.length < 100) {
      userMessage = serverMessage
    }
  }

  message.error(userMessage)
  return Promise.reject(error)
}

service.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor)

export const uploadService: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 120000,
})

uploadService.interceptors.request.use(requestInterceptor, requestErrorInterceptor)
uploadService.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor)

export default service
