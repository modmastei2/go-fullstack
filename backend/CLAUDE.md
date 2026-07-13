# CLAUDE.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

> **Frontend App:** see [../frontend/CLAUDE.md](../frontend/CLAUDE.md)
> **Mock encryption service:** see [../mockup/CLAUDE.md](../mockup/CLAUDE.md)

## Tech Stack

- Go (module `go-backend`, see `go.mod` for version)
- Web framework: Fiber v2
- Auth: `golang-jwt/jwt/v5` (JWT) + `golang.org/x/crypto/bcrypt` (password hashing)
- Session/token store: Redis (`redis/go-redis/v9`)
- Secrets: HashiCorp Vault (`hashicorp/vault/api`)
- Object storage: MinIO (`minio/minio-go/v7`)
- API docs: `swaggo/swag` + `swaggo/fiber-swagger` (Swagger/ReDoc)
- Resilience: `sony/gobreaker` (circuit breaker) on outbound HTTP calls

## Architecture

- Feature code lives in flat packages under `internal/<feature>/` (e.g. `auth`, `filter`) — each package owns its own `handler.go` (route registration), a `*Service` struct whose methods act as the Fiber handlers (business logic and HTTP handling are combined, not split into separate service/repository layers), and `model.go` for request/response types.
- There is no database/repository layer today — state is either held in Redis (sessions, refresh tokens) or fetched from an upstream service via `internal/client`'s `XHttpClient`.
- Cross-feature types (API envelope models, error responses, JWT claims, shared HTTP helpers) live in `internal/shared/`.
- One-time startup wiring (config, Vault, Redis, MinIO, middleware, route registration) lives in `internal/bootstrap/`, called from `cmd/api/main.go`.
- Keep the dependency direction one-way: `cmd` → `internal/bootstrap` → `internal/<feature>` → `internal/shared`/`internal/client`/`internal/extensions`.

## Project Structure

```
cmd/
    api/
        main.go              # wiring only — no business logic
internal/
    auth/                    # login, refresh, lock/unlock, session handlers
        handler.go           # RegisterRoutes
        service.go           # AuthService — business logic + Fiber handlers combined
        model.go
    filter/                  # filter/search proxy to the upstream (mockup) service
        handler.go
        service.go
        model.go
    bootstrap/               # startup wiring: app, database, redis, minio, vault
    client/                  # XHttpClient — outbound HTTP client to upstream services
    extensions/              # config loading, base64 encoder, encrypter, retry
    log/                     # logger
    middleware/               # cors, jwt auth, http method allowlist, request logging, recovery, security headers
    shared/                   # cross-feature: API envelope models, error_response, claims, helpers
docs/                        # generated Swagger spec
public/
security/
go.mod
go.sum
.env.example                 # environment template only — use fake credentials
```

### Rules

- New feature code goes under a new `internal/<feature>/` package with its own `handler.go`, `service.go`, `model.go` — do not scatter feature code across unrelated packages.
- Package names are short, lowercase, no underscores (`filter`, not `filter_service`).
- Cross-feature types belong in `internal/shared/`, not duplicated per feature.

## Coding Convention

### Naming

| Pattern            | Use for                                              |
| ------------------ | ------------------------------------------------------ |
| `PascalCase`        | Exported identifiers (types, funcs, consts)              |
| `camelCase`         | Unexported identifiers, local variables                   |
| `snake_case`        | JSON tags for API responses (map to FE/DB)                |
| `UPPER_SNAKE_CASE`  | Environment variable names only                             |

### Coding Rules

- Always check and handle `error` — never discard with `_` unless justified by a comment
- Wrap errors with context: `fmt.Errorf("doing X: %w", err)` — never lose the original error
- Do not `panic` in normal request-handling flow; reserve `panic` for unrecoverable startup failures (as `bootstrap` already does via `log.Fatal`)
- Keep functions focused and small — extract when a function does more than one thing
- Avoid duplicated logic; extract a helper only when reuse or clarity improves
- Prefer explicit context propagation (`context.Context` as first param) for anything doing I/O
- No package-level mutable state unless justified (prefer dependency injection, as `NewAuthService`/`NewFilterService` already do)
- Accept interfaces, return concrete structs — keeps callers testable without over-abstracting the implementation
- Code must be `gofmt`/`goimports` clean — enforced by `golangci-lint run`, not manual review
- Return errors as `shared.ErrorResponse{ErrorCode, Message}` — use a stable, uppercase `ErrorCode` (e.g. `INVALID_CREDENTIALS`) the frontend can branch on, not just a free-text `Message`

