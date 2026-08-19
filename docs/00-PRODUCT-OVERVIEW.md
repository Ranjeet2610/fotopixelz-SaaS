# Fotopixelz — Product Overview

> **Terminology used in this document:** see `docs/README.md` → "Documentation Terminology" for the definitions of CURRENT, TARGET, GAP, and STATUS values. This document is Pass 1 of a multi-pass documentation effort (Product + Architecture + Structure only). Module-by-module and API-by-API documentation is out of scope here and will follow in later passes.

---

## 1. What Fotopixelz Is

**CURRENT:** Fotopixelz is a pnpm/Turborepo monorepo implementing a SaaS platform for outsourced photo-editing services. A client organization submits an order for one or more editing services (e.g. background removal, ghost mannequin compositing, retouching), uploads source images, and the platform tracks that order through a production workflow toward delivery of edited files.

**CURRENT:** The codebase is organized as three separate Next.js frontends (`apps/web`, `apps/client`, `apps/admin`), one Express API (`services/api`), one background-job process (`apps/workers`), and a set of shared packages, all backed by a single PostgreSQL database via Prisma.

## 2. Core Product Purpose

**CURRENT:** Provide a structured, trackable pipeline for a business to order professional image editing (product photography, fashion, jewelry, etc.) and receive finished files back, without manual email/file-transfer coordination.

## 3. Core Customer Problem

**CURRENT (inferred from implemented workflow, not from a separate stated problem doc):** Businesses that need bulk product/fashion image editing today rely on ad hoc email/file-sharing workflows with editing vendors. Fotopixelz replaces that with: a defined service catalog with per-image pricing, a guided order-creation flow, a dedicated upload mechanism, and order status visibility.

## 4. Core Product Workflow

**CURRENT** (verified against `docs/architecture/architecture.md` and the actual `Order` status flow used in `apps/client`):

```
Client selects category/services → builds order (quantities, addons) → order created (DRAFT/SUBMITTED)
  → client uploads source images → order marked UPLOADED → client submits order (PENDING)
  → internal staff assign/process the order (ASSIGNED → IN_PROGRESS)
  → QA review (READY_FOR_QA → APPROVED, or REVISION_REQUIRED loop back to IN_PROGRESS)
  → DELIVERED → client downloads finished assets
```

**CURRENT:** Order creation, the per-image quote calculation, and the upload step are implemented and functionally connected to real API endpoints (`/categories`, `/services`, `/addons`, `/pricing/quote`, `/orders`, upload endpoints). Editor assignment, QA, and revisions exist as backend modules (`services/api/src/modules/{editing,qa,revisions}`) and admin-side UI, but were not re-verified in this pass — see `docs/01-ARCHITECTURE.md` for what was inspected.

## 5. Main Product Capabilities

**CURRENT — implemented and functionally connected to the API** (per direct code inspection in this and prior review passes):
- Email/password authentication + Google OAuth sign-in, with email verification enforced at login
- Per-organization client workspace ("client-workspace" provisioning on first login)
- Service catalog browsing (categories, services, addons) via public API endpoints
- Guided multi-step order creation wizard with a live pricing quote
- Source image upload against an order (drag-and-drop, progress, retry, remove)
- Order status tracking / timeline on the client side
- Order comments (client-facing thread on in-production orders)
- Deliverable download once an order is `DELIVERED`
- Admin console: dashboard, orders (including a production/QA workspace), customers, organizations, services/catalog, addons, assets, uploads, editors, users, roles/permissions, settings

**PARTIAL / not independently re-verified in this pass:**
- Billing/payments — `Payment`/`Invoice` Prisma models and a `payments` API module exist; the client `/dashboard/billing` route is a placeholder stub (confirmed in the prior UI review pass). Not verified end-to-end in this pass.
- AI preprocessing — an `ai` module and `ai-processing`/`ai.processor.ts` exist, but the worker processor is a placeholder stub (`status: 'placeholder'`), so this is **not** a working capability today.
- Realtime notifications — `services/api/src/sockets/socket.ts` exists; not verified in this pass.

