# BUG-003.2 — Pending Upload State Audit (Report Only)

**Date:** June 6, 2026  
**Scope:** Audit only. No code changes. No workflow changes. No schema changes. No UI redesign.

---

## Observed Behavior

```
Source Images: 2
Uploaded: 0
Pending Upload: 1
Remaining: 1
```

After removing an uploaded deliverable, the editor cannot upload a replacement.

Error shown:

```
Attempted upload: 2
```

…even though the user believes only one file is being uploaded.

---

## 1. Root Cause

This is a **multi-factor state synchronization problem**, not a single boundary off-by-one bug.

### Primary cause — Orphan `PENDING` assets consume quota invisibly

Every `POST /assets/presigned-url` creates a **database `PENDING` row** before the file is uploaded to storage. These rows:

- **Are counted** in `pendingUploads` for quota (`deliverable-integrity.ts`, `computeDeliverableQuota`)
- **Are NOT visible** in Deliverable History (`groupDeliverablesByVersion` only includes `READY` / `DELIVERED`)
- **Are NOT removed** when a `READY` deliverable is deleted from history
- **Have no cancel/remove UI** in the upload panel quota summary

So after a failed, abandoned, or retried upload, a ghost `PENDING` slot remains in the database.

### Secondary cause — Remove flow only archives the targeted asset

`DELETE /assets/:id` (`deleteAsset`) sets:

```
status: ARCHIVED, isCurrent: false, isDeleted: true
```

for **one asset only**. It does **not**:

- Cascade to other `PENDING` orphans in the batch
- Release quota held by unrelated `PENDING` rows
- Notify the upload panel to reset local state

### Tertiary cause — Upload panel React state is not synchronized with parent reload

`DeliverableUploadPanel` keeps **local state** (`items`, `error`) that is **not cleared** when:

- A deliverable is removed from `DeliverableHistory`
- `onAssetsReload()` runs from the parent
- `pendingCount` / `remainingAllowed` props change

A prior validation error (e.g. from selecting 2 files when `remainingAllowed === 1`) can **persist on screen** after quota recalculation makes a new upload valid.

### Quaternary cause — Client validation ignores local queue + pending in batch guard

`queueFiles` only checks:

```typescript
if (imageFiles.length > remainingAllowed) { /* block */ }
```

It does **not** account for:

- Existing local `items` still queued / failed / uploading
- In-flight presigned calls before `onUploaded()` reloads assets

This allows over-scheduling uploads against a stale `remainingAllowed`, which then fails at the API with quota errors.

### "Attempted upload: 2" — what it actually means

The string `Attempted upload: N` appears in **two places**:

| Source | Value | When |
|--------|-------|------|
| **Client** (`deliverable-upload-panel.tsx`) | `imageFiles.length` | `imageFiles.length > remainingAllowed` |
| **API** (`deliverable-integrity.ts`) | `newUploadCount` | Always `1` per presigned call |

**`Attempted upload: 2` can only come from the client** when the file picker / drop zone delivers **2 files in one action** while `remainingAllowed === 1`:

```
2 > 1 → block → "Attempted upload: 2"
```

The upload component is **not duplicating** the count in code. The value reflects the **FileList length** for that single `queueFiles` invocation.

**Likely user confusion scenarios:**

1. User drag-drops or multi-selects 2 images while Remaining shows 1
2. A **stale error** from a previous 2-file attempt remains visible after remove recalculates quota to Remaining: 1
3. User conflates `Source images: 2` with `Attempted upload` (client error omits `Pending uploads` line, unlike API)

### Archived assets — are they still counted?

| Status | `isDeleted` | Counted in `uploadedCount`? | Counted in `pendingCount`? |
|--------|-------------|----------------------------|---------------------------|
| `ARCHIVED` (removed READY) | `true` | **No** | **No** |
| `PENDING` (orphan) | `false` | **No** | **Yes** |
| `READY` / `DELIVERED` | `false` | **Yes** | **No** |

