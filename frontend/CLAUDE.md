# CLAUDE.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

> **Backend API:** see [../backend/CLAUDE.md](../backend/CLAUDE.md)

## Tech Stack

- React 19 + TypeScript, built with Vite
- Styling: Tailwind CSS v4
- UI kit: MUI (`@mui/material`, `@mui/icons-material`, `@mui/x-data-grid` / `-premium`)
- Routing: `react-router-dom` (data router via `createBrowserRouter`)
- HTTP: `axios`
- Dates: `moment`

## Architecture

- Cross-cutting client state (auth session, global loader, theme) is provided via React Context + Provider — `shared/hooks/auth`, `shared/hooks/loader`, `shared/providers/ThemeProvider` — not a global store library. There is no React Query or Zustand in this repo; do not introduce them without confirming with the user first.
- The single `axios` instance in `shared/handlers/api.handler.ts` owns cross-cutting HTTP concerns (base URL, 401 refresh-token retry with a request queue, session-locked/expired redirects). Route API calls through this instance rather than creating a new `axios.create()`.
- Routes are split into two top-level namespaces under `modules/`: `pre-login/` (public, wrapped by `PublicGuard` + `PublicLayout`) and `post-login/` (authenticated, wrapped by `RequireAuth` + `PrivateLayout`). Route tree lives directly in `App.tsx`; route path constants live in `shared/constants/routes`.
- Server data for a feature page currently lives in local component state populated by direct `axios` calls — there is no per-module `services/`/`hooks/` API layer yet. If a feature grows enough API surface to warrant it, follow the shape: a `services/` file for raw API calls, a thin hook wrapping it — don't invent a different shape per feature.

## Project Structure

```
src/
    modules/
        core/
            pages/                  # NotFound, Unauthorized
        pre-login/
            core/
                components/          # PublicLayout
            login/
                pages/                # Login, Register, ForgotPassword
        post-login/
            core/
                components/           # PrivateLayout, LockScreen
                pages/                 # LandingPage
            dev/
                pages/                 # component playground (dev.components)
            <feature>/                 # e.g. historical, inform-hub
                components/
                models/                 # feature-local types
                pages/
    shared/
        components/               # reusable: Btn, CodeBlock, Criteria, DataGrid, Loader, Notes, SelectBox, View
        constants/                 # incl. route path constants
        guards/                    # RequireAuth, PublicGuard
        handlers/                  # api.handler (axios instance), navigator.handler
        hooks/
            auth/                   # AuthContext, AuthProvider, useAuth
            loader/                 # LoaderContext, LoaderProvider, useLoader
            theme/                  # useTheme
        models/                    # shared types
        providers/                 # ThemeProvider
        theme/
    assets/
    .env.example                  # environment template only — use a fake credential or secret
    App.tsx                       # route tree
    main.tsx
```

### Rules

- Never put side effects inside presentational components
- New features are added under `modules/post-login/<feature>/` (or `modules/pre-login/<feature>/` for public flows), following the `components/` + `models/` + `pages/` shape already used by `historical` and `inform-hub`
- Do not create a new abstraction for one-off usage
- Component filename MUST match its exported name
- Cross-cutting state (auth, loader, theme) goes through the existing Context+Provider pattern in `shared/hooks/` — don't add a new global state library for it
- Route path segments belong in `shared/constants/routes`, not inlined as string literals in `App.tsx`

## Coding Convention

### Naming

