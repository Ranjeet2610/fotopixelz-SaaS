# Users

## Purpose
Manage the authenticated user's own profile, billing profile, and image-credit visibility; separately, admin-side user management (creation, role assignment) lives in the `admin` module (see `docs/15-ADMIN.md`), not here.

## Users / Roles
Every `User` has one `UserRole`: `CLIENT`, `EDITOR`, `QA`, `ADMIN`, `SUPER_ADMIN`. This module (`services/api/src/modules/users`) is scoped to self-service ("me") operations, usable by any authenticated role.

## Current Implementation
Real implementation. `users.service.ts` exports `getMe`, `updateMe`, `getMyBilling`, `updateMyBilling`, `getMyCredits` — all connected to Prisma (`User`, `UserBillingProfile`, and organization credit fields for `getMyCredits`).

## Frontend
No dedicated "profile" page was confirmed in `apps/client` in this pass (`/dashboard/settings` is a stub — see `docs/01-ARCHITECTURE.md`). `apps/admin/src/app/admin/profile/page.tsx` exists for staff self-profile.

## Backend
`services/api/src/modules/users/`: `users.controller.ts`, `users.routes.ts`, `users.service.ts`, `users.types.ts`, `users.validator.ts`.

## Database
`User`, `UserBillingProfile` (1:1 with `User` — companyName, address, city, country, postalCode, taxId). Credits are read from `Organization.freeImageCredits`/`usedImageCredits`, not a per-user field.

## APIs
Endpoint paths not individually enumerated this pass (deferred to API-level documentation pass); service functions confirm `GET`/`PATCH` "me" and "billing" operations exist, plus a credits read.

## Business Rules
- `updateMyBilling` operates on `UserBillingProfile`, distinct from `Organization`-level billing — the exact intended relationship between per-user billing profile and per-org invoicing is not established in this pass.
- `getMyCredits` surfaces organization-level credits (not user-level), implying credits are pooled per organization, consistent with `Organization.freeImageCredits`/`usedImageCredits` used in the order-submission billing calculation (see `docs/08-ORDERS.md`).

## Workflow
1. Authenticated user requests `getMe` → profile returned.
2. User may `updateMe` (name, etc. — fields not individually enumerated this pass).
3. User may view/update billing profile independently of organization billing.
4. User may view remaining organization image credits.

## Permissions
Self-service only — no evidence in this pass of one user managing another user's profile through this module (that is the `admin` module's responsibility).

## Validation
Zod validators in `users.validator.ts` (not individually enumerated this pass).

## Error Handling
Standard `AppError` → `error-handler.ts` pattern, consistent with other modules.

## Dependencies
`Organization` (for credits), `auth` module (identity), `admin` module (cross-user management).

## Current Status
**PARTIAL** — the "me"/billing-profile/credits service functions are real and Prisma-connected, but no client-facing UI route was confirmed to consume `updateMe`/`updateMyBilling` in this pass (`/dashboard/settings` and `/dashboard/billing` are stubs). Backend exists; frontend consumption is unverified/likely missing.

## Known Limitations
- No confirmed client UI currently calls these endpoints.
- Relationship between `UserBillingProfile` and `Organization`-level `Invoice` is not established in this pass.

## Target
Not established in current codebase.

## Gap
Client-side settings/billing UI to actually surface and edit this data (client `/dashboard/settings`, `/dashboard/billing` are currently stub pages per `docs/01-ARCHITECTURE.md`).