**Archived/removed READY deliverables are excluded correctly.** The problem is surviving **`PENDING` rows**, not archived rows.

---

## 2. Files Involved

### API

| File | Role |
|------|------|
| `services/api/src/modules/assets/assets.service.ts` | `createDeliverablePresignedUrl` creates `PENDING`; `deleteAsset` archives one asset only |
| `services/api/src/modules/assets/deliverable-integrity.ts` | Quota: `existing + pending + new > max` |
| `services/api/src/modules/assets/assets.controller.ts` | DELETE handler returns success, no quota payload |

### Admin UI

| File | Role |
|------|------|
| `apps/admin/src/components/deliverable-upload-panel.tsx` | Local queue (`items`), client validation, stale `error` state |
| `apps/admin/src/components/deliverable-history.tsx` | Remove calls `deleteDeliverable` + `onChanged`; no pending cleanup |
| `apps/admin/src/components/order-production-workspace.tsx` | Computes quota, passes props; `onAssetsReload` only |
| `apps/admin/src/lib/asset-gallery-adapter.ts` | `computeDeliverableQuota`, `countPendingDeliverables` |
| `apps/admin/src/lib/asset-client.ts` | `uploadDeliverableFile` — each attempt creates new presigned `PENDING` |
| `apps/admin/src/components/data-hooks.ts` | `reload()` refetches assets; no child state coordination |

---

## 3. Exact Count Calculations Before and After Remove

### Scenario reproduced from observed UI

**Assumptions:** `sourceImages = 2`, active batch `reviewRound = 1`, `batchVersion = 1`.

#### Timeline

| Step | Action | DB state | Calculation | UI display |
|------|--------|----------|-------------|------------|
| 1 | Upload deliverable A completes | 1 READY, 0 PENDING | uploaded=1, pending=0, remaining=1 | Uploaded: 1, Remaining: 1 |
| 2 | Start upload B — presigned creates `PENDING` B | 1 READY, 1 PENDING | uploaded=1, pending=1, remaining=0 | Panel **disabled** |
| 3 | Upload B fails / abandoned (no complete) | 1 READY, 1 PENDING (orphan) | unchanged | May still show stale quota until reload |
| 4 | **Remove deliverable A** from history | 0 READY, 1 PENDING (orphan B remains) | uploaded=0, pending=1, remaining=**1** | **Observed state** |
| 5 | User selects **1 file** | — | Client: `1 > 1` → false → **allow** | Should proceed |
| 5b | User selects **2 files** | — | Client: `2 > 1` → true → **block**, Attempted upload: **2** | **Matches error** |
| 6 | Presigned for 1 file (if allowed) | 0 READY, 2 PENDING | API: `0 + 1 + 1 = 2 ≤ 2` → **allow** | Pending becomes 2 |
| 7 | Complete new file (with BUG-003.1 fix) | 1 READY, 1 PENDING orphan | API complete excludes self | Uploaded: 1, Pending: 1 |

#### Before remove (step 3)

```
sourceImageCount     = 2
existingDeliverables = 1  (READY A)
pendingUploads       = 1  (orphan PENDING B)
remainingAllowed     = max(2 - 1 - 1, 0) = 0
```

#### After remove A (step 4) — **observed**

```
sourceImageCount     = 2
existingDeliverables = 0  (A archived, isDeleted=true)
pendingUploads       = 1  (orphan PENDING B — NOT removed)
remainingAllowed     = max(2 - 0 - 1, 0) = 1
```

Remove **correctly** decrements uploaded count but **does not** release the orphan pending slot.

#### If user then uploads 1 file successfully (step 6–7)

```
After complete:
existingDeliverables = 1  (new READY)
pendingUploads       = 1  (orphan B still present)
remainingAllowed     = max(2 - 1 - 1, 0) = 0  → panel disabled again
```

Editor appears stuck again even after a “successful” replacement.

### Formula (client and API — aligned)

