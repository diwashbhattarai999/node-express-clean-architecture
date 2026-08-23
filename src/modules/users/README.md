# Users Module

The Users module owns the user domain and its application capabilities.

## Layers

### Domain

Contains business rules and domain concepts.

- Entities
- Value objects
- Domain errors
- Repository contracts
- Factories

### Application

Contains application-specific business workflows.

- Use cases
- DTOs

### Infrastructure

Contains technical implementations.

- Database repositories
- External service integrations

### Presentation

Contains HTTP-facing adapters.

- Controllers
- Request schemas
- Response mappers
- Routes

## Dependency Rules

- Domain must not depend on infrastructure or presentation.
- Application may depend on domain.
- Infrastructure may implement domain/application contracts.
- Presentation may depend on application.
- Controllers must not contain business logic.
- Use cases must not depend on Express.
