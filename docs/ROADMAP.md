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
- [x] Review `.gitignore` after Docker/database setup



### Editor

- [x] Create `.editorconfig`
- [x] Configure UTF-8
- [x] Configure LF
- [x] Configure indentation
- [x] Configure final newline
- [x] Configure whitespace handling



### Biome

- [x] Finalize Biome 2.5.9 configuration
- [x] Configure formatter
- [x] Configure linter
- [x] Configure recommended rules/presets
- [x] Configure import organization
- [x] Configure ignored/generated files
- [x] Configure TypeScript formatting
- [x] Configure JSON formatting
- [x] Configure project-wide formatting
- [x] Configure project-wide linting
- [x] Verify `biome lint`
- [x] Verify `biome format`
- [x] Verify `biome check`



### Git hooks

- [x] Install Lefthook
- [x] Configure `pre-commit`
- [x] Configure staged-file checking
- [x] Configure formatting checks
- [x] Configure lint checks
- [x] Configure type checking
- [x] Configure commit message hook
- [x] Configure commitlint
- [x] Configure Conventional Commits
- [x] Test invalid commit messages
- [x] Test valid commit messages

---



# Phase 3 — Testing Foundation

- [x] Install Vitest
- [x] Configure Vitest
- [x] Configure TypeScript integration
- [x] Configure test environment
- [x] Configure test file conventions
- [x] Configure test discovery
- [x] Configure coverage
- [ ] Configure coverage thresholds
- [x] Configure coverage exclusions
- [x] Create unit test structure
- [x] Create integration test structure
- [ ] Create E2E test structure
- [x] Create first test
- [x] Create test scripts
- [x] Verify watch mode
- [x] Verify CI test mode
- [x] Verify coverage
- [x] Decide mocking strategy
- [x] Decide fixture strategy
- [x] Decide test-data builder/factory strategy

---



# Phase 4 — Application Bootstrap

- [x] Design application bootstrap
- [x] Separate `app.ts` from `server.ts`
- [x] Create application factory
- [x] Create composition root
- [x] Establish dependency wiring
- [x] Establish configuration loading
- [x] Establish startup lifecycle
- [x] Establish shutdown lifecycle
- [x] Handle `SIGTERM`
- [x] Handle `SIGINT`
- [x] Handle uncaught exceptions
- [x] Handle unhandled promise rejections
- [x] Implement graceful shutdown
- [ ] Configure HTTP server timeouts
- [ ] Configure keep-alive behavior
- [x] Configure request handling
- [x] Add health endpoint
- [x] Add readiness endpoint
- [x] Establish startup failure behavior

---



# Phase 5 — Configuration System

- [x] Design configuration architecture
- [x] Create typed environment configuration
- [x] Validate environment variables
- [x] Fail fast on invalid configuration
- [x] Separate configuration from application code
- [x] Define environment naming conventions
- [x] Create `.env.example`
- [x] Define development configuration
- [x] Define test configuration
- [x] Define production configuration
- [x] Prevent secrets from being logged
- [x] Prevent direct `process.env` usage throughout application
- [x] Establish configuration injection

Potential configuration categories:

- [x] Application
- [x] HTTP
- [x] Database
- [ ] Authentication
- [ ] JWT/token
- [ ] Redis/cache
- [ ] Email
- [x] Logging
- [x] CORS
- [x] Rate limiting
- [ ] External services

---



# Phase 6 — Core Shared Architecture

Before implementing real features, establish reusable primitives.

### Domain

- [ ] Base entity strategy
- [ ] Entity identity strategy
- [ ] Entity equality strategy
- [x] Value object strategy
- [x] Domain error strategy
- [ ] Domain event strategy
- [ ] Domain service strategy
- [x] Domain repository contract strategy



### Application

- [x] Use-case conventions
- [x] Input DTO conventions
- [x] Output DTO conventions
- [x] Application error strategy
- [x] Port/interface conventions
- [ ] Result/error strategy
- [ ] Transaction boundary strategy



### Shared

- [x] Shared error primitives
- [x] Shared types
- [x] Shared constants
- [ ] Shared utilities
- [ ] ID generation strategy
- [ ] Date/time abstraction
- [x] Pagination primitives
- [x] Common response types where appropriate

