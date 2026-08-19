# Client Application — Complete UI/UX Redesign Scope

**Status: Documentation only. No application code changed to produce this document.** This is the operational companion to `docs/REDESIGN-DIRECTION.md` §0.1 — that document sets principles and direction; this document is the complete route inventory, page-by-page priority, and concrete redesign rules for every screen in `apps/client`. `docs/CLIENT-DASHBOARD.md` remains the detailed spec for `/dashboard` specifically and is not duplicated here.

**Governing constraint, restated:** every route, component, and data flow below is presentation-layer scope only. No API, database, Prisma, authentication, RBAC, business logic, order state machine, upload engine, or pricing engine change is authorized by this document. Where functionality does not exist today, it is marked **TARGET** and must never be designed as if it were live.

---

## 1. Complete Client route inventory

Verified against the current `apps/client/src/app/` tree.

| # | Route | Current component(s) | Current state | Auth |
|---|---|---|---|---|
| 1 | `/` | `Home` | Marketing landing/splash | Public |
| 2 | `/login` | `LoginPage` | Login form | Public |
| 3 | `/register` | `RegisterPage` | Registration form | Public |
| 4 | `/auth/callback` | `OAuthCallbackContent` | Google OAuth handoff/redirect | Public (pre-auth) |
| 5 | `/pricing` | `PricingPage` | Marketing pricing, catalog-driven | Public |
| 6 | `/services` | `ServicesPage` | Marketing services index, catalog-driven | Public |
| 7 | `/services/[slug]` ×7 (`ai-backgrounds`, `background-removal`, `clipping-path`, `color-correction`, `ghost-mannequin`, `retouching`, `shadow-creation`) | `ServiceDetail` | Individual service detail pages | Public |
| 8 | `/dashboard` | Dashboard overview (already redesigned — `docs/CLIENT-DASHBOARD.md`) | Production overview, hero card, filmstrip, proof sheet, order log | Client role, `ClientShell` |
| 9 | `/dashboard/orders` | `OrdersPage` | Table of the org's orders (status, date, order number) | Client role |
| 10 | `/dashboard/orders/new` | `OrderWizard` | Multi-step order creation (category → services → addons → quote → place) | Client role |
| 11 | `/dashboard/orders/[orderId]` | `OrderDetailPage` | Upload panel, flow progress, deliverables, comments, status timeline | Client role |
| 12 | `/dashboard/assets` | `AssetsPage` | Table of org assets with download action | Client role |
| 13 | `/dashboard/billing` | placeholder stub (`<h1>Web dashboard/billing</h1>`) | **Not built** — literal placeholder text, inline styles only | Client role |
| 14 | `/dashboard/settings` | placeholder stub (`<h1>Web dashboard/settings</h1>`) | **Not built** — literal placeholder text, inline styles only | Client role |

**14 routes total.** Two (`billing`, `settings`) are currently unbuilt placeholders, not redesign targets in the visual sense — see §3 and §9 for what each becomes.

---

## 2. Shared chrome (not a route, but redesign scope)

- **`ClientShell`** (top navigation bar + route guard) — already redesigned as part of the Client Dashboard work (top-bar nav, coral-underline active state, avatar/account menu, mobile drawer). Carries forward structurally; only its color values need to move off coral (§7 below) and its nav-item set needs review against §5.1's priority list (Overview / Orders / Assets / Services / Billing / workspace-account) once Billing and Settings are real pages, not placeholders.
- **Auth screens shell** (`auth-layout.tsx`) — currently a centered-card layout for `/login`, `/register`. In scope: bring visually in line with the new palette and typography; functionally unchanged (same fields, same OAuth button, same validation).
- **Marketing chrome** (header/hero/footer used by `/`, `/pricing`, `/services*`) — currently `MarketingHeader`, `MarketingHero`, and related components under `apps/client/src/components/marketing/`. In scope for the same visual system as the authenticated app, not a separate marketing-site design language — Client and the future public site should read as the same product (`docs/REDESIGN-DIRECTION.md` §6.3).

---

## 3. Page-by-page redesign priority

Priority reflects: (a) how far the current screen is from image-first/premium/global-B2B, (b) how frequently a returning customer touches it, (c) whether it's currently unbuilt. This is a priority ranking for sequencing implementation later — not an authorization to implement now.

