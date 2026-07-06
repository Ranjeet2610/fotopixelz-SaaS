# Fotopixelz — Project Status Report

**Document type:** Technical audit & management review  
**Audit date:** June 6, 2026  
**Repository:** `fotopixelz` monorepo (TurboRepo + PNPM)  
**Auditor methodology:** Full codebase inspection — no assumptions from planning docs

---

## Executive Summary

Fotopixelz is a **B2B image-editing order platform** in active MVP development. The **core order pipeline** (client create → upload → submit → editor production → QA review → delivery) is substantially implemented end-to-end across API, client portal, and admin panel.

**What is real and working today:**
- Custom JWT authentication (not Clerk)
- S3/R2 presigned storage (not UploadThing or Cloudinary in production paths)
- PostgreSQL + Prisma with 22 models and 13 migrations
- Full order lifecycle with deliverable versioning and workflow audit trail
- Client portal order wizard, upload gallery, and deliverable downloads
- Admin operations panel with Editor/QA production workspace

**What is scaffolded but not operational:**
- BullMQ workers, Redis queues, Socket.IO realtime
- Replicate AI, Resend email, Stripe payments
- Dedicated QA/Editing/Revisions/Payments/Notifications/Analytics API modules
- Marketing site pages, client billing/settings, subscription upgrades

**Stack reality vs. reference architecture:**

| Planned / Listed | Actually Implemented |
|------------------|----------------------|
| Clerk Authentication | Custom JWT + bcrypt (`@repo/auth`) |
| UploadThing | S3/R2 presigned uploads (`@aws-sdk/client-s3`) |
| Cloudinary | Placeholder client only |
| BullMQ + Redis | Worker app scaffolding; not wired to API |
| Socket.IO | Placeholder only |
| React Query | Not used (React Context + `useEffect`) |
| Zustand | Not used |
| Replicate AI | Not implemented |
| Resend Email | Password reset logged to console |

Root `package.json` lists Clerk, BullMQ, Replicate, Resend, Socket.IO, UploadThing, React Query, and Zustand as dependencies — **none are used in application runtime code** except BullMQ/ioredis in the `workers` scaffold.

---

## Monorepo Structure

```
fotopixelz/
├── apps/
│   ├── web/          Next.js 16 — Client portal (port 3000)
│   ├── admin/        Next.js 16 — Operations panel (port 3001)
│   └── workers/      BullMQ scaffold — not production-ready
├── services/
│   └── api/          Express 5 API (port 5000, /api/v1/*)
├── packages/
│   ├── auth/         JWT tokens, roles, guards
│   ├── database/     Prisma client
│   ├── types/        Shared TypeScript types
│   ├── validators/   Zod schemas
│   ├── upload-gallery/  Shared preview/upload UI
│   ├── config/       Placeholder integration configs
│   └── utils/        Logger, helpers
└── prisma/
    ├── schema.prisma
    ├── migrations/   13 migrations
    └── seed.ts       Service catalog only
```

---

# Module-by-Module Audit

---

## 1. Authentication

**Status:** Completed (core) / Partially Completed (enterprise features)  
**Completion:** 85%

### Backend Status
| Item | Status |
|------|--------|
| `POST /auth/register` | ✅ Client registration + org + membership |
| `POST /auth/login` | ✅ JWT access token |
| `GET /auth/me` | ✅ |
| `POST /auth/logout` | ✅ Stateless |
| `POST /auth/forgot-password` | ✅ Token stored; link logged to console |
| `POST /auth/reset-password` | ✅ |
| JWT refresh tokens | ❌ Env vars exist; not implemented |
| Clerk integration | ❌ Not used |
| Zod validation | ✅ `auth.validator.ts` |

### Frontend Status
| App | Status |
|-----|--------|
| Web login/register | ✅ Custom forms, localStorage token |
| Admin login/forgot/reset | ✅ |
| Server-side middleware | ❌ Client-side guards only |
| Password reset (web) | ❌ Admin only |

### Database
- `User` — email, password (bcrypt), role, password reset fields
- `Membership` — org linkage on register

### Issues
- No email delivery for password reset (Resend not wired)
- No refresh token rotation; 15m access TTL only
- `CLERK_*` env vars unused
- Client-only route protection (no Next.js middleware)

### Files
- `services/api/src/modules/auth/*`
- `packages/auth/*`
- `apps/web/src/components/auth-provider.tsx`
- `apps/admin/src/components/auth-provider.tsx`

