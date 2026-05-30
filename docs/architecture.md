# Architecture Overview

## SaaS Workflow Overview
1. Client/organization submits order and uploads source assets.
2. Assets may pass through AI preprocessing jobs.
3. Human editor assignment and editing job execution.
4. QA review pass/fail with optional revision request loop.
5. Client approval and asset delivery.
6. Payment capture, notifications, and analytics rollups.

## Monorepo Responsibilities
- `apps/web`: marketing + client dashboard routes.
- `apps/admin`: admin operations routes.
- `apps/workers`: async jobs/processors/queue placeholders.
- `services/api`: module-based HTTP API and workflow orchestration.
- `packages/*`: shared auth/config/types/validators/database helpers.
- `prisma`: canonical data model and migrations.

## Data Model Overview
Core entities:
- Identity: `User`, `Organization`, `Membership`
- Catalog: `ServiceCategory`, `Service`
- Operations: `Order`, `OrderItem`, `Asset`, `AssetVersion`
- Workflow: `EditingJob`, `AiJob`, `QAReview`, `Revision`, `WorkflowEvent`
- Commerce: `Payment`, `Invoice`
- Platform: `Notification`, `AuditLog`

## Role/Permission Overview
Roles:
- `CLIENT`, `EDITOR`, `QA`, `ADMIN`, `SUPER_ADMIN`

Permissions grouped by domains:
- orders, uploads, assets, editing, qa, payments, admin, analytics, settings

## Worker Queue Overview
Planned async channels:
- ai-processing
- image-upload
- image-optimization
- editor-assignment
- qa-review
- revision-request
- delivery
- email-notification
- payment-webhook
- analytics-rollup

## Next Implementation Phases
1. Replace module placeholders with request/response contracts and business services.
2. Add DB migrations from expanded Prisma schema.
3. Add queue broker wiring (BullMQ/Redis), retries, and dead-letter strategy.
4. Add auth token/session strategy and RBAC enforcement in routes.
5. Add observability: structured logs, metrics, tracing, audit/event pipelines.
