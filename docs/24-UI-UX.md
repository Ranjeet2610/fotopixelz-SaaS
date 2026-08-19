# UI/UX

> ## ⚠️ STRATEGY CHANGE — read before acting on anything below
>
> The incremental "migrate the existing UI onto shared tokens" approach (the Admin Stage 1–3 work: `packages/ui` tokens/primitives wired into `apps/admin/src/components/ui.tsx`) has been **stopped**. On review, the result was judged technically clean but still too close to the original template-derived visual language to meet the product's ambition.
>
> **New direction, effective now:**
> - **FUNCTIONAL FOUNDATION = KEEP.** API, database/Prisma, authentication, RBAC, business logic, order workflows, the upload engine, pricing logic, and every module confirmed COMPLETE in `docs/MODULE-MATRIX.md` are untouched and must stay untouched. This document and `docs/DESIGN-SYSTEM.md` have never proposed changing any of that — the KEEP list here is the same one `docs/UI-REVIEW.md` already established per page.
> - **CURRENT UI = NOT FINAL.** Nothing rendered by `apps/client`, `apps/admin`, or `apps/web` today — including the Stage 1–3 admin work — should be treated as a settled visual direction. It is scaffolding, not the target.
> - **UI/UX = REDESIGN FROM SCRATCH.** The visual system, layouts, page hierarchy, navigation presentation, components (cards, tables, forms), dashboard presentation, service presentation, pricing presentation, upload UX, and order UX are all in scope for a ground-up redesign — not incremental polish of what exists.
> - **The `@repo/ui` primitives built so far (`Button`, `Card`, `Badge`, `Alert`) and the locked Geist/Geist Mono/Instrument Serif/Electric Coral tokens in `docs/DESIGN-SYSTEM.md` are PROVISIONAL.** They are one input to consider, not the final Fotopixelz visual language. Do not assume they will survive the redesign unchanged.
> - **Quality benchmark:** a premium image-editing platform at the quality/professionalism level of Pixelz — visual hierarchy, image-first experience, premium presentation, professional workflow, clean UX, enterprise trust, strong service presentation. **Do not copy Pixelz's branding, layouts, colors, components, or content.** Fotopixelz must have its own identity; Pixelz is a quality bar, not a template.
> - **No redesign has been implemented yet.** This is a documentation-only status change. See `docs/ROADMAP.md` Phase 1 for current status.

This document covers the three frontend applications individually (current state, verified in prior passes), then sets the **creative direction** the visual design should move toward. Functional/architectural findings here reference `docs/01-ARCHITECTURE.md` and `docs/MODULE-MATRIX.md` (Pass 1/2); this document does not re-verify functionality, only visual/UX quality and direction. **Everything below this point describes the pre-strategy-change state and direction and should be read through the lens of the notice above — it is historical/directional input to the upcoming ground-up redesign, not a settled spec.**

