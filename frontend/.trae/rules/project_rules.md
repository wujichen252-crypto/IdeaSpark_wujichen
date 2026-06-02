# # 一、项目基础规范

## ## 1. 技术栈选型

- **框架**：Vue 3（Composition API）
- **构建工具**：Vite
- **语言**：TypeScript（推荐）
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **UI 框架**：Element Plus / Naive UI / Ant Design Vue（三选一）
- **HTTP**：Axios（封装二次请求）
- **样式工具**：SCSS / TailwindCSS
- **图表**：ECharts
- **表格**：vxe-table（如有复杂表格）

## ## 2. 项目运行环境

- Node.js ≥ 18
- pnpm（推荐）或 npm、yarn
- VSCode + Volar + ESLint 插件

---

# # 二、目录结构规范

以下为推荐目录结构，保持清晰、内聚、易扩展：

```
src/
├── api/                # 接口封装
├── assets/             # 静态资源
├── components/         # 通用组件
├── composables/        # 可复用逻辑（useXxx）
├── directives/         # 自定义指令
├── enums/              # 枚举、常量
├── hooks/              # 公共逻辑 hooks（可与 composables 合并）
├── layouts/            # 布局
├── router/             # 路由模块化配置
├── store/              # Pinia 状态管理
├── styles/             # 全局样式
├── utils/              # 工具库
├── views/              # 页面
└── App.vue
```

📌 **原则：高内聚，低耦合，业务逻辑不写在组件内。**

---

# # 三、代码规范

## ## 1. 语言规范（TypeScript）

- 所有接口、状态、组件 props 必须定义类型
- 不允许使用 `any`（特殊情况需注释说明）
- 枚举使用 `enum` 或 `as const`

## ## 2. 命名规范

| 名称   | 规则        | 示例            |
| ------ | ----------- | --------------- |
| 组件名 | PascalCase  | `UserCard.vue`  |
| 变量名 | camelCase   | `userList`      |
| 函数名 | 动词+业务   | `getUserList()` |
| 枚举   | PascalCase  | `UserRole`      |
| 常量   | SNAKE_UPPER | `API_BASE_URL`  |
| 文件夹 | 小写-中划线 | `user-center`   |

## ## 3. 注释规范

### 顶部模块注释

```
/**
 * 用户管理接口
 * @description 封装用户模块的所有 HTTP 请求方法
 */
```

### 函数注释

```
/**
 * 获取用户列表
 * @param params - 查询参数
 */
```

---

# # 四、组件规范

## ## 1. 组件设计原则

- 单一职责（一个组件只做一件事）
- 小型化、可拆分
- UI 与业务逻辑分离
- 可配置性、可复用性强

## ## 2. Props 规范

- 必须声明类型
- 必须有默认值（非必传）
- 避免使用复杂对象作为 props

示例：

```
const props = defineProps<{
  size?: 'small' | 'medium' | 'large'
  modelValue: string
}>()
```

## ## 3. Emits 规范

```
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
}>()
```

## ## 4. 文件命名规范

- `.vue` 组件采用大驼峰：`UserFormModal.vue`
- 组件内顺序：

```
<script setup>
↓
<template>
↓
<style scoped lang="scss">
```

---

# # 五、Composables（Hooks）规范

## ## 1. 命名方式

必须以 `useXxx` 开头，例如：

- `useUser()`
- `usePagination()`
- `useForm()`

## ## 2. 存放位置

```
src/composables/
```

## ## 3. 内容规范

- 只能写业务逻辑，不写 UI
- 必须返回一个对象

示例：

```
export function useCounter() {
  const count = ref(0)
  const inc = () => count.value++

  return { count, inc }
}
```

---

# # 六、状态管理规范（Pinia）

## ## 1. Store 命名规范

- `useXxxStore`
- 使用箭头函数创建 store

示例：

```
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const setUser = (u: any) => (user.value = u)

  return { user, setUser }
})
```

## ## 2. 全局状态原则

- 只存放**跨页面共享数据**
- 页面私有数据放在组件或 composable 中

