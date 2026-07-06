# Fotopixelz — Development Environment Stabilization Audit

**Date:** June 6, 2026  
**Scope:** Audit only — no code changes, no deletions, no refactors  
**Symptoms reported:** Port swapping (3000/3001), login redirect inconsistency, `/auth/me` 401, Turbopack panics

---

## Executive Summary

| Finding | Severity | Root cause |
|---------|----------|------------|
| Web/Admin port swap | **Critical** | Both apps use `next dev` without `-p`; first wins 3000, second gets 3001 |
| Docker vs local mismatch | **High** | Docker pins ports correctly; local `pnpm dev` does not |
| `/auth/me` 401 | **Medium** | Usually expired/invalid JWT, API down, or `JWT_ACCESS_SECRET` mismatch — **not** port swap directly |
| Turbopack panics (admin) | **High** | Admin-only `turbopack.root` points at monorepo root; web has no equivalent |
| Misleading READMEs | **Low** | Both app READMEs say port 3000 |
| `.env.example` conflicts | **Medium** | Duplicate `STORAGE_PROVIDER`, missing `NEXT_PUBLIC_API_BASE_URL` |

**Overall environment health:** **Unstable for local `pnpm dev`** — **Stable for Docker Compose** (when used exclusively).

---

## 1. Environment Audit Report

### 1.1 Environment files found

| File | Status |
|------|--------|
| `.env.example` | ✅ Present (repo root) |
| `.env` | ✅ Present locally (gitignored — not audited line-by-line) |
| `.env.local` | ❌ Not in repo (gitignored) |
| `.env.development` | ❌ Not found |
| `apps/web/.env*` | ❌ Not found |
| `apps/admin/.env*` | ❌ Not found |

### 1.2 `.env.example` review

| Variable | Expected | Issue |
|----------|----------|-------|
| `PORT=5000` | API port | ✅ Correct |
| `WEB_APP_URL` | `http://localhost:3000` | ✅ Correct |
| `ADMIN_APP_URL` | `http://localhost:3001` | ✅ Correct |
| `API_BASE_URL` | `http://localhost:5000` | ✅ Correct |
| `NEXT_PUBLIC_API_BASE_URL` | Should be `http://localhost:5000/api/v1` | ❌ **Missing** — frontends fall back to hardcoded default |
| `STORAGE_PROVIDER` | Single value | ⚠️ **Defined twice** (line 24 `R2`, line 35 `S3`) — last wins |
| `JWT_ACCESS_SECRET` | Required | ⚠️ Placeholder `replace-me` — must match across API restarts |
| `CLERK_*` | Optional | ⚠️ Documented but **unused** — app uses custom JWT auth |
| `JWT_REFRESH_SECRET` | Documented | ⚠️ Listed but refresh flow not used by admin/web clients |

### 1.3 Config files

| File | Purpose | Notes |
|------|---------|-------|
| `turbo.json` | Turbo tasks | `dev` is `persistent: true`, `cache: false` — correct |
| `pnpm-workspace.yaml` | Workspace packages | Includes `apps/*`, `packages/*`, `services/*`, `infrastructure/*` |
| `prisma.config.ts` | Prisma 7 config | Loads `dotenv/config`, uses root `DATABASE_URL` |
| `packages/config/env.ts` | Shared URL defaults | `WEB_APP_URL` / `ADMIN_APP_URL` — rarely imported by runtime apps |
| `services/api/src/config/env.ts` | API env | Only `WEB_APP_URL` (not `ADMIN_APP_URL`) — used for password reset links |

### 1.4 Duplicate / conflicting values

| Conflict | Impact |
|----------|--------|
| `STORAGE_PROVIDER` twice in `.env.example` | Unpredictable storage backend in fresh setups |
| Docker `DATABASE_URL` overrides to `postgres:5432` | Local API in Docker vs local API on host use different DB hosts |
| `packages/database` stale generated Prisma | Old schema (`CREATED`, `Role` enum) in generated files — **confusing for tooling**, API uses `@prisma/client` from root schema |

### 1.5 Unused values (documented but not wired)

