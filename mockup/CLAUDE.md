# CLAUDE.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

> **Backend API (consumer of this service):** see [../backend/CLAUDE.md](../backend/CLAUDE.md)

## Tech Stack

- Go (module `go-test-encryption`, see `go.mod` for version)
- Web framework: Fiber v2

## Architecture

This is a standalone mock/test service — it simulates the upstream API that [backend](../backend/CLAUDE.md)'s `internal/filter` package proxies to (`/filters/search`, `/customers/search`), and exercises the AES-CBC payload lock/unlock scheme the two sides share. It is intentionally flat: a single `package main`, no `cmd`/`internal` split, no service/repository layering. Do not restructure it into the layered shape used by `backend` unless the user asks — that would overstate what this project is.

- `main.go` — Fiber app setup, middleware wiring, and route handlers (handler logic is inline, not extracted to a separate service type)
- `api.go` — `UnlockPayload`/`LockResult`: generic helpers that decrypt+unmarshal a request payload / marshal+encrypt a response payload
- `encrypter.go` — AES-CBC encrypt/decrypt + PKCS5 padding primitives
- `encoder.go` — base64 encode/decode helpers
- `middlewares.go` — `EncryptionMiddleware`, enforcing `pretoken`/`token` headers on non-root routes
- `model.go` — request/response envelope types and the mock filter-template payload shapes

## Project Structure

```
api.go
encoder.go
encrypter.go
main.go
middlewares.go
model.go
go.mod
go.sum
bruno/                        # Bruno API client collection for manual testing
.env                          # local env — do not commit real secrets here
```

### Rules

- Keep this service flat (single `package main`) — do not introduce `cmd`/`internal`/`pkg` folders here; if the mock needs to grow into something closer to a real service, raise that with the user first rather than restructuring silently
- New mock endpoints go in `main.go` alongside the existing `/api/v1/wealth/*` handlers
- `KEY`/`IV` handling must stay consistent with `backend`'s expectations (`PREFIX` + `pretoken` header) — do not change the IV derivation without updating the `backend` side too

## Coding Convention

### Naming

| Pattern            | Use for                                              |
| ------------------ | ------------------------------------------------------ |
| `PascalCase`        | Exported identifiers (types, funcs, consts)              |
| `camelCase`         | Unexported identifiers, local variables                   |
| `snake_case`        | JSON tags for request/response payloads                    |
| `UPPER_SNAKE_CASE`  | Environment variable names only                             |

### Coding Rules

- Always check and handle `error` — never discard with `_` unless justified by a comment
- Wrap errors with context: `fmt.Errorf("doing X: %w", err)` — never lose the original error
- Do not `panic` in normal request-handling flow
- Keep functions focused and small — extract when a function does more than one thing
- Avoid duplicated logic; extract a helper only when reuse or clarity improves
- Code must be `gofmt`/`goimports` clean

### API Rules

- Keep API response format consistent with existing endpoints (`ResponseModel[T]` envelope: `success`, `status`, `message`, `timestamp`, `info`, `result`)
- DO NOT change route paths, request, or response shapes unless required — `backend`'s `filter` package depends on these shapes
- Return meaningful error messages without leaking internal details

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

Before creating a new handler, model, or helper — search whether an equivalent implementation already exists and reuse it whenever possible. Before introducing any new type, ask the user to confirm its name unless the name is explicitly specified in the requirement.

### Commands

```bash
go build ./...
go test ./...
go vet ./...
go run .
```

## Testing & Quality

Before marking task complete:

1. Run `go build ./...` — fix all compile errors
2. Run `go vet ./...` — fix all issues
3. Run `go test ./...` — fix all failing tests

### Test Runner

- No tests exist in this module yet. If a task needs one, use the standard `testing` package with `testify` (`assert`/`require`) and co-locate it with the code under test (`foo.go` + `foo_test.go`), matching `backend`'s convention.

### Unit Test Rules

Unit test required for:

- `encrypter.go` / `encoder.go` primitives (encrypt/decrypt round-trip, padding edge cases)
- `api.go`'s lock/unlock helpers

Do not write unit tests for:

- Thin wiring code (`main.go`)
- Third-party library behavior

### Rules

- **DO NOT edit a test to make a failure pass.** When a test breaks after a code change, stop and report which tests failed and why — decide whether the _code_ regressed or the expected behavior genuinely changed, summarize the impact, and wait for explicit approval before touching any test. Do not assume the test is wrong just because it is red.

## Security Rules

- DO NOT hardcode API keys, tokens, passwords, or credentials in source code
- DO NOT log sensitive data (passwords, tokens, secrets, connection strings) — note `main.go` and `encrypter.go` currently log full request/response payloads and plaintext/ciphertext; treat that as debug-only behavior for this mock, never carry the pattern into `backend`
- DO NOT commit `.env`, `.env.local`, or any file containing secrets or credentials
- `.env.example` is the only env file allowed in version control — placeholder values only

## Definition of Done

A task is complete only when

- Build succeeds
- Tests pass
- Existing behavior is preserved
- Requested functionality is implemented
- No unnecessary files are added
- No unrelated code is modified
