# Fotopixelz Design System

> ## ⚠️ SUPERSEDED BY STRATEGY CHANGE — this document is PROVISIONAL INPUT, not the final system
>
> The incremental migration this document describes (Stage 1–3: `packages/ui` tokens + `Button`/`Card`/`Badge`/`Alert` primitives wired into `apps/admin`) has been **stopped**. Fotopixelz is moving to a **ground-up UI/UX redesign** (see `docs/24-UI-UX.md`'s strategy-change notice and `docs/ROADMAP.md` Phase 1) benchmarked against premium image-editing platforms like Pixelz for quality/professionalism — **not** copying Pixelz's branding/layout/colors/components.
>
> **What this means for everything below:**
> - The `@repo/ui` primitives that exist today (`Button`, `Card`, `Badge`, `Alert`) are **provisional scaffolding**, not the final Fotopixelz component library. They may be kept, revised, or replaced entirely by the redesign.
> - The "locked" typography and color decisions immediately below (Geist / Geist Mono / Instrument Serif / Electric Coral `#FF5A36`) remain the **current inputs on record** — they were an explicit, deliberate decision and are not casually discarded — but they are now **subject to review as part of the ground-up redesign**, not treated as permanently fixed regardless of what the redesign concludes. Do not cite this document as proof the visual identity is settled.
> - No further code should be written against this document's specifics until the redesign strategy produces its own direction.
>
> This document is retained as a record of the prior design-system pass and as one input to the redesign — not as a spec to implement further.
>
> **Update:** the redesign now targets a global professional client base (e-commerce brands, retailers, agencies, studios, enterprise) and has selected **Direction D — Production Control Center** as the preferred dashboard direction — see `docs/REDESIGN-DIRECTION.md` §7–§11. That direction leans the visual system toward operational credibility (status/production clarity, account context) more than a purely editorial/brand-storytelling register — worth weighing when this document's token choices are eventually revisited, particularly how sparingly the Instrument Serif display voice should appear on dashboard/operational surfaces versus marketing surfaces.

**Status: Typography and brand color were LOCKED (finalized decisions below) as of the prior migration pass. Everything else in this document (exact neutral values, spacing rhythm, motion timing, `packages/ui` packaging mechanics) remained PROPOSED, not decided — and the entire document is now provisional per the notice above.** This document is design-system planning, produced by reading `docs/24-UI-UX.md`, `docs/UI-REVIEW.md`, `docs/01-ARCHITECTURE.md`, `docs/PRODUCT-STATUS.md`, the current `apps/admin/src/components/ui.tsx` + `apps/admin/src/app/globals.css`, and the current `apps/client` shadcn tokens (`apps/client/src/app/globals.css`, `components/ui/button.tsx`, `components/ui/card.tsx`). **No code, tokens, CSS, Tailwind config, `packages/ui`, or components have been changed to produce this update — this remains documentation only.**

**Prior "locked" decisions (now provisional inputs to the ground-up redesign, per the notice above):**
- Primary UI/workhorse typeface: **Geist**
- Monospace typeface: **Geist Mono**
- Display/editorial typeface: **Instrument Serif**
- Primary brand accent color: **Electric Coral, `#FF5A36`**

These remain the most recent explicit decisions on record and should be the starting point for the redesign's own review, not silently dropped — but they are no longer to be treated as immovable. See §2 and §3 below for the original full usage rules and reasoning.

---

## 1. Recommended Fotopixelz visual direction

Fotopixelz sells **outsourced professional photo editing** — the product is proof-by-result. The visual identity should behave like a photography/retouching studio's portfolio site crossed with a precise operations tool, not like a generic SaaS dashboard that happens to sell photo editing.

Three ideas should govern every visual decision:

1. **The image is the hero, chrome is quiet.** UI chrome (cards, borders, buttons) should recede so imagery — before/afters, service previews, deliverables — reads as the most important thing on screen. This is the direct opposite of the current client app, where the UI has no imagery at all and the chrome (bordered cards) *is* the entire visual content.
2. **Confidence through restraint, not decoration.** Premium reads as considered whitespace, precise type, and a small number of well-chosen colors used deliberately — not gradients, glassmorphism, or motion for its own sake. The current admin app's green-accent/dark-sidebar treatment and the client app's default-shadcn neutral palette both fail this in different ways: admin because it's generic-ops-tool styling with no brand intent, client because it has *no* color identity at all.
3. **One editorial voice, two registers.** Client and public-website should feel expressive and spacious (the "gallery" register). Admin should feel precise and dense (the "instrument panel" register) — same typographic and color DNA, different density and restraint, the way a design studio's portfolio site and its internal project-management tool would still obviously belong to the same company.

Avoid explicitly, per the brief: generic SaaS templates, repetitive bordered card grids as a default pattern, boring dashboard-card patterns, generic AI-startup aesthetics (default gradients, glassmorphism, particle/blob art), meaningless animation, template-shaped hero sections, stock-looking layouts, and decoration that doesn't serve content. Aurelix-level craft is a *quality* bar, not a *style* to copy — nothing here references Aurelix's actual colors, type, layout, or components.

---

## 2. Color system — brand accent LOCKED

**Reasoning:** Both existing systems fail for identifiable reasons: client's shadcn defaults are genuinely brand-*less* (pure grayscale — every unstyled shadcn app looks like this), and admin's green/dark-sidebar combination reads as generic internal-tool styling (green-as-accent is one of the most common default "success/ops" colors in dashboard templates) rather than a considered brand choice.

### LOCKED: Primary brand accent — Electric Coral, `#FF5A36`

**Why this color:** Electric Coral is warm, saturated, and unambiguously energetic — it reads as *creative* rather than *corporate-tech* (it is deliberately not a "SaaS blue" or an "eco green," the two most default, least distinctive accent choices available). It sits close enough to red/orange to feel alive and confident without being mistaken for the `error` status color once the two are placed in the restrained neutral system this document specifies (§ neutral system below) — the two are kept visually distinct by usage discipline (see rules below), not by hue alone, so the discipline matters as much as the hex value.

**Usage — deliberate and restrained, never flooded:**
- Primary CTAs (one per screen/context — e.g. "Start an order," "Place order," "Assign editor")
- Selected/active states (a selected service card in the order wizard, the active nav item)
- Important interactive highlights (focus rings on the single most important control, key hover accents)
- Key links where appropriate (not all links — body-copy links can remain neutral/underlined)
- Brand moments (logo lockup, hero accents on the public website, key marketing CTAs)
- Subtle visual accents (a thin coral rule, an icon accent) used sparingly for texture, not as a background fill

**Never use coral for:** every button (only the single primary action per context), every card, large background fills anywhere in the product, body text, or as a substitute for any status color (`success`/`warning`/`error`/`info` — see below). This restraint is the entire point — coral's power comes from its rarity on screen.

### Neutral system — warm-ink foundation (direction locked, exact values open)

The interface remains **primarily neutral and sophisticated**, with Electric Coral providing the only controlled visual energy — not a rainbow UI, not a second or third accent color competing with it.

| Token | Role | Direction |
|---|---|---|
| `primary` | Electric Coral, `#FF5A36` — **locked**, per rules above | Locked value |
| `secondary` | A quieter supporting accent for secondary CTAs/tags — should not compete with `primary` and must not be another saturated hue that dilutes coral's distinctiveness | Desaturated warm neutral, not a second bright color — exact value open |
| `background` | Page background | Warm off-white/near-black (light/dark), never stark `#fff`/`#000` — exact value open |
| `surface` | Cards, panels, table rows — one step off `background` | Subtle, low-contrast step — exact value open |
| `foreground` | Primary text | High-contrast warm ink, not pure black — exact value open |
| `muted` | Secondary text, metadata, placeholders | Mid-gray, warm-leaning — exact value open |
| `border` | Hairlines, dividers | Very low-contrast, closer to `surface` than `foreground` — exact value open |

### Status colors — independent from brand accent, LOCKED as a rule (exact hues open)

| Token | Role | Direction |
|---|---|---|
| `success` | Positive status (order delivered, upload complete) | An appropriate, unambiguous green — reserved *only* for status, never for brand/CTA |
| `warning` | Attention states (revision required, action needed) | An appropriate amber/yellow, visually distinct from Electric Coral despite both sitting in a warm range — chosen to read clearly as "caution," not "brand" |
| `error` | Destructive/failure states | An appropriate red, distinct enough from Electric Coral's orange-red that the two are never confused in context (destructive-action red should read cooler/deeper than coral's warm orange-leaning red) |
| `info` | Neutral informational states | An appropriate, quiet blue — used sparingly, not as a second accent |

**Locked rule:** Electric Coral must never substitute for `success`, `warning`, or `error`. Brand color and semantic status colors remain visually distinct at all times — this is a hard rule, not a stylistic preference, because status meaning (is this order okay or not?) must never depend on the same color that also means "click here."

Dark mode should be a first-class second definition of these tokens (per the existing artifact/design convention already used elsewhere in this project's tooling), not an afterthought — but is not required to launch simultaneously with light mode.

---

## 3. Typography system — LOCKED

Three typefaces, each with a single clear job. **No other display font may be introduced without explicit approval.**

### LOCKED: Geist — primary UI / workhorse

**Why:** the client app already loads Geist Sans via `next/font/google` — a strong, modern, highly legible variable font family well-suited to "precision/usability/product." It is free of the "generic SaaS" feel specifically *because* the font itself was never the problem — the absence of scale, hierarchy, and brand color around it was (see §2). Keeping Geist as the sole UI workhorse avoids introducing a fourth typeface for no reason and preserves an asset already correctly chosen.

**Use Geist for:** application UI, navigation, buttons, forms, tables, dashboards, body text, and operational interfaces — i.e. everything that is *product*, across all three apps. Admin is **primarily** Geist. Client is **primarily** Geist.

### LOCKED: Geist Mono — monospace

**Why:** already loaded alongside Geist Sans (`next/font/google`, `--font-geist-mono`) and currently unused for anything distinctive — a genuinely free, on-brand asset. Monospacing technical values (order numbers, timestamps, IDs) is a small but real signal of precision that reinforces the "precision" half of the Geist/Instrument Serif contrast (see below), and gives Admin in particular a distinctive, functional typographic texture instead of rendering everything in the same body-text style.

**Use Geist Mono selectively for:** order numbers, timestamps, IDs, technical metadata, and reference numbers. Not for body text, headings, or general UI labels.

### LOCKED: Instrument Serif — display / editorial

**Why:** the brief calls for contrast between "precision/usability/product" and "creativity/editorial/premium brand" — a single sans-only system (the current state of both apps) cannot produce that contrast no matter how well-scaled it is. Instrument Serif is a distinctive, high-character display serif suited to large-scale editorial moments — hero headlines, storytelling — without being a generic "premium serif" default. Pairing one quiet functional sans (Geist) with one deliberate, sparingly-used display serif (Instrument Serif) is exactly how editorial/premium sites differentiate from SaaS templates that render every heading in the same body font at a larger size.

**Use Instrument Serif selectively for:** public website hero headlines, major marketing headlines, editorial moments, large service storytelling sections, and premium visual statements. **Instrument Serif must NOT be used throughout the application** — not for routine page titles, not for table headers, not for form labels, not for admin at all beyond the rarest, most deliberate exception.

### The contrast principle (why two type voices, not one)

**Geist = precision / usability / product.** **Instrument Serif = creativity / editorial / premium brand.** Every use of Instrument Serif should be a deliberate decision that "this specific moment is a brand/editorial moment," not a default heading style. If a heading is describing product functionality (a page title, a section header inside a workflow), it stays Geist. If it's telling a story or making a brand statement (a hero headline, a major marketing section), it can be Instrument Serif. This binary is the whole mechanism — diluting it by using Instrument Serif for ordinary UI headings would collapse the exact contrast the brief asks for.

### Type scale (levels — LOCKED assignment of face, exact sizes open)

| Level | Purpose | Typeface | Where used |
|---|---|---|---|
| `display` | Hero headlines, major editorial moments | **Instrument Serif** | Public website hero, client marketing "genuinely big moment" sections only — never Admin |
| `H1` | Page-level title | Geist, bold | All apps |
| `H2` | Section title | Geist, semibold | All apps |
| `H3` | Subsection/card title | Geist, medium | All apps |
| `body` | Default reading text | Geist, regular | All apps |
| `small` | Secondary/supporting text | Geist, regular, `muted` color | All apps |
| `label` | Form labels, table headers | Geist, medium, occasional letter-spacing for precision | All apps |
| `metadata` | Order numbers, timestamps, IDs, reference numbers | **Geist Mono** | All apps, used selectively per the rule above |

A defined numeric type *scale* (sizes/line-heights per level, a ratio-based system) should replace the current ad hoc Tailwind size classes (`text-sm`, `text-lg`, `text-2xl`) picked per-component with no systematic relationship — this remains a real, fixable inconsistency in both apps and is **not** part of what's locked here; only the *typeface* assigned to each level is locked, not the exact point sizes.

---

## 4. Recommended spacing / radius system

**Spacing:** Both apps already use Tailwind's default spacing scale (4px base unit) — recommend **keeping** that scale as the mechanical unit (no reason to invent a new one), but adopting an explicit **rhythm convention** on top of it: e.g. a documented small/medium/large/section spacing vocabulary (rather than each page choosing `gap-3` vs `gap-4` vs `gap-6` ad hoc, which is the current pattern in both apps). "Generous, confident whitespace" (per `docs/24-UI-UX.md`) means erring toward the larger end of the scale at section/page level, and tighter at component-internal level (e.g. inside a table row) — density should be a deliberate choice per context, especially given Admin's stated need for high information density in specific places.

**Radius:** Client currently uses a `0.625rem` (10px) base radius (shadcn default) with derived sm/md/lg/xl steps; admin uses a flatter `8px` fixed radius. Neither is wrong; the inconsistency is the problem.

Proposal — **a restrained, mostly-flat radius scale**, explicitly *not* the "everything is a rounded pill" style the brief calls out to avoid:

| Token | Use | Direction |
|---|---|---|
| `small` | Inputs, small buttons, badges, table cells | Subtle rounding — enough to soften, not enough to feel "bubbly" |
| `medium` | Cards, panels, dialogs | The default container radius — moderate, consistent |
| `large` | Rare, large hero/feature containers (marketing only) | Slightly more generous, reserved for expressive moments, not routine UI |
| `pill` | Status badges, tags only | Full round — deliberately restricted to small status/label elements, never applied to cards, buttons, or containers generally (this is the specific overuse pattern to avoid) |

---

## 5. Borders

Standard border behavior: **thin, low-contrast hairlines** (`border` token, close to `surface` in value) used to separate content when spacing alone isn't sufficient — not decorative framing around every card. Admin's current pattern of bordering nearly every panel is heavier than necessary; client's card border (`ring-1 ring-foreground/10`) is closer to the right restraint level already. Prefer **spacing and subtle background-shift (`surface` vs `background`) over borders** as the primary separation technique where either would work; reserve visible borders for tables (row/column separation) and inputs (affordance that something is editable).

---

## 6. Shadows

Use shadows **sparingly and only to indicate elevation that matters functionally** — a dropdown/popover/dialog floating above content, a dragged item, a sticky header gaining separation on scroll. **Do not use shadows on static cards, buttons, or page sections** as a default decorative treatment — this is one of the most common "generic SaaS" tells, and neither current app currently over-uses shadows (a rare thing both get right by omission), so this is a rule to *preserve*, not fix.

---

## 7. Motion

| Aspect | Direction |
|---|---|
| **Duration** | Short and purposeful — roughly 120–200ms for micro-interactions (hover, focus, small state changes), up to ~300ms for larger transitions (panel open, page-section reveal). Nothing should feel slow enough to be noticed as "an animation" rather than "a response." |
| **Easing** | A single consistent easing curve (e.g. a standard ease-out for entrances, ease-in for exits) applied system-wide — not a different curve per component, which is the usual source of motion feeling "off" even when individual animations are fine. |
| **Hover** | Every interactive element gets a deliberate hover state (color/weight/underline shift) — currently inconsistent across admin's custom classes vs. client's shadcn defaults. |
| **Transition** | Reserve larger transitions (page/section-level) for moments that genuinely help comprehension — e.g. the order wizard's step transitions, an image before/after reveal — not blanket "fade everything in" patterns. |
| **Reduced motion** | Respect `prefers-reduced-motion` — disable/shorten non-essential transitions for users who request it. Not currently addressed in either app; should be a baseline requirement of the new system, not an afterthought. |

---

## 8. Component principles

Principles only — no implementation in this document.

- **Buttons:** A small number of variants (primary, secondary, outline/ghost, destructive) with clear, consistent sizing steps — client's existing `buttonVariants` (cva-based) is structurally a reasonable pattern to build the *shared* button on top of, once restyled with new tokens; admin's parallel `admin-btn-*` class system should be retired in favor of it, not maintained alongside it.
- **Inputs:** Clear focus states (visible ring/outline, not just a border-color shift), consistent height across text/select/textarea, label always visible (not placeholder-as-label).
- **Selects / Dropdowns:** Same visual language as inputs; dropdown panels use the `medium` radius and elevation-shadow rule from §6, not a separate ad hoc treatment.
- **Cards:** Used for genuinely card-shaped content (a service, an order summary) — not as the default wrapper for every section of every page, which is the exact "repetitive card grid" pattern the brief says to avoid. Prefer plain sectioned layout with spacing/typography doing the separation work where a literal "card" isn't semantically meaningful.
- **Tables:** The primary tool for Admin's information density — strong, clear row/column structure, sticky headers for long lists, comfortable but not loose row height, monospace treatment for numeric/ID columns per §3's metadata-typography idea. Admin's existing `DataTable` component (`ui.tsx`) is structurally reasonable and should be restyled, not rebuilt from scratch.
- **Badges:** `pill` radius (per §4), used for status (order status, role, active/inactive) — color drawn strictly from the status palette (§2), never from `primary`.
- **Tabs:** Used for switching between views of the *same* entity (e.g. an order's detail/comments/history) — underline or subtle background-pill indicator, not heavy boxed tabs.
- **Dialogs:** Reserved for focused, blocking decisions (confirm delete, create record) — elevation shadow per §6, `medium` radius, should not be overused for content that could just be a page or drawer.
- **Drawers:** Preferred over dialogs for longer forms/detail views that benefit from more space while keeping context (e.g. viewing an order's full detail from a list without full navigation) — an opportunity area neither app currently uses.
- **Tooltips:** Short, functional, delayed-appearance — not a substitute for visible labels.
- **Navigation:** Persistent, clearly current-state-aware (active item indicated by more than just a background tint — consider a `primary`-colored indicator bar/underline, reserving actual brand color for exactly this kind of "you are here" signal).
- **Sidebar:** Admin's existing dark sidebar concept is reasonable *structurally* (persistent, collapsible on mobile) — the visual treatment (color, typography) should move onto the shared token system rather than its own custom dark-green palette.
- **Breadcrumbs:** Use where hierarchy is genuinely deep (admin order → asset, catalog → category → service) — skip on flat structures where they'd just repeat the page title.
- **Alerts:** Inline, `small`-radius, colored by the status palette (§2), with an icon + concise message — the existing client-app pattern (`role="alert"`, destructive-styled banner) is a good functional baseline to restyle, not rebuild.
- **Empty states:** Should do real work — explain what's missing and offer the next action (both apps already do this reasonably per `docs/29-ERROR-HANDLING.md`'s findings) — visually, use restrained illustration or none at all (a well-set headline + one action button) rather than generic stock-feeling empty-state art.
- **Loading states:** Prefer skeletons over spinners for content-shaped loading (tables, cards, lists) — spinners reserved for indeterminate actions (submitting a form, uploading). The current shared `LoadingBlock` (text-only) is a fine functional fallback but should be supplemented with skeleton treatments for the highest-traffic loading moments (order list, dashboard).
- **Skeletons:** Match the shape of the content they replace — a table skeleton should look like table rows, not a generic gray box.
- **Pagination:** Clear, compact, keyboard-accessible; page-number + prev/next for admin's dense lists; simpler "load more"/infinite patterns are acceptable for client-facing lists (assets, orders) where the dataset is typically small per customer.
- **Status indicators:** A single consistent visual language (small colored dot/badge + label) used identically for order status, upload status, and asset status everywhere — currently each of these has its own ad hoc rendering.

---

## 9. Admin-specific rules

Admin should feel like it belongs to the same premium brand **without becoming a marketing surface**. Concretely:

- Use `background`/`surface`/`foreground`/`border`/status tokens exactly as defined — do not soften or "premium-ify" admin with large hero moments, big display type, or decorative imagery. Admin's typographic register stays at `H1`–`label`/`metadata`, **never `display`/Instrument Serif** — this is a locked rule, not a style preference: Admin must not look like the marketing website.
- **Information density is a feature, not a compromise** — tables remain the primary UI, rows can be tighter than client-app spacing, and Geist Mono should be used deliberately for order numbers/IDs/timestamps to aid fast scanning (this is the primary place Geist Mono earns its keep in the product).
- **Electric Coral stays restrained in Admin** — used only for the single primary action per view and key active/selected states (e.g. the active nav item, a selected row/filter), never as a background fill or applied to more than one control per screen. Admin should read as *precise*, not *decorated*.
- **Search and filters** should be persistent and immediately visible on every list view (orders, catalog, organizations, users) — not hidden behind a toggle.
- **Bulk actions** (where they exist or are added) should use a consistent selection-toolbar pattern, appearing only when rows are selected, with destructive bulk actions requiring the same confirmation-dialog treatment as single destructive actions.
- **Destructive actions** (delete order, remove user, deactivate organization) always use `error` token + a confirming dialog — never a single-click destructive button, and never `primary`-colored.
- **Status clarity:** every entity with a status (order, upload, asset, user) uses the shared status-indicator pattern (§8) — this is where admin's current bespoke `admin-badge`-equivalent styling should converge with client's.
- **Role/permission clarity:** given `docs/02-ROLES-AND-PERMISSIONS.md`'s finding that `ADMIN` vs `SUPER_ADMIN` tiering is enforced but not always visually distinguished, the design system should include a clear, consistent way to indicate a viewer's own role and the tier boundary they're operating within (e.g. in the account/profile area and wherever role-gated actions are hidden vs. disabled).
- Admin retains its own component *density and layout patterns* (dense tables, persistent filter bars, operational toolbars) — it adopts the **shared token and primitive layer**, not the client app's spacious marketing-adjacent layout patterns.

---

## 10. Client-specific rules

Same token/type/color system, applied with more room to breathe:

- **Simpler:** fewer simultaneous UI elements per screen than admin; the five core client jobs (Create Order, Upload, Track Order, Review, Download) should each read as a single clear focus, not a dashboard of options.
- **More visual:** this is where the Image-First Principle (`docs/24-UI-UX.md`) should be most aggressively applied — service selection in the order wizard, the assets/deliverables view, and order tracking should all lean on real imagery once available, not text-only cards.
- **More spacious:** client-app spacing should sit toward the generous end of the spacing scale (§4) more consistently than admin.
- **Customer-focused:** copy and empty states should speak to the customer's goal ("Upload your images to start production," not "No records found").
- **Image-oriented:** thumbnails/previews should be larger and more central than the current small, uniform grid tiles in `packages/upload-gallery` and the assets page.
- **Typography:** primarily Geist, exactly as Admin — but Instrument Serif may appear **selectively** where a genuine editorial/visual moment benefits from it (e.g. a marketing-adjacent section header on `/services`, a large storytelling statement above the order wizard) — never as the default heading font for routine dashboard/order/upload UI. When in doubt, use Geist; Instrument Serif is the exception, not the default, even in Client.
- **Electric Coral:** used with restraint — primary CTAs ("Start an order," "Place order"), the selected state in the order wizard's category/service cards, and key active states — not applied broadly across the interface.
- The order wizard, upload panel, and order-detail status timeline (all confirmed KEEP-functionality in `docs/UI-REVIEW.md`) should receive **visual-only** treatment under this system — service imagery, a persistent pricing sidebar, numeric upload progress, status-color coding, Electric Coral on the primary action — without altering their underlying step logic, state management, or API calls.

---

## 11. Public Website rules

The public website (`apps/web`, currently unbuilt) is where this system can be **most expressive**:

- Full use of Instrument Serif for hero headlines, major marketing headlines, and editorial storytelling — this is the primary, intended venue for the display voice.
- Larger, asymmetric, image-driven layouts (per `docs/24-UI-UX.md`'s "avoid template-shaped hero sections" guidance) — composition should be led by real photography/before-after content, not a generic centered-headline-plus-two-buttons pattern.
- Heavier, more confident use of Electric Coral as a genuine brand color (hero moments, key CTAs) than either client or admin would use — this is the one register where the accent can carry real visual weight, while still following the "selective, not flooded" rule from §2.
- **Only real imagery** — before/afters, actual editing examples, real service previews. Per `docs/24-UI-UX.md`'s Image-First Principle: where this content doesn't exist yet, that is a content-production dependency to track (see `docs/ROADMAP.md` Phase 3), not something to fabricate with stock or synthetic "customer" photos.
- Should still share the same color/type/spacing *tokens* as client/admin underneath the more expressive layout — "editorial" is a layout/imagery/type-scale choice, not a license to invent a fourth unrelated palette.

---

## 12. `packages/ui` recommendation

**Yes — `packages/ui` should become the shared foundation, but scoped deliberately, not as "everything lives here."**

**What should be shared (belongs in `packages/ui`):**
- Design tokens themselves (color/type/spacing/radius/motion — likely as CSS custom properties + a Tailwind preset/config extension, mirroring how client's tokens are already structured today).
- Truly generic, app-agnostic primitives: `Button`, `Input`, `Select`, `Card`, `Badge`, `Dialog`, `Drawer`, `Tooltip`, `Alert`, `Tabs`, `Table` primitives, `Skeleton`, `Pagination` — the components listed in §8 that have no inherent "this is an admin thing" or "this is a client thing" quality.
- Shared iconography/logo lockup.
- `packages/upload-gallery` is a useful precedent — it's already successfully shared between client and admin today, proving the shared-package pattern works in this monorepo when scoped to something genuinely cross-cutting.

**What should remain app-specific:**
- **Admin-only:** dense operational patterns — the bulk-action toolbar, the admin sidebar navigation shell, order-production-workspace-specific layout, any component whose entire reason to exist is admin's information-density requirement.
- **Client-only:** the order wizard's step-shell, the marketing hero/CTA components (`docs/24-UI-UX.md`'s marketing components), anything driven by the Image-First spacious layout register that wouldn't make sense at admin's density.
- **Website-only (future):** large editorial layout components, once `apps/web` is built.

**Rule of thumb:** if a component's *visual identity* (color, type, radius, spacing, motion) should be identical across apps, it belongs in `packages/ui`. If its *layout/density/behavior* is inherently app-specific even after adopting shared tokens, it stays local to that app but is *built from* shared primitives (e.g. admin's `DataTable` stays in `apps/admin` but its cell/badge/button internals come from `packages/ui`).

---

## 13. Migration strategy

```
CURRENT ADMIN (apps/admin/src/components/ui.tsx + globals.css, hand-rolled, Arial, green accent)
   ↓
NEW TOKENS  ✅ DONE — packages/ui/src/tokens.css
   Locked values (Electric Coral #FF5A36, Geist/Geist Mono/Instrument Serif
   font roles) plus a first-pass proposed warm-neutral/status palette,
   radius scale, spacing scale, and motion tokens now live in packages/ui
   as plain CSS custom properties (not a Tailwind preset — see note below).
   ↓
SHARED PRIMITIVES  🔶 IN PROGRESS — packages/ui/src/{button,card,badge,alert}.tsx
   Button, Card, Badge, and Alert exist in packages/ui, styled from tokens.css
   via packages/ui/src/components.css (hand-written CSS classes, mirroring
   packages/upload-gallery's proven cross-app pattern rather than Tailwind
   utility classes, since Tailwind v4's CSS-first config in both apps doesn't
   reliably scan classes used inside a separate workspace package). Input,
   Select, Table, Dialog, Drawer, Tooltip, Tabs, and the remaining §12/§8
   primitives are not yet built — next slice of this stage.
   ↓
ADMIN COMPONENTS  ✅ DONE (partial) — apps/admin/src/components/ui.tsx
   apps/admin now depends on @repo/ui ("@repo/ui": "workspace:*"). Four of
   ui.tsx's exports are re-pointed to wrap the shared primitives, with their
   exported function signatures kept byte-identical so no page-level call
   site changed:
     - Button → wraps @repo/ui's Button 1:1 (variant/size are a lossless subset)
     - StatusBadge → wraps @repo/ui's Badge via a STATUS_BUCKET lookup table
       mapping ~22 known status/role/health values onto success/warning/
       error/info, defaulting unmapped values to neutral (previously
       unstyled — a minor, deliberate visible improvement, not a regression)
     - RoleBadge → wraps Badge status="success" (role badges were always the
       green bucket with no per-role variance)
     - ErrorBanner/SuccessBanner → wrap @repo/ui's Alert, same null-if-empty guard
   admin's globals.css now imports both @repo/ui/tokens.css AND
   @repo/ui/components.css (the latter was missed on the first pass and
   caused every Button/Badge/Alert to render completely unstyled until
   caught in browser verification — component CSS must be imported
   alongside tokens, not tokens alone), and repoints --accent/--line/
   --panel/--danger/--warning/--blue/--radius to the shared tokens
   (green → Electric Coral is the headline visible change). The Geist-
   loaded-but-never-applied body font bug is fixed (body now uses
   var(--font-sans) instead of hardcoded Arial).
   Deliberately NOT swapped: Card (a `.admin-card:not(.kpi-card)` padding
   exception made a structural JSX swap risky without seeing the full KPI
   grid CSS — only Card's underlying CSS variables were repointed, JSX
   unchanged), and PageHeader/DataTable/Modal/PermissionNotice/form fields
   (no @repo/ui equivalents exist yet). Verified live in-browser across
   dashboard, orders, categories (create/edit modal), and users pages —
   Electric Coral primary buttons, dark secondary buttons, red destructive
   buttons, colored+dotted status/role badges, and Geist body text all
   confirmed rendering correctly with zero layout regression.
   ↓
ADMIN PAGES  ⬜ NOT STARTED
   No page file was edited in this stage — every page continues importing
   Button/Card/StatusBadge/etc. from "./ui" unchanged and inherited the new
   visual system automatically. Remaining page-level work is building out
   the still-missing shared primitives (Input, Select, Table, Dialog, etc.)
   so DataTable/Modal/forms can eventually move off admin's own CSS too.

CARD / KPI-CARD REVIEW — ✅ RESOLVED, no structural swap needed
   Full review of every Card-variant CSS class (kpi-card, toolbar-card,
   support-panel, qa-queue-debug, permission-card, and their two responsive
   media-query overrides) confirms all five are pure layout/spacing
   modifiers (grid-template-columns, gap, min-height) — none of them
   redefine border, background, radius, or shadow. Those four properties
   come exclusively from the single `.admin-card` base rule, which Stage 3
   already repointed to the shared tokens (`--line`/`--panel`/`--radius`).
   Card is therefore already fully visually unified with the design system
   through the CSS-variable repoint alone — confirmed both by this CSS
   audit and by the Stage 3 browser verification (the KPI grid rendered
   correctly with the new border/background/radius). Swapping Card's JSX
   to literally render @repo/ui's `<div className="ui-card">` would only
   remove some duplicate CSS bytes at the cost of re-verifying five
   modifier classes and two media queries against a new base selector —
   not worth the risk for zero visible change. Card's `<section
   className="admin-card ...">` implementation is intentionally kept as-is
   going forward, not merely deferred.

   Unrelated finding surfaced during this review, noted but not fixed
   (out of scope for this pass): `.asset-preview` (globals.css) references
   `var(--border)`, a custom property never defined in admin's `:root`
   before or after Stage 3 (admin's border token is `--line`) — a
   pre-existing dead variable reference, not introduced by this migration.
```

**Packaging mechanism (resolves one of the previously open decisions in §12):** `packages/ui` ships as plain CSS custom properties (`tokens.css`) + hand-written component CSS (`components.css`) + React components with no build step (consumed as raw `.ts`/`.tsx`, same pattern as `packages/upload-gallery`) — not a Tailwind preset, not CSS-in-JS. This was chosen specifically because both `apps/client` and `apps/admin` use Tailwind v4's CSS-first config with no shared `tailwind.config.*`, so a shared package's Tailwind utility classes would not reliably be picked up by either app's content scanning; plain CSS avoids that problem entirely and mirrors a pattern already proven to work across both apps in this exact repo.

Each stage should be independently shippable and verifiable — tokens can be defined and reviewed with zero app changes; primitives can be built and visually reviewed in isolation before any admin page depends on them; admin's component layer can be swapped without touching page-level logic; and pages migrate incrementally rather than in one large cutover, so a partially-migrated admin app is never in a broken state.

---

## 14. What should NEVER be changed during visual migration

- **No API changes** — every endpoint documented in `docs/26-API.md` continues to work identically.
- **No database changes** — no schema/migration touches this work.
- **No route changes** — every URL in `apps/admin` (and later `apps/client`) stays exactly where it is; this is a restyle, not an information-architecture change.
- **No change to business logic, permission enforcement, or validation** — the tiered admin/super-admin logic (`docs/02-ROLES-AND-PERMISSIONS.md`), the order state machine (`docs/08-ORDERS.md`), and every KEEP-functionality item in `docs/UI-REVIEW.md` must behave identically before and after.
- **No change to loading/error/empty-state *logic*** — only their visual treatment. The underlying real-vs-fabricated data discipline documented across Pass 1–3 (`docs/29-ERROR-HANDLING.md`) must be preserved exactly.
- **No new dependencies installed** as part of this planning document — any actual package needed for the chosen display typeface, icon set, etc. is a decision for the implementation phase, not this one.

---

## 15. Example — one Admin page, before → after direction

**Page: `apps/admin/src/app/admin/orders/page.tsx` (`OrdersPage`, via `apps/admin/src/components/orders-page.tsx`)**

**Before (current, confirmed in `docs/UI-REVIEW.md`/`docs/01-ARCHITECTURE.md`):**
- Arial/Helvetica system font throughout.
- Custom `PageHeader` with an eyebrow/title/description/actions row, styled with admin's own CSS classes.
- `DataTable` with a plain bordered `table` element, `#f5f6f8` background, `#d8dde6` hairlines.
- Status shown as plain text or a locally-styled badge, colored ad hoc rather than from a shared status palette.
- Green (`#2f6f12`) primary buttons for every action — "Create," "Assign editor," "Update status" all compete visually with no hierarchy between them.
- Filters (scope/status/search) present but styled as plain inline form controls with no distinct "filter bar" visual treatment.

**After (direction, not implementation):**
- Geist (shared with client) throughout — **no Instrument Serif anywhere on this page**, consistent with Admin's locked "primarily Geist, never display type" rule; order numbers/timestamps rendered in Geist Mono per §3.
- Page header uses the shared type scale — `H1` for "Orders," `small`/`muted` for the description — no bespoke admin typography.
- Table adopts `surface`/`border` tokens (quieter hairlines, per §5), tighter row height for scanning, with a persistent filter bar (search + scope + status) visually distinguished as its own toolbar region, always visible per §9.
- Status column uses the shared status-indicator pattern (§8/§9) — a small colored dot + label, colors drawn strictly from `success`/`warning`/`error`/`info`, **never from Electric Coral**.
- Exactly one **Electric Coral** action per context (e.g. "Assign editor" as the primary action on a `PENDING` order); secondary actions (view, edit) use the `secondary`/outline button variant, so the hierarchy of "what should I do next" is visually obvious at a glance — currently absent, and restrained precisely because coral appears only once per view.
- Destructive actions (soft-delete) use `error`-colored (not coral), clearly separated buttons with a confirmation dialog per §9, never sitting visually equal to the coral primary action.
- Radius throughout uses `small`/`medium` per §4 — no pill-shaped buttons or cards, consistent with "operational, not marketing" per the brief.

**What does not change:** the `useApiList` data-fetching hook, the role-scoped visibility logic (`scope`/`status` query params, admin-vs-editor-vs-QA filtering per `docs/08-ORDERS.md`), the create/edit modal's field set and validation, and every API call this page makes — all remain byte-identical. Only the visual rendering layer changes.

---

## Locked vs. still-open decisions

**LOCKED — do not revisit without explicit new approval:**
1. Primary UI/workhorse typeface: **Geist**.
2. Monospace typeface: **Geist Mono**.
3. Display/editorial typeface: **Instrument Serif**, used selectively (public website + rare client editorial moments), never in Admin, never as the default heading font anywhere.
4. Primary brand accent color: **Electric Coral, `#FF5A36`**, used deliberately and restrained per §2's usage rules, never substituting for a status color.
5. Status colors (`success`/`warning`/`error`/`info`) are visually and semantically independent from the brand accent — this rule is locked even though the exact hues remain open (item 3 below).

**Still open — require a further decision (values below are a first-pass proposal shipped in `packages/ui/src/tokens.css` as of the Stage 1/2 implementation, reviewable/adjustable in that one file, not yet formally signed off):**
1. Exact neutral-system hex values (`background`/`surface`/`foreground`/`muted`/`border`/`secondary`) — direction (warm-ink) is set; `packages/ui/src/tokens.css` now has a concrete first-pass set (`#faf9f6` background / `#1c1917` foreground / etc.), pending review.
2. Exact status-color hues (`success`/`warning`/`error`/`info`) — direction is set; `packages/ui/src/tokens.css` now has a concrete first-pass set, pending review.
3. Light/dark mode launch sequencing — `tokens.css` currently defines light values only.
4. ~~Whether `packages/ui` is implemented as CSS custom properties + component library, or a different technical shape~~ — **resolved**: plain CSS custom properties + hand-written component CSS + build-step-free TS/TSX, per §13's packaging-mechanism note.
5. Exact numeric type scale (sizes/line-heights per level) and spacing/motion timing values — `tokens.css` has a first-pass spacing/motion scale; the type scale itself is not yet built (no components using `display`/`H1`–`H3` levels exist yet in `packages/ui`).

There is no remaining open decision on: primary accent, display typeface, workhorse typeface, or monospace typeface. These four are locked and are now encoded directly in `packages/ui/src/tokens.css`.
