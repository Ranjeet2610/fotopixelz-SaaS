# Fotopixelz

## Project Overview

Fotopixelz is a production SaaS monorepo built with:

- Turborepo
- Next.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- BullMQ
- AWS S3
- Redis

## Project Standards

Before implementing any feature:

- Read all related files before making changes.
- Search the repository for existing implementations.
- Prefer extending existing code instead of creating new abstractions.
- Never rewrite working code without a clear reason.
- Never change database schema without explaining migration impact.
- Never change API contracts unless explicitly requested.
- Never remove existing functionality.
- Keep commits focused on a single responsibility.
- Follow existing naming conventions.
- Follow existing folder structure.
- Keep diffs as small as possible.

## Development Workflow

For every task:

1. Understand the existing implementation.
2. Explain the current architecture.
3. Identify the root cause or requirement.
4. Propose the implementation plan.
5. List affected files.
6. Explain risks and edge cases.
7. Wait for my approval before modifying any files.

## Implementation Rules

After approval:

- Keep changes minimal.
- Do not introduce breaking changes.
- Reuse existing utilities.
- Avoid duplicate code.
- Maintain strict TypeScript.
- Preserve backward compatibility.

## Quality Checklist

Every implementation must include:

- Root cause analysis
- Affected files
- Risks
- Edge cases
- Backward compatibility
- Self review
- Regression checklist
- Manual testing steps

## If requirements are unclear

Stop and ask questions instead of making assumptions.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (v11.4.0), orchestrated with **Turborepo**. Run all commands from the repo root unless noted.

```bash
pnpm dev              # run all apps/services in parallel (client, web, admin, api, workers)
pnpm dev:client       # apps/client only (Next.js, port 3000) — the authenticated client app
pnpm dev:admin        # apps/admin only (Next.js, port 3001)
pnpm dev:api          # services/api only (tsx watch, Express)
pnpm dev:workers      # apps/workers only (tsx watch, BullMQ processors)
pnpm --filter web run dev   # apps/web only (Next.js, port 3002) — future public marketing site placeholder, no root alias yet

pnpm build            # turbo run build (all packages)
pnpm lint             # turbo run lint
pnpm typecheck        # turbo run typecheck
```

Per-package equivalents (e.g. `services/api`, `apps/client`) each define `dev`, `build`, `lint`, `typecheck` — use `pnpm --filter <name> run <script>` to target one (e.g. `pnpm --filter api run typecheck`). `apps/workers` has no lint config yet (`lint` is a no-op echo).

There is no test runner configured in any package.json yet — do not assume Jest/Vitest exist; check the specific package before writing tests.

### Database (Prisma)

```bash
pnpm db:generate      # prisma generate
pnpm db:migrate       # prisma migrate dev (local schema changes)
pnpm db:deploy        # prisma migrate deploy (applies pending migrations, no prompts)
pnpm db:studio        # prisma studio
pnpm db:seed          # prisma db seed
pnpm db:cleanup-empty-orgs[:execute]        # tsx script; dry-run by default, --execute to apply
pnpm db:repair-deliverables[:execute]       # tsx script; dry-run by default, --execute to apply
```

Schema lives at `prisma/schema.prisma`; migrations in `prisma/migrations`. `@repo/database` (`packages/database`) wraps `@prisma/client` via `@prisma/adapter-pg` — import the Prisma client through that package, not directly from `@prisma/client`.

## Architecture

This is a pnpm/Turborepo monorepo implementing a photo-editing SaaS workflow (order → upload → AI preprocessing → human editing → QA → client approval → delivery → payment/analytics).

### Workspace layout
- `apps/client` — Next.js 16 authenticated client application (login, register, OAuth, dashboard, orders, uploads, assets, billing). Package name `client`, dev port 3000. This is the historical `apps/web` — renamed as part of a workspace/domain split; see `docs/architecture/architecture.md` for the rationale.
- `apps/web` — Next.js 16 placeholder scaffold for the future public marketing site (`fotopixelz.com`). Package name `web`, dev port 3002. Intentionally minimal (no auth, no dashboard, no shared client deps) — not yet wired into Docker Compose/deployment; build it out only when public site development actually begins.
- `apps/admin` — Next.js 16 admin operations app (separate app, not a route group inside `client`).
- `apps/workers` — standalone tsx/BullMQ process for async job processors (no HTTP server).
- `services/api` — Express 5 HTTP API and workflow orchestration; the only backend service apps talk to directly.
- `packages/*` — shared code consumed via `workspace:*` deps: `auth` (JWT helpers), `database` (Prisma client wrapper), `email` (Resend + React Email templates), `types`, `ui`, `upload-gallery` (shared upload UI consumed by both `client` and `admin`), `utils`, `validators`, `config`.
- `infrastructure/*` — deployment/infra config.
- `prisma/` — canonical schema and migrations shared by `services/api` and `apps/workers` (via `@repo/database`).

