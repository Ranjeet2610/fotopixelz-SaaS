# Fotopixelz — Ground-Up Redesign Direction

**Status: Direction document, not a spec to implement yet.** This is the vision and principles the ground-up redesign works from (per the strategy change recorded in `docs/24-UI-UX.md`, `docs/DESIGN-SYSTEM.md`, and `docs/ROADMAP.md` Phase 1). It does not contain final tokens, does not describe finished layouts, and does not authorize implementation. No code, CSS, or component was changed to produce this document.

**Superseding update (this revision):** two decisions below are changed effective now — see §0. Everything else in this document (the non-negotiable foundation in §2, the redesign principles in §4, the per-app direction in §6, the Direction D dashboard work in §8–§11) still stands and is not re-litigated by this update; §0 states precisely what changed and why, and the sections that referenced the old values have been updated in place rather than left stale.

---

## 0. Superseding decisions (read this first)

Two decisions from the original version of this document are now superseded:

### 0.1 Scope: full application, not just the dashboards

The original framing treated the Client and Admin **dashboards** as the redesign's entry point, with the rest of each app's screens implicitly following later, page by page, as a to-be-sequenced backlog. That sequencing assumption is withdrawn. **The scope is now the complete Client and Admin applications** — every route in both apps, not the dashboard alone. A redesigned dashboard sitting inside an otherwise unchanged application is not an acceptable end state; it reads as unfinished rather than as a deliberate design system, and it is not what "ground-up redesign" (§5) was meant to describe if it stops at one screen per app.

This does not change the non-negotiable foundation in §2 — API, database, auth, RBAC, business logic, order state machine, upload engine, and pricing engine remain completely out of scope, exactly as before. It changes only how much of the *presentation* layer is being redesigned: all of it, not a subset. The complete page-by-page inventory and per-page redesign priority for each app now live in `docs/CLIENT-UI-REDESIGN.md` and `docs/ADMIN-UI-REDESIGN.md` — those documents are the operational companions to this one; this document stays the principles/direction layer.

### 0.2 Color direction: away from Electric Coral, toward a Fotopixelz-original green/neutral system

§12 and the dashboard specs (`docs/CLIENT-DASHBOARD.md`, `docs/ADMIN-DASHBOARD.md`) carried forward **Electric Coral (`#FF5A36`)** as the "prior choice" brand accent, inherited from the `packages/ui` Stage 1–3 token work and implemented in the shipped dashboards. That color direction is now **superseded** — Electric Coral is no longer the Fotopixelz brand color, and every place this document (and the two dashboard specs) called it "locked" should now be read as "the previous, now-replaced decision."

**New direction:** a restrained, professional palette in the spirit of what makes Pixelz (the named quality benchmark, §3) read as serious global production infrastructure rather than a generic SaaS product — a deep, deliberate green as the primary brand/action color, set against dark charcoal/near-black and warm neutral whites, with gray surfaces doing most of the structural work. This is explicitly **inspiration, not reproduction** — see §3's boundary, which now applies to color exactly as it already applied to layout, typography, and component shapes. Fotopixelz's specific green must be its own hue/value decision, not a sampled or approximated match to Pixelz's actual brand color.

Full rationale, the reserved-for-action rule, and the semantic-color collision this creates (see below) are specified in the new §7.1. In short: because the brand accent is now a green, and "success" states have conventionally also been green in this project's semantic palette (`--ui-color-success: #1e8e5a` in the current `packages/ui/tokens.css`), that collision must be resolved deliberately — status semantics and brand action color cannot share a hue family, or a screen full of "success" badges would visually read as "this is the primary action," which defeats the point of restraint. §7.1 makes the resolution explicit.

This supersedes: §12's color bullet, `docs/DESIGN-SYSTEM.md`'s Electric Coral sections (that document remains useful for its radius/shadow/motion/typography reasoning, which is not superseded), and the "Electric Coral" reference in both dashboard specs' status-color rules (updated in place — see the changelog note at the top of each).

---

## 1. Why this document exists

