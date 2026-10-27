# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Cursor agent rules under `.cursor/rules/` (architecture, TypeScript, testing, changelog)
- Redis client (`REDIS_URL`), readiness `PING` check, and graceful Redis shutdown
- Provider-agnostic email port (`IEmailSender`) with Resend and noop adapters
- Object storage port (`IObjectStorage`) with local and S3 adapters

### Changed

- Docker Compose service renamed to `api`; `pnpm docker:*` scripts updated accordingly
- `/ready` now requires both Postgres and Redis to be healthy

## [1.0.0] - 2026-08-29

### Added

- Node.js + Express Clean Architecture starter (pnpm, TypeScript ESM, path aliases)
- Feature-first `users` sample module (CRUD) with domain / application / infrastructure / presentation layers
- Health and readiness endpoints (`/health`, `/ready`) with database readiness check
- Drizzle ORM + PostgreSQL migrations, Compose Postgres service
- Zod request/env validation, AppError + field-level `422` validation errors
- Pino logging, Helmet, CORS, rate limiting, compression, request IDs
- Vitest unit and users HTTP integration tests
- Biome, Lefthook, Commitlint (Conventional Commits)
- Multi-stage production Dockerfile, Compose API + Postgres + Redis, migrate-on-start entrypoint
- GitHub Actions CI (lint, typecheck, test, build) and Dependabot
- Project docs: README, ARCHITECTURE, ROADMAP, TODO, AUTH design