- `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `JWT_REFRESH_SECRET` / `JWT_REFRESH_TTL` (client uses access token in localStorage only)
- `CLOUDINARY_*` (marked legacy in `.env.example`)
- Root `package.json` dependencies (`@clerk/nextjs`, `uploadthing`, etc.) — not used by current auth flow

---

## 2. Port Conflict Report

### 2.1 Intended ports

| Service | Port | Configured? |
|---------|------|-------------|
| Web (client) | **3000** | Docker ✅ / Local ❌ |
| Admin (ops) | **3001** | Docker ✅ / Local ❌ |
| API | **5000** | ✅ `PORT` env + default |
| Workers | N/A | No HTTP port (stdout only) |
| PostgreSQL | 5432 | Docker optional |
| Redis | 6379 | Docker optional |

### 2.2 Root cause of port swapping

**Both** `apps/web/package.json` and `apps/admin/package.json` use:

```json
"dev": "next dev"
```

Next.js defaults to **port 3000**. When `pnpm dev` runs:

```json
"dev": "pnpm -r --parallel run dev"
```

All four packages start **simultaneously**:
- `web` → binds 3000
- `admin` → 3000 taken → **auto-increments to 3001** (or vice versa depending on race)

**Whichever Next app starts first gets 3000.** This explains intermittent swap.

### 2.3 Docker (correct)

`infrastructure/docker-compose.yml`:

| Service | Command |
|---------|---------|
| web | `next dev -H 0.0.0.0 -p 3000` |
| admin | `next dev -H 0.0.0.0 -p 3001` |
| api | `PORT: 5000` |

### 2.4 Hardcoded localhost references

| Location | URL |
|----------|-----|
| `apps/web/src/lib/api-client.ts` | `http://localhost:5000/api/v1` (fallback) |
| `apps/admin/src/lib/api-client.ts` | `http://localhost:5000/api/v1` (fallback) |
| `services/api/src/config/env.ts` | `http://localhost:3000` (WEB_APP_URL fallback) |
| `packages/config/env.ts` | 3000 / 3001 |
| `infrastructure/docker-compose.yml` | 3000 / 3001 / 5000 |

**No hardcoded 3000/3001 in admin/web app routing** — redirects use relative paths (`/admin`, `/login`).

### 2.5 Port conflict scenarios

| Scenario | Result |
|----------|--------|
| `pnpm dev` (web + admin parallel) | ⚠️ Port race |
| `pnpm dev:web` + `pnpm dev:admin` separately | ⚠️ Still both default 3000 unless `-p` passed |
| Docker web + local admin | ⚠️ 3000 conflict |
| Docker full stack | ✅ Isolated ports |
| API + Postgres already on 5000/5432 | ⚠️ Second instance fails |

---

## 3. Startup Flow Report

### 3.1 Root scripts (`package.json`)

| Script | Behavior |
|--------|----------|
| `pnpm dev` | Parallel dev for **all** workspace packages with `dev` script: web, admin, api, workers |
| `pnpm dev:web` | Web only |
| `pnpm dev:admin` | Admin only |
| `pnpm dev:api` | API only |
| `pnpm dev:workers` | Workers only |

### 3.2 Packages that run on `pnpm dev`

| Package | Dev command | Port |
|---------|-------------|------|
| `web` | `next dev` | 3000 (default) |
| `admin` | `next dev` | 3000 → 3001 fallback |
| `api` | `tsx watch src/server.ts` | 5000 |
| `workers` | `tsx watch src/index.ts` | None |

### 3.3 Recommended startup order (not enforced)

1. PostgreSQL + Redis (Docker or local)
2. `pnpm db:generate` (after schema changes)
3. `pnpm db:migrate` or `pnpm db:deploy`
4. **API** (`pnpm dev:api`) — verify `GET http://localhost:5000/health`
5. **Web** on 3000 + **Admin** on 3001 (explicit ports)
6. Workers (optional — currently no-op registry)

### 3.4 Predictability issues

| Issue | Detail |
|-------|--------|
| No port flags in local dev scripts | Primary instability |
| `pnpm dev` starts workers unnecessarily | Harmless today (no Redis connection) |
| No root script for Docker infra only | Docs say `docker compose up -d` manually |
| `docs/local-setup.md` says `pnpm dev` | Perpetuates port race |

---

## 4. Turbopack Error Report

### 4.1 Configuration asymmetry

| App | `next.config.ts` | Turbopack |
|-----|------------------|-----------|
| **admin** | `turbopack: { root: path.join(__dirname, "../..") }` | ✅ Enabled (Next 16 default) with **monorepo root** |
| **web** | Empty `{}` | Default app-root only |

### 4.2 Likely panic causes (admin)

| Cause | Likelihood | Explanation |
|-------|------------|-------------|
| **`turbopack.root` = repo root** | **Very high** | Turbopack watches entire monorepo: `services/`, `prisma/`, multiple `node_modules`, generated Prisma |
| **Stale `.next` cache** | High | Corrupted cache after branch switches / Docker volume mounts |
| **Windows path + OneDrive sync** | Medium | Repo under `OneDrive\Desktop` — file watcher instability |
| **Import resolving outside app** | Medium | `@repo/upload-gallery` workspace package from widened root |

### 4.3 Web app

Web does **not** set `turbopack.root` — less exposure to panics.

### 4.4 Safest fixes (recommendations only — not applied)

