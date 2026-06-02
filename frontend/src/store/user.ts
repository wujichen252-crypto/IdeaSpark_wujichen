import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 用户信息接口
 * @description 定义用户数据的类型结构
 */
export interface UserInfo {
  /** 用户 ID */
  id: string
  /** 用户名 */
  username: string
  /** 邮箱 */
  email: string
  /** 头像 URL */
  avatar: string
  /** 背景图 URL */
  cover?: string
  /** 用户角色 */
  role: string
  /** 个人简介 */
  bio?: string
  /** 职位 */
  position?: string
  /** 地址 */
  address?: string
  /** 个人网站 */
  perWebsite?: string
  /** 手机号 */
  phone?: string
  /** 创建时间 */
  createdAt?: string
  /** 用户统计数据 */
  stats: {
    /** 获赞数 */
    likes: number
    /** 粉丝数 */
    followers: number
    /** 关注数 */
    following: number
  }
}

/**
 * 用户状态管理 Store
 * @description 管理用户登录状态、用户信息，支持持久化
 */
export const useUserStore = defineStore(
  'user',
  () => {
    // State
    /** 用户信息 */
    const user = ref<UserInfo | null>(null)
    /** 认证 Token */
    const token = ref<string | null>(null)
    /** 刷新 Token */
    const refreshToken = ref<string | null>(null)

    // Getters
    /** 是否已登录 */
    const isLoggedIn = computed<boolean>(() => !!token.value)
    /** 用户信息（只读） */
    const userInfo = computed<UserInfo | null>(() => user.value)

    // Actions
    /**
     * 用户登录
     * @param userData - 用户数据
     * @param authToken - 认证 Token
     * @param refreshTokenValue - 刷新 Token
     */
    function login(userData: UserInfo, authToken: string, refreshTokenValue: string): void {
      user.value = userData
      token.value = authToken
      refreshToken.value = refreshTokenValue
      // 同时存储到 localStorage 供请求拦截器使用
      localStorage.setItem('token', authToken)
      localStorage.setItem('refreshToken', refreshTokenValue)
    }

    /**
     * 更新 Token（刷新后使用）
     * @param authToken - 新的认证 Token
     * @param refreshTokenValue - 新的刷新 Token
     */
    function updateToken(authToken: string, refreshTokenValue: string): void {
      token.value = authToken
      refreshToken.value = refreshTokenValue
      localStorage.setItem('token', authToken)
      localStorage.setItem('refreshToken', refreshTokenValue)
    }

    /**
     * 用户登出
     * @description 清除用户状态和本地存储
     */
    function logout(): void {
      user.value = null
      token.value = null
      refreshToken.value = null
      // 清除 localStorage 中的 token
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }

    /**
     * 更新用户信息
     * @param data - 部分用户数据
     */
    function updateProfile(data: Partial<UserInfo>): void {
      if (user.value) {
        user.value = { ...user.value, ...data }
      }
    }

    /**
     * 初始化用户状态
     * @description 从持久化存储中恢复用户状态，并同步 token 到 localStorage
     */
    function init(): void {
      // 由于使用了 pinia-plugin-persistedstate，状态会自动恢复
      // 同步 token 到 localStorage 供请求拦截器使用
      if (token.value) {
        localStorage.setItem('token', token.value)
      }
      if (refreshToken.value) {
        localStorage.setItem('refreshToken', refreshToken.value)
      }
      if (token.value && !user.value) {
        // Token 存在但用户信息不存在，可能需要重新获取用户信息
        console.warn('Token exists but user info is missing')
      }
    }

    return {
      user,
      token,
      refreshToken,
      isLoggedIn,
      userInfo,
      login,
      updateToken,
      logout,
      updateProfile,
      init
    }
  },
  {
    /**
     * 持久化配置
     * @description 将用户状态持久化到 localStorage
     */
    persist: {
      key: 'ideaspark-user',
      storage: localStorage
    }
  }
)
