# Product Workflows — Current vs Target

Each workflow below reflects only what was verified directly in code during Pass 1 and Pass 2 of this documentation effort. See the linked module doc for full detail and source references.

---

## 1. Registration
**CURRENT:** `POST /auth/register` creates a `User` (role `CLIENT`) + a new `Organization` (DEMO/TRIAL, starting free image credits) + an `OWNER` `Membership`, in one transaction, then sends a verification email.
**TARGET:** Not established beyond current.
**GAP:** None identified.

## 2. Login
**CURRENT:** Credential login (`POST /auth/login`) checks password and, if enforcement is enabled, requires `emailVerifiedAt` to be set. Issues a JWT bearer token. `apps/client` blocks staff-role logins client-side.
**TARGET:** Not established beyond current.
**GAP:** No refresh-token mechanism observed.

## 3. OAuth
**CURRENT:** Google OAuth via `GET /auth/google` → Google → `GET /auth/google/callback` → `POST /auth/oauth/exchange` (client-side completion in `apps/client/src/app/auth/callback/page.tsx`). Real, working.
**TARGET:** Not established beyond current.
**GAP:** None identified.

## 4. Email Verification
**CURRENT:** Token + expiry stored on `User`; `GET /auth/verify-email` consumes it; resend endpoints exist (authed and unauthed variants).
**TARGET:** Not established beyond current.
**GAP:** None identified.

## 5. Service Discovery
**CURRENT:** `/services` and `/pricing` (public, `apps/client`) show real category/service/addon data from `GET /categories`, `GET /services`, `GET /addons`. 7 fixed service-detail routes render via one shared template, resolving a database category by a static slug map (not guaranteed 1:1 with catalog data — unmatched routes show a real "coming soon" state).
**TARGET:** Richer marketing content (images, FAQs) — no schema/UI exists for this; not a committed plan.
**GAP:** Marketing content depth only; core discovery is functionally complete.

## 6. Pricing
**CURRENT:** Live per-image quote (`POST /pricing/quote`, authed) during order creation; static base-price display on the public `/pricing` page (no live quote pre-auth). Final billing is recalculated at order submission from actual uploaded image count + available org credits.
**TARGET:** Not established beyond current.
**GAP:** None identified for the current per-service pricing model (no subscription/tier pricing exists or is planned per available docs).

## 7. Order Creation
**CURRENT:** Multi-step wizard (category → services/quantities → addons → quote → title/instructions → place order) creates an `Order` in status `SUBMITTED` via `POST /orders`. Supports `?categoryId=` deep link from service/pricing pages.
**TARGET:** Not established beyond current.
**GAP:** None identified — this is a fully working flow.

## 8. Upload
**CURRENT:** Presigned S3-compatible PUT upload per file, real progress/retry/remove/abort, server-side existence verification (`headObject`) before marking `UPLOADED`. Client transitions order to `UPLOADED` once files are attached.
**TARGET:** Not established beyond current.
**GAP:** UX-only (no concurrency cap, no aggregate progress, no bulk retry) — not a functional gap.

## 9. Order Submission
**CURRENT:** `POST /orders/:id/submit` (client only) requires the order to be `UPLOADED` with ≥1 uploaded file, recalculates billing from actual upload count and available org credits, applies free credits, and moves the order to `PENDING`.
**TARGET:** Not established beyond current.
**GAP:** None identified.

## 10. Admin Processing (Queue Intake)
**CURRENT:** Admin views `PENDING` orders in the admin queue (`/admin/orders`), real data, no mock content.
**TARGET:** Not established beyond current.
**GAP:** None identified for viewing; see Assignment below for action.

## 11. Assignment
**CURRENT:** Admin assigns an editor (`PATCH /orders/assign-editor`, order must be `PENDING`, target user must have role `EDITOR`) → order moves to `ASSIGNED`. Admin separately assigns a QA reviewer (`PATCH /orders/assign-qa`, allowed across a wider range of pre-delivery statuses). Both trigger a transactional email and a system-authored order comment.
**TARGET:** Not established beyond current.
**GAP:** None identified.

