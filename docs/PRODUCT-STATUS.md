# Product Status

Snapshot as of the completion of Pass 4 documentation (this document should be treated as a living summary — regenerate/update it after significant work per `docs/README.md`'s Claude development workflow, step 11). Statuses use: COMPLETE / PARTIAL / STUB / BROKEN / NOT IMPLEMENTED, per `docs/DEFINITION-OF-DONE.md`.

## Overall product maturity
The core commerce/production workflow (browse catalog → price → order → upload → assign → edit → QA → deliver → download) is **genuinely COMPLETE end-to-end** and functionally sophisticated. What surrounds that core — payments, async processing, the public marketing site, and test coverage — is largely STUB or NOT IMPLEMENTED. The product is best described as: **a real, working operational engine with no payment collection, no public storefront, no async scaling layer, and no safety net.**

## Component status

**Admin:** COMPLETE (functionality) — real CRUD, tiered RBAC, correct data flow across orders/catalog/organizations/users. Visual design is functionally fine but disconnected from the rest of the product (own design system) — see `docs/UI-REVIEW.md`.

**Client:** PARTIAL — auth, dashboard, marketing pages (`/services`, `/pricing`), order wizard, uploads, order detail, and assets are all COMPLETE. Billing and settings pages are STUB (no API connection).

**Website (`apps/web`):** NOT IMPLEMENTED — single placeholder paragraph, not deployed.

**API:** PARTIAL overall — 13+ modules are COMPLETE (auth, users backend, organizations, categories, services, addons, pricing, orders, uploads, assets, admin, workflow, order-comments); 7 modules are STUB (payments, qa, editing, revisions, notifications-routes, analytics, ai) — see `docs/26-API.md`.

**Database:** PARTIAL — 17 of 23 models are actively used; 6 are dead schema (`EditingJob`, `AiJob`, `QAReview`, `Revision`, `Payment`, `Invoice`) — see `docs/27-DATABASE.md`.

**Uploads:** COMPLETE — real presigned S3 flow, server-verified, retry/abort/remove all working.

**Orders:** COMPLETE — the most mature module in the codebase; full state machine, role-scoped transitions, workflow event logging, transactional email.

**Payments:** STUB — billing amount is correctly calculated, but no collection mechanism exists at all (no Stripe checkout, no webhook handling, `Payment`/`Invoice` models unused).

**Editing:** STUB as a dedicated module; the *capability* is COMPLETE, implemented inside `orders`/`assets` rather than the dedicated `editing` module.

**QA:** STUB as a dedicated module; the *capability* is COMPLETE, implemented inside `orders`/`assets`.

**AI:** NOT IMPLEMENTED — no AI provider integration exists anywhere in the runtime path, despite scaffolding (model, module, queue name, two worker processor files).

**Workers:** STUB — every processor/job file is a placeholder object; the process entry point never starts a real BullMQ consumer. Producers exist for 3 of 10 registered queue names; none are consumed.

**Testing:** NOT IMPLEMENTED — zero automated tests of any kind (unit, integration, E2E) exist anywhere in the repository, confirmed by direct search.

**Security:** PARTIAL — strong in specific areas (PKCE+signed-state OAuth, bcrypt hashing, hashed password-reset tokens, presigned-URL verification), with confirmed gaps (open CORS, no refresh-token/session revocation, unhashed email-verification tokens, raw error-message leakage on uncaught exceptions, rate limiting scoped to auth only).

**UI/UX:** PARTIAL — functionally strong across every COMPLETE module (consistent loading/error/empty states, real form validation), but visually generic. An incremental token-migration attempt (Admin Stage 1–3, `packages/ui`) was completed then **stopped by decision** as insufficiently ambitious. Strategy has moved to a **ground-up UI/UX redesign** benchmarked on quality against premium image-editing platforms (not copying their branding/layout) — not yet implemented. See `docs/24-UI-UX.md` and `docs/ROADMAP.md` Phase 1 for the current status; the underlying functional foundation (API, DB, auth, RBAC, business logic) is explicitly unaffected and must be preserved through the redesign.

## One-line summary per instructions

- Admin: COMPLETE (functionality) / visual REDESIGN pending
- Client: PARTIAL
- Website: NOT IMPLEMENTED
- API: PARTIAL
- Database: PARTIAL
- Uploads: COMPLETE
- Orders: COMPLETE
- Payments: STUB
- Editing: STUB (module) / COMPLETE (capability, elsewhere)
- QA: STUB (module) / COMPLETE (capability, elsewhere)
- AI: NOT IMPLEMENTED
- Workers: STUB
- Testing: NOT IMPLEMENTED
- Security: PARTIAL
- UI/UX: PARTIAL