We will be careful here not to create a giant `shared/` dumping ground.

---



# Phase 7 — HTTP / Presentation Architecture

- [x] Express application configuration
- [x] Middleware architecture
- [x] Route architecture
- [x] Controller architecture
- [x] Request DTO architecture
- [x] Response DTO architecture
- [x] Serializer architecture
- [x] HTTP validation architecture
- [x] Error middleware
- [x] 404 handling
- [x] Request ID
- [ ] Request context
- [x] Content-type handling
- [x] JSON handling
- [x] CORS
- [x] Security headers
- [x] Compression strategy
- [x] Request size limits
- [ ] HTTP timeout configuration
- [x] Pagination conventions
- [x] Filtering conventions
- [x] Sorting conventions
- [x] API versioning strategy
- [x] HTTP status code conventions
- [x] API response conventions
- [x] API error response conventions

---



# Phase 8 — First Complete Vertical Slice: Users

This will be our architecture proving ground.

### User Domain

- [x] User entity
- [x] User identity
- [x] User invariants
- [x] Email value object
- [x] User domain errors
- [x] User repository contract
- [x] User factory if justified



### Create User

- [x] Create-user input DTO
- [x] Create-user output DTO
- [x] Create-user use case
- [x] User creation rules
- [x] Duplicate-user behavior
- [x] Password handling boundary
- [x] Repository interaction
- [ ] Transaction boundary if necessary



### Infrastructure

- [x] User repository implementation
- [x] Database mapping
- [x] Persistence model
- [x] Domain ↔ persistence mapping



### Presentation

- [x] Create-user controller
- [x] Create-user request validation
- [x] Create-user route
- [x] Response serializer
- [x] HTTP error mapping



### Tests

- [x] Entity tests
- [x] Value-object tests
- [x] Use-case tests
- [ ] Repository tests
- [x] Controller tests
- [x] HTTP integration test
- [x] Full vertical-slice test

This feature will determine whether our architecture is actually good.

---



# Phase 9 — Database & Persistence

- [x] Select database library/ORM
- [x] Evaluate Prisma vs Drizzle
- [x] Establish database architecture
- [x] Configure PostgreSQL
- [x] Configure database connection
- [x] Configure connection pooling
- [x] Configure migrations
- [x] Configure schema management
- [x] Define persistence models
- [x] Define repository implementations
- [x] Define domain-to-database mapping
- [x] Define database-to-domain mapping
- [ ] Define transaction abstraction
- [ ] Implement transaction handling
- [ ] Handle connection failures
- [x] Handle database shutdown
- [ ] Configure test database strategy
- [ ] Configure database seeding
- [x] Configure migration workflow

---



# Phase 10 — Validation

- [x] Select validation library
- [x] Configure Zod
- [x] Define request validation
- [x] Define query validation
- [x] Define path-parameter validation
- [x] Define environment validation
- [x] Define validation error format
- [x] Keep domain validation separate from HTTP validation
- [x] Avoid duplicating validation unnecessarily
- [x] Establish DTO/schema relationship

Important distinction:

```text
HTTP validation
      ≠
Domain invariants
```

Both are necessary, but they solve different problems.

---



# Phase 11 — Error Architecture

- [x] Domain errors
- [x] Application errors
- [x] Infrastructure errors
- [x] Validation errors
- [x] Not-found errors
- [ ] Conflict errors
- [ ] Unauthorized errors
- [ ] Forbidden errors
- [x] Internal errors
- [x] Error codes
- [x] Error metadata
- [x] Error serialization
- [x] HTTP status mapping
- [x] Production error sanitization
- [x] Development error details
- [x] Error logging strategy
- [x] Error correlation/request IDs

---



# Phase 12 — Logging & Observability

- [x] Select Pino
- [x] Configure structured logging
- [x] Configure log levels
- [x] Configure development logging
- [x] Configure production logging
- [x] Request logging
- [x] Request IDs
- [x] Correlation IDs
- [x] Error logging
- [x] Sensitive-data redaction
- [x] Database logging strategy
- [ ] External-service logging strategy
- [x] Startup/shutdown logging
- [x] Health/readiness logging policy

