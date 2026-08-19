# UI Review — KEEP / IMPROVE / REDESIGN

> **⚠️ Strategy update:** Fotopixelz has moved to a ground-up UI/UX redesign (see `docs/24-UI-UX.md` and `docs/ROADMAP.md` Phase 1) instead of incremental visual polish. **The FUNCTIONALITY TO KEEP column below remains fully authoritative** — it is exactly the "functional foundation" the redesign must preserve. **The VISUAL DESIGN TO CHANGE / "IMPROVE" vs "REDESIGN" distinction below is superseded**: every page's visual layer is now in scope for a from-scratch redesign, not incremental "IMPROVE" polish — do not treat any "IMPROVE" verdict below as license to lightly restyle in place. Use this document going forward only to know *what functionality must survive*, not *how much visual change is warranted*.

Reconciles the earlier UI/UX audit (conducted before Pass 1–3 module documentation) with the confirmed functional status established in `docs/MODULE-MATRIX.md`. **Functionality and visual design are scored and decided separately** — a page can have KEEP-worthy functionality and still need a visual REDESIGN.

## How to read this document
- **FUNCTIONALITY TO KEEP** — the underlying logic, data flow, and interaction pattern is correct and should not be rebuilt. **Still authoritative.**
- **VISUAL DESIGN TO CHANGE** — originally scored as IMPROVE/REDESIGN per page; per the notice above, treat every instance as REDESIGN now.

---

## Authentication (Login / Register)
**FUNCTIONALITY TO KEEP:** Real validation, Google OAuth, error/notice banners, email-verification messaging — confirmed COMPLETE in `docs/03-AUTHENTICATION.md`. Do not rebuild the logic.
**VISUAL DESIGN TO CHANGE:** Already the most polished screen in the app relative to the rest — closest to production-ready visually, but still generic shadcn styling with no brand identity applied.
**Decision:** **KEEP functionality / IMPROVE visual** — apply the design system once defined, don't touch the flow logic.

## Client Dashboard (`/dashboard`)
**FUNCTIONALITY TO KEEP:** Demo/trial banner logic, credit/trial calculations, quick links — real, working.
**VISUAL DESIGN TO CHANGE:** Shallow, low-information cards; stale "Assets — coming soon" copy despite Assets being a fully working page (a documentation/content bug, not just a visual one — should be fixed as part of any dashboard work).
**Decision:** **IMPROVE functionality (fix stale copy, add real metrics) + REDESIGN visual.**

## `/services` (public marketing)
**FUNCTIONALITY TO KEEP:** Real API-backed category grid with computed starting prices — confirmed COMPLETE in `docs/06-CATALOG-AND-SERVICES.md`. This was built during this engagement specifically to replace a non-functional stub; the data layer is sound.
**VISUAL DESIGN TO CHANGE:** Plain bordered-card grid — exactly the "generic SaaS template" pattern `docs/24-UI-UX.md` says to move away from. No imagery, no editorial quality.
**Decision:** **KEEP functionality / REDESIGN visual** — this is the highest-priority visual redesign target on the public-facing surface, since it's the actual storefront.

## `/services/[slug]` (7 detail routes, shared template)
**FUNCTIONALITY TO KEEP:** Single shared `ServiceDetail` template, real per-category data, honest "coming soon" empty state for unmatched routes rather than fabricated content.
**VISUAL DESIGN TO CHANGE:** Same generic card/list treatment as `/services`; zero imagery despite being literally about visual transformation services.
**Decision:** **KEEP functionality / REDESIGN visual** — this is where the image-first principle matters most (before/after content, per `docs/24-UI-UX.md`).

## `/pricing`
**FUNCTIONALITY TO KEEP:** Real per-service pricing table, real addons, accurate billing explanation grounded in actual system behavior — confirmed COMPLETE in `docs/07-PRICING.md`.
**VISUAL DESIGN TO CHANGE:** Plain list/table treatment, no visual distinction from an internal price sheet.
**Decision:** **KEEP functionality / IMPROVE-to-REDESIGN visual.**

## Order Creation Wizard (`/dashboard/orders/new`)
**FUNCTIONALITY TO KEEP:** 5-step state machine, live quote, `?categoryId=` deep-link support — confirmed COMPLETE and the most functionally sophisticated client-side flow in the app (`docs/08-ORDERS.md`, `docs/07-PRICING.md`). **Do not rewrite the wizard's step logic.**
**VISUAL DESIGN TO CHANGE:** Category/service selection is plain bordered boxes with text — no imagery to help a customer recognize "this is the service I need." Running total only appears at step 4 instead of persistently.
**Decision:** **KEEP functionality / IMPROVE visual** (add service imagery, persistent pricing sidebar) — explicitly not a rebuild.