### API Rules

- Keep API response format consistent with existing endpoints
- DO NOT change route paths, request, or response shapes unless required
- Return meaningful error messages without leaking internal details (never send a raw `err.Error()` to the client on a 5xx)

### Session / Redis Rules

- DO NOT change the Redis key naming scheme (`session:<userId>:<sessionId>`, `refresh_token:<userId>:<sessionId>:<tokenId>`) without updating every reader/writer of that key
- Always set an expiry (`Expire`/`Set` with TTL) on session and refresh-token keys — never leave one to persist indefinitely
- Always pass `context.Context` through to Redis calls — respect caller cancellation/timeouts

### Formatting Display

- Date: `YYYY-MM-DD`
- DateTime: `YYYY-MM-DD HH:mm:ss`
- Time only: `HH:mm` / `HH:mm:ss`
- Money / amounts: 2 decimal places
- Yield / percentage return: 6 decimal places
- Money / amounts stored and computed as `shopspring/decimal.Decimal` — never `float64` for money, quantity, rate, or FX

### Comment Code

- `// Note:` — allowed for context that aids understanding
- `// TODO:` — if encountered **in files you are editing**, flag it to the user before proceeding
- Exported identifiers get a doc comment starting with the identifier name (`// PaymentService handles...`) only when the name alone doesn't make behavior obvious

### Before Creating New Code

Before creating a new handler, service, or model — search whether an equivalent implementation already exists and reuse it whenever possible. Before introducing any new type, ask the user to confirm its name unless the name is explicitly specified in the requirement.

### Commands

```bash
go build ./...
go test ./...
go vet ./...
golangci-lint run
go run cmd/api/main.go
swag init -g cmd/api/main.go   # regenerate Swagger spec after route/doc changes
```

## Testing & Quality

Before marking task complete:

1. Run `go build ./...` — fix all compile errors
2. Run `go vet ./...` and `golangci-lint run` — fix all issues
3. Run `go test ./...` — fix all failing tests

### Test Runner

- Standard `testing` package; use `testify` (`assert`/`require`) for readable assertions
- Table-driven tests are the default shape for anything with more than one input case
- Tests are co-located with the code under test (`foo.go` + `foo_test.go`, e.g. `client/http_client_test.go`, `shared/helper_test.go`)

### Unit Test Rules

Unit test required for:

- Business logic and calculations
- Validation logic
- Formatting utilities

Do not write unit tests for:

- Thin wiring code (`main.go`, `bootstrap/`)
- Third-party library behavior

### Rules

- **DO NOT edit a test to make a failure pass.** When a test breaks after a code change, stop and report which tests failed and why — decide whether the _code_ regressed or the expected behavior genuinely changed, summarize the impact, and wait for explicit approval before touching any test. Do not assume the test is wrong just because it is red.

## Security Rules

- DO NOT hardcode API keys, tokens, passwords, or credentials in source code
- DO NOT log sensitive data (passwords, tokens, secrets, connection strings)
- DO NOT commit `.env`, `.env.local`, or any file containing secrets or credentials
- `.env.example` is the only env file allowed in version control — placeholder values only
- Secrets are loaded from Vault at startup (`bootstrap.InitializeVault` + `extensions.LoadSecrets`) — never read a secret from an env var when a Vault-backed one already exists
- Auth cookies (`access_token`, `refresh_token`) must stay `HTTPOnly`, `Secure`, and `SameSite=Lax` — do not weaken these flags

## Definition of Done

A task is complete only when

- Build succeeds
- Tests pass
- Existing behavior is preserved
- Requested functionality is implemented
- No unnecessary files are added
- No unrelated code is modified
