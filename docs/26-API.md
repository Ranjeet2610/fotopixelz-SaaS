# API Inventory

Base path for all routes: `/api/v1` (mounted in `services/api/src/app.ts`). This is a route-level inventory built directly from each module's `*.routes.ts`. Endpoint-body/response shapes are summarized from the corresponding `.types.ts`/`.service.ts` where confirmed in Pass 2; full request/response schemas are not exhaustively reproduced here — see the module's `.validator.ts`/`.types.ts` for exact shapes.

Global middleware (from `app.ts`): `cors()` (no origin restriction configured), `helmet()`, `morgan('dev')` logging, `express.json()`. `errorHandler` is the final middleware.

---

## AUTH — `/api/v1/auth` (module doc: `docs/03-AUTHENTICATION.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Module health check | None | — | — | — | Health only |
| GET | `/google` | Start Google OAuth (PKCE) | None | — | — | `startGoogleOAuth` (client) | COMPLETE |
| GET | `/google/callback` | OAuth provider redirect target | None | — | `User`, `Organization`, `Membership` | Browser redirect | COMPLETE |
| POST | `/oauth/exchange` | Exchange OAuth code for session | None (rate-limited) | — | `User` | `apps/client/src/app/auth/callback/page.tsx` | COMPLETE |
| GET | `/verify-email` | Consume email verification token | None (rate-limited) | — | `User` | Email link | COMPLETE |
| POST | `/register` | Create client user + org | None (rate-limited) | — | `User`, `Organization`, `Membership` | `apps/client` register page | COMPLETE |
| POST | `/login` | Credential login | None (rate-limited) | — | `User` | `apps/client`/`apps/admin` login pages | COMPLETE |
| POST | `/forgot-password` | Issue reset token + email | None (rate-limited) | — | `User` | Login/forgot-password pages | COMPLETE |
| POST | `/reset-password` | Consume reset token | None (rate-limited) | — | `User` | Reset-password page | COMPLETE |
| POST | `/resend-verification` | Resend verification (self) | Auth required | Any | `User` | Not confirmed in UI this pass | COMPLETE (backend) |
| POST | `/resend-verification-email` | Resend verification (by email) | None (rate-limited) | — | `User` | Not confirmed in UI this pass | COMPLETE (backend) |
| GET | `/me` | Current session user | Auth required | Any | `User` | `auth-provider.tsx` | COMPLETE |
| POST | `/logout` | End session | Auth required | Any | — | `auth-provider.tsx` | COMPLETE (stateless JWT — see `docs/28-SECURITY.md`) |

---

