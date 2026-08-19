# Assets

## Purpose
Represents deliverable (edited) files produced against an order — distinct from `Upload` (source files). Supports versioning, QA review-round tracking, and client download once delivered.

## Users / Roles
`EDITOR`/`ADMIN` (create/upload deliverables), `QA` (reviews, attaches `qaNotes`), `CLIENT` (downloads once `DELIVERED`).

## Current Implementation
Real implementation — presigned deliverable upload + verification (mirroring the `uploads` module's pattern), versioning, and a `deliverable-integrity.ts` helper enforcing source/deliverable count matching before an order can move to QA or delivery.

## Frontend
- `apps/client/src/components/order-deliverables.tsx` — client download view, rendered only when `order.status === 'DELIVERED'`.
- `apps/admin/src/components/deliverable-upload-panel.tsx`, `deliverable-history.tsx`, `asset-detail-page.tsx`, `assets-page.tsx` — admin/editor deliverable upload and history.
- Shared preview: `packages/upload-gallery` (`deliverable-gallery.tsx`, `lazy-deliverable-preview.tsx`).

## Backend
`services/api/src/modules/assets/`: `assets.controller.ts`, `assets.routes.ts`, `assets.service.ts`, `deliverable-integrity.ts`.

## Database
`Asset` (organizationId, orderId, uploadId nullable link back to the source upload, name, fileName, mimeType, storageProvider/Key/Url, status `PENDING`/`PROCESSING`/`READY`/`DELIVERED`/`ARCHIVED`, version, reviewRound, isCurrent, uploadedById, qaNotes JSON, replacesAssetId self-relation, isDeleted), `AssetVersion` (per-asset version history, unique per `assetId`+`versionNumber`).

## APIs
`POST /assets/presigned-url`, `POST /assets/complete`, `POST /assets`, `GET /assets`, `GET /assets/:assetId/download-url`, `GET/POST /assets/:assetId/versions`, `PATCH/DELETE /assets/:assetId/versions/:versionId`, `GET/PATCH/DELETE /assets/:assetId`. All require `requireAuth`.

## Business Rules
- `Asset.reviewRound` and `isCurrent` track QA cycles: when QA requests a revision, the current round's assets are marked `isCurrent: false` and stamped with `qaNotes` (title/comment/round/timestamp) rather than deleted — full revision history is preserved (see `docs/08-ORDERS.md`).
- `deliverable-integrity.ts` (`assertSourceDeliverableCountMatch`, `countActiveBatchDeliverables`, `getActiveBatchContext`, referenced from `orders.service.ts` and confirmed present in `docs/reports/FOTOPIXELZ_BUG003_*` reports) enforces that the number of ready deliverables matches the number of source uploads before an order can proceed to QA or delivery — preventing partial/incomplete delivery batches.
- On `Order` reaching `DELIVERED`, all current, non-deleted assets are bulk-updated to `status: 'DELIVERED'` in the same transaction (`orders.service.ts`).
- Soft-delete only (`isDeleted`), consistent with `Order` and `Upload`.
- `Asset.replacesAssetId` self-relation supports representing a new version as replacing a prior asset, independent of the separate `AssetVersion` sub-table — two overlapping versioning mechanisms exist on the model (see Gap).

## Workflow
1. Editor/admin uploads a deliverable against an order via a presigned-URL flow structurally identical to `uploads` (`docs/09-UPLOADS.md`).
2. Server verifies the object exists in storage before marking the asset ready.
3. QA reviews; on rejection, current-round assets are flagged `isCurrent: false` with `qaNotes`, and `reviewRound` increments on the parent order.
4. Editor re-uploads for the new round; the integrity check requires the new deliverable count to match the original source count before re-submitting to QA.
5. On `DELIVERED`, client gains access to download via `apps/client/src/components/order-deliverables.tsx` → `GET /assets/:assetId/download-url` (presigned GET, time-limited per `STORAGE_DOWNLOAD_EXPIRY_SECONDS`).

## Permissions
Editors/QA/admins can create/manage assets; clients can only read/download assets for orders in their own organization, and only once delivered (enforced by the client UI conditionally rendering the deliverables panel — server-side read scoping for assets was not independently re-verified line-by-line in this pass).

## Validation
Zod validators in `assets.validator.ts` (not individually enumerated this pass).

## Error Handling
Consistent `AppError` pattern; integrity-check failures produce specific messages (e.g. blocking QA submission or delivery when counts don't match).

## Dependencies
`uploads` (source count for integrity checks), `orders` (status-gated visibility and transitions), `storage` integration (presigned URLs, both PUT for creation and GET for download).

## Current Status
**COMPLETE** for the core deliverable lifecycle (upload, versioning by round, integrity checks, delivery, download). This is a real, non-trivial implementation, not scaffolding.

## Known Limitations
- Two overlapping versioning mechanisms exist (`Asset.replacesAssetId` self-relation vs. the separate `AssetVersion` table) without a clearly documented single source of truth for "current version" — worth clarifying in a future architecture note.
- Editing/QA/Revision **dedicated modules** (`EditingJob`, `QAReview`, `Revision` models/modules) are not the mechanism actually driving this workflow — see `docs/11-EDITING-WORKFLOW.md`, `docs/12-QA.md`, `docs/13-REVISIONS.md`. The real QA/revision loop lives inside `orders`+`assets`, not those dedicated modules.

## Target
Not established in current codebase beyond what's implemented.

## Gap
Clarifying/consolidating the two versioning mechanisms is an open item, not a stated requirement.