The prior approach — take the existing template-derived UI and migrate it onto shared tokens (`packages/ui` Stage 1–3) — produced something technically cleaner but still recognizably the same product: a generic dashboard shape with a coat of new colors. That was a legitimate thing to try, and it was stopped deliberately, not because the execution was flawed, but because the *ambition* was wrong for what Fotopixelz needs to be.

This document sets the direction for starting over on the visual and experiential layer — not the backend, not the data model, not the workflows that already work.

---

## 2. The non-negotiable foundation — what does NOT change

Everything below is real, working, and out of scope for this redesign. The redesign's entire job is to give this foundation a presentation worthy of it — not to touch it.

- **API** (`services/api`) — every module documented in `docs/26-API.md`.
- **Database / Prisma** — the schema in `docs/27-DATABASE.md`, all 23 models, all migrations.
- **Authentication** — credential + Google OAuth, email verification, password reset (`docs/03-AUTHENTICATION.md`).
- **RBAC / permissions** — role and assignment-scoped enforcement (`docs/02-ROLES-AND-PERMISSIONS.md`).
- **Business logic** — the order state machine (`docs/08-ORDERS.md`), pricing/quote calculation (`docs/07-PRICING.md`), deliverable integrity checks (`docs/10-ASSETS.md`).
- **Order workflows** — creation → upload → submission → assignment → production → QA → delivery, exactly as it works today.
- **Upload engine** — presigned S3 flow, progress, retry, server-side verification (`docs/09-UPLOADS.md`) — this is genuinely production-grade engineering; the redesign changes how it *looks and feels*, never how it *works*.
- **Pricing logic** — per-image pricing, addon calculation, credit consumption, the estimate→actual billing model.
- Every module marked COMPLETE in `docs/MODULE-MATRIX.md`.

**Rule for the redesign work:** if a page's functionality is marked "KEEP" in `docs/UI-REVIEW.md`, the redesign may change everything about how it looks and how the layout is organized, but the underlying data flow, state transitions, and API calls must produce identical outcomes. A redesigned order wizard must still create the same `Order` via the same `POST /orders` call with the same validation; it can look completely different doing it.

---

## 3. Quality benchmark — and the explicit boundary around it

**Benchmark:** the level of visual hierarchy, image-first experience, premium presentation, professional workflow clarity, enterprise trust, and strong service presentation found in top-tier image-editing platforms (Pixelz is the named reference point for *quality*, not for *content*).

**Hard boundary, restated because it matters:** do not reproduce Pixelz's (or any reference's) branding, color palette, typography choices, layout structure, component shapes, illustrations, copywriting, or page architecture. The benchmark is a bar for *how good it should feel to use*, not a source to draw from. Fotopixelz's visual identity must be recognizably its own — a designer looking at Fotopixelz should not be able to say "this is a Pixelz clone."

Concretely, this means: study what makes those platforms feel premium (restraint, imagery doing the work, confident typography, uncluttered information density, trustworthy production-status communication) and solve for those *qualities* with original decisions — not by recreating their specific choices.

This same boundary now explicitly covers color (§0.2, §7.1): Pixelz's current brand direction — deep natural green plus black/dark neutrals plus white — is cited as *inspiration for the category of choice* (a restrained, confidence-projecting, non-decorative palette for a global production platform), not as a color to sample or match. Fotopixelz's own green must be a distinct, deliberately chosen hue and value — the test is the same one already applied to layout and typography: a designer looking at Fotopixelz should not be able to say "this is Pixelz's palette."

---

## 4. Redesign principles

These extend (and in places sharpen) the creative direction already recorded in `docs/24-UI-UX.md`.

### 4.1 Image-first is structural, not decorative
The current product has zero imagery anywhere — not on the dashboard, not in the order wizard's service picker, not on the marketing pages selling image editing. This isn't a missing accent; it's a missing organizing principle. The redesign should treat imagery (before/afters, service examples, deliverable previews, upload thumbnails) as primary layout content that determines page structure — not something added into a card grid after the fact. Where real imagery doesn't exist yet, that's a content-production dependency to flag, not a reason to fabricate placeholder "customer work."

