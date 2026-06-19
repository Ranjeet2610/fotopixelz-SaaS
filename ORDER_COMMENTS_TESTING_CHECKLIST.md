# Order Comments & Collaboration — Testing Checklist

## Database & Migration

- [ ] Run `pnpm db:deploy` (or `pnpm db:migrate`) to apply `20260606180000_order_comments_collaboration`
- [ ] Run `pnpm db:generate` to refresh Prisma client
- [ ] Verify `OrderComment` table exists with indexes on `orderId`, `assetId`, `userId`, `commentType`, `status`, `createdAt`

## API — Order Comments (`/api/v1/order-comments`)

- [ ] `GET /orders/:orderId` — list comments with pagination
- [ ] `GET /orders/:orderId/timeline` — merged workflow + comments sorted by datetime
- [ ] `POST /` — create comment with role permissions
- [ ] `PATCH /:commentId` — update body or status (OPEN → IN_PROGRESS → RESOLVED)
- [ ] `DELETE /:commentId` — admin only soft delete
- [ ] `POST /attachment/presigned-url` — png/jpg/jpeg/webp/pdf only
- [ ] `GET /:commentId/attachment/download-url` — signed download URL

## API — Revision Enforcement

- [ ] `POST /orders/request-revision` requires title + comment
- [ ] Creates `OrderComment` with type `REVISION`, status `OPEN`
- [ ] Optional `assetId` links comment to deliverable
- [ ] Optional markup attachment uploads to S3/R2
- [ ] `PATCH /orders/status` to `REVISION_REQUIRED` requires `revisionTitle` + `revisionComment` for QA

## Role Permissions

- [ ] **CLIENT** — sees all except `INTERNAL_NOTE`; can post `CLIENT_FEEDBACK`
- [ ] **EDITOR** — can reply, move status OPEN → IN_PROGRESS → RESOLVED
- [ ] **QA** — can create `REVISION`, `QA_NOTE`, upload markup
- [ ] **ADMIN** — full visibility, delete any comment, create `INTERNAL_NOTE`
- [ ] **SUPER_ADMIN** — same as admin

## Realtime (Socket.IO)

- [ ] API starts with HTTP server + Socket.IO on same port
- [ ] Client connects with JWT in `auth.token`
- [ ] `order.join` subscribes to order room
- [ ] Events fire: `comment.created`, `comment.updated`, `comment.deleted`, `comment.resolved`, `timeline.updated`
- [ ] Admin comments panel refreshes without manual reload

## Notifications

- [ ] Client feedback notifies editor + admins
- [ ] QA revision notifies editor
- [ ] Editor reply notifies QA
- [ ] Resolved comment notifies QA
- [ ] Records appear in `Notification` table

## Admin UI

- [ ] Order detail tabs: Overview, Assets, Comments, Timeline, Activity
- [ ] Comment badges: type + status
- [ ] Image-linked comments show thumbnail + link to asset
- [ ] Search/filter by text, type, status
- [ ] QA revision modal blocks submit without notes
- [ ] Markup screenshot upload works

## Client UI

- [ ] Comments visible after order submitted (not DRAFT/UPLOADED)
- [ ] Client can post feedback + reference file
- [ ] Read-only after DELIVERED

## End-to-End Workflow

1. [ ] Admin assigns editor → SYSTEM comment created
2. [ ] Editor uploads deliverables → visible in Assets tab
3. [ ] QA requests revision on image #5 with screenshot → REVISION comment OPEN
4. [ ] Editor marks IN_PROGRESS → RESOLVED
5. [ ] Editor re-uploads → REVISION_SUBMITTED in timeline
6. [ ] QA approves → DELIVERED; comments read-only
7. [ ] Unified timeline shows full history in chronological order

## Regression

- [ ] Existing upload gallery thumbnails still work
- [ ] Deliverable versioning unchanged
- [ ] No raw S3 URLs in comment attachment UI (signed URLs only)
