# Architecture

This project follows Clean Architecture with feature-first organization.

## Dependency Rule

Dependencies must point toward the domain.

- Domain must not depend on infrastructure or frameworks.
- Application may depend on domain.
- Infrastructure implements contracts defined by inner layers.
- Presentation depends on application contracts.
- Composition happens at the application boundary.

## Dependency Direction

Interface → Application → Domain

Infrastructure → Application/Domain

## Module Structure

Each business module owns its own:

- domain
- application
- infrastructure
- presentation

## Shared Code

The `shared` directory contains only genuinely cross-cutting abstractions and utilities.

## Dependency Injection

- Dependencies are manually injected.
- No DI container framework is used.
- The composition root creates concrete implementations.
- Application and domain layers depend on abstractions.
- Infrastructure implements application/domain abstractions.
- `create-app.ts` is responsible for Express application assembly.
- `server.ts` owns runtime lifecycle.
- Global mutable service containers are prohibited.
- Infrastructure connections are initialized explicitly.
- Infrastructure resources are closed during graceful shutdown.
