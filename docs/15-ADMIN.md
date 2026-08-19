# Admin

## Purpose
Internal operations surface for staff (`ADMIN`, `SUPER_ADMIN`, and by extension `EDITOR`/`QA` via their order-scoped permissions elsewhere) — staff/user management, plus the broader admin console covering orders, catalog, organizations, and clients (those areas are documented in their own module docs; this document covers the `admin` module itself, i.e. staff/user management).

## Users / Roles
`ADMIN`, `SUPER_ADMIN` only (`requireAdmin` middleware on all non-health routes). Role-tiered permissions between `ADMIN` and `SUPER_ADMIN` are explicitly enforced (see Business Rules).

## Current Implementation
Real implementation. `admin.service.ts`: `listUsers`, `createStaffUser`, `getUserById`, `updateUserById`, `updateUserRole`, `updateUserStatus`, `softDeleteUser` — all Prisma-connected, with dedicated role-based authorization logic in `admin.permissions.ts`.

## Frontend
`apps/admin/src/app/admin/{page,orders,clients,organizations,services,categories,addons,editors,users,qa,assets,uploads,profile,settings}/page.tsx` and corresponding components (`apps/admin/src/components/*`) — `dashboard-overview.tsx`, `orders-page.tsx`, `organizations-page.tsx`, `people-page.tsx`, `catalog-page.tsx`, `settings-page.tsx`, `profile-page.tsx`.

## Backend
`services/api/src/modules/admin/`: `admin.controller.ts`, `admin.routes.ts`, `admin.service.ts`, `admin.permissions.ts`, `admin.types.ts`, `admin.validator.ts`.

## Database
Operates on `User` (role, isActive, and general profile fields) — no dedicated "admin" model; this module manages the existing `User` table with elevated authorization.

## APIs
`GET /admin/health` (public), then under `requireAuth` + `requireAdmin`: `POST /admin/users` (create staff), `GET /admin/users`, `GET /admin/users/editors`, `GET /admin/users/qa`, `GET /admin/users/clients`, `GET/PATCH/DELETE /admin/users/:id`, `PATCH /admin/users/:id/role`, `PATCH /admin/users/:id/status`.

## Business Rules — verified in `admin.permissions.ts`
- An admin can never view or manage **themselves** through this module (`assertCanViewUser`/`assertNotSelfAction` reject self-targeting).
- Plain `ADMIN` cannot view or manage a `SUPER_ADMIN` user.
- `SUPER_ADMIN` can create staff with role `SUPER_ADMIN`, `ADMIN`, `EDITOR`, or `QA`.
- Plain `ADMIN` can only create staff with role `EDITOR`, `QA`, or `CLIENT` — **cannot create another `ADMIN` or `SUPER_ADMIN`**.
- When assigning a role to an existing user: `SUPER_ADMIN` may assign any role; plain `ADMIN` cannot assign `SUPER_ADMIN` and can only assign roles within `ADMIN`-manageable set (`ADMIN`, `EDITOR`, `QA`, `CLIENT`).
- `listUsersVisibilityFilter` hides `SUPER_ADMIN` users from plain `ADMIN`'s user list entirely (not just blocked from managing — not shown at all).

## Workflow
1. `SUPER_ADMIN`/`ADMIN` browses `/admin/users` (filtered by the visibility rules above).
2. Creates staff accounts (`createStaffUser`) with a role-appropriate ceiling.
3. Edits user profile, role, or active status; soft-deletes if needed.
4. Broader admin console (orders/catalog/organizations/clients) uses their respective modules' own APIs (`orders`, `services`/`categories`/`addons`, `organizations`) — documented in those modules' docs, all confirmed real/connected.

## Permissions
See Business Rules — the tiered `ADMIN` vs `SUPER_ADMIN` model is genuinely enforced server-side, not just hidden in the UI.

## Validation
Zod validators in `admin.validator.ts` (not individually enumerated this pass).

## Error Handling
`AppError(403, 'Forbidden')` used consistently for every permission boundary above.

## Dependencies
`orders`, `organizations`, `services`/`categories`/`addons` modules for the rest of the admin console's data; `auth` module (`requireAdmin`) for gating.

## Current Status
**COMPLETE** for staff/user management. The broader admin console (orders, catalog, organizations, clients) is also real per their respective module docs — this pass did not find fabricated/mock data anywhere in the admin app's data-fetching code.

## Known Limitations
- Admin app has its own separate design system from the client app (`docs/01-ARCHITECTURE.md`) — not a functional limitation, but a consistency one.
- A distinct "roles/permissions" management **UI surface** (as opposed to per-user role assignment) was not confirmed as a separate screen — role assignment happens per-user via `/admin/users`.

## Target
Not established in current codebase beyond what's implemented.

## Gap
None functional identified for this module in this pass.