---

## 2. Users

**Status:** Partially Completed  
**Completion:** 80%

### Backend Status
| API | Status |
|-----|--------|
| `GET/PATCH /users/me` | ✅ |
| `GET/PATCH /users/me/billing` | ✅ |
| `GET /users/me/credits` | ✅ Org credit balance |

### Frontend Status
| Screen | Status |
|--------|--------|
| Admin profile | ✅ Account + billing + credits |
| Web settings | ❌ Placeholder page |
| Profile edit (web) | ❌ |

### Database
- `User`, `UserBillingProfile`

### Issues
- Billing profile UI only in admin profile (staff-oriented)
- No avatar, preferences, or notification settings

### Files
- `services/api/src/modules/users/*`
- `apps/admin/src/components/profile-page.tsx`

---

## 3. Organizations

**Status:** Completed (admin) / Partially Completed (client self-service)  
**Completion:** 85%

### Backend Status
| API | Status |
|-----|--------|
| Org CRUD | ✅ |
| Membership CRUD | ✅ |
| Role-scoped access | ✅ |

### Frontend Status
| Screen | Status |
|--------|--------|
| Admin organizations page | ✅ Full CRUD + memberships |
| Web org switcher | ❌ Auto-loads first org only |
| Team invite UI | ❌ |

### Database
- `Organization` — plan (DEMO only), subscription status, free/used credits
- `Membership` — separate `MembershipRole` enum

### Issues
- `OrganizationPlan` enum has only `DEMO`
- No client-facing org management
- Upgrade/subscription flow stubbed in UI

### Files
- `services/api/src/modules/organizations/*`
- `apps/admin/src/components/organizations-page.tsx`
- `apps/web/src/components/organization-provider.tsx`

---

## 4. Categories

**Status:** Completed  
**Completion:** 95%

### Backend
- Full CRUD at `/api/v1/categories`
- Admin-only write operations
- Zod validation ✅

### Frontend
- Admin catalog page ✅
- Web order wizard step 1 ✅

### Database
- `ServiceCategory` with slug

### Files
- `services/api/src/modules/categories/*`
- `apps/admin/src/components/catalog-page.tsx`
- `apps/web/src/components/order-wizard/order-wizard.tsx`

---

## 5. Addons

**Status:** Completed  
**Completion:** 95%

### Backend
- Full CRUD at `/api/v1/addons`
- `AddonPricingType`: FIXED, PER_IMAGE

### Frontend
- Admin addons page ✅
- Web order wizard step 3 ✅

### Database
- `Addon`, `OrderAddon` join table

### Files
- `services/api/src/modules/addons/*`

---

## 6. Uploads

**Status:** Completed  
**Completion:** 90%

### Backend
| API | Status |
|-----|--------|
| Presigned URL upload | ✅ S3/R2 |
| Complete upload | ✅ Head object verification |
| Preview URL (signed) | ✅ |
| Batch / ZIP endpoints | ⚠️ Stubs |
| Order-scoped listing | ✅ |
| Role-based access | ✅ |

### Frontend
| Screen | Status |
|--------|--------|
| Client upload panel | ✅ Drag-drop, progress, retry |
| Admin uploads page | ✅ Manual + presigned flows |
| Editor/QA source gallery | ✅ `@repo/upload-gallery` |
| ZIP bulk download | ❌ "Coming later" |

### Database
- `Upload` — **no Prisma FK relations** to Org/User/Order (orphan model)

### Issues
- Upload model lacks referential integrity in schema
- Infinite render loop in gallery **fixed** (status guard + stable callbacks)
- Batch/ZIP API not fully implemented

### Files
- `services/api/src/modules/uploads/*`
- `services/api/src/integrations/storage/*`
- `packages/upload-gallery/*`
- `apps/web/src/lib/upload-client.ts`
- `apps/admin/src/lib/upload-client.ts`

---

## 7. Orders

**Status:** Completed (MVP workflow)  
**Completion:** 90%

### Backend
| API | Status |
|-----|--------|
| Create with pricing quote | ✅ |
| List/get/update/delete | ✅ |
| Submit order | ✅ |
| Status transitions (role-based) | ✅ |
| Assign editor/QA | ✅ |
| Request revision | ✅ |
| Deliverable versioning fields | ✅ |

