# Code Patterns

> 项目代码模式和惯例。实现新功能前读取。

## 命名约定

- **前端:** camelCase（变量/函数）, PascalCase（组件/类型）, kebab-case（文件/路由）
- **后端:** snake_case（Python）, PascalCase（类）, UPPER_CASE（常量）

## 响应格式

所有 API 统一返回 `{ status: number, message: string, data: T }`

## 错误处理

- 前端: Axios 拦截器统一处理 401 刷新 token，业务错误通过 `message.error()` 提示
- 后端: `BusinessException(400)` / `NotFoundException(404)` / `UnauthorizedException(401)` / `ForbiddenException(403)` 自定义异常

## 文件组织

- **Django App:** `models.py` → `schemas.py` → `services.py` → `api.py`（router）
- **Vue 组件:** `<script setup lang="ts">` SFC，按功能分目录

## 样式

- SCSS 变量和 mixins 全局注入（`variables.scss` + `mixins.scss`）
- 使用 Naive UI 组件库，主题在 `nexus.scss` 中定制
