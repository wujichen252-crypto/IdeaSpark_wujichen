# IdeaSpark 长期项目约定

## 架构与分层
- 技术栈：前端 Vue 3 + TS + Vite；后端 Django 4.2 + Django Ninja（**Python**）；MySQL 使用 `managed=False`（Django 不管迁移，表需预先存在）；JWT 双令牌；AI 走 DeepSeek；对象存储阿里云 OSS。
- 前端分层方向：`store`（稳定）← `api` ← `views`（易变）；类型枢纽是 `api/types.ts`。
- 禁止：路由视图静态导入（一律 `() => import()`）；`api` 层静态依赖 `router` / `store`（取鉴权态除外）。
- 嵌入编辑器（白板/导图/流程图）统一走「数据总线」：`GET/PUT /api/projects/{id}/files/{fileId}/content`，信封 `{type, schema_version, payload, base_version/version}`，乐观锁冲突返回 409。

## 前端布局系统（2026-10-14 重构引入）
- **统一布局骨架**：`layouts/` 下 `DefaultLayout`（顶栏+内容，默认）/ `EditorLayout`（全屏无顶栏）/ `AuthLayout`（登录类）/ `BlankLayout`（403/404）。`App.vue` 退化为按 `route.meta.layout` 动态壳组件，删除了原硬编码的 `hiddenRouteNames`/`hiddenPaths`/`shouldPadMain`。
- `route.meta.layout` ∈ `default|editor|auth|blank`（默认 default）；布局映射单一可信源在 `router/index.ts` 的 `LAYOUT_BY_NAME`，新增页面只需在 `meta` 声明，无需改 App.vue。
- `route.meta.headerPad`（默认 true）：仅首页等全幅页设 false（透明导航悬浮 hero 之上，不避让固定顶栏）。
- `RouteMeta` 类型扩展在 `src/router/meta.d.ts`（含 layout/headerPad/requiresAuth/roles/title）。
- 注意：`AppHeader` 是 `position:fixed` 高 56px，默认布局内容区需 `padding-top` 避让（`.app-main--with-header`）。

## 后端硬性坑（踩过，勿再犯）
- **`Model.save(update_fields=[...])` 必须显式包含 `updated_at`**。Django 指定 `update_fields` 时只写列出的字段，`auto_now=True` 不会自动落库，导致更新时间永久停在创建时间；本项目约 20 处局部更新存在此问题（已修 projects/file 相关两处，其余待处理）。
- **`project_files.updated_at` 在 MySQL 是 `timestamp(0)`，无小数秒**。任何基于纯 `updated_at` 的版本令牌都无法区分同一秒内的并发写入；做乐观锁必须再拼内容指纹（现状：`updated_at + sha256(content)[:12]`）。
- 跨 app 导入优先用**函数内延迟导入**，以规避 Django app 加载环（现有 `accounts` / `projects` 已这样做的部分是正确的）。

## 校验工具（可随时复跑）
- `.workbuddy/analysis/coupling.py` — 依赖图 / 循环依赖 / 分层违规 / 不稳定度。注意 Windows 下 `@/` 别名路径必须 `normpath`，否则混合斜杠会让依赖边被静默丢弃、循环漏检。
- `.workbuddy/analysis/contract_check.py` — 前后端接口契约一致性（静态比对）。
- `.workbuddy/analysis/api_smoke.py` — 后端真实 HTTP 集成冒烟（需服务在跑，默认 8081）。

## CSS 设计令牌（2026-10-14 Phase 2 确立）
- `src/styles/variables.scss`（含 `:root`/`html`/`body`/`::selection` 等**带实际输出的令牌**）**仅**在 `src/main.ts` 全局 `import` 一次。
- `vite.config.ts` 的 `css.preprocessorOptions.scss.additionalData` **只注入 `mixins.scss`**（`@mixin`/`@keyframes` 不产生 CSS 输出，可安全复用）。
- 绝不要把 `variables.scss` 重新加回 `additionalData`——否则 `:root` 令牌会被注入每一个组件 SCSS 入口，在每个 chunk 重复打包。
- 组件样式使用设计令牌：运行时用 `var(--nexus-*)`（已由全局 `:root` 提供）；复用样式用 `@include nexus-*(...)`（由注入的 mixins 提供）。不要在组件里自行定义 `:root` 令牌。

## 环境
- 本地 dev 后端连的是**远端生产 MySQL**，切勿把本地 dev 后端暴露到公网。
- 开发端口：后端 8081、前端 5173（若已占用说明旧实例在跑，勿重复启动）。
- 生产部署目标机 `47.108.232.238`：`.env.production` 指 `:9000`（当前 502，Django 上游未起），静态站点 `:9001`/`:9002`；`nginx.conf` 的 `server_name` 仍是占位符。
- pnpm 安装若遇 `SAFE_DELETE_BULK_CONFIRM_REQUIRED`，设 `CODEBUDDY_SAFE_DELETE_ENABLED=0`；lockfile 损坏时用 `CI=true pnpm install --force`。