### Frontend
| Screen | Status |
|--------|--------|
| Order wizard (5 steps) | ✅ |
| Order list | ✅ (limit 100, no pagination) |
| Order detail + timeline | ✅ |
| Admin order queue | ✅ |
| Editor workflow actions | ✅ |
| QA approve → DELIVERED | ✅ |

### Database
- `Order`, `OrderItem`, `OrderAddon`
- Statuses: DRAFT → DELIVERED (full enum)
- `reviewRound`, `deliverableVersion`
- `assignedEditorId`/`assignedQaId` — indexed, **no User FK relations**

### Issues
- Order create modal upload picker unwired in admin
- QA approve skips `APPROVED` status (goes direct to `DELIVERED`)
- No order cancellation UI on client
- `dueAt` + `dueDate` redundant fields

### Files
- `services/api/src/modules/orders/*`
- `services/api/src/modules/pricing/*`
- `apps/web/src/components/order-wizard/*`
- `apps/web/src/components/order-upload/*`
- `apps/admin/src/components/orders-page.tsx`
- `apps/admin/src/components/order-detail-page.tsx`

---

## 8. Assets

**Status:** Completed (deliverables)  
**Completion:** 85%

### Backend
| API | Status |
|-----|--------|
| Presigned deliverable upload | ✅ |
| Complete upload + versioning | ✅ |
| Download URL (signed) | ✅ |
| List with filters (isCurrent, status) | ✅ |
| Asset versions CRUD | ✅ |
| Workflow event on upload | ✅ |

### Frontend
| Screen | Status |
|--------|--------|
| Editor deliverable upload | ✅ |
| Deliverable history (versioned) | ✅ |
| QA current submission gallery | ✅ |
| Client deliverables (DELIVERED only) | ✅ |
| Admin assets list/detail | ✅ |
| Asset detail raw storageUrl | ⚠️ Uses raw URL (admin internal) |

### Database
- `Asset` — versioning, `isCurrent`, `qaNotes`, `replacesAssetId`
- `AssetVersion` — parallel version table (partially overlapping with Asset.version)

### Issues
- `Asset.organizationId` has no Organization relation
- `Asset.createdById` has no User relation
- Dual versioning model (Asset.version + AssetVersion table)

### Files
- `services/api/src/modules/assets/*`
- `apps/admin/src/components/deliverable-*`
- `apps/web/src/components/order-deliverables.tsx`

---

## 9. AI Processing

**Status:** Not Started  
**Completion:** 5%

### Backend
- `/api/v1/ai` — health check only
- `ai.service.ts` returns `{ status: 'placeholder' }`

### Database
- `AiJob` model exists (QUEUED/RUNNING/SUCCEEDED/FAILED)

### Workers
- `ai.processor.ts`, `ai-processing.processor.ts` — placeholders

### Frontend
- No AI job UI
- Workflow audit labels reference `AI_JOB_STARTED/COMPLETED` (display only)

### Files
- `services/api/src/modules/ai/*`
- `apps/workers/src/processors/ai*.ts`
- Root dep `replicate` — unused

---

## 10. QA

**Status:** Partially Completed (via Orders module)  
**Completion:** 75%

### Backend
- Dedicated `/api/v1/qa` — health only
- QA logic lives in `orders.service.ts`:
  - `request-revision` endpoint
  - Status transitions to `REVISION_REQUIRED`, `READY_FOR_QA`, `DELIVERED`
- `QAReview` model exists — **not used by API**

### Frontend
- QA queue at `/admin/qa` ✅
- `QaReviewPanel` — current submission, revision history, approve/revise ✅
- Temporary debug panel on QA queue ⚠️

### Issues
- No dedicated QA review records in `QAReview` table
- Revision feedback stored in workflow events + Asset.qaNotes JSON
- No side-by-side source vs deliverable comparison UI

### Files
- `apps/admin/src/components/qa-review-panel.tsx`
- `services/api/src/modules/orders/orders.service.ts`

---

## 11. Editors

**Status:** Partially Completed (via Orders + Admin)  
**Completion:** 70%

### Backend
- `/api/v1/editing` — health only
- Editor assignment: `PATCH /orders/assign-editor`
- `EditingJob` model exists — **not used by API**

### Frontend
- Editor nav: dashboard, orders, uploads, assets ✅
- Start work, upload deliverables, mark ready for QA ✅
- Delivered orders read-only ✅

### Issues
- No editing job queue or workload dashboard
- No editor performance metrics