## USERS — `/api/v1/users` (module doc: `docs/04-USERS.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| GET | `/me` | Own profile | Auth required | Any | `User` | Not confirmed in `apps/client` UI this pass | PARTIAL (backend real, frontend unconfirmed) |
| PATCH | `/me` | Update own profile | Auth required | Any | `User` | Not confirmed | PARTIAL |
| GET | `/me/billing` | Own billing profile | Auth required | Any | `UserBillingProfile` | Not confirmed (`/dashboard/billing` is a stub) | PARTIAL |
| PATCH | `/me/billing` | Update billing profile | Auth required | Any | `UserBillingProfile` | Not confirmed | PARTIAL |
| GET | `/me/credits` | Org image-credit balance | Auth required | Any | `Organization` | Not confirmed as a dedicated screen (credits shown via `organization-provider.tsx`'s own org fetch, not necessarily this endpoint) | PARTIAL |

---

## ORGANIZATIONS — `/api/v1/organizations` (module doc: `docs/05-ORGANIZATIONS.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| GET | `/` | List organizations | Auth required | Client: own orgs; Admin: all | `Organization` | `organization-provider.tsx`, `organizations-page.tsx` (admin) | COMPLETE |
| POST | `/` | Create organization | Auth required | Not fully traced (see `docs/05-ORGANIZATIONS.md` gap) | `Organization` | Not confirmed as a client-facing action (registration uses a separate bootstrap path) | PARTIAL |
| GET | `/:organizationId` | Get organization | Auth required | Membership or admin | `Organization` | Client/admin org views | COMPLETE |
| PATCH | `/:organizationId` | Update organization | Auth required | Membership (role-scoped) or admin | `Organization` | Admin org edit | COMPLETE |
| DELETE | `/:organizationId` | Delete organization | Auth required | Likely admin-only (not individually re-verified) | `Organization` | Admin | COMPLETE (backend) |
| GET | `/:organizationId/memberships` | List memberships | Auth required | Membership or admin | `Membership` | Not confirmed as dedicated client UI | PARTIAL (no confirmed client "team" UI) |
| POST | `/:organizationId/memberships` | Add member | Auth required | Membership (role-scoped) or admin | `Membership` | Not confirmed | PARTIAL |
| PATCH | `/:organizationId/memberships/:membershipId` | Update member role | Auth required | Membership (role-scoped) or admin | `Membership` | Not confirmed | PARTIAL |
| DELETE | `/:organizationId/memberships/:membershipId` | Remove member | Auth required | Membership (role-scoped) or admin | `Membership` | Not confirmed | PARTIAL |

---

## CATEGORIES — `/api/v1/categories` (module doc: `docs/06-CATALOG-AND-SERVICES.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| GET | `/` | List categories | **None (public)** | — | `ServiceCategory` | Order wizard, `/services`, `/pricing` | COMPLETE |
| GET | `/:id` | Get category | **None (public)** | — | `ServiceCategory` | Not directly used by traced client code (client fetches full list and filters) | COMPLETE (backend) |
| POST | `/` | Create category | Auth required | Admin | `ServiceCategory` | `apps/admin` catalog page | COMPLETE |
| PATCH | `/:id` | Update category | Auth required | Admin | `ServiceCategory` | `apps/admin` catalog page | COMPLETE |
| DELETE | `/:id` | Delete category | Auth required | Admin | `ServiceCategory` | `apps/admin` catalog page | COMPLETE |

---

## SERVICES — `/api/v1/services`

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| GET | `/` | List services (filters: categoryId, organizationId, scope, q; excludes inactive by default) | **None (public)** | — | `Service` | Order wizard, `/services`, `/pricing` | COMPLETE |
| GET | `/:id` | Get service | **None (public)** | — | `Service` | Not directly traced as used | COMPLETE (backend) |
| POST | `/` | Create service | Auth required | Admin | `Service` | `apps/admin` catalog page | COMPLETE |
| PATCH | `/:id` | Update service | Auth required | Admin | `Service` | `apps/admin` catalog page | COMPLETE |
| DELETE | `/:id` | Delete service | Auth required | Admin | `Service` | `apps/admin` catalog page | COMPLETE |

---

## ADDONS — `/api/v1/addons`

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| GET | `/` | List addons | **None (public)** | — | `Addon` | Order wizard, `/pricing` | COMPLETE |
| GET | `/:id` | Get addon | **None (public)** | — | `Addon` | Not directly traced | COMPLETE (backend) |
| POST | `/` | Create addon | Auth required | Admin | `Addon` | `apps/admin` catalog page | COMPLETE |
| PATCH | `/:id` | Update addon | Auth required | Admin | `Addon` | `apps/admin` catalog page | COMPLETE |
| DELETE | `/:id` | Delete addon | Auth required | Admin | `Addon` | `apps/admin` catalog page | COMPLETE |

---

## PRICING — `/api/v1/pricing` (module doc: `docs/07-PRICING.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| POST | `/quote` | Compute a live quote from services/quantities/addons | Auth required | Any authenticated (org context required) | Reads `Service`, `Addon` | Order wizard step 4 | COMPLETE |

---

## ORDERS — `/api/v1/orders` (module doc: `docs/08-ORDERS.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| POST | `/` | Create order | Auth required | CLIENT, ADMIN, SUPER_ADMIN | `Order`, `OrderItem`, `OrderAddon` | Order wizard | COMPLETE |
| GET | `/` | List orders (role-scoped) | Auth required | Any (results scoped per role — see `docs/08-ORDERS.md`) | `Order` | Client/admin/editor/QA order lists | COMPLETE |
| PATCH | `/status` | Update order status | Auth required | Role-and-assignment-scoped (see state machine) | `Order`, `Asset`, `WorkflowEvent`, `OrderComment` | Admin/editor/QA order detail actions | COMPLETE |
| PATCH | `/assign-editor` | Assign editor | Auth required | Admin | `Order`, `WorkflowEvent`, `OrderComment` | Admin order detail | COMPLETE |
| PATCH | `/assign-qa` | Assign QA reviewer | Auth required | Admin | `Order`, `WorkflowEvent`, `OrderComment` | Admin order detail | COMPLETE |
| POST | `/request-revision` | QA requests revision | Auth required | QA (assigned reviewer only) | `Order`, `Asset`, `WorkflowEvent`, `OrderComment` | QA review panel | COMPLETE |
| POST | `/:id/submit` | Client submits uploaded order | Auth required | CLIENT (owner only) | `Order`, `Organization` (credits) | `order-upload-panel.tsx` | COMPLETE |
| GET | `/:id` | Get order | Auth required | Role-scoped view access | `Order` + relations | Order detail pages (client/admin) | COMPLETE |
| PATCH | `/:id` | Update order (title/instructions/pricing lines pre-upload) | Auth required | CLIENT (owner, pre-upload only) or admin | `Order`, `OrderItem`, `OrderAddon` | Order edit flows | COMPLETE |
| DELETE | `/:id` | Soft-delete order | Auth required | Admin | `Order` (isDeleted) | Admin | COMPLETE |

---

## UPLOADS — `/api/v1/uploads` (module doc: `docs/09-UPLOADS.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| POST | `/batch` | Create multiple upload records | Auth required | Org member | `Upload` | Not directly traced (single-file presigned flow is the confirmed client path) | COMPLETE (backend) |
| POST | `/zip` | Create a zip-sourced upload record | Auth required | Org member | `Upload` | Not directly traced | COMPLETE (backend) |
| POST | `/presigned-url` | Get presigned PUT URL + create `PENDING` upload | Auth required | Org member | `Upload` | `order-upload-panel.tsx` | COMPLETE |
| POST | `/complete` | Verify object exists, mark `UPLOADED`/`FAILED` | Auth required | Org member | `Upload` | `order-upload-panel.tsx` | COMPLETE |
| POST | `/` | Direct upload record creation | Auth required | Org member | `Upload` | Not the confirmed client path (presigned flow is) | COMPLETE (backend) |
| GET | `/` | List uploads | Auth required | Org-scoped | `Upload` | Not directly traced | COMPLETE (backend) |
| GET | `/order/:orderId` | List uploads for an order | Auth required | Order access-scoped | `Upload` | `order-upload-panel.tsx` (initial load) | COMPLETE |
| GET | `/:id/preview-url` | Get presigned preview GET URL | Auth required | Access-scoped | `Upload` | `packages/upload-gallery` lazy preview | COMPLETE |
| GET | `/:id` | Get upload | Auth required | Access-scoped | `Upload` | Not directly traced | COMPLETE (backend) |
| DELETE | `/:id` | Delete upload (+ storage object) | Auth required | Access-scoped | `Upload` | `order-upload-panel.tsx` remove action | COMPLETE |

---

## ASSETS — `/api/v1/assets` (module doc: `docs/10-ASSETS.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| POST | `/presigned-url` | Get presigned deliverable PUT URL | Auth required | Editor/Admin | `Asset` | Admin deliverable upload panel | COMPLETE |
| POST | `/complete` | Verify + finalize deliverable upload | Auth required | Editor/Admin | `Asset` | Admin deliverable upload panel | COMPLETE |
| POST | `/` | Create asset record | Auth required | Editor/Admin | `Asset` | Admin deliverable upload panel | COMPLETE |
| GET | `/` | List assets | Auth required | Access-scoped | `Asset` | `apps/client/src/app/dashboard/assets/page.tsx`, admin assets page | COMPLETE |
| GET | `/:assetId/download-url` | Presigned download URL | Auth required | Access-scoped, order must be delivered (client) | `Asset` | `order-deliverables.tsx` | COMPLETE |
| GET | `/:assetId/versions` | List asset versions | Auth required | Access-scoped | `AssetVersion` | Admin deliverable history | COMPLETE |
| POST | `/:assetId/versions` | Create asset version | Auth required | Editor/Admin | `AssetVersion` | Admin deliverable upload panel | COMPLETE |
| PATCH | `/:assetId/versions/:versionId` | Update version | Auth required | Editor/Admin | `AssetVersion` | Admin | COMPLETE |
| DELETE | `/:assetId/versions/:versionId` | Delete version | Auth required | Editor/Admin | `AssetVersion` | Admin | COMPLETE |
| GET | `/:assetId` | Get asset | Auth required | Access-scoped | `Asset` | Client/admin asset detail | COMPLETE |
| PATCH | `/:assetId` | Update asset | Auth required | Editor/Admin | `Asset` | Admin | COMPLETE |
| DELETE | `/:assetId` | Soft-delete asset | Auth required | Admin | `Asset` (isDeleted) | Admin | COMPLETE |

---

## ADMIN — `/api/v1/admin` (module doc: `docs/15-ADMIN.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| POST | `/users` | Create staff user | Auth + Admin | Admin/Super Admin (tiered — see `docs/15-ADMIN.md`) | `User` | `apps/admin` users page | COMPLETE |
| GET | `/users` | List users (visibility-filtered) | Auth + Admin | Admin/Super Admin | `User` | `apps/admin` users page | COMPLETE |
| GET | `/users/editors` | List editors | Auth + Admin | Admin/Super Admin | `User` | `apps/admin` editors page | COMPLETE |
| GET | `/users/qa` | List QA staff | Auth + Admin | Admin/Super Admin | `User` | `apps/admin` | COMPLETE |
| GET | `/users/clients` | List clients | Auth + Admin | Admin/Super Admin | `User` | `apps/admin` clients page | COMPLETE |
| GET | `/users/:id` | Get user | Auth + Admin | Admin/Super Admin (self excluded) | `User` | `apps/admin` | COMPLETE |
| PATCH | `/users/:id` | Update user | Auth + Admin | Admin/Super Admin (tiered) | `User` | `apps/admin` | COMPLETE |
| DELETE | `/users/:id` | Soft-delete user | Auth + Admin | Admin/Super Admin (tiered) | `User` | `apps/admin` | COMPLETE |
| PATCH | `/users/:id/role` | Change role | Auth + Admin | Admin/Super Admin (tiered) | `User` | `apps/admin` | COMPLETE |
| PATCH | `/users/:id/status` | Change active status | Auth + Admin | Admin/Super Admin (tiered) | `User` | `apps/admin` | COMPLETE |

---

## PAYMENTS — `/api/v1/payments` (module doc: `docs/14-PAYMENTS-AND-BILLING.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check only | None | — | — | — | **STUB — no other routes exist** |

---

## QA — `/api/v1/qa` (module doc: `docs/12-QA.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check only | None | — | — | — | **STUB — no other routes exist.** Real QA actions go through `PATCH /orders/status` and `POST /orders/request-revision`. |

---

## EDITING — `/api/v1/editing` (module doc: `docs/11-EDITING-WORKFLOW.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check only | None | — | — | — | **STUB — no other routes exist.** Real editing actions go through `PATCH /orders/status` and `PATCH /orders/assign-editor`. |

---

## REVISIONS — `/api/v1/revisions` (module doc: `docs/13-REVISIONS.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check only | None | — | — | — | **STUB — no other routes exist.** Real revision actions go through `POST /orders/request-revision`. |

---

## NOTIFICATIONS — `/api/v1/notifications` (module doc: `docs/16-NOTIFICATIONS.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check only | None | — | — | — | **STUB — no list/read routes exist**, despite `listUserNotifications`/`markNotificationRead` being fully implemented in the service layer and unreachable. |

---

## ANALYTICS — `/api/v1/analytics` (module doc: `docs/17-ANALYTICS.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check only | None | — | — | — | **STUB — no other routes exist.** |

---

## AI — `/api/v1/ai` (module doc: `docs/18-AI.md`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check only | None | — | — | — | **STUB — no other routes exist.** |

---

## WORKFLOW — `/api/v1/workflow` (not a Pass 2 module doc; supporting infrastructure for `orders`)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| GET | `/orders/:orderId/events` | List an order's workflow event log | Auth required | Access-scoped | `WorkflowEvent` | `order-status-timeline.tsx` (likely; not individually re-verified this pass) | COMPLETE (backend) |

---

## ORDER-COMMENTS — `/api/v1/order-comments` (not a Pass 2 module doc; supports order collaboration + revision comments + in-app notification creation)

| Method | Path | Purpose | Auth | Role | DB Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/health` | Health check | None | — | — | — | Health only |
| GET | `/orders/:orderId` | List comments on an order | Auth required | Access-scoped | `OrderComment` | `client-order-comments.tsx`, admin `order-comments-panel.tsx` | COMPLETE |
| GET | `/orders/:orderId/timeline` | Combined comment/status timeline | Auth required | Access-scoped | `OrderComment`, `WorkflowEvent` | `order-timeline-panel.tsx` (admin) | COMPLETE |
| POST | `/` | Create comment | Auth required | Access-scoped | `OrderComment`, `Notification` (side-effect) | `client-order-comments.tsx` | COMPLETE |
| POST | `/attachment/presigned-url` | Presigned URL for comment attachment | Auth required | Access-scoped | — (storage) | Comment composer | COMPLETE |
| GET | `/:commentId/attachment/download-url` | Download comment attachment | Auth required | Access-scoped | `OrderComment` | Comment thread | COMPLETE |
| PATCH | `/:commentId` | Update/resolve comment | Auth required | Author or admin (not individually re-verified) | `OrderComment` | Comment thread | COMPLETE |
| DELETE | `/:commentId` | Delete comment | Auth required | Author or admin (not individually re-verified) | `OrderComment` (isDeleted) | Comment thread | COMPLETE |

---

## AUDIT-LOGS — `/api/v1/audit-logs` (not a Pass 2 module doc)

Present in `app.ts` mounting (`services/api/src/modules/audit-logs/audit-logs.service.ts` confirmed to exist in Pass 1's module listing) but route-level detail was **not traced in this pass** — flagged for a future documentation pass rather than guessed here.

---

## Summary
- **Fully real, multi-endpoint modules:** auth, users (backend), organizations, categories, services, addons, pricing, orders, uploads, assets, admin, workflow, order-comments.
- **Health-check-only stub modules:** payments, qa, editing, revisions, notifications, analytics, ai — confirmed by direct inspection of every corresponding `*.routes.ts` file; no endpoint beyond `GET /health` exists for any of these seven modules.
- **CORS is registered with no origin restriction** (`app.use(cors())`) — see `docs/28-SECURITY.md`.
