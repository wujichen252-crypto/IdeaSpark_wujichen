import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

/**
 * 创建 Pinia 实例
 * @description 配置 Pinia 状态管理，集成持久化插件
 */
const store = createPinia()

// 注册持久化插件
store.use(piniaPluginPersistedstate)

export default store
export * from './user'
export * from './modules/aiWorkshop'
export * from './chat'
