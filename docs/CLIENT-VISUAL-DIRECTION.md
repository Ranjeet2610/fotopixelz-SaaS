# Client Visual Direction v2 — Reset

**Status: Direction document. Documentation only — no code, CSS, or component was changed to produce this.** This document supersedes the visual execution of the shipped Client Dashboard and Order Detail work (both remain functionally correct and are not being reverted) and becomes the governing visual direction for all remaining Client work — Order Detail's next pass, Orders, Order Wizard, Assets, Billing, Settings, and the marketing pages. It does not authorize implementation. Read alongside `docs/REDESIGN-DIRECTION.md` (principles, scope, color-system rules this document operates inside of), `docs/CLIENT-UI-REDESIGN.md` (route inventory/priority, unaffected by this reset), `docs/DESIGN-SYSTEM.md` and `docs/24-UI-UX.md` (the original creative brief this document is honestly reckoning with — see §1).

---

## 0. Why this reset happened

Direct feedback, verified against the live app, not a hypothetical: the shipped dashboard reads as **empty, generic, dashboard-template-like, weak in hierarchy, weak in imagery, weak in brand personality, and not premium** — a fair assessment, and this section explains precisely why, so the new direction fixes causes, not symptoms.

### 0.1 The dark theme in the screenshot isn't a designed dark theme — it's an accident
`apps/client/src/app/globals.css` never applies a `.dark` class anywhere in the app. What's rendering in every screenshot taken so far is `@media (prefers-color-scheme: dark)` — the browser's OS-level preference falling through to shadcn's **unmodified default dark palette** (`oklch(0.145 0 0)` background, pure grayscale foreground). This is the single biggest reason the product "feels like a generic SaaS template": **it is, literally, rendering template defaults that were never art-directed.** No one designed that black. It's not a considered premium-dark canvas — it's a framework fallback nobody overrode. This is fixable by *committing* to a deliberate primary canvas (§4), not by tweaking the current one.

### 0.2 The "locked" editorial typography contrast was never implemented
Both `docs/DESIGN-SYSTEM.md` and `docs/24-UI-UX.md` establish Instrument Serif as the mechanism that creates "premium/editorial" contrast against Geist's "precision/product" register — this is called out as *the* thing that stops the product looking like "default shadcn headings applied everywhere." Checked directly: `apps/client/src/app/layout.tsx` loads only `Geist` and `Geist_Mono`. **Instrument Serif was never loaded, never used, anywhere in the shipped work.** Every heading on the dashboard — "Welcome back, ralph," "Production Overview" — is Geist at a slightly larger size. This is exactly the failure mode both prior documents predicted and named in advance. The typographic contrast that was supposed to carry the entire "editorial, not generic" identity simply isn't there yet.

### 0.3 The image-first strategy has no answer for "no image yet"
The dashboard's hero card, when an order has no uploads yet, falls back to a diagonal-hatch gray placeholder occupying the same large frame a real photo would fill — and the layout has no other content to put there instead. The result, visible in the actual screenshot: a large dark rectangle with faint diagonal lines, next to an empty void where the "up next" column would be once a second order exists. **This is the structural root cause of "too empty."** A photo-editing platform's dashboard cannot rely on real photography to carry every layout — most accounts, most of the time, will have zero or few real images loaded at any given moment (new accounts, orders still in the upload step, orders between stages). The current design treats this as an edge case to placeholder over; it needs to be treated as the *common* case and designed for directly (§6).

### 0.4 The layout is a template shape wearing brand colors
Top nav → stat numbers → one card → a table. This is the same shape as every analytics/CRM/admin dashboard ever shipped — swapping the accent color from blue to green doesn't change that. Nothing about the composition itself signals "image production." There is no asymmetry, no typographic scale event, no structural motif drawn from what this product actually does (photography, proofing, production). Two small buttons carry the entire brand-color presence on the page. This is a component-by-component "polish" problem masquerading as a composition problem — more padding and a nicer green will not fix it, which is why this reset addresses composition first (§9), tokens second.

### 0.5 What is NOT the problem, and stays
The underlying data/status discipline (real order data, honest empty states, no fabricated imagery), the real-thumbnail infrastructure (`packages/upload-gallery`, `Thumbnail`), the shared `StatusChip`/status-color system, and every functional behavior of the pages built so far are correct and are not being redone. This is a visual-language reset, not a rebuild of what already works structurally.

