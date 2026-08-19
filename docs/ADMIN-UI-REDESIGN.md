# Admin Application — Complete UI/UX Redesign Scope

**Status: Documentation only. No application code changed to produce this document.** This is the operational companion to `docs/REDESIGN-DIRECTION.md` §0.1 — that document sets principles and direction; this document is the complete route inventory, page-by-page priority, and concrete redesign rules for every screen in `apps/admin`. `docs/ADMIN-DASHBOARD.md` remains the detailed spec for `/admin` (dashboard) specifically and is not duplicated here.

**Governing constraint, restated:** every route, component, and data flow below is presentation-layer scope only. No API, database, Prisma, authentication, RBAC/permissions, business logic, order state machine, or pricing engine change is authorized by this document. Every existing role/permission gate (`docs/02-ROLES-AND-PERMISSIONS.md`) must be preserved exactly as-is.

---

## 1. Complete Admin route inventory

Verified against the current `apps/admin/src/app/` tree. Auth guard is `AdminShell` (blocks `CLIENT` role, enforces `canAccessAdminPath(role, pathname)` per-role allowlist) unless noted otherwise.

| # | Route | Current component(s) | Current state | Gating |
|---|---|---|---|---|
| 1 | `/` | `Home` | Immediate redirect to `/admin` | Public |
| 2 | `/login` | `AuthPage` (mode="login") | Staff login form | Public |
| 3 | `/forgot-password` | `AuthPage` (mode="forgot") | Password reset request | Public |
| 4 | `/reset-password` | `AuthPage` (mode="reset") | Password reset confirmation | Public |
| 5 | `/admin` | Dashboard overview (already redesigned — `docs/ADMIN-DASHBOARD.md`) | Intake strip + production board + sidebar | All internal roles |
| 6 | `/admin/orders` | `OrdersPage` | Orders table/list with filters | All internal roles, scoped |
| 7 | `/admin/orders/[orderId]` | `OrderDetailPage` (+ tabs: production workspace, comments, timeline, QA review, deliverable upload/history) | Full order production workspace | All internal roles, scoped |
| 8 | `/admin/assets` | `AssetsPage` | Admin asset listing | All internal roles |
| 9 | `/admin/assets/[assetId]` | `AssetDetailPage` | Single asset detail | All internal roles |
| 10 | `/admin/uploads` | `UploadsPage` | Upload management/queue | All internal roles |
| 11 | `/admin/users` | `PeoplePage` (mode="all") | All-users management | Admin/Super Admin |
| 12 | `/admin/clients` | `PeoplePage` (mode="clients") | Client-account management | Admin/Super Admin |
| 13 | `/admin/editors` | `PeoplePage` (mode="editors") | Editor-staff management | Admin/Super Admin |
| 14 | `/admin/qa` | `OrdersPage` (queue mode, QA role) **or** `PeoplePage` (mode="qa", Admin/Super Admin role) | Role-conditional: QA staff see their queue, Admin/Super Admin see QA people-management | Role-branched in-component |
| 15 | `/admin/categories` | `CatalogPage` (kind="categories") | Service-category CRUD | Admin/Super Admin |
| 16 | `/admin/addons` | `CatalogPage` (kind="addons") | Add-on catalog CRUD | Admin/Super Admin |
| 17 | `/admin/services` | `ServicesPage` | Services/pricing catalog CRUD | Admin/Super Admin |
| 18 | `/admin/organizations` | `OrganizationsPage` | Organization/account management | Admin/Super Admin |
| 19 | `/admin/settings` | `SettingsPage` | Session info, **raw API base URL**, role-based nav list | All internal roles |
| 20 | `/admin/profile` | `ProfilePage` | Own staff account profile | All internal roles |

**20 routes total.** All except `/admin` are unbuilt-for-this-redesign — i.e., functionally complete and correctly gated, but not yet visually redesigned.

---

## 2. Shared chrome (not a route, but redesign scope)

