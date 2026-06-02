# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IdeaSpark is an AI-driven project incubator. Users describe an idea and the platform helps them build it out through project management, AI-powered editing, document/slide/excel editors, community features, and a plugin marketplace.

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite, Pinia (state management with persist plugin), Vue Router, Naive UI, Axios, ECharts, GSAP
- **Backend**: Django 4.2 + Django Ninja (REST API), MySQL, JWT auth, DeepSeek AI (OpenAI-compatible client), Aliyun OSS
- **Testing**: Vitest (frontend unit), Playwright (E2E), Django built-in test framework (backend)

## Key Commands

### Frontend (d:\大学就业指导\项目相关\项目落地（全栈）\IdeaSpark\frontend\)
```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Type-check + build
npm run lint         # ESLint (zero warnings)
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run typecheck    # vue-tsc type checking
npm run test         # Vitest (watch)
npm run test:run     # Vitest (single run)
npm run test:coverage # Vitest with coverage
npm run test:e2e     # Playwright E2E
```

### Backend (d:\大学就业指导\项目相关\项目落地（全栈）\IdeaSpark\backend\)
```bash
python manage.py runserver 8081   # Dev server (port 8081)
python manage.py test             # Run Django tests
gunicorn config.wsgi:application  # Production server via gunicorn.conf.py
```

## Architecture

### Frontend Structure

```
frontend/src/
├── api/           # Axios API clients per module (request.ts is the base)
├── store/         # Pinia stores (user.ts, chat.ts, modules/aiWorkshop.ts)
├── router/        # Vue Router split by module (core, user, project, community, ai, workbench, tools)
├── views/         # Page-level components grouped by feature area
├── components/    # Shared components (editor/, ai/, home/, markdown/)
├── composables/   # Vue composables (useAiModule, useAppDialog, useDocAi, useExcelAi, etc.)
├── constants/     # Constants (aiModules.ts, community.ts)
├── utils/         # Utilities (avatar, docCommands, formulaEngine, imageHandler)
├── styles/        # SCSS variables, mixins, reset, nexus theme
└── plugins/       # Vue plugins (lazyload)
```

### Backend Structure

```
backend/
├── config/        # Django config (settings.py, urls.py, wsgi.py, asgi.py)
├── common/        # Shared utilities (auth.py - JWT, exceptions.py, middleware.py, response.py)
├── apps/
│   ├── accounts/      # User registration, login, profile, admin, plugins
│   ├── projects/      # Project CRUD, files, members, favorites, likes, market, comments, plugins
│   ├── teams/         # Team CRUD, members, invitations
│   ├── community/     # Posts, comments, likes, groups
│   ├── ai/            # DeepSeek API client, chat, project generation, content editing
│   ├── notifications/ # Notification system
│   ├── files/         # File upload, OSS integration
│   └── security_logs/ # Security audit logging
```

Each Django app follows a consistent pattern: `models.py` → `schemas.py` → `services.py` → `api.py` (router).

### API Pattern

- Django Ninja powered, all endpoints under `/api/...`
- Unified response format: `{ status: number, message: string, data: T }`
- Standard response helpers: `ApiResponseData.ok()`, `.created()`, `.error()`, `.paginated()`
- Auth via `AuthBearer()` or `OptionalAuthBearer()` (JWT Bearer token middleware)
- Custom exception classes: `BusinessException(400)`, `NotFoundException(404)`, `UnauthorizedException(401)`, `ForbiddenException(403)`

### Frontend API Pattern

- Axios instance configured in `src/api/request.ts` with interceptors for JWT injection and 401 auto-refresh
- Each module exports typed functions: `api/project.ts`, `api/user.ts`, etc.
- API types defined in `src/api/types.ts`

### Database

- MySQL database with existing tables (all Django models use `managed = False`)
- Django reads from pre-existing tables, no migrations
- The backend was migrated from a Spring Boot/Java backend — settings and comments reference the Java counterparts

### Authentication Flow

1. JWT access token (7 day expiry) + refresh token (30 day expiry)
2. Access token stored in localStorage and injected as `Bearer` header
3. 401 responses trigger automatic token refresh (with queue mechanism for concurrent requests)
4. Pinia user store persisted to localStorage via `pinia-plugin-persistedstate`

### AI Integration

- DeepSeek API via OpenAI-compatible SDK
- Rate limiting per user per category (chat, edit, generate, etc.)
- Features: chat, project generation, tech stack advice, content editing (rewrite, polish, expand, summarize, translate, etc.), document/slide/excel AI assistants