Note: `services/api`'s `WEB_APP_URL` env var / `env.webAppUrl` (OAuth redirect target, password-reset links, the `'web'|'admin'` enum in `POST /auth/forgot-password`) still conceptually refers to `apps/client` (the app now running on port 3000), not the new `apps/web` placeholder — deliberately left unchanged to avoid an API contract change. Revisit this naming once the public site is real and needs its own base-URL variable.

### `services/api` structure
Module-per-domain under `src/modules/` (e.g. `auth`, `orders`, `assets`, `editing`, `qa`, `revisions`, `payments`, `subscriptions`, `organizations`, `workflow`, `analytics`, `audit-logs`, `notifications`, `admin`). Each module typically has `*.controller.ts`, `*.service.ts`, `*.routes.ts`, `*.types.ts`, `*.validator.ts` — controllers stay thin, business logic lives in services.

Cross-cutting concerns live outside `modules/`:
- `src/common/middleware` — `auth.ts` (JWT/session auth), `admin.ts` (role gating), `error-handler.ts`
- `src/common/errors` — `AppError` and typed error classes; throw these from services, let `error-handler.ts` format the response.
- `src/integrations/` — third-party clients (Cloudinary, Redis, Resend, S3-compatible storage, Stripe) — wrap SDK calls here, don't call SDKs directly from modules.
- `src/queues/` — BullMQ queue producers (`ai.queue.ts`, `email.queue.ts`, `notification.queue.ts`); consumers/processors live in `apps/workers`, not here.
- `src/sockets/socket.ts` — Socket.IO server setup (used for realtime notifications to `admin`/`web`).
- `src/config/env.ts` — env var loading/validation; `src/config/email.ts` — email provider config.

### Data model & roles
Core Prisma entities group into: Identity (`User`, `Organization`, `Membership`), Catalog (`ServiceCategory`, `Service`), Operations (`Order`, `OrderItem`, `Asset`, `AssetVersion`), Workflow (`EditingJob`, `AiJob`, `QAReview`, `Revision`, `WorkflowEvent`), Commerce (`Payment`, `Invoice`), Platform (`Notification`, `AuditLog`).

Roles: `CLIENT`, `EDITOR`, `QA`, `ADMIN`, `SUPER_ADMIN`. Permissions are grouped by domain (orders, uploads, assets, editing, qa, payments, admin, analytics, settings) — check `common/middleware/auth.ts` and `admin.ts` for how role/permission checks are enforced on routes.

### Auth
Auth (`services/api/src/modules/auth/`) supports both credential-based login (bcrypt) and Google OAuth (`google-oauth.service.ts`, `oauth-state.ts`), plus email verification (`email-verification.service.ts`) that is enforced at login. `client-workspace.ts` / `client-workspace-bootstrap.ts` handle provisioning an org/workspace on first login. Frontend auth UI/context: `apps/client/src/components/auth-pages.tsx` and `auth-provider.tsx`.

## Documentation

`docs/` is the single home for engineering docs (package-local READMEs stay with their package). Structure and conventions:
- `docs/planning/IMPLEMENTATION_MASTER_PLAN.md` is the **single source of truth** for current remediation scope — check it before assuming other planning docs reflect current priorities.
- `docs/architecture/` (`architecture.md`, `api.md`, `env.md`) is living documentation — update it in the same PR when you change the behavior it describes.
- `docs/reports/` entries are immutable point-in-time snapshots — never edit an existing report to reflect a later change; add a new one instead.
- `docs/adr/` is one architectural decision per file, immutable once accepted; a reversed decision gets a new ADR that supersedes the old one.
- `docs/guides/local-setup.md` is the environment setup guide.

No document under `docs/` should contain secrets or environment-specific values — `docs/architecture/env.md` documents variable *names* only.
