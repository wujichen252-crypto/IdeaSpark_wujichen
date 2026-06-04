export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
} as const

export const DEFAULT_ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  UNAUTHORIZED: '登录已过期，请重新登录',
  FORBIDDEN: '没有权限执行此操作',
  NOT_FOUND: '请求的资源不存在',
  SERVER_ERROR: '服务器繁忙，请稍后再试',
  UNKNOWN_ERROR: '发生未知错误'
} as const
