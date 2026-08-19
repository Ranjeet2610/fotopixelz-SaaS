# Technical Status Matrix

Cross-cutting technical view, complementing `docs/MODULE-MATRIX.md` (Pass 2's product-level matrix). "Tests" is `NONE` across every row — see `docs/30-TESTING.md`: no automated tests exist anywhere in this repository, for any component.

| Component | Code | API | DB | Integration | Tests | Status |
|---|---|---|---|---|---|---|
| Auth | Real, complete | Full CRUD + OAuth + verification + reset | `User`, `Organization`, `Membership` — actively used | Google OAuth (real, PKCE+signed state), Resend email | NONE | COMPLETE |
| Catalog (Categories/Services/Addons) | Real, complete | Public read + admin write, all wired | `ServiceCategory`, `Service`, `Addon` — actively used | None external beyond DB | NONE | COMPLETE |
| Pricing | Real, complete | `POST /pricing/quote` | Reads catalog, writes `OrderItem`/`OrderAddon`/`Order` | None external | NONE | COMPLETE |
| Orders | Real, complete — most mature module | Full CRUD + status/assignment endpoints | `Order`, `OrderItem`, `OrderAddon`, `WorkflowEvent`, `OrderComment` — all actively used | Email (order-notification-emails.ts, direct send, not queued) | NONE | COMPLETE |
| Uploads | Real, complete | Full presigned-URL lifecycle | `Upload` — actively used, server-verified | S3-compatible storage (real, `headObject` verification) | NONE | COMPLETE |
| Assets | Real, complete | Full presigned-URL + versioning lifecycle | `Asset`, `AssetVersion` — actively used | S3-compatible storage (real) | NONE | COMPLETE |
| Admin (staff/user mgmt) | Real, complete, tiered RBAC | Full CRUD | `User` (role/status) | None external | NONE | COMPLETE |
| Payments | Stub (`getPaymentsStatus()` only) | Health check only | `Payment`, `Invoice` — unused/dead | Stripe client exists, never called | NONE | STUB |
| QA (dedicated module) | Stub (`getQaStatus()` only) | Health check only | `QAReview` — unused/dead | None | NONE | STUB (capability real, lives in `orders`) |
| Editing (dedicated module) | Stub (`getEditingStatus()` only) | Health check only | `EditingJob` — unused/dead | None | NONE | STUB (capability real, lives in `orders`) |
| Revisions (dedicated module) | Stub (`getRevisionsStatus()` only) | Health check only | `Revision` — unused/dead | None | NONE | STUB (capability real, lives in `orders`) |
| Notifications | Service layer real; routes not wired | Health check only (list/mark-read functions exist, unrouted) | `Notification` — written, never read back | None external | NONE | PARTIAL |
| Analytics | Stub (`getAnalyticsStatus()` only) | Health check only | None dedicated | None | NONE | STUB |
| AI | Stub (`getAiStatus()` only) | Health check only | `AiJob` — unused/dead | None (no AI provider integration found) | NONE | STUB |
| Workers | Every processor/job is a placeholder object; entry point starts no real consumer | N/A (not HTTP) | N/A directly (would touch `Order`/`Asset` if built) | Redis/BullMQ producers exist server-side (3 of 10 registered queues have any producer); no consumer | NONE | STUB |

## Cross-cutting technical notes
- **CORS:** no origin allowlist configured (`app.use(cors())`), applies to every endpoint above.
- **Rate limiting:** only applied to `auth` module endpoints; no other component in this matrix has rate limiting.
- **Global error handler:** raw error messages passed through on any uncaught exception, applies to every endpoint above (see `docs/28-SECURITY.md`, `docs/29-ERROR-HANDLING.md`).
- **Permission system:** `packages/auth/permissions.ts`'s fine-grained `PERMISSION_GROUPS` system is defined but has zero call sites across every component above — actual enforcement is ad hoc per-module role checks (see `docs/02-ROLES-AND-PERMISSIONS.md`).
- **Deployment:** every component above runs in `dev` mode in the only Docker Compose configuration found; no production build/deploy pipeline or CI exists in this repository (see `docs/31-DEPLOYMENT.md`).