### Files
- `apps/admin/src/components/order-production-workspace.tsx`
- `apps/admin/src/lib/access-control.ts`

---

## 12. Subscriptions

**Status:** Not Started  
**Completion:** 10%

### Database
- `OrganizationPlan` — **DEMO only**
- `SubscriptionStatus` — TRIAL, ACTIVE, EXPIRED, CANCELLED (unused in API)

### Frontend
- Demo account banner with disabled Upgrade button
- "Upgrade flow coming soon" copy

### Issues
- No subscription API, Stripe integration, or plan tiers

---

## 13. Payments

**Status:** Not Started  
**Completion:** 5%

### Backend
- `/api/v1/payments` — health only
- `Payment` model exists in schema
- Stripe client placeholder

### Frontend
- "Online payment will be available soon" in order submit flow
- Billing page placeholder (web)
- `PAYMENT_CONFIRMED` workflow label (display only)

### Files
- `services/api/src/modules/payments/*`
- `packages/config/stripe.ts`

---

## 14. Credits

**Status:** Partially Completed  
**Completion:** 60%

### Backend
- Org-level `freeImageCredits` / `usedImageCredits`
- `GET /users/me/credits`
- Pricing quote applies credits

### Frontend
- Client billing summary during upload/submit ✅
- Demo banner shows credits ✅
- No credit purchase or top-up flow

### Files
- `apps/web/src/lib/order-billing.ts`
- `services/api/src/modules/pricing/pricing.service.ts`

---

## 15. Notifications

**Status:** Not Started  
**Completion:** 5%

### Backend
- `/api/v1/notifications` — health only
- `Notification` model exists

### Workers
- `notification.processor.ts`, `email-notification.processor.ts` — placeholders

### Frontend
- No in-app notification center
- No email triggers (except console.log reset link)

---

## 16. Analytics

**Status:** Not Started  
**Completion:** 5%

### Backend
- `/api/v1/analytics` — health only

### Frontend
- Admin dashboard has basic KPI counts from order list (not analytics API)
- `analytics-rollup.job.ts` — placeholder

---

## 17. Admin

**Status:** Completed (operations MVP)  
**Completion:** 85%

### Screens Completed
| Screen | Route | Status |
|--------|-------|--------|
| Dashboard overview | `/admin` | ✅ KPIs + recent activity |
| Orders | `/admin/orders` | ✅ |
| Order detail | `/admin/orders/[id]` | ✅ Full workflow |
| Uploads | `/admin/uploads` | ✅ |
| Assets | `/admin/assets` | ✅ |
| Users / Clients / Editors / QA | `/admin/users` etc. | ✅ |
| Categories / Addons / Services | Catalog pages | ✅ |
| Organizations | `/admin/organizations` | ✅ |
| Settings / Profile | ✅ Minimal |

### Missing
- Payments/billing admin
- AI job management
- Analytics dashboard
- Audit log viewer (API placeholder)
- Server-side route middleware

### Files
- `apps/admin/src/components/*`
- `services/api/src/modules/admin/*`

---

## 18. Realtime Events

**Status:** Not Started  
**Completion:** 0%

- `services/api/src/sockets/socket.ts` — placeholder
- No Socket.IO server attached to `server.ts`
- No client polling or websocket for order status updates
- Root deps `socket.io`, `socket.io-client` — unused

---

## 19. Workers

**Status:** Not Started (scaffolding only)  
**Completion:** 10%

### Structure exists
```
apps/workers/src/
├── index.ts              Logs "Workers running..." only
├── jobs/                 6 job definition files (contracts)
├── processors/           9 processor files (all placeholders)
└── queues/registry.ts    Registry placeholder
```

### Job types scaffolded (not running)
- `image-upload`, `editor-assignment`, `revision-request`
- `delivery`, `analytics-rollup`

### Processors scaffolded (not running)
- `email`, `notification`, `ai`, `ai-processing`
- `payment-webhook`, `image-optimization`, `zip`, `qa-review`

### Issues
- Workers not enqueued from API
- Redis/BullMQ not connected in production path
- `pnpm dev:workers` runs scaffold only

---

# SECTION 1 — CURRENT COMPLETED WORK

## Core Platform (Production-Ready MVP)

