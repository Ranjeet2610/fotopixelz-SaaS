# Revisions

## Purpose
The `Revision` Prisma model and `revisions` API module suggest a first-class revision-request tracking system, distinct from the order-level revision loop that actually runs today.

## Users / Roles
Not established — no working code exists to determine actual role interaction beyond the model's `requestedById` field.

## Current Implementation
**Scaffolding exists but production workflow is not implemented.** `services/api/src/modules/revisions/revisions.service.ts` contains exactly one function: `getRevisionsStatus()` returning `{ module: 'revisions', status: 'placeholder' }`. `revisions.routes.ts` exposes only `GET /revisions/health`.

## Frontend
No frontend was found consuming a `revisions`-module endpoint. The actual client-visible and QA-triggered revision flow goes through `orders` (`POST /orders/request-revision`, `PATCH /orders/status` with `REVISION_REQUIRED`) — documented fully in `docs/08-ORDERS.md`.

## Backend
`services/api/src/modules/revisions/` — controller/routes/service (placeholder)/types/validator present but unused beyond the health check.

## Database
`Revision` model exists (`orderId`, `requestedById`, `reason`, `status` enum `REQUESTED/IN_PROGRESS/RESOLVED/REJECTED`) but is **not written to or read from** by `orders.service.ts`'s actual revision logic. The real revision request is represented via `Order.status = REVISION_REQUIRED` + `Order.reviewRound` increment + a `WorkflowEvent` (`REVISION_REQUESTED`) + an `OrderComment` (type `REVISION`, carrying the title/comment/attachment) — confirmed directly in `requestOrderRevision()` and the `REVISION_REQUIRED` branch of `updateOrderStatus()`.

## APIs
Only `GET /revisions/health`.

## Business Rules
None implemented in this module. Actual revision business rules (who can request, required fields, effect on assets/order status) live in `orders.service.ts` — see `docs/08-ORDERS.md`.

## Workflow
None implemented in this module. The real revision workflow is fully documented in `docs/08-ORDERS.md`'s order state machine.

## Permissions
N/A — no functional endpoints beyond health check.

## Validation
N/A.

## Error Handling
N/A.

## Dependencies
N/A.

## Current Status
**STUB** as a standalone module. The revision *capability* itself is real and working, but it is implemented inside `orders`, not this module.

## Known Limitations
`Revision` model is unused dead schema by current code paths — every actual revision is represented as order-status history + comments, not a queryable `Revision` row with its own lifecycle (`REQUESTED→IN_PROGRESS→RESOLVED/REJECTED`). This means there is currently no way to query "all open revision requests" as a first-class list — one would have to derive it from `Order.status = REVISION_REQUIRED` plus filtering `OrderComment`/`WorkflowEvent`.

## Target
Not established in current codebase.

## Gap
If a first-class, independently-lifecycled revision record is an intended direction, the `Revision` model exists but nothing populates it — this is the same pattern observed in `docs/12-QA.md` and `docs/11-EDITING-WORKFLOW.md`.