Then later:

- [ ] Metrics
- [ ] Tracing
- [ ] OpenTelemetry evaluation
- [x] Application performance monitoring

---



# Phase 13 — Authentication

- [ ] Authentication architecture
- [x] Password hashing
- [x] Password verification
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

- [x] Helmet/security headers
- [x] CORS policy
- [x] Rate limiting
- [x] Request size limits
- [x] Input validation
- [ ] Output sanitization where necessary
- [x] Password security
- [ ] Secret management
- [ ] Secure cookies if applicable
- [ ] CSRF strategy if applicable
- [ ] SSRF considerations for external URLs
- [x] SQL injection protection
- [ ] Prototype pollution considerations
- [ ] Dependency vulnerability scanning
- [ ] Security audit process
- [x] Sensitive-data logging prevention
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
- [x] HTTP client strategy
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

- [x] Pagination abstraction
- [x] Offset pagination evaluation
- [ ] Cursor pagination evaluation
- [x] Pagination DTO
- [x] Pagination response format
- [x] Sorting
- [x] Filtering
- [x] Search
- [x] Query parameter conventions
- [x] Database-efficient pagination

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
- [x] Docker Compose
- [x] PostgreSQL container
- [ ] Redis container if needed
- [x] Health checks
- [ ] Container shutdown
- [x] Environment configuration
- [ ] Container security

---



# Phase 23 — CI/CD

- [x] Select CI platform
- [x] Install dependencies
- [x] Dependency caching
- [x] Biome validation
- [x] TypeScript validation
- [x] Unit tests
- [x] Integration tests
- [ ] E2E tests
- [ ] Coverage
- [x] Build verification
- [ ] Dependency audit
- [ ] Docker build
- [ ] Docker image scanning
- [ ] Deployment workflow
- [ ] Environment-specific deployment
- [ ] Production deployment strategy

---



# Phase 24 — Git & Release Management

- [x] Conventional Commits
- [x] Commitlint
- [x] Lefthook
- [x] Pre-commit checks
- [x] Commit-msg checks
- [ ] Branch naming convention
- [ ] Pull request conventions
- [x] PR checks
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

- [x] Dependency update strategy
- [x] Lockfile policy
- [ ] Production dependency audit
- [ ] Dev dependency audit
- [x] Automated dependency updates
- [x] Renovate/Dependabot evaluation
- [ ] Vulnerability scanning
- [ ] License checking
- [ ] Node.js version policy
- [ ] pnpm version policy

---



# Phase 26 — Performance & Reliability

- [x] HTTP performance baseline
- [x] Database query performance
- [ ] Connection pool tuning
- [ ] Cache performance
- [ ] Memory considerations
- [ ] Event-loop considerations
- [ ] Request timeout policy
- [ ] Retry policy
- [ ] Graceful degradation
- [ ] Backpressure considerations
- [x] Rate limiting
- [ ] Load testing strategy

---



# Phase 27 — Production Operations

- [x] Health endpoint
- [x] Readiness endpoint
- [ ] Liveness strategy
- [x] Graceful shutdown
- [x] Startup validation
- [x] Environment validation
- [x] Logging
- [ ] Metrics
- [ ] Tracing
- [ ] Alerting considerations
- [ ] Error monitoring
- [x] Database monitoring
- [ ] Resource limits
- [ ] Deployment rollback strategy

---



# Phase 28 — Documentation

- [ ] README
- [ ] Project overview
- [x] Architecture overview
- [ ] Architecture decision records
- [ ] Directory structure documentation
- [x] Dependency rules
- [ ] Development setup
- [ ] Environment setup
- [x] Database setup
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
- [x] Fresh `pnpm install` works
- [x] Development server works
- [x] Production build works
- [x] Production server works
- [x] Typecheck passes
- [x] Biome passes
- [x] Tests pass
- [x] Coverage works
- [x] Git hooks work
- [x] Commitlint works
- [ ] Docker build works
- [ ] Docker runtime works
- [x] Environment validation works
- [x] Health check works
- [x] Graceful shutdown works
- [ ] Security baseline passes
- [x] CI passes from a clean environment
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