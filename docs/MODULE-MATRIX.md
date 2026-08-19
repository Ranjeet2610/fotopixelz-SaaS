# Module Matrix

Master index of product modules verified in Pass 2 of the documentation effort. See `docs/README.md` for CURRENT/TARGET/GAP/STATUS terminology. Each row links to its full module doc.

| Module | App(s) | Frontend | Backend | API | Database | UI | Status |
|---|---|---|---|---|---|---|---|
| [Authentication](03-AUTHENTICATION.md) | client, admin, api | `auth-pages.tsx`, `auth-provider.tsx` (separate per app) | `modules/auth` | `/auth/*` (public + authed mix) | `User`, `Organization`, `Membership` | Real, polished | COMPLETE |
| [Users](04-USERS.md) | api (client UI not confirmed) | none confirmed consuming it | `modules/users` | "me"/billing/credits (paths not enumerated) | `User`, `UserBillingProfile` | Missing (settings/billing pages are stubs) | PARTIAL |
| [Organizations](05-ORGANIZATIONS.md) | client, admin, api | `organization-provider.tsx`, `organizations-page.tsx` | `modules/organizations` | `/organizations/*` | `Organization`, `Membership` | Real (client) + real (admin) | COMPLETE |
| [Catalog & Services](06-CATALOG-AND-SERVICES.md) | client, admin, api | marketing pages, order wizard, `catalog-page.tsx` | `modules/categories`, `services`, `addons` | `/categories`, `/services`, `/addons` (public GET) | `ServiceCategory`, `Service`, `Addon` | Real, polished | COMPLETE |
| [Pricing](07-PRICING.md) | client, api | order wizard step 4, upload-panel billing | `modules/pricing`, `orders/order-billing.ts` | `POST /pricing/quote` | reads `Service`/`Addon`, writes `Order`/`OrderItem`/`OrderAddon` | Real | COMPLETE |
| [Orders](08-ORDERS.md) | client, admin, api | order wizard, order detail, admin orders/production workspace | `modules/orders` | `/orders/*` | `Order`, `OrderItem`, `OrderAddon` | Real, most mature module | COMPLETE |
| [Uploads](09-UPLOADS.md) | client, api | `order-upload-panel.tsx`, `upload-gallery` package | `modules/uploads` | `/uploads/*` | `Upload` | Real, functional (UX polish pending) | COMPLETE |
| [Assets](10-ASSETS.md) | client, admin, api | `order-deliverables.tsx`, admin deliverable panels | `modules/assets` | `/assets/*` | `Asset`, `AssetVersion` | Real | COMPLETE |
| [Editing Workflow](11-EDITING-WORKFLOW.md) | api | none | `modules/editing` (placeholder) | `/editing/health` only | `EditingJob` (unused) | N/A (capability lives in `orders`) | STUB |
| [QA](12-QA.md) | api, admin (UI exists, backend wiring not confirmed) | `qa-review-panel.tsx` | `modules/qa` (placeholder) | `/qa/health` only | `QAReview` (unused) | Partial UI, no dedicated backend | STUB |
| [Revisions](13-REVISIONS.md) | api | none dedicated | `modules/revisions` (placeholder) | `/revisions/health` only | `Revision` (unused) | N/A (capability lives in `orders`) | STUB |
| [Payments & Billing](14-PAYMENTS-AND-BILLING.md) | client, api | `/dashboard/billing` (stub) | `modules/payments` (placeholder) | `/payments/health` only | `Payment`, `Invoice` (unused) | Stub page only | STUB |
| [Admin](15-ADMIN.md) | admin, api | full admin console | `modules/admin` | `/admin/*` (staff/user mgmt) | `User` (role/status) | Real | COMPLETE |
| [Notifications](16-NOTIFICATIONS.md) | api (email real), client/admin (no in-app UI) | none for in-app | `modules/notifications` (service real, routes stubbed) | `/notifications/health` only | `Notification` (write-only) | Email real; in-app unreachable | PARTIAL |
| [Analytics](17-ANALYTICS.md) | api | none | `modules/analytics` (placeholder) | health only | none dedicated | None | STUB |
| [AI](18-AI.md) | api, workers | none | `modules/ai` (placeholder) | `/ai/health` only | `AiJob` (unused) | None | STUB |
| [Workers & Jobs](19-WORKERS-AND-JOBS.md) | workers, api (producers) | N/A | `apps/workers` (no real consumer) | N/A | N/A (Redis-backed) | N/A | STUB |

## Summary counts

| Status | Count | Modules |
|---|---|---|
| **COMPLETE** | 8 | Authentication, Organizations, Catalog & Services, Pricing, Orders, Uploads, Assets, Admin |
| **PARTIAL** | 2 | Users, Notifications |
| **STUB** | 7 | Editing Workflow, QA, Revisions, Payments & Billing, Analytics, AI, Workers & Jobs |
| **BROKEN** | 0 | — |
| **NOT IMPLEMENTED** | 0 | — (all listed modules have at least scaffolding) |

Note: QA and Revisions are marked STUB **as standalone modules only** — the actual QA and revision *capabilities* are real and working, implemented inside the `orders`/`assets` modules rather than their own dedicated modules. See `docs/25-PRODUCT-WORKFLOWS.md` items 13 and 16 for the distinction.
