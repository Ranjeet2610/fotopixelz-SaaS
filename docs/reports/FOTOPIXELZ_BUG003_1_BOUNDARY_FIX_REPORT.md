# BUG-003.1 — Deliverable Count Boundary Validation Fix

**Date:** June 6, 2026  
**Scope:** Boundary validation fix only. No workflow changes. No UI redesign.

---

## 1. Root Cause

### Symptom

```
Source images: 2
Existing deliverables: 1
Attempted upload: 1
→ "Maximum deliverables reached" (incorrect)
```

Expected: `1 + 1 = 2 ≤ 2` → **ALLOW**

### Cause

**Double-counting on `completeDeliverableUpload`**

When completing the second deliverable, validation ran:

```
projectedTotal = existingDeliverables + pendingUploads + newUploadCount
               = 1 (READY)         + 1 (PENDING self) + 1
               = 3  >  2  → BLOCK
```

Flow:

1. `POST /assets/presigned-url` — correctly allows `1 + 0 + 1 = 2`, creates PENDING asset
2. Client uploads file to storage
3. `POST /assets/complete` — **incorrectly** counted the completing asset twice:
   - Once in `pendingUploads` (its own `PENDING` row)
   - Again as `newUploadCount: 1`

The presigned step had already reserved the slot. Complete should not treat the in-flight asset as both pending **and** a new incoming upload.

### What was NOT wrong

| Check | Boundary | Status |
|-------|----------|--------|
| Presigned URL | `projected > max` (strict) | Correct |
| Client batch guard | `length > remainingAllowed` | Correct |
| QA count match | `source !== deliverable` | Correct (exact match intentional) |
| Revision batch scoping | `reviewRound` + `batchVersion` | Correct |

The inequality `>` (not `>=`) was already correct everywhere. This was a **counting logic** bug, not an off-by-one operator bug.

---

## 2. Files Changed

| File | Change |
|------|--------|
| `services/api/src/modules/assets/deliverable-integrity.ts` | Added `excludeAssetIds` to quota counting; include `pendingUploads` in error message when relevant |
| `services/api/src/modules/assets/assets.service.ts` | Complete validation passes `excludeAssetIds: [asset.id]` so the completing asset is not counted as pending |

**2 files. No UI changes. No Prisma changes.**

---

## 3. Validation Fix Summary

### Business rule (unchanged)

```
ALLOW:  (existingDeliverables + incomingUploads) <= sourceImages
BLOCK:  (existingDeliverables + incomingUploads) > sourceImages
```

### Fix applied

**Presigned URL** (`createDeliverablePresignedUrl`):

- Unchanged — counts `existing + pending + 1` for a new slot reservation

**Complete upload** (`completeDeliverableUpload`):

```typescript
await assertCanAddDeliverables(asset.orderId, 1, {
  excludeAssetIds: [asset.id]  // do not count self as pending
})
```

Effective calculation on complete:

```
projected = existingReady + otherPending + 1 (this completion)
```

### Test cases

| Source | Existing | Incoming | Result |
|--------|----------|----------|--------|
| 2 | 1 | 1 | **ALLOW** ✓ |
| 2 | 2 | 1 | **BLOCK** ✓ |
| 6 | 5 | 1 | **ALLOW** ✓ |
| 6 | 6 | 1 | **BLOCK** ✓ |

### Validation layers audited

| Layer | Boundary | Notes |
|-------|----------|-------|
| Presigned URL | `> sourceImages` blocks | Reserves slot, creates PENDING |
| Complete upload | `> sourceImages` blocks | Excludes completing asset from pending |
| Client batch | `> remainingAllowed` blocks | Mirrors API quota |
| Editor → QA | `source === deliverable` | Exact match (not boundary) |
| QA → Delivered | `source === deliverable` | Exact match (not boundary) |
| Revision batch | Scoped by `reviewRound` + `version` | Unaffected |

---

## 4. Regression Impact

| Area | Impact |
|------|--------|
| **Upload flow** | Second+ deliverable in a batch now completes successfully when within quota |
| **Over-quota protection** | Presigned validation still blocks before PENDING rows are created |
| **Replace flow** | Unchanged — still skips quota via `replacesAssetId` |
| **QA / editor gates** | Unchanged — exact count match still required at submission |
| **Stale PENDING orphans** | Still count toward quota at presigned time (intentional slot reservation) |
| **Error messages** | Now includes `Pending uploads: N` when pending rows affect the block |

### Risk

**Low** — fix is narrowly scoped to complete-upload counting. No change to workflow, UI, or schema.

---

*BUG-003.1 boundary fix complete.*
