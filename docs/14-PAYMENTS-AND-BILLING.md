# Payments & Billing

## Purpose
The `Payment`/`Invoice` Prisma models and `payments` API module suggest a payment-capture and invoicing system. Stripe integration scaffolding is present.

## Users / Roles
Not established — no working code exists to determine actual role interaction.

## Current Implementation
**Scaffolding exists but production workflow is not implemented.** `services/api/src/modules/payments/payments.service.ts` contains exactly one function: `getPaymentsStatus()` returning `{ module: 'payments', status: 'placeholder' }`. `payments.routes.ts` exposes only `GET /payments/health`. A Stripe client exists (`services/api/src/integrations/stripe/client.ts`) but no traced code path in `orders`/`payments` calls it. `apps/workers/src/processors/payment-webhook.processor.ts` exists but — consistent with all other worker processors — is a placeholder stub, not a working webhook handler.

## Frontend
`apps/client/src/app/dashboard/billing/page.tsx` is a placeholder stub page (confirmed in the prior UI review pass) — no billing UI is connected to any API. The order-upload panel does surface a computed "amount due" and a note that "online payment will be available soon" (`apps/client/src/components/order-upload/order-upload-panel.tsx`), which is an honest, accurate in-product statement of current capability — not a working payment collection UI.

## Backend
`services/api/src/modules/payments/` — controller/routes/service (placeholder)/types/validator present but unused beyond the health check. `STRIPE_SECRET_KEY` env var is defined (`services/api/src/config/env.ts`) but not confirmed to be consumed by any working payment-capture path.

## Database
`Payment` (orderId, amount, currency, status enum `PENDING/AUTHORIZED/PAID/FAILED/REFUNDED/PARTIALLY_REFUNDED`, provider, providerRef), `Invoice` (organizationId, orderId unique, invoiceNumber unique, subtotal/tax/total, paidAt) — both models exist but are **not written to or read from** by any traced order-lifecycle code in this pass.

## APIs
Only `GET /payments/health`.

## Business Rules
None implemented for actual payment capture. **Billing calculation** (how much is owed) is fully implemented — see `docs/07-PRICING.md` and `docs/08-ORDERS.md` (`order-billing.ts`) — but that is distinct from actually **collecting** payment, which does not exist.

## Workflow
1. Order billing amount (`amountDue`) is correctly calculated at submission time (real, working — see `docs/07-PRICING.md`).
2. Client sees the amount due and a "payment required" notice in the order-upload panel.
3. **No further step exists** — no checkout flow, no Stripe payment intent creation, no invoice generation, no payment confirmation recorded against `Payment`/`Invoice`.

## Permissions
N/A — no functional endpoints beyond health check.

## Validation
N/A.

## Error Handling
N/A.

## Dependencies
Depends on `orders`/`pricing` for the amount-due calculation it would need to consume once built.

## Current Status
**STUB** for actual payment processing. **PARTIAL/COMPLETE** for the underlying billing *calculation* the UI already surfaces honestly.

## Known Limitations
No payment collection mechanism exists end-to-end despite Stripe client scaffolding and a defined `STRIPE_SECRET_KEY` env var. `Payment`/`Invoice` models are unused dead schema. `apps/workers`'s `payment-webhook.processor.ts` cannot process real Stripe webhooks (placeholder logic only).

## Target
Not established as a committed, dated plan in this pass — the presence of Stripe client scaffolding, a `Payment`/`Invoice` schema, and a `payment-webhook` queue name in `apps/workers/src/queues/registry.ts` indicate payment collection is an intended future capability, but no implementation timeline or design doc was found.

## Gap
The entire payment-collection path: Stripe checkout/payment-intent creation, webhook handling, `Payment`/`Invoice` persistence, and a real client-facing billing/payment UI (current `/dashboard/billing` is a stub).
