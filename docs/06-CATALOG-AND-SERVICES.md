# Catalog & Services (Categories, Services, Addons)

## Purpose
Defines what Fotopixelz sells: service categories (e.g. Background Removal, Ghost Mannequin), individual priced services within each category, and optional addons — the basis for order pricing.

## Users / Roles
Public/anonymous visitors and clients read the catalog (public GET endpoints); admins manage it (`requireAuth` + `requireAdmin` for writes).

## Current Implementation
Real, functioning implementation, verified directly in this and the prior Services/Pricing engagement pass. Not scaffolding.

## Frontend
- Public marketing: `apps/client/src/app/services/page.tsx`, `apps/client/src/app/services/[7 fixed slugs]/page.tsx`, `apps/client/src/app/pricing/page.tsx`, via `apps/client/src/lib/service-catalog.ts` (`useCatalogData` hook) and `apps/client/src/components/marketing/*`.
- Order creation: `apps/client/src/components/order-wizard/order-wizard.tsx` (category → service → addon selection).
- Admin: `apps/admin/src/components/catalog-page.tsx` (categories/services/addons management), routes `/admin/categories`, `/admin/services`, `/admin/addons`.

## Backend
`services/api/src/modules/categories/`, `services/api/src/modules/services/`, `services/api/src/modules/addons/` — each with controller/routes/service/types/validator.

## Database
- `ServiceCategory` (id, name, slug unique, description)
- `Service` (id, categoryId, organizationId nullable, name, slug unique, description, basePrice, isActive)
- `Addon` (id, name, slug unique, description, price, pricingType `FIXED`|`PER_IMAGE`, credits, isActive)

## APIs
- `GET /categories`, `GET /categories/:id` — **public**; `POST/PATCH/DELETE` require auth+admin.
- `GET /services`, `GET /services/:id` — **public**, server-side filters to `isActive: true` unless `includeInactive` is passed (write ops require admin, which is the only path that can pass it); supports `categoryId`, `organizationId`, `scope`, `q` filters; `POST/PATCH/DELETE` require auth+admin.
- `GET /addons`, `GET /addons/:id` — **public**; `POST/PATCH/DELETE` require auth+admin.

## Business Rules
- **Inactive services are never exposed publicly** — `listServices`/`getServiceById` filter `isActive: true` by default; only an admin-authorized `includeInactive` request bypasses this.
- A `Service` may be global (`organizationId: null`) or organization-specific (an override/custom service scoped to one org) — `pricing.service.ts`'s `resolveServiceLines` matches services where `organizationId` is `null` OR equals the requesting organization.
- Addon pricing is either `FIXED` (flat price regardless of quantity) or `PER_IMAGE` (multiplied by image count — defaults to total service image quantity if no explicit addon quantity is given).
- Category/service/addon slugs are unique but **not guaranteed to match the client app's fixed 7 marketing route slugs** — the client maintains its own route→category slug mapping (`apps/client/src/lib/service-catalog.ts`), independent of the database.

## Workflow
1. Admin creates/edits categories, services (with `basePrice`), and addons via the admin app.
2. Public visitors browse `/services` and `/pricing` (client app) — real API data, no fabricated pricing.
3. During order creation, the wizard loads categories → services (filtered by category + org) → addons, then requests a live quote (see `docs/07-PRICING.md`).

## Permissions
Read: public/anonymous. Write: `ADMIN`/`SUPER_ADMIN` only (`requireAdmin`).

## Validation
Zod schemas in each module's `.validator.ts` (e.g. `listServicesQuerySchema` enforces `page`, `limit` ≤ 100, optional `categoryId`/`organizationId`/`scope`/`includeInactive`/`q`).

## Error Handling
Standard `AppError` pattern; `AppError(404, ...)` for missing category/service/addon references (e.g. `pricing.service.ts` throws `Service not found: <id>` if a submitted service id doesn't resolve).

## Dependencies
`pricing` module (quote calculation reads catalog data directly), `orders` module (order line items reference `Service`/`Addon` by id), `organizations` (org-scoped service overrides).

## Current Status
**COMPLETE** — public browsing, admin CRUD, and order-time consumption are all real and connected.

## Known Limitations
- No marketing-content fields on `Service`/`ServiceCategory` (images, long-form descriptions, before/after galleries) — current public pages use only name/slug/description/basePrice.
- The client app's 7 fixed marketing routes are not guaranteed to have a matching database category; unmatched routes render a real "coming soon" empty state rather than fabricated content (by design, from the Services & Pricing V1 work).

## Target
Not established in current codebase beyond what's implemented, aside from the general CLAUDE.md direction that `apps/web`/marketing content is a deferred future scope.

## Gap
Richer marketing content (images, FAQs) would require new schema fields or a separate static content source — not present today.