**STUB:**
- `apps/workers` background job processors — every processor file inspected (`ai.processor.ts`, and siblings under `apps/workers/src/processors/` and `apps/workers/src/jobs/`) is a minimal placeholder object, not working job logic.
- Public marketing site (`apps/web`) — a single placeholder page.
- Client `/services`, `/pricing`, `/dashboard/billing`, `/dashboard/settings` were placeholder stubs prior to the Services & Pricing V1 work in this engagement; `/services` and `/pricing` are now implemented (see `docs/01-ARCHITECTURE.md`). Billing and settings remain stubs.

## 6. Current Implementation Maturity

**CURRENT:** Not established as a single official percentage in the current codebase. Prior audit work in this engagement (not a formal project document) characterized the core product as roughly mid-way complete, with authentication, organizations, catalog/services, orders, uploads, pricing, and the admin console substantially implemented, while billing, public marketing content, AI processing, and worker job execution are stub-level. This document does not restate a numeric maturity score as fact — treat any percentage cited elsewhere as an informal estimate, not a verified metric.

**TARGET:** Not established in current codebase as a formally tracked completion metric. `docs/planning/IMPLEMENTATION_MASTER_PLAN.md` is the designated source of truth for current remediation scope per `docs/README.md`, but its content was not re-parsed for this pass.

## 7. Major Applications

**CURRENT** (see `docs/01-ARCHITECTURE.md` for full detail):
- `apps/web` — public marketing site (placeholder scaffold), port 3002
- `apps/client` — authenticated client/customer application, port 3000
- `apps/admin` — authenticated admin/operations application, port 3001

## 8. Major Backend Systems

**CURRENT:**
- `services/api` — Express 5 REST API, module-per-domain, the only backend service the frontends talk to directly, port 5000
- `apps/workers` — standalone process intended to run BullMQ job processors; current processors are placeholder stubs
- `prisma/` — canonical PostgreSQL schema (23 models) and migrations, shared via `@repo/database`
- `packages/*` — shared libraries (`auth`, `database`, `email`, `types`, `validators`, `utils`, `config`, `upload-gallery`; `ui` package exists but currently has no populated source files)

## 9. Current Limitations

**CURRENT (directly observed in code during this and prior review passes):**
- `apps/web` (the actual public marketing site) has no real content — a single static paragraph.
- `apps/workers` job processors are non-functional placeholders; there is no evidence of working async AI processing, image optimization, delivery zipping, or payment-webhook handling despite queue names being defined (`apps/workers/src/queues/registry.ts`).
- Client billing (`/dashboard/billing`) and settings (`/dashboard/settings`) pages are placeholder stubs, not connected to any API.
- `packages/ui` now exists (design tokens + Button/Card/Badge/Alert primitives, per `docs/DESIGN-SYSTEM.md`). `apps/admin` now depends on it — `Button`/`StatusBadge`/`RoleBadge`/`ErrorBanner`/`SuccessBanner` are wired to the shared primitives (Electric Coral accent, unified status colors, Geist body font fixed). `Card`, `PageHeader`, `DataTable`, `Modal`, and form fields are still admin's own hand-rolled CSS (no shared equivalent built yet). `apps/client` does not depend on `@repo/ui` yet and still uses its own shadcn/Tailwind primitives.
- A dated report in `docs/reports/FOTOPIXELZ_CURRENT_PROJECT_STATUS.md` (2026-07-06) describes an earlier repository shape (before the `apps/web`/`apps/client` split) and should be read as historical context only, not current state — per this document's own convention, reports are immutable snapshots, not living documentation.

---

*This document covers product-level scope only. Module-level, API-level, and database-level documentation are deferred to later passes per the current documentation plan.*