**The concrete design-token system (color, typography, spacing, radius, motion, component principles, `packages/ui` scope, and the Admin migration strategy) that puts the creative direction below into practice lives in [`docs/DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md).** This document (`24-UI-UX.md`) remains the source for *why* — the audit of current state and the qualitative creative brief; `DESIGN-SYSTEM.md` is the *what*.

**Typography and brand color are now finalized (locked):**
- **Geist** — primary UI/workhorse typeface, used across application UI, navigation, forms, tables, and dashboards in all three apps.
- **Geist Mono** — used selectively for order numbers, timestamps, IDs, and technical metadata.
- **Instrument Serif** — display/editorial typeface, used selectively for public-website hero headlines, major marketing headlines, and editorial storytelling moments only. Never used throughout the application; Admin remains primarily Geist; Client remains primarily Geist with Instrument Serif only where a genuine editorial moment benefits from it.
- **Electric Coral (`#FF5A36`)** — the single primary brand accent, used deliberately for primary CTAs, selected/active states, and brand moments — never flooded across the UI, never substituted for a status color.

The contrast this creates — **Geist for precision/usability/product, Instrument Serif for creativity/editorial/premium brand** — is the specific mechanism satisfying the "editorial, distinctive, premium" direction below without abandoning the "precision, confident" direction either. See `docs/DESIGN-SYSTEM.md` §2–3 for full usage rules and the reasoning behind each choice. Remaining open decisions (exact neutral/status hex values, numeric type scale, spacing/motion timing, `packages/ui` packaging mechanics) are listed at the end of that document.

---

## PUBLIC WEBSITE (`apps/web`, port 3002)

**Current UI:** None — a single static paragraph (`"Fotopixelz — public website coming soon."`). No layout, no components, no styling beyond defaults.
**Current UX:** N/A.
**Strengths:** None to evaluate.
**Weaknesses:** Does not exist as a product surface.
**Reusable components:** None.
**Design system:** None.
**Responsive/Accessibility/Loading/Error/Empty states:** N/A — nothing to assess.

This app is a placeholder scaffold per its own stated purpose (CLAUDE.md) and is intentionally out of scope until public-site development begins. All creative direction below applies once this app is built.

---

## CLIENT (`apps/client`, port 3000)

**Current UI:** Built on shadcn-style primitives + Tailwind, oklch design tokens, Geist font. Structurally consistent (`Card`/`Button`/`Input` reused throughout), but visually generic — the same neutral gray/white shadcn "default theme" look shared by countless SaaS starters, with no distinctive brand color, imagery, or typographic personality applied on top of the primitives.
**Current UX:** Functionally strong. Login/register have real validation, clear error/success states, and a working Google OAuth button. The order wizard's 5-step flow (category → services → addons → quote → place order) is logically clear and appropriately progressive. The upload panel has real drag-and-drop, per-file progress, retry, and remove.
**Strengths:**
- Consistent component vocabulary (one `Card`, one `Button`, one `Input` used everywhere — no ad hoc styling divergence within this app).
- Real, correctly-sequenced loading/error/empty states on every data-driven page (`LoadingBlock`, destructive-styled alert banners, dashed-border empty states).
- The order wizard and upload flow are functionally sophisticated (see `docs/07-PRICING.md`, `docs/09-UPLOADS.md`) — the visual layer just doesn't yet communicate that sophistication.
**Weaknesses:**
- No imagery anywhere — not on the dashboard, not in the order wizard's service selection, not on the new `/services`/`/pricing` marketing pages. A photo-editing product currently shows zero photos.
- Marketing pages (`/services`, `/pricing`) are functionally real (Pass 2/3 confirmed) but visually a plain bordered-card grid — no different in visual weight from an internal admin listing.
- Dashboard cards ("Orders", "Assets") are shallow, low-information, and visually interchangeable with any CRUD-app dashboard.
- No distinctive color identity — the entire app uses the shadcn default neutral palette with no brand accent color applied.
**Reusable components:** `packages/upload-gallery` (shared upload/preview UI, used across client + admin), the shadcn `components/ui/*` primitives, `LoadingBlock`, `AuthLayout`/`AuthAlert`/`GoogleAuthButton`.
**Design system:** shadcn/Tailwind default tokens (see below) — functional and consistent, but this is a starting scaffold, not a designed brand system.
**Responsive:** Tailwind responsive utility classes (`sm:`/`lg:` breakpoints) used consistently across dashboard, wizard, and marketing pages — structurally sound, not independently stress-tested pixel-by-pixel in this pass.
**Accessibility:** `role="alert"` on error banners, labeled form fields with `htmlFor`, `aria-invalid` on inputs — baseline accessibility present in the auth/wizard/upload flows. No dedicated accessibility audit (contrast ratios, focus order, screen-reader flow) was performed in any pass.
**Loading/Error/Empty states:** Present and consistent (see `docs/29-ERROR-HANDLING.md`) — this is a real strength to preserve, not rebuild.

---

## ADMIN (`apps/admin`, port 3001)

**Current UI:** A completely separate, hand-rolled component kit (`apps/admin/src/components/ui.tsx`: custom `Button`, `Card`, `DataTable`, `Modal`, `PageHeader`, etc.), styled with plain CSS classes on `Arial, Helvetica, sans-serif`, a dark sidebar, and a green accent color — none of which is shared with the client app's design tokens.
**Current UX:** Functionally solid — real CRUD across orders, catalog, organizations, clients, users, with role-scoped visibility (see `docs/15-ADMIN.md`). Reads as a competent, classic back-office tool.
**Strengths:** Data-dense tables, clear page headers, working modals/forms, genuinely tiered admin/super-admin permission enforcement reflected in what's shown.
**Weaknesses:** Looks like a generic internal ops panel — no visual relationship to the Fotopixelz brand at all. A staff member and a client would have no way to tell, from the UI alone, that these are the same product.
**Reusable components:** `packages/upload-gallery` (shared with client for deliverable previews); everything else is admin-local (`ui.tsx`).
**Design system:** Its own — separate CSS custom properties, separate font stack, no shared tokens with `apps/client`.
**Responsive:** Not independently assessed in prior passes; admin tools are conventionally less prioritized for mobile, and no evidence either way was gathered.
**Accessibility:** Not independently assessed.
**Loading/Error/Empty states:** Present (`LoadingBlock`, `ErrorBanner`, `SuccessBanner` in `ui.tsx`) — functional, following the same real-state discipline as the client app, just in the admin app's own visual language.

---

## Current design system (as it exists today, not the target)

| Aspect | Client app | Admin app |
|---|---|---|
| Font | Geist Sans/Mono | Arial/Helvetica system stack |
| Color tokens | oklch, shadcn default neutral palette, no brand accent | Custom hex tokens, dark sidebar, green accent |
| Components | shadcn primitives (`Button`, `Card`, `Input`, `Table`) | Hand-rolled equivalents (`ui.tsx`) |
| Radius | shadcn scale (`--radius` based) | Custom (`--radius: 8px`) |
| Shared package | `packages/ui` now has design tokens + Button/Card/Badge/Alert (`docs/DESIGN-SYSTEM.md` §13), but **neither app depends on it yet** — not actually shared in practice | — |

This split is the single biggest design-system problem: **two unrelated visual systems for one product**. The shared package built to prevent that (`packages/ui`) now has an initial token/primitive layer, but wiring either app to actually consume it (Stage 3 of the migration) has not started.

---

## Creative direction: what Fotopixelz should become

The existing UI was built quickly, functionally, and competently — and should **not** be treated as the visual bar going forward. Fotopixelz sells a **premium creative service**: professional photo editing. The product's visual identity should communicate that directly, not read as a generic SaaS dashboard wrapped around real backend logic.

**Target market update:** Fotopixelz targets global professional clients — e-commerce brands, retailers, agencies, photo studios, and enterprise customers — not a domestic/small-business service audience. This adds "operational credibility to a professional buyer" (production visibility, turnaround awareness, organizational clarity) alongside pure visual polish. See `docs/REDESIGN-DIRECTION.md` §7–§11 for the full reasoning and the resulting **Direction D — Production Control Center**, now the preferred dashboard direction over the three earlier explorations (gallery-forward, timeline-forward, editorial-hybrid).

Target qualities: **creative, premium, image-first, editorial, distinctive, modern, visual, confident** — and, for dashboards specifically, **operationally credible to a professional B2B buyer.**

A reference point for the *level of creative ambition* (not the literal design) is Aurelix-caliber work — meaning: a site that feels art-directed, not templated. **Do not copy Aurelix's branding, layout, colors, typography, components, content, or illustrations.** Fotopixelz needs its own identity, distinct from any reference.

### What to avoid
- Generic SaaS templates and repetitive bordered-card grids (the current `/services` grid and dashboard cards are examples of the pattern to move away from, not a pattern to repeat elsewhere).
- Boring, data-table-first dashboard patterns as the *default* visual language (acceptable inside admin's operational core, not acceptable as the client/marketing identity).
- Generic "AI startup" aesthetics: default gradients, glassmorphism, particle backgrounds, stock 3D-blob illustrations.
- Meaningless motion — animation for its own sake rather than to clarify state or hierarchy.
- Template-shaped hero sections (giant centered headline + two buttons + vague abstract graphic) — the current client homepage and `/services`/`/pricing` heroes are examples of this pattern.
- Stock-looking layouts and unnecessary decoration that doesn't serve the content.

### What to build toward
- **Typography:** Geist for all product UI, Instrument Serif reserved for genuine editorial/hero moments — display-weight Instrument Serif headlines that feel edited, not default-sized shadcn headings applied everywhere. Typography carries the "editorial" identity specifically through this Geist/Instrument Serif contrast, not through scale alone. See `docs/DESIGN-SYSTEM.md` §3.
- **Layout:** asymmetry and intentional composition where it serves imagery, not just centered stacks of cards. Grid systems that can showcase photography at real scale, not thumbnail-sized crops.
- **Imagery:** the organizing principle of the entire visual system (see Image-First Principle below) — not a decorative afterthought bolted onto a card layout.
- **Color:** Electric Coral (`#FF5A36`) as the single locked brand accent, used deliberately and sparingly against a warm-neutral foundation — not the current unbranded neutral-gray default. See `docs/DESIGN-SYSTEM.md` §2 for full usage rules; exact neutral/status hex values remain open.
- **Spacing:** generous, confident whitespace — premium products rarely feel cramped.
- **Motion:** purposeful micro-interactions (hover states on service cards, transition between wizard steps, upload progress) that clarify what's happening, not decorative animation layered on top.
- **Interactions:** every clickable element should feel deliberately designed, not a default browser/shadcn state.
- **Responsive behavior:** the premium feel must hold at every breakpoint, not just desktop — mobile is not a lesser-effort target.
- **Accessibility:** contrast, focus states, and semantic structure should be treated as part of "premium," not traded away for visual flourish.

### Image-first principle
Photo editing is the product — the UI should look like it. Wherever real assets exist or can be produced without fabrication:
- Before/after comparisons of actual editing work.
- Real image transformations (background removal, ghost mannequin, retouching) shown as visual proof, not described in text.
- Service pages organized around what the service *produces*, not just its name and price.
- Visual previews in the order wizard's service-selection step (currently pure text).

**Do not fabricate customer work or invent example images that don't exist.** Where no real before/after or example imagery currently exists in the repository or asset library, this is a **future content requirement** — document the need, do not synthesize placeholder "customer photos" that could be mistaken for real work.

### Application-specific direction

**Public website (`apps/web`, once built):** highly visual, creative, premium, conversion-focused, SEO-friendly. A plausible experience shape — hero, services, visual transformations/before-after, how it works, quality/trust signals, pricing, final CTA — is directional, not a fixed spec. This is TARGET, not current.

**Client (`apps/client`):** premium, clear, efficient, workflow-focused, and visual — but never at the expense of the wizard/upload/tracking clarity that already works well functionally. The five core jobs (create order, upload images, track order, review results, download assets) must stay fast and unambiguous even as the visual layer becomes more distinctive. **The client dashboard specifically now follows Direction D — Production Control Center** (`docs/REDESIGN-DIRECTION.md` §9.1/§10): the primary question is "what is happening with my image production?" — image-first, but structured around production status, image counts, and account context, not a gallery/portfolio experience.

**Admin (`apps/admin`):** operational, efficient, information-dense where that serves the job (order queues, tables) — and visually consistent with the Fotopixelz identity (shared type/color/component language with the client app) without becoming a marketing surface. Admin should look like it belongs to the same company, not like the same generic back-office template every SaaS product ships with. **The admin dashboard follows Direction D's operational half** (`docs/REDESIGN-DIRECTION.md` §9.2/§11): the primary question is "what requires my operational attention?" — action-required queue first, denser and more metric-forward than Client.
