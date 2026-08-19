# Pricing

## Purpose
Calculate a price quote from selected services + quantities + addons, and produce the order's actual billable total at submission time based on uploaded images. **This is per-image, service-based pricing — there is no subscription/tier pricing model in the codebase.**

## Users / Roles
Any authenticated user building an order quote (`POST /pricing/quote`); admins can override totals manually.

## Current Implementation
Real implementation. `services/api/src/modules/pricing/pricing.service.ts` → `buildQuote()`, consumed by `orders.service.ts` at order creation/update, and separately re-derived at order submission via `order-billing.ts`.

## Frontend
- `apps/client/src/components/order-wizard/order-wizard.tsx` step 4 ("Quote review") calls `POST /pricing/quote` live.
- `apps/client/src/components/order-upload/order-upload-panel.tsx` shows a **second**, upload-time billing summary (`calculateOrderBilling`/`buildSubmittedOrderBilling` in `apps/client/src/lib/order-billing.ts`) — this is the client-side mirror of the server's submission-time billing recalculation.
- `apps/client/src/app/pricing/page.tsx` shows static base prices (no live quote — quoting requires an authenticated org context).

## Backend
`services/api/src/modules/pricing/` (`buildQuote`), `services/api/src/modules/orders/order-billing.ts` (`calculateOrderBilling` — submission-time recalculation based on actual uploaded image count and available credits).

## Database
Reads `Service.basePrice`, `Addon.price`/`pricingType`/`credits`; writes `Order.totalAmount`, `OrderItem.unitPrice`/`subtotal`, `OrderAddon.unitPrice`/`subtotal`/`credits`, and `Organization.usedImageCredits`.

## APIs
`POST /pricing/quote` — **requires auth** (organization context needed); not usable by anonymous visitors, which is why the public `/pricing` page shows static base prices only, not a live quote.

## Business Rules
Traced pipeline: **Service → Quantity → Addons → Quote → Order**
1. For each selected service line: `unitPrice = explicit override (admin only) ?? service.basePrice`; `subtotal = unitPrice × quantity`.
2. `totalImageCount` = sum of all service line quantities.
3. For each addon: if `PER_IMAGE`, quantity defaults to `totalImageCount` (or an explicit override); if `FIXED`, quantity defaults to 1. `subtotal` computed accordingly; `credits` scale with quantity for `PER_IMAGE` addons.
4. `grandTotal` = services subtotal + addons subtotal, **unless** an admin explicitly supplies a manual total (`allowManualPricing` + `manualTotalAmount`, admin-only escape hatch).
5. **At order creation**, this quote becomes the order's initial `totalAmount`/`totalImages`/`creditsUsed`.
6. **At order submission** (`submitOrder` in `orders.service.ts`), billing is **recalculated from the actual uploaded image count**, not the original estimate — `calculateOrderBilling` compares `uploadedImages` against `availableCredits` (org's `freeImageCredits − usedImageCredits`) to determine `freeCreditsUsed`, `billableImages`, and `amountDue`. The organization's `usedImageCredits` is incremented by `freeCreditsUsed` in the same transaction.
7. This means **the price a client sees during order creation is an estimate; the final bill is driven by images actually uploaded**, explicitly surfaced to the client as "Billing is based on uploaded images only" in the upload panel UI.

## Workflow
See numbered rules above — this module has no independent workflow beyond being invoked by `orders`.

## Permissions
`POST /pricing/quote` requires authentication. Manual total override requires `ADMIN`/`SUPER_ADMIN`.

## Validation
Zod validators in `pricing.validator.ts` (not individually enumerated this pass); service/addon existence and active status are enforced (`AppError(404, ...)` on unresolvable ids).

## Error Handling
`AppError(404, 'Service not found: <id>')` / `AppError(404, 'Addon not found: <id>')` for invalid catalog references; `AppError(400, ...)` for `PER_IMAGE` addons requested with no derivable quantity.

## Dependencies
`services`/`addons`/`categories` (catalog data), `organizations` (credit balance, org-scoped services), `orders` (both consumer and re-invoker at submission).

## Current Status
**COMPLETE** — this is one of the most thoroughly implemented modules in the codebase: real per-image pricing, real addon logic, real credit consumption, and a documented two-stage estimate→actual billing model.

## Known Limitations
- No live quoting available to anonymous/logged-out visitors (by design — requires an org context); the public `/pricing` page therefore shows base prices only, not a computed total.
- No visible discounting/coupon/tiered-volume-pricing logic beyond flat per-unit pricing and free image credits.

## Target
Not established in current codebase beyond what's implemented.

## Gap
None identified for the currently-scoped per-service pricing model.
