# Fotopixelz — Workflow Audit Report

**Date:** June 6, 2026  
**Scope:** Audit only — no refactors, no new modules, no business-logic changes without approval  
**Goal:** Stabilize Fotopixelz before Payments, Subscriptions, Credits, AI, and Automation

---

## Executive Summary

The platform is **functionally complete** but **operationally confusing**. The main risks before further development:

| Priority | Issue | Impact |
|----------|--------|--------|
| **P0** | QA sees 1 deliverable when editor uploaded 4 | Production blocker |
| **P1** | 11 order statuses with 3+ dead/legacy values | Operator & client confusion |
| **P1** | Duplicate timeline / activity / comment entries | Admin trust erosion |
| **P2** | Fragmented editor/QA flows (5 tabs, duplicate actions) | Too many clicks |
| **P2** | Notifications written but no in-app UI | Missed revisions |

---

## Table of Contents

1. [Workflow Audit](#part-1--workflow-audit)
2. [Status Simplification & Impact Analysis](#part-2--status-simplification--impact-analysis)
3. [QA Asset Visibility Bug (P0)](#part-3--qa-asset-visibility-bug-p0)
4. [Super Admin UX Audit](#part-4--super-admin-ux-audit)
5. [Order Flow Audit](#part-5--order-flow-audit)
6. [Comments Module Audit](#part-6--comments-module-audit)
7. [Deliverables Summary](#part-7--deliverables-summary)
8. [Recommended Stabilization Sequence](#recommended-stabilization-sequence)

---

## PART 1 — Workflow Audit

### 1.1 Current Workflow (by Role)

#### Client

```
Place Order (SUBMITTED)
  → Upload source files (UPLOADED)
  → Submit order (PENDING)
  → Wait (ASSIGNED → IN_PROGRESS → READY_FOR_QA)
  → Receive deliverables (DELIVERED)
```

**Surfaces:** Order wizard → order detail → upload panel → comments (post-submit) → deliverables (DELIVERED only)

#### Editor

```
See assigned orders (ASSIGNED)
  → Start work (IN_PROGRESS)
  → Upload deliverables (Assets tab)
  → Mark ready for QA (READY_FOR_QA)
  → Fix revisions (REVISION_REQUIRED → IN_PROGRESS / READY_FOR_QA)
```

**Surfaces:** Orders list + order detail (Overview + Assets + Comments + Timeline + Activity)

#### QA

```
See inbox (READY_FOR_QA, REVISION_REQUIRED, DELIVERED)
  → Review deliverables (Assets tab → QaReviewPanel)
  → Approve (DELIVERED) or Request revision (REVISION_REQUIRED)
```

**Surfaces:** QA queue (`/admin/qa`) + orders list + order detail Assets tab

#### Admin / Super Admin

```
Production queue (default hides SUBMITTED/UPLOADED/DRAFT)
  → Assign editor (PENDING → ASSIGNED)
  → Assign QA (no status change)
  → Override any status via dropdown
  → Monitor via dashboard KPIs + order detail tabs
```

**Super Admin** shares the same order UX as Admin; extra access is mainly people management.

---

### 1.2 Problems Identified

| # | Problem | Where |
|---|---------|-------|
| 1 | Pre-production has **3 backend states** (`SUBMITTED`, `UPLOADED`, `PENDING`) but client labels collapse to "Submitted" / "Ready to submit" | `apps/web/src/lib/order-status.ts` |
| 2 | **`APPROVED` never set** — QA jumps `READY_FOR_QA` → `DELIVERED` | `order-detail-page.tsx`, `orders.service.ts` |
| 3 | **`DRAFT` never auto-created** — legacy enum only | `orders.service.ts` `createOrder` |
| 4 | Admin can set `REVISION_REQUIRED` via dropdown **without** required revision fields → API error | `orders-page.tsx`, `orders.validator.ts` |
| 5 | QA can post `REVISION` comment **without** changing order status | `order-comments-panel.tsx` |
| 6 | **Activity tab duplicates Timeline** (workflow-only subset) | `order-detail-page.tsx` |
| 7 | One revision request → **3 timeline entries** (workflow + COMMENT_CREATED + comment row) | `order-comments.service.ts`, `orders.service.ts` |
| 8 | Editor list actions lack validation that detail page has | `orders-page.tsx` vs `order-detail-page.tsx` |
| 9 | Client sees "Order submitted successfully" even during `REVISION_REQUIRED` | `order-upload-panel.tsx` |
| 10 | Notifications created in DB but **no notification UI** in admin/web | `notifications.service.ts` |

---

### 1.3 Duplicate Statuses

| Pair | Relationship |
|------|----------------|
| `DRAFT` ↔ `SUBMITTED` | Both = pre-upload; only `SUBMITTED` is used on create |
| `SUBMITTED` ↔ `PENDING` | Both labeled "Submitted" on client |
| `APPROVED` ↔ `DELIVERED` | `APPROVED` unused; approval = `DELIVERED` |
| `READY_FOR_QA` ↔ `QA_REVIEW` (proposed) | Not in schema; `READY_FOR_QA` is the real QA state |
| `IN_PROGRESS` ↔ `EDITING` (proposed) | `IN_PROGRESS` is the real editing state |
| `UploadStatus.UPLOADED` ↔ `OrderStatus.UPLOADED` | Same name, different meaning (file vs order) |

---

### 1.4 Confusing Statuses

| Status | Why Confusing |
|--------|----------------|
| `UPLOADED` | Client label "Ready to submit" sounds like the opposite of done |
| `PENDING` | Client label "Submitted" — same as `SUBMITTED` |
| `ASSIGNED` | Hidden under "In production" with `IN_PROGRESS` |
| `READY_FOR_QA` | Raw enum shown in admin (`StatusBadge`) |
| `APPROVED` | In dropdowns/timeline but never reached in live flow |
| `DELIVERED` | Means "QA approved" not "client accepted" |

---

### 1.5 Unused / Legacy Statuses

| Status | Verdict |
|--------|---------|
| `DRAFT` | Legacy — not set by `createOrder` |
| `APPROVED` | Dead — QA uses `DELIVERED` directly |
| `CANCELLED` | Allowed via PATCH; no dedicated UI flow |

---

### 1.6 Missing Transitions

| Gap | Detail |
|-----|--------|
| No `COMPLETED` | Client acceptance not modeled |
| No CLIENT transition guards | CLIENT can PATCH to `PENDING` without `submitOrder` billing |
| `assignQa` | Does not change status — QA may not know order is ready |
| `APPROVED` → `DELIVERED` | Skipped entirely |

---

### 1.7 Recommended Simplified Workflow

**Do not remove statuses yet** — this is the target after impact analysis:

```
SUBMITTED         → Order placed, awaiting uploads
UPLOADED          → Files uploaded, awaiting formal submit
PENDING           → In production queue (rename label: "In queue")
ASSIGNED          → Editor assigned
IN_PROGRESS       → Editing (label: "Editing")
READY_FOR_QA      → QA review (label: "QA Review")
REVISION_REQUIRED → Revision loop
DELIVERED         → Delivered to client
CANCELLED         → Cancelled
```

**Deprecate (after migration):** `DRAFT`, `APPROVED`  
**Optional future:** `COMPLETED` for client sign-off

---

## PART 2 — Status Simplification & Impact Analysis

### 2.1 Full Status Audit

| Status | Set By | Used in Filters | Client Label | Admin Display | Remove? |
|--------|--------|-----------------|--------------|---------------|---------|
| `DRAFT` | Manual PATCH only | Excluded from prod queue | Draft | Raw enum | **Deprecate** |
| `SUBMITTED` | `createOrder` default | Excluded from prod queue | Submitted | Raw enum | **Keep** |
| `UPLOADED` | Client PATCH | Excluded from prod queue | Ready to submit | Raw enum | **Keep** — fix label |
| `PENDING` | `submitOrder` | Admin default filter | Submitted | Raw enum | **Keep** — fix label |
| `ASSIGNED` | `assignEditor` | Prod queue | In production | Raw enum | **Keep** |
| `IN_PROGRESS` | Editor | Prod queue | In production | Raw enum | **Keep** |
| `READY_FOR_QA` | Editor | QA inbox | Quality review | Raw enum | **Keep** |
| `REVISION_REQUIRED` | QA | QA inbox | Quality review | Raw enum | **Keep** |
| `APPROVED` | **Never** | QA queue filter (legacy) | Approved | Raw enum | **Deprecate** |
| `DELIVERED` | QA | QA inbox | Delivered | Raw enum | **Keep** |
| `CANCELLED` | Client PATCH | Visible to client | Cancelled | Raw enum | **Keep** |

---

### 2.2 Impact of Removing Statuses

| If Removed | Impact | Mitigation |
|------------|--------|------------|
| `DRAFT` | Existing DRAFT orders break filters/labels | Migrate DRAFT → SUBMITTED |
| `APPROVED` | Timeline/queue filters reference it | Remove from filters; map historical rows to DELIVERED |
| Merge SUBMITTED+UPLOADED | Breaks upload/submit billing gate | **Do not merge** without redesigning `submitOrder` |
| Merge PENDING+ASSIGNED | Loses "in queue" vs "editor picked up" | Keep separate; improve labels only |

---

### 2.3 Minimum Recommended Set (9 Statuses)

```
SUBMITTED · UPLOADED · PENDING · ASSIGNED · IN_PROGRESS ·
READY_FOR_QA · REVISION_REQUIRED · DELIVERED · CANCELLED
```

---

### 2.4 Status Transition Matrix

#### Enforced transitions (`order-status-transitions.ts`)

Only **EDITOR** and **QA** are validated. **ADMIN** and **CLIENT** bypass this file.

| From | EDITOR may set | QA may set |
|------|----------------|------------|
| `ASSIGNED` | `IN_PROGRESS` | — |
| `IN_PROGRESS` | `READY_FOR_QA` | — |
| `REVISION_REQUIRED` | `IN_PROGRESS`, `READY_FOR_QA` | — |
| `READY_FOR_QA` | — | `DELIVERED`, `REVISION_REQUIRED` |

#### Who can set which statuses (`ensureCanUpdateStatus`)

| Role | Allowed Target Statuses | Extra Gates |
|------|-------------------------|-------------|
| **ADMIN / SUPER_ADMIN** | Any | None |
| **CLIENT** | `DRAFT`, `SUBMITTED`, `UPLOADED`, `PENDING`, `CANCELLED` | Org membership |
| **EDITOR** (assigned) | `IN_PROGRESS`, `READY_FOR_QA` | QA assigned + deliverables for `READY_FOR_QA` |
| **QA** (assigned) | `DELIVERED`, `REVISION_REQUIRED` | Revision notes required; `DELIVERED` only from `READY_FOR_QA` |

#### Special endpoints (not generic PATCH)

| Action | Who | From → To |
|--------|-----|-----------|
| `createOrder` | CLIENT / ADMIN | → `SUBMITTED` |
| `markOrderUploaded` | CLIENT | → `UPLOADED` |
| `submitOrder` | CLIENT | `UPLOADED` → `PENDING` |
| `assignEditor` | ADMIN | `PENDING` → `ASSIGNED` |
| `assignQa` | ADMIN | No status change |
| `requestOrderRevision` | QA | `READY_FOR_QA` → `REVISION_REQUIRED` |

---

## PART 3 — QA Asset Visibility Bug (P0)

### 3.1 Symptom

Editor uploads **4** deliverables. QA "Current submission" shows **1**. Editor deliverable history may still show all 4.

### 3.2 Root Cause

**Primary: backend race in `completeDeliverableUpload`**

When the editor uploads files **in parallel**, each completion can see `currentBatchCount === 0`, bump `deliverableVersion`, and run a global `updateMany` setting **all other assets** `isCurrent: false`. Only the **last** completion keeps `isCurrent: true`.

**Secondary: frontend QA filter**

QA panel uses `getCurrentDeliverables()` which requires `isCurrent === true`. Editor history uses `groupDeliverablesByVersion()` which does **not** filter on `isCurrent` — hence the split symptom.

### 3.3 Bug Classification

| Type | Verdict |
|------|---------|
| Backend bug | **Yes** — concurrency in batch completion |
| Frontend bug | **Symptom amplifier** — filter hides non-current assets |
| Query bug | No — API returns all assets |
| Pagination | No — `limit: 100` |
| Version bug | Indirect — version bump races |
| Permission bug | No — QA would see 0, not 1 |

### 3.4 Verification SQL

```sql
SELECT id, "fileName", status, version, "reviewRound", "isCurrent", "createdAt"
FROM "Asset"
WHERE "orderId" = '<orderId>' AND "isDeleted" = false
ORDER BY "createdAt";
```

**Bug signature:** 4 rows `status = READY`, same `version`/`reviewRound`, only 1 `isCurrent = true`.

### 3.5 Data Flow

| Step | Component | Behavior |
|------|-----------|----------|
| Upload | `deliverable-upload-panel.tsx` | Parallel `runUpload` per file |
| Complete | `assets.service.ts` → `completeDeliverableUpload` | Race on `isCurrent` batch logic |
| Editor view | `deliverable-history.tsx` | Groups by version — shows all READY |
| QA view | `qa-review-panel.tsx` | Filters `getCurrentDeliverables` — shows only `isCurrent: true` |
| API fetch | `order-detail-page.tsx` | `GET /assets?orderId=&limit=100` — returns all |

### 3.6 Files Needing Fix (Approval Required)

| Priority | File | Fix |
|----------|------|-----|
| **P0** | `services/api/src/modules/assets/assets.service.ts` (~360–415) | Serialize batch completion; narrow `updateMany`; demote only prior versions |
| **P1** | `apps/admin/src/components/deliverable-upload-panel.tsx` (~107–109) | Sequential uploads as short-term mitigation |
| **P2** | `apps/admin/src/lib/asset-gallery-adapter.ts` | Defensive: derive current by `version + reviewRound` |
| **Data** | One-time repair script | Set `isCurrent = true` on all READY assets in current batch |

---

## PART 4 — Super Admin UX Audit

### 4.1 Pain Points

| Area | Issue |
|------|-------|
| **Dashboard** | Recent orders table has no links; KPIs load global data |
| **Order detail** | 5 tabs (Overview, Assets, Comments, Timeline, Activity) — Activity redundant |
| **Status flow** | 11-value dropdown with no human labels; `REVISION_REQUIRED` breaks without modal |
| **Assignment** | Editor/QA assign on list only; detail is read-only for assignments |
| **Revision** | Two paths: QA modal (correct) vs Comments type REVISION (dead end) |
| **QA flow** | Two nav entries (`/admin/qa` + `/admin/orders`) for same inbox |
| **Debug UI** | "Temporary debug" card on QA queue — not production-ready |

### 4.2 Too Many Clicks

| Task | Current Path | Clicks |
|------|--------------|--------|
| QA approve order | Queue → order → Assets tab → Approve | 3+ |
| Editor upload + submit to QA | Orders → order → Assets → Overview | 4 tabs |
| Investigate issue | Overview → Comments → Timeline → Activity | 4 tabs |

### 4.3 Recommendations

1. **Merge Activity into Timeline** — remove one tab
2. **Role/status default tab** — Editors land on Assets when `ASSIGNED`/`IN_PROGRESS`
3. **Single QA queue nav** — remove duplicate `/admin/orders` for QA
4. **Remove debug card** from production QA queue
5. **Human-readable status labels** in admin (mirror client mapping)
6. **Revision modal only** — remove `REVISION` from comment compose for QA/admin
7. **Dashboard deep links** — link recent orders to detail
8. **List actions** — mirror detail validations or remove shortcuts

---

## PART 5 — Order Flow Audit

| Stage | Screen | Issues |
|-------|--------|--------|
| **Creation** | Wizard step 5 "Place Order" | Implies done before upload — OK if success banner explains next step |
| **Upload** | Upload panel | 3 progress indicators on detail page (redundant) |
| **Assignment** | Admin orders list | Hidden from default queue until `PENDING` |
| **Editor submission** | Assets tab | Parallel upload triggers P0 bug |
| **QA review** | QaReviewPanel | Only sees `isCurrent` assets |
| **Revision** | Comments vs QA modal | Duplicate paths; inconsistent history |
| **Delivery** | Client deliverables | Only at `DELIVERED`; `APPROVED` path unused |

### Dead Ends

- Admin `REVISION_REQUIRED` dropdown without revision fields
- QA comment-only revision (no status change)
- Client feedback with no editor assigned
- ZIP download placeholder ("ZIP packaging will be added later")

---

## PART 6 — Comments Module Audit

### 6.1 Duplication Map

| Event | Timeline Entries |
|-------|------------------|
| QA revision request | `REVISION_REQUESTED` + `COMMENT_CREATED` + `REVISION` comment |
| Editor assigned | `EDITOR_ASSIGNED` + `SYSTEM` comment |
| QA assigned | `QA_ASSIGNED` + `SYSTEM` comment |
| User comment | `COMMENT_CREATED` + comment row |

### 6.2 Admin Tab Overlap

| Tab | Source | Overlap |
|-----|--------|---------|
| **Comments** | `GET /order-comments/orders/:id` | Full comment list with filters/actions |
| **Timeline** | Merged timeline API | Workflow events + same comments |
| **Activity** | `GET /workflow/orders/:id/events` | Workflow events only — subset of Timeline |

### 6.3 Gaps

- No `orderId` on notifications → no deep links
- No notification bell UI in admin or web
- Web client: no realtime, no timeline, `CLIENT_FEEDBACK` only
- QA cannot resolve comments from UI despite backend permission
- `parentId` threading in API, no UI
- Revision history in QA panel reads workflow events only — diverges from Comments tab

### 6.4 Recommendations

1. Deduplicate timeline merge (skip `COMMENT_CREATED` when comment row exists)
2. Single revision path via `POST /orders/request-revision`
3. Unify revision history (comments OR workflow, not both)
4. Add notification UI with order deep links
5. Expose QA resolve actions in comment UI

---

## PART 7 — Deliverables Summary

### 7.1 Bugs Found (Ranked)

| ID | Severity | Bug |
|----|----------|-----|
| **BUG-001** | P0 | QA sees 1 deliverable — `isCurrent` race on parallel upload |
| **BUG-002** | P1 | Admin `REVISION_REQUIRED` dropdown fails without revision fields |
| **BUG-003** | P1 | QA `REVISION` comment does not change order status |
| **BUG-004** | P1 | `countCurrentReadyDeliverables` may be 1 when 4 exist — editor can submit to QA prematurely |
| **BUG-005** | P2 | Client "submitted successfully" shown during `REVISION_REQUIRED` |
| **BUG-006** | P2 | Notifications created but not displayed |
| **BUG-007** | P2 | Client feedback with no assigned editor → empty notifications |
| **BUG-008** | P3 | Stale Prisma client in `packages/database` does not match root schema |

### 7.2 Screens Requiring Redesign

| Screen | Change |
|--------|--------|
| Admin order detail | Remove Activity tab; default tab by role/status |
| Admin orders list | Fix revision dropdown; align list actions with detail |
| QA queue | Remove debug card; single nav entry |
| QA review panel | Show all deliverables in current batch (after BUG-001 fix) |
| Admin status badges | Human-readable labels |
| Client order detail | Consolidate progress indicators; status-aware messaging |
| Client upload panel | Fix copy for revision states |
| Dashboard | Add order links; scope KPIs |

### 7.3 Exact Files for Fixes (When Approved)

#### P0 — QA Assets

- `services/api/src/modules/assets/assets.service.ts`
- `apps/admin/src/components/deliverable-upload-panel.tsx`
- `apps/admin/src/lib/asset-gallery-adapter.ts`

#### P1 — Status / Workflow

- `apps/web/src/lib/order-status.ts`
- `apps/admin/src/components/orders-page.tsx`
- `apps/admin/src/components/order-detail-page.tsx`
- `services/api/src/modules/orders/orders.validator.ts`

#### P1 — Comments / Timeline

- `services/api/src/modules/order-comments/order-comments.service.ts`
- `services/api/src/modules/orders/orders.service.ts`
- `apps/admin/src/components/order-comments-panel.tsx`
- `apps/admin/src/components/order-timeline-panel.tsx`
- `apps/admin/src/components/qa-review-panel.tsx`

#### P2 — UX Polish

- `apps/admin/src/components/dashboard-overview.tsx`
- `apps/web/src/components/order-upload/order-upload-panel.tsx`
- `apps/web/src/components/client-order-comments.tsx`
- `services/api/src/modules/notifications/notifications.service.ts`

### 7.4 Cross-Role Duplicate Actions

| Action | Locations | Problem |
|--------|-----------|---------|
| Start work (`IN_PROGRESS`) | Orders list, order detail Overview | Duplicate; list lacks context |
| Mark ready for QA | Orders list, order detail Overview | List missing validation UX |
| Request revision | `QaReviewPanel` modal, Comments panel type `REVISION` | Modal = full workflow; panel = comment only |
| View activity | Timeline tab, Activity tab, QA revision history | Three partial views |
| Assign editor/QA | Orders list dropdowns, detail Overview | Assign on list only |
| Approve/deliver | QA panel Approve → `DELIVERED` | Skips `APPROVED`; status enum misleading |

---

## Recommended Stabilization Sequence

No new features. Implement in this order:

1. **Fix BUG-001** (QA deliverables) — backend + optional sequential upload
2. **Data repair** for affected orders (`isCurrent` batch reconciliation)
3. **Label pass** — client + admin status humanization
4. **Remove Activity tab** + timeline deduplication
5. **Single QA revision path** — remove `REVISION` from comment compose for QA/admin
6. **Notification UI** with order deep links
7. **Status deprecation plan** for `DRAFT` and `APPROVED` (migrate, then remove from UI)

---

## Key File Index

| Area | Path |
|------|------|
| Prisma schema | `prisma/schema.prisma` |
| Status transitions | `services/api/src/modules/orders/order-status-transitions.ts` |
| Orders service | `services/api/src/modules/orders/orders.service.ts` |
| Assets service | `services/api/src/modules/assets/assets.service.ts` |
| Comments service | `services/api/src/modules/order-comments/order-comments.service.ts` |
| Workflow events | `services/api/src/modules/workflow/workflow.service.ts` |
| Client status labels | `apps/web/src/lib/order-status.ts` |
| Admin order detail | `apps/admin/src/components/order-detail-page.tsx` |
| Admin orders queue | `apps/admin/src/components/orders-page.tsx` |
| QA review panel | `apps/admin/src/components/qa-review-panel.tsx` |
| Deliverable upload | `apps/admin/src/components/deliverable-upload-panel.tsx` |
| Asset gallery adapter | `apps/admin/src/lib/asset-gallery-adapter.ts` |
| Admin comments | `apps/admin/src/components/order-comments-panel.tsx` |
| Admin timeline | `apps/admin/src/components/order-timeline-panel.tsx` |
| Web client comments | `apps/web/src/components/client-order-comments.tsx` |
| Web order detail | `apps/web/src/app/dashboard/orders/[orderId]/page.tsx` |

---

## Related Documents

- `FOTOPIXELZ_PROJECT_STATUS_REPORT.md` — broader project status
- `ORDER_COMMENTS_TESTING_CHECKLIST.md` — comments module test plan

---

*This document is audit-only. No code changes were made as part of its creation.*