| Pattern            | Use for                                       |
| ------------------ | ---------------------------------------------- |
| `PascalCase`       | Components, type, interface                    |
| `camelCase`        | Functions, hooks, variable                      |
| `kebab-case`       | File names (existing components are `PascalCase.tsx`; match the file you're editing) |
| `snake_case`       | API Response interface (Map Golang/DB Column)   |
| `UPPER_SNAKE_CASE` | Module-level constant                           |

### Coding Rules

- Keep components simple under 200 lines **unless the complexity genuinely justifies it**
- Descriptive variable names — no abbreviations like `qty` for `quantity`
- No dead code without comment
- Comments only when intent is non-obvious
- Extract repeated logic into hooks
- Handle errors at the call site
- **Money precision**: never use `float`/`number` math for money, quantity, rate, or FX — carry it as string/decimal from the API and format at the display edge only

### For Typescript

- Strict mode on, avoid `any` — prefer `unknown` + narrowing when the real type isn't known yet
- Named exports only — plays better with refactors and auto-import than default exports
- Prefer `undefined` for "no value yet" (optional props, uninitialized state — it's TS/JS's native absence); use `null` only when a value is intentionally, explicitly empty (e.g. mirrors a nullable API/DB field) — don't use the two interchangeably
- `async/await` over `.then` chains

### Formatting Display

- Date: `YYYY-MM-DD`
- DateTime: `YYYY-MM-DD HH:mm:ss`
- Time only: `HH:mm` / `HH:mm:ss`
- Money / amounts: 2 decimal places
- Yield / percentage return: 6 decimal places

### UI & Design System

- Tailwind utility classes only — no custom CSS files
- Every interactive element needs `hover`, `focus`, `active`, `disabled` state
- Clickable element add class `cursor-pointer` and `cursor-not-allowed` when disabled
- Forms must be scannable and mobile-friendly
- Meet WCAG 2.1 AA for contrast and color blindness
- Support keyboard navigation
- CTA button: Solid primary only — no ghost buttons for main action
- **Transitions**: use the most specific transition class. Avoid `transition-all`. If only color is animating, omit the transition entirely — do not use `transition-colors`

#### Rules

- **Imports**: for a library with a heavy barrel export (MUI), import from the specific file, not the package root — keeps bundles tree-shakeable:
  ```ts
  // ✓
  import Button from "@mui/material/Button";
  // ✗
  import { Button } from "@mui/material";
  ```
- **Error handling**: in `catch` blocks, extract a message in priority order — API error body, then `Error.message`, then a fixed fallback string. Use `isAxiosError()` from `shared/handlers/api.handler.ts` to narrow, not a manual cast:

  ```ts
  import { isAxiosError } from "../../shared/handlers/api.handler";

  function getErrorMessage(err: unknown, fallback = "An error occurred"): string {
    if (isAxiosError(err)) {
      return err.response?.data?.message ?? err.message ?? fallback;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return fallback;
  }
  ```

### Comment Code

- `// Note:` — allowed for context that aids understanding
- `// TODO:` — if encountered **in files you are editing**, flag it to the user before proceeding

### Before Creating New Code

Before creating a new component, hook, util, or type — search whether an equivalent implementation already exists and reuse it whenever possible. Before introducing any new type, ask the user to confirm its name unless the name is explicitly specified in the requirement.

### Loading Indicator

Classify by what's on screen, not by how long a call might take — an agent can always tell from the markup/template whether something is static, fetched, or a triggered action; it can never know a call's real-world latency ahead of time.

| UI pattern                                                                                                    | Treatment                                                       |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Static text / content that never depends on a fetch                                                                 | No indicator                                                           |
| View is populated by fetched data — lists, detail pages, dropdown options, any `[label]: [input]` field backed by an API call | Skeleton UI                                                            |
| User-triggered action — submit, save, delete, any button that mutates data                                           | Spinner — disable the control and show the spinner inline/on the button |

#### Rules

- A dropdown/select whose options come from an API counts as fetched data even though it's a small control — skeleton it, don't treat it as static just because it's compact
- Use a full-screen/backdrop spinner (the existing `shared/hooks/loader` `LoaderProvider`) only when the action blocks the entire view (e.g. a multi-step wizard submit) — otherwise keep the spinner scoped to the triggering control
- If a similar case already has a loading treatment elsewhere in the repo, match it — consistency beats re-deriving the pattern from scratch

### Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint check
npm run preview      # Preview production build
```

## Testing & Quality

Before marking task complete:

1. Run `npm run lint` — fix all ESLint errors
2. Run `npm run build` — fix all Typescript + build errors

There is no test runner configured in this repo yet (`package.json` has no `test` script or test framework). If a task requires adding tests, confirm with the user which runner to introduce (e.g. Vitest) before adding one.

### Rules

- **DO NOT edit a test to make a failure pass.** When a test breaks after a code change, stop and report which tests failed and why — decide whether the _code_ regressed or the expected behavior genuinely changed, summarize the impact, and wait for explicit approval before touching any test. Do not assume the test is wrong just because it is red.

## Security Rules

- DO NOT hardcode API keys, tokens, passwords, or credentials in source code
- DO NOT log sensitive data (passwords, tokens, secrets, connection strings)
- DO NOT commit `.env`, `.env.local`, or any file containing secrets or credentials
- `.env.example` is the only env file allowed in version control — placeholder values only
- Auth tokens are stored in `HTTPOnly` cookies set by the backend, not in `localStorage`/`sessionStorage` — only non-sensitive user/session flags (`user_data`, `session_locked`, `session_locked_at`) belong in `localStorage`

## Definition of Done

A task is complete only when

- Build succeeds
- Tests pass
- Existing behavior is preserved
- Requested functionality is implemented
- No unnecessary files are added
- No unrelated code is modified