```
remainingAllowed = max(sourceImages - uploadedCount - pendingCount, 0)

ALLOW new uploads when:
  uploadedCount + pendingCount + incomingUploads <= sourceImages

BLOCK when:
  uploadedCount + pendingCount + incomingUploads > sourceImages
```

**After remove, `pendingCount` is the hidden variable that prevents full quota recovery.**

---

## 4. Recommended Fix

Boundary-only, no workflow/schema redesign:

### Fix A — Release orphan `PENDING` slots (API, highest priority)

On `deleteAsset` for a `READY` deliverable, or via new `DELETE` support for `PENDING`:

- Allow editors to delete/archive `PENDING` assets in the active batch
- Optionally: when removing a `READY` deliverable, auto-archive stale `PENDING` rows in the same batch older than N minutes / with no storage object (`headObject` fails)

### Fix B — Pending cleanup on failed upload (client + API)

When `uploadDeliverableFile` fails **after** presigned URL creation:

- Call `DELETE /assets/:id` for the created `PENDING` asset id
- Prevents orphan accumulation on retry (each retry currently creates **another** `PENDING`)

### Fix C — Synchronize upload panel state (client)

Reset or reconcile when quota props change:

```typescript
useEffect(() => {
  setError(null);
  // Optionally clear completed/failed items when pendingCount or uploadedCount changes
}, [uploadedCount, pendingCount, remainingAllowed, orderId]);
```

Or lift `items` state to parent and clear on `onAssetsReload`.

### Fix D — Include full quota in client validation error

Match API message:

```
Source images: X
Existing deliverables: Y
Pending uploads: Z
Attempted upload: N
Maximum allowed: X
```

And validate:

```typescript
const activeLocal = items.filter(i => i.status === "queued" || i.status === "uploading").length;
const totalAttempted = imageFiles.length + activeLocal;
if (totalAttempted > remainingAllowed) { /* block */ }
```

### Fix E — Reload assets after presigned (client)

Call `onUploaded()` (or lighter `onAssetsChanged`) **after presigned URL creation**, not only after complete — keeps `pendingCount` in sync before a second file is queued.

### Fix F — Expose pending assets for management (minimal UI)

Without redesign: add “Cancel pending upload” when `pendingCount > 0`, listing `PENDING` assets from the existing `/assets` list filtered by status. Uses existing DELETE endpoint.

**Recommended implementation order:** B → A → C → D → E → F

---

## 5. Regression Risk

| Fix | Risk | Notes |
|-----|------|-------|
| **A** — Pending cleanup on remove | **Low–Medium** | Must not delete in-flight `PENDING` for active uploads; use age check or only orphan cleanup |
| **B** — Delete PENDING on upload failure | **Low** | Only delete asset id returned from failed presigned call |
| **C** — Reset panel state | **Low** | May clear intentional in-progress queue; scope reset to `error` + failed items |
| **D** — Stricter client validation | **Low** | More conservative blocking; aligns with API |
| **E** — Reload after presigned | **Low** | Extra API fetch; may briefly disable panel when `remaining` hits 0 |
| **F** — Cancel pending UI | **Low** | Minimal additive control; no workflow change |

### What NOT to change

- Quota boundary rule (`<=` allow, `>` block) — already correct after BUG-003.1
- QA exact-match rule — unrelated
- Prisma schema — not required; `PENDING` + `ARCHIVED` statuses already exist

---

## Summary

| Question | Finding |
|----------|---------|
| Archived assets still counted? | **No** — correctly excluded via `isDeleted: true` |
| Removed assets remain in upload queue? | **Local queue (`items`) can persist** across parent reload |
| `pendingUploads` state stale? | **Yes** — orphan DB `PENDING` rows + no reload after presigned |
| Upload component duplicating attempted count? | **No** — `Attempted upload: 2` = 2 files in one `FileList` or stale error text |
| Why blocked after remove? | **Orphan `PENDING` holds a slot**; remove does not release it; panel may show stale error |

---

*Audit complete. Awaiting implementation approval for BUG-003.2 fixes.*
