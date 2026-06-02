/**
 * 默认头像工具函数
 * @description 提供统一的默认头像生成逻辑，基于用户 ID 或用户名生成一致的头像
 * 支持本地 SVG 生成和外部服务降级处理
 */

/**
 * 基础默认头像 URL（当没有用户信息时使用）
 * 使用本地 SVG 生成作为最终备用方案
 */
export const DEFAULT_AVATAR_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNiNmUzZjQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjZmZmIj5VPC90ZXh0Pjwvc3ZnPg=='

/**
 * 头像服务配置
 */
const AVATAR_SERVICES = {
  primary: 'dicebear',
  fallback: 'uiAvatars',
  final: 'localSvg'
} as const

/**
 * 生成 UI Avatars URL（第一级备用方案）
 * @param name - 显示的名称
 * @param background - 背景色
 * @returns UI Avatars URL
 */
function getUiAvatarUrl(name: string, background: string = 'b6e3f4'): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=fff&size=128`
}

/**
 * 生成本地 SVG 头像（最终备用方案）
 * @param name - 显示的名称
 * @param background - 背景色
 * @returns Base64 编码的 SVG 数据 URL
 */
function generateLocalSvgAvatar(name: string, background: string = 'b6e3f4'): string {
  const initial = name.charAt(0).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" fill="#${background}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40" font-family="Arial, sans-serif" fill="#fff">${initial}</text>
  </svg>`
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

/**
 * 获取用户默认头像
 * @param userId - 用户 ID（数字或字符串）
 * @param username - 用户名（可选，作为备选种子）
 * @param useFallback - 是否使用备用服务（当 DiceBear 加载失败时）
 * @param fallbackLevel - 备用级别：0=仅 DiceBear, 1=UI Avatars, 2=本地 SVG
 * @returns 头像 URL
 * @example
 * getUserAvatar(123) // 返回基于 ID 的头像
 * getUserAvatar(null, '张三') // 返回基于用户名的头像
 * getUserAvatar() // 返回默认头像
 */
export function getUserAvatar(
  userId?: number | string | null, 
  username?: string, 
  useFallback: boolean = false,
  fallbackLevel: number = 1
): string {
  const displayName = username || (userId ? `User${userId}` : 'User')
  
  // 如果使用备用服务或没有用户信息，根据级别选择备用方案
  if (useFallback || (!userId && !username)) {
    if (fallbackLevel >= 2) {
      return generateLocalSvgAvatar(displayName, 'b6e3f4')
    }
    if (fallbackLevel >= 1) {
      return getUiAvatarUrl(displayName, 'b6e3f4')
    }
  }
  
  // 优先使用用户 ID 作为种子
  if (userId) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=b6e3f4`
  }
  
  // 其次使用用户名作为种子
  if (username) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4`
  }
  
  // 返回默认头像（本地 SVG）
  return DEFAULT_AVATAR_URL
}

/**
 * 获取当前登录用户的头像
 * @param avatar - 用户已设置的头像URL（可能为空）
 * @param userId - 用户ID
 * @param username - 用户名
 * @returns 头像URL（优先使用用户设置的头像，否则生成默认头像）
 * @example
 * getCurrentUserAvatar(user.avatar, user.id, user.username)
 */
export function getCurrentUserAvatar(
  avatar: string | null | undefined,
  userId?: number | string,
  username?: string
): string {
  // 如果用户已设置头像，直接使用
  if (avatar && avatar.trim()) {
    return avatar
  }
  
  // 否则生成默认头像
  return getUserAvatar(userId, username)
}

/**
 * 获取其他用户的头像（用于显示他人头像）
 * @param avatar - 用户已设置的头像URL
 * @param userId - 用户ID
 * @param username - 用户名
 * @returns 头像URL
 */
export function getOtherUserAvatar(
  avatar: string | null | undefined,
  userId?: number | string,
  username?: string
): string {
  return getCurrentUserAvatar(avatar, userId, username)
}

/**
 * 获取团队/群组默认头像
 * @param teamId - 团队 ID
 * @param teamName - 团队名称
 * @param useFallback - 是否使用备用服务（当 DiceBear 加载失败时）
 * @param fallbackLevel - 备用级别：0=仅 DiceBear, 1=UI Avatars, 2=本地 SVG
 * @returns 头像 URL
 */
export function getTeamAvatar(
  teamId?: number | string, 
  teamName?: string, 
  useFallback: boolean = false,
  fallbackLevel: number = 1
): string {
  const displayName = teamName || (teamId ? `Team${teamId}` : 'Team')
  
  // 如果使用备用服务，根据级别选择备用方案
  if (useFallback) {
    if (fallbackLevel >= 2) {
      return generateLocalSvgAvatar(displayName, 'ffdfbf')
    }
    if (fallbackLevel >= 1) {
      return getUiAvatarUrl(displayName, 'ffdfbf')
    }
  }
  
  if (teamId) {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=team_${teamId}&backgroundColor=ffdfbf`
  }
  
  if (teamName) {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=ffdfbf`
  }
  
  // 返回本地 SVG 作为最终备用
  return generateLocalSvgAvatar('Team', 'ffdfbf')
}

/**
 * 获取 AI 助手头像
 * @param useFallback - 是否使用备用服务
 * @returns AI 助手头像 URL
 */
export function getAIAvatar(useFallback: boolean = false): string {
  if (useFallback) {
    return generateLocalSvgAvatar('AI', 'c0aede')
  }
  return 'https://api.dicebear.com/7.x/bottts/svg?seed=ai_assistant&backgroundColor=c0aede'
}

/**
 * 处理图片加载错误，返回备用头像
 * @param fallbackLevel - 备用级别：0=仅 DiceBear, 1=UI Avatars, 2=本地 SVG
 * @param userId - 用户 ID
 * @param username - 用户名
 * @returns 备用头像 URL
 */
export function handleAvatarError(
  fallbackLevel: number = 2,
  userId?: number | string,
  username?: string
): string {
  if (userId || username) {
    return getUserAvatar(userId, username, true, fallbackLevel)
  }
  return DEFAULT_AVATAR_URL
}
