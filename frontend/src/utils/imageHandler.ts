/**
 * 图片加载错误处理工具
 * @description 提供统一的图片加载错误处理和备用方案
 */

/**
 * 图片加载错误事件处理器
 * @param e - 错误事件
 * @param fallbackSrc - 备用图片 URL
 */
export function handleImageError(e: Event, fallbackSrc?: string): void {
  const target = e.target as HTMLImageElement
  if (!target.dataset.errorHandled && fallbackSrc) {
    target.dataset.errorHandled = 'true'
    target.src = fallbackSrc
  }
}

/**
 * 生成灰色占位图片（SVG）
 * @param width - 宽度
 * @param height - 高度
 * @param text - 显示文本
 * @returns Base64 编码的 SVG 数据 URL
 */
export function generatePlaceholderImage(
  width: number = 400,
  height: number = 300,
  text: string = 'Image'
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#f3f4f6"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="${Math.min(width, height) / 8}" font-family="Arial, sans-serif" fill="#9ba3ad">${text}</text>
  </svg>`
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

/**
 * 生成默认封面图片
 * @returns Base64 编码的 SVG 数据 URL
 */
export function getDefaultCover(): string {
  return generatePlaceholderImage(1200, 400, 'Cover')
}

/**
 * 生成默认项目封面
 * @returns Base64 编码的 SVG 数据 URL
 */
export function getDefaultProjectCover(): string {
  return generatePlaceholderImage(400, 300, 'Project')
}

/**
 * 生成默认头像
 * @param name - 显示名称
 * @param color - 背景颜色
 * @returns Base64 编码的 SVG 数据 URL
 */
export function getDefaultAvatar(name: string = 'User', color: string = 'b6e3f4'): string {
  const initial = name.charAt(0).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" fill="#${color}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40" font-family="Arial, sans-serif" fill="#fff">${initial}</text>
  </svg>`
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

/**
 * 图片预加载
 * @param src - 图片 URL
 * @returns Promise<boolean> 加载是否成功
 */
export function preloadImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

/**
 * 带超时的图片加载
 * @param src - 图片 URL
 * @param timeout - 超时时间（毫秒）
 * @param fallbackSrc - 备用图片 URL
 * @returns Promise<string> 加载成功的图片 URL
 */
export async function loadImageWithTimeout(
  src: string,
  timeout: number = 5000,
  fallbackSrc?: string
): Promise<string> {
  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => reject(new Error('Loading timeout')), timeout)
  })
  
  const loadPromise = new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(src)
    img.onerror = () => reject(new Error('Loading failed'))
    img.src = src
  })
  
  try {
    return await Promise.race([loadPromise, timeoutPromise])
  } catch (error) {
    if (fallbackSrc) {
      return fallbackSrc
    }
    throw error
  }
}