1. **Pin ports first** — reduces confusion when debugging Turbopack
2. **Clear caches:** delete `apps/admin/.next`, `apps/web/.next`, `.turbo`
3. **Align admin `next.config.ts` with web** — remove or narrow `turbopack.root` to admin app directory
4. **Temporary workaround:** `next dev --no-turbopack -p 3001` for admin
5. **Avoid mixed Docker + local** Next instances on same ports

---

## 5. Auth Audit (`/auth/me` and login)

### 5.1 Auth architecture

| Aspect | Implementation |
|--------|----------------|
| Token storage | `localStorage` (not cookies) |
| Web key | `fotopixelz.web.accessToken` |
| Admin key | `fotopixelz.admin.accessToken` |
| Transport | `Authorization: Bearer <token>` |
| API route | `GET /api/v1/auth/me` → `requireAuth` → `meHandler` |
| JWT secret | `JWT_ACCESS_SECRET` env var |
| TTL | `JWT_ACCESS_TTL` default `15m` |

### 5.2 `/auth/me` 401 causes (ranked)

| Cause | Likelihood | Notes |
|-------|------------|-------|
| Expired access token (15m) | **High** | Hydration clears session on 401 — expected |
| API not running / wrong URL | **High** | Check `NEXT_PUBLIC_API_BASE_URL` or fallback `localhost:5000` |
| `JWT_ACCESS_SECRET` changed or `replace-me` | **High** | Invalidates all existing tokens |
| No `Authorization` header | Medium | Missing or cleared localStorage |
| User deleted from DB | Low | Returns 404 from `meHandler`, not 401 |
| Port swap causing 401 | **Low** | Auth is not cookie-based; port swap does **not** invalidate JWT |

### 5.3 Login redirect behavior

| App | After login | Notes |
|-----|-------------|-------|
| Admin | `routeAfterAuth()` → `/admin` or `?next=` | Relative paths — **port-agnostic** |
| Admin CLIENT login | Blocked → logout + error | Redirects to web app message |
| Web | Dashboard routes | Separate localStorage namespace |

**Port switching does not break redirect URLs** (no absolute localhost in redirects).  
**User confusion** occurs when bookmarks assume admin=3001 but admin is on 3000.

### 5.4 CORS / cookies

- API: `app.use(cors())` — permissive (all origins)
- **No cookie-based session** — CORS credentials largely irrelevant for REST auth
- Socket.IO: `cors: { origin: true }` — permissive

### 5.5 Password reset gap

- `forgotPassword` builds reset link using **`WEB_APP_URL` only** (`services/api/src/modules/auth/auth.service.ts`)
- Admin users requesting reset from admin UI receive **web app** reset link (`/reset-password`)
- Not a 401 issue but operational inconsistency

---

## 6. Safe Cleanup Candidates

### 6.1 Documentation / audit artifacts (optional archive)

| File | Type | Safe to remove later? |
|------|------|----------------------|
| `FOTOPIXELZ_PROJECT_STATUS_REPORT.md` | Audit doc | ✅ After team review |
| `FOTOPIXELZ_FINAL_ROADMAP.md` | Planning doc | ✅ After team review |
| `FOTOPIXELZ_WORKFLOW_AUDIT_REPORT.md` | Audit doc | ✅ After team review |
| `FOTOPIXELZ_BUG001_VERIFICATION_REPORT.md` | Verification doc | ✅ After team review |
| `ORDER_COMMENTS_TESTING_CHECKLIST.md` | Test checklist | ⚠️ Keep until QA sign-off |

### 6.2 Debug / dry-run scripts (review before delete)

| File | Purpose | Risk if deleted |
|------|---------|-----------------|
| `prisma/scripts/dev-cleanup-dry-run.ts` | Destructive dev data cleanup report | Low — dev only |
| `prisma/scripts/final-cleanup-dry-run.ts` | Same family | Low |
| `prisma/scripts/cleanup-empty-organizations.ts` | Org cleanup utility | Low — operational tool |
| `prisma/scripts/repair-deliverable-is-current.ts` | BUG-001 repair | ⚠️ Keep until prod repair done |

### 6.3 Stale / empty files

| File | Notes |
|------|-------|
| `packages/config/redis.old.ts` | **Empty file** — superseded by `redis.ts` |
| `packages/database/src/generated/prisma/*` | **Stale schema** vs root `prisma/schema.prisma` — regenerate or stop using package |

### 6.4 Misleading boilerplate (update, don't delete)

| File | Issue |
|------|-------|
| `apps/admin/README.md` | Says port **3000** — wrong for admin |
| `apps/web/README.md` | Generic create-next-app boilerplate |

### 6.5 Build caches (safe to delete anytime)

