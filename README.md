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
| `pnpm db:up` | Start Postgres via Docker Compose |
| `pnpm db:down` | Stop Compose services |
| `pnpm db:reset` | Wipe volumes and recreate Postgres |
| `pnpm db:logs` | Tail Postgres logs |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Drizzle Studio |

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
- `GET /ready` — readiness (includes DB check; `503` if unhealthy)
- Responses use a consistent envelope (`success`, `message`, `data`)
- Validation failures return `422` with field-level errors

The `users` module is a sample vertical slice to prove the architecture—not a fixed product API. Replace or extend modules as needed. Auth design: [docs/AUTH.md](docs/AUTH.md).

## Environment

Copy `.env.example` to `.env`. Important variables:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `local` \| `development` \| `test` \| `staging` \| `production` |
| `HOST` / `PORT` | Listen address (default `0.0.0.0:3000`) |
| `BASE_URL` | Public API base URL |
| `DATABASE_URL` | Postgres connection string |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `LOG_LEVEL` | Pino level |
| `COOKIES_SECRET` | Cookie signing secret (min 32 chars) |
| `RATE_LIMIT_*` | Global rate limit window/max |
| `TRUST_PROXY` | Proxy trust setting |

Default local DB URL (matches Compose):

```text
postgresql://postgres:postgres@localhost:5433/node_express_clean_architecture
```

Invalid config fails fast at startup.

## Database

Postgres runs via Docker Compose (`docker-compose.yml`). Schema and migrations live under `drizzle/` and `src/infrastructure/database/drizzle/`.

Typical workflow:

```bash
pnpm db:up
# edit schema under src/infrastructure/database/drizzle/schema/
pnpm db:generate
pnpm db:migrate
```

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
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Clean Architecture rules |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Master checklist |
| [docs/TODO.md](docs/TODO.md) | Prioritized remaining work |
| [docs/AUTH.md](docs/AUTH.md) | Auth module design |

## License

[MIT](LICENSE)
