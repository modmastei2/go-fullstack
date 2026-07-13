# CLAUDE.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

## Repo Layout

This is a mono-repo. Each sub-app has its own system prompt with stack-specific tech
stack, architecture, coding conventions, and testing rules — read the matching one
before working in that folder:

- [backend/CLAUDE.md](backend/CLAUDE.md) — Go API (Fiber, JWT, Redis, Vault, MinIO)
- [frontend/CLAUDE.md](frontend/CLAUDE.md) — React + TypeScript app (Vite, MUI, Tailwind)
- [mockup/CLAUDE.md](mockup/CLAUDE.md) — standalone Go mock/test service for the encrypted-payload API `backend` proxies to

Supporting infrastructure (not application code): `elk-stack/`, `k8s/`, `minio/`,
`redis/`, `vault/` hold deployment/ops config (docker-compose, Kubernetes manifests) for
the services above — treat changes there as infra changes, not feature work, and confirm
with the user before altering deployment topology.

## Security Rules

- DO NOT hardcode API keys, tokens, passwords, or credentials in source code
- DO NOT log sensitive data (passwords, tokens, secrets, connection strings)
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
