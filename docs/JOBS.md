# Background jobs

Redis-backed queues via [BullMQ](https://docs.bullmq.io/). Application code depends only on `IJobQueue` (`src/shared/jobs/`). BullMQ and ioredis stay in `src/infrastructure/jobs/`.

## Processes

| Process | Entry | Role |
| --- | --- | --- |
| API | `src/server.ts` | Enqueues jobs (producer) |
| Worker | `src/worker.ts` | Consumes jobs and registers repeatable schedulers |

Run both in development:

```bash
pnpm db:up          # Postgres + you already have Redis if using docker compose redis
pnpm dev            # API
pnpm worker         # Worker (separate terminal)
pnpm jobs:ui        # Bull Board on http://127.0.0.1:3010 (optional)
```

Compose starts both:

```bash
pnpm docker:up
```

Service name for the worker container is `worker`. API image is still `api`.

## Providers

| `JOBS_PROVIDER` | When |
| --- | --- |
| `bullmq` | Local, staging, production (default) |
| `noop` | Tests (`.env.test`) — enqueue is a no-op |

The worker process **requires** `bullmq`. It exits if `JOBS_PROVIDER=noop`.

## First job: account deletion

`POST /api/v1/users/me/deletion-request` writes deletion markers and enqueues a delayed `apply-account-deletion` job for `scheduledFor`.

The worker also registers a repeatable sweep (`apply-due-account-deletions`, cron `JOBS_ACCOUNT_DELETION_SWEEP_CRON`, default every 15 minutes) so due rows are still applied if the delayed job was missed.

Applying a due deletion:

- sets `users.deleted_at`
- revokes remaining sessions

Until the worker (or sweep) runs, the account stays usable. Cancel (next API) can still clear markers before that.

## Adding a job

1. Add a name to `JobName` and a payload in `JobPayloadMap` / `parseJobPayload`.
2. Implement a use case.
3. Register a handler in `src/app/jobs/create-job-handlers.ts`.
4. Enqueue from a use case via `IJobQueue` (injected at the composition root).
5. If it is a cron/sweep, `upsertRepeatable` in `create-worker-runtime.ts`.

## Operations

- Prefix keys with `JOBS_PREFIX` (default `neca`) so one Redis can host multiple apps.
- Failed jobs retry with exponential backoff (`JOBS_ATTEMPTS`, default 5).
- Workers reconnect indefinitely (`maxRetriesPerRequest: null`). API enqueue fails fast if Redis is down.
- Graceful shutdown waits for the active job (`src/worker.ts`), then closes the queue and Postgres.

Inspect queues with [Bull Board](https://github.com/felixmosh/bull-board) (`pnpm jobs:ui`, default http://127.0.0.1:3010). It is a separate localhost process — not mounted on the API. Requires `JOBS_PROVIDER=bullmq` and Redis. Bind stays `127.0.0.1` so the UI is not exposed on the network.
