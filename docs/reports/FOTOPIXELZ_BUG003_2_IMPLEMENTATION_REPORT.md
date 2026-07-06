# BUG-003.2 — Pending Upload State Synchronization (Implementation Report)

**Date:** July 5, 2026  
**Scope:** Pending upload cleanup, quota sync, client validation — per audit report. No schema, workflow, or quota formula changes.

---

## 1. Files Changed

| File | Fixes | Summary |
|------|-------|---------|
| `apps/admin/src/lib/asset-client.ts` | B, E | Delete PENDING on upload failure; `onPresignedCreated` callback |
| `services/api/src/modules/assets/assets.service.ts` | A | Abandoned PENDING cleanup on READY/DELIVERED remove |
| `apps/admin/src/lib/asset-gallery-adapter.ts` | D, F | `getPendingDeliverables`, `formatDeliverableQuotaError` |
| `apps/admin/src/components/deliverable-upload-panel.tsx` | C, D, E, F | State sync, validation, cancel pending UI |
| `apps/admin/src/components/order-production-workspace.tsx` | E, F | Pass pending assets + `onAssetsChanged` |
| `apps/admin/src/components/deliverable-history.tsx` | E | Reload after presigned on replace flow |

**6 files modified. 0 schema/migration changes.**

---

## 2. Code Summary (by fix)

### FIX B — Cleanup orphan PENDING on failed upload (highest priority)

**File:** `apps/admin/src/lib/asset-client.ts`

`uploadDeliverableFile()` now:

1. Stores `createdAssetId` after presigned URL creation
2. On any failure after that (PUT error, complete error, abort), calls `DELETE /assets/:id` for **that asset only**
3. Cleanup is best-effort (swallows delete errors) so original upload error still surfaces
4. Successful completes do not delete

**Why:** Each failed attempt previously left a permanent `PENDING` row consuming quota.

**Edge cases:**

- **Abort:** Panel abort triggers PUT cancel → catch in `uploadDeliverableFile` → PENDING deleted
- **Replace flow:** Same cleanup applies to the new PENDING row; `replacesAssetId` target is untouched

---

### FIX A — Release orphan PENDING quota on READY remove

**File:** `services/api/src/modules/assets/assets.service.ts`

Added:

- `archiveDeliverableAsset()` — shared soft-archive helper
- `isAbandonedPendingDeliverable()` — safe orphan detection
- `cleanupAbandonedPendingDeliverables()` — batch-scoped PENDING scan

**When `DELETE /assets/:id` archives a `READY` or `DELIVERED` asset:**

Runs cleanup on other `PENDING` rows in the same `reviewRound` + `batchVersion`.

**Abandoned if:**

| Condition | Action |
|-----------|--------|
| Age &lt; 2 minutes | **Never** auto-delete (in-progress protection) |
| Age ≥ 10 minutes | Auto-archive |
| Age 2–10 min **and** storage HEAD missing or zero bytes | Auto-archive |

**Direct `PENDING` delete (Fix F):** Archives only the requested asset — no cascade.

**Why:** Removing a READY deliverable did not release ghost PENDING slots from earlier failed uploads.

**Assumption:** Active uploads complete within 2 minutes or have storage data present after PUT.

---

### FIX C — Synchronize DeliverableUploadPanel state

**File:** `apps/admin/src/components/deliverable-upload-panel.tsx`

`useEffect` on `[uploadedCount, pendingCount, remainingAllowed, orderId]`:

- `setError(null)` — clears stale quota errors after remove/reload
- Removes local `failed` items; keeps `queued` and `uploading` only

**Why:** Errors like "Attempted upload: 2" persisted after quota recovered.

**Edge case:** Failed local tiles are cleared when parent quota changes; user must re-select file to retry (Retry button removed with tile). In-flight uploads are not interrupted.

---

### FIX D — Improved client validation

**Files:** `deliverable-upload-panel.tsx`, `asset-gallery-adapter.ts`

Validation now uses:

```
activeLocal = queued + uploading (local items)
totalAttempted = activeLocal + imageFiles.length
BLOCK when totalAttempted > remainingAllowed
```

Error message matches server format via `formatDeliverableQuotaError()`:

```
Maximum deliverables reached.
Source images: X
Existing deliverables: Y
Pending uploads: Z        (when Z > 0)
Attempted upload: N
Maximum allowed: X
```

**Why:** Previous check ignored local queue and omitted pending from errors.

**Unchanged:** `computeDeliverableQuota()` formula — `remaining = source − uploaded − pending`.

---

### FIX E — Refresh after presigned creation

**Files:** `asset-client.ts`, `deliverable-upload-panel.tsx`, `order-production-workspace.tsx`, `deliverable-history.tsx`

- `uploadDeliverableFile({ onPresignedCreated })` fires after presigned, before PUT
- Panel passes `onAssetsChanged` → `onAssetsReload()`
- Replace flow in history also reloads after presigned

**Why:** `pendingCount` stayed stale until complete, allowing over-scheduling.

**Note:** Successful upload triggers reload twice (presigned + complete). Intentionally kept — lightweight and ensures sync at both stages.

---

### FIX F — Minimal pending upload management

**Files:** `deliverable-upload-panel.tsx`, `order-production-workspace.tsx`, `asset-gallery-adapter.ts`

When `pendingAssets.length > 0`:

- Lists each pending file name
- **Cancel Pending Upload** button per row
- Uses existing `DELETE /assets/:id` — no new permissions or endpoints

**Why:** Orphans were visible in count but not actionable.

---

## 3. Regression Risks

| Area | Risk | Mitigation |
|------|------|------------|
| Auto PENDING cleanup on READY delete | Medium | 2-minute minimum age; HEAD check for 2–10 min window |
| Failed upload delete | Low | Only deletes presigned asset id from same attempt |
| Panel state reset | Low | Preserves `uploading` / `queued` items |
| Double asset reload | Low | Extra GET per presigned; acceptable |
| BUG-003.1 complete validation | None | Not modified |
| Quota formula | None | Not modified |
| QA / workflow | None | Not touched |

---

## 4. Manual Testing Checklist

- [ ] **Upload success** — file completes; counts correct; no orphan PENDING
- [ ] **Upload failure** — network error after presigned; PENDING removed; remaining recovers
- [ ] **Retry upload** — after failure, retry works without duplicate PENDING
- [ ] **Remove READY deliverable** — uploaded decreases; abandoned PENDING cleaned if old enough
- [ ] **Cancel pending upload** — button removes PENDING; remaining increases
- [ ] **Two uploads within quota** — source=2, upload 2 files sequentially; both succeed
- [ ] **Two uploads exceeding quota** — select 2 when remaining=1; client blocks with full message
- [ ] **Replace removed deliverable** — remove then upload replacement; quota correct
- [ ] **Refresh page during pending** — PENDING still listed; cancel or wait for cleanup
- [ ] **No orphan PENDING after failed upload** — verify via API/list or pending count = 0
- [ ] **Remaining formula** — always `sourceImages − uploaded − pending`

---

## 5. Intentionally Unchanged

| Item | Reason |
|------|--------|
| Prisma schema / migrations | Not required |
| `deliverable-integrity.ts` boundary logic | BUG-003.1 complete; formula unchanged |
| `computeDeliverableQuota()` math | Only added helpers around it |
| Workflow statuses | Out of scope |
| QA approval rules | Out of scope |
| Comments / notifications | Out of scope |
| Web client upload flow | Admin editor path only |
| ZIP / download | Out of scope |
| New API endpoints | Reused `DELETE /assets/:id` |

---

## 6. Assumptions

1. **2-minute guard** is sufficient for in-progress uploads before auto-cleanup runs on READY delete.
2. **10-minute max age** reliably marks abandoned presigned rows.
3. **Editors** are the only role using the upload panel (unchanged).
4. **Best-effort DELETE** on failure is acceptable if delete itself fails (rare; user can use Cancel Pending).

---

*BUG-003.2 implementation complete.*
