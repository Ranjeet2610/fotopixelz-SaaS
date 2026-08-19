# Client Dashboard — Final Design Specification

**Status: Approved and implemented for the dashboard route.** This document converts the approved **Direction D v2** mockup (`docs/REDESIGN-DIRECTION.md` §9.1/§10; published mockups referenced there) into a build-ready specification. Visual direction is locked as **image-production-first, premium, visual, spacious**.

**Color note (superseding update):** every reference to "Electric Coral" or `#FF5A36` below is superseded by `docs/REDESIGN-DIRECTION.md` §0.2/§7.1 — the Fotopixelz brand accent is now a deep, original green, not coral. The *rule* these references were making (status color is never drawn from the brand accent) is unchanged; only the brand hue itself changed. This dashboard's own color values will be updated when the full-app design-system implementation lands (`docs/CLIENT-UI-REDESIGN.md`).

**Scope note:** this document covers `/dashboard` only. Per `docs/REDESIGN-DIRECTION.md` §0.1, the redesign now covers every Client route — see `docs/CLIENT-UI-REDESIGN.md` for the complete route inventory and page-by-page priority; this document remains the authoritative spec for the dashboard page specifically.

**Governing question:** *"What is happening with my image production?"*

---

## 1. Final information architecture

Top to bottom, in the order the page renders:

1. Top navigation bar
2. Production overview header (greeting + credit/trial stats)
3. Hero production card + Up next stack (two-column band)
4. In production filmstrip
5. Ready to download (proof sheet)
6. Order log (quiet list)

This is a **single-scroll dashboard**, not a tabbed or paginated one — every section is real content, not a widget added to fill space, per the section-by-section purpose in §2.

---

## 2. Every section and its purpose

### 2.1 Top navigation bar
**Purpose:** persistent wayfinding + identity + the single highest-value action (start an order). Not a content section — present on every authenticated client page, not just the dashboard.

### 2.2 Production overview header
**Purpose:** answers "how many things are moving, and where do I stand on credits/trial" in one glance, before any list. Typographic, not boxy — large numerals for credits/trial rather than three identical stat panels (the V1 mistake this corrects).

### 2.3 Hero production card
**Purpose:** surfaces the single most actionable order — the one closest to needing the customer's input (typically the most recently updated non-terminal order, or the one in `SUBMITTED`/`UPLOADED` awaiting the customer's own upload action). This is a "continue where you left off" mechanic, not a random recent order.

### 2.4 Up next stack
**Purpose:** the next 2 orders in active production after the hero, giving a sense of pipeline depth without duplicating the full filmstrip below.

### 2.5 In production filmstrip
**Purpose:** the working list of everything currently active (any non-terminal, non-hero status), image-led, scannable at a glance via the stage track rather than read-in-detail.

### 2.6 Ready to download
**Purpose:** the payoff moment — deliverables the customer can act on right now. Proof-sheet density (many small thumbnails) because the job here is "grab what I need," not "study each order."