---

## 1. Relationship to the prior creative brief

`docs/24-UI-UX.md` and `docs/DESIGN-SYSTEM.md` already correctly diagnosed almost everything wrong here — in advance, before any code was written. Re-reading them now: their locked decisions (Geist + Geist Mono + Instrument Serif, one restrained brand accent, restraint over decoration, image-as-hero) are **not wrong and are not being replaced.** What went wrong is narrower and more specific than "wrong direction": the *composition* defaulted to a conventional dashboard template shape, and the *typographic contrast mechanism* the brief specifically called for was never actually built. This document does not invent a new philosophy — it holds the existing brief to its own stated bar and gets specific about the composition and imagery-absence problem that the prior documents named but didn't fully solve.

The brand-color and status-color decisions in `docs/REDESIGN-DIRECTION.md` §7.1 (deep original green, not coral; brand-green vs. status-green kept perceptually distinct) are **unaffected by this reset** — this document is about composition, typography, imagery strategy, and canvas, not a color re-litigation.

---

## 2. Benchmark discipline, restated

**Pixelz** — quality/category benchmark only. Never copy its layout, components, or branding.
**Aurelix-level craft** — a *bar for ambition and intentionality*, not a style. Nothing in this document references Aurelix's actual palette, type, or layout. The lesson taken from that reference point is procedural, not visual: every screen should look like someone made deliberate choices about *this specific product*, not that a template was filled in. That is the test every section below is trying to pass.

**Explicitly ruled out**, per the instruction that produced this document: gradients, glassmorphism, another shade of the same generic-dashboard shape, or a literal Pixelz clone. Nothing below uses any of these.

---

## 3. Brand personality statement

Fotopixelz is **production infrastructure for people whose business is images** — global e-commerce brands, retailers, agencies, studios. The personality is: **a working studio, not a startup dashboard.** Think of the visual register of a professional print/photo studio's job-ticket system crossed with an editorial magazine's production office — precise, materials-aware, unmistakably about *images as a craft*, confident enough to use real negative space instead of filling every inch, and never cute, playful, or "friendly SaaS." It should feel like it was designed by people who understand photography production, not by people who understand dashboards and happened to add a camera icon.

---

## 4. The canvas — one deliberate primary theme, not an OS accident

**Decision: Client commits to one deliberate, designed dark studio canvas as its primary and only shipped theme for now** — not a `prefers-color-scheme` fallback, not shadcn defaults. Rationale: a dark canvas is a legitimate, common choice for professional creative-production tools specifically because it makes imagery — the actual product — read with more contrast and presence than a white canvas would; but it only earns that if it's actually designed, which today it isn't (§0.1).

