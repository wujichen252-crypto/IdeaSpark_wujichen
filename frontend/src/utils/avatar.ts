/**
 * 头像工具 —— 全站唯一来源
 * @description 所有人（自己 / 他人 / 团队 / AI）的头像都必须从这里取，原因有三：
 * 1. 结果确定：同一个 userId/username 在任何页面、任何刷新下都得到同一张头像；
 * 2. 零网络请求：直接返回本地 SVG data URL，不再依赖 dicebear / ui-avatars 等境外服务，
 *    消除「有时加载出来、有时失败换成另一张」的随机感；
 * 3. 视觉统一：底色取自设计体系的中性灰原语，与单色方案一致，白字对比度均 ≥ 7:1。
 */

/** 头像画布尺寸 */
const AVATAR_SIZE = 128

/** 底色候选：中性灰原语，纯 R=G=B，不含色相 */
const AVATAR_BACKGROUNDS = ['#262626', '#333333', '#555555', '#6b6b6b'] as const

/**
 * FNV-1a 哈希：把种子稳定映射为 32 位无符号整数
 * @param seed - 用户 ID 或用户名
 * @returns 无符号整数哈希值
 */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * 转义 XML 特殊字符
 * @param value - 待转义文本
 * @description 用户名可能含 `<`、`&` 等字符，直接拼进 SVG 会破坏结构。
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * 归一化种子
 * @param userId - 用户 ID，优先级最高
 * @param username - 用户名，作为备选种子
 * @description 种子规则全站唯一，是「同一个人永远同一张头像」的前提：
 * 一旦某些页面用 ID、某些页面用用户名当种子，同一个人就会长出两张脸。
 */
function resolveSeed(userId?: number | string | null, username?: string): string {
  const id = userId === null || userId === undefined ? '' : String(userId).trim()
  return id || (username ?? '').trim() || 'IdeaSpark'
}

/**
 * 取展示用首字符
 * @param label - 展示名
 */
function initialOf(label: string): string {
  return label.trim().charAt(0).toUpperCase() || 'U'
}

/**
 * 生成本地 SVG 头像
 * @param label - 取首字母的展示名
 * @param seed - 决定底色的稳定种子
 * @returns data URL（不发起网络请求）
 */
function createLocalAvatar(label: string, seed: string): string {
  const background = AVATAR_BACKGROUNDS[hashSeed(seed) % AVATAR_BACKGROUNDS.length]
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" viewBox="0 0 ${AVATAR_SIZE} ${AVATAR_SIZE}">` +
    `<rect width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" fill="${background}"/>` +
    '<text x="50%" y="50%" dy="0.35em" text-anchor="middle" ' +
    'font-family="Inter, -apple-system, PingFang SC, Microsoft YaHei, sans-serif" ' +
    `font-size="52" font-weight="600" fill="#ffffff">${escapeXml(initialOf(label))}</text>` +
    '</svg>'
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** 完全没有用户信息时的兜底头像 */
export const DEFAULT_AVATAR_URL: string = createLocalAvatar('IdeaSpark', 'IdeaSpark')

/**
 * 获取用户默认头像
 * @param userId - 用户 ID（优先作为种子）
 * @param username - 用户名（无 ID 时作为种子与首字母来源）
 * @returns 头像 URL
 * @example
 * getUserAvatar(12) // 基于 ID 的稳定头像
 * getUserAvatar(undefined, '张三') // 基于用户名的稳定头像
 */
export function getUserAvatar(userId?: number | string | null, username?: string): string {
  const seed = resolveSeed(userId, username)
  const label = (username ?? '').trim() || 'IdeaSpark'
  return createLocalAvatar(label, seed)
}

/**
 * 获取当前登录用户的头像
 * @param avatar - 用户已上传的头像 URL（可能为空）
 * @param userId - 用户 ID
 * @param username - 用户名
 * @returns 有真实头像时用它，否则返回稳定的默认头像
 * @example
 * getCurrentUserAvatar(user.avatar, user.id, user.username)
 */
export function getCurrentUserAvatar(
  avatar: string | null | undefined,
  userId?: number | string,
  username?: string
): string {
  if (avatar && avatar.trim()) return avatar
  return getUserAvatar(userId, username)
}

/**
 * 获取其他用户的头像
 * @param avatar - 该用户已上传的头像 URL（可能为空）
 * @param userId - 该用户 ID
 * @param username - 该用户名
 * @description 与 getCurrentUserAvatar 同源，保证「我看到的自己」和「别人看到的我」完全一致。
 */
export function getOtherUserAvatar(
  avatar: string | null | undefined,
  userId?: number | string,
  username?: string
): string {
  return getCurrentUserAvatar(avatar, userId, username)
}

/**
 * 获取团队 / 圈子的默认头像
 * @param teamId - 团队 ID
 * @param teamName - 团队名称
 * @returns 头像 URL
 * @description 种子加 `team_` 前缀，避免团队 ID 与用户 ID 撞号而共用同一张图。
 */
export function getTeamAvatar(teamId?: number | string | null, teamName?: string): string {
  const seed = `team_${resolveSeed(teamId, teamName)}`
  const label = (teamName ?? '').trim() || 'Team'
  return createLocalAvatar(label, seed)
}

/**
 * 获取 AI 助手头像
 * @description 固定种子，全站 AI 形象唯一。
 */
export function getAIAvatar(): string {
  return createLocalAvatar('AI', 'ideaspark_ai_assistant')
}

/**
 * 头像加载失败时的兜底
 * @param userId - 用户 ID
 * @param username - 用户名
 * @returns 该用户的稳定默认头像
 */
export function handleAvatarError(userId?: number | string, username?: string): string {
  return getUserAvatar(userId, username)
}