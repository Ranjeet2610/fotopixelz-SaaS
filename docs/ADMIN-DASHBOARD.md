# Admin Dashboard — Final Design Specification

**Status: Approved and implemented for the dashboard route.** This document converts the approved **Direction D v2** mockup (`docs/REDESIGN-DIRECTION.md` §9.2/§11) into a build-ready specification. Visual direction is locked as **production-control-center, operational, dense, workflow-first**.

**Color note (superseding update):** every reference to "Electric Coral" below is superseded by `docs/REDESIGN-DIRECTION.md` §0.2/§7.1 — the Fotopixelz brand accent is now a deep, original green, not coral. The shipped dashboard's icon rail currently uses coral for the brand mark tile (`apps/admin/src/app/globals.css`'s `.rail-brand`) — this is now a known, tracked follow-up to bring in line with the new palette, not a rule change to the component's structure.

**Scope note:** this document covers `/admin` (dashboard) only. Per `docs/REDESIGN-DIRECTION.md` §0.1, the redesign now covers every Admin route — see `docs/ADMIN-UI-REDESIGN.md` for the complete route inventory and page-by-page priority; this document remains the authoritative spec for the dashboard page specifically.

**Governing question:** *"What requires my operational attention?"*

---

## 1. Final information architecture

Top to bottom:

1. Icon rail (persistent navigation)
2. Header (staff identity/role + active-order count)
3. Needs assignment (intake strip)
4. Production board (kanban-style, one column per status + a sidebar column)

This is a **single-scroll operational board**, not a tabbed dashboard — the board itself is the primary interface, not a summary that links elsewhere.

---

## 2. Every section and its purpose

### 2.1 Icon rail
**Purpose:** persistent, minimal navigation (dashboard/orders/catalog/users/uploads) — icon-only by design, since admin staff use this daily and don't need labels after the first few visits. Not a content section.

### 2.2 Header
**Purpose:** identity/role confirmation (which matters given the tiered `ADMIN`/`SUPER_ADMIN` permission model, `docs/02-ROLES-AND-PERMISSIONS.md`) and a single top-line number ("N orders active") giving scale before any detail.

### 2.3 Needs assignment (intake strip)
**Purpose:** the single highest-priority queue — `PENDING` orders with no assigned editor are, by definition, stalled until a human acts. This is placed first and given real visual weight (image + title + count + one-click Assign), not buried in a table row, because it's the one thing that literally cannot progress without admin action.

### 2.4 Production board
**Purpose:** the actual state of everything in motion, organized as a visual workflow rather than a filtered list — a column *is* a status, and a card *is* an order in that status. This directly embodies "production control center": the layout structure mirrors the real production pipeline, not a generic data table.

### 2.5 Sidebar (workload / customer activity / insights)
**Purpose:** secondary context that supports triage decisions (who has capacity, which customers are active) without competing with the board for primary visual attention — deliberately narrower and quieter than the board columns.

---

## 3. Components required

