# Master Roadmap — Node.js + Express Production Starter

Yes. Before continuing, let's establish the **master checklist**. This will be our source of truth for the project.

I would structure the work into phases so we can move slowly, one concern at a time, while still knowing exactly where we're going.

---

# Phase 1 — Project Foundation

- [x] Initialize pnpm project
- [x] Configure package metadata
- [x] Configure Node.js version
- [x] Configure TypeScript 7
- [x] Configure ESM
- [x] Configure TypeScript `bundler` module resolution
- [x] Configure `@/*` path alias
- [x] Configure `tsc-alias`
- [x] Configure `src` as root directory
- [x] Configure `dist` as build directory
- [x] Configure strict TypeScript
- [x] Configure TypeScript safety rules
- [x] Configure declaration generation
- [x] Configure source maps
- [x] Create `src/app.ts`
- [x] Create `src/server.ts`
- [x] Verify development server
- [x] Verify production build
- [x] Verify production startup
- [x] Verify `/health`

---



# Phase 2 — Repository Hygiene & Code Quality



### Git

- [x] Create `.gitignore`
- [x] Configure dependency exclusions
- [x] Configure build exclusions
- [x] Configure environment exclusions
- [x] Configure test artifact exclusions
- [x] Configure IDE exclusions
- [x] Configure OS exclusions
- [ ] Review `.gitignore` after Docker/database setup



### Editor

- [x] Create `.editorconfig`
- [x] Configure UTF-8
- [x] Configure LF
- [x] Configure indentation
- [x] Configure final newline
- [x] Configure whitespace handling



### Biome

- [ ] Finalize Biome 2.5.9 configuration
- [ ] Configure formatter
- [ ] Configure linter
- [ ] Configure recommended rules/presets
- [ ] Configure import organization
- [ ] Configure ignored/generated files
- [ ] Configure TypeScript formatting
- [ ] Configure JSON formatting
- [ ] Configure project-wide formatting
- [ ] Configure project-wide linting
- [ ] Verify `biome lint`
- [ ] Verify `biome format`
- [ ] Verify `biome check`



### Git hooks

- [ ] Install Lefthook
- [ ] Configure `pre-commit`
- [ ] Configure staged-file checking
- [ ] Configure formatting checks
- [ ] Configure lint checks
- [ ] Configure type checking
- [ ] Configure commit message hook
- [ ] Configure commitlint
- [ ] Configure Conventional Commits
- [ ] Test invalid commit messages
- [ ] Test valid commit messages

---



# Phase 3 — Testing Foundation

- [ ] Install Vitest
- [ ] Configure Vitest
- [ ] Configure TypeScript integration
- [ ] Configure test environment
- [ ] Configure test file conventions
- [ ] Configure test discovery
- [ ] Configure coverage
- [ ] Configure coverage thresholds
- [ ] Configure coverage exclusions
- [ ] Create unit test structure
- [ ] Create integration test structure
- [ ] Create E2E test structure
- [ ] Create first test
- [ ] Create test scripts
- [ ] Verify watch mode
- [ ] Verify CI test mode
- [ ] Verify coverage
- [ ] Decide mocking strategy
- [ ] Decide fixture strategy
- [ ] Decide test-data builder/factory strategy

---



# Phase 4 — Application Bootstrap

- [ ] Design application bootstrap
- [ ] Separate `app.ts` from `server.ts`
- [ ] Create application factory
- [ ] Create composition root
- [ ] Establish dependency wiring
- [ ] Establish configuration loading
- [ ] Establish startup lifecycle
- [ ] Establish shutdown lifecycle
- [ ] Handle `SIGTERM`
- [ ] Handle `SIGINT`
- [ ] Handle uncaught exceptions
- [ ] Handle unhandled promise rejections
- [ ] Implement graceful shutdown
- [ ] Configure HTTP server timeouts
- [ ] Configure keep-alive behavior
- [ ] Configure request handling
- [ ] Add health endpoint
- [ ] Add readiness endpoint
- [ ] Establish startup failure behavior

---



# Phase 5 — Configuration System

