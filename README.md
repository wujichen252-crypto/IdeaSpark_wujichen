

<p align="center">
  <img src="frontend/src/assets/logo.svg" alt="IdeaSpark Logo" width="120" />
</p>

<h1 align="center">IdeaSpark</h1>

<p align="center">
  <strong>从灵感到落地，只需一句话</strong>
</p>

<p align="center">
  AI 驱动的项目孵化平台 — 用户描述一个想法，平台帮助其完整落地。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3-4FC08D?logo=vue.js" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Django-092E20?logo=django" alt="Django 4.2" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?logo=mysql" alt="MySQL" />
  <img src="https://img.shields.io/badge/DeepSeek_AI-4F46E5" alt="DeepSeek AI" />
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker" alt="Docker" />
</p>

---

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| **🤖 AI 项目生成** | 一句话描述想法，AI 自动生成项目计划、技术栈建议、文档 |
| **📝 在线编辑器** | 文档 / 幻灯片 / Excel 在线编辑，AI 辅助写作 |
| **📊 项目管理** | 工作台、看板、文件管理、成员协作 |
| **🌐 社区** | 发布帖子、创建群组、项目评论与点赞 |
| **🧩 插件市场** | 扩展平台功能，自定义工作流 |
| **🔔 消息通知** | 实时通知系统 |

## 🛠️ 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| **Vue 3** + TypeScript | 框架 |
| **Vite 7** | 构建工具 |
| **Pinia** | 状态管理（持久化） |
| **Vue Router** | 路由管理（模块化） |
| **Naive UI** | 组件库 |
| **Axios** | HTTP 请求（JWT 拦截器 + 自动刷新） |
| **ECharts 6** | 数据可视化 |
| **GSAP** | 动画引擎 |
| **SCSS** | 样式预处理 |

### 后端

| 技术 | 用途 |
|------|------|
| **Django 4.2** + Django Ninja | REST API 框架 |
| **MySQL** | 数据库（pre-existing tables） |
| **JWT** | 双 Token 认证（Access + Refresh） |
| **DeepSeek AI** | OpenAI 兼容 SDK 接入 |
| **Aliyun OSS** | 文件存储 |
| **Gunicorn** | 生产部署 |

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18（推荐 20+）
- **Python** >= 3.11
- **pnpm**（前端包管理）
- **uv**（后端包管理）

### 一键启动

```bash
# 项目根目录执行
powershell -File dev.ps1
```

这会同时启动：
- 前端开发服务器 → **http://localhost:5173**
- 后端 API 服务器 → **http://localhost:8081**
- API 文档 → **http://localhost:8081/docs/**

### 分步启动

#### 前端

```bash
cd frontend
npm install    # 或 pnpm install
npm run dev    # 启动 Vite 开发服务器
```

#### 后端

```bash
cd backend
uv sync                   # 安装依赖

# 配置环境变量（复制并编辑）
cp .env.example .env
# 编辑 .env 填入数据库连接等配置

uv run python manage.py runserver 8081
```

## 📁 项目结构

```
IdeaSpark/
├── frontend/                    # Vue 3 + Vite 前端
│   └── src/
│       ├── api/                 # Axios API 客户端（模块化）
│       ├── store/               # Pinia 状态管理
│       ├── router/              # Vue Router（7 个模块）
│       ├── views/               # 页面组件（8 个模块）
│       ├── components/          # 共享组件
│       ├── composables/         # 组合式函数
│       ├── constants/           # 常量定义
│       ├── styles/              # SCSS 样式
│       └── plugins/             # Vue 插件
├── backend/                     # Django 后端
│   ├── config/                  # Django 配置
│   ├── common/                  # 公共模块（auth, exceptions, response）
│   └── apps/
│       ├── accounts/            # 用户管理
│       ├── projects/            # 项目管理
│       ├── teams/               # 团队管理
│       ├── community/           # 社区
│       ├── ai/                  # AI 功能
│       ├── notifications/       # 消息通知
│       ├── files/               # 文件管理
│       └── security_logs/       # 安全日志
├── dev.ps1                      # 一键开发启动脚本
├── CLAUDE.md                    # Claude Code 项目指南
└── CLAUDE-*.md                  # Memory Bank 文件
```

## 📋 可用脚本

### 前端

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | TypeScript 类型检查 + 构建 |
| `npm run lint` | ESLint 检查（零警告） |
| `npm run format` | Prettier 格式化 |
| `npm run typecheck` | vue-tsc 类型检查 |
| `npm run test:run` | Vitest 单次运行 |
| `npm run test:e2e` | Playwright E2E 测试 |

### 后端

| 命令 | 说明 |
|------|------|
| `uv run python manage.py runserver 8081` | 开发服务器 |
| `uv run python manage.py test` | 运行测试 |
| `uv run gunicorn config.wsgi:application` | 生产部署 |
| `uv sync` | 安装依赖 |
| `uv run ruff check .` | 代码检查 |

## 🐳 Docker 部署

```bash
cd frontend
npm run build
npm run deploy:docker    # 构建 Docker 镜像并启动
npm run deploy:nginx     # 部署到 nginx
```

## 🗺️ 路由模块

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| core | `/` | 首页、市场 |
| user | `/login` | 登录注册 |
| project | `/project/` | 项目管理、文档、工作区 |
| community | `/community/` | 社区帖子、群组 |
| ai | `/ai/` | AI 聊天、项目生成、工作台 |
| workbench | `/workbench/` | 用户工作台、设置、管理 |
| tools | `/tools/` | 工具集 |

## 🔐 认证流程

1. JWT Access Token（7天） + Refresh Token（30天）
2. 前端 Axios 拦截器自动注入 `Bearer` header
3. 401 响应自动触发 token 刷新（请求队列防并发）
4. Pinia user store 持久化到 localStorage

## 📄 许可证

MIT
