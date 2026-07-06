# BUG-003 — Deliverable Integrity & Production Safeguards

**Date:** June 6, 2026  
**Scope:** Integrity validation, QA safeguards, deliverable management, download fix. No workflow refactor, no Prisma changes, no UI redesign.

---

## 1. Implementation Summary

Production-grade deliverable validation now enforces the business rule:

**For the active batch: Deliverable Count ≤ Source Image Count**

At QA approval and editor submission, counts must match exactly:

**Source Count == Deliverable Count**

### What was fixed

| Area | Fix |
|------|-----|
| **A. Upload validation** | API rejects presigned URL + complete when `(existing + pending + new) > source images` |
| **B. QA validation** | API blocks `DELIVERED` when counts mismatch; UI disables Approve with error |
| **C. Client safety** | Audited — client list already filters `isCurrent: true` + `status: DELIVERED` |
| **D. Deliverable management** | Remove (soft archive) + Replace (`replacesAssetId`) on current batch |
| **E. Editor UX** | Source / Uploaded / Remaining counts shown on upload panel |
| **F. Revision support** | Validation scoped to active `reviewRound` + `deliverableVersion` batch |
| **G. Download fix** | `Content-Disposition: attachment` on presigned URLs; removed `target="_blank"` |
| **H. Download All** | Report only — no ZIP API/worker exists (see section 6) |

---

## 2. Files Changed

### API

| File | Change |
|------|--------|
| `services/api/src/modules/assets/deliverable-integrity.ts` | **NEW** — quota, validation, replace archive helpers |
| `services/api/src/modules/assets/assets.service.ts` | Upload/complete validation, replace flow, download disposition, delete sets `isCurrent: false` |
| `services/api/src/modules/assets/assets.validator.ts` | `replacesAssetId` on presigned schema |
| `services/api/src/modules/assets/assets.controller.ts` | `?download=true` query for attachment disposition |
| `services/api/src/modules/orders/orders.service.ts` | QA/editor count-match checks on `READY_FOR_QA` and `DELIVERED` |
| `services/api/src/integrations/storage/types.ts` | `responseContentDisposition` on presigned GET |
| `services/api/src/integrations/storage/s3-compatible-provider.ts` | Pass `ResponseContentDisposition` to S3 GetObject |

### Admin UI

| File | Change |
|------|--------|
| `apps/admin/src/lib/asset-gallery-adapter.ts` | `computeDeliverableQuota`, `countPendingDeliverables` |
| `apps/admin/src/lib/asset-client.ts` | Download fix, `replacesAssetId` support |
| `apps/admin/src/lib/download-utils.ts` | **NEW** — anchor download without new tab |
| `apps/admin/src/components/deliverable-upload-panel.tsx` | Quota display + client-side batch guard |
| `apps/admin/src/components/order-production-workspace.tsx` | Pass quota + management props |
| `apps/admin/src/components/deliverable-history.tsx` | Remove / Replace actions on current batch |
| `apps/admin/src/components/qa-review-panel.tsx` | Count display, disabled Approve on mismatch |
| `apps/admin/src/components/order-detail-page.tsx` | Editor blocked from QA when counts mismatch |

### Web (client)

| File | Change |
|------|--------|
| `apps/web/src/lib/asset-client.ts` | Download fix with `?download=true` |
| `apps/web/src/lib/download-utils.ts` | **NEW** — anchor download without new tab |

### Not changed

- Prisma schema / migrations
- Workflow statuses / transitions
- Comments, notifications, revision workflow logic
- Auth

---

## 3. Validation Rules Added

### Active batch definition

```
reviewRound = order.reviewRound
batchVersion = order.deliverableVersion > 0 ? order.deliverableVersion : 1
```

### Source image count

```sql
COUNT(uploads WHERE orderId AND status = 'UPLOADED')
```

### Deliverable count (active batch)

```sql
COUNT(assets WHERE orderId AND isDeleted = false
  AND reviewRound = active.reviewRound
  AND version = active.batchVersion
  AND status IN ('READY', 'DELIVERED'))
```

### Pending uploads (active batch)

```sql
COUNT(assets WHERE ... AND status = 'PENDING')
```

### Upload rejection

Triggered at:

1. `POST /assets/presigned-url` — before creating PENDING asset
2. `POST /assets/complete` — before marking READY (defense in depth)

**Exception:** `replacesAssetId` — replacement does not increase count; old asset archived.

**Error format:**

```
Maximum deliverables reached.
Source images: 6
Existing deliverables: 5
Attempted upload: 2
Maximum allowed: 6
```

### Editor → QA (`READY_FOR_QA`)

- Requires `sourceCount === deliverableCount`
- API + UI enforcement

### QA → Delivered (`DELIVERED`)

- Requires `sourceCount === deliverableCount`
- API + UI enforcement

---

## 4. QA Safeguards Added

