# Fotopixelz — BUG-001 Post-Implementation Verification Report

**Date:** June 6, 2026  
**Verifier role:** Senior QA Engineer  
**Scope:** Verification only — no code changes, no new features  
**Bug:** QA deliverable visibility (editor uploads N, QA sees 1)

---

## Executive Summary

| Item | Result |
|------|--------|
| **Overall verdict** | **CONDITIONAL PASS** |
| **Production readiness score** | **7.5 / 10** |
| **Code review** | Fix correctly addresses root cause |
| **Automated tests** | None exist for this path |
| **Live E2E tests** | Not executed in this verification session |
| **Database repair dry-run** | No affected batches in current environment |

The implementation is **architecturally sound** and should resolve the reported bug. Full production sign-off requires **manual E2E validation** on staging with 1, 4, and 20-file uploads plus a revision round.

---

## Root Cause Confirmation

**CONFIRMED** — Original root cause matches implementation analysis.

| Layer | Finding |
|-------|---------|
| **Primary** | `completeDeliverableUpload` used `currentBatchCount === 0` and ran `updateMany` demoting **all** sibling assets when parallel completions raced |
| **Secondary** | QA panel filtered on `isCurrent === true` only, amplifying the backend data corruption |
| **Not the cause** | API pagination (`limit: 100`), QA permission filter, or missing assets in API response |

### Fix validation (code review)

| Fix component | Status | Evidence |
|---------------|--------|----------|
| Row lock `FOR UPDATE` on `Order` | ✅ Present | `assets.service.ts` line 361 |
| Batch detection by `deliverableVersion` + `reviewRound` | ✅ Present | Lines 376–387 |
| Same-batch path skips sibling demotion | ✅ Present | Lines 391–392 |
| New-batch demotes only older `reviewRound` or older `version` | ✅ Present | Lines 399–412 |
| Sequential upload safeguard (UI) | ✅ Present | `deliverable-upload-panel.tsx` lines 107–111 |
| QA filter uses version + round | ✅ Present | `getCurrentDeliverables(assets, { deliverableVersion, reviewRound })` |
| Repair script | ✅ Present | `prisma/scripts/repair-deliverable-is-current.ts` |

---

## Test Case Results

### TEST CASE 1 — Single Deliverable (1 image)

| Field | Value |
|-------|-------|
| **Result** | **PASS** (code review) |
| **Method** | Static trace |

**Expected flow:**
1. First completion: `deliverableVersion` 0 → 1, asset `READY`, `isCurrent: true`
2. QA panel: `getCurrentDeliverables` with `deliverableVersion=1`, `reviewRound=1` → 1 asset

**Risk:** Low

---

### TEST CASE 2 — Multiple Deliverables (4 images)

| Field | Value |
|-------|-------|
| **Result** | **PASS** (code review) |
| **Method** | Static trace + concurrency analysis |

**Expected flow (parallel API calls):**
1. Tx1 locks order, starts batch v1, sets asset1 `isCurrent: true`
2. Tx2–4 wait on lock, see `readyInActiveBatch > 0`, join batch without demotion
3. All 4 assets: `version=1`, `reviewRound=1`, `isCurrent: true`
4. QA panel returns 4 records

**UI safeguard:** Sequential upload further reduces race surface.

**Risk:** Low — requires live E2E to confirm on staging

---

### TEST CASE 3 — Large Batch (20 images)

| Field | Value |
|-------|-------|
| **Result** | **PASS** (code review) |
| **Method** | Static trace |

**Notes:**
- Logic scales linearly with `FOR UPDATE` serialization
- Asset list uses `limit: 100` — 20 images within limit
- **Edge case:** Orders with **>100 deliverables** would hit pagination ceiling (pre-existing, not introduced by BUG-001)

**Risk:** Low for ≤100 assets; medium above 100

---

### TEST CASE 4 — Revision Round (v1/r1 → revision → v2/r2)

| Field | Value |
|-------|-------|
| **Result** | **PASS** (code review) |
| **Method** | Static trace of revision + upload paths |

**Expected flow:**
1. Round 1, version 1: 4 assets `READY`, QA sees 4 via `deliverableVersion=1`, `reviewRound=1`
2. `requestOrderRevision`: `reviewRound` 1→2, prior assets `isCurrent: false`
3. New uploads: first completion bumps `deliverableVersion` to 2; siblings join batch at v2/r2
4. QA panel with `deliverableVersion=2`, `reviewRound=2` → 4 new assets only
5. Old v1/r1 assets excluded by version+round filter

**Risk:** Low — revision isolation depends on `order.deliverableVersion` staying in sync (it is updated on first new-batch completion)

---

### TEST CASE 5 — Historical Orders (repair script)

| Field | Value |
|-------|-------|
| **Result** | **PASS** (dry-run) / **N/A** (no broken data) |
| **Method** | `pnpm db:repair-deliverables` executed |

**Output:**
```
No affected deliverable batches found.
```

**Interpretation:**
- Current database has no orders matching the broken signature (multiple READY in active batch, only one `isCurrent`)
- Script logic correctly targets `order.deliverableVersion` + `order.reviewRound` batches
- **Production:** Run dry-run after deploy; execute `--execute` only if affected batches are reported

**Risk:** Medium on production if historical broken orders exist — repair must be run post-deploy

---

### TEST CASE 6 — Database Validation

| Field | Value |
|-------|-------|
| **Result** | **NOT EXECUTED** (no test upload session) |
| **Method** | SQL validation queries documented below |

**Recommended validation SQL after manual test upload:**

