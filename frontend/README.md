# IdeaSpark 前端

Vue 3 + TypeScript + Vite 前端应用，面向 AI 驱动的项目孵化平台。

## 技术栈

| 技术 | 用途 |
|------|------|
| **Vue 3** | `<script setup>` SFC 组合式 API |
| **TypeScript** | 全栈类型安全 |
| **Vite 7** | 构建与开发服务器（HMR） |
| **Pinia** | 状态管理 + 持久化 |
| **Vue Router** | 模块化路由（7 个模块） |
| **Naive UI** | UI 组件库（按需引入） |
| **Axios** | HTTP 客户端（JWT + 自动刷新） |
| **ECharts 6** | 数据可视化 |
| **GSAP** | 动画引擎 |
| **SCSS** | CSS 预处理（全局变量 + mixins） |
| **ESLint** + **Prettier** | 代码规范 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发服务器（端口 5173，自动代理 /api → localhost:8081）
npm run dev

# TypeScript 类型检查 + 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── api/              # API 客户端（request.ts 为基类，模块化导出）
├── store/            # Pinia stores（user, chat, aiWorkshop）
├── router/           # 路由（core, user, project, community, ai, workbench, tools）
├── views/            # 页面（ai, community, dashboard, editor, project, tools, user, workbench）
├── components/       # 共享组件（ai/, editor/, home/, markdown/）
├── composables/      # 组合式函数（useDocAi, useExcelAi, useSlideAi, useMdAi 等）
├── constants/        # 常量（aiModules, community, storage, http）
├── styles/           # SCSS（variables, mixins, reset, nexus theme）
└── plugins/          # Vue 插件（lazyload）
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | API 基础地址 | `http://localhost:8081` |

环境配置文件：
- `.env.development` — 开发环境
- `.env.production` — 生产环境

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | TypeScript 检查 + 构建 |
| `npm run lint` | ESLint（零警告） |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run format` | Prettier 格式化 |
| `npm run typecheck` | vue-tsc 类型检查 |
| `npm run test` | Vitest 监视模式 |
| `npm run test:run` | Vitest 单次运行 |
| `npm run test:coverage` | Vitest 覆盖率 |
| `npm run test:e2e` | Playwright E2E |
| `npm run deploy:docker` | Docker 构建部署 |
| `npm run deploy:nginx` | Nginx 部署 |

## API 模式

所有 API 通过 `src/api/` 的模块化函数调用，统一返回 `{ status, message, data }` 格式。

- Axios 实例配置了 JWT token 注入和 401 自动刷新（支持并发请求队列）
- 类型定义集中在 `src/api/types.ts`
- 上传使用独立的 `uploadService` 实例（120s 超时）

## Docker 部署

```bash
npm run build
npm run deploy:docker
# 或
npm run deploy:nginx
```

参考 `deploy/docker-compose.yml` 和 `deploy/Dockerfile`。
