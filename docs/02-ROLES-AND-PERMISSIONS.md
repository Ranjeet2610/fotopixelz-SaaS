# Roles & Permissions

## Roles that actually exist
From `UserRole` (`prisma/schema.prisma`) and `packages/auth/roles.ts`: **`CLIENT`, `EDITOR`, `QA`, `ADMIN`, `SUPER_ADMIN`**. A second, separate enum `MembershipRole` (`OWNER`, `ADMIN`, `CLIENT`, `EDITOR`, `QA`, `SUPER_ADMIN`) exists on the `Membership` join table — its practical distinction from `User.role` was not fully reconciled in this pass (see `docs/05-ORGANIZATIONS.md`).

## Two permission systems exist — only one is actually enforced

`packages/auth/permissions.ts` defines a fine-grained permission system: `PERMISSION_GROUPS` (orders, uploads, assets, editing, qa, payments, admin, analytics, settings — each with specific permission strings like `orders:create`) and `ROLE_PERMISSIONS` mapping each role to its allowed permissions. `packages/auth/guards.ts` exports `hasPermission`/`requirePermission` to check against it.

**Finding, verified by direct repo-wide search:** `requirePermission`/`hasPermission` are **never called anywhere in `services/api/src/**`.** This entire permission-group system is defined, exported from `packages/auth`, and then not used by a single route or service function in the codebase.

**What is actually enforced instead:** `requireAuth` (JWT verification middleware) + `requireAdmin` (role check for `ADMIN`/`SUPER_ADMIN`) + `requireRole(role, allowedRoles[])` calls made directly inside individual service functions (e.g. `orders.service.ts`'s `CREATE_ROLES`, `CLIENT_STATUS_UPDATES`, `EDITOR_STATUS_UPDATES`, `QA_STATUS_UPDATES` constants, and `admin.permissions.ts`'s bespoke tiered-admin logic). Authorization is real and consistently applied — it is just done via **ad hoc per-module role lists and inline logic**, not the shared `PERMISSION_GROUPS` abstraction that exists to do exactly this.

This means: **the permission-group system in `packages/auth/permissions.ts` should be treated as dead/aspirational code, not a description of actual enforcement.** Do not use it as a reference for "what a role can do" — use the module docs (`docs/03`–`docs/19`) and the matrix below, which reflect what is actually checked in each service function.

## Frontend permission checks vs backend enforcement

**Frontend checks are UX-only and not authoritative:**
- `apps/client`'s `ClientShell` blocks staff roles and gates dashboard paths client-side (`isClientRole`, `canAccessDashboardPath` in `apps/client/src/lib/access-control.ts`).
- `apps/admin` has its own separate `access-control.ts`-equivalent (not re-read line-by-line this pass) gating admin routes by role.
- Neither of these prevents a determined client from calling the API directly with a valid token for a different role — they only shape which UI is shown.

**Backend enforcement is authoritative** and, per the module docs, is genuinely present at the service-function level (not just route-level `requireAuth`/`requireAdmin`) for every COMPLETE module — e.g. `orders.service.ts`'s `ensureCanUpdateStatus`, `ensureCanViewOrder`, `assertAllowedStatusTransition`, and `admin.permissions.ts`'s tiered checks all run server-side regardless of what the frontend shows.

## Permission matrix

Legend: **YES** = enforced server-side and confirmed by direct code inspection. **PARTIAL** = enforced for some actions/paths but not all, or enforcement exists only client-side. **NOT ENFORCED** = no server-side check found (module is a stub, or the action doesn't exist). **N/A** = role has no defined interaction with this module.

| Module | CLIENT | ADMIN | SUPER_ADMIN | EDITOR | QA |
|---|---|---|---|---|---|
| Authentication (own account) | YES | YES | YES | YES | YES |
| Users (own profile/billing) | YES | YES | YES | YES | YES |
| Organizations (own org, membership-gated) | YES | YES (all orgs) | YES (all orgs) | N/A | N/A |
| Catalog (read) | YES (public, no role needed) | YES | YES | N/A | N/A |
| Catalog (write) | NOT ENFORCED (blocked) | YES | YES | NOT ENFORCED (blocked) | NOT ENFORCED (blocked) |
| Pricing (quote) | YES (own org) | YES | YES | N/A | N/A |
| Orders — create | YES | YES | YES | NOT ENFORCED (blocked — not in `CREATE_ROLES`) | NOT ENFORCED (blocked) |
| Orders — view | YES (own org only) | YES (all) | YES (all) | YES (assigned only) | YES (assigned only) |
| Orders — status transitions | PARTIAL (pre-upload statuses only, own org) | YES (any transition, admin override) | YES | PARTIAL (`ASSIGNED→IN_PROGRESS→READY_FOR_QA`, assigned orders only) | PARTIAL (`READY_FOR_QA→DELIVERED/REVISION_REQUIRED`, assigned orders only) |
| Orders — assign editor/QA | NOT ENFORCED (blocked) | YES | YES | NOT ENFORCED (blocked) | NOT ENFORCED (blocked) |
| Orders — request revision | NOT ENFORCED (blocked) | N/A (uses status-update path instead) | N/A | NOT ENFORCED (blocked) | YES (assigned QA only) |
| Uploads (own org's orders) | YES | YES | YES | PARTIAL (not the primary confirmed actor; not explicitly blocked either — not individually re-verified) | PARTIAL (same) |
| Assets — read (own delivered orders) | YES (delivered only) | YES | YES | YES (assigned) | YES (assigned) |
| Assets — upload deliverable | NOT ENFORCED (blocked) | YES | YES | YES (primary actor) | N/A |
| Admin — staff/user management | NOT ENFORCED (blocked) | PARTIAL (tiered — cannot touch SUPER_ADMIN) | YES (full) | NOT ENFORCED (blocked) | NOT ENFORCED (blocked) |
| Editing (dedicated module) | NOT ENFORCED (module is a stub — nothing to enforce) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) |
| QA (dedicated module) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) |
| Revisions (dedicated module) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) |
| Payments (dedicated module) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) |
| Notifications (list/read) | NOT ENFORCED (no route exists at all — not even for the module's "owner" case) | NOT ENFORCED (same) | NOT ENFORCED (same) | NOT ENFORCED (same) | NOT ENFORCED (same) |
| Analytics | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) |
| AI | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) | NOT ENFORCED (stub) |

## Key findings
1. **A complete, well-designed fine-grained permission system exists in `packages/auth/permissions.ts` and is entirely unused.** This is worth flagging to engineering leadership as either (a) dead code to remove, or (b) a refactor target to actually adopt in place of the current ad hoc per-module role-list pattern, which works but duplicates logic across `orders.service.ts`, `admin.permissions.ts`, etc.
2. **`ADMIN` vs `SUPER_ADMIN` tiering is only meaningfully enforced in the `admin` module** (staff/user management) — elsewhere in the codebase (`orders`, `organizations`, catalog writes), `ADMIN` and `SUPER_ADMIN` are treated identically (`ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN']` checked as a pair, not distinguished).
3. **`EDITOR`/`QA` role checks are consistently assignment-scoped** (`order.assignedEditorId === context.userId`), not blanket role-based — a real, correctly-implemented least-privilege pattern for those two roles specifically.

## Target
Not established in current codebase — no document commits to migrating from ad hoc role checks to the `PERMISSION_GROUPS` system, despite the latter existing.

## Gap
Either retire `packages/auth/permissions.ts`'s unused permission-group system, or adopt it — its current state (fully built, zero call sites) is itself worth resolving one way or the other.
