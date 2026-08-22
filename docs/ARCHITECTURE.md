# Architecture

This project follows Clean Architecture with feature-first organization.

## Dependency Rule

Dependencies must point toward the domain.

- Domain must not depend on infrastructure or frameworks.
- Application may depend on domain.
- Infrastructure implements contracts defined by inner layers.
- Presentation depends on application contracts.
- Composition happens at the application boundary.

## Module Structure

Each business module owns its own:

- domain
- application
- infrastructure
- presentation

## Shared Code

The `shared` directory contains only genuinely cross-cutting abstractions and utilities.