- [ ] Design configuration architecture
- [ ] Create typed environment configuration
- [ ] Validate environment variables
- [ ] Fail fast on invalid configuration
- [ ] Separate configuration from application code
- [ ] Define environment naming conventions
- [ ] Create `.env.example`
- [ ] Define development configuration
- [ ] Define test configuration
- [ ] Define production configuration
- [ ] Prevent secrets from being logged
- [ ] Prevent direct `process.env` usage throughout application
- [ ] Establish configuration injection

Potential configuration categories:

- [ ] Application
- [ ] HTTP
- [ ] Database
- [ ] Authentication
- [ ] JWT/token
- [ ] Redis/cache
- [ ] Email
- [ ] Logging
- [ ] CORS
- [ ] Rate limiting
- [ ] External services

---



# Phase 6 — Core Shared Architecture

Before implementing real features, establish reusable primitives.

### Domain

- [ ] Base entity strategy
- [ ] Entity identity strategy
- [ ] Entity equality strategy
- [ ] Value object strategy
- [ ] Domain error strategy
- [ ] Domain event strategy
- [ ] Domain service strategy
- [ ] Domain repository contract strategy



### Application

- [ ] Use-case conventions
- [ ] Input DTO conventions
- [ ] Output DTO conventions
- [ ] Application error strategy
- [ ] Port/interface conventions
- [ ] Result/error strategy
- [ ] Transaction boundary strategy



### Shared

- [ ] Shared error primitives
- [ ] Shared types
- [ ] Shared constants
- [ ] Shared utilities
- [ ] ID generation strategy
- [ ] Date/time abstraction
- [ ] Pagination primitives
- [ ] Common response types where appropriate

We will be careful here not to create a giant `shared/` dumping ground.

---



# Phase 7 — HTTP / Presentation Architecture

- [ ] Express application configuration
- [ ] Middleware architecture
- [ ] Route architecture
- [ ] Controller architecture
- [ ] Request DTO architecture
- [ ] Response DTO architecture
- [ ] Serializer architecture
- [ ] HTTP validation architecture
- [ ] Error middleware
- [ ] 404 handling
- [ ] Request ID
- [ ] Request context
- [ ] Content-type handling
- [ ] JSON handling
- [ ] CORS
- [ ] Security headers
- [ ] Compression strategy
- [ ] Request size limits
- [ ] HTTP timeout configuration
- [ ] Pagination conventions
- [ ] Filtering conventions
- [ ] Sorting conventions
- [ ] API versioning strategy
- [ ] HTTP status code conventions
- [ ] API response conventions
- [ ] API error response conventions

---



# Phase 8 — First Complete Vertical Slice: Users

This will be our architecture proving ground.

### User Domain

- [ ] User entity
- [ ] User identity
- [ ] User invariants
- [ ] Email value object
- [ ] User domain errors
- [ ] User repository contract
- [ ] User factory if justified



### Create User

- [ ] Create-user input DTO
- [ ] Create-user output DTO
- [ ] Create-user use case
- [ ] User creation rules
- [ ] Duplicate-user behavior
- [ ] Password handling boundary
- [ ] Repository interaction
- [ ] Transaction boundary if necessary



### Infrastructure

- [ ] User repository implementation
- [ ] Database mapping
- [ ] Persistence model
- [ ] Domain ↔ persistence mapping



### Presentation

- [ ] Create-user controller
- [ ] Create-user request validation
- [ ] Create-user route
- [ ] Response serializer
- [ ] HTTP error mapping



### Tests

- [ ] Entity tests
- [ ] Value-object tests
- [ ] Use-case tests
- [ ] Repository tests
- [ ] Controller tests
- [ ] HTTP integration test
- [ ] Full vertical-slice test

This feature will determine whether our architecture is actually good.

---



# Phase 9 — Database & Persistence