### Tier 1 — highest priority (most-used, most visually underserved today)
1. **`/dashboard/orders/[orderId]` (Order detail)** — the single most information-dense, most-visited screen after the dashboard itself; currently a functional-but-generic tab/panel layout. Status communication (`docs/REDESIGN-DIRECTION.md` §4.4) is the core design problem here.
2. **`/dashboard/orders/new` (Order Wizard)** — the moment a customer commits spend; currently sound step logic in a visually unremarkable container (`docs/REDESIGN-DIRECTION.md` §6.1 already flagged this).
3. **`/dashboard/orders` (Orders list)** — the most-repeated navigation destination for a returning customer; currently a plain table, no imagery, no production-stage visibility at a glance.
4. **`/dashboard/assets` (Assets)** — this is the product's actual deliverable library; currently a table with a download button, the least image-first screen in the entire product despite being the one place that should be the most image-first (`docs/REDESIGN-DIRECTION.md` §"strong image library" positioning, §7).

### Tier 2 — high priority (storefront / conversion surfaces)
5. **`/services`, `/services/[slug]` ×7, `/pricing`** — the storefront for a visual product currently presented as a bordered-card grid indistinguishable from an admin table (`docs/REDESIGN-DIRECTION.md` §6.1). These are public-facing and directly affect conversion/credibility for a global B2B buyer evaluating the platform before signing up.

### Tier 3 — build-from-scratch (currently placeholder stubs)
6. **`/dashboard/settings`** — currently a literal one-line placeholder. Needs the full account/workspace/application settings structure defined in §9 — this is new screen design, not a redesign of an existing screen, though the underlying data (user profile, org info) already exists.
7. **`/dashboard/billing`** — currently a literal one-line placeholder. `Payment`/`Invoice` are real but unused schema (per `docs/CLIENT-DASHBOARD.md` §5) — this page should be built honestly around what's real (plan/credits, currently visible on the dashboard) and mark anything else TARGET, not fabricate an invoice history.

### Tier 4 — supporting/lower-frequency surfaces
8. **`/login`, `/register`, `/auth/callback`** — functionally solid, visited rarely per user (once, or occasionally on session expiry); visual polish matters for first impressions but these are low-complexity, low-priority relative to the daily-use surfaces above.
9. **`/` (marketing landing)** — currently minimal; full redesign here is lower priority than the authenticated product surfaces since this is effectively `apps/web`'s eventual job (`docs/REDESIGN-DIRECTION.md` §6.3) — treat `apps/client`'s `/` as a lightweight, brand-consistent placeholder until `apps/web` is built out, not as a marketing-site redesign target in its own right.

---

## 4. Shared visual language (Client + Admin)

Both applications must be unmistakably the same product. What stays constant across both:

- **Color logic** — the Fotopixelz green/neutral/status system (§7 below, and `docs/REDESIGN-DIRECTION.md` §7.1) — same token values, same brand-vs-status separation rule, in both apps.
- **Typography voice** — the same type family choices (functional sans for both apps; the editorial/display voice reserved for Client's premium moments, used more sparingly there than originally scoped, and essentially unused in Admin — `docs/REDESIGN-DIRECTION.md` §12).
- **Status language** — the same real `OrderStatus` enum, the same `StatusChip`/status-color mapping, in both apps (already true of the shipped dashboards; must extend to every other page that shows an order status — orders lists, order detail, QA/production panels).
- **Iconography** — one icon set/style across both apps, not two different visual vocabularies (admin currently uses letter-code fake icons in places — see `docs/ADMIN-UI-REDESIGN.md` §7 for the specific inventory of what needs real icons).
- **Motion feel** — the same short-duration, state-clarifying motion principles (`docs/REDESIGN-DIRECTION.md` §4.6) in both apps, scaled to each app's density (Client can afford slightly more presence in transitions; Admin's motion should be closer to instant).
- **Elevation/border/radius logic** — one shared scale (`docs/DESIGN-SYSTEM.md`'s radius/shadow principles, carried forward per `docs/REDESIGN-DIRECTION.md` §12), applied consistently, not two independently-tuned systems (today admin and client each define their own `--radius`/border values with no shared source).

---

## 5. Client-specific visual rules

### 5.1 Navigation
Per the explicit instruction: do not preserve the existing nav merely because it exists — but the top-bar shape already shipped for the dashboard (`client-shell.tsx`) is a reasonable structural foundation to extend, not restart, since it already resolved the "not a traditional sidebar SaaS shell" question correctly for Client's register. What changes as the redesign extends past the dashboard:
- Nav priority order: **Overview, Orders, Assets, Services, Billing, workspace/account** — Billing needs to become a real nav destination once §9's settings/billing work lands (today it's a stub route with no confirmed nav placement beyond whatever the current shell links to).
- Services surfaces (`/services`, `/pricing`) are public/marketing routes, not authenticated-app routes — they should not appear in the authenticated top-bar nav; a logged-in customer starts a new order via the existing `/dashboard/orders/new` deep link (`?categoryId=`), not by navigating out to the public catalog pages.
- Workspace/account access (avatar + menu) stays the single entry point for profile, settings, and logout — consistent with the shipped dashboard pattern.