---

# # 七、路由规范

## ## 1. 路由文件结构

```
src/router/
├── index.ts
├── modules/
│   ├── user.ts
│   ├── dashboard.ts
```

## ## 2. 路由命名规范

```
{
  path: '/user',
  name: 'User',
  component: () => import('@/views/user/index.vue')
}
```

## ## 3. 权限控制

使用路由守卫：

- 登录校验
- 权限校验 (role / permission)

---

# # 八、API 请求规范

## ## 1. 文件结构

```
src/api/
└── user.ts
```

## ## 2. 响应统一格式

```
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

## ## 3. Axios 封装规范

- `request.ts` 封装实例
- 请求拦截器追加 token
- 响应拦截器统一错误处理
- 超时与重试机制

---

# # 九、样式规范

## ## 1. 命名规范

采用 **BEM**

```
.card {}
.card__title {}
.card--active {}
```

## ## 2. 样式结构

- 全局变量：`styles/variables.scss`
- 全局 reset：`styles/reset.scss`
- 全局 mixin：`styles/mixins.scss`

## ## 3. 禁止写法

- 禁止使用深层选择器（>3 层）
- 禁止过度嵌套
- 禁止行内样式（除动态场景）

---

# # 十、版本控制规范（Git）

## ## 1. 分支规范

- `main`：生产稳定分支
- `dev`：开发分支
- `feature/xxx`：功能分支
- `fix/xxx`：bug 修复分支

## ## 2. Commit 规范（Angular）

```
feat: 添加用户搜索功能
fix: 修复用户列表加载错误
refactor: 抽离分页组件
style: 格式化代码
```

---

# # 十一、开发流程规范

## ## 1. 单个功能开发步骤

1. 设计 UI / 确认需求
2. 创建路由
3. 设计接口与数据结构
4. 编写 API
5. 编写 composable
6. 编写组件
7. 集成页面
8. 自测
9. 提交 PR
10. Code Review

---

# # 十二、测试规范

## ## 1. 单元测试

使用 Vitest：

```
src/tests/
```

## ## 2. UI 自动化测试

使用 Playwright。

## ## 3. 手动测试清单

- 是否存在控制台报错
- 是否有边界值处理
- 加载状态、错误状态是否完善
- 表单校验是否严格

---

# # 十三、部署规范

## ## 1. 构建

```
pnpm build
```

## ## 2. Nginx 配置（示例）

```
location / {
  try_files $uri $uri/ /index.html;
}
```

## ## 3. CI/CD

- GitHub Actions 自动构建
- 自动部署至服务器

---

# # 十四、长期维护与团队合作规范

- 每周 code review
- 每两周进行小范围重构
- 所有组件必须有说明文档
- 复杂业务写设计文档
- 新成员必须阅读本规范

---

# # 十五、IdeaSpark 前端风格基因（项目级 UI 风格前提）

## ## 1. 风格总定义（最高优先级）

- 轻奢极简 · 创作者工具型 SaaS 风格
- 目标：长期专业用户使用的创作工具平台（非展示页、非炫技页）

## ## 2. 四个不可破坏的核心气质

- 极简主义
- 强留白
- 低色彩密度
- 结构 > 装饰

## ## 3. 视觉基调与用色

- 黑 / 白 / 灰为主，冷色少量点缀
- 冷静科技感：避免赛博、霓虹、高饱和大面积铺色
- 优先通过字号层级、间距、对齐、分组建立信息结构

## ## 4. 交互与动效原则

- 以效率与可理解性为第一原则，动效只用于状态表达与反馈
- 默认克制：短、轻、可预期，避免大幅位移、长时间动画、强闪烁效果
- 所有交互都需要清晰的状态：默认 / 悬停 / 激活 / 禁用 / 加载 / 错误

## ## 5. 页面层次策略

- 首页：情绪 / 愿景 / 高度（更强调品牌层次感）
- 内页：效率 / 功能 / 稳定（更强调信息结构与操作路径）