1. **Monorepo foundation** — TurboRepo, PNPM workspaces, shared packages, typecheck pipeline
2. **Database** — 22 Prisma models, 13 migrations, service catalog seed
3. **Authentication** — Register, login, JWT, password reset (token-based), role system (5 roles)
4. **Multi-tenant organizations** — Org CRUD, memberships, demo workspace with credits
5. **Service catalog** — Categories, services, addons with pricing types
6. **Pricing engine** — Quote builder with per-image/per-order, credits, manual override
7. **Order lifecycle** — Full status machine from DRAFT through DELIVERED
8. **Source uploads** — S3/R2 presigned PUT, signed preview/download URLs
9. **Deliverable assets** — Versioned uploads, `isCurrent` flag, replacement chain
10. **Workflow audit trail** — 19 event types, human-readable labels, order timeline
11. **Revision workflow** — QA request revision, editor re-upload, multi-round history
12. **Client portal** — Order wizard, upload panel, status timeline, deliverable downloads
13. **Admin operations** — User management, catalog, orgs, order queues
14. **Editor workspace** — Source gallery, deliverable upload, version history, QA handoff
15. **QA workspace** — Queue, current submission review, revision notes, approve to deliver
16. **Shared upload gallery** — Lazy-loaded signed previews, lightbox, FILE fallback for non-images
17. **Access control** — Role-based API guards + admin nav permissions
18. **DELIVERED hardening** — Read-only production UI after delivery

---

# SECTION 2 — PARTIALLY COMPLETED WORK

| Area | Done | Remaining |
|------|------|-----------|
| **Authentication** | JWT login/register/reset | Email delivery, refresh tokens, middleware |
| **Users** | Profile API, billing profile | Web settings UI, avatar, preferences |
| **Organizations** | Admin CRUD, demo credits | Client org management, real plan tiers |
| **Uploads** | Presigned flow, previews | ZIP batch, Upload FK relations |
| **Orders** | Full lifecycle API + UI | Pagination, cancel flow, upload picker in admin create |
| **Assets** | Versioning, signed URLs | Consolidate AssetVersion vs Asset.version, fix relations |
| **QA** | Review UI via orders | Dedicated QAReview records, comparison UI |
| **Editors** | Assignment + workspace | EditingJob queue, workload dashboard |
| **Credits** | Org credits + billing calc | Purchase flow, usage reporting |
| **Admin** | Operations MVP | Payments, analytics, audit log viewer |
| **Workers** | File structure | Redis connection, job enqueue, processors |
| **Client marketing** | Route stubs | Pricing, services landing pages |
| **Client billing** | Calculation during order | Payment UI, invoices, history |

---

# SECTION 3 — NOT STARTED MODULES

| Module | Evidence |
|--------|----------|
| **AI Processing (Replicate)** | Health-only API, placeholder workers, unused `replicate` dep |
| **Payments (Stripe)** | Health-only API, placeholder Stripe client |
| **Notifications** | Health-only API, Notification model unused |
| **Analytics** | Health-only API |
| **Audit Logs API** | Health-only (workflow events used instead) |
| **Realtime (Socket.IO)** | Placeholder socket module |
| **Email (Resend)** | Placeholder client; reset links console.log only |
| **Cloudinary** | Placeholder client |
| **UploadThing** | No code references |
| **Clerk** | Env vars only; custom auth used |
| **Subscriptions** | DEMO plan enum only |
| **React Query / Zustand** | Listed in root deps; not used in apps |

---

# SECTION 4 — DATABASE AUDIT

| Model | Exists | Complete | Notes |
|-------|--------|----------|-------|
| User | ✅ | ✅ | Password reset fields added |
| UserBillingProfile | ✅ | ✅ | 1:1 with User |
| Organization | ✅ | ⚠️ | Plan enum DEMO only |
| Membership | ✅ | ✅ | Separate MembershipRole |
| ServiceCategory | ✅ | ✅ | Seeded |
| Service | ✅ | ✅ | Global + org-scoped |
| Addon | ✅ | ✅ | Seeded via migration |
| Order | ✅ | ✅ | Missing FK relations for editor/QA/category |
| OrderItem | ✅ | ✅ | Subtotal field |
| OrderAddon | ✅ | ✅ | Pricing type + credits |
| Asset | ✅ | ⚠️ | Versioning complete; orphan FK columns |
| AssetVersion | ✅ | ⚠️ | Overlaps with Asset.version |
| Upload | ✅ | ⚠️ | No Prisma relations |
| EditingJob | ✅ | ❌ | Model only; API unused |
| AiJob | ✅ | ❌ | Model only; API unused |
| QAReview | ✅ | ❌ | Model only; API unused |
| Revision | ✅ | ⚠️ | Model exists; logic in workflow events |
| Payment | ✅ | ❌ | Model only; API unused |
| Invoice | ✅ | ⚠️ | 1:1 with Order; no API |
| Notification | ✅ | ❌ | Model only; API unused |
| AuditLog | ✅ | ❌ | Model only; API unused |
| WorkflowEvent | ✅ | ✅ | Active; 19 event types |

