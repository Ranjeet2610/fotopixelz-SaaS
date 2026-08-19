# Current / Target / Gap — Master Table

Synthesizes findings from `docs/00-PRODUCT-OVERVIEW.md` through `docs/31-DEPLOYMENT.md`. Priority is relative, not a committed schedule — see `docs/ROADMAP.md` for sequencing.

| Area | CURRENT | TARGET | GAP | Priority |
|---|---|---|---|---|
| **Product** | Order-based photo-editing SaaS; core lifecycle (order→upload→submit→assign→edit→QA→deliver) fully real | Not established beyond current scope as a dated plan | Marketing content, payments, async processing, tests | High (compounding) |
| **Admin** | Real CRUD, tiered RBAC, own design system | Same functionality, unified visual identity with client | Design-system alignment only — no functional gap | High (visual) |
| **Client** | Auth, dashboard, marketing pages, order wizard, uploads, assets all real; billing/settings stubs | Full workspace incl. billing/settings, premium visual identity | Billing/settings backend+UI; visual redesign | High |
| **Website (`apps/web`)** | Single placeholder paragraph, not in Docker Compose | Full public marketing site — visual, conversion-focused | Entire site | Medium–High (per roadmap phase 3) |
| **Auth** | Credential + Google OAuth, email verification, password reset — all real | Not established beyond current | Refresh-token/session revocation not implemented | Low (works, hardening item) |
| **Catalog** | Categories/services/addons — real, public read, admin write | Richer marketing content (images, FAQs) | Content only, no functional gap | Medium |
| **Pricing** | Real per-image quote + submission-time recalculation | Not established beyond current | None functional | Low |
| **Orders** | Full state machine, role-scoped transitions — most mature module | Not established beyond current | `DRAFT` status is dead; `Revision` model unused (see Revisions row) | Low |
| **Uploads** | Real presigned S3 flow, server-verified, retry/abort | Not established beyond current | UX polish only (concurrency cap, aggregate progress) | Low |
| **Assets** | Real presigned deliverable flow, versioning, integrity checks | Not established beyond current | Two overlapping versioning mechanisms (`AssetVersion` vs `replacesAssetId`) unclarified | Low |
| **Editing (dedicated module)** | Health-check stub only; real capability lives in `orders` | Unclear whether a separate per-job system was ever intended | `EditingJob` model unused; module non-functional as a standalone concept | Low (capability works elsewhere) |
| **QA (dedicated module)** | Health-check stub only; real capability lives in `orders` | Same as above | `QAReview` model unused | Low (capability works elsewhere) |
| **Revisions (dedicated module)** | Health-check stub only; real capability lives in `orders`+comments | Same as above | `Revision` model unused; no first-class queryable revision list | Low–Medium (no way to list "open revisions" directly) |
| **Payments** | Billing correctly calculated; **no collection mechanism exists** | Stripe checkout/webhooks, `Payment`/`Invoice` persistence, client billing UI | Entire payment-collection path | High (revenue-blocking) |
| **Notifications** | Email real; in-app `Notification` records written but **unreadable** (no list/read routes) | Working in-app notification center | Two missing route registrations + frontend UI | Medium (small, precise fix) |
| **AI** | Fully stub — no provider integration anywhere | Not established as a dated plan | Entire capability | Low (not blocking current product) |
| **Workers** | No real BullMQ consumer starts; all processors are placeholders | Real async processing per `docs/architecture/architecture.md`'s stated next phases | Entire consumer-side implementation | Medium (product works synchronously today, but won't scale) |
| **UI/UX** | Functionally solid; incremental token-migration attempt (Admin Stage 1–3) completed then **stopped by decision** as insufficiently ambitious — treated as provisional scaffolding, not final | **Ground-up redesign**, benchmarked on quality against premium image-editing platforms (not copying their branding/layout) — creative/premium/image-first/editorial/distinctive per `docs/24-UI-UX.md`'s strategy-change notice | Entire visual layer, from scratch — see `docs/UI-REVIEW.md` and `docs/24-UI-UX.md` | High |
| **Testing** | **Zero automated tests anywhere in the repository** | Not established as a dated plan, but implied need given business-logic maturity | Entire test suite (unit/integration/E2E) | High (risk multiplier for every other change) |
| **Security** | Strong in places (PKCE OAuth, presigned URLs, bcrypt, hashed reset tokens), weak in others (open CORS, no refresh tokens, error-message leakage, unhashed verification tokens) | Not established as a dated hardening plan | See `docs/28-SECURITY.md` known risks list | Medium–High (pre-production hardening) |
| **Deployment** | Dev-only Docker Compose; no CI/CD; no production pipeline | Production-ready deployment per `docs/planning/PRODUCTION_DEPLOYMENT_STRATEGY.md` (a plan, not yet executed) | Entire production deployment path | High (blocks any real launch) |

## Cross-cutting gap not captured in a single row
The **permission-group system** (`packages/auth/permissions.ts`) is built and completely unused (`docs/02-ROLES-AND-PERMISSIONS.md`) — either retire it or adopt it; leaving it as-is risks future engineers trusting stale/aspirational documentation over actual enforcement.
