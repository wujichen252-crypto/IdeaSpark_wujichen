import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: string
  username: string
  email: string
  avatar: string
  cover?: string
  role: string
  bio?: string
  position?: string
  address?: string
  perWebsite?: string
  phone?: string
  createdAt?: string
  stats: {
    likes: number
    followers: number
    following: number
  }
}

export const useUserStore = defineStore(
  'user',
  () => {
    const user = ref<UserInfo | null>(null)
    const token = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)

    const isLoggedIn = computed<boolean>(() => !!token.value)
    const userInfo = computed<UserInfo | null>(() => user.value)

    function login(userData: UserInfo, authToken: string, refreshTokenValue: string): void {
      user.value = userData
      token.value = authToken
      refreshToken.value = refreshTokenValue
      localStorage.setItem('token', authToken)
      localStorage.setItem('refreshToken', refreshTokenValue)
    }

    function updateToken(authToken: string, refreshTokenValue: string): void {
      token.value = authToken
      refreshToken.value = refreshTokenValue
      localStorage.setItem('token', authToken)
      localStorage.setItem('refreshToken', refreshTokenValue)
    }

    function logout(): void {
      user.value = null
      token.value = null
      refreshToken.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }

    function updateProfile(data: Partial<UserInfo>): void {
      if (user.value) {
        user.value = { ...user.value, ...data }
      }
    }

    function init(): void {
      if (token.value) {
        localStorage.setItem('token', token.value)
      }
      if (refreshToken.value) {
        localStorage.setItem('refreshToken', refreshToken.value)
      }
      if (token.value && !user.value) {
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
    persist: {
      key: 'ideaspark-user',
      storage: localStorage
    }
  }
)