- **`AdminShell`** (icon rail + auth/role guard) — already redesigned as part of the Admin Dashboard work (icon rail, 13-destination coverage via icon+tooltip, bottom account menu, mobile drawer). Carries forward structurally; needs its brand-mark tile moved off coral (§7, and `docs/ADMIN-DASHBOARD.md`'s color note) and its letter-code nav icons (`D`/`O`/`U`/`A`/`US`/`CL`/`ED`/`QA`/`CA`/`AD`/`SV`/`OR`/`SE`) replaced with real iconography (§4 of `docs/CLIENT-UI-REDESIGN.md`, restated in §7 below) — those two-letter codes were a placeholder, not a design decision to preserve.
- **Auth screens shell** (`AuthPage` covering login/forgot/reset) — currently hand-written CSS, functionally solid. In scope for the same visual system as the rest of Admin; functionally unchanged.

---

## 3. Page-by-page redesign priority

Priority reflects: (a) daily-use frequency for internal staff, (b) how information-dense/error-prone the current screen is, (c) the Settings page's specific problem flagged by the instruction that produced this document.

### Tier 1 — highest priority (heaviest daily use, most operationally critical)
1. **`/admin/orders/[orderId]` (Order detail / production workspace)** — the single screen staff spend the most time in: production workspace, QA review, deliverable upload, comments, timeline all live here. Currently functional hand-written-CSS panels with no imagery-first treatment despite QA review being fundamentally a visual-comparison task.
2. **`/admin/orders` (Orders list)** — the primary triage/search surface for every internal role, used continuously throughout the day; currently a plain filtered table.
3. **`/admin/qa` (QA queue / QA people view)** — QA's primary daily workspace when in queue mode; the review workflow is inherently visual (comparing deliverables against source) and currently has no image-first treatment.

### Tier 2 — high priority (frequent, structurally important)
4. **`/admin/uploads`** — upload queue/management, directly parallels the Client-side upload experience in importance but has received none of that redesign attention yet.
5. **`/admin/assets`, `/admin/assets/[assetId]`** — the admin-side mirror of Client's Assets/image-library problem (`docs/CLIENT-UI-REDESIGN.md` §3 Tier 1 #4) — currently table-first where it should be image-grid-first, adapted to admin's denser register.

### Tier 3 — important, lower frequency (management/catalog surfaces)
6. **`/admin/users`, `/admin/clients`, `/admin/editors`, `/admin/qa` (people mode), `/admin/organizations`** — the People/Configuration group; used regularly but in shorter, more transactional sessions than the order-workflow screens above. Consistent data-table redesign (professional data-table pattern per `docs/REDESIGN-DIRECTION.md` §"professional data tables") is the main job here, not a fundamentally different information architecture.
7. **`/admin/categories`, `/admin/addons`, `/admin/services`** — the Catalog group; lower-frequency CRUD screens, same data-table redesign treatment as Tier 3 above.

### Tier 4 — must-fix for a specific stated reason
8. **`/admin/settings`** — currently exposes a raw `API base URL: http://localhost:5000/api/v1` as ordinary user-facing content, which the instruction that produced this document explicitly identifies as unacceptable. This is a **must-fix**, not merely a visual pass — see §9 for the full restructuring. Priority is high specifically because of what it currently exposes, even though it's a low-traffic page.
9. **`/admin/profile`** — own-account editing; low complexity, bundle with the Settings restructuring (§9) since both are "about me / my session" surfaces that should likely share a visual pattern (and possibly navigation grouping) once redesigned.

### Tier 5 — supporting
10. **`/login`, `/forgot-password`, `/reset-password`** — same rationale as Client's auth screens (`docs/CLIENT-UI-REDESIGN.md` §3 Tier 4): functionally solid, low visit frequency per user, lower priority than daily-use operational surfaces.

---

## 4. Shared visual language — see `docs/CLIENT-UI-REDESIGN.md` §4 (authoritative, applies identically to both apps)

---

## 5. Admin-specific visual rules

### 5.1 Density
Admin is the "instrument panel" register (`docs/REDESIGN-DIRECTION.md` §4.3/§6.2) — dense, fast to scan, built for staff doing the same task fifty times a day. This is the explicit opposite instinct from Client's spaciousness rule (`docs/CLIENT-UI-REDESIGN.md` §5.2): tables should show more rows per screen, controls should be compact, and whitespace should be purposeful rather than generous. The already-shipped dashboard (intake strip + kanban board) is the reference density level for the rest of the app.

### 5.2 Data tables
The majority of Admin's unredesigned surface area (§3 Tier 3) is data tables (people, catalog, organizations). These need one consistent, professional data-table pattern — sortable columns, inline status chips (real `StatusBadge`, not ad hoc coloring), row-hover affordances, and bulk-context where relevant (e.g., bulk-assign in the orders queue) — applied uniformly rather than each page inventing its own table treatment (which is close to the current state: each `*-page.tsx` currently defines its own table markup independently).

### 5.3 Image-first, adapted to density
Per the core product principle (`docs/REDESIGN-DIRECTION.md` — "images must become part of the product's visual language"), Admin's redesign must not become an all-text operational tool just because it's dense. Every screen that represents an order, upload, or deliverable should carry a real thumbnail wherever a real asset exists (same rule as Client, `docs/CLIENT-UI-REDESIGN.md` §5.3) — sized smaller and denser than Client's equivalents (as the shipped dashboard's board/intake cards already demonstrate), never omitted for density's sake. Orders list, Order detail, QA review, Uploads, and Assets are all currently missing this entirely outside the dashboard.

