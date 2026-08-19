# Uploads

## Purpose
Handle client-side source-image upload against an order: presigned direct-to-storage upload, server-side verification, and per-order upload tracking prior to production.

## Users / Roles
`CLIENT` (uploads source images to their own order); admins can view/list uploads.

## Current Implementation
Real, working implementation — presigned S3-compatible PUT upload with server-side existence/size verification (`headObject`), not a mocked or simulated flow.

## Frontend
- `apps/client/src/components/order-upload/order-upload-panel.tsx` — drag-and-drop + click-to-browse, per-file progress via `XMLHttpRequest.upload.onprogress`, retry, remove, abort (`AbortController`).
- `apps/client/src/lib/upload-client.ts` — orchestrates presigned-URL request → direct `PUT` to storage → `complete` call.
- Shared display: `packages/upload-gallery` (`SourceUploadGallery`, `LazyUploadPreview`) — used by both the upload panel and the read-only gallery views.

## Backend
`services/api/src/modules/uploads/`: `uploads.controller.ts`, `uploads.routes.ts`, `uploads.service.ts`, `upload-image-utils.ts`. Storage abstraction: `services/api/src/integrations/storage/` (S3-compatible provider, presigned URL generation, `headObject`, storage key builder).

## Database
`Upload` (organizationId, userId, orderId nullable, originalName, fileName, mimeType, fileSize, storageProvider, storageKey, storageUrl, status `PENDING`/`UPLOADED`/`FAILED`/`DELETED`).

## APIs
`POST /uploads/presigned-url` (get a presigned PUT URL + create a `PENDING` `Upload` row), `POST /uploads/complete` (server verifies the object actually exists in storage via `headObject`, flips status to `UPLOADED` or `FAILED`), `POST /uploads/batch`, `POST /uploads/zip`, `POST /uploads` (direct create), `GET /uploads`, `GET /uploads/order/:orderId`, `GET /uploads/:id/preview-url`, `GET /uploads/:id`, `DELETE /uploads/:id`. All require `requireAuth`.

## Business Rules
- `createPresignedUrl` **requires an `orderId`** — uploads are always tied to an order, not freestanding.
- The storage key is deterministically built from `organizationId` + `orderId` + `fileName` (`createUploadStorageKey`), scoping files by org/order in the bucket.
- **`completeUpload` does not trust the client's claim of success** — it calls `storage.headObject(storageKey)` and only marks `UPLOADED` if the object actually exists with `contentLength > 0`; otherwise `FAILED`. `fileSize` is corrected from the real object size if it differs.
- Deleting an `UPLOADED` upload also attempts to remove the underlying storage object (best-effort, wrapped in try/catch based on the code shape).
- Organization access is checked (`ensureOrganizationAccess`) before issuing a presigned URL or listing/creating uploads.

## Workflow
1. Client selects/drops files (image MIME types only, filtered client-side).
2. For each file: `apps/client/src/lib/upload-client.ts` requests `POST /uploads/presigned-url` → receives a presigned `PUT` URL + a `PENDING` `Upload` record.
3. Browser performs a direct `XMLHttpRequest PUT` to the storage URL, streaming real upload progress back to the UI.
4. On success, client calls `POST /uploads/complete` → server verifies the object via `headObject` → status becomes `UPLOADED` (or `FAILED` if verification fails).
5. UI removes the local in-progress tile and merges the confirmed server `Upload` record into the gallery.
6. Failed uploads show an inline error and a **Retry** action (re-runs the same presigned-URL → PUT → complete sequence for the same file).
7. Users can **Remove** a queued/failed local item (aborts in-flight request via `AbortController`) or an already-`UPLOADED` server upload (calls `DELETE /uploads/:id`).
8. Once the order transitions from pre-upload status to `UPLOADED`/`PENDING`, uploaded files become the basis for the order's billable image count (see `docs/08-ORDERS.md`, `docs/07-PRICING.md`).

## Permissions
Uploads are scoped to the requesting user's organization (`ensureOrganizationAccess`); no cross-organization upload access observed.

## Validation
Zod validators in `uploads.validator.ts` (not individually enumerated this pass); client-side filters to `image/*` MIME types before ever calling the API.

## Error Handling
Network/abort errors surfaced as inline per-tile error text; server-side verification failure surfaces as `status: 'FAILED'` rather than a hard error, allowing retry.

## Dependencies
`organizations` (access check), `storage` integration (S3-compatible), `orders` (upload count drives submission billing).

## Current Status
**COMPLETE** — this is a genuinely production-grade upload pipeline (presigned URLs, real progress, server-side verification, retry/abort/remove), not a stub.

## Known Limitations (UX, not functional)
- No client-side concurrency cap — many simultaneous file selections fire many parallel presigned-URL requests and uploads at once.
- No aggregate/overall progress indicator across multiple files, only per-file.
- No client-side max file size / dimension validation beyond MIME-type filtering.
- No bulk "retry all failed" / "clear failed" action.

## Target
Not established in current codebase beyond what's implemented.

## Gap
None functional — remaining gaps are UX polish items listed above, not missing capability.