### 5.2 Density and spacing
Spacious by design (`docs/REDESIGN-DIRECTION.md` §4.3) — Client should never feel as dense as Admin. Even data-heavy screens (Orders list, Assets list) should read as curated, generous layouts, not compressed tables — this is the opposite instinct from Admin's density rule (§5 of `docs/ADMIN-UI-REDESIGN.md`).

### 5.3 Image-first as structural rule
Every screen that represents an order or a deliverable **must** lead with real imagery wherever a real asset exists (`docs/REDESIGN-DIRECTION.md` §4.1) — this extends the dashboard's rule (`docs/CLIENT-DASHBOARD.md` §6) to the Orders list, Order detail, and Assets pages specifically, none of which currently show any imagery at all. Concretely:
- **Orders list:** each row/card should carry a real thumbnail (source upload or deliverable preview, whichever exists), not just a status badge and a title.
- **Order detail:** the upload panel and deliverables panel already handle real images via `packages/upload-gallery`; the redesign's job is to make imagery the primary visual content of the page, not a panel among equally-weighted panels.
- **Assets:** this should become a real image grid/library (the "image library" positioning from `docs/REDESIGN-DIRECTION.md` §7), not a text table with a download button — the single biggest gap between current state and the redesign's core product principle.

---

## 6. Navigation direction (Client) — see §5.1 for detail

Summarized per the requested doc structure: **Overview → Orders → Assets → Services (public/marketing, not in authenticated nav) → Billing → workspace/account.** All existing routes remain reachable; only presentation and information priority change.

---

## 7. New color direction (applies to both apps — see `docs/REDESIGN-DIRECTION.md` §7.1 for full detail)

- Primary/brand: deep, original Fotopixelz green (not sampled from Pixelz) — reserved for primary actions and brand moments only.
- Foundation: dark charcoal/near-black + warm neutral whites + restrained gray surfaces.
- Status colors (success/warning/error/info) remain a distinct hue family from the brand green — resolved explicitly in `docs/REDESIGN-DIRECTION.md` §7.1 to avoid the brand-green/success-green collision.
- Electric Coral (`#FF5A36`) is retired as the brand color everywhere it currently appears: `packages/ui/tokens.css`'s `--ui-color-primary`, admin's `--accent`/`.rail-brand`, client's `--coral`/`--coral-foreground` tokens, and the client dashboard's coral nav-underline. All four are tracked as follow-up implementation work, not re-specified here (this is a documentation task).

---

## 8. Settings restructuring (Client)

`/dashboard/settings` is currently an unbuilt placeholder — this is new-screen design, informed by the same account/workspace/application/developer structure defined for Admin (`docs/ADMIN-UI-REDESIGN.md` §9), scoped to what a Client-role user should see:

- **Account** — profile (name, email), password change, connected Google OAuth status (CURRENT data: `User` fields, `docs/03-AUTHENTICATION.md`).
- **Workspace/Organization** — organization name, plan/credits (already CURRENT, currently only shown on the dashboard header strip — belongs here too as the canonical location). Member list — **TARGET as UI**: `Membership`/multi-org data is real at the API level (`docs/05-ORGANIZATIONS.md`) but has no confirmed client-facing management UI today (`docs/CLIENT-DASHBOARD.md` §5 already flags this) — do not build an "invite teammate" flow without confirming it against real API support first.
- **Application** — notification preferences: **TARGET** (`docs/16-NOTIFICATIONS.md` — no user-configurable preference model confirmed; if real, document as CURRENT during implementation, otherwise mark clearly as "coming soon").
- **No developer/system section on Client** — that tier is Admin-only (`docs/ADMIN-UI-REDESIGN.md` §9); a customer-facing settings page has no reason to expose API base URLs or infrastructure details, and none currently leak into the Client app (unlike Admin's current settings page — see `docs/ADMIN-UI-REDESIGN.md` §9 for that specific issue).

---

## 9. Billing restructuring (Client)

`/dashboard/billing` is currently an unbuilt placeholder. Build honestly around what's real:
- **CURRENT:** free image credits remaining/used, currency (`Organization` fields — already surfaced on the dashboard header, should also live here as the canonical billing-adjacent view).
- **TARGET:** invoice history, payment method management (`Payment`/`Invoice` are unused dead schema per `docs/CLIENT-DASHBOARD.md` §5) — if surfaced, must be an explicit "not available yet" state, never a fabricated invoice list.

---

## 10. Image-first rules — see §5.3

---

## 11. Responsive strategy

Same three-breakpoint approach already established for the dashboard (`docs/CLIENT-DASHBOARD.md` §8: desktop ≥1280px, tablet 768–1279px, mobile <768px) applies to every Client route. Premium quality must hold at every breakpoint — mobile is not a reduced-effort target (`docs/REDESIGN-DIRECTION.md` §4's discipline, restated in `docs/CLIENT-DASHBOARD.md` §8). Data-dense screens (Orders list, Assets) follow the same table-to-stacked-card collapse pattern already specified for the dashboard's Order Log (`docs/CLIENT-DASHBOARD.md` §8, mobile row).

---

## 12. Components that should be shared (Client ↔ Admin)

Per `docs/CLIENT-DASHBOARD.md` §13 (authoritative list, not repeated in full here): `ProductionCard`, `StatusChip` (overlay + inline variants), `Thumbnail`, `Button`, and order-number/currency/date formatting utilities. Extending past the dashboard: any new order-row/order-card component built for the Orders list or Assets grid should reuse `ProductionCard`/`Thumbnail`/`StatusChip` rather than inventing app-specific equivalents, since both apps will need an "order as a visual card" primitive on their respective list pages.

---

## 13. Components that should remain Client-specific

Per `docs/CLIENT-DASHBOARD.md` §13: `AccountStat`, `HeroProductionCard`, `UpNextCard`, `ProofSheetTile`, `OrderLogRow`. Extending past the dashboard: the Order Wizard's step components, the upload dropzone/progress presentation, and the marketing-page components (`ServiceGrid`, `HowItWorks`, pricing table) are all Client-only — Admin has no equivalent screens for any of these jobs.

---

## 14. Existing functionality that must never change

Every item in `docs/REDESIGN-DIRECTION.md` §2, applied specifically to Client: the order wizard's category → services → addons → quote → place flow and its `POST /orders` call; the upload engine's presigned S3 flow, progress, retry, and server-side verification; the pricing/quote calculation; the real `OrderStatus` state machine and its transitions; authentication (credential + Google OAuth), email verification, password reset; organization/credit accounting. A redesigned screen must produce identical API calls and identical outcomes to the current screen — only presentation changes.

---

## 15. Existing UI that will be replaced

Every visual treatment currently in `apps/client` except what the Client Dashboard redesign already replaced: the plain-table Orders list, the plain-table Assets list, the bordered-card-grid Services/Pricing pages, the placeholder Billing/Settings stubs, the current auth-screen visual treatment, the current marketing header/hero. All Tailwind utility-class-driven visual styling in these areas is in scope for replacement — the underlying JSX structure/data flow is not.

---

## 16. CURRENT vs TARGET functionality (Client)

| Capability | Status | Note |
|---|---|---|
| Order creation, upload, tracking, review, download | CURRENT | Core five jobs, fully real — see `docs/08-ORDERS.md`, `docs/09-UPLOADS.md`, `docs/10-ASSETS.md` |
| Google OAuth + credential auth, email verification, password reset | CURRENT | `docs/03-AUTHENTICATION.md` |
| Organization credits/trial | CURRENT | `Organization.freeImageCredits`/`usedImageCredits`/`trialEndsAt` |
| Real deliverable/upload thumbnails | CURRENT | `packages/upload-gallery`, presigned URLs |
| Billing / invoice history | TARGET | `Payment`/`Invoice` schema exists, unused; no UI |
| Team/member management UI | TARGET | `Membership` API-level real; no confirmed client UI |
| Notification preferences | TARGET | No confirmed preference model |
| SLA / at-risk indicators | TARGET | Only `dueDate` is real, no SLA engine (`docs/CLIENT-DASHBOARD.md` §5) |
| Approval rate / quality score | TARGET | No such metric anywhere in the schema |
| Support/helpdesk | TARGET | No ticketing module; a mailto/contact link using the real support email is the only CURRENT-honest option |

---

## 17. Relationship to other documents

- `docs/REDESIGN-DIRECTION.md` — principles and direction this document operationalizes; §0.1 is what authorized this document to exist.
- `docs/CLIENT-DASHBOARD.md` — the detailed, already-implemented spec for `/dashboard` specifically; not superseded, only scoped-down to one route within this document's larger inventory.
- `docs/ADMIN-UI-REDESIGN.md` — the Admin-side mirror of this document; §4 (shared visual language) is written to apply identically to both.
- `docs/UI-REVIEW.md` / `docs/MODULE-MATRIX.md` — functionality-preservation source of truth referenced throughout §14–§16.

**No implementation should begin from this document.** It is scope, inventory, and priority — not a mockup or a build-ready spec (that level of detail exists today only for `/dashboard`, in `docs/CLIENT-DASHBOARD.md`). Per the instruction that produced this document, work stops here until reviewed.