```sql
-- After editor uploads 4 images to one order
SELECT id, "fileName", status, version, "reviewRound", "isCurrent"
FROM "Asset"
WHERE "orderId" = '<orderId>' AND "isDeleted" = false
ORDER BY "createdAt";

-- Expected: 4 rows, status READY, same version, same reviewRound, all isCurrent = true

SELECT "deliverableVersion", "reviewRound"
FROM "Order"
WHERE id = '<orderId>';

-- Expected: deliverableVersion matches asset.version, reviewRound matches asset.reviewRound
```

**Risk:** Requires manual test execution to fully PASS

---

### TEST CASE 7 — Concurrency (parallel uploads)

| Field | Value |
|-------|-------|
| **Result** | **PASS** (code review) |
| **Method** | Transaction serialization analysis |

**Mitigations in place:**
1. **Backend:** `SELECT … FOR UPDATE` serializes `completeDeliverableUpload` per order
2. **Frontend:** Sequential `await runUpload()` loop per file batch
3. **Demotion scope:** Narrowed to older versions/rounds only

**Residual risk:** Direct API abuse (multiple clients hitting `/assets/complete` simultaneously) is handled by row lock. Single-client parallel calls are serialized at DB level.

**Not tested:** Load test with 20 concurrent HTTP completion requests — recommended on staging

---

## Remaining Issues (Not BUG-001 Scope)

| ID | Severity | Issue | Impact |
|----|----------|-------|--------|
| RES-001 | Medium | Backend `countCurrentReadyDeliverables()` still counts `isCurrent: true` only, not version+round | Editor "Mark ready for QA" gate could under-count if legacy bad data exists |
| RES-002 | Medium | `ensureOrderHasDeliverables()` same `isCurrent`-only logic | QA approve path could fail incorrectly on corrupted data |
| RES-003 | Low | No automated integration/unit tests for batch completion | Regression risk on future changes |
| RES-004 | Low | Asset list `limit: 100` | Orders with >100 deliverables may hide assets in QA UI |
| RES-005 | Low | `getCurrentDeliverables` falls back to `isCurrent` when `deliverableVersion=0` | Pre-first-upload edge case only |
| RES-006 | Info | No live E2E run in this verification session | Sign-off gap |

---

## Edge Cases

| Edge case | Expected behavior | Verified |
|-----------|-------------------|----------|
| Re-upload already READY asset | Early return, no change | ✅ Code path line 347–348 |
| First deliverable ever on order (`deliverableVersion=0`) | New batch → version 1 | ✅ Code review |
| Partial batch (2 of 4 uploaded) | QA sees 2 at current version | ✅ By design |
| Revision before any new upload | QA sees 0 at v1/r2 filter | ✅ Old batch excluded |
| `DELIVERED` status assets in current version | Included in QA gallery filter | ✅ Intentional for post-approve review |
| Multiple file drops queued while prior uploading | Sequential processing | ✅ UI safeguard |

---

## Data Repair Required

| Environment | Action |
|-------------|--------|
| **Current dev DB** | None — dry-run found 0 affected batches |
| **Production (if deployed before fix)** | Run `pnpm db:repair-deliverables` (dry-run), then `pnpm db:repair-deliverables:execute` if affected orders listed |
| **Post-fix new uploads** | No repair needed — backend fix prevents recurrence |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Bug recurs on parallel upload | Low | High | FOR UPDATE + sequential UI |
| Legacy orders still broken | Medium (prod) | High | Run repair script post-deploy |
| Editor QA gate under-counts | Low (post-fix) | Medium | Align `countCurrentReadyDeliverables` in future task |
| No automated regression tests | High | Medium | Add API integration tests |
| >100 deliverables hidden | Low | Medium | Increase limit or paginate (future) |

---

## Production Readiness Score

| Criterion | Score | Notes |
|-----------|-------|-------|
| Root cause addressed | 10/10 | Correct fix |
| Defense in depth | 9/10 | Backend + UI + adapter |
| Historical data handling | 8/10 | Script exists; not run on prod yet |
| Test coverage | 4/10 | No automated tests |
| Live verification | 5/10 | Not executed this session |
| Residual backend counters | 7/10 | `isCurrent`-only paths remain |

### **Overall: 7.5 / 10 — CONDITIONAL PASS**

**Conditions for full production sign-off:**
1. Manual E2E on staging: 1, 4, 20 uploads → QA count matches
2. Manual revision round test (Test Case 4)
3. Production repair script dry-run after deploy
4. Spot-check SQL on one real order post-upload

---

## Recommended Next Stabilization Task

Per workflow audit priorities (post BUG-001):

### **Next: BUG-002 — Admin `REVISION_REQUIRED` dropdown**

| Priority | Task | Rationale |
|----------|------|-----------|
| **P1** | Fix admin status dropdown sending `REVISION_REQUIRED` without required revision fields | Causes silent API errors; blocks QA workflow |
| **P1** | Single QA revision path (remove `REVISION` from comment compose) | Prevents dead-end revisions |
| **P2** | Align backend `countCurrentReadyDeliverables` with version+round batch logic | Closes RES-001/RES-002 residual risk from BUG-001 |
| **P2** | Timeline deduplication (merge Activity tab) | Reduces admin confusion |
| **P3** | Client status label pass | Reduces client confusion (SUBMITTED vs PENDING vs UPLOADED) |

**Recommended immediate action:** Deploy BUG-001 fix → run repair dry-run on production → execute manual Test Cases 1–4 on staging → proceed to BUG-002.

---

*Verification performed by static code analysis, concurrency logic review, and repair script dry-run. No application code was modified during this verification.*
