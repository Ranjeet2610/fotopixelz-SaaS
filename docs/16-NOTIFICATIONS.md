# Notifications

## Purpose
Two distinct notification mechanisms exist in the codebase: (1) transactional **email** (real, working), and (2) in-app **`Notification` database records** (written but not readable via any API).

## Users / Roles
Order participants (client, assigned editor, assigned QA) receive transactional emails at key order-lifecycle events. In-app `Notification` rows are created for order-comment activity, targeting relevant users by id.

## Current Implementation
**Split status — email is real; in-app notification retrieval is not.**

### Email (COMPLETE)
`services/api/src/modules/orders/order-notification-emails.ts` sends real transactional emails via `packages/email` (Resend) at: order placed, editor assigned, QA assigned, order ready for review, revision requested, revision completed, rework required, order delivered — all directly invoked from `orders.service.ts` at the corresponding status transitions (verified directly in `docs/08-ORDERS.md`'s workflow).

### In-app notifications (PARTIAL — write-only)
`services/api/src/modules/notifications/notifications.service.ts` has real, Prisma-connected functions: `createNotification`, `createNotificationsForUsers`, `listUserNotifications`, `markNotificationRead`. `createNotificationsForUsers` **is actually called** from `order-comments.service.ts` (on new comments and QA-reviewer-relevant events) — so `Notification` rows are genuinely being created in the database.

**However, `notifications.routes.ts` exposes only `GET /notifications/health`** — there is no `GET /notifications` (list) or `PATCH /notifications/:id/read` route wired up, despite the corresponding service functions (`listUserNotifications`, `markNotificationRead`) existing and being fully implemented. **A user has no way to retrieve or mark-read their in-app notifications through the API today.**

## Frontend
No in-app notification bell/inbox UI was found in `apps/client` or `apps/admin` in this pass, consistent with there being no read endpoint to power one. `services/api/src/sockets/socket.ts` (Socket.IO) exists and is referenced in `docs/architecture/architecture.md` as intended for realtime notifications to admin/web, but was not independently re-verified as functionally wired to the `Notification` model in this pass.

## Backend
`services/api/src/modules/notifications/` (service real, routes stubbed to health-only); `services/api/src/queues/notification.queue.ts` (producer, consumer side is a placeholder per `docs/19-WORKERS-AND-JOBS.md`); `packages/email` (real, used for transactional email).

## Database
`Notification` (userId, type enum `ORDER/REVISION/PAYMENT/DELIVERY/SYSTEM`, title, message, readAt) — actively written to (via order comments), never read back through any API.

## APIs
Only `GET /notifications/health` is routed. `listUserNotifications`/`markNotificationRead` exist in the service layer but have no corresponding route.

## Business Rules
Order-comment creation determines notification recipients (`order-comments.service.ts` — relevant participants and, in one branch, specifically the order's assigned QA reviewer) and fires `createNotificationsForUsers` with a type/title/message.

## Workflow
1. **Email:** order status change → `order-notification-emails.ts` sends a transactional email to the relevant recipient(s). Working end-to-end.
2. **In-app:** order comment created → `Notification` rows created for relevant users → **dead end** — no API surface exists for a user to ever see these rows again.

## Permissions
Email: system-triggered, no user action required. In-app: would be user-scoped (`listUserNotifications(userId)` already filters by the requesting user) if the route existed.

## Validation
Not applicable to the unrouted list/read functions; email sending presumably validated by `packages/email`'s template/recipient handling (not independently verified this pass).

## Error Handling
Not established for the missing routes (none exist to fail).

## Dependencies
`order-comments` module (the only current caller of notification creation), `packages/email` (Resend), `orders` (email trigger points).

## Current Status
**PARTIAL** — email notifications: **COMPLETE**. In-app notifications: **STUB in practice** (data is written, but permanently unreachable — the service layer is complete but disconnected from any route).

## Known Limitations
This is a precise, concrete gap: `listUserNotifications`/`markNotificationRead` are fully implemented and doing nothing, because `notifications.routes.ts` never registers them. Wiring two routes (`GET /notifications`, `PATCH /notifications/:id/read`) plus a small frontend list/bell component would close this gap without any new backend logic.

## Target
Not established in current codebase as a committed plan, but the completeness of the service-layer functions strongly suggests this was intended to be finished and simply wasn't wired up.

## Gap
Two missing route registrations (list + mark-read) and any corresponding frontend UI to consume them.