## Upload Experience (`order-upload-panel.tsx` + `packages/upload-gallery`)
**FUNCTIONALITY TO KEEP:** Real presigned-URL upload, per-file progress, retry, remove, abort, server-side verification — confirmed COMPLETE and genuinely production-grade in `docs/09-UPLOADS.md`. **This is one of the strongest pieces of engineering in the codebase — do not rebuild it.**
**VISUAL DESIGN TO CHANGE:** Plain progress bar with no percentage text, generic "IMG"/"FILE" fallback badges, unremarkable dropzone treatment.
**Decision:** **KEEP functionality / IMPROVE visual polish only** (numeric progress, better icons, stronger dropzone) — no architecture changes needed.

## Order Details (`/dashboard/orders/[orderId]`)
**FUNCTIONALITY TO KEEP:** Status timeline, upload panel, comments, deliverables — all real and correctly conditionally rendered by order status (`docs/08-ORDERS.md`, `docs/10-ASSETS.md`).
**VISUAL DESIGN TO CHANGE:** Text-heavy, no color-coded status system, low visual hierarchy between sections.
**Decision:** **KEEP functionality / IMPROVE visual** (status badges/color system).

## Assets (`/dashboard/assets`)
**FUNCTIONALITY TO KEEP:** Real, grouped-by-order deliverable list with working downloads — confirmed COMPLETE.
**VISUAL DESIGN TO CHANGE:** Plain table — a photo-delivery page with no visual preview emphasis is a direct miss against the image-first principle.
**Decision:** **KEEP functionality / IMPROVE-to-REDESIGN visual** (larger previews, gallery-forward layout).

## Client Billing / Settings (`/dashboard/billing`, `/dashboard/settings`)
**FUNCTIONALITY TO KEEP:** Nothing — these are stub pages with zero API connection (confirmed STUB in `docs/14-PAYMENTS-AND-BILLING.md`, `docs/04-USERS.md`).
**VISUAL DESIGN TO CHANGE:** N/A — there is no design to preserve or change; this is a build-from-scratch, not a redesign.
**Decision:** **REDESIGN (build)** — but only once the underlying capability exists (payments module is STUB backend-side; billing UI has nothing real to connect to yet — see `docs/CURRENT-TARGET-GAP.md`).

## Admin Console (dashboard, orders, catalog, organizations, clients, users)
**FUNCTIONALITY TO KEEP:** Real CRUD, tiered role enforcement, correct data flow throughout — confirmed COMPLETE in `docs/15-ADMIN.md` and across the module docs it depends on. **This functionality should not be rebuilt.**
**VISUAL DESIGN TO CHANGE:** Entirely separate design system from the client app (Arial font, custom CSS kit, unrelated color tokens) — reads as a generic internal ops tool with no relationship to the Fotopixelz brand.
**Decision:** **KEEP functionality / REDESIGN visual system** (align to the shared design language once defined — see `docs/24-UI-UX.md`) — this is the single highest-leverage design-system fix, since it currently duplicates an entire component kit for no functional reason.

## Design System (cross-cutting)
**FUNCTIONALITY TO KEEP:** N/A.
**VISUAL DESIGN TO CHANGE:** Two unrelated systems existed (client's shadcn/Tailwind, admin's hand-rolled kit). `packages/ui` now has an initial token/primitive layer (Button/Card/Badge/Alert, per `docs/DESIGN-SYSTEM.md` §13), and `apps/admin` now consumes it for Button/StatusBadge/RoleBadge/ErrorBanner/SuccessBanner (Electric Coral accent live, Geist font bug fixed) — `apps/client` still doesn't consume it, and admin's `Card`/`DataTable`/`Modal`/forms are still its own CSS pending more shared primitives.
**Decision:** **REDESIGN, in progress** — Stage 3 (wiring admin's core primitives) is done and verified live in-browser; remaining work is more shared primitives, Card's structural swap, and eventually wiring `apps/client` — see `docs/ROADMAP.md`.

## Public Website (`apps/web`)
**FUNCTIONALITY TO KEEP:** N/A — nothing exists.
**VISUAL DESIGN TO CHANGE:** N/A — nothing exists.
**Decision:** **REDESIGN (build from scratch)** once prioritized — this is a TARGET, not a current gap in an existing design.

---

## Summary

| Page/Module | Functionality | Visual |
|---|---|---|
| Authentication | KEEP | IMPROVE |
| Client Dashboard | IMPROVE (fix stale copy + metrics) | REDESIGN |
| `/services` | KEEP | REDESIGN |
| `/services/[slug]` | KEEP | REDESIGN |
| `/pricing` | KEEP | IMPROVE→REDESIGN |
| Order Wizard | KEEP | IMPROVE |
| Upload Experience | KEEP | IMPROVE |
| Order Details | KEEP | IMPROVE |
| Assets | KEEP | IMPROVE→REDESIGN |
| Billing/Settings | REDESIGN (build) | REDESIGN (build) |
| Admin Console | KEEP | REDESIGN |
| Design System | — | REDESIGN |
| Public Website | REDESIGN (build) | REDESIGN (build) |

No functionality confirmed COMPLETE in Pass 1–3 is recommended for rebuild in this document. Every REDESIGN decision above is scoped to the visual layer only, except where explicitly marked "(build)" for capability that doesn't exist yet.