**Migrations:** 13 (May 29 – Jun 6, 2026)  
**Seed:** Service catalog only (4 categories, 8 services)  
**Missing indexes:** Notification unread, WorkflowEvent timeline, AuditLog queries

---

# SECTION 5 — API AUDIT

| Module | APIs Planned (est.) | APIs Built | Missing APIs |
|--------|---------------------|------------|--------------|
| Auth | 8 | 7 | Refresh token |
| Users | 5 | 5 | — |
| Organizations | 10 | 10 | — |
| Categories | 6 | 6 | — |
| Addons | 5 | 5 | — |
| Services | 6 | 6 | — |
| Orders | 12 | 12 | — |
| Uploads | 11 | 9 | Batch/ZIP full impl |
| Assets | 14 | 14 | — |
| Pricing | 2 | 2 | — |
| Workflow | 2 | 2 | — |
| Admin | 12 | 12 | — |
| AI | 5+ | 1 (health) | All business endpoints |
| Editing | 5+ | 1 (health) | Job CRUD, assignment queue |
| QA | 5+ | 1 (health) | Review CRUD (in orders instead) |
| Revisions | 4+ | 1 (health) | Dedicated revision API |
| Payments | 6+ | 1 (health) | Stripe checkout, webhooks |
| Notifications | 5+ | 1 (health) | List, mark read, send |
| Analytics | 5+ | 1 (health) | Dashboards, rollups |
| Audit Logs | 3+ | 1 (health) | Query, filter |
| **Total** | **~130** | **~105** | **~25+ business endpoints** |

**Validation:** Zod validators present for all implemented modules ✅  
**Auth middleware:** `requireAuth`, `requireAdmin` on protected routes ✅

---

# SECTION 6 — FRONTEND AUDIT (Client Portal — `apps/web`)

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | ✅ Basic | Sign in / register links |
| Login / Register | ✅ | Custom JWT auth |
| Dashboard overview | ✅ | Demo stats, quick links |
| Order wizard (5 steps) | ✅ | Category → services → addons → quote → create |
| Order list | ✅ | No pagination |
| Order detail | ✅ | Upload, submit, timeline, deliverables |
| Source upload (drag-drop) | ✅ | Presigned S3, progress, retry |
| Upload gallery previews | ✅ | Signed URLs, lazy load |
| Order status timeline | ✅ | Post-submit production stages |
| Deliverable downloads | ✅ | Individual; ZIP deferred |
| Assets library | ✅ | Grouped by order |
| Billing page | ❌ Placeholder | |
| Settings page | ❌ Placeholder | |
| Pricing page | ❌ Placeholder | |
| Services pages (7) | ❌ Placeholder | |
| Password reset | ❌ | Admin only |
| Payments | ❌ | "Coming soon" copy |
| Subscription upgrade | ❌ | Disabled button |
| Team management | ❌ | |
| Notifications | ❌ | |
| Real-time status | ❌ | Manual refresh |
| Server auth middleware | ❌ | Client-side guard only |

**Pages:** 19 routes (7 functional dashboard, 10 placeholders, 2 auth)

---

# SECTION 7 — ADMIN PANEL AUDIT

| Feature | Status | Notes |
|---------|--------|-------|
| Login / forgot / reset password | ✅ | |
| Dashboard KPIs | ✅ | From list endpoints |
| Order queue (all scopes) | ✅ | Admin, editor, client, QA |
| Order detail + audit trail | ✅ | Clean workflow labels |
| Editor production workspace | ✅ | Upload, history, QA handoff |
| QA review panel | ✅ | Current submission + revision history |
| Source image gallery | ✅ | Signed previews |
| Deliverable version history | ✅ | CURRENT VERSION badge |
| DELIVERED read-only | ✅ | Actions hidden |
| Assign editor / QA | ✅ | |
| User management (CRUD) | ✅ | Role permissions |
| Organizations + memberships | ✅ | |
| Categories / addons / services | ✅ | |
| Uploads management | ✅ | |
| Assets list / detail | ⚠️ | Detail uses raw storageUrl |
| Settings | ⚠️ | Session info only |
| Profile | ✅ | |
| QA queue debug panel | ⚠️ | Temporary — should remove |
| ZIP bulk download | ❌ | Deferred |
| Payments admin | ❌ | |
| AI job management | ❌ | |
| Analytics dashboard | ❌ | |
| Audit log viewer | ❌ | |
| Server route middleware | ❌ | Client-side only |