| Safeguard | Layer |
|-----------|-------|
| Approve button disabled when counts mismatch | Admin UI (`qa-review-panel.tsx`) |
| `assertSourceDeliverableCountMatch()` on `DELIVERED` | API (`orders.service.ts`) |
| Count summary shown: `Source images: X · Deliverables: Y` | Admin UI |
| Error message: `Source and deliverable counts do not match.` | API + UI |

---

## 5. Download Fix Summary

### Root cause (G)

Single-file download used:

```javascript
anchor.target = "_blank";
```

Cross-origin presigned S3/R2 URLs ignore the HTML `download` attribute. Opening in a new tab displayed the image instead of downloading.

### Fix

1. **API:** `GET /assets/:id/download-url?download=true` signs URL with  
   `ResponseContentDisposition: attachment; filename="..."`
2. **Client:** Removed `target="_blank"` from download anchors (admin + web)

### Download All (H) — Report only

| Finding | Detail |
|---------|--------|
| ZIP API | **Does not exist** |
| ZIP worker | **Does not exist** |
| ZIP generator | **Not implemented** |
| Current behavior | Sequential individual downloads (`downloadAllAssets` loops files) |
| Admin UI | Placeholder note: "ZIP packaging will be added later." |
| Web UI | Message: "ZIP download is not available yet." |

**Recommendation:** Defer ZIP to a future phase. Implementing now would require either:

- Server-side archiver endpoint + temp storage, or
- Client-side JSZip with CORS-enabled fetches per file

Both are higher risk than the scope of BUG-003.

---

## 6. Client Safety Audit (C)

| Check | Result |
|-------|--------|
| Client list filter | `isCurrent: true`, `status: DELIVERED` |
| Order must be delivered | `order.status = DELIVERED` enforced in `buildListWhere` for CLIENT role |
| Historical versions | Excluded via `isCurrent: true` |
| Duplicate versions | Prevented — only current batch marked `isCurrent` on complete |
| Archived / removed | Excluded via `isDeleted: true` or non-DELIVERED status |

**No client list changes required** — existing filters were correct.

---

## 7. Deliverable Management (D)

| Action | Behavior |
|--------|----------|
| **Remove** | `DELETE /assets/:id` → `status: ARCHIVED`, `isCurrent: false`, `isDeleted: true` (storage file retained) |
| **Replace** | Upload with `replacesAssetId` → old asset archived, new asset takes slot |
| **Audit** | DB records preserved; `replacesAssetId` links replacement chain |

Available on **current batch only** while order is in editor production status.

---

## 8. Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Existing orders with count mismatch | Medium | QA approval blocked until editor fixes; admin can still manually adjust via remove/upload |
| Orphan PENDING assets after failed upload | Low | Counted in quota; complete validates again |
| Cross-origin download without CORS | Low | `Content-Disposition: attachment` on signed URL forces download |
| Replace race condition | Low | Transaction locks order row on complete |
| Admin manual status override | Medium | Admin bypasses role transition checks but count validation still runs on `DELIVERED` |

---

## 9. Testing Checklist

### Case 1 — Source = 6, Deliverables = 6

- [ ] Editor can upload up to 6 deliverables
- [ ] Editor can mark ready for QA
- [ ] QA Approve enabled
- [ ] Delivery succeeds

### Case 2 — Source = 6, Deliverables = 7

- [ ] 7th upload rejected at API with quota error
- [ ] QA Approve disabled if 7 somehow present

### Case 3 — Source = 6, Uploaded = 5, New Upload = 2

- [ ] Batch of 2 rejected before upload starts (UI)
- [ ] API rejects presigned URL for 2nd file if 1st succeeded

### Case 4 — Source = 6, Deliverables = 5, QA Approval

- [ ] Approve button disabled in UI
- [ ] API returns `Source and deliverable counts do not match.`

### Case 5 — Delete one deliverable

- [ ] Remove reduces count to 5
- [ ] Remaining shows 1
- [ ] Can upload 1 replacement
- [ ] Replace archives old file without increasing count

### Revision batch

- [ ] After revision request, new `reviewRound` gets fresh quota
- [ ] Old round deliverables excluded from active count

### Download

- [ ] Single file download saves file (no new tab with image preview)
- [ ] Web client deliverables download works
- [ ] Admin deliverable history download works

### Client view

- [ ] Client sees only delivered current assets
- [ ] Count matches source images after delivery

---

## 10. Backward Compatibility

| Item | Status |
|------|--------|
| Prisma schema | Unchanged |
| Workflow statuses | Unchanged |
| Existing API endpoints | Extended (optional `replacesAssetId`, `?download=true`) |
| Delivered orders | Unaffected if counts already matched |
| Orders with mismatch | Blocked at QA until corrected |

---

*BUG-003 complete. ZIP download deferred per low-risk scope constraint.*
