# Organizations

## Purpose
Represents a client workspace/tenant. All orders, services (when org-scoped), and invoices are organization-scoped. Staff (admin) manage organizations and their memberships directly.

## Users / Roles
`CLIENT` users belong to organizations via `Membership` (role: `OWNER`, `ADMIN`, `CLIENT`, `EDITOR`, `QA`, or `SUPER_ADMIN` per the `MembershipRole` enum — note this enum allows staff-style roles at the membership level too, distinct from the global `User.role`). Staff (`ADMIN`/`SUPER_ADMIN`) manage all organizations via the admin app.

## Current Implementation
Real implementation. `organizations.service.ts`: `listOrganizations`, `getOrganization`, `createOrganization`, `updateOrganization`, `deleteOrganization`, `listMemberships`, `createMembership`, `updateMembership`, `deleteMembership` — all Prisma-connected.

## Frontend
- `apps/client/src/components/organization-provider.tsx` — wraps the client dashboard, loads the current user's organization/workspace context, exposes `getCreditsRemaining`, `getTrialDaysRemaining`, `isDemoTrialAccount` (`apps/client/src/lib/workspace.ts`).
- `apps/admin/src/components/organizations-page.tsx`, `apps/admin/src/app/admin/organizations/page.tsx`.

## Backend
`services/api/src/modules/organizations/`.

## Database
`Organization` (name, slug, isActive, plan `DEMO`, subscriptionStatus, trialEndsAt, freeImageCredits, usedImageCredits), `Membership` (userId + organizationId + role, unique per user/org pair).

## APIs
`GET/POST /organizations`, `GET/PATCH/DELETE /organizations/:organizationId`, `GET/POST /organizations/:organizationId/memberships`, `PATCH/DELETE /organizations/:organizationId/memberships/:membershipId`. All require `requireAuth`.

## Business Rules
- **Every new client registration auto-creates exactly one organization**, with the registering user as `OWNER` (see `docs/03-AUTHENTICATION.md` → `client-workspace-bootstrap.ts`). This is currently the only observed organization-creation path for clients; the generic `POST /organizations` endpoint exists but its actual usage (self-serve vs admin-only) was not traced further in this pass.
- New client organizations get `plan: DEMO`, `subscriptionStatus: TRIAL`, a trial end date, and a starting free-image-credit balance (constant defined in `client-workspace.ts`).
- Organization access for non-admin roles is enforced via `Membership` lookup (`ensureOrganizationAccess` in `orders.service.ts` — see `docs/08-ORDERS.md`), not by role alone.
- Free image credits are consumed at order-submission time based on uploaded image count (see `docs/07-PRICING.md` and `docs/08-ORDERS.md`).

## Workflow
1. Organization created automatically at client registration (current dominant path), or explicitly via `POST /organizations` (admin/other path, not fully traced).
2. Memberships added/removed via `POST`/`PATCH`/`DELETE /organizations/:id/memberships`, enabling team members to join a workspace with a specific `MembershipRole`.
3. Client-side, `OrganizationProvider` loads the active organization for the logged-in user and exposes demo/trial/credit state to dashboard UI.

## Permissions
Non-admin: must have a `Membership` in the target organization to view/act (per `ensureOrganizationAccess` pattern reused across modules). Admin (`ADMIN`/`SUPER_ADMIN`): unrestricted.

## Validation
Zod validators in `organizations.validator.ts` (not individually enumerated this pass).

## Error Handling
`AppError(403, 'Forbidden')` for non-members; `AppError(404, ...)` for missing/inactive organizations — pattern confirmed via reuse in `orders.service.ts`.

## Dependencies
`auth` module (membership creation on registration), `orders` module (org-scoped order access), `pricing`/`services` (org-scoped service overrides via `Service.organizationId`).

## Current Status
**COMPLETE** for the currently-used path (one org per client, membership-gated access). Multi-member team workflows (invite flow, membership role UI) exist at the API level but were not confirmed to have client-facing UI in this pass.

## Known Limitations
- No client-facing "invite teammate" UI confirmed in `apps/client` (membership CRUD endpoints exist server-side; a corresponding client UI was not found in this pass).
- Relationship between `MembershipRole` (org-scoped) and `UserRole` (global) is not fully documented — both exist and both include overlapping values (`CLIENT`, `EDITOR`, `QA`, `ADMIN`, `SUPER_ADMIN`), which could be a source of confusion without a clearer written model.

## Target
Not established in current codebase beyond what's implemented.

## Gap
Client-facing team/membership management UI (if intended) is not confirmed to exist.