**Pages:** 22 routes

---

# SECTION 8 — PRIORITY ROADMAP

## Phase 1 — Critical (MVP Production Hardening)

**Goal:** Stabilize and ship the working order pipeline to production.

| Task | Effort |
|------|--------|
| Apply pending DB migrations to all environments | 2h |
| Wire Resend for password reset + order status emails | 16h (2 days) |
| Add Next.js middleware for auth on dashboard routes | 8h (1 day) |
| Fix Prisma FK relations (Upload, Order assignments) | 8h (1 day) |
| Remove QA debug panel; fix asset detail signed URLs | 4h |
| End-to-end QA of revision V1→V2→V3 workflow | 8h (1 day) |
| Production env hardening (S3, JWT secrets, CORS) | 4h |
| Error monitoring (Sentry env exists) | 8h (1 day) |

**Phase 1 total:** ~58 hours (~7–8 working days)

## Phase 2 — Required (Revenue & Operations)

**Goal:** Enable payments, subscriptions, and operational scale.

| Task | Effort |
|------|--------|
| Stripe checkout + webhook (order payment) | 40h (5 days) |
| Client billing page + invoice history | 24h (3 days) |
| Subscription plans (beyond DEMO) | 24h (3 days) |
| Credit purchase / top-up | 16h (2 days) |
| Notifications (in-app + email on status change) | 32h (4 days) |
| BullMQ workers: email + notification processors | 24h (3 days) |
| Order list pagination + search | 16h (2 days) |
| ZIP bulk download (source + deliverables) | 16h (2 days) |
| Client settings + profile edit | 16h (2 days) |
| Marketing pages (pricing, services) | 24h (3 days) |

**Phase 2 total:** ~208 hours (~26 working days)

## Phase 3 — Enhancement (Scale & Differentiation)

**Goal:** AI automation, analytics, realtime, and enterprise features.

| Task | Effort |
|------|--------|
| Replicate AI job pipeline + admin UI | 80h (10 days) |
| Socket.IO realtime order updates | 40h (5 days) |
| Analytics dashboard + rollup workers | 40h (5 days) |
| Dedicated QAReview / EditingJob APIs | 32h (4 days) |
| Audit log viewer | 16h (2 days) |
| Team invite / org self-service (web) | 24h (3 days) |
| JWT refresh tokens | 16h (2 days) |
| Image optimization worker (Cloudinary or sharp) | 24h (3 days) |
| Role-specific admin dashboards | 16h (2 days) |
| API documentation (OpenAPI) | 16h (2 days) |

**Phase 3 total:** ~304 hours (~38 working days)

---

# SECTION 9 — MASTER PROJECT ROADMAP (Modules 1–19)

| # | Module | Status | Completed | Remains | Dependencies | Est. Effort |
|---|--------|--------|-----------|---------|--------------|-------------|
| 1 | Authentication | 85% | JWT, register, login, reset tokens | Email send, refresh tokens, middleware | Resend (Phase 2) | 24h |
| 2 | Users | 80% | Profile API, billing profile | Web settings UI | Auth | 16h |
| 3 | Organizations | 85% | CRUD, memberships, demo credits | Client org UI, plan tiers | Payments | 32h |
| 4 | Categories | 95% | Full CRUD + seed | — | — | 4h |
| 5 | Addons | 95% | Full CRUD + order join | — | — | 4h |
| 6 | Uploads | 90% | Presigned S3, previews | ZIP batch, FK relations | Storage | 16h |
| 7 | Orders | 90% | Full lifecycle + revisions | Pagination, cancel, admin create fix | Uploads, Pricing | 24h |
| 8 | Assets | 85% | Versioned deliverables | Relation cleanup, AssetVersion merge | Uploads, Orders | 24h |
| 9 | AI Processing | 5% | Schema, placeholders | Replicate integration, job UI | Workers, Assets | 80h |
| 10 | QA | 75% | Review UI, revision via orders | QAReview records, compare UI | Orders, Assets | 32h |
| 11 | Editors | 70% | Workspace, assignment | EditingJob queue, metrics | Orders, Assets | 32h |
| 12 | Subscriptions | 10% | DEMO enum, banner | Stripe subscriptions, plans | Payments | 40h |
| 13 | Payments | 5% | Schema | Stripe checkout, webhooks | Orders | 40h |
| 14 | Credits | 60% | Org credits, quote calc | Purchase, reporting | Payments | 24h |
| 15 | Notifications | 5% | Schema | API, email triggers, in-app UI | Workers, Resend | 32h |
| 16 | Analytics | 5% | KPI from lists | Analytics API, dashboards | Orders | 40h |
| 17 | Admin | 85% | Full ops MVP | Payments, AI, analytics screens | All modules | 40h |
| 18 | Realtime Events | 0% | Placeholder | Socket.IO server + client | API, Auth | 40h |
| 19 | Workers | 10% | Scaffold | Redis, BullMQ, processors | Redis, all async modules | 48h |

**Recommended build order:**
1. Auth hardening → 2. Uploads/Orders polish → 3. Payments → 4. Notifications/Workers → 5. Subscriptions → 6. QA/Editor APIs → 7. AI → 8. Analytics → 9. Realtime

---

# SECTION 10 — FINAL PROJECT SCORE

| Layer | Completion % | Rationale |
|-------|-------------|-----------|
| **Backend** | **58%** | 11 of 20 API modules fully implemented; 8 are health-only placeholders |
| **Frontend (Client)** | **42%** | Core order flow complete; 10+ pages are placeholders |
| **Admin** | **78%** | Production workflow MVP complete; missing payments/AI/analytics |
| **Database** | **72%** | 22 models migrated; several orphan FKs; unused models |
| **Workers / Async** | **8%** | Scaffold only |
| **Integrations** | **25%** | S3/R2 live; Stripe/Resend/Replicate/Clerk/Socket.IO not wired |
| **Overall SaaS Completion** | **55%** | Weighted: core MVP path strong; revenue/async/AI layers absent |

### MVP Readiness Assessment

| Criterion | Ready? |
|-----------|--------|
| Internal editor/QA production use | ✅ Yes (with manual ops) |
| Client order submission + delivery | ✅ Yes |
| Production deployment (technical) | ⚠️ After Phase 1 hardening |
| Revenue collection | ❌ No payment integration |
| Automated email notifications | ❌ No |
| AI-assisted editing | ❌ No |
| Enterprise subscription tiers | ❌ No |

---

## Known Bugs & Technical Debt

| Issue | Severity | Location |
|-------|----------|----------|
| Admin asset detail uses raw `storageUrl` | Medium | `asset-detail-page.tsx` |
| Order create upload picker unwired | Low | `orders-page.tsx` |
| QA debug panel in production UI | Low | `orders-page.tsx` |
| Upload model missing FK relations | Medium | `schema.prisma` |
| Root deps unused (Clerk, React Query, etc.) | Low | Root `package.json` |
| Client-only auth guards | Medium | web + admin apps |
| JWT refresh not implemented | Medium | `packages/auth` |
| `APPROVED` status unused in QA flow | Low | Workflow design choice |

---

## Appendix — Key File Index

### API
- `services/api/src/app.ts` — Route mounting
- `services/api/src/modules/orders/orders.service.ts` — Core workflow
- `services/api/src/modules/assets/assets.service.ts` — Deliverable versioning
- `services/api/src/modules/uploads/uploads.service.ts` — Source storage
- `services/api/src/integrations/storage/s3-compatible-provider.ts` — S3/R2

### Client
- `apps/web/src/components/order-wizard/order-wizard.tsx`
- `apps/web/src/components/order-upload/order-upload-panel.tsx`
- `apps/web/src/components/order-deliverables.tsx`

### Admin
- `apps/admin/src/components/order-production-workspace.tsx`
- `apps/admin/src/components/qa-review-panel.tsx`
- `apps/admin/src/components/deliverable-history.tsx`
- `apps/admin/src/lib/workflow-events.ts`

### Shared
- `packages/upload-gallery/` — Preview gallery components
- `packages/auth/` — JWT utilities
- `prisma/schema.prisma` — Data model

---

*This document reflects the repository state as of the audit date. Re-run audit after major releases.*
