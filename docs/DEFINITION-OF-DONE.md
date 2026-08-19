# Definition of Done

A module is **not** COMPLETE merely because a route, page, or database model exists — this is the same rule stated in `docs/README.md`'s Documentation Terminology, applied here as an engineering completion checklist.

## The full checklist

A module should satisfy every applicable category below before being called COMPLETE:

1. **UI** — the interface exists and is reachable by a real user flow (not just a route that renders in isolation).
2. **UX** — the next action is obvious, states are legible, and the flow matches how the rest of the product behaves (see `docs/24-UI-UX.md` for the target visual/interaction bar).
3. **API** — real endpoints exist beyond a health check, with actual request/response handling (not a placeholder returning `{ status: 'placeholder' }` — the pattern found in `payments`, `qa`, `editing`, `revisions`, `analytics`, `ai` per `docs/26-API.md`).
4. **Database** — the model(s) involved are actually read from and written to by the code path in question (not defined-but-unused schema — the pattern found in `EditingJob`, `QAReview`, `Revision`, `Payment`, `Invoice`, `AiJob` per `docs/27-DATABASE.md`).
5. **Business logic** — the rules that make the feature correct (not just present) are enforced server-side — e.g. the order state-machine transition guards in `docs/08-ORDERS.md`, not merely a status field that can be set to anything.
6. **Permissions** — role/ownership checks are enforced server-side, not only hidden in the frontend (`docs/02-ROLES-AND-PERMISSIONS.md`: backend enforcement is authoritative, frontend checks are UX-only).
7. **Validation** — input is validated server-side (Zod schemas, per the consistent pattern across modules) and client-side error messaging reflects it usefully (not discarded in favor of a generic message, per the gap noted in `docs/29-ERROR-HANDLING.md`).
8. **Error handling** — failure states are handled explicitly (typed `AppError`s with real messages), not left to the generic 500 fallback.
9. **Loading states** — every async data fetch has a real loading state, not a flash of empty/broken UI.
10. **Responsive behavior** — the feature works at mobile/tablet/desktop breakpoints, not desktop-only.
11. **Integration** — the piece actually connects to the rest of the system it depends on (e.g. a payment "Amount due" display is not integration-complete if nothing can actually collect that payment).
12. **Testing** — automated coverage exists for the business-critical logic (currently **zero modules in the entire codebase meet this bar** — see `docs/30-TESTING.md`; this is a known, accepted gap being tracked, not silently ignored).
13. **Documentation** — the module's current behavior is reflected in `docs/` (this documentation set exists specifically to satisfy this criterion going forward).

## Exceptions — not every module needs every category

- **Backend-only modules** (e.g. `workflow`, `order-comments`'s API surface) don't need a dedicated "UI/UX/Responsive" line item beyond the frontend that consumes them.
- **Admin-only operational modules** may reasonably deprioritize "premium visual" bar relative to client-facing modules (per `docs/24-UI-UX.md`: admin should be "visually consistent," not "marketing-website visual"), but still need real UX clarity.
- **Modules explicitly scoped as backend infrastructure** (e.g. `apps/workers`'s eventual real consumers) don't need a UI category at all.
- **Testing** is currently failed by 100% of modules — this exception is temporary and tracked, not a permanent carve-out. Do not use "nothing else has tests either" as a reason to skip testing new work; use it as a reason to prioritize Phase 6 in `docs/ROADMAP.md`.

## How this applies to current module statuses

Using this checklist against `docs/MODULE-MATRIX.md`:
- **Orders, Uploads, Assets, Catalog, Pricing, Auth, Organizations, Admin** — satisfy categories 1–11 (UI through Integration) genuinely; fail category 12 (Testing) like everything else; category 13 is now satisfied by this documentation set.
- **Notifications** — fails category 3 (API: routes not wired) despite categories 4–8 (database, business logic, validation, error handling) being real at the service-layer.
- **Payments, QA, Editing, Revisions, Analytics, AI** — fail categories 3 and 4 outright (no real API, no real database usage); QA/Editing/Revisions' *capability* is separately satisfied through the `orders` module, which should be understood as the actual COMPLETE implementation of that capability, distinct from the empty dedicated module.
- **Workers** — fails category 3/4/11 entirely; no real integration exists.

Use this document, not a route/page's mere existence, when deciding whether to report a module as COMPLETE in any future status update.