| Path | Purpose |
|------|---------|
| `apps/web/.next` | Next.js build cache |
| `apps/admin/.next` | Next.js build cache |
| `.turbo` | Turbo cache |
| `services/api/dist` | API build output |
| `node_modules/.cache` | Various tool caches |

### 6.6 NOT cleanup candidates

- All `prisma/migrations/*` — production history
- `infrastructure/docker-compose.yml` — required for Docker dev
- `.env.example` — template (needs fixes, not removal)
- Active modules under `services/api`, `apps/*`, `packages/*`
- `prisma/seed.ts` — seed data

---

## 7. Files Safe To Remove (after approval)

| Priority | Path | Reason |
|----------|------|--------|
| Low | `packages/config/redis.old.ts` | Empty, unused |
| Low | Audit MD files (5 listed above) | Post-review archive |
| Medium | `prisma/scripts/dev-cleanup-dry-run.ts` | One-time dev experiment |
| Medium | `prisma/scripts/final-cleanup-dry-run.ts` | One-time dev experiment |
| **Never** | `prisma/migrations/**` | Production data |
| **Never** | `services/api/**` | Active API |
| **Never** | `.env` / secrets | Required for runtime |

---

## 8. Files That Must NOT Be Removed

| Category | Paths |
|----------|-------|
| Schema & migrations | `prisma/schema.prisma`, `prisma/migrations/**` |
| API | `services/api/**` |
| Frontends | `apps/web/**`, `apps/admin/**` |
| Shared packages | `packages/auth/**`, `packages/upload-gallery/**`, `packages/validators/**` |
| Docker | `infrastructure/**` |
| Workspace config | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `pnpm-lock.yaml` |
| Env template | `.env.example` |
| Operational scripts | `prisma/scripts/repair-deliverable-is-current.ts`, `cleanup-empty-organizations.ts` |

---

## 9. Recommended Fix Order

**No changes applied in this audit.** Recommended sequence:

### Phase A — Port stabilization (highest impact, lowest risk)

1. Update `apps/web/package.json` dev script: `next dev -p 3000`
2. Update `apps/admin/package.json` dev script: `next dev -p 3001`
3. Update `docs/local-setup.md` and `apps/admin/README.md` with correct ports
4. Add `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1` to `.env.example`

### Phase B — Environment hygiene

5. Fix duplicate `STORAGE_PROVIDER` in `.env.example`
6. Verify local `.env` has real `JWT_ACCESS_SECRET` (not `replace-me`)
7. Stop mixing Docker web/admin with local web/admin on same ports — use one mode

### Phase C — Turbopack stabilization

8. Clear `apps/admin/.next`, `apps/web/.next`, `.turbo`
9. Remove or narrow `turbopack.root` in `apps/admin/next.config.ts`
10. If panics persist: `next dev --no-turbopack -p 3001` for admin

### Phase D — Auth reliability

11. Confirm API health before login: `curl http://localhost:5000/health`
12. Clear stale tokens: browser localStorage keys `fotopixelz.*`
13. Re-login after `JWT_ACCESS_SECRET` changes

### Phase E — Safe cleanup (optional, after backup)

14. Remove `packages/config/redis.old.ts`
15. Archive audit markdown files to `docs/audits/`
16. Run `pnpm db:generate` to refresh Prisma clients

### Phase F — Next stabilization task (from product audit)

17. **BUG-002** — already addressed (revision workflow)
18. Align backend `countCurrentReadyDeliverables` with version+round logic (RES-001)
19. Client status label pass

---

## 10. Quick Reference — Stable Local Dev

```bash
# 1. Infra
docker compose -f infrastructure/docker-compose.yml up -d postgres redis

# 2. DB
pnpm db:generate
pnpm db:migrate

# 3. Services (separate terminals OR fix package.json ports first)
pnpm dev:api      # → localhost:5000
pnpm dev:web      # → should be localhost:3000
pnpm dev:admin    # → should be localhost:3001

# 4. Verify
curl http://localhost:5000/health
```

**Until port flags are added**, run only one of web/admin at a time, or accept port lottery.

---

## 11. Production Readiness (Dev Environment)

| Area | Score | Notes |
|------|-------|-------|
| Port configuration (local) | 3/10 | Race on `pnpm dev` |
| Port configuration (Docker) | 9/10 | Correct |
| Env documentation | 6/10 | Gaps and duplicates |
| Auth reliability | 7/10 | JWT works; 15m expiry surprises users |
| Turbopack stability (admin) | 5/10 | Monorepo root risk |
| Startup predictability | 5/10 | Parallel without ordering |

**Dev environment stabilization priority:** Fix ports in `package.json` before any further feature work.

---

*Audit completed without code changes, file deletions, or database modifications.*
