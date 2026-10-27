# Agent guide

Instructions for AI coding agents working in this repository.

## Read first

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — dependency rules
- [CHANGELOG.md](CHANGELOG.md) — keep `[Unreleased]` updated
- [docs/TODO.md](docs/TODO.md) / [docs/ROADMAP.md](docs/ROADMAP.md) — remaining work
- [docs/AUTH.md](docs/AUTH.md) — auth design (not fully implemented)

## Cursor rules

Project rules live in [`.cursor/rules/`](.cursor/rules/). They cover architecture, TypeScript/Express, testing, and mandatory changelog updates.

## Non-negotiables

1. Respect Clean Architecture boundaries (domain has no framework/infra imports).
2. Wire new modules through the composition root; no global service containers.
3. Update `CHANGELOG.md` under `[Unreleased]` after features, enhancements, and bug fixes.
4. Match existing Biome/TypeScript style; run `pnpm lint` and `pnpm typecheck` when practical.
5. Compose service name for the API image is `api` (`pnpm docker:build` → `docker compose build api`).
