# IdeaSpark 前端 UI 设计审查报告

> **审查角色**：以"最严格"标准执行的设计审查（视觉体系 / 一致性 / 无障碍 / 响应式 / 动效 / 可维护性）
> **审查对象**：`frontend/src`（130 个样式文件：`.scss` / `.vue` / `.css`）
> **审查日期**：2026-10-20
> **审查方式**：设计令牌解析 + 全量样式量化统计 + WCAG 对比度计算 + 浏览器实测（首页/市场页）
> **判定基准**：项目自身规范（`.trae/rules/project_rules.md` 第十五节"风格基因"+ `frontend/.trae/rules/project_rules.md` 第一/九章）+ WCAG 2.1 AA + 常规设计系统工程标准

---

## 0. 一句话结论

**这个项目"有一套设计系统文档，但没有一套设计系统"。**

`styles/` 目录里的令牌与 mixin 体系设计得相当专业（4px 网格、语义色、层级阴影、缓动曲线一应俱全），但它在真实页面里的落地率接近于零：**21 个全局设计类只有 4 个被任何页面使用，11 个 mixin 只有 1 个被 `@include` 过一次**。结果是每个页面各自手写样式，最终演变成 **1541 处硬编码颜色、48 种字号、23 种圆角、17 种过渡时长**的失控状态，并且被一份残留的 Vite 脚手架 CSS 持续污染。

**综合评分：2.6 / 10（不及格）**

---

## 1. 审查方法与证据基础

| 手段 | 说明 |
|---|---|
| 设计令牌逆向解析 | 读取 `styles/variables.scss`、`mixins.scss`、`nexus.scss`、`reset.scss`、`style.css`、`App.vue` themeOverrides，比对"声明的规范"与"实际写法" |
| 全量量化统计 | 对 130 个样式文件做正则频次统计（字号/圆角/z-index/时长/间距/颜色等） |
| 对比度计算 | 按 WCAG 2.1 相对亮度公式逐色值计算（基准：正文 4.5:1，大字号 3:1，非文本 3:1） |
| 落地率统计 | 统计 `nexus-*` 全局类与 `@include nexus-*` mixin 在 `styles/` 之外的实际使用次数 |
| 浏览器实测 | 实测首页 `/`、市场页 `/market` 的渲染与控制台；登录页因未登录被重定向，未能实测 |
| 未能覆盖 | 移动端实测未完成（浏览器子任务未缩放到 375px），相关结论均由代码证据推导 |

