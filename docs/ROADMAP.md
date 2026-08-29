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
| 5 | Configuration system | Partial | 19/24 | Zod env; auth/redis/email config later |
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
| 16 | Caching | Optional | 0/9 | Redis if required |
| 17 | External services | Optional | 1/13 | HTTP client / email / storage abstractions |
| 18 | Background jobs & messaging | Optional | 0/13 | Queues, workers, domain events |
| 19 | API documentation | Not started | 0/11 | OpenAPI / Swagger |
| 20 | Pagination / filter / sort | Partial | 9/10 | Offset pagination on list APIs; cursor optional |
| 21 | File uploads & storage | Optional | 0/10 | Multipart + object storage |
| 22 | Docker | Partial | 4/13 | Postgres Compose only; app Dockerfile pending |
| 23 | CI/CD | Partial | 8/16 | Lint, typecheck, test, build; no deploy / image scan |
| 24 | Git & release management | Partial | 6/14 | Conventional Commits + hooks; release automation later |
| 25 | Dependency management | Partial | 4/10 | Dependabot; pin engines/`packageManager` |
| 26 | Performance & reliability | Partial | 3/12 | Rate limiting; timeouts, load tests later |
| 27 | Production operations | Partial | 7/14 | Health, ready, shutdown, logging; metrics later |
| 28 | Documentation | Partial | 10/18 | README + architecture; ADRs / contrib guide later |
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

### Partial (in progress)

| # | Phase | Main gaps |
| --- | --- | --- |
| 3 | Testing | Coverage thresholds, E2E |
| 4 | Bootstrap | HTTP timeouts, keep-alive |
| 5 | Config | Auth / Redis / email categories |
| 6 | Shared architecture | Base entity, events, ID/date helpers |
| 7 | HTTP | Request context |
| 8 | Users slice | Repository tests, transactions |
| 9 | Database | Transactions, seeding, real test DB; fix drizzle schema path |
| 11 | Errors | Unauthorized / Forbidden / Conflict conventions |
| 12 | Observability | Metrics, tracing, OpenTelemetry |
| 13 | Authentication | Sessions/tokens/middleware (AUTH.md) |
| 15 | Security | Audit process, production checklist |
| 20 | Pagination | Cursor pagination (optional) |
| 22 | Docker | App Dockerfile, multi-stage, `.dockerignore` |
| 23 | CI/CD | Coverage gate, audit, Docker build, deploy |
| 24 | Git & release | Branch/PR/release/changelog automation |
| 25 | Dependencies | Engines pin, vulnerability scanning in CI |
| 26 | Performance | Timeouts, load testing |
| 27 | Operations | Metrics, alerting, rollback strategy |
| 28 | Docs | ADRs, contribution / security docs |
| 30 | Hardening | Docker runtime, full production checklist |

### Not started

| # | Phase |
| --- | --- |
| 14 | Authorization |
| 19 | API documentation |
| 29 | Architecture enforcement |

### Optional (later / if needed)

| # | Phase |
| --- | --- |
| 16 | Caching (Redis) |
| 17 | External services |
| 18 | Background jobs & messaging |
| 21 | File uploads & storage |

---

## Suggested order

| Order | Focus | Status |
| --- | --- | --- |
| 1 | Fix drizzle config + pin Node/pnpm engines | Not started |
| 2 | App Docker image | Not started |
| 3 | Authentication (AUTH.md) + protect APIs | Partial |
| 4 | Authorization / RBAC | Not started |
| 5 | OpenAPI / Swagger | Not started |
| 6 | Coverage gates, real DB tests, E2E | Partial |
| 7 | Optional infra (Redis, email, jobs, uploads, OTel) | Optional |
