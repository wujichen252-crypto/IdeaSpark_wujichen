## 目标
- 创建“顶部固定导航栏 + 全屏英雄区”的首页结构，风格现代、极简、科技感。
- 基于现有技术栈（Vue3 + Vite + TypeScript + Pinia + Vue Router + Naive UI）。

## 依赖与现状核对
- 已安装并接入 Naive UI（`n-config-provider` 等 Provider 已在 `src/App.vue` 中使用）。
- 路由入口为 `/` 指向 `@/views/HomeView.vue`，在该页面实现英雄区。
- 当前没有 `src/layouts/` 目录与视频资源；计划新增布局组件与视频文件。

## 文件与目录变更
1. 新增布局组件：`src/layouts/AppHeader.vue`
   - 使用 `n-layout-header` 或自定义 `header`，固定顶部，透明/半透明背景。
   - 内含 `n-space` + `n-menu`，初始仅“首页”导航项，预留扩展。
2. 调整全局入口：`src/App.vue`
   - 在 Provider 容器内引入并渲染 `<AppHeader />`，在其下渲染 `<router-view />`。
3. 首页英雄区：`src/views/HomeView.vue`
   - 建立全屏视频背景（`video`：`autoplay`、`loop`、`muted`、`playsinline`、`object-fit: cover`）。
   - 添加轻度遮罩（`rgba(0,0,0,0.3)`）与居中前景内容（标题/副标题/CTA `n-button`）。
4. 资源目录：`src/assets/videos/hero.mp4`
   - 放置科技感视频；可选提供 `hero.webm` 与海报图 `hero.jpg`，提升兼容性与首屏观感。

## 组件实现要点
- `AppHeader.vue`
  - 布局：`position: fixed; top: 0; width: 100%; z-index: 1000;`
  - 背景：透明或半透明（可加轻微模糊/渐变），在视频上方保持科技感。
  - 内容：`n-space` 左中右分布；中间使用 `n-menu` 渲染“首页”，保留添加更多项的插槽/数据结构。
- `HomeView.vue`
  - 容器高度：`height: 100vh`；避免被固定头部遮挡，内容区域按需 `padding-top` 或通过绝对定位居中。
  - 视频：绝对定位覆盖容器，`object-fit: cover` 保持电影级质感与对比度。
  - 遮罩：半透明层提升可读性；支持透明度可配置。
  - 前景：大标题、副标题、CTA 按钮；内容水平/垂直居中（Flex/Grid）。

## 样式与响应式
- 命名：BEM（如 `.hero`, `.hero__media`, `.hero__overlay`, `.hero__content`）。
- 字体与间距：大标题在桌面端更大，移动端缩放；CTA 间距适配多分辨率。
- 兼容性：移动端启用 `playsinline`；必要时为低性能设备提供静态海报图或降级方案。

## 动效与微交互
- 轻量进场动效（标题/按钮淡入），保持克制与性能友好。
- CTA 悬停态与按压态采用 Naive UI 风格（柔和圆角）。

## 可访问性与性能
- 无声自动播放（`muted`）符合浏览器策略；增加 `aria-label` 与合理层级结构。
- 视频体积控制与编码（优先 `webm`，次选 `mp4`）；可选延迟加载与海报占位。

## 测试与验收
- 手动验证：
  - 头部固定、透明叠加无抖动；菜单可点击。
  - 英雄区视频跨分辨率覆盖得当，遮罩与文字对比度良好。
  - 移动端自动播放与内联显示正常；CTA 可点击。
- 预留 Vitest 基础快照测试（组件渲染）与 Playwright 视觉回归（可选）。

## 交付清单
- 新增 `AppHeader.vue` 布局组件与样式。
- 更新 `App.vue` 引入头部。
- 完成 `HomeView.vue` 英雄区视频 + 前景内容。
- 新增视频资源与可选海报图。

## 后续扩展
- 在 `n-menu` 增加更多导航项（关于我们/产品/联系等）。
- 提供主题变量与暗色/亮色切换；遮罩强度配置化。

— 请确认是否按此方案执行实现。