## 12. Editing
**CURRENT:** The assigned editor moves the order `ASSIGNED → IN_PROGRESS` and, after uploading deliverables, `IN_PROGRESS → READY_FOR_QA` (blocked unless a QA reviewer is assigned and deliverable count matches source uploads). This entire step happens through the `orders`+`assets` modules directly — the dedicated `editing` module/`EditingJob` model are unused scaffolding.
**TARGET:** Not established in current codebase as a distinct per-job workflow beyond what's implemented at the order level.
**GAP:** `docs/11-EDITING-WORKFLOW.md` — the `editing` module itself is a stub; the real capability lives elsewhere.

## 13. QA
**CURRENT:** Assigned QA reviews an order in `READY_FOR_QA` and either approves (`→ DELIVERED`) or requests changes (`→ REVISION_REQUIRED`, requires title+comment, bumps `reviewRound`, flags current-round assets `isCurrent: false` with `qaNotes`). This happens through `orders`+`assets` directly — the dedicated `qa` module/`QAReview` model are unused scaffolding.
**TARGET:** Not established in current codebase as a distinct QA-review-record system beyond what's implemented at the order level.
**GAP:** `docs/12-QA.md` — the `qa` module itself is a stub; the real capability lives elsewhere.

## 14. Delivery
**CURRENT:** On `→ DELIVERED`, all current non-deleted assets are bulk-marked `status: DELIVERED`, and a delivery email fires. Client gains access to `apps/client/src/components/order-deliverables.tsx`.
**TARGET:** Not established beyond current.
**GAP:** None identified for the delivery status transition itself.

## 15. Customer Download
**CURRENT:** `GET /assets/:assetId/download-url` returns a time-limited presigned GET URL (per `STORAGE_DOWNLOAD_EXPIRY_SECONDS`), consumed by the client's deliverables view.
**TARGET:** Not established beyond current.
**GAP:** None identified.

## 16. Revision
**CURRENT:** QA-triggered (`POST /orders/request-revision` or `PATCH /orders/status` with `REVISION_REQUIRED`) — represented entirely via `Order.status`/`reviewRound` + `WorkflowEvent` + `OrderComment` (type `REVISION`). The dedicated `revisions` module/`Revision` model are unused scaffolding — there is no independently queryable revision record.
**TARGET:** Not established in current codebase as a distinct first-class revision-record system beyond what's implemented.
**GAP:** `docs/13-REVISIONS.md` — no way to query "all open revisions" as a first-class list without deriving it from order status + comments.

## 17. Payment
**CURRENT:** Billing amount is correctly calculated (see #6, #9) and shown to the client with a "payment required" / "online payment will be available soon" message. **No actual payment collection exists** — `payments` module is a stub, Stripe client is unused, `Payment`/`Invoice` models are never written to.
**TARGET:** Stripe integration and `Payment`/`Invoice` persistence are implied by existing scaffolding (client, models, queue name) but not committed to a dated plan in available docs.
**GAP:** The entire payment-collection path — checkout, webhook handling, persistence, client billing UI (`/dashboard/billing` is a stub).

## 18. Notifications
**CURRENT:** Transactional **email** is real and fires at every major order-lifecycle transition. In-app `Notification` **records are created** (via order comments) but **cannot be retrieved by any API** — `notifications.routes.ts` only exposes a health check, despite `listUserNotifications`/`markNotificationRead` being fully implemented in the service layer.
**TARGET:** Not established as a dated plan, but the completeness of the unused service functions strongly suggests in-app notifications were intended to be finished.
**GAP:** `docs/16-NOTIFICATIONS.md` — two missing route registrations plus a frontend notification UI.

---

*Async/background processing (AI preprocessing, image optimization, delivery zipping, payment webhooks, analytics rollups) does not factor into any of the workflows above as CURRENT, because `apps/workers` has no functioning consumer for any queue — see `docs/19-WORKERS-AND-JOBS.md`. The current product works end-to-end through direct, synchronous API calls only.*
