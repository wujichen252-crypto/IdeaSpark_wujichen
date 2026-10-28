/**
 * 剪贴板工具
 * @description 统一封装复制/读取能力。优先使用异步 Clipboard API；
 *              当处于非安全上下文（http 内网部署、非授权 iframe）时
 *              `navigator.clipboard` 为 undefined，此时回退到
 *              hidden textarea + execCommand，避免复制按钮静默失效或抛 TypeError。
 */

/**
 * 复制文本到剪贴板
 * @param text - 待复制的文本
 * @returns 是否复制成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 权限被拒绝或非安全上下文，继续尝试降级方案
    }
  }
  return legacyCopy(text)
}

/**
 * 降级复制：隐藏 textarea + document.execCommand('copy')
 * @param text - 待复制的文本
 * @returns 是否复制成功
 */
function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined' || !document.body) return false

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.opacity = '0'

  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  let success = false
  try {
    success = document.execCommand('copy')
  } catch {
    success = false
  } finally {
    document.body.removeChild(textarea)
  }

  return success
}

/**
 * 读取剪贴板文本
 * @description 仅安全上下文支持读取；不可用时返回空字符串，由调用方提示用户手动粘贴
 * @returns 剪贴板中的文本
 */
export async function readClipboard(): Promise<string> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
    try {
      return await navigator.clipboard.readText()
    } catch {
      return ''
    }
  }
  return ''
}
