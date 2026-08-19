# Editing Workflow

## Purpose
The `EditingJob` Prisma model and `editing` API module suggest a per-asset editing-job tracking system, distinct from the order-level `assignedEditorId` field.

## Users / Roles
Not established — no working code exists to determine actual role interaction beyond the model's `editorId` field.

## Current Implementation
**Scaffolding exists but production workflow is not implemented.** `services/api/src/modules/editing/editing.service.ts` contains exactly one function: `getEditingStatus()` returning `{ module: 'editing', status: 'placeholder' }`. `editing.routes.ts` exposes only `GET /editing/health` — no create/list/update endpoints exist.

## Frontend
No frontend was found consuming an `editing`-module endpoint. The actual editor-facing production work happens through the `orders` module (`assignEditor`, order status transitions to `IN_PROGRESS`/`READY_FOR_QA`) and `apps/admin/src/components/order-production-workspace.tsx`, not through this module.

## Backend
`services/api/src/modules/editing/` — `editing.controller.ts`, `editing.routes.ts`, `editing.service.ts` (placeholder), `editing.types.ts`, `editing.validator.ts` present but unused beyond the health check.

## Database
`EditingJob` model exists (`assetId`, `editorId`, `status` enum `QUEUED/ASSIGNED/IN_PROGRESS/BLOCKED/QA_PENDING/DONE`, `instructions`) but is **not written to or read from anywhere in the currently traced order/asset workflow** — `orders.service.ts` and `assets.service.ts` do not reference `prisma.editingJob`.

## APIs
Only `GET /editing/health`.

## Business Rules
None implemented.

## Workflow
None implemented. The actual "editing" step of the product is represented entirely by `Order.status = IN_PROGRESS` + `Order.assignedEditorId`, documented in `docs/08-ORDERS.md`.

## Permissions
N/A — no functional endpoints beyond health check.

## Validation
N/A.

## Error Handling
N/A.

## Dependencies
N/A.

## Current Status
**STUB.**

## Known Limitations
Entire module is non-functional beyond a health check. The `EditingJob` model is dead schema — defined but unused by any traced code path.

## Target
Not established in current codebase. `docs/architecture/architecture.md`'s "Next Implementation Phases" lists "replace module placeholders with request/response contracts and business services" as a general future direction, but no per-asset editing-job workflow is specifically committed to.

## Gap
Everything: no endpoints beyond health, no service logic, no frontend consumer, and the `EditingJob` model is unused. If per-asset (rather than per-order) editor job tracking is an intended product direction, it has not been built.