- [ ] Select database library/ORM
- [ ] Evaluate Prisma vs Drizzle
- [ ] Establish database architecture
- [ ] Configure PostgreSQL
- [ ] Configure database connection
- [ ] Configure connection pooling
- [ ] Configure migrations
- [ ] Configure schema management
- [ ] Define persistence models
- [ ] Define repository implementations
- [ ] Define domain-to-database mapping
- [ ] Define database-to-domain mapping
- [ ] Define transaction abstraction
- [ ] Implement transaction handling
- [ ] Handle connection failures
- [ ] Handle database shutdown
- [ ] Configure test database strategy
- [ ] Configure database seeding
- [ ] Configure migration workflow

---



# Phase 10 — Validation

- [ ] Select validation library
- [ ] Configure Zod
- [ ] Define request validation
- [ ] Define query validation
- [ ] Define path-parameter validation
- [ ] Define environment validation
- [ ] Define validation error format
- [ ] Keep domain validation separate from HTTP validation
- [ ] Avoid duplicating validation unnecessarily
- [ ] Establish DTO/schema relationship

Important distinction:

```text
HTTP validation
      ≠
Domain invariants
```

Both are necessary, but they solve different problems.

---



# Phase 11 — Error Architecture

- [ ] Domain errors
- [ ] Application errors
- [ ] Infrastructure errors
- [ ] Validation errors
- [ ] Not-found errors
- [ ] Conflict errors
- [ ] Unauthorized errors
- [ ] Forbidden errors
- [ ] Internal errors
- [ ] Error codes
- [ ] Error metadata
- [ ] Error serialization
- [ ] HTTP status mapping
- [ ] Production error sanitization
- [ ] Development error details
- [ ] Error logging strategy
- [ ] Error correlation/request IDs

---



# Phase 12 — Logging & Observability

- [ ] Select Pino
- [ ] Configure structured logging
- [ ] Configure log levels
- [ ] Configure development logging
- [ ] Configure production logging
- [ ] Request logging
- [ ] Request IDs
- [ ] Correlation IDs
- [ ] Error logging
- [ ] Sensitive-data redaction
- [ ] Database logging strategy
- [ ] External-service logging strategy
- [ ] Startup/shutdown logging
- [ ] Health/readiness logging policy

Then later:

- [ ] Metrics
- [ ] Tracing
- [ ] OpenTelemetry evaluation
- [ ] Application performance monitoring

---



# Phase 13 — Authentication

- [ ] Authentication architecture
- [ ] Password hashing
- [ ] Password verification
- [ ] Credential policy
- [ ] Token strategy
- [ ] Access tokens
- [ ] Refresh tokens
- [ ] Token rotation
- [ ] Token revocation
- [ ] Session strategy
- [ ] Authentication middleware
- [ ] Current-user context
- [ ] Authentication errors
- [ ] Brute-force protection

We will **not automatically assume JWT is the correct solution**. We'll decide based on the application's requirements.

---



# Phase 14 — Authorization

- [ ] Authorization architecture
- [ ] Role-based access control
- [ ] Permission model
- [ ] Resource-level authorization
- [ ] Policy architecture
- [ ] Authorization middleware
- [ ] Authorization use-case rules
- [ ] Forbidden response conventions

Potentially:

- [ ] RBAC
- [ ] ABAC/policy-based authorization

depending on the requirements.

---



# Phase 15 — Security

- [ ] Helmet/security headers
- [ ] CORS policy
- [ ] Rate limiting
- [ ] Request size limits
- [ ] Input validation
- [ ] Output sanitization where necessary
- [ ] Password security
- [ ] Secret management
- [ ] Secure cookies if applicable
- [ ] CSRF strategy if applicable
- [ ] SSRF considerations for external URLs
- [ ] SQL injection protection
- [ ] Prototype pollution considerations
- [ ] Dependency vulnerability scanning
- [ ] Security audit process
- [ ] Sensitive-data logging prevention
- [ ] Production security checklist

---



# Phase 16 — Caching

Only if required:

- [ ] Cache abstraction
- [ ] Redis evaluation
- [ ] Redis integration
- [ ] Cache repository/port
- [ ] Cache invalidation strategy
- [ ] TTL conventions
- [ ] Cache key conventions
- [ ] Distributed locking if required
- [ ] Failure behavior when cache is unavailable

---



# Phase 17 — External Services