### 5.4 Production transparency
QA review (`QaReviewPanel`) and the order production workspace (`OrderProductionWorkspace`) are where "production transparency" (`docs/REDESIGN-DIRECTION.md`'s Pixelz-principle list) matters most — these screens should make the current production stage, review round, and comment history immediately legible, using the same real `Order.reviewRound`/`OrderStatus` data already established for the dashboard (`docs/ADMIN-DASHBOARD.md` §4), not a simplified paraphrase.

---

## 6. Navigation direction (Admin)

Per the instruction: preserve the existing operational groups exactly — **Operations, People, Catalog, Configuration** — this grouping (`getAdminNavGroups`, `apps/admin/src/lib/access-control.ts`) is already correct and does not need restructuring, only the visual treatment of the rail itself (real icons instead of letter codes, brand color off coral — §2/§7). All 20 routes above remain reachable through the existing groups; no route paths or permission allowlists change.

---

## 7. New color direction (Admin) — see `docs/REDESIGN-DIRECTION.md` §7.1 (authoritative) and `docs/CLIENT-UI-REDESIGN.md` §7

Admin-specific notes:
- The rail's dark charcoal background (`--sidebar: #181a1f`) is *not* coral-derived and does not need to change on that basis — it's already close to the "dark charcoal/near-black" foundation §7.1 calls for; it should be reviewed for consistency with the new green rather than replaced outright.
- The rail's brand-mark tile and the active-nav-item highlight are the two places currently using coral directly (`.rail-brand`, `.rail-item.is-active` background) — these become the new Fotopixelz green.
- Status colors in every Admin table/badge (order status, upload status, asset status) must use the same success/warning/error/info mapping as Client (`getStatusBucket`/`StatusBadge`, already shared logic within `apps/admin/src/components/ui.tsx`) — this is already correctly separated from the brand accent today and stays that way; only the brand accent's hue changes.

---

## 8. Image-first rules — see §5.3

---

## 9. Settings restructuring (Admin) — the specific must-fix

`/admin/settings` (`apps/admin/src/components/settings-page.tsx`) currently renders session info, a role-based nav list, and — the specific problem — the raw `API_BASE_URL` constant (`http://localhost:5000/api/v1`) displayed directly as ordinary page content. This is a debug/session-info page, not a real settings surface, and per the explicit instruction it must never expose raw infrastructure details as normal user-facing configuration.

**Restructure into four tiers**, all preserving real, existing data only — no invented settings:

### Account
- User profile: name, email, role display (CURRENT — `User` fields, already shown today).
- Password change (CURRENT — the existing credential-auth flow, `docs/03-AUTHENTICATION.md`).

### Workspace / Organization
- **Not applicable in the same sense as Client** — internal staff don't belong to a customer `Organization` the way clients do. This tier for Admin instead means: which organizations/clients this staff member has visibility into, if that's a meaningful distinction (**TARGET** — no confirmed per-staff organization-scoping concept beyond role-based access exists today; do not invent one). If nothing real exists here, omit this tier for Admin rather than filling it with placeholder content.

### Application
- Preferences: **TARGET** — no confirmed user-preference model exists (`docs/16-NOTIFICATIONS.md` unconfirmed for admin-side preferences either).
- Notifications: **TARGET**, same caveat.
- Security: session info (currently shown — CURRENT), plus anything real around active-session management if it exists (verify before implementing; do not invent a "log out other devices" feature without confirming API support).

### Developer / System — privileged roles only
- This is where the **API base URL and any other infrastructure detail belongs** — clearly labeled as developer/system information, visually and structurally separated from the Account/Workspace/Application tiers above, and gated to `SUPER_ADMIN` (and possibly `ADMIN`) only, never shown to `EDITOR`/`QA` roles who currently see the exact same settings page. This is the direct fix for the instruction's stated concern: the information isn't necessarily wrong to have *somewhere* for privileged debugging, but it must never be the primary, undifferentiated settings experience every internal role sees.

**Role-based nav list** (currently part of this page) — this is arguably diagnostic/debug content in its current form too; if kept, it belongs in the Developer/System tier, not the primary settings view.

---

## 10. Responsive strategy (Admin)

Per `docs/ADMIN-DASHBOARD.md` §8's already-established principle, extended to every other route: Admin is explicitly **not** a mobile-first experience — it's a desk-based operational tool — but every screen must remain usable (not broken) down to mobile width. Data tables follow the same collapse-to-stacked-rows pattern the dashboard's board already demonstrates at its own breakpoints; no table should simply overflow unreadably.

---

## 11. Components that should be shared / app-specific — see `docs/CLIENT-UI-REDESIGN.md` §12/§13 (authoritative)

Admin-specific additions to the shared list: the professional data-table pattern (§5.2) should become a genuinely shared primitive if Client ever needs an equally dense table view (it currently doesn't, per Client's spaciousness rule, but the underlying sortable/status-chip table component is generic enough to share at the component level even if Client rarely reaches for it).

Admin-only, extending `docs/ADMIN-DASHBOARD.md` §14's list: `CatalogPage`'s CRUD table shape, `PeoplePage`'s mode-driven list, `OrderProductionWorkspace`, `QaReviewPanel`, `DeliverableUploadPanel`/`DeliverableHistory`, `OrderCommentsPanel`, `OrderTimelinePanel` — all shaped around internal production/operational jobs with no Client equivalent.

---

## 12. Existing functionality that must never change

Every item in `docs/REDESIGN-DIRECTION.md` §2, applied specifically to Admin: RBAC and all role/permission gates (`docs/02-ROLES-AND-PERMISSIONS.md`) exactly as enforced by `canAccessAdminPath`/`getAdminNavGroups`/component-level role checks today; the order state machine and its transition endpoints (`assign-editor`, `assign-qa`, `request-revision`, status updates); the QA review/approval flow; catalog CRUD operations; organization management; the existing `/admin/qa` role-branch behavior (QA role sees queue, Admin/Super Admin sees people-management) — this in-component branching is unusual but functionally real and must be preserved, not "simplified" into two separate routes without confirming that's actually wanted.

---

## 13. Existing UI that will be replaced

Every hand-written-CSS visual treatment in `apps/admin` except what the Admin Dashboard redesign already replaced: the plain tables across Orders/Assets/Users/Clients/Editors/Organizations/Categories/Addons/Services; the letter-code fake icons in the (already-redesigned-structurally) icon rail; the current auth-screen visual treatment; and — specifically — the current Settings page's undifferentiated single-tier layout (§9). The underlying JSX structure/data flow for all of these is not in scope to change beyond what's needed to support the new visual/information hierarchy (e.g., Settings' tier restructuring is a real information-architecture change, authorized specifically by §9, not a blanket exception to "presentation only").

---

## 14. CURRENT vs TARGET functionality (Admin)

| Capability | Status | Note |
|---|---|---|
| Order triage, assignment, production workspace, QA review, delivery | CURRENT | Full state machine, `docs/08-ORDERS.md` |
| Catalog CRUD (categories/addons/services) | CURRENT | `docs/06-CATALOG-AND-SERVICES.md` |
| People/organization management | CURRENT | `docs/04-USERS.md`, `docs/05-ORGANIZATIONS.md` |
| Role-based access control | CURRENT | `docs/02-ROLES-AND-PERMISSIONS.md` |
| Real deliverable/upload thumbnails | CURRENT | Same mechanism as Client |
| Workload / customer-activity counts | CURRENT | Raw counts only (already established, `docs/ADMIN-DASHBOARD.md` §5) |
| Per-staff organization-scoping (beyond role) | TARGET | No confirmed concept beyond role-based access |
| Admin user preferences / notification settings | TARGET | No confirmed preference model |
| Active-session management ("log out other devices") | TARGET | Not confirmed against real API support |
| SLA / at-risk indicators, approval-rate metrics, analytics/trends | TARGET | Same caveats as `docs/ADMIN-DASHBOARD.md` §5 |

---

## 15. Relationship to other documents

- `docs/REDESIGN-DIRECTION.md` — principles and direction this document operationalizes; §0.1 is what authorized this document to exist.
- `docs/ADMIN-DASHBOARD.md` — the detailed, already-implemented spec for `/admin` specifically; not superseded, only scoped-down to one route within this document's larger inventory.
- `docs/CLIENT-UI-REDESIGN.md` — the Client-side mirror of this document; §4 (shared visual language) is authoritative for both apps.
- `docs/UI-REVIEW.md` / `docs/MODULE-MATRIX.md` / `docs/02-ROLES-AND-PERMISSIONS.md` — functionality- and permission-preservation source of truth referenced throughout §12–§14.

**No implementation should begin from this document.** It is scope, inventory, and priority — not a mockup or a build-ready spec (that level of detail exists today only for `/admin`, in `docs/ADMIN-DASHBOARD.md`). Per the instruction that produced this document, work stops here until reviewed.