### 4.2 Premium means edited, not decorated
Restraint, considered whitespace, a small number of deliberate decisions used consistently — not gradients, glassmorphism, particle effects, or motion for its own sake. Every element on screen should look like it was placed on purpose. If removing a visual flourish doesn't lose information, it's probably decoration and should go.

### 4.3 Two registers, one identity
Client and the future public website are the *gallery* register — spacious, visual, story-driven. Admin is the *instrument panel* register — dense, fast to scan, built for people doing the same task fifty times a day. Both must obviously belong to the same product. The redesign should define what stays constant across both registers (type voice, color logic, iconography, motion feel) versus what legitimately differs (density, imagery prominence, layout rhythm) — rather than either forcing admin to look like a marketing site or letting the two drift into unrelated products, which is the exact failure the prior system had.

### 4.4 Trust is communicated, not assumed
This product handles a customer's paid production work moving through real people (editor, QA) across real time. Order status, what's happening right now, and what happens next should always be legible at a glance — this is a trust mechanic as much as a UX one. The redesign should treat status communication (where is my order, what does this status mean, what happens next) as a first-class design problem, not a badge color.

### 4.5 Workflow clarity over feature density
Client's five real jobs — create order, upload, track, review, download — should each feel like the *only* thing happening on that screen. Admin's real jobs — triage a queue, assign work, review deliverables, manage the catalog — should feel fast and information-dense without feeling cluttered. Neither should feel like a dashboard template with every possible widget turned on.

### 4.6 Motion and interaction earn their place
Every animation should clarify state (a step completing, a file uploading, a status changing) or provide feedback (hover, press, focus) — never run just because motion looks polished. This was already a stated principle; the ground-up redesign should make it load-bearing rather than aspirational.

---

## 5. What "ground-up" actually means

This is not a re-skin. Concretely:

- **Information architecture is open for revision**, not just visual styling. If the redesign concludes the client dashboard's five jobs deserve a different navigation shape than a left sidebar + content area, that's in scope. If admin's order queue deserves a different structure than a filter bar + table, that's in scope.
- **Every component is open for a from-scratch design**, not a restyle of the existing shadcn-derived (`apps/client`) or hand-rolled (`apps/admin`) component shapes. The `@repo/ui` `Button`/`Card`/`Badge`/`Alert` built during the stopped migration are one available reference for what worked mechanically (presigned-upload progress, status semantics, error/loading discipline) — not a shape to preserve.
- **Layout and composition are open**, including asymmetry, non-grid arrangements, and content-led (not card-led) page structure where that serves the material better.
- **The existing page inventory is a checklist of jobs to solve, not a template of screens to restyle.** Every route in `docs/01-ARCHITECTURE.md`'s app tables represents a real job a real user needs done — the redesign should solve that job well, not assume the current screen shape is correct.

---

## 6. Per-application direction

### 6.1 Client (`apps/client`) — the primary redesign surface
The five real jobs: **create an order, upload images, track an order, review results, download assets.** Each should feel singular and confident, not like a page inside a generic dashboard.

Areas most in need of a fundamentally different presentation, not incremental polish:
- **Service discovery (`/services`, `/pricing`, service detail pages)** — currently a bordered-card grid indistinguishable from an admin table. This is the storefront for a visual product; it should look like one. Service presentation should lead with what the service *produces* (visual proof, once available) over what it's *called*.
- **Order creation** — the step logic (category → services → addons → quote → place order) is sound and should be preserved functionally, but the visual container around it deserves a genuinely considered redesign: how service selection is presented, how pricing builds up and stays visible, how the moment of placing an order feels.
- **Upload experience** — the underlying engine is excellent; the presentation (plain progress bar, generic file-type badges, unremarkable dropzone) undersells it. This should feel like the most reassuring, premium moment in the product — this is where a customer hands over the actual work.
- **Order tracking / order detail** — status communication (§4.4) is the core design problem here, not decoration.
- **Dashboard** — currently two shallow cards. Should answer "what does my workspace need me to know right now" with real information hierarchy.

