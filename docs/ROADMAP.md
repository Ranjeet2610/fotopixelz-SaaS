# Product Roadmap

This roadmap sequences work based on the gaps documented across Pass 1–4. It does not commit to dates. **Development proceeds strictly in phase order — see `docs/README.md`'s Sequential Development Rule.** Do not start a later phase's module work while an earlier phase has open scope, except where a phase explicitly depends on something already delivered.

---

## PHASE 0 — Documentation + Architecture
**Status: COMPLETE (this documentation effort, Pass 1–4).**
**Modules:** Product overview, application architecture, module docs, API/database inventory, roles/permissions, security, error handling, testing, deployment, UI/UX direction, current/target/gap, this roadmap.
**Dependencies:** None.
**Completion criteria:** A new engineer or agent can identify CURRENT state for any module without re-auditing the codebase from scratch. Met by `docs/00`–`docs/31`, `docs/MODULE-MATRIX.md`, `docs/TECHNICAL-MATRIX.md`, `docs/CURRENT-TARGET-GAP.md`.
**Known blockers:** None — documentation is inherently a living artifact and will need updates as later phases change CURRENT state; that is expected maintenance, not a blocker.

---

## PHASE 1 — Admin

**⚠️ STRATEGY CHANGE (supersedes the plan below):** The incremental "migrate onto shared tokens" approach described in this phase's original plan and progress log has been **stopped by explicit decision**. It was judged technically clean but too close to the original template-derived visual language. Fotopixelz is moving to a **ground-up UI/UX redesign** across Admin, Client, and the future Website, benchmarked on quality/professionalism against premium image-editing platforms like Pixelz — without copying Pixelz's branding, layout, colors, components, or content. See `docs/24-UI-UX.md`'s strategy-change notice and `docs/DESIGN-SYSTEM.md`'s superseded notice for full detail.

**FUNCTIONAL FOUNDATION = KEEP.** Nothing below changes what must be preserved: API, database/Prisma, authentication, RBAC, business logic, order workflows, the upload engine, pricing logic, and every module confirmed COMPLETE in `docs/MODULE-MATRIX.md`.

**CURRENT UI = NOT FINAL.** The Admin Stage 1–3 work below (tokens, `Button`/`Card`/`Badge`/`Alert` primitives, the token-repoint in `apps/admin`) is **provisional scaffolding**, not a settled visual direction. It is retained in the codebase (nothing was deleted or reverted) but is not to be treated as the target to polish toward.

**UI/UX = REDESIGN FROM SCRATCH.** Visual system, layouts, page hierarchy, navigation presentation, components, dashboard/service/pricing presentation, upload UX, and order UX are all in scope for the redesign — see `docs/24-UI-UX.md`.

**No redesign implementation has started.** This is a documentation-only status change; no code was written or modified to produce it.

**Modules:** *(original plan, now superseded — retained for history)* Admin design-system migration (visual only — see `docs/UI-REVIEW.md`: functionality is KEEP, visual is REDESIGN), any admin UI gaps surfaced during that work. **Current direction:** the admin dashboard follows Direction D's operational half (`docs/REDESIGN-DIRECTION.md` §9.2/§11) — information architecture defined, visual mockups not yet built.
**Dependencies:** Phase 0 (this documentation) as the reference for what's real vs. stub in admin.
**Prerequisites:** A ground-up redesign direction (not just tokens) must exist before further visual implementation begins.
**Completion criteria:** *(to be redefined once the redesign direction is established — the old "shares a design language with incremental tokens" criterion no longer applies.)*
**Known blockers:** None on strategy — the redesign direction now exists: **Direction D — Production Control Center** (`docs/REDESIGN-DIRECTION.md` §7–§11), targeting global professional clients (e-commerce brands, retailers, agencies, studios, enterprise), with a first-pass information architecture defined for both the Client and Admin dashboards. No mockups exist yet for either — that's the next step before implementation.

**Progress (historical — Stage 1–3, stopped, not deleted):**
- Design tokens + Button/Card/Badge/Alert primitives were built in `packages/ui` (see `docs/DESIGN-SYSTEM.md` §13) and wired into `apps/admin/src/components/ui.tsx` (`Button`/`StatusBadge`/`RoleBadge`/`ErrorBanner`/`SuccessBanner`), verified live in-browser. Admin's `globals.css` body-font bug was fixed. A Card/kpi-card CSS review concluded no structural swap was needed. **All of this remains in the codebase as provisional scaffolding** — see the strategy-change notice above before building further on top of it.

---