Create a consistent architecture for external integrations.

- [ ] External API client abstraction
- [ ] HTTP client strategy
- [ ] Timeout strategy
- [ ] Retry strategy
- [ ] Exponential backoff
- [ ] Circuit-breaker evaluation
- [ ] External error mapping
- [ ] External request logging
- [ ] Sensitive data handling
- [ ] Email abstraction
- [ ] Storage abstraction
- [ ] Payment abstraction if needed
- [ ] Notification abstraction if needed

---



# Phase 18 — Background Jobs & Messaging

If the starter is intended to support these:

- [ ] Job abstraction
- [ ] Queue abstraction
- [ ] Queue implementation
- [ ] Worker architecture
- [ ] Job retry strategy
- [ ] Dead-letter strategy
- [ ] Idempotency
- [ ] Job observability
- [ ] Graceful worker shutdown
- [ ] Scheduled jobs
- [ ] Event publishing
- [ ] Domain events
- [ ] Integration events

---



# Phase 19 — API Documentation

- [ ] OpenAPI specification
- [ ] API metadata
- [ ] Schema definitions
- [ ] Request schemas
- [ ] Response schemas
- [ ] Error schemas
- [ ] Authentication documentation
- [ ] Endpoint documentation
- [ ] Swagger UI or equivalent
- [ ] API documentation generation strategy
- [ ] Keep documentation synchronized with implementation

---



# Phase 20 — Database/API Pagination

- [ ] Pagination abstraction
- [ ] Offset pagination evaluation
- [ ] Cursor pagination evaluation
- [ ] Pagination DTO
- [ ] Pagination response format
- [ ] Sorting
- [ ] Filtering
- [ ] Search
- [ ] Query parameter conventions
- [ ] Database-efficient pagination

---



# Phase 21 — File Uploads & Storage

If included in the starter:

- [ ] Upload abstraction
- [ ] Multipart handling
- [ ] File validation
- [ ] File-size limits
- [ ] MIME validation
- [ ] Object storage abstraction
- [ ] S3-compatible storage
- [ ] Presigned URLs
- [ ] File deletion
- [ ] Storage error handling

---



# Phase 22 — Docker

- [ ] Production Dockerfile
- [ ] Development Dockerfile
- [ ] Multi-stage builds
- [ ] Non-root container user
- [ ] Minimal production image
- [ ] `.dockerignore`
- [ ] Docker Compose
- [ ] PostgreSQL container
- [ ] Redis container if needed
- [ ] Health checks
- [ ] Container shutdown
- [ ] Environment configuration
- [ ] Container security

---



# Phase 23 — CI/CD

- [ ] Select CI platform
- [ ] Install dependencies
- [ ] Dependency caching
- [ ] Biome validation
- [ ] TypeScript validation
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Coverage
- [ ] Build verification
- [ ] Dependency audit
- [ ] Docker build
- [ ] Docker image scanning
- [ ] Deployment workflow
- [ ] Environment-specific deployment
- [ ] Production deployment strategy

---



# Phase 24 — Git & Release Management

- [ ] Conventional Commits
- [ ] Commitlint
- [ ] Lefthook
- [ ] Pre-commit checks
- [ ] Commit-msg checks
- [ ] Branch naming convention
- [ ] Pull request conventions
- [ ] PR checks
- [ ] Release strategy
- [ ] Versioning strategy
- [ ] Changelog strategy
- [ ] Automated release evaluation

Potentially:

- [ ] Changesets
- [ ] semantic-release

We will choose one if we actually need automated package/release management.

---



# Phase 25 — Dependency Management

- [ ] Dependency update strategy
- [ ] Lockfile policy
- [ ] Production dependency audit
- [ ] Dev dependency audit
- [ ] Automated dependency updates
- [ ] Renovate/Dependabot evaluation
- [ ] Vulnerability scanning
- [ ] License checking
- [ ] Node.js version policy
- [ ] pnpm version policy

---



# Phase 26 — Performance & Reliability