### 6.2 Admin (`apps/admin`) — instrument-panel register
Real jobs: triage the order queue, assign editors/QA, manage the catalog, manage organizations and staff. Functionality across all of this is COMPLETE and correctly permission-gated (`docs/15-ADMIN.md`) — none of it should regress.

The redesign should still feel obviously part of the same product as Client (shared type voice, color logic, status language) while being unapologetically dense and fast where that serves the job — tables, filters, bulk context, and destructive-action clarity are admin's real design problems, not big hero moments or imagery.

### 6.3 Public Website (`apps/web`) — most expressive register, currently unbuilt
No redesign work exists yet to preserve or discard here — it's a blank slate (`docs/00-PRODUCT-OVERVIEW.md` confirms a single placeholder paragraph). This is where the most editorial, image-driven expression of the identity should live, once real imagery exists to build it around. Building this out is sequenced after Client per `docs/ROADMAP.md`, but its direction should be considered now so Client and Website don't diverge later.

---

## 7. Global client positioning

**Update to the product framing, effective now:** Fotopixelz targets **global professional clients** — e-commerce brands, retailers, agencies, photo studios, and enterprise customers — not a generic small-business/domestic service audience. This changes what "premium" and "trustworthy" need to communicate: not just visual polish, but **operational credibility to a professional buyer** — production visibility, order accountability, turnaround awareness, and organizational/team structure, in addition to strong visual design.

This reframes the quality benchmark from §3: Pixelz remains a benchmark for *quality and product experience*, not for content or branding, but the specific qualities worth studying now include production/order visibility, image-centric workflows, quality/approval signals, turnaround/lead-time visibility, SLA awareness, an image library concept, structured order management, review/markup, specifications, and insights/metrics — the same boundary applies: study the *qualities*, do not reproduce Pixelz's actual UI.

**Discipline for everything below:** every capability referenced in this document is explicitly marked **CURRENT** (real, verified against `docs/26-API.md`/`docs/27-DATABASE.md`/the module docs) or **TARGET** (does not exist yet — a future capability, not something the redesign can surface as if it were real today). The redesign changes presentation; it cannot promise functionality that isn't there. Where a dashboard concept needs a TARGET capability, that is called out explicitly rather than quietly designed as if it were live.

---

## 7.1 Color system direction (supersedes Electric Coral)

This section is the authoritative color direction referenced by §0.2, `docs/CLIENT-UI-REDESIGN.md`, `docs/ADMIN-UI-REDESIGN.md`, and both dashboard specs. It states direction and starting values for implementation to refine — not frozen final hex codes; final values are a design-system implementation task, not a documentation decision made in isolation.

### Foundation
- **Primary / brand action color:** a deep, deliberate green — dark enough to read as serious/professional rather than "eco brand" bright green, and used the way the prior Electric Coral was used: sparingly, for primary actions and brand moments, never as a general decorative color or a default surface tint. Starting direction: a dark pine/forest green in the `#14352B`–`#1B4A38` range (final value TBD during implementation, must be validated for contrast against both white and dark surfaces).
- **Dark neutral:** a near-black charcoal (not pure `#000000`) for admin's instrument-panel surfaces (rail, headers) and for high-contrast text — continuing the existing admin `--sidebar: #181a1f` direction rather than replacing it; that value was never coral-derived and does not need to change on that basis, though it should be re-validated for consistency with the new green.
- **Warm/neutral whites and grays:** the light-mode foundation — off-white backgrounds, subtle gray panel/surface tones, restrained borders. Both apps currently define their own version of this (admin's `--background`/`--panel`/`--panel-soft`, client's OKLCH `--background`/`--card`/`--muted`) — the redesign's job is to make these one deliberate scale, not two independently-evolved ones (see `docs/CLIENT-UI-REDESIGN.md`/`docs/ADMIN-UI-REDESIGN.md` for the shared-vs-app-specific token split).

