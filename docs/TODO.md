# TODO — Prioritized remaining work

Checked against `docs/ROADMAP.md` and the current codebase (2026-08-29).

**Already in place:** Phases 1–5 foundation, Biome/Lefthook/commitlint, Vitest unit + users/uploads integration tests, Express bootstrap (`/health`, `/ready` with Postgres + Redis, graceful shutdown), env Zod validation, middleware (helmet, CORS, rate limit, compression, request IDs, Pino), users CRUD vertical slice, uploads module (multipart + MIME/size), Drizzle/Postgres + Redis client + Compose, email port (Resend/noop), object storage port (local/S3), outbound `IHttpClient` (Axios), Zod validators, AppError/field errors, pagination/filter/sort, `/api/v1`, GitHub Actions CI, Dependabot.

| Priority | Item | Phase | Notes |
| --- | --- | --- | --- |
| P0 | Root `README.md` (overview, setup, env, DB, scripts) | 28 | Done |
| P0 | Fix `drizzle.config.ts` schema path | 9 | Done (`drizzle/schema/`) |
| P0 | Pin `packageManager` / Node engines in `package.json` | 25 | Done (`pnpm@11.22.0`, `node>=22`) |
| P1 | App Dockerfile (multi-stage, non-root, `.dockerignore`) | 22 | Done — `pnpm docker:up` |
| P1 | Authentication module (per `docs/AUTH.md`) | 13 | DDL + AUTH_API.md; register→logout + `/me` landed; logout-all/password/sessions still pending |
| P1 | Protect users (and future) routes with auth middleware | 13 / 8 | Auth middleware exists (`requireBearerAuth`); users API still open |
| P2 | Authorization / RBAC | 14 | `roles` / `user_roles` tables ready; design + middleware + use-case rules pending |
| P2 | Unauthorized / Forbidden / Conflict error conventions | 11 | Done — shared 401/403/409 errors; email conflict is 409 |
| P2 | OpenAPI / Swagger UI synced with routes | 19 | Not started |
| P3 | Coverage thresholds in Vitest + CI coverage gate | 3 / 23 | Coverage configured, no thresholds |
| P3 | Real test DB strategy + repository tests | 8 / 9 | Integration tests mock the repository |
| P3 | E2E test structure and smoke flows | 3 / 23 | `tests/e2e` empty / unused |
| P3 | Include `tests/**` in Biome | 2 | Biome currently scopes to `src/**` only |
| P4 | HTTP server timeouts + keep-alive | 4 / 7 | Done — `HTTP_SERVER_*` on `createServer` |
| P4 | Transaction abstraction for multi-step writes | 6 / 9 | Not needed yet for simple CRUD |
| P4 | Database seeding | 9 | — |
| P4 | Dependency audit / vulnerability scanning in CI | 15 / 23 / 25 | Dependabot present; no audit step |
| P5 | Redis / caching layer (if required) | 16 | Client + readiness done; cache port/abstraction later |
| P5 | Email / HTTP / storage external ports | 17 | Done — wire email into auth when Phase 13 lands |
| P5 | Background jobs / queue | 18 | — |
| P5 | File uploads / object storage | 21 | Done — multipart uploads + object storage |
| P5 | Metrics, tracing, OpenTelemetry | 12 / 27 | Logging only today |
| P6 | Architecture enforcement (dependency-cruiser or similar) | 29 | Documented rules; not automated |
| P6 | Shared domain base entity / ID / date abstractions | 6 | Ad-hoc today |
| P6 | Branch/PR/release/changelog conventions | 24 | Hooks + Conventional Commits done |
| P6 | Production hardening checklist (Phase 30 remainder) | 30 | Docker image, full docs, security checklist |

## Suggested next sequence

1. Authentication (AUTH.md) → lock down APIs
2. Authorization / RBAC + error conventions
3. OpenAPI / Swagger
4. Coverage gates, real DB tests, E2E
5. Optional infra (Redis cache abstraction, jobs, OTel)
