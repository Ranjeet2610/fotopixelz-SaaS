# Analytics

## Purpose
The `analytics` API module and `apps/workers`'s `analytics-rollup.job.ts` suggest an intended reporting/analytics rollup capability.

## Users / Roles
Not established — no working code exists to determine actual role interaction (would presumably be admin-facing).

## Current Implementation
**Scaffolding exists but production workflow is not implemented.** `services/api/src/modules/analytics/analytics.service.ts` contains exactly one function: `getAnalyticsStatus()` returning `{ module: 'analytics', status: 'placeholder' }`.

## Frontend
No analytics dashboard/reporting UI was found in `apps/admin` in this pass beyond the general `dashboard-overview.tsx` (which surfaces live order/organization counts, not a dedicated analytics module).

## Backend
`services/api/src/modules/analytics/` — controller/routes/service (placeholder)/types/validator present but unused beyond the health check (route inventory not individually re-confirmed this pass, but the placeholder service function is definitive).

## Database
No dedicated analytics/rollup model exists in `prisma/schema.prisma` — any future analytics would presumably aggregate from `Order`, `Asset`, `Payment`, etc. directly, or need a new model.

## APIs
Health check only, consistent with every other placeholder module in this pass.

## Business Rules
None implemented.

## Workflow
None implemented.

## Permissions
N/A.

## Validation
N/A.

## Error Handling
N/A.

## Dependencies
Would depend on `orders`, `payments`, `assets` if built; `apps/workers`'s `analytics-rollup` queue/job (also placeholder — see `docs/19-WORKERS-AND-JOBS.md`).

## Current Status
**STUB.**

## Known Limitations
No analytics/reporting capability exists anywhere in the current runtime path.

## Target
Not established in current codebase as a committed, dated plan.

## Gap
Everything: no data model, no aggregation logic, no API, no UI.
