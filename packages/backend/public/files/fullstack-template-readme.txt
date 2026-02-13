==================================================================
  FULL-STACK PROJECT TEMPLATE v2.0
  by Skill Master | Production-Ready Monorepo
==================================================================

INCLUDED IN THIS TEMPLATE:
---------------------------

/frontend (Next.js 14 + TypeScript)
  - App Router with layouts, loading states, error boundaries
  - Tailwind CSS + shadcn/ui components pre-configured
  - Authentication with NextAuth.js (Google, GitHub, Email)
  - React Query for server state management
  - Zod schema validation on forms
  - SEO meta tags and Open Graph setup

/backend (Express + TypeScript)
  - RESTful API with OpenAPI/Swagger docs
  - PostgreSQL with Prisma ORM + migrations
  - JWT authentication middleware
  - Rate limiting and CORS configuration
  - Request validation with Zod
  - Structured logging with Pino
  - Graceful shutdown handling

/shared (Common Types + Utils)
  - Shared TypeScript interfaces
  - Validation schemas (used by both frontend + backend)
  - Date/currency formatting utilities
  - Error code constants

/infrastructure
  - Docker Compose (app + db + redis)
  - GitHub Actions CI/CD pipeline
  - Dockerfile with multi-stage build
  - Nginx reverse proxy config
  - Environment variable templates (.env.example)

QUICK START:
--------------
1. Clone this template
2. cp .env.example .env
3. docker compose up -d
4. pnpm install
5. pnpm db:migrate
6. pnpm dev

TESTING:
---------
- Unit tests: Vitest + React Testing Library
- E2E tests: Playwright (pre-configured)
- API tests: Supertest
- Run all: pnpm test

==================================================================
  License: MIT | Version: 2.0
==================================================================