### The semantic-color collision, and how it's resolved
The existing semantic status palette (`packages/ui/tokens.css`) already uses a green for **success** (`--ui-color-success: #1e8e5a`). Once the *primary brand color* is also a green, reusing that same hue for both meanings would make every success badge look like a primary call-to-action, and would make the primary action color look like a status indicator — exactly the ambiguity a restrained system is supposed to avoid.

**Resolution:** brand-green and status-green are not the same hue.
- The **brand/primary green** (above) is reserved exclusively for primary actions, active/selected navigation states, and deliberate brand moments (logo mark, primary buttons, key focus states) — never used to mean "this succeeded" or "this is good."
- The **success semantic color** keeps its own distinct hue — either a clearly different green (more toward teal/emerald, sufficiently far in hue and saturation from the brand green that they're never confused side by side) or a non-green success convention if a side-by-side comparison during implementation shows any residual ambiguity. This is an implementation-time color-pairing decision; document the final choice in the design-system output, but the rule itself (brand-action color and status-success color must not be the same perceptual hue) is locked now.
- **Warning, error, info** keep the existing hue families (amber/gold, red, blue) — these were never coral-derived and are not affected by the coral-to-green change.

### What does not change
- The **locked separation** between brand accent and semantic status colors (`docs/DESIGN-SYSTEM.md`'s existing rule: status color is never drawn from the brand accent) — this rule is not new, only the specific brand hue it protects is changing.
- Typography, radius, shadow, and motion principles carried forward from §12 are unaffected by the color change and remain the starting point for the full-app design system.

---

## 8. Dashboard direction exploration — A / B / C / D

Three initial layout directions were explored as artboards (published separately, not reproduced here) against the original creative brief in §3–§4. A fourth direction was then developed once the global-client positioning (§7) sharpened what the dashboard actually needs to answer.

| Direction | Core idea | Verdict |
|---|---|---|
| **A — Gallery-Forward** | Imagery leads: a spotlight order with a large thumbnail, then a 4-up card grid where every order shows an image first, metadata second. | Strongest on image-first, but reads as a **portfolio/gallery**, not a production platform. Doesn't surface turnaround, SLA, or operational status — wrong fit for a professional B2B buyer's first question. |
| **B — Timeline-Forward** | Status leads: a production-pipeline strip with per-stage counts, orders as compact rows with inline progress bars instead of thumbnails. | Strongest trust/status signal of the first three, but least image-first — for a photo-editing platform, an operations view with no imagery undersells the product. |
| **C — Editorial Hybrid** | A dark, grain-textured editorial header (large display typography) settling into a refined list plus spotlight card and stat panels. | Most "premium brand" feeling, but the bold editorial header reads more like a **marketing moment** than a working dashboard a professional logs into daily — risks feeling less serious to an enterprise buyer, not more. |
| **D — Production Control Center** *(new, this document)* | Combines image-first, production visibility, and enterprise/B2B clarity in one system — real thumbnails where they exist, order status and turnaround together, account/organization context always present. | **Preferred direction.** See §9. |

### Why D is now preferred

None of A, B, or C were wrong — each correctly explored one axis of the original brief (imagery, status, brand-editorial). But the global-client positioning in §7 makes clear the dashboard's job is bigger than any single axis: a professional buyer managing production across a brand, retailer, agency, or studio needs to answer **"what is happening with my image production?"** in one glance — which requires image context, status/turnaround context, and account context **simultaneously**, not sequentially discovered by scrolling through a gallery or a stat panel. Direction D is not a compromise blend of A/B/C's visuals; it is a direction designed from the sharper brief in §7, using image-first and production-status principles together rather than as competing choices.

---

## 9. Direction D — Production Control Center

**The dashboard should combine:** image-first presentation + production visibility + enterprise/B2B clarity + premium visual design. It should feel like a serious platform a global brand's production team logs into daily — not a gallery, not a generic SaaS template, not a domestic-service marketing site.

### 9.1 Client — primary question: "What is happening with my image production?"

Prioritized, in order of what a returning professional user needs to see first:

1. **Active production** — orders currently in motion, with real status (not just "pending"/"done").
2. **Recent orders** — a short, scannable list/log, not a deep archive.
3. **Ready-to-download assets** — deliverables available now.
4. **Order status** — precise, using the real `OrderStatus` states (`docs/08-ORDERS.md`), not a simplified paraphrase that hides what's actually happening.
5. **Image counts** — expected vs. uploaded vs. delivered, since billing and production both key off actual image count (`docs/07-PRICING.md`).
6. **ETA / turnaround** — CURRENT only as the order's `dueDate`/`dueAt` field (a manually-set date, not a calculated SLA). Present it as "Due [date]" or "No due date set," never as a computed "on track" / "at risk" signal — that computation does not exist.
7. **Quality / approval** — CURRENT only as order status (`READY_FOR_QA` → `APPROVED`/`REVISION_REQUIRED` → `DELIVERED`) and the review-round count (`Order.reviewRound`). There is no approval-rate percentage or quality score anywhere in the system — do not display one.
8. **SLA, where applicable** — **TARGET.** No SLA policy, breach detection, or SLA-tier concept exists in the schema or API today (confirmed: no such model in `docs/27-DATABASE.md`). If SLA visibility is wanted, it must be flagged as a future capability, not designed as if `dueDate` were an SLA engine.
9. **Important account information** — organization name, free image credits remaining / used (`Organization.freeImageCredits`/`usedImageCredits`, CURRENT), trial status for demo accounts (CURRENT), currency (CURRENT, `Order.currency`, defaults USD).

**Image-centric, not gallery.** Real thumbnails should be used wherever the application actually has an asset to show — source upload previews (`packages/upload-gallery`'s `LazyUploadPreview`) and deliverable previews (`LazyDeliverablePreview`) are both real, working, presigned-URL-backed preview mechanisms today (`docs/09-UPLOADS.md`, `docs/10-ASSETS.md`) — use them. Where no real asset exists yet for a given order (e.g. before any upload), use a clearly-a-placeholder treatment, never a fabricated "customer photo." The distinction from Option A: imagery here is *evidence attached to a production record*, not the organizing visual centerpiece of a browsing experience — status, counts, and account context sit at equal visual weight, not beneath a hero image.

### 9.2 Admin — primary question: "What requires my operational attention?"

Prioritized:

1. **Orders requiring action** — the actual actionable queue, not a full unfiltered list.
2. **Unassigned orders** — `PENDING` orders with no `assignedEditorId` (CURRENT — directly queryable via `docs/08-ORDERS.md`'s state machine).
3. **Production** — orders `ASSIGNED`/`IN_PROGRESS`, by editor if useful.
4. **QA** — orders `READY_FOR_QA`, by assigned reviewer.
5. **Revisions** — orders `REVISION_REQUIRED`, with review-round context.
6. **SLA risk** — **TARGET**, same caveat as §9.1 item 8: only `dueDate` exists today, no risk calculation. A "sorted by due date, oldest first" view is CURRENT-achievable; a computed "at risk" flag is not.
7. **Delivery** — recently `DELIVERED` orders, as a confirmation/audit view.
8. **Workload** — CURRENT only as a raw count of orders per `assignedEditorId`/`assignedQaId` (a simple `GROUP BY`, achievable from existing data) — not a capacity/utilization percentage, which would require staff capacity data that doesn't exist.
9. **Customer activity** — CURRENT as recent orders/organizations (`docs/15-ADMIN.md`, `docs/05-ORGANIZATIONS.md`) — not a behavioral analytics feed, which doesn't exist (`docs/17-ANALYTICS.md` confirms the `analytics` module is a stub).
10. **Operational metrics** — CURRENT only as directly-derivable counts (orders by status, uploads by status, assets by status — all real fields). Anything beyond simple counts (trends over time, forecasting) is TARGET, since no analytics/rollup capability exists (`docs/19-WORKERS-AND-JOBS.md` confirms `apps/workers` has no working consumer, including the `analytics-rollup` job).

Admin stays the denser, more operational register per §4.3/§6.2 — this dashboard is a triage instrument, not a showcase.

---

## 10. Client Dashboard — information architecture (first pass)

This is structural/informational scope, not a visual layout — no mockup implied.

1. **Header context** — organization name, current user, and (if demo) trial state. CURRENT data.
2. **Account strip** — free image credits remaining/used, currency, trial countdown if applicable. CURRENT data (`Organization` fields).
3. **Active production section** — orders in any non-terminal status (`SUBMITTED` through `REVISION_REQUIRED`), each showing: order number, title, status (real enum value, not paraphrased), image count (expected vs. uploaded where relevant), due date if set, real thumbnail if an upload/deliverable preview exists. CURRENT data throughout; "due date" must not imply SLA tracking (see §9.1).
4. **Ready-to-download section** — `DELIVERED` orders' assets, using real deliverable thumbnails (`LazyDeliverablePreview`), with a direct download action (existing presigned-download flow, `docs/10-ASSETS.md`). CURRENT.
5. **Recent orders log** — a short list/table of the most recent orders regardless of status, for orientation (not a full archive — that's the existing `/dashboard/orders` list page's job). CURRENT.
6. **Primary action** — start a new order, deep-linking into the existing order wizard (optionally pre-filtering by category, reusing the existing `?categoryId=` deep link, `docs/08-ORDERS.md`). CURRENT mechanism.
7. **Organization/team context** — CURRENT *data* exists (`Membership`, multi-user org support, `docs/05-ORGANIZATIONS.md`) but **no confirmed client-facing UI** for team management exists today — if surfaced on the dashboard, it should be presented honestly as what exists (e.g. organization name/plan) without implying a team-management feature that isn't built.
8. **Billing/specifications/support entry points** — **TARGET** as dashboard content. Billing UI is a stub (`docs/14-PAYMENTS-AND-BILLING.md`), there is no dedicated "specifications" system beyond order instructions/line items, and no support/helpdesk module exists anywhere in the API inventory (`docs/26-API.md`). These may appear as navigation entries pointing at real (if minimal) destinations, but must not be presented as functioning "billing dashboard" / "support center" widgets.

## 11. Admin Dashboard — information architecture (first pass)

1. **Header context** — signed-in staff member, role (`ADMIN`/`SUPER_ADMIN`/etc., `docs/02-ROLES-AND-PERMISSIONS.md`).
2. **Action-required queue** — unassigned `PENDING` orders first, surfaced as the primary triage list, not buried under general metrics. CURRENT.
3. **Production status breakdown** — counts by status (`ASSIGNED`/`IN_PROGRESS`/`READY_FOR_QA`/`REVISION_REQUIRED`/`DELIVERED`), each linking into the filtered order queue. CURRENT (simple counts).
4. **Revisions requiring follow-up** — orders in `REVISION_REQUIRED`, with review-round shown. CURRENT.
5. **Recent deliveries** — recently `DELIVERED` orders as a confirmation feed. CURRENT.
6. **Workload snapshot** — order counts per assigned editor/QA reviewer. CURRENT (raw counts only, not capacity %).
7. **Customer/organization activity** — recent orders grouped by organization, recently active organizations. CURRENT.
8. **SLA/at-risk view** — **TARGET.** Only a "sort by due date" list is buildable today; do not design a computed risk indicator.
9. **Deeper operational metrics/trends** — **TARGET**, pending real analytics (`docs/17-ANALYTICS.md`, `docs/19-WORKERS-AND-JOBS.md`).

---

## 12. Carried-forward inputs (not final decisions)

The prior design-system pass produced specific decisions that remain the most recent explicit input, not a discarded false start:

- **Typography direction:** a workhorse sans (Geist was the prior choice) paired with a distinct editorial/display voice used sparingly (Instrument Serif was the prior choice) — the *contrast principle* (functional voice vs. editorial voice) is likely worth keeping regardless of which specific typefaces the redesign lands on. Note: Direction D's enterprise/operational emphasis (§9) means the editorial/display voice should be used even more sparingly on Client dashboards than originally scoped — this is an operational surface first, a brand-storytelling surface second.
- **Color direction:** a warm-neutral foundation with one deliberate, restrained brand accent, kept strictly separate from semantic status colors — status clarity matters even more under Direction D, since status *is* the dashboard's core content. **Superseded per §0.2/§7.1:** the brand accent is no longer Electric Coral (`#FF5A36`) — it is now a Fotopixelz-original deep green, inspired by (not copied from) Pixelz's restrained green/neutral direction. The warm-neutral foundation and the strict brand/status separation both carry forward unchanged; only the specific accent hue changes.
- **Radius/shadow/motion principles:** mostly-flat radius, shadows reserved for real elevation, purposeful short-duration motion.

These should be the redesign's starting point for review — re-confirm, adjust, or replace them deliberately, rather than silently dropping this prior work or treating it as unquestionable. See `docs/DESIGN-SYSTEM.md` for the full prior reasoning behind each.

---

## 13. Explicitly open — not yet decided

- Final visual layout for Direction D (this document defines information architecture and priority order, not a mockup — see §10/§11) — and, per §0.1, final visual layout for every other Client/Admin route, tracked page-by-page in `docs/CLIENT-UI-REDESIGN.md`/`docs/ADMIN-UI-REDESIGN.md`.
- Final component shapes (this redesign is not assumed to reuse `@repo/ui`'s current `Button`/`Card`/`Badge`/`Alert` as-is).
- Final exact green/neutral hex values (§7.1 sets direction and constraints, not frozen tokens) and the final success-color hue chosen to avoid the brand-green collision.
- Imagery sourcing/production plan (real before/afters, service examples for marketing surfaces; dashboard imagery is covered by §9.1's real-thumbnail rule and does not block on this).
- Whether/how to expose the CURRENT-but-unsurfaced organization/team (`Membership`) capability on the client dashboard vs. a dedicated settings area.
- Exact implementation sequencing across the full route inventory (see `docs/CLIENT-UI-REDESIGN.md` §3 / `docs/ADMIN-UI-REDESIGN.md` §3 for page-by-page priority, and `docs/ROADMAP.md` for phase-level sequencing).

---

## 14. Relationship to other documents

- `docs/24-UI-UX.md` — per-app current-state audit + the original creative brief this document extends; carries the strategy-change notice and now the global-client/Direction-D update.
- `docs/DESIGN-SYSTEM.md` — the prior, now-provisional token system referenced in §12; its Electric Coral sections are superseded by §0.2/§7.1, its radius/shadow/motion/typography reasoning is not.
- `docs/UI-REVIEW.md` — the authoritative per-page KEEP list for functionality (§2 above is the summary; that document has the page-by-page detail).
- `docs/CLIENT-UI-REDESIGN.md` / `docs/ADMIN-UI-REDESIGN.md` — **new, per §0.1** — the complete route inventory and page-by-page redesign priority for each application; this document stays the principles/direction layer, those documents are the operational scope-and-sequencing layer.
- `docs/CLIENT-DASHBOARD.md` / `docs/ADMIN-DASHBOARD.md` — the build-ready dashboard specs (already approved and implemented for the dashboard route specifically); their status-color rule references Electric Coral and should be read through §0.2/§7.1's supersession.
- `docs/ROADMAP.md` — Phase 1/2 sequencing; this document informs what that work should aim for once implementation resumes.
- `docs/MODULE-MATRIX.md` / `docs/PRODUCT-STATUS.md` — confirm what's functionally real and must survive; the CURRENT/TARGET markings in §7–§11 are cross-checked against these.

**No implementation should begin from this document alone** — §8–§11 establish direction, priority, and information architecture for the dashboards specifically; §0.1/`docs/CLIENT-UI-REDESIGN.md`/`docs/ADMIN-UI-REDESIGN.md` establish scope and priority for the rest of both applications. None of these are a final mockup. Per the current instruction that produced this revision, no code, CSS, or component should be modified until this documentation is reviewed and implementation is explicitly authorized to resume.
