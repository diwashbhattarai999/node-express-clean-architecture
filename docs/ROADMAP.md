# Roadmap

Status of the Node.js + Express Clean Architecture starter.

**Legend**

| Status | Meaning |
| --- | --- |
| Done | Complete for current scope |
| Partial | Core in place; gaps remain |
| Not started | Not begun |
| Optional | Only if the starter needs it |

Detailed remaining work lives in [TODO.md](TODO.md). Architecture rules: [ARCHITECTURE.md](ARCHITECTURE.md). Auth design: [AUTH.md](AUTH.md).

---

## Phases overview

| # | Phase | Status | Progress | Notes |
| --- | --- | --- | --- | --- |
| 1 | Project foundation | Done | 20/20 | pnpm, TypeScript, ESM, aliases, build |
| 2 | Repo hygiene & code quality | Done | 38/38 | Biome, Lefthook, Commitlint, `.gitignore` |
| 3 | Testing foundation | Partial | 18/20 | Vitest + unit/integration; no E2E / coverage thresholds |
| 4 | Application bootstrap | Partial | 17/19 | App factory, composition, lifecycle; HTTP timeouts pending |
| 5 | Configuration system | Partial | 22/24 | Zod env + Redis/email; auth config later |
| 6 | Core shared architecture | Partial | 13/23 | Errors, pagination, use-case patterns; base entity/events later |
| 7 | HTTP / presentation | Partial | 24/26 | Middleware, routes, validation; request context pending |
| 8 | Users vertical slice | Partial | 29/31 | Sample CRUD; repo tests / transactions pending |
| 9 | Database & persistence | Partial | 14/19 | Drizzle + Postgres + Compose; transactions, seeding, test DB |
| 10 | Validation | Done | 10/10 | Zod request/query/path + env |
| 11 | Error architecture | Partial | 14/17 | AppError + field errors; auth/conflict conventions pending |
| 12 | Logging & observability | Partial | 14/18 | Pino + request IDs; metrics/tracing later |
| 13 | Authentication | Partial | 2/14 | Password hash only; see AUTH.md |
| 14 | Authorization | Not started | 0/10 | RBAC / policies |
| 15 | Security | Partial | 8/17 | Helmet, CORS, rate limit; audit/checklist pending |
| 16 | Caching | Partial | 2/9 | Redis client + health; cache abstraction later |
| 17 | External services | Partial | 5/13 | Email + object storage; HTTP client later |
| 18 | Background jobs & messaging | Optional | 0/13 | Queues, workers, domain events |
| 19 | API documentation | Not started | 0/11 | OpenAPI / Swagger |
| 20 | Pagination / filter / sort | Partial | 9/10 | Offset pagination on list APIs; cursor optional |
| 21 | File uploads & storage | Done | — | Object storage + multipart uploads module |
| 22 | Docker | Done | — | Multi-stage API image, Compose API+Postgres+Redis, migrate on start |
| 23 | CI/CD | Partial | 8/16 | Lint, typecheck, test, build; no deploy / image scan |
| 24 | Git & release management | Partial | 6/14 | Conventional Commits + hooks; release automation later |
| 25 | Dependency management | Partial | 6/10 | Dependabot + pinned `packageManager` / engines |
| 26 | Performance & reliability | Partial | 3/12 | Rate limiting; timeouts, load tests later |
| 27 | Production operations | Partial | 8/14 | Health, ready (DB+Redis), shutdown, logging; metrics later |
| 28 | Documentation | Partial | 12/18 | README, architecture, CHANGELOG, AGENTS; ADRs / contrib later |
| 29 | Architecture enforcement | Not started | 0/9 | dependency-cruiser / architecture tests |
| 30 | Starter hardening | Partial | 14/26 | Core verify OK; Docker image + full checklist remaining |

---

## By status

### Done

| # | Phase |
| --- | --- |
| 1 | Project foundation |
| 2 | Repo hygiene & code quality |
| 10 | Validation |
| 21 | File uploads & storage |
| 22 | Docker |

### Partial (in progress)

| # | Phase | Main gaps |
| --- | --- | --- |
| 3 | Testing | Coverage thresholds, E2E |
| 4 | Bootstrap | HTTP timeouts, keep-alive |
| 5 | Config | Auth categories |
| 16 | Caching | Cache port, TTL, invalidation |
| 17 | External services | HTTP client, retries |
| 6 | Shared architecture | Base entity, events, ID/date helpers |
| 7 | HTTP | Request context |
| 8 | Users slice | Repository tests, transactions |
| 9 | Database | Transactions, seeding, real test DB |
| 11 | Errors | Unauthorized / Forbidden / Conflict conventions |
| 12 | Observability | Metrics, tracing, OpenTelemetry |
| 13 | Authentication | Sessions/tokens/middleware (AUTH.md) |
| 15 | Security | Audit process, production checklist |
| 20 | Pagination | Cursor pagination (optional) |
| 23 | CI/CD | Coverage gate, audit, Docker build in CI, deploy |
| 24 | Git & release | Branch/PR/release/changelog automation |
| 25 | Dependencies | Vulnerability scanning in CI |
| 26 | Performance | Timeouts, load testing |
| 27 | Operations | Metrics, alerting, rollback strategy |
| 28 | Docs | ADRs, contribution / security docs |
| 30 | Hardening | Full production checklist |

### Not started

| # | Phase |
| --- | --- |
| 14 | Authorization |
| 19 | API documentation |
| 29 | Architecture enforcement |

### Optional (later / if needed)

| # | Phase |
| --- | --- |
| 18 | Background jobs & messaging |

---

## Suggested order

| Order | Focus | Status |
| --- | --- | --- |
| 1 | Authentication (AUTH.md) + protect APIs | Partial |
| 2 | Authorization / RBAC | Not started |
| 3 | OpenAPI / Swagger | Not started |
| 4 | Coverage gates, real DB tests, E2E | Partial |
| 5 | Optional infra (Redis cache, jobs, OTel) | Optional |
