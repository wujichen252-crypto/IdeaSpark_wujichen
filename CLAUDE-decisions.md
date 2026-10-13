# Architecture Decisions

> 架构决策记录 (ADR)。做重要决策时更新。

## ADR-001: Django Ninja REST API

- **时间:** 2026-06
- **决策:** 使用 Django Ninja 替代 Django REST Framework
- **原因:** 更好的类型支持（Pydantic schema）、自动生成 OpenAPI 文档、性能更优
- **影响:** 统一的 `{ status, message, data }` 响应格式；API 路由集中在 `config/urls.py` 注册

## ADR-002: Pinia + 持久化

- **时间:** 2026-06
- **决策:** Pinia 替代 Vuex，使用 `pinia-plugin-persistedstate` 持久化
- **原因:** 更简洁的 API，完整的 TypeScript 支持，持久化插件开箱即用
- **影响:** user store 持久化到 localStorage，token 在 Axios 拦截器中自动注入

## ADR-003: JWT 双 Token 认证

- **时间:** 2026-06
- **决策:** Access Token（7天） + Refresh Token（30天）
- **原因:** 从 Spring Boot 后端迁移时保持相同的认证流程
- **影响:** Axios 拦截器自动刷新 token（带请求队列避免并发竞争）