- [ ] HTTP performance baseline
- [ ] Database query performance
- [ ] Connection pool tuning
- [ ] Cache performance
- [ ] Memory considerations
- [ ] Event-loop considerations
- [ ] Request timeout policy
- [ ] Retry policy
- [ ] Graceful degradation
- [ ] Backpressure considerations
- [ ] Rate limiting
- [ ] Load testing strategy

---



# Phase 27 — Production Operations

- [ ] Health endpoint
- [ ] Readiness endpoint
- [ ] Liveness strategy
- [ ] Graceful shutdown
- [ ] Startup validation
- [ ] Environment validation
- [ ] Logging
- [ ] Metrics
- [ ] Tracing
- [ ] Alerting considerations
- [ ] Error monitoring
- [ ] Database monitoring
- [ ] Resource limits
- [ ] Deployment rollback strategy

---



# Phase 28 — Documentation

- [ ] README
- [ ] Project overview
- [ ] Architecture overview
- [ ] Architecture decision records
- [ ] Directory structure documentation
- [ ] Dependency rules
- [ ] Development setup
- [ ] Environment setup
- [ ] Database setup
- [ ] Testing documentation
- [ ] API documentation
- [ ] Docker documentation
- [ ] CI/CD documentation
- [ ] Deployment documentation
- [ ] Troubleshooting
- [ ] Contribution guide
- [ ] Commit convention documentation
- [ ] Security documentation

---



# Phase 29 — Architecture Enforcement

This is particularly important for a **Clean Architecture starter**.

We don't just document the architecture—we should eventually enforce it.

- [ ] Define forbidden dependency directions
- [ ] Define allowed module dependencies
- [ ] Detect presentation → infrastructure violations
- [ ] Detect domain → infrastructure violations
- [ ] Detect domain → framework violations
- [ ] Detect cross-module violations
- [ ] Evaluate dependency-cruiser / similar tooling
- [ ] Add architecture tests
- [ ] Add CI architecture validation

For example, we should eventually be able to automatically reject:

```text
domain → Express
domain → Prisma
domain → Redis
domain → Pino
```

---



# Phase 30 — Final Starter Template Hardening

Before declaring the starter production-ready:

- [ ] Fresh clone works
- [ ] Fresh `pnpm install` works
- [ ] Development server works
- [ ] Production build works
- [ ] Production server works
- [ ] Typecheck passes
- [ ] Biome passes
- [ ] Tests pass
- [ ] Coverage works
- [ ] Git hooks work
- [ ] Commitlint works
- [ ] Docker build works
- [ ] Docker runtime works
- [ ] Environment validation works
- [ ] Health check works
- [ ] Graceful shutdown works
- [ ] Security baseline passes
- [ ] CI passes from a clean environment
- [ ] Documentation is complete
- [ ] No unnecessary dependencies
- [ ] No dead configuration
- [ ] No placeholder secrets
- [ ] No architecture violations
- [ ] No generated artifacts committed
- [ ] Dependency licenses reviewed
- [ ] Production deployment tested

---



# The development order

Although the checklist is large, **we are not going to implement it in this order mechanically**.

Our actual progression will be:

```text
Foundation
   ↓
Tooling
   ↓
Testing
   ↓
Bootstrap
   ↓
Configuration
   ↓
Core architecture
   ↓
First vertical slice
   ↓
Database
   ↓
HTTP architecture
   ↓
Errors
   ↓
Logging
   ↓
Security
   ↓
Authentication
   ↓
Authorization
   ↓
Infrastructure
   ↓
Production hardening
```

And every meaningful step gets its own commit.

Our current position is:

```text
Phase 1 — Foundation        █████████░
Phase 2 — Quality tooling   ██░░░░░░░░
```

Specifically:

```text
[x] .gitignore
[x] .editorconfig
[ ] Biome  ← WE ARE HERE
[ ] Vitest
[ ] Lefthook
[ ] Commitlint
```

We will **not skip ahead** just because we know what's coming.

### Current next action

Finish **Step 3 — Biome** by fixing the configuration against your installed Biome `2.5.9`, getting:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
```

all green.

Then we'll commit:

```text
chore: configure biome
```

After that, **Step 4 will be Vitest configuration**.