- **Background:** a warm, near-black *studio* tone — not pure black, not the current cold `oklch(0.145 0 0)` grayscale. Think exposed film/darkroom warmth: a very low-lightness charcoal with a faint warm bias (a specific value is an implementation-time decision, not frozen here — direction is "warm charcoal," explicitly not neutral-gray-black).
- **Texture, not gradient:** where the canvas needs richness (large empty regions, section backgrounds), use a **very subtle grain/noise texture** — the kind a scanned print or film stock has — rather than a gradient or glow. This is structural texture appropriate to a photography product, not decoration; it must stay nearly imperceptible (a "you can't quite tell it's there, but flat black would feel emptier without it" effect), never a visible vignette or spotlight effect.
- **Elevated surfaces:** panels/cards step up in lightness only slightly from the base canvas, with the separation coming primarily from a **hairline rule + generous spacing**, not a heavy card border (this continues, not replaces, `docs/DESIGN-SYSTEM.md` §5's existing "prefer spacing/surface-shift over borders" rule).
- **Light mode:** deferred, not abandoned — build the dark studio canvas properly first (§13 explicitly lists this as open), rather than half-designing two themes at once and shipping neither well.

---

## 5. Typography hierarchy — actually build the contrast that was already decided

This is the highest-leverage fix in this document. Per the already-locked decision in `docs/DESIGN-SYSTEM.md` §3, implement it for real:

| Level | Typeface | Where |
|---|---|---|
| **Display** | **Instrument Serif**, large, at real display scale (think: a magazine masthead, not a slightly-bigger heading) | The one or two genuine editorial moments per page — the dashboard's greeting/masthead line, an order's title on Order Detail, a hero statement on marketing pages. Not routine. |
| **H1–H3** | Geist, bold/semibold/medium | Section titles, page structure — precision register. |
| **Body** | Geist, regular | All reading text. |
| **Metadata** | **Geist Mono** | Order numbers, dates, image counts, prices, IDs — this needs to appear far more than it currently does; the current implementation under-uses mono almost entirely. Mono metadata is the "spec sheet" texture that makes the product feel precise/professional (§6). |

**The discipline that was missing:** every screen needs at least one real Instrument Serif moment sized with actual confidence (large enough that it reads as a considered typographic event, not a bigger label) — and everywhere else stays strictly Geist/Geist Mono. This binary, applied consistently, is what "editorial but not decorative" actually looks like in practice; a page with zero display-type moments (the current dashboard) reads as flat for exactly this reason.

---

## 6. Imagery strategy — solve the "no photo yet" problem directly

This is the second highest-leverage fix. The current placeholder-rectangle approach is retired as the default. New approach, in priority order:

1. **Real image, when it exists** — unchanged: the existing `Thumbnail`/`packages/upload-gallery` infrastructure is correct and stays exactly as-is.
2. **When no real image exists yet, the frame becomes a "production ticket," not a gray box.** Borrow structural motifs from actual photography/print production — a contact-sheet or job-ticket layout: corner registration marks (small crop-mark ticks at the frame corners — a functional print-production convention, not decoration), a mono-set spec block (order number, expected image count, category, due date) filling the space with real typographic weight instead of empty gray, and the order's title set in Instrument Serif inside that frame. The frame is never empty — it's filled with real data, typeset with intention, when there's no photo to fill it with instead.
3. **Never fabricate imagery.** This rule from `docs/REDESIGN-DIRECTION.md` §4.1/§9.1 is unchanged and non-negotiable — the ticket/spec-sheet treatment in (2) is the honest alternative to a fabricated photo, not a loophole around the no-fabrication rule.
4. **Filmstrip motif for multi-image moments** (ready-to-download, in-production groupings): a horizontal strip with a subtle sprocket/frame-edge treatment at top and bottom — again a structural photography motif, applied thin and quiet, not a heavy illustrated border.

---

## 7. Color system — refinement, not re-litigation

Unchanged from `docs/REDESIGN-DIRECTION.md` §7.1: the Fotopixelz-original deep green stays the single brand accent, kept perceptually distinct from status-success, reserved for primary actions/active states/brand moments. What changes under this reset is **presence and placement, not hue**:

- The brand green currently only appears on two small buttons and a thin nav underline — nearly invisible on the actual screenshot. Under this direction it should also appear as: the single accent rule/tick on the display-type masthead moment (§5), the active step in production trackers, and one deliberate accent element per major section — still restrained (never a background fill, never more than the "one thing per screen" rule already locked in `docs/DESIGN-SYSTEM.md` §2), but with enough real estate to actually register as a brand color rather than a UI-state color.
- Status colors (success/warning/error/info) stay exactly as already defined — this reset does not touch them.
- The canvas warmth (§4) and the mono-metadata texture (§5) do more work to feel "designed" than the accent color ever will on its own — color is not being asked to solve the emptiness problem by itself.

---

## 8. Card philosophy, borders, radius, shadows

- **Cards are not the default wrapper.** Per `docs/DESIGN-SYSTEM.md` §8, use a literal bordered card only for genuinely card-shaped content (a single order's ticket, a service). Sections that are just "a group of related content" (the account/credit strip, a status summary) should be plain sectioned layout — typography and spacing doing the separation, not a rectangle around everything, which is the exact "assembled from generic components" tell the feedback named.
- **Borders:** thin hairlines only, reserved for genuine structure (table rows, the production-ticket frame's registration marks) — not a border around every panel.
- **Radius:** mostly flat, small-to-medium per `docs/DESIGN-SYSTEM.md` §4 — this was already reasonably restrained in the shipped work and isn't the problem; keep it.
- **Shadows:** none on static content, per the already-locked rule — reserved for genuine floating elevation only (menus, dialogs).

---

## 9. Dashboard composition — the concrete fix for "too empty"

The governing question stays exactly as already established: **"What is happening with my image production?"** — but the composition changes structurally, not just cosmetically:

1. **Masthead band** — the greeting/workspace-name moment becomes a real Instrument Serif display line (§5) paired with the account/credit strip reset as a **mono spec block** (think: a printed job-sheet header — "CREDITS 10/10 · TRIAL 15 DAYS · RALPH STUDIO"), not three disconnected numeral clusters floating in a corner.
2. **Current production ticket** — the hero order becomes the production-ticket treatment from §6 (real thumbnail when available; spec-sheet/registration-mark frame with mono metadata + serif title when not) — this fills the frame with real content either way, eliminating the "big empty gray box" failure mode directly.
3. **The right-hand column is never empty.** Today's "up next" column goes fully blank the instant there's fewer than 2 additional active orders (exactly what's visible in the screenshot). Replace it with a **production log** — a compact, real vertical record of what's happened on the account (order created, submitted, status changes) using mono timestamps — so this column always has genuine content to show, scaling from "one line" to "a full log," never a void.
4. **Filmstrip / proof-strip sections** (in-production, ready-to-download) adopt the frame-edge motif from §6 item 4, and — per the already-correct existing rule — simply don't render when empty, rather than showing an empty grid.
5. **Order log** at the bottom becomes a real ledger/manifest treatment — monospace numeric alignment, quieter than the sections above it, but with enough typographic care (not just small gray text) that it reads as "a considered record," not an afterthought table.

This composition is asymmetric and content-driven (masthead → ticket+log → filmstrip → ledger) rather than the current symmetric stat-row → card → table template shape — the structural fix the feedback is actually asking for, not a restyle of the same skeleton.

---

## 10. Order / project visual treatment

Every place an order is represented (dashboard ticket, Orders list, Order Detail header) uses the **same production-ticket visual language**: mono order number, serif or bold-Geist title (serif only for the single largest/most prominent instance per page, per §5's discipline), real or spec-sheet-frame imagery, and status via `StatusChip` (unchanged component, still correct). This is the "strong visual treatment of orders/projects" the brief asked for — one consistent, distinctive shape used everywhere an order appears, rather than a table row in one place and a plain card in another.

---

## 11. Status treatment

Unchanged mechanism (`StatusChip`, shared success/warning/error/info palette) — what changes is *prominence*: status should sit inside the production-ticket frame with real typographic weight (not a tiny pill easy to miss, as in the current screenshot's top-right corner placement), and production-stage trackers (upload flow, order timeline) keep their existing real-data logic with the brand-green active-state treatment already implemented, just set inside the new canvas/type system.

---

## 12. Buttons / CTAs, empty states, loading states, responsive behavior

- **Buttons/CTAs:** unchanged mechanism (one restrained brand-green primary action per context, secondary/outline for everything else) — no new variant system needed; this part of the prior work is not the problem.
- **Empty states:** keep the existing honest, section-omitted-when-empty discipline — but the *remaining* content (§9.3's production log, §6's ticket frame) means fewer screens hit a true "nothing to show" state in the first place, since spec/log content is real even when imagery isn't.
- **Loading states:** skeletons shaped like the new ticket/log/filmstrip content, not generic gray boxes — same principle as before, applied to the new shapes.
- **Responsive behavior:** the masthead/ticket/log/filmstrip/ledger structure collapses to a single vertical column on mobile, in that same order — the production-ticket frame's registration-mark/spec treatment must survive at mobile width (this is a real design constraint to solve at implementation time, not deferred), since mobile is explicitly not a reduced-effort target per `docs/REDESIGN-DIRECTION.md`.

---

## 13. Explicitly open — not yet decided

- Exact canvas hex/oklch values for the warm-charcoal dark theme (§4) and the grain-texture implementation technique.
- Exact Instrument Serif display-scale sizes and where precisely each page's one-or-two display moments land.
- Exact visual spec for the production-ticket corner registration marks and filmstrip frame-edge motif (§6) — described here as a motif and discipline, not pixel-specified.
- Light mode — deferred per §4, not designed in this pass.
- Whether the production-ticket treatment extends into Admin at all — this document is Client-only; Admin's "instrument panel" register (`docs/REDESIGN-DIRECTION.md` §4.3) may or may not want the same motif language, and that decision is out of scope here.

---

## 14. What this document does not change

No API, database, Prisma, authentication, RBAC, or business-logic change is implied or authorized by this document. No component's data flow, state, or API calls change — this is presentation-only, same as every redesign document before it. Admin is untouched. This document does not implement anything; it sets direction for the next implementation pass, which requires separate authorization to begin.
