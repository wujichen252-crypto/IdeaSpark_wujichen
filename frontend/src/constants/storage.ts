export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'ideaspark-user',
  CHAT: 'chat-store',
  PROJECTS: 'ideaspark_projects',
  LANGUAGE: 'ideaspark-language',
  THEME: 'ideaspark-theme'
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