## PHASE 2 — Client
**Modules:** Client visual redesign (marketing pages, dashboard, order wizard, upload, order detail, assets — all KEEP-functionality/REDESIGN-or-IMPROVE-visual per `docs/UI-REVIEW.md`), plus closing the two confirmed functional stubs in this app: billing UI and settings UI (contingent on Phase 4's payments work for billing specifically — see dependency note below). **The client dashboard specifically follows Direction D — Production Control Center** (`docs/REDESIGN-DIRECTION.md` §9.1/§10) — information architecture defined, visual mockups not yet built.
**Dependencies:** Phase 1's design-system decisions (shared tokens/components should exist before or alongside this phase, not duplicated a third time); Phase 4 (payments backend) before billing UI can be genuinely completed, not just visually stubbed.
**Prerequisites:** Design system defined (same as Phase 1).
**Completion criteria:** Every KEEP-functionality page in `docs/UI-REVIEW.md` retains its current working behavior while adopting the new visual direction; billing/settings move from STUB to at least PARTIAL (real API-backed, even if payments collection itself is still Phase 4/5 work).
**Known blockers:** Billing UI cannot be truly complete until Phase 4/5 payments work lands — a visual settings/billing page with no backend is still a stub, per `docs/DEFINITION-OF-DONE.md`.

---

## PHASE 3 — Main Website (`apps/web`)
**Modules:** Full public marketing site build-out (`docs/00-PRODUCT-OVERVIEW.md`, `docs/24-UI-UX.md` "Public Website" direction) — homepage, services, pricing, about/contact, image-first creative execution.
**Dependencies:** Phase 1/2 design-system work should inform this (or this phase may be where the design system is first fully expressed, if sequenced that way by the team) — not to be built as a third unrelated visual system.
**Prerequisites:** Real or produced imagery/before-after content (per the Image-First Principle in `docs/24-UI-UX.md`) — do not launch with fabricated customer work.
**Completion criteria:** `apps/web` is a real, deployed, SEO-considered public site wired into Docker Compose/deployment, replacing the current single-paragraph placeholder.
**Known blockers:** No before/after or example-work imagery currently exists in the repository — this is a content production dependency, not an engineering one.

---

## PHASE 4 — Core Backend / Product Gaps
**Modules:** Notifications (wire the two missing routes — small, high-value fix), `DRAFT` status cleanup or removal, `Revision`/`AssetVersion` model reconciliation, organization membership/invite UI (if confirmed as an intended client-facing feature), any other PARTIAL items surfaced in `docs/CURRENT-TARGET-GAP.md`.
**Dependencies:** Phase 0 documentation (source of truth for what's actually missing).
**Prerequisites:** None beyond documentation.
**Completion criteria:** Every module currently marked PARTIAL in `docs/MODULE-MATRIX.md`/`docs/TECHNICAL-MATRIX.md` is either promoted to COMPLETE or has its scope explicitly deferred with a written reason.
**Known blockers:** None identified — this phase is mostly small, well-scoped fixes to already-real backend logic.

---

## PHASE 5 — Payments / Editing / QA / Revisions / AI / Workers
**Modules:** Real payment collection (Stripe checkout/webhooks, `Payment`/`Invoice` persistence), a decision on whether `editing`/`qa`/`revisions` remain absorbed into `orders` (current, working pattern) or are extracted into first-class modules, AI processing (if still a product goal), and a real BullMQ consumer in `apps/workers`.
**Dependencies:** Phase 4 (backend gaps should be closed first, since payments/workers touch the same order lifecycle); Phase 2 (billing UI needs this phase's backend to be genuinely complete).
**Prerequisites:** A decision on payment provider scope (Stripe client already present, unused), and a decision on whether AI processing is still a committed product direction (per `docs/18-AI.md`, nothing today assumes it — do not market or build around it until this is decided).
**Completion criteria:** Client can pay for an order end-to-end; `apps/workers` actually consumes at least one real queue; QA/editing/revisions have a deliberate architecture (either "stays in `orders`, dedicated modules are removed" or "extracted, dedicated modules become real" — not left in the current ambiguous dual-schema state).
**Known blockers:** Requires product/business decisions (payment provider terms, AI go/no-go) that are outside engineering scope to resolve unilaterally.

---

## PHASE 6 — Testing / Security / Performance / Production
**Modules:** Full test suite (unit for pricing/order-state-machine logic at minimum; integration for the presigned-upload flow; E2E for the order lifecycle) — see `docs/30-TESTING.md`, which confirms zero tests exist today. Security hardening per `docs/28-SECURITY.md`'s known-risks list (CORS allowlist, refresh tokens, error-message redaction, verification-token hashing). Production deployment pipeline (CI/CD, production Docker Compose or equivalent, per `docs/31-DEPLOYMENT.md`'s confirmed absence of both).
**Dependencies:** All prior phases — testing and hardening should cover the final feature set, not be bolted onto a moving target repeatedly. In practice, foundational tests (order state machine, pricing) can and should start earlier, but full coverage and production hardening belong here.
**Prerequisites:** Phases 1–5 substantially complete.
**Completion criteria:** Automated tests exist and pass for every COMPLETE module; the security known-risks list in `docs/28-SECURITY.md` is resolved or explicitly accepted; a real CI pipeline and production deployment configuration exist and have been used successfully at least once.
**Known blockers:** None structural — this is the largest pure-effort phase given the current zero-test baseline.

---

## Sequential development rule
```
ADMIN → CLIENT → MAIN WEBSITE → BACKEND / PRODUCT GAPS → ADVANCED PROCESSING → PRODUCTION
```
Do not jump between applications out of order. If a cross-cutting dependency is discovered (e.g. Phase 2 needing Phase 4's payments), it is called out explicitly above rather than justifying a reorder of the whole sequence.
