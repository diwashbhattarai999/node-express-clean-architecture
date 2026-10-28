# Node.js + Express Clean Architecture

Production-oriented starter for Node.js APIs using Express, TypeScript, Drizzle/PostgreSQL, and Clean Architecture with feature-first modules.

## Stack

- **Runtime:** Node.js 22+, pnpm 11+
- **HTTP:** Express 5
- **Language:** TypeScript (ESM)
- **Database:** PostgreSQL 18 + Drizzle ORM
- **Validation:** Zod
- **Logging:** Pino
- **Quality:** Biome, Vitest, Lefthook, Commitlint
- **CI:** GitHub Actions

## Requirements

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 11+
- [Docker](https://www.docker.com/) (for local Postgres)

## Quick start

```bash
# Install dependencies (Lefthook hooks install via prepare)
pnpm install

# Environment
cp .env.example .env

# Start Postgres (host port 5433 → container 5432)
pnpm db:up

# Apply migrations
pnpm db:migrate

# Dev server (default http://localhost:3000)
pnpm dev
```

Verify:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Dev server with hot reload (`tsx watch`) |
| `pnpm build` | Compile to `dist/` |
| `pnpm start` | Run production build |
| `pnpm typecheck` | TypeScript check (no emit) |
| `pnpm lint` | Biome lint/format check |
| `pnpm format` | Biome format write |
| `pnpm test` | Vitest (unit + integration) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:coverage` | Vitest with coverage |
| `pnpm db:up` | Start Postgres only |
| `pnpm db:down` | Stop Compose services |
| `pnpm db:reset` | Wipe volumes and recreate Postgres |
| `pnpm db:logs` | Tail Postgres logs |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run migrations (host) |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm docker:build` | Build the API image |
| `pnpm docker:up` | Build and start API + Postgres + Redis |
| `pnpm docker:down` | Stop Compose stack |
| `pnpm docker:logs` | Tail API logs |
| `pnpm docker:reset` | Wipe volumes and rebuild the stack |

## Architecture

![Clean Architecture — Node.js + Express](docs/architecture.png)

Dependencies point inward toward the domain. Each feature module owns its own layers:

```text
src/
  app/              # Express assembly, middleware, composition root
  config/           # Typed env (Zod)
  infrastructure/   # Shared infra (e.g. database client)
  modules/
    health/
    users/          # domain → application → infrastructure → presentation
  shared/           # Cross-cutting errors, HTTP helpers, logger
  server.ts         # Process lifecycle (listen, graceful shutdown)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for dependency rules and composition conventions.

## HTTP API

- Versioned feature routes live under `/api/v1/...`
- `GET /health` — liveness
- `GET /ready` — readiness (Postgres + Redis; `503` if either is unhealthy)
- Responses use a consistent envelope (`success`, `message`, `data`)
- Validation failures return `422` with field-level errors
- Shared `AppError` conventions: `401` (`UnauthorizedError`), `403` (`ForbiddenError`), `409` (`ConflictError`); duplicate resources (e.g. email already exists) return `409`

The `users` module is a sample vertical slice to prove the architecture—not a fixed product API. Replace or extend modules as needed. Auth design: [docs/AUTH.md](docs/AUTH.md). HTTP contracts: [docs/AUTH_API.md](docs/AUTH_API.md). Tables: [docs/DATABASE.md](docs/DATABASE.md) (auth routes not implemented yet; sample CRUD still open).

## Environment

Copy `.env.example` to `.env`. Important variables:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `local` \| `development` \| `test` \| `staging` \| `production` |
| `HOST` / `PORT` | Listen address (default `0.0.0.0:3000`) |
| `BASE_URL` | Public API base URL |
| `FRONTEND_BASE_URL` | Public web app origin (emails, redirects) |
| `APP_NAME` | Display name in transactional emails (default `Your Brand`) |
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis connection string |
| `EMAIL_PROVIDER` | `resend` \| `noop` (default `noop`) |
| `EMAIL_FROM` | Default from address (required for `resend`) |
| `EMAIL_FROM_NAME` | Optional from display name |
| `RESEND_API_KEY` | Resend API key (required for `resend`) |
| `STORAGE_PROVIDER` | `local` \| `s3` (default `local`) |
| `STORAGE_LOCAL_PATH` | Local root directory (default `./uploads`) |
| `STORAGE_BUCKET` / keys / endpoint | Required for `s3` |
| `HTTP_CLIENT_TIMEOUT_MS` | Outbound HTTP timeout (default `10000`) |
| `HTTP_CLIENT_MAX_RETRIES` | Retries after the first attempt (default `2`) |
| `HTTP_CLIENT_RETRY_BASE_DELAY_MS` | Exponential backoff base delay (default `200`) |
| `HTTP_SERVER_REQUEST_TIMEOUT_MS` | Node `requestTimeout` (default `30000`) |
| `HTTP_SERVER_HEADERS_TIMEOUT_MS` | Node `headersTimeout`; must be greater than keep-alive (default `70000`) |
| `HTTP_SERVER_KEEP_ALIVE_TIMEOUT_MS` | Node `keepAliveTimeout` (default `65000`) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `LOG_LEVEL` | Pino level |
| `COOKIES_SECRET` | Cookie signing secret (min 32 chars) |
| `RATE_LIMIT_*` | Global rate limit window/max |
| `TRUST_PROXY` | Proxy trust setting |

Default local URLs (host → Compose ports):

```text
postgresql://postgres:postgres@localhost:5433/node_express_clean_architecture
redis://localhost:6379
```

Invalid config fails fast at startup.

## Email

Sending goes through `IEmailSender`. Switch providers with `EMAIL_PROVIDER` (`noop` for local/tests, `resend` for real delivery). Use cases depend only on the port — add another adapter under `src/infrastructure/email/` when needed.

## Outbound HTTP

Raw REST calls go through `IHttpClient` (Axios adapter in infrastructure). Timeouts, retries with exponential backoff + jitter, and redacted outbound logs are built in. Inject `httpClient` from the composition root into use cases that need third-party HTTP. Email (Resend) and object storage (AWS SDK) keep using their vendor SDKs — they do not go through `IHttpClient`.

Circuit breakers, payment, and push/SMS notification ports are out of starter scope for now.

## Object storage

File/object IO goes through `IObjectStorage` (`putObject`, `getObject`, `deleteObject`, `exists`, `getSignedUrl`, `getPublicUrl`).

| Provider | Notes |
| --- | --- |
| `local` | Writes under `STORAGE_LOCAL_PATH` (default `./uploads`) |
| `s3` | AWS S3 via `@aws-sdk/client-s3` (optional custom `STORAGE_ENDPOINT`) |

## File uploads

Sample `uploads` module on top of `IObjectStorage` (no auth yet):

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/api/v1/uploads` | Multipart field `file`; size + MIME checks; stores as `uploads/<uuid>-<name>` |
| `GET` | `/api/v1/uploads/:key` | Metadata (`exists`, public/signed URLs). Encode nested keys (`uploads%2F…`) |
| `DELETE` | `/api/v1/uploads/:key` | Deletes the object (404 if missing) |

Rejects oversized or disallowed MIME types with `422` (defaults in `uploads.constants.ts`; intended to become per-route later). Signed URL is returned when the storage adapter can produce one; otherwise `null` without failing the upload.

## Database

Postgres runs via Docker Compose (`docker-compose.yml`). Schema and migrations live under `drizzle/` and `src/infrastructure/database/drizzle/`.

Host workflow (app on the machine, DB in Docker):

```bash
pnpm db:up
# edit schema under src/infrastructure/database/drizzle/schema/
pnpm db:generate
pnpm db:migrate
```

## Docker

Production-style multi-stage image (`Dockerfile`): non-root user, builds TypeScript, installs production deps only, runs migrations on start via `docker/entrypoint.sh`.

```bash
cp .env.example .env   # if needed
pnpm docker:up
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

Compose overrides `DATABASE_URL` to `postgres:5432` on the internal network. Host tools still use `localhost:5433` from `.env.example`.

Set `RUN_MIGRATIONS=false` on the app service to skip automatic migrations.

## Testing

```bash
pnpm test
pnpm test:coverage
```

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/` (HTTP via Supertest; repository mocked where noted)
- Path alias: `@tests/*`

## Git hooks & commits

Lefthook runs on install (`prepare`):

- **pre-commit:** Biome on staged files + typecheck
- **commit-msg:** Conventional Commits via Commitlint

Example: `feat(users): add list users endpoint`

## Documentation

| Doc | Contents |
| --- | --- |
| [CHANGELOG.md](CHANGELOG.md) | Notable changes (Keep a Changelog) |
| [AGENTS.md](AGENTS.md) | Guide for AI coding agents |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Clean Architecture rules |
| [docs/DATABASE.md](docs/DATABASE.md) | Postgres / Drizzle schema reference |
| [docs/AUTH.md](docs/AUTH.md) | Auth module design |
| [docs/AUTH_API.md](docs/AUTH_API.md) | Auth/authz HTTP API contracts (92 endpoints) |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Master checklist |
| [docs/TODO.md](docs/TODO.md) | Prioritized remaining work |

## License

[MIT](LICENSE)