| Component | Used in | Shared with Client? |
|---|---|---|
| `IconRail` | 2.1 | Admin-only |
| `AdminHeader` | 2.2 | Admin-only |
| `IntakeCard` (horizontal image+meta+Assign button) | 2.3 | Admin-only shape (structurally close to Client's `UpNextCard` but with an action button, not a status chip, as the primary right-side element) |
| `BoardColumn` (header with count + stacked cards) | 2.4 | Admin-only |
| `ProductionCard` (image top, caption below) | 2.4 | **Shared with Client** — same primitive as `docs/CLIENT-DASHBOARD.md` §3, with an assignee-name footer instead of a due-date/CTA footer |
| `WorkloadBar` (name + horizontal bar + count) | 2.5 | Admin-only |
| `CustomerActivityRow` | 2.5 | Admin-only |
| `InsightsPlaceholder` (dashed border, explicit "not available yet" copy) | 2.5 | Admin-only, but the *pattern* (honest TARGET placeholder, never fabricated data) should be reused anywhere else a not-yet-built metric might be tempting to fake |
| `StatusChip` / `Thumbnail` / `Button` | throughout | **Shared** with Client, see `docs/CLIENT-DASHBOARD.md` §3 |

---

## 4. Real CURRENT data used by each component

Verified against `docs/27-DATABASE.md`, `docs/26-API.md`, `docs/15-ADMIN.md`, `docs/02-ROLES-AND-PERMISSIONS.md`:

- **`AdminHeader`:** signed-in staff `User.name`/`User.role` (from the authenticated session, `docs/03-AUTHENTICATION.md`); active-order count derived from `GET /orders` filtered to non-terminal statuses, admin-scoped (`docs/08-ORDERS.md`'s `buildListWhere` already excludes `DRAFT`/`SUBMITTED`/`UPLOADED` from the default admin view — reuse that same scoping for the header count, don't reinvent it).
- **`IntakeCard`:** `Order.orderNumber`, `Order.title`, `Order.totalImages`, filtered to `status: PENDING` with `assignedEditorId: null` — this exact query is already how `docs/08-ORDERS.md`'s `ASSIGNABLE_ORDER_STATUSES` concept works; "Assign" triggers the existing `PATCH /orders/assign-editor` flow, unchanged.
- **`BoardColumn` counts:** simple `COUNT` per status, achievable directly from `GET /orders` grouped client-side or via existing list-with-filter calls — no new aggregation endpoint required.
- **`ProductionCard` (board):** same order fields as Client's `ProductionCard` (§4 of `docs/CLIENT-DASHBOARD.md`), plus assignee name resolved from `Order.assignedEditorId`/`assignedQaId` (already how `orders.service.ts` resolves editor/QA labels for notification emails — the same lookup, surfaced in the UI instead of just in email copy).
- **Revision round display** (e.g. "R2"): `Order.reviewRound`, real field.
- **`WorkloadBar`:** raw count of open orders per `assignedEditorId`/`assignedQaId` — a `GROUP BY`, not a capacity/utilization percentage (no staff-capacity data exists to compute a percentage against).
- **`CustomerActivityRow`:** recent/open order counts grouped by `Organization` — real, derivable from existing order data scoped by `organizationId`.
- **Thumbnails:** same real presigned-URL mechanism as Client (§6 of `docs/CLIENT-DASHBOARD.md`) — source uploads for in-progress orders, deliverables for delivered orders.

---

## 5. TARGET data — must remain clearly marked as future

Cross-checked the same way as the Client spec — none of the following exist today:

- **SLA risk / at-risk flag** — no SLA policy model exists (`docs/27-DATABASE.md` confirms no such table). A "sort the board/intake by `dueDate`, oldest first" behavior is CURRENT-buildable; a computed risk indicator, color, or badge is not, and must not appear.
- **Approval rate / quality score** — does not exist; QA outcome is only ever the real order-status transition (`READY_FOR_QA` → `DELIVERED`/`REVISION_REQUIRED`).
- **Workload as capacity/utilization %** — only raw open-order counts are real; a "editor1 is at 85% capacity" style display would require staff-capacity data that doesn't exist. Show the count, not a percentage.
- **Turnaround trend / analytics** — `docs/17-ANALYTICS.md` confirms the `analytics` module is a stub; `docs/19-WORKERS-AND-JOBS.md` confirms no analytics-rollup job runs. The `InsightsPlaceholder` component exists specifically to hold this honestly ("Turnaround trends and SLA tracking are not available yet") rather than displaying a fabricated chart or number.
- **Customer behavioral analytics** — the `CustomerActivityRow` may only show real order counts, never a derived "engagement score" or similar.

---

## 6. Image / thumbnail behavior

Same underlying mechanism and rules as `docs/CLIENT-DASHBOARD.md` §6 (real presigned uploads/deliverables, lazy loading, placeholder-only-when-genuinely-absent, fixed-ratio crop for grid evenness) — Admin's board and intake cards are visually smaller/denser than Client's, but the data source and loading discipline are identical. No separate image pipeline for Admin.

---

## 7. Order status presentation

- **The production board's column structure *is* the status presentation** — a card's column membership communicates its `OrderStatus` more directly than a chip would; `StatusChip` is therefore **not** required on board cards themselves (the column header already carries the status + color), but **is** required on the intake strip (where all cards share the same `PENDING` status, so a chip there would be redundant — intake cards instead emphasize the Assign action, not a status label) and anywhere order data appears outside the board (e.g. a future orders-list page, out of scope for this document).
- **Board columns map 1:1 to real `OrderStatus` values**: `IN_PROGRESS`, `READY_FOR_QA`, `REVISION_REQUIRED`, and a time-scoped `DELIVERED` (last 7 days, to keep the column bounded — not all-time delivered history, which belongs on a dedicated orders page).
- **Column header color** follows the same status-color rules as Client (`docs/DESIGN-SYSTEM.md` §2/§8) — `IN_PROGRESS` = info, `READY_FOR_QA` = warning, `REVISION_REQUIRED` = error, `DELIVERED` = success. Never the brand accent (formerly Electric Coral, now the Fotopixelz green per `docs/REDESIGN-DIRECTION.md` §7.1).
- **Statuses not represented as board columns** (`DRAFT`, `SUBMITTED`, `UPLOADED`, `PENDING`-but-assigned, `APPROVED`, `CANCELLED`): these are pre-production, terminal, or transitional states better suited to a dedicated orders list/filter view, not this at-a-glance board — `PENDING`-unassigned specifically is already covered by the intake strip (2.3).

---

## 8. Responsive behavior

| Breakpoint | Behavior |
|---|---|
| **Desktop (≥1440px)** | As mocked: 4 kanban columns + a fixed-width sidebar column, side by side. |
| **Laptop/tablet (1024–1439px)** | Kanban columns become **horizontally scrollable** within the board region (the sidebar drops below the board, full width, rather than shrinking columns to illegibility) — admin density is preserved by scrolling sideways through the workflow, not by cramming columns. |
| **Small tablet (768–1023px)** | Intake strip drops from 3 columns to 2. Board remains horizontally scrollable; sidebar panels stack full-width below, each still legible (workload bars, customer rows). |
| **Mobile (<768px)** | Admin is explicitly **not optimized as a mobile-first experience** — per `docs/24-UI-UX.md`, admin's registered priority is operational density, and this workflow (triage a production board) is a desk-based task. At minimum, the layout must not break: intake becomes a single column, the board becomes a vertically-stacked set of collapsible columns (column header + count always visible, cards revealed on expand) rather than an unusable horizontal-scroll-within-horizontal-scroll, and sidebar panels stack full width. This is a "remains usable," not "equally optimized," target. |

---

## 9. Empty states

- **No unassigned orders:** intake strip is replaced by a single quiet confirmation line ("No orders waiting on assignment") — not an empty 3-card grid.
- **Empty board column** (e.g. zero `REVISION_REQUIRED` orders): the column header and its `0` count still render (so the workflow shape stays visible and legible), but the column body shows a short muted line ("Nothing here right now") rather than an empty white space that could read as a loading/broken state.
- **No workload data / no editors assigned yet:** `WorkloadBar` panel shows a quiet placeholder line, not zero-width bars that look broken.

---

## 10. Loading states

- Same skeleton-first principle as Client (`docs/CLIENT-DASHBOARD.md` §10): intake cards and board cards skeleton as their real image+text shape.
- **Board columns load independently** where feasible (each column's data can arrive/render as soon as it's ready) rather than blocking the whole board on the slowest query — this matters more here than on Client since the board aggregates multiple status queries at once.
- Sidebar panels (workload, customer activity) skeleton as their own row shapes, independent of the board.

---

## 11. Error states

- **Board-column-level failure:** an inline error state *within that column* (not the whole board), consistent with the "sections fail independently" principle above.
- **Intake strip failure:** inline `Alert` (error variant) in place of the strip.
- **Assign action failure** (e.g. `PATCH /orders/assign-editor` rejects because the order is no longer `PENDING` — a real race condition possible with multiple admins): inline error on the specific card, not a full-page interruption, and the card should refresh its real state afterward rather than staying stale.

---

## 12. Hover / interaction behavior

- **Intake cards:** hover strengthens the border and reveals the Assign button at full opacity if it was previously more subdued (though given the intake strip's urgency, the Assign button should likely be visible at rest, not hover-revealed — hover here is a border/elevation cue only, consistent with Client's `ProductionCard` hover rule).
- **Board cards:** hover elevates slightly (same shadow rule as Client), and the entire card is clickable through to the order detail page — not just a nested link.
- **Board columns:** no drag-and-drop in this specification — cards do not move between columns by dragging; status changes happen through the existing order-detail actions (`PATCH /orders/status`, `docs/08-ORDERS.md`), and the board simply reflects the result on next load/refresh. Introducing drag-to-change-status is a **future consideration**, not part of this spec, since it would need its own validation-and-permission design against the real state-machine transition rules (`docs/08-ORDERS.md`'s `assertAllowedStatusTransition`) before it could be built safely.
- **Focus-visible states** for keyboard navigation, same baseline as Client.

---

## 13. Component reuse between Client and Admin

See `docs/CLIENT-DASHBOARD.md` §13 for the authoritative shared list (`ProductionCard`, `StageTrack` where applicable, `StatusChip`, `Thumbnail`, `Button`, formatting utilities). Admin additionally reuses the *pattern* of an honest TARGET placeholder (`InsightsPlaceholder`) that Client's dashboard does not currently need but should adopt the same pattern from if a similar gap arises there later.

---

## 14. Components that must remain app-specific

`IconRail`, `AdminHeader`, `IntakeCard`, `BoardColumn`, `WorkloadBar`, `CustomerActivityRow`, `InsightsPlaceholder` — all shaped around admin's density/triage jobs (`docs/REDESIGN-DIRECTION.md` §4.3/§6.2's "instrument panel" register) and have no meaningful Client equivalent. This mirrors `docs/CLIENT-DASHBOARD.md` §13's Client-only list (`AccountStat`, `HeroProductionCard`, `UpNextCard`, `ProofSheetTile`, `OrderLogRow`) — together the two lists are the concrete definition of "same product language, different register" from `docs/REDESIGN-DIRECTION.md` §4.3.

---

## 15. What must NOT change

Every data point in §4 is read from the real API/state machine — no new endpoint, field, or business rule is required. The board's column-per-status structure is a **read-only visualization** of `docs/08-ORDERS.md`'s existing state machine, not a new workflow engine; all actual status transitions continue to go through the existing, permission-checked `PATCH /orders/status`/`assign-editor`/`assign-qa`/`request-revision` endpoints exactly as documented.
