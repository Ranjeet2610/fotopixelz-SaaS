# Workers & Jobs

## Purpose
`apps/workers` is intended to be the standalone process that consumes BullMQ jobs produced by `services/api` (async AI processing, image optimization, delivery zipping, email/notification dispatch, payment webhooks, analytics rollups, etc.).

## Users / Roles
No direct user interaction — this is a backend async-processing process.

## Current Implementation
**Scaffolding exists but production workflow is not implemented.** Verified directly by reading every processor/job file: each is a literal placeholder object with `status: 'placeholder' as const` and no function body performing any work. `apps/workers/src/index.ts` (the actual process entry point) does not start a BullMQ `Worker` instance or attach any queue consumer at all — it only loads env vars, imports the static queue-name registry, and logs `bootstrapWorkers()`'s return value. **No job of any kind is ever actually processed by this process today.**

## Frontend
N/A — backend process, no UI.

## Backend
- `apps/workers/src/index.ts` — entry point; does not start real consumers.
- `apps/workers/src/queues/registry.ts` — a static array of 10 queue names (`ai-processing`, `image-upload`, `image-optimization`, `editor-assignment`, `qa-review`, `revision-request`, `delivery`, `email-notification`, `payment-webhook`, `analytics-rollup`). This is a name list, not a working registration mechanism.
- `apps/workers/src/processors/*.ts` (8 files) and `apps/workers/src/jobs/*.ts` (5 files) — all placeholder export objects, zero logic.

**Producer side (real, in `services/api`):** `services/api/src/queues/ai.queue.ts`, `email.queue.ts`, `notification.queue.ts` — three BullMQ producers exist server-side. Only 3 of the 10 registered queue names have a confirmed producer; the rest (`image-upload`, `image-optimization`, `editor-assignment`, `qa-review`, `revision-request`, `delivery`, `payment-webhook`, `analytics-rollup`) have no confirmed producer either — the corresponding order/asset/QA/revision/payment/analytics logic that would need to enqueue them does not exist (see their respective module docs).

## Database
No dedicated job/queue-state model in Prisma — BullMQ manages its own state in Redis.

## APIs
N/A — this is not an HTTP-facing module.

## Business Rules
None implemented (no job actually runs).

## Workflow
**Intended (not real):** API action → BullMQ producer enqueues job in Redis → `apps/workers` consumer picks it up → processor executes → result persisted / side effect performed.

**Actual today:** API action → for the 3 queues with real producers (`ai`, `email`, `notification`), a job is enqueued in Redis → **nothing consumes it** — `apps/workers` never starts a listener, so enqueued jobs sit in Redis indefinitely (or expire per Redis/BullMQ retention config, not verified this pass).

## Permissions
N/A.

## Validation
N/A.

## Error Handling
N/A — no retry/dead-letter logic exists because no job execution exists to fail.

## Dependencies
Redis (`services/api/src/integrations/redis/client.ts`), the producer queues in `services/api/src/queues/`.

## Current Status
**STUB.** This is the single largest confirmed gap in the entire backend: real, working synchronous business logic exists in `orders`/`assets`/`uploads` (see those docs), but everything intended to run *asynchronously* — AI processing, image optimization, delivery packaging, payment webhooks, analytics — has no working execution path.

## Known Limitations
- The actual production workflow observed in `docs/08-ORDERS.md` works entirely **synchronously** through direct API calls (editor uploads a deliverable directly via presigned URL, no async job in between) — meaning the current product does not actually depend on workers to function today. Workers appear to be a planned scaling/offloading layer that was scaffolded but never built out.
- Even where a producer exists (`email.queue.ts`), it's unclear whether it's actually invoked anywhere, since the confirmed working transactional emails (`order-notification-emails.ts`, `docs/16-NOTIFICATIONS.md`) appear to send directly via `packages/email`/Resend rather than going through the queue — this dual-path (direct-send vs. queued) was not fully reconciled in this pass.

## Target
Per `docs/architecture/architecture.md`'s "Next Implementation Phases": "add queue broker wiring (BullMQ/Redis), retries, and dead-letter strategy" is explicitly listed as future work — confirming this is a known, acknowledged gap rather than an oversight.

## Gap
Everything: a real BullMQ `Worker` must be started in `apps/workers/src/index.ts`, each processor needs actual implementation logic, and the relationship between direct-send paths (e.g. email) and queue-based paths needs to be reconciled and made consistent.
