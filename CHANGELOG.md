# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Frontend auth API guide ([`docs/AUTH_FRONTEND.md`](docs/AUTH_FRONTEND.md)) for implemented endpoints
- `GET /api/v1/auth/sessions/{sessionId}` — bearer-authenticated own-session lookup (`404 NOT_FOUND`)
- `DELETE /api/v1/auth/sessions/{sessionId}` — revoke own session; clears cookies when current session is revoked
- `POST /api/v1/auth/sessions/revoke-others` — revoke all active sessions except the current bearer session
- `POST /api/v1/auth/password/change` — bearer-authenticated password update; revokes other sessions and pending reset tokens
- `POST /api/v1/auth/password/reset/validate` — public soft check for reset-token validity (`valid` + optional `expiresAt`)
- `PATCH /api/v1/users/me/username` — bearer-authenticated create/replace username login identity (normalized uniqueness)
- `GET /api/v1/users/me` — bearer-authenticated own profile (`user` + `profile`; empty profile fields when unset)
- `PATCH /api/v1/users/me` — bearer-authenticated own profile update (`displayName`, `avatarUrl`, and `user_profiles` fields)
- `GET /api/v1/users/me/identities` — bearer-authenticated list of own login identities
- `POST /api/v1/users/me/emails` — add a secondary email (unverified + verification email; `409` if taken)
- `POST /api/v1/users/me/emails/verify` — verify an added email by token (public or matching bearer; no new session)
- `DELETE /api/v1/users/me/emails/{identityId}` — remove an email identity (`409 LAST_AUTH_METHOD` if last sign-in method)
- `POST /api/v1/users/me/deletion-request` — schedule account deletion after `AUTH_ACCOUNT_DELETION_GRACE_DAYS` (optional password + reason)

### Changed

- Mount `/api/v1/users` as a module root; nest `/me/*` under it (auth/identity owns the handlers for now)
- `users` now stores pending-deletion markers (`deletion_requested_at`, `deletion_scheduled_for`, `deletion_reason`)

### Removed

- Sample `users` CRUD module (replace with AUTH_API `/users/me` + admin user APIs as they land)

## [1.1.2] - 2026-10-28

### Added

- `POST /api/v1/auth/email/verification/resend` — anti-enumeration resend of email verification links
- `POST /api/v1/auth/phone/verify` — OTP verification with attempt limits, account activation, and session tokens
- `POST /api/v1/auth/phone/verification/resend` — anti-enumeration phone OTP rotation (SMS delivery pending)
- `POST /api/v1/auth/login` — password login with session tokens, refresh cookie, and account-state errors
- `POST /api/v1/auth/refresh` — refresh-token rotation with reuse detection, cookie/body input, and CSRF for cookie clients
- `POST /api/v1/auth/logout` — revoke current session via refresh and/or bearer, clear auth cookies (CSRF if cookie)
- Auth HTTP middleware: `requireRefreshAuth`, `requireRefreshOrBearerAuth`, and `requireBearerAuth` (for future protected routes)
- `GET /api/v1/auth/me` — bearer-authenticated current user with role keys (permissions empty until RBAC)
- `POST /api/v1/auth/password/forgot` — anti-enumeration password-reset email with hashed single-use token
- `POST /api/v1/auth/password/reset` — consume reset token, update password, revoke all sessions
- `POST /api/v1/auth/logout-all` — bearer-authenticated revoke of all user sessions (CSRF if refresh cookie present)
- `GET /api/v1/auth/sessions` — paginated session list with `includeRevoked` and `isCurrent` marker
- Access-token `verify` on the JWT signer for bearer-authenticated auth routes
- Session cookies (`refresh_token` + `csrf_token`) set on login, email/phone verify, and refresh

### Changed

- Auth HTTP typing: optional `Request.auth` via Express augmentation; bearer routes use `asHandler` / `asRequestHandler` with `getBearerAuth` (no request cast wrappers)
- Auth module split into `identity` / `credentials` / `verification` / `sessions` / `shared` (+ `authorization` scaffold); each area owns its repository port and Postgres implementation

## [1.1.1] - 2026-10-28

### Added

- `POST /api/v1/auth/email/verify` — consume verification token, activate account, issue access/refresh session
- Auth JWT signing (`jose` HS256) via `AUTH_JWT_*` env and `TOKEN_INVALID` / `TOKEN_EXPIRED` error codes
- `FRONTEND_BASE_URL` / `APP_NAME` env and shared `buildFrontendUrl` + `FrontendRoutes` for product links in emails

### Changed

- Email verification message uses a frontend `/verify-email?token=` link template (HTML + text) instead of an API POST URL

### Fixed

- CI workflow now relies on `package.json` for pnpm version selection to avoid pnpm/action-setup version conflicts.

## [1.1.0] - 2026-10-28

### Added

- Cursor agent rules under `.cursor/rules/` (architecture, TypeScript, testing, changelog)
- Redis client (`REDIS_URL`), readiness `PING` check, and graceful Redis shutdown
- Provider-agnostic email port (`IEmailSender`) with Resend and noop adapters
- Object storage port (`IObjectStorage`) with local and S3 adapters
- File uploads module (`POST`/`GET`/`DELETE` `/api/v1/uploads`) with multer and size/MIME validation (module defaults; not env-driven)
- Outbound HTTP client port (`IHttpClient`) with Axios adapter, timeouts, retries/backoff, and redacted request logging
- HTTP server `requestTimeout`, `headersTimeout`, and `keepAliveTimeout` configured from `HTTP_SERVER_*` env
- Shared `UnauthorizedError` (401), `ForbiddenError` (403), and `ConflictError` (409) AppError subclasses
- Auth persistence schemas: login identities, password/external credentials, sessions, challenges, MFA/passkeys, audit events
- Database schema reference doc ([`docs/DATABASE.md`](docs/DATABASE.md))
- Platform auth DDL: `user_profiles`, `auth_tokens`, `mfa_challenges`, `login_attempts`, `passkeys`, `security_audit_logs`, `roles` / `user_roles`
- Auth/authz HTTP API contract doc ([`docs/AUTH_API.md`](docs/AUTH_API.md)) covering 92 planned endpoints
- `POST /api/v1/auth/register` — email/phone registration with pending verification (no session)
- Auth email verification message builder (`buildEmailVerificationMessage`) and Argon2id password hasher under the auth module

### Changed

- Docker Compose service renamed to `api`; `pnpm docker:*` scripts updated accordingly
- `/ready` now requires both Postgres and Redis to be healthy
- Duplicate user email now returns `409 Conflict` instead of `400 Bad Request`
- **Breaking:** auth schema full-platform refactor (renames, identity `identifier`/`normalized_identifier`, soft-delete, MFA/audit expansions). Baseline migration replaced — run `pnpm db:reset && pnpm db:migrate` locally

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