复现命令见 [附录 B](#附录-b可复现的扫描方式)。

---

## 2. 全局体检数据（硬指标）

### 2.1 设计系统落地率 —— 最致命的一张表

| 全局设计类（`styles/` 中定义） | 在页面/组件中的使用次数 |
|---|---|
| `.nexus-btn` / `-secondary` / `-icon` | **0 / 0 / 0** |
| `.nexus-input` | **0** |
| `.nexus-tag` / `-primary` / `-success` / `-warning` / `-error` | **0** |
| `.nexus-card` / `-lg` / `-flat` | **0 / 0 / 0** |
| `.nexus-page` | **0** |
| `.nexus-slide-up` / `.nexus-fade-in` / `.nexus-stagger` | **0 / 0 / 0** |
| `.nexus-hover-lift` | **0** |
| `.nexus-tabular` / `.nexus-font-decor` | **0 / 0** |
| `.nexus-toolbar` | 5 |
| `.nexus-editor-header` | 2 |
| `.nexus-ai-sidebar` | 2 |
| `.nexus-scroll` | 1 |

| mixin（`mixins.scss` 中定义） | 在 `styles/` 之外的 `@include` 次数 |
|---|---|
| `@include nexus-glass` / `nexus-btn` / `nexus-input` / `nexus-tag` | **0** |
| `@include nexus-hover-lift` / `nexus-slide-up` / `nexus-fade-in` / `nexus-sticky-header` / `nexus-pulse` | **0** |
| `@include nexus-scrollbar` | 1 |

> **判定**：`.nexus-btn-primary` 的胶囊按钮、`.nexus-input` 的圆角输入框、`.nexus-card` 的玻璃卡片，全部是**从未被打开过的工具箱**。所谓"设计系统"目前是纯文档资产，不是工程资产。

### 2.2 数值失控统计

| 维度 | 声明总数 | 去重种类 | 具体分布（Top） |
|---|---|---|---|
| `font-size` | 765 | **48** | 14px×216、12px×148、13px×119、16px×55、18px×37、11px×30、15px×27、20px×27、24px×14、28px×9、10px×6，另有 8 种 `rem` 值（1.5/1.1/0.9/1/2.5/1.25/1.2/2.2rem） |
| `border-radius` | 429 | **23** | 50%×98、8px×64、12px×63、16px×43、9999px×32、10px×18、24px×17、6px×17、4px×16、20px×11、14px×9、3px×9、2px×9、1rem×8、38%×3、999px×2、50px×2、0.75rem×2、26px×2、18px/30px/1px/5px 各 1 |
| `z-index` | 108 | **14** | 1×23、10×21、30×13、2×11、100×10、50×9、0×5、1000×5、9999×2、-1×2、20×2、999×1、99×1、5×3 |
| `transition` 时长 | 293 | **17** | **0.3s×149（占 51%）**、200ms×53、0.2s×49、0.4s×11、0.6s×9、150ms×4、1s×2、0.8s×2 … |
| `animation` 时长 | 144 | **35** | 0.7s×16、0.8s×15、0.6s×13、2s×7、3s×4、10s×4、**20s×2**、8s×2 |
| `padding` | 588 | **28** | 12px×72、24px×69、8px×64、16px×60、**10px×49、6px×30、14px×7、15px×1、3px×3、5px×1**（均不在 4px 网格上）、80px×23、60px×13、72px×4、76px×3、84px×1、100px×2、120px×3 |
| `gap` | 580 | **25** | 8px×122、12px×114、16px×96、4px×60、24px×48、6px×44、10px×27、2px×15、14px×5、15px×5、3px×3、30px×1、50px×1、56px×1、88px×1、120px×1、160px×1 |

### 2.3 颜色与令牌倒挂

| 指标 | 数值 | 含义 |
|---|---|---|
| 硬编码 hex 颜色 | **1541 处 / 163 种** | 平均每个样式文件 11.9 处写死颜色 |
| `rgba()` 颜色 | **582 处 / 112 种** | 半透明体系完全没有收敛 |
| `var(--nexus-*)` 令牌引用 | 696 次 | 令牌引用量仅约为硬编码颜色量的 **1/3** |
| 令牌字面量被抄写成 hex | ≈ **460 处** | 其中 `#111827`×119、`#6b7280`×111、`#e5e7eb`×85、`#9ca3af`×84、`#f3f4f6`×63 —— 这些正是 `--nexus-text-primary/secondary/border/tertiary/divider` 的值，被逐字复制后令牌失去意义 |
| 调色板外的杂色 | `#18a058`×21（Naive UI 默认绿，散落 9 个文件）、`#3b82f6`×12（Tailwind 蓝）、`#4ade80`×15、`#333`/`#666`/`#999` 共 57 处（三套并存的老灰阶） | 主色为黑白灰的定位被功能性绿色/蓝色反复破坏 |

### 2.4 无障碍与响应式

| 指标 | 数值 | 说明 |
|---|---|---|
| `outline: none / 0`（移除焦点） | **44 处 / 24 文件** | 焦点可见性被大面积关闭 |
| `:focus-visible`（合法的焦点环） | **4 处** | 移除 44 处，补齐 4 处 |
| `aria-label`（图标按钮应有） | **2 处** | 而 `cursor: pointer` 出现 227 处 |
| `role="..."` | 5 处 | |
| `tabindex` | **1 处** | |
| 可点击 `div`（`<div ... @click`） | **71 处** | 其中 70 处不可键盘触达 |
| `prefers-reduced-motion` | 2 处 | 而 `animation` 声明 87 处 |
| `@media` 查询 | 57 处，断点 8 种 | 768px×29、1024px×15、1200px×4、992px×2、769/480/640/960px 各 1；`min-width`（移动优先）仅 **2 处** |
| `transition: all` | **185 处** | 过渡属性不确定，易引发意外动画与性能损耗 |
| `position: absolute` | 115 处 | 布局靠绝对定位硬凑的信号 |
| `100vh` | 61 处（含 `calc(100vh - Xpx)` 7 处） | 移动端浏览器视口 bug，应使用 `dvh`/`svh` |
| `backdrop-filter` | **117 处** | 玻璃拟态被无节制使用 |
| `linear-gradient` / `radial-gradient` | 53 / 27 处 | 与"低色彩密度"定位冲突 |
| `!important` | **111 处 / 15 文件** | AppHeader.vue 占 44、LoginView.vue 14、MarkdownEditor.scss 11 |
| 未加 `scoped` 的 `<style>` 块 | 6 个 `.vue` | App.vue、CommunityView、SlideEditorView、ProjectWorkspaceView、MarkdownEditor、LoginView（部分）→ 全局样式泄漏 |

---

## 3. P0 严重问题（必须优先修复）

### P0-1 · 残留的 Vite 脚手架 CSS 正在污染整个设计体系

**证据**：`src/style.css`（在 `main.ts:2` **第一个**被导入）整份文件是 Vite 模板默认样式，从未被清理：

```css
/* src/style.css:1-19 */
:root {
  --header-height: 56px;          /* 与 variables.scss:69 的 64px 冲突 */
  color-scheme: light dark;        /* 引入不受控的深色模式 */
  color: rgba(255, 255, 255, 0.87);/* 默认文字色=白，浅色页面上是灾难 */
  background-color: #242424;       /* 默认底色=深灰 */
}
/* :21-28  a { color: #646cff }  a:hover { color: #535bf2 }  ← Vite 靛蓝，不在令牌内 */
/* :38-41  h1 { font-size: 3.2em; line-height: 1.1 }          ← em 缩放，脱离字号阶 */
/* :43-53  button { background:#1a1a1a; border-radius:8px; padding:.6em 1.2em }
/* :57-60  button:focus-visible { outline: 4px auto ... }     ← 与全站 44 处 outline:none 相矛盾
/* :62-64  .card { padding: 2em }                              ← 通用类名 .card 全局占用
/* :72-83  @media (prefers-color-scheme: light) { :root{ background:#ffffff } } ← 随系统切换的背景
/* :85-91  html, body, #app { user-select: none }              ← 全站禁止选中文本
```

**影响**：
1. **底色三方打架**：`style.css` 要 `#242424` → `reset.scss:12` 要 `#000` → `variables.scss:80-83` 要 `#fafafa`。同一个 `body` 被三份文件争夺，最终结果依赖导入顺序，任何一次调整顺序都会让全站观感突变。
2. **`user-select: none` 全站生效**（仅 input/textarea/contenteditable/code 例外）：这是一个"创作工具型 SaaS"，用户在项目页、社区帖、通知里**无法复制任何文字**——这不是风格问题，是功能性 UX 缺陷。
3. **`color-scheme: light dark`** 会让系统滚动条、原生表单控件在深色系统下渲染成深色，与浅色页面撕裂。
4. 全局 `a { color: #646cff }` 使所有未被显式覆盖的链接呈现 Vite 默认靛蓝，对比度 **4.09:1（不达 AA）**，且该色不在任何令牌中。
5. `.card { padding: 2em }` 这种通用类名一旦被组件复用，会出现"改了别处、这里跟着变"的幽灵样式。

**判定**：直接删除 `src/style.css`（保留必要的 `user-select` 白名单与 `--scrollbar-*` 变量到 `variables.scss`），并把 `--header-height` 收敛到唯一来源。

---

### P0-2 · 页头高度存在三个互相冲突的值，导致 8px 死区

**证据**：

| 位置 | 值 | 说明 |
|---|---|---|
| `src/style.css:7` | `--header-height: 56px` | 定义 1 |
| `src/styles/variables.scss:69` | `--header-height: 64px` | 定义 2（同变量名，后者生效） |
| `src/layouts/AppHeader.vue:209/218` | `height: 56px` | **页头真实高度** |
| `src/App.vue:196`（`.app-main--with-header`） | `padding-top: 64px` | 按 64 预留 |
| `src/views/NotificationsView.vue:265` | `padding-top: 64px` | 又一处 |
| `src/views/community/CommunityGroupDetailView.vue:571` | `padding-top: 56px` | 又一处 |
| `src/views/project/ProjectWorkspaceView.scss:78` | `height: 56px` | 局部页头 |
| `src/views/project/ProjectFileEditorView.scss:15` | `height: 60px` | **第三个值** |
| `src/views/editor/SlideEditorView.scss:220` | `height: 56px` | |
| `src/views/workbench/WorkbenchHomeView.vue:1776`、`ToolsMarketView.vue:740`、`ToolMarketCard.vue:179`、`CommunityView.scss:1339`、`ProjectDetailView.vue:1504` | `height: 56px` | 各自为政 |
| `src/views/ai/AiChatView.vue:11-16`、`WorkbenchView.vue:345/506` | `calc(100vh - 56px)` | 把页头高度硬编码进视口计算 |
| `styles/nexus.scss:111` | `height: var(--header-height)` | 唯一用令牌的地方，但令牌本身是 64 而实际是 56 |

**影响**：
- 页头实际 56px，而全局留白 64px → **每个 default 布局页面顶部多出 8px 空白**，视觉上像"没对齐"。
- 变量同名两份定义（56 / 64），令牌的"单一来源"承诺失效。
- `calc(100vh - 56px)` 有 7 处，页头一改高度这些页面就集体错位。

**判定**：全站统一 `--header-height: 56px` 单一来源；所有 `padding-top`、`calc(100vh - X)` 改为引用该令牌；编辑器页头（60px）要么也改成 56px，要么升级为正式的第二档令牌并全局遵守。

---

### P0-3 · 对比度不合格清单（WCAG AA 实测失败）

按 WCAG 2.1 相对亮度公式计算（正文需 ≥4.5:1，大字号 ≥3:1，非文本 UI ≥3:1）：

| 前景 / 背景 | 对比度 | 结论 | 实际用途（证据） |
|---|---|---|---|
| `#9ca3af`（`--nexus-text-tertiary`） / `#ffffff` | **2.54:1** | ❌ 严重失败 | 占位符、辅助说明、时间戳；**84 处写死使用** |
| `#9ca3af` / `#fafafa` | **2.43:1** | ❌ 严重失败 | 浅灰底上的次要文字 |
| `#d1d5db` / `#ffffff` | **1.47:1** | ❌ 几乎不可见 | 禁用态、分隔文字；22 处写死 |
| `#999999` / `#ffffff` | **2.85:1** | ❌ 失败 | 老灰阶文字；15 处写死 |
| `#6b7280`（secondary） / `#f3f4f6`（divider） | **4.39:1** | ❌ 差 0.11 不达 AA | `.nexus-tag` 的默认配色（`mixins.scss:205-216`：`background: --nexus-divider` + `color: --nexus-text-secondary`） |
| `#f59e0b`（warning） / `#ffffff` | **2.15:1** | ❌ 严重失败 | `.nexus-tag-warning`（`nexus.scss:84-88`）、Naive warning 文字 |
| `#10b981`（success） / 白底 | **2.54:1** | ❌ 严重失败 | `.nexus-tag-success`（`nexus.scss:78-82`） |
| `#18a058`（Naive 默认绿） / `#ffffff` | **3.38:1** | ❌ 失败 | 21 处硬编码，散落 9 个文件 |
| `#ef4444`（error） / `#ffffff` | **3.76:1** | ❌ 失败 | Naive error 文字、`.nexus-tag-error` |
| `#646cff`（Vite 靛蓝） / `#ffffff` | **4.09:1** | ❌ 失败 | 全局 `a` 规则（`style.css:21-28`） |
| `#6b7280` / `#ffffff` | 4.83:1 | ✅ 勉强通过 | 但仅剩 0.33 余量，任何降级都会跌破 |
| `#2563eb`（`--nexus-link`） / `#ffffff` | 5.17:1 | ✅ 通过 | 反而是令牌里最合规的颜色，却几乎未被使用 |

**判定**：功能色（success/warning/error）、`tertiary` 灰、标签配色**全部不达标**。而 `.nexus-tag-*` 这套"专门为标签设计的配色"本身就是失败方案——说明问题不在页面实现，而在**令牌定义阶段就错了**。

**修复方向**：文字色深压（`#9ca3af` → `#6b7280`/`#5b6472`；`#d1d5db` → `#9ca3af` 仅用于装饰性元素）；功能色区分"文字色"与"底色"两套（如 warning 文字用 `#b45309`，底色用 `#f59e0b` 浅色调背景）；`.nexus-tag` 背景改 `#f9fafb` + 文字 `#4b5563`。

---

### P0-4 · 无障碍基本盘缺失：焦点不可见、屏幕阅读器不可用

**证据**：

| 现象 | 数据 | 代表位置 |
|---|---|---|
| 关闭浏览器焦点环且未提供替代 | `outline: none` **44 处** vs `:focus-visible` **4 处** | `views/editor/SlideEditorView.scss` 7 处、`views/editor/ExcelEditorView.vue` 5 处、`CommunityView.scss` 3 处、`LoginView.vue` 3 处（登录页！）、`mixins.scss:137-140`（`.nexus-input:focus` 仅改边框色，无焦点环；而边框 `#e5e7eb`→`#000` 的变化在浅底上确实可见，但对外层容器失效） |
| 图标按钮无无障碍名称 | `aria-label` **2 处** | 而 `cursor: pointer` 227 处，几乎所有图标按钮都是裸 `<n-button>`/`<div>` |
| 可点击 `div` 无键盘支持 | `<div @click>` **71 处**，`tabindex` 仅 **1 处** | 卡片、列表项、菜单项普遍用 `div` + 点击 |
| 动画无降级 | `animation` 87 处 vs `prefers-reduced-motion` 2 处 | 前庭不适用户无法关闭动效 |

**判定**：**以无障碍标准衡量，本项目当前对纯键盘用户与读屏用户不可用**。登录、注册、忘记密码这类必须可用的关键路径同样存在 `outline: none`（`LoginView.vue` 3 处、`ResetPasswordView.vue` 2 处、`ForgotPasswordView.vue` 2 处）。

---

### P0-5 · 设计系统的三大"影子实现"并存

同一个视觉概念被独立实现了 4 次：

| 实现 | 位置 | 使用者 |
|---|---|---|
| ① `@mixin nexus-glass` | `mixins.scss:6-13` | 仅 `nexus.scss` 内部（页面 0 次 `@include`） |
| ② `.nexus-card` / `.nexus-card-lg`（调用 ①） | `nexus.scss:30-39` | **0 次使用** |
| ③ `.nexus-glass-panel` | **`components/markdown/MarkdownEditor.scss:154`** | `MarkdownEditor`、`SlidesPanel`(×2)、`CsvPanel`(×2)、`ProjectFileEditorView` 共 4 个组件 |
| ④ Naive UI `Card.boxShadow` | `App.vue:81` | Naive 卡片 |

**这个 `.nexus-glass-panel` 是本报告最典型的架构病灶**：一套跨 4 个组件的"设计系统级"样式，被定义在**某单个组件的样式文件里**，且能被子组件使用，唯一原因是 `MarkdownEditor.vue` 的 `<style>` **没有加 `scoped`**（见 P0-8）——用"全局样式泄漏"当成了模块共享机制。

**判定**：玻璃卡片语言有 4 份定义、0 份权威。任何一次视觉调整都需要改 4 个地方，且必然漏改。

---

### P0-6 · 动效体系失控：0.3s 一家独大、最长 20s、hover 用 scale 放大

**证据**：

| 现象 | 数据 / 位置 |
|---|---|
| 过渡时长与令牌脱节 | `--nexus-duration-fast: 200ms`，实际 `0.3s` 用了 **149 次（51%）**；另有 1s、0.8s、0.6s 用于交互过渡 |
| 对 `all` 做过渡 | `transition: all` **185 处**（设计系统自身就有：`mixins.scss:51`、`:109`；页面侧如 `ForgotPasswordView.vue`、`ProjectFileEditorView.scss:118-139`） |
| hover 用缩放放大 | `transform: scale(` in `:hover` **16 处**，如 `mixins.scss:53-56` `&:hover { transform: scale(1.02) }`；按钮 hover 放大在专业工具型产品中是典型的"廉价感"手法 |
| 动画时长极长 | `animation` 35 种时长，含 **20s×2、10s×4、8s×2、4s×3、3s×4** |
| 令牌里的缓动被定义却少用 | `--nexus-ease`（`cubic-bezier(0.16,1,0.3,1)`）在 `mixins.scss` 内部使用，页面级几乎不用 |

**判定**：动效既不统一（17 种时长），也不克制（20s 动画），更不符合"hover ≤150-200ms、只用状态反馈"的专业标准。

---

### P0-7 · 装饰性元素与项目定位、与用户明确偏好**直接冲突**

**证据**：

| 组件 | 内容 |
|---|---|
| `components/home/ParallaxBackground.vue:45-61` | `.stars-layer` 星空层 + `animation: stars-rotate 100s linear infinite` |
| `components/home/ShootingStars.vue:10-31` | 4 颗流星 + `animation: animate-star 3s linear infinite` |
| `components/NexusNoise.vue:6-16` + `styles/nexus.scss:9-19` | 全屏噪点纹理，`position: fixed` + `z-index: 9999` + `opacity: 0.02`，在 `App.vue:148` **全局挂载** |
| `index.html:29-30` | 骨架屏 `shimmer` 渐变 + 1.5s 无限动画 |
| 全局统计 | `radial-gradient` 27 处、`linear-gradient` 53 处、`backdrop-filter` 117 处 |

**三重冲突**：
1. 与项目自身规则冲突：`frontend/.trae/rules/project_rules.md` 第十五节明确要求"避免大幅位移、长时间动画、强闪烁效果""低色彩密度""结构 > 装饰"。**100s 旋转星空与 3s 无限流星是这条规则的反面教材。**
2. 与产品定位冲突：IdeaSpark 是"创作者工具型 SaaS（非展示页、非炫技页）"，首页堆叠星空/流星/噪点属于展示页手法。
3. 与使用者的明确偏好冲突：已记录的偏好是"**不喜欢过多星海噪点、过暗的夜空、压抑不通透的设计**"。

**判定**：`ShootingStars` 与 `ParallaxBackground` 的星空层建议直接移除；噪点层建议移除或降为可选装饰（当前它盖在 Naive 弹窗之上，`z-index: 9999` 会让所有对话框都蒙一层颗粒）。

---

### P0-8 · 6 个组件的样式未加 `scoped`，全局样式泄漏

**证据**：`App.vue`（1 块）、`views/community/CommunityView.vue`（1）、`views/editor/SlideEditorView.vue`（1）、`views/project/ProjectWorkspaceView.vue`（1）、`components/markdown/MarkdownEditor.vue`（1）、`views/LoginView.vue`（2 块中 1 块未 scoped）。

**影响**：
- 这些文件里的类名会直接进入全局命名空间。`MarkdownEditor.scss:154` 的 `.nexus-glass-panel` 就是被这一机制"无意中共享"给了 4 个组件（见 P0-5）。
- `App.vue:158-198` 的未 scoped 块既包含了合理的全局样式（滚动条 `:165-181`、`::selection` `:183-186`），也包含了 `.app-main` / `.app-main--with-header`（`:189-197`）这类布局类，边界模糊。
- 一旦某个组件出现同名类（如 `.card`，恰好还被 `style.css:62-64` 也占用了），就会互相污染且难以定位。

---

### P0-9 · 全局背景色三方冲突，首屏存在明显闪色

**证据链**：

```
index.html:26   body { background-color: #000; color: #fff; font-family: system-ui }   ← 内联关键CSS，最先绘制
src/style.css:13 :root { background-color: #242424; color: rgba(255,255,255,.87) }     ← 其次
src/styles/reset.scss:12 html, body { background-color: #000 }                          ← 再次
src/styles/variables.scss:80-83 body { background-color: #fafafa; color: #111827 }      ← 最终生效
```

**影响**：首屏先出现**纯黑底 + 白色 system-ui 文字**（内联 CSS），随后整页变成**`#fafafa` 浅灰底 + Inter 文字**——一次从黑到白的整体跳变（FOUC），并且字体栈换了三次（`system-ui` → `Inter…` → `Inter/Playfair`）。首页黑底区块（`HomeView.vue:400/430` `background-color: #000`）又叠在浅灰 body 之上，形成"外浅内黑"的拼贴感。

**判定**：必须以设计令牌为准统一首屏底色，并让 `index.html` 内联 CSS 与 `variables.scss` 保持一致（关键 CSS 里不该出现 `#000`/`system-ui` 这种与设计系统无关的硬编码）。

---

### P0-10 · 字体方案存在"三重风险 + 一重不落地"

**证据**：

| 问题 | 证据 |
|---|---|
| 三套字体栈并存 | `index.html:26` `system-ui` / `style.css:2` `Inter, HarmonyOS Sans, Source Han Sans SC, Noto Sans SC, system-ui…` / `variables.scss:30-32` `'Inter', -apple-system…` + `--nexus-font-decor: 'Playfair Display'` / `App.vue:55-56` 又重复一遍 |
| 中文字形缺失 | `Inter` 与 `Playfair Display` **均无 CJK 字形**。中英文混排时，中文回落到系统字体、拉丁字符走 Inter → **同一行文字的字面大小与基线不一致**（这是极简排版里最容易被放大的瑕疵） |
| Google Fonts 依赖 | `index.html:19` 从 `fonts.googleapis.com` 异步加载。生产环境（国内网络）该域名常不可达 → 字体静默失效，整站排版意图落空，且用户看到的与设计稿完全不同的字面 |
| 字体未被本地化 | 无 `@font-face`、无 `public/fonts/` 自托管 |
| 装饰字体形同虚设 | `--nexus-font-decor`（Playfair Display 衬线）+ 全局类 `.nexus-font-decor`（`nexus.scss:255-256`）在页面中 **0 次使用**；唯一出现装饰字体处是 `MarketView.vue:731` **直接硬编码** `font-family: 'Playfair Display', serif`（绕过令牌）→ 品牌排版语言只在市场页出现一次，且是绕过令牌实现的 |
| 行高策略不统一 | `style.css:3` 全局 `line-height: 1.6`；但 `style.css:39` 又给 `h1` 设 `line-height: 1.1`。中文正文行高需要按段落/标题分档定义，当前只有 2 档且来源是脚手架 |

---

### P0-11 · 色彩污染：Naive 默认绿与杂色蓝灰正在稀释品牌色

**证据**：`#18a058`（Naive UI 默认主色绿）出现 21 次，散落 **9 个文件**：

`AiLandingPage.vue:90/319/513/521`、`AiProjectBoard.vue:194`、`AiProjectManagement.vue:120/358`、`WorkshopDashboard.vue:364/373/379/509/625`、`AiProjectWorkbench.vue:127/226/656/659`、`DocsModule.vue:16`、`AiProjectCreate.vue:26`、`PluginSelector.vue:220`、`ForbiddenView.vue:51`

而 `App.vue:33` 的 themeOverrides 已把 success 定义为 `#10b981`。**同一语义（成功/正向）同时存在 `#10b981` 和 `#18a058` 两种绿**，且后者是 Naive 的出厂值——说明主题覆写没覆盖到这些硬编码点。

另有 `#3b82f6`×12、`#4ade80`×15、`#646cff`（全局链接）等调色板外颜色。

---

### P0-12 · 响应式：有 57 个断点却只有 2 个 `min-width`

**证据**：`@media` 57 处，断点取值 8 种（768px×29、1024px×15、1200px×4、992px×2、769px/480px/640px/960px 各 1），`min-width`（移动优先）仅 2 处 → **本质是"桌面优先 + 逐处打补丁"**，且断点无刻度（768/769 混用、992/960/1024 三个近邻值并存）。

**硬编码破坏点**：
- `styles/nexus.scss:128-136`：编辑器侧栏 `width: 380px; min-width: 380px` 无折叠、无响应式 → 在 1024px 以下屏宽会挤压画布，在 375px 下必然破版。
- `100vh` 61 处（`nexus.scss:100` 编辑器外壳 `height: 100vh`、`App.vue:190`、`AppHeader` 相关）+ `calc(100vh - 56px)` 7 处 → 移动端浏览器地址栏收放时会露出/裁掉内容。
- `clamp()` 仅 3 处 → 流体排版基本没用起来。

---

## 4. P1 中等问题

| # | 问题 | 证据 | 影响 |
|---|---|---|---|
| P1-1 | **无字号阶** | 48 种字号，且 11/12/13/14/15px 五档挤在一起（216+148+119+30+27 次）；同时 `px` 与 `rem` 混用（`1.5rem`/`1.1rem`/`0.9rem`/`2.5rem`… 8 种 rem） | 无法建立信息层级，"什么和什么是一级"靠肉眼猜 |
| P1-2 | **无圆角语义** | 23 种圆角；`--nexus-radius-*` 定义 5 档却被 `10px/6px/14px/4px/3px/2px` 绕过；胶囊（9999px×32）与圆角矩形（8/12/16px）在同一产品内混用无规则 | 卡片圆角与按钮形状语言不统一 |
| P1-3 | **无 z-index 刻度** | 14 种取值混用 `1/2/5/10/20/30/50/99/100/999/1000/9999` | 弹层覆盖关系靠试错维护 |
| P1-4 | **阴影与玻璃卡片在浅色底上不可见** | `--nexus-shadow-md: 0 4px 24px -4px rgba(0,0,0,0.04)`（4% 黑）；`nexus-glass` 边框 `rgba(255,255,255,0.4)` 压 `#fafafa` 上 | 卡片"浮不起来"，只剩一个几乎看不见的边界，层次全靠留白赌 |
| P1-5 | **重复定义（同一规则 2-3 份）** | `::selection`：`variables.scss:86-89` + `App.vue:183-186`；滚动条：`App.vue:165-181` + `mixins.scss:184-202`；噪点：`nexus.scss:9-19` + `NexusNoise.vue:6-16` | 改一处必漏另一处 |
| P1-6 | **令牌与 Naive 主题双轨** | `App.vue:23-124` 的 `themeOverrides` 把同一批值各写一遍：`primaryColor:#000000`=--nexus-accent、`successColor:#10b981`=--nexus-success、`warningColor:#f59e0b`=--nexus-warning、`errorColor:#ef4444`=--nexus-error、`bodyColor:#fafafa`=--nexus-bg、`borderColor:#e5e7eb`=--nexus-border、`dividerColor:#f3f4f6`=--nexus-divider、`fontFamily:'Inter'…`=--nexus-font-ui、`borderRadius:'12px'`=--nexus-radius-md、`borderRadiusSmall:'8px'`=--nexus-radius-sm | 双份真相，改令牌主题不跟着变；且 `borderRadius` 的枚举写法与 CSS 侧完全脱钩 |
| P1-7 | **`!important` 泛滥** | 111 处；`AppHeader.vue` **44 处**、`LoginView.vue` 14、`MarkdownEditor.scss` 11 | Naive 组件与自研样式互相打架，主题无法覆盖 |
| P1-8 | **间距网格被打破** | `padding` 28 种含 `10px×(49)`、`6px×30`、`14px`、`15px`、`18px`、`3px`、`5px`；`gap` 25 种含 `6/10/2/14/15/3/30/50/56/88/120/160px` | "4px 网格"只在令牌注释里成立 |
| P1-9 | **`transition: all`** | 185 处 | 可能触发 `box-shadow`/`width`/`height` 等昂贵属性过渡，产生意外抖动 |
| P1-10 | **`overflow: hidden` 掩盖布局问题** | `overflow:hidden` 157 处、`overflow-x:hidden` 3 处（含 `reset.scss:11`、`style.css:35`） | 内容被裁掉而非被布局解决；`html/body` 上的 `overflow-x:hidden` 还会破坏 `position: sticky` 的部分行为 |
| P1-11 | **绝对定位用于正常布局** | `position: absolute` 115 处（如 `ProjectWorkspaceView.scss:72-87` 用 `absolute` + `z-index: 10` 做内容区头部） | 内容高度变化即错位，维护成本高 |
| P1-12 | **中文排版未受控** | 全局仅 `line-height: 1.6` 一档；中文正文常用 1.6-1.75、标题 1.2-1.35，当前标题行高空缺（仅 `h1:1.1` 来自脚手架）；`letter-spacing: -0.01em` 全局作用于中文会产生"挤字" | 长文阅读体验与"轻奢极简"定位不符 |

---

## 5. P2 轻微问题

| # | 问题 | 证据 |
|---|---|---|
| P2-1 | 命名与 BEM 规范未贯彻 | 项目中混用 `.nexus-*`、`.ee-*`（EmbeddedEditor）、`.md-*`、`.slides-*`、`.csv-*`、`.app-*`、`.card`（脚手架占用）+ 大量单段简短类名，BEM 只在少数文件出现 |
| P2-2 | 无设计令牌文档 | 令牌定义在 SCSS 注释里，没有独立的令牌清单文档（hex/用途/使用场景），新人无从遵守 |
| P2-3 | 深浅灰阶三套并存 | `#333`/`#666`/`#999`（老灰阶，57 处）与 `#111827`/`#6b7280`/`#9ca3af`（令牌灰阶）与 `#1f2937`/`#374151`（另一组）同时存在 |
| P2-4 | 装饰字体不统一 | `--nexus-font-decor` 令牌与 `.nexus-font-decor` 类均为 0 次使用；只在 `MarketView.vue:731` 硬编码出现一次 |
| P2-5 | 图标尺寸未成阶 | `n-icon size` 各处手写（如 `size="32"`），无 16/20/24 三档约定 |
| P2-6 | 骨架屏动画无限循环 | `index.html:29-30` `shimmer 1.5s infinite`，无 `prefers-reduced-motion` 降级 |
| P2-7 | 死代码污染观感判断 | `HelloWorld.vue`、`TextDemo.vue`、`views/ai/AiLandingPage.vue` 等残留页面会让人误以为风格不统一是"设计选择" |

---

## 6. 影响面热力图（改动收益最高的文件）

| 文件 | 硬编码 hex | 其他 | 备注 |
|---|---|---|---|
| `views/workbench/WorkbenchTeamView.vue` | 96 | 100vh/56px 硬编码 | 全站最脏页面 |
| `views/MarketView.vue` | 79 | 唯一使用装饰字体处 | |
| `views/ProjectDetailView.vue` | 79 | `height: 56px` | |
| `views/ai/AiLandingPage.vue` | 57 | `#18a058`×4 | |
| `views/LoginView.vue` | 50 | **14 处 `!important` + 3 处 `outline:none` + 未 scoped 样式块** | 关键路径，性价比最高 |
| `layouts/AppHeader.vue` | 31 | **44 处 `!important`** + 页头真高度 56px | 全站页头，一改全受益 |
| `views/project/ProjectWorkspaceView.scss` | 33 | absolute + z-index 10 + 56px | |
| `App.vue` | 40 | themeOverrides 双轨 + 未 scoped + 重复 `::selection`/滚动条 | |
| `components/DoubleScrollSection.vue` | 30 | 装饰性滚动组件 | |
| `styles/nexus.scss` + `mixins.scss` + `variables.scss` + `style.css` | — | 设计系统本体（含脚手架 CSS 污染） | **根节点** |

---

## 7. 修复路线图与验收指标

### 阶段一 · 止血（根节点，必须先做）

| 任务 | 具体动作 | 验收指标 |
|---|---|---|
| 1. 清理脚手架 CSS | 删除 `src/style.css`；把 `--header-height`、`--scrollbar-*` 迁入 `variables.scss`；`user-select:none` 收窄为白名单 | `src/style.css` 不存在；全站可选中正文文字；`--header-height` 全库仅 1 处定义 |
| 2. 页头高度统一 | 全站锁定 `--header-height: 56px`；所有 `padding-top` / `calc(100vh - Xpx)` 引用令牌 | `grep -c "height: 56px|56px;"` 归零；页面顶部无 8px 死区 |
| 3. 首屏底色统一 | `index.html` 内联关键 CSS 与 `variables.scss` 同源（`#fafafa` + Inter 栈）；移除 `reset.scss` 的 `#000` | 首屏无黑→白跳变；三处 `body` 背景定义收敛为 1 处 |
| 4. 字体落地 | 自托管 Inter 与中文字体（或明确采用系统字体栈）；移除 Google Fonts 外链；统一为 1 套字体栈 | 断网/国内网络下字体不变；字体栈定义仅 1 处 |
| 5. 对比度整改 | 按 P0-3 清单逐色值调整，最小字号 ≥12px、正文色 ≥4.5:1 | 全部色对 ≥4.5:1（正文）/≥3:1（大字号、非文本） |
| 6. 无障碍基本盘 | 每个交互元素补 `:focus-visible`（统一 `outline: 2px solid #000; outline-offset: 2px`）；图标按钮补 `aria-label`；可点击 `div` 改 `button` 或补 `role+tabindex+键事件`；动画补 `prefers-reduced-motion` | `outline:none` 归零；`aria-label ≥ cursor:pointer`；`:focus-visible` 覆盖全部交互元素 |
| 7. 动效收敛 | 统一到 3 档（120/200/320ms）；消除 `transition: all`；hover 去掉 `scale` 放大；移除 20s/10s 级装饰动画 | 过渡时长种类 ≤3；`transition: all` 归零 |

### 阶段二 · 设计系统真正落地

| 任务 | 具体动作 | 验收指标 |
|---|---|---|
| 8. 字号与行高定阶 | 定义 6-7 档（如 12/13/14/16/20/28/40）+ 中文行高分档（正文 1.75、标题 1.3） | 字号种类 ≤8；`rem`/`px` 混用归零 |
| 9. 圆角与层级定阶 | 圆角收敛到 4 档（小 6 / 中 10 / 大 14 / 胶囊 full）并明确"胶囊仅用于标签与主按钮"；建 z-index 刻度（0/10/100/1000/2000） | 圆角种类 ≤5；z-index 取值只来自刻度 |
| 10. 颜色收敛 | 令牌唯一来源化；清除 `#18a058`/`#3b82f6`/`#4ade80`/老灰阶 `#333/#666/#999`；令牌字面量抄写（≈460 处）全部替换为 `var()` | 硬编码 hex ≤ 令牌文件内；颜色种类 ≤20 |
| 11. 消灭影子实现 | 玻璃卡片/按钮/输入框/标签全部改用 `mixins` 或全局类；删除 `MarkdownEditor.scss:154` 的 `.nexus-glass-panel`，改由全局类提供；令牌与 themeOverrides 同源（themeOverrides 由 SCSS 变量生成） | 全局类使用次数从 4/21 提升到 21/21；同类视觉实现仅 1 份 |
| 12. 消除全局泄漏 | 6 个未 scoped 的 `<style>` 补 `scoped`（仅保留必要的全局文件） | 未 scoped 的组件样式归零 |

### 阶段三 · 响应式与体验精修

| 任务 | 具体动作 | 验收指标 |
|---|---|---|
| 13. 断点刻度化 | 定义 3-4 档（375 / 768 / 1024 / 1440）并移动优先 | 断点取值 ≤4 种；`min-width` 覆盖主要布局 |
| 14. 撤掉 vh 依赖 | `100vh` 全部改 `100dvh`/`100svh`；编辑器侧栏 `380px` 改 `clamp()` + 可折叠 | `100vh` 仅在明确场景使用；375px 下无横向滚动、无破版 |
| 15. 装饰清理 | 移除星空/流星/噪点层与大面积渐变；玻璃拟态只保留在明确的"浮层"场景 | `radial-gradient`/星空类动画归零或 ≤2 处 |
| 16. 排版精修 | `letter-spacing` 不再全局作用于中文；中英混排基线校正；图标尺寸建阶（16/20/24） | 长文阅读无挤字；图标尺寸种类 ≤3 |

### 阶段四 · 建立防回流机制（否则三个月后必然复发）

| 任务 | 说明 |
|---|---|
| 17. 令牌文档化 | 输出令牌清单（值 / 用途 / 禁用场景），作为唯一事实来源 |
| 18. 加静态门禁 | Stylelint：禁止字面量 hex（除令牌文件）、禁止 `outline: none` 无替代、禁止 `transition: all`、禁止 `!important`（白名单外）、限制 `z-index` 取值 |
| 19. 视觉回归 | Playwright 截图基线覆盖关键页面（首页/市场/登录/工作台/编辑器） |
| 20. 无障碍扫描 | 接入自动化 a11y 检查（对比度、可访问名称、焦点顺序）纳入 CI |

---

## 8. 附录

### 附录 A：对比度计算明细

采用 WCAG 2.1 相对亮度公式：

```
若 C ≤ 0.03928:  c = C / 12.92
否则:            c = ((C + 0.055) / 1.055) ^ 2.4
L = 0.2126 * R + 0.7152 * G + 0.0722 * B   （R/G/B 为线性化后的通道值）
对比度 = (L_亮 + 0.05) / (L_暗 + 0.05)
```

关键色值亮度与对比度（白底 `#ffffff`）：

| 色值 | 相对亮度 L | 对比度 | AA（正文 4.5） |
|---|---|---|---|
| `#9ca3af` | 0.3636 | 2.54:1 | ❌ |
| `#d1d5db` | 0.6627 | 1.47:1 | ❌ |
| `#999999` | 0.3186 | 2.85:1 | ❌ |
| `#6b7280` | 0.1673 | 4.83:1 | ✅（余量 0.33） |
| `#10b981` | 0.3639 | 2.54:1 | ❌ |
| `#18a058` | 0.2604 | 3.38:1 | ❌ |
| `#f59e0b` | 0.4389 | 2.15:1 | ❌ |
| `#ef4444` | 0.2291 | 3.76:1 | ❌ |
| `#646cff` | 0.2066 | 4.09:1 | ❌ |
| `#2563eb` | 0.1531 | 5.17:1 | ✅ |

补充：`#6b7280` 压 `#f3f4f6` = **4.39:1**（差 0.11 不达 AA），这正是 `.nexus-tag` 的默认配色。

### 附录 B：可复现的扫描方式

```powershell
# 在 frontend/ 目录执行，扫描 130 个样式文件的设计变量分布
$root = 'src'
$files = Get-ChildItem -Path $root -Recurse -Include *.scss,*.vue,*.css -File
# 字号 / 圆角 / z-index / 过渡时长 / animation 时长 / padding / gap 的频次分布
# 硬编码 hex 与 rgba 的去重统计
# var(--nexus-*) 令牌引用数 vs 令牌字面量抄写数
```

关键结论对应的统计口径：

| 结论 | 统计口径 |
|---|---|
| 1541 处 / 163 种硬编码色 | `#[0-9a-fA-F]{3,8}\b` 全库匹配 |
| 48 种字号 | `font-size:\s*([0-9.]+)(px\|rem\|em)` |
| 23 种圆角 | `border-radius:\s*([0-9.]+)(px\|%\|rem)` |
| 111 处 `!important` | `!important` 全库匹配，15 个文件命中 |
| 设计系统落地率 =4/21 | 21 个全局类名在 `styles/` 之外的出现次数 |
| mixin 落地率 =1 | `@include nexus-*` 在 `styles/` 之外的出现次数 |

---

## 9. 本报告未覆盖的范围（需补充）

| 项 | 说明 |
|---|---|
| 移动端与平板实测 | 未完成 375px / 768px 实际渲染验证，第 3 节 P0-12 结论由代码证据推导，建议实机复核 |
| 登录后页面（工作台、项目工作区、编辑器）实测 | 登录页在浏览器中被重定向，未能实测真实交互状态（hover/loading/empty/error 四态） |
| 内嵌编辑器主题一致性实测 | Excalidraw / SimpleMindMap / LogicFlow 的默认主题是否被覆写，需打开白板/导图/流程图三个资产实测；静态代码显示 `WhiteboardEditor.vue:85-98` 仅透传 `initialData`，未发现主题参数 |
| 深浅模式 | 项目未实现深色模式，但 `style.css:11` 引入了 `color-scheme: light dark` 与 `prefers-color-scheme` 媒体块，该"半成品深色模式"是否会在特定系统上引发渲染异常，需实机验证 |
| 性能观感 | `backdrop-filter` 117 处与 20s 级动画对低端设备的实际影响，需真机性能测试 |
