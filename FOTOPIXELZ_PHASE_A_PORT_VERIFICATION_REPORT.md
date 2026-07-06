# Fotopixelz — Phase A Port Stabilization Verification Report

**Date:** June 6, 2026  
**Scope:** Port pinning only — no other audit recommendations applied

---

## Summary

| Item | Status |
|------|--------|
| Web pinned to 3000 | ✅ Implemented |
| Admin pinned to 3001 | ✅ Implemented |
| Root scripts unchanged | ✅ Verified |
| Other modules touched | ❌ None |

---

## Before

### Problem

Both `apps/web` and `apps/admin` used:

```json
"dev": "next dev"
```

Next.js defaults to port **3000**. When `pnpm dev` ran all workspace `dev` scripts in parallel:

1. Web and Admin raced for port 3000
2. First process bound 3000; second auto-incremented to 3001
3. **Winner was non-deterministic** — ports swapped between sessions

### Symptom

- Admin sometimes on 3000, web on 3001
- Bookmarks and muscle memory broke
- Appeared related to login/redirect issues (wrong app on wrong port)

---

## After

### Behavior

| App | Port | Dev command |
|-----|------|-------------|
| **Web** | **3000** (fixed) | `next dev -p 3000` |
| **Admin** | **3001** (fixed) | `next dev -p 3001` |
| API | 5000 (unchanged) | `tsx watch src/server.ts` |
| Workers | N/A (unchanged) | `tsx watch src/index.ts` |

Parallel `pnpm dev` no longer causes web/admin port swap — each app requests an explicit port.

### Root scripts (unchanged, still valid)

| Script | Behavior |
|--------|----------|
| `pnpm dev` | `pnpm -r --parallel run dev` → all packages; web 3000, admin 3001 |
| `pnpm dev:web` | `pnpm --filter web run dev` → port 3000 |
| `pnpm dev:admin` | `pnpm --filter admin run dev` → port 3001 |
| `pnpm dev:api` | Unchanged |
| `pnpm dev:workers` | Unchanged |

### Script resolution check

`pnpm --filter web run dev` resolves to:

```
next dev -p 3000
```

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/package.json` | `"dev": "next dev -p 3000"` |
| `apps/admin/package.json` | `"dev": "next dev -p 3001"` |

**Total:** 2 files, 2 lines.

---

## Files NOT Changed

- `package.json` (root)
- `turbo.json`
- `.env` / `.env.example`
- `apps/*/next.config.ts`
- `infrastructure/docker-compose.yml` (already had correct Docker ports)
- API, workers, Prisma, auth, workflow, comments, QA, orders, notifications

---

## Risk Assessment

| Risk | Level | Notes |
|------|-------|-------|
| Port already in use | Low | If 3000 or 3001 is occupied, Next fails with clear EADDRINUSE — predictable vs silent swap |
| Docker + local conflict | Medium | Running Docker web (3000) + local web still conflicts — use one mode at a time |
| CI/CD impact | None | CI typically uses `build`/`start`, not `dev` |
| Production impact | None | `start` scripts unchanged |
| Windows firewall prompt | Low | First bind may prompt once per port |

---

## Side Effects

| Side effect | Detail |
|-------------|--------|
| **Positive** | Deterministic URLs: web `http://localhost:3000`, admin `http://localhost:3001` |
| **Positive** | `pnpm dev` parallel startup is safe for frontends |
| **Neutral** | If port busy, dev fails instead of silently using 3001 — easier to debug |
| **None** | No auth, API, or database behavior changes |

---

## Manual verification checklist

After pulling this change:

```bash
# Terminal 1
pnpm dev:api
# Expect: API running on port 5000

# Terminal 2
pnpm dev:web
# Expect: Local: http://localhost:3000

# Terminal 3
pnpm dev:admin
# Expect: Local: http://localhost:3001

# Or single command:
pnpm dev
# Expect: web 3000, admin 3001, api 5000 concurrently
```

---

## Production readiness (local dev)

| Criterion | Before | After |
|-----------|--------|-------|
| Web port deterministic | ❌ | ✅ |
| Admin port deterministic | ❌ | ✅ |
| Matches Docker Compose ports | ❌ (local only) | ✅ |
| Matches `.env.example` URLs | ❌ (local only) | ✅ |

**Phase A complete.** Remaining audit items (Turbopack, `.env.example`, cleanup) are **out of scope** for this change.

---

*Verification report only. Implementation limited to port pinning in two `package.json` files.*