### 2.7 Order log
**Purpose:** a compact factual record (order #, title, status, image count, amount) for orientation and light bookkeeping — deliberately quiet/small relative to the sections above it, so it reads as a record, not a second attempt at the same content.

---

## 3. Components required

| Component | Used in | Shared with Admin? |
|---|---|---|
| `TopNav` | 2.1 | App-specific shell, shares nav *principles* only |
| `AccountStat` (large numeral + label) | 2.2 | Client-only |
| `HeroProductionCard` | 2.3 | Client-only |
| `UpNextCard` (compact horizontal image+caption card) | 2.4 | Structurally close to `ProductionCard` (see §14) |
| `ProductionCard` (image top, caption + `StageTrack` below) | 2.5 | **Shared primitive** — Admin's board cards are the same shape with a different footer slot |
| `StageTrack` (discrete segmented pipeline indicator) | 2.5 | **Shared** |
| `StatusChip` (on-image overlay variant + inline variant) | 2.3–2.7 | **Shared** — same status-color rules as `docs/DESIGN-SYSTEM.md` §2/§8 |
| `ProofSheetTile` (thumbnail + hover download affordance) | 2.6 | Client-only shape; Admin has no equivalent grid |
| `OrderLogRow` | 2.7 | Client-only |
| `Thumbnail` (lazy, presigned-URL-backed image) | 2.3–2.7 | **Shared** — wraps the same mechanism `packages/upload-gallery`'s `LazyUploadPreview`/`LazyDeliverablePreview` already implements |
| `Button` | throughout | Shared primitive |

---

## 4. Real CURRENT data used by each component

All fields below are verified against `docs/27-DATABASE.md` and `docs/26-API.md` — nothing here is invented.

- **`AccountStat` (credits):** `Organization.freeImageCredits`, `Organization.usedImageCredits` — via the organization fetch already used by `apps/client/src/components/organization-provider.tsx`.
- **`AccountStat` (trial):** `Organization.trialEndsAt`, computed to a days-remaining value (`apps/client/src/lib/workspace.ts`'s existing `getTrialDaysRemaining` — reuse, don't reimplement).
- **`HeroProductionCard` / `ProductionCard` / `UpNextCard` / `OrderLogRow`:** `Order.orderNumber`, `Order.title`, `Order.status` (real `OrderStatus` enum value — see §8), `Order.totalImages`, `Order.totalAmount`, `Order.currency`, `Order.dueDate`/`dueAt` (nullable — see §8's honest-display rule), `Order.reviewRound` (for revision-round display, e.g. "R2"). All via `GET /orders` (list) and `GET /orders/:id` (detail), scoped to the client's own organization per `docs/08-ORDERS.md`'s access rules.
- **Upload progress text** ("4 of 12 uploaded"): derived from `Upload` records with `status: 'UPLOADED'` for the order versus `Order.totalImages`, via `GET /uploads/order/:orderId` — the same data the current upload panel already computes.
- **`Thumbnail` on active/in-production cards:** the order's source upload previews, via `GET /uploads/:id/preview-url` (presigned GET, `docs/09-UPLOADS.md`) — real customer-uploaded images, not fabricated.
- **`ProofSheetTile` / `Thumbnail` on delivered cards:** deliverable asset previews, via the existing deliverable presigned-preview mechanism (`docs/10-ASSETS.md`), and the download action uses `GET /assets/:assetId/download-url`.
- **Assignee/editor identity:** **not shown on Client** — `Order.assignedEditorId` exists but resolves to internal staff identity, which is not customer-facing information; omitted by design, not by oversight.

---

## 5. TARGET data — must remain clearly marked as future

None of the following exist today (cross-checked against `docs/14-PAYMENTS-AND-BILLING.md`, `docs/16-NOTIFICATIONS.md`, `docs/17-ANALYTICS.md`, `docs/19-WORKERS-AND-JOBS.md`). If any of these are surfaced on the dashboard in implementation, they must be presented as what they are — real navigation to a real (if minimal) destination, or an explicit "not available yet" state — never as live functioning data:

- **SLA / at-risk indicators** — no SLA policy or breach-detection model exists. Only `Order.dueDate` is real; display it as "Due [date]" or "No due date set," never as a computed on-track/at-risk status.
- **Approval rate / quality score** — no such metric exists anywhere in the schema.
- **Billing UI** — `Payment`/`Invoice` are unused dead schema; a "Billing" nav entry may link to a real (stub) page, never to a fabricated invoice history.
- **Support** — no helpdesk/ticketing module exists. A "Contact support" link using the real `SUPPORT_EMAIL` env-configured address (`docs/31-DEPLOYMENT.md`) is legitimate; a support ticket widget is not.
- **Team/member management** — `Membership`/multi-user org support is real at the API level (`docs/05-ORGANIZATIONS.md`) but has no confirmed client UI; do not design a working "invite teammate" flow into this dashboard without first confirming that UI is being built.
- **Specifications as a structured system** — orders only have free-text `instructions` plus structured `OrderItem` service/quantity lines; there is no separate "spec sheet" object. A "specifications" nav entry should point at real instructions/line-item data, not an invented structured-spec feature.

---

## 6. Image / thumbnail behavior

- **Real imagery only, wherever a real asset exists.** Source upload thumbnails once uploads exist; deliverable thumbnails once assets exist. Both are backed by real presigned-URL fetch mechanisms already implemented (`packages/upload-gallery`) — the redesign should reuse that lazy-loading logic, not rebuild it.
- **Before any upload exists** (order in `SUBMITTED` with zero uploads), the hero/production card shows a clearly-a-placeholder treatment (the abstract diagonal-hatch pattern used in the mockups) — never a stock photo or a fabricated "customer image."
- **Lazy loading:** thumbnails fetch on viewport visibility (the existing `use-lazy-preview-loader.ts` pattern), not all at once — this matters more here than before since the redesign surfaces meaningfully more images per page than the current dashboard.
- **Aspect/crop:** all production-card and proof-sheet thumbnails use a fixed-ratio crop (not the source image's native aspect) so the grid/filmstrip stays visually even — cropping is a presentation choice, not a data change; the full-resolution original remains reachable via download.

---

## 7. Order status presentation

- **Always the real `OrderStatus` value**, styled through `StatusChip`, never a paraphrased or simplified label that could misrepresent what's actually happening. The full enum (`docs/08-ORDERS.md`): `DRAFT`, `SUBMITTED`, `UPLOADED`, `PENDING`, `ASSIGNED`, `IN_PROGRESS`, `READY_FOR_QA`, `REVISION_REQUIRED`, `APPROVED`, `DELIVERED`, `CANCELLED`.
- **Two presentation modes**, same underlying status data:
  - **On-image overlay chip** (hero, filmstrip, up-next) — compact, semi-opaque background so it reads over any thumbnail tone.
  - **Inline chip** (order log) — the existing dot-plus-label pattern.
- **Color mapping** follows `docs/DESIGN-SYSTEM.md` §2/§8's locked rule: status color is always drawn from the success/warning/error/info palette, never from the brand accent (formerly Electric Coral, now the Fotopixelz green per `docs/REDESIGN-DIRECTION.md` §7.1 — the rule itself is unchanged, see that section for how the success/brand-green collision is resolved).
- **`StageTrack`** (filmstrip only) is a discrete 5-segment indicator, not a percentage bar — segments map to a fixed conceptual sequence (uploaded → assigned → in progress → QA → delivered); it is a *visualization of the real status enum's position*, not a separately computed progress percentage.
- **`DRAFT` status:** per `docs/08-ORDERS.md`, no confirmed code path currently creates an order in `DRAFT` — the dashboard does not need a specific presentation for it beyond the generic chip styling, since it should not occur in practice today.

---

## 8. Responsive behavior

| Breakpoint | Behavior |
|---|---|
| **Desktop (≥1280px)** | As mocked: hero (1.6fr) + up-next (1fr) two-column band; filmstrip at 4 columns; proof sheet at 8 columns; order log as a 6-column grid row. |
| **Tablet (768–1279px)** | Hero + up-next stack vertically (hero first, full width; up-next below as a horizontal 2-up row, not stacked, to avoid excessive scroll). Filmstrip drops to 2 columns. Proof sheet drops to 4–5 columns. Order log keeps its grid-row shape but drops the amount column's fixed width in favor of flexible truncation. |
| **Mobile (<768px)** | Fully vertical stack, one column throughout. Hero card retains full-bleed-within-padding image treatment (this is the flagship "premium" moment and should not be compressed disproportionately). Up-next and filmstrip both become a single-column vertical list of `ProductionCard`s (image left, caption right, per the up-next card's existing horizontal shape — reused here rather than inventing a third card layout). Proof sheet drops to 3 columns (thumbnails must stay large enough to be recognizable, not shrink indefinitely). Order log converts from a grid-row table to a stacked card-per-row layout (thumbnail + title on one line, status/images/amount on a second line) — the grid-column table shape does not survive narrow viewports. |

Premium visual quality must hold at every breakpoint per `docs/24-UI-UX.md` — mobile is not a reduced-effort target.

---

## 9. Empty states

- **No active orders at all** (new account, nothing yet placed): hero band is replaced by a single centered prompt — "Start your first order" with the primary CTA — not an empty hero card with placeholder content pretending to be real.
- **No orders in production but some delivered:** filmstrip section is omitted entirely (not shown as an empty grid) — sections with nothing to show do not render, per the "don't pad with filler" content discipline already established in this project's design guidance.
- **Nothing ready to download:** proof-sheet section omitted, same rule.
- **Order log has fewer than a "page" of entries:** shows exactly what exists, no placeholder rows.

---

## 10. Loading states

- **Skeleton-shaped, not spinner-first**, per `docs/DESIGN-SYSTEM.md` §8: the hero card, filmstrip cards, and proof-sheet tiles should load as gray/muted shapes matching their final geometry (image block + caption lines), not a centered spinner replacing the whole section.
- **Account stats** (§2.2) can use a simple text/number skeleton (thin muted bar) since they're typographic, not image-shaped.
- **Order log** rows can skeleton as their real row shape (thumbnail block + text bars).
- Thumbnail images specifically use the existing lazy-preview loading state (`PreviewFetchStatus`: `idle`/`loading`/`ready`/`error`/`skipped`) already implemented in `packages/upload-gallery` — reuse that state machine rather than inventing a new one.

---

## 11. Error states

- **Section-level fetch failure** (e.g. orders list fails to load): an inline `Alert` (error variant, per the shared component) in place of that section — not a full-page failure, since other sections may have loaded successfully.
- **Individual thumbnail failure:** falls back to the existing placeholder treatment (matches `packages/upload-gallery`'s current `error`/fallback handling) rather than a broken-image icon.
- **Download failure** (proof sheet / order detail download): inline error text near the action, consistent with the existing upload/asset error-messaging pattern (`docs/29-ERROR-HANDLING.md`) — not a modal interruption.

---

## 12. Hover / interaction behavior

- **Production cards (hero, up-next, filmstrip):** on hover, a subtle border-color shift toward the foreground ink and a slight elevation (shadow), consistent with `docs/DESIGN-SYSTEM.md` §6's "shadows only for real elevation" rule — applied here because hover is a genuine state change, not decoration. No image zoom/parallax — that would cross into "decorative motion," which is explicitly out of scope.
- **Proof-sheet tiles:** the circular download affordance is present at rest (low opacity/subtlety) and strengthens (full opacity, background darkens slightly) on hover — it must be discoverable without hovering, since touch devices have no hover state.
- **Order log rows:** row background tints toward `surface-tint` on hover, entire row is clickable (not just an icon), consistent with standard table-row interaction patterns already used elsewhere in the product.
- **All interactive elements:** clear focus-visible states for keyboard navigation (existing accessibility baseline, `docs/24-UI-UX.md`), not just mouse-hover states.

---

## 13. Component reuse between Client and Admin

Shared (same component, same visual rules, potentially different data bound in): `ProductionCard`, `StageTrack` (Client only uses it directly in the filmstrip; Admin's board cards may or may not need it — see `docs/ADMIN-DASHBOARD.md`), `StatusChip` (both overlay and inline variants), `Thumbnail`, `Button`, order-number/currency/date formatting utilities.

Not shared: `AccountStat`, `HeroProductionCard`, `UpNextCard`, `ProofSheetTile`, `OrderLogRow`, `TopNav`'s specific nav-item set — these are shaped around Client's specific jobs and have no Admin equivalent (see `docs/ADMIN-DASHBOARD.md` §14/§15 for the Admin-side mirror of this list).

---

## 14. What must NOT change

Per `docs/REDESIGN-DIRECTION.md` §2: every data point above is read from the real API (`docs/26-API.md`) using the real order state machine (`docs/08-ORDERS.md`) — this specification describes presentation only. No new endpoint, field, or business rule is required to build this dashboard as specified; everything in §4 already exists.
