# Production Deployment Strategy — Fotopixelz Auth/Email/Data Remediation

**Status:** Execution plan for the approved remediation roadmap (Sprint 1 / Sprint 2 / Sprint 3, as revised in the final architecture review).
**Scope:** This document defines *how* the approved roadmap ships safely into a live, paying-customer production environment. It does not alter *what* is being built — see the roadmap and revised sprint plan for scope.
**Audience:** Engineering, SRE/on-call, Security, Support, Product sign-off.

---

## 1. Feature Flag Strategy

**Principle:** Every roadmap item that touches an authentication-critical path or introduces a new runtime dependency ships behind a flag with an instant, code-deploy-free kill-switch. Items that are purely internal error-handling/logging hygiene with no user-facing contract change may ship unflagged, gated only by the standard PR review + CI process.

| Roadmap item | Flagged? | Flag name (convention) | Default state at rollout start | Kill-switch behavior |
|---|---|---|---|---|
| 1.1 OAuth exchange-code flow | Yes | `auth.oauth_exchange_code_flow` | OFF (old direct-token redirect remains live) | Instantly reverts all Google sign-ins to the pre-change redirect contract; no deploy required |
| 1.2 Error handler hardening | Yes (soft flag / log-only mode first) | `api.generic_error_responses` | OFF (verbose mode retained) for 1 release, then ON | Reverts to previous verbose error body if support/debugging is impacted |
| 1.3 P2002/P2025 handling | No | — | N/A | Additive-only; standard rollback via revert PR |
| 1.4a Email normalization (app-level) | No | — | N/A | Additive-only; standard rollback via revert PR |
| 1.4b Case-insensitive email constraint (DB) | Yes (migration gate, not a runtime flag) | `db.citext_email_enforced` | Enforced only after audit + `VALIDATE CONSTRAINT` succeeds | Constraint can be dropped without app changes if validation fails |
| 1.5 Resend singleton fix | No | — | N/A | Trivial revert |
| 2.1 Atomic token consumption | No (internal logic only, no external contract change) | — | N/A | Standard revert PR |
| 2.2 Redis-backed rate limiting | Yes | `auth.redis_rate_limiter` | OFF (in-memory limiter remains primary) | Instantly falls back to in-memory limiter; Redis outage never blocks auth |
| 2.3 Middleware/session signal | **Not approved for implementation** — flag scaffolding only, held at OFF pending design spike sign-off | `web.middleware_route_guard` | OFF indefinitely until spike concludes | N/A until scoped |
| 2.4 OAuth state secret fail-fast | Yes (warn-only phase flag) | `auth.oauth_state_secret_strict` | OFF (warn-log only) for 1 full release cycle | Downgrades from hard-fail to warn-log without a deploy |
| 3.1 FK constraints | Migration-gated, not a runtime flag | — | `NOT VALID` phase is non-blocking by construction | `DROP CONSTRAINT` is the rollback |
| 3.2 Credit overdraft fix | Yes | `orders.atomic_credit_check` | OFF until concurrency test suite passes in staging | Reverts to prior (racy) logic — acceptable short-term since this is a data-integrity, not availability, concern |
| 3.4 CORS allowlist | Yes | `api.strict_cors_allowlist` | OFF (permissive CORS retained) until all legitimate origins are enumerated and verified | Reverts to permissive CORS instantly if a legitimate client is blocked |
| 3.6 Security event logging + alerting | No (additive observability only) | — | N/A | N/A |
| 3.7 `requireVerifiedEmail` guard | N/A — scaffolded but never wired to a route in this roadmap | — | Guard is dead code until a future roadmap wires it | N/A |

**Flag hygiene rules:**
- No flag remains in the codebase for more than 2 release cycles after reaching 100% ON with no incidents — must be removed as tech-debt cleanup, tracked as a follow-up ticket at flag-creation time.
- All flags are evaluated server-side (API) where the item is server-owned; `web.middleware_route_guard` is the only flag with frontend evaluation and is held OFF pending design approval.
- Flag state changes are logged as discrete events (who, when, old/new value) for audit purposes — this reuses the 3.6 structured-logging infrastructure.

---

## 2. Progressive Rollout Plan

Rollout percentage gates apply to every flagged item in Section 1, using the same 4-stage gate regardless of item, with stage duration adjusted by blast radius.

| Stage | % of traffic | Minimum bake time | Advance criteria |
|---|---|---|---|
| Stage 0 — Internal | 0% external / internal test accounts + staging only | 1 business day | Manual QA checklist (Section 12) passes; no errors in internal dogfooding |
| Stage 1 — Canary | 1–5% of production traffic | 24 hours minimum, must include one full peak-traffic window | Error rate, latency, and auth success-rate SLIs (Section 9) within bounds; zero Sev-1/Sev-2 incidents |
| Stage 2 — Partial | 25% → 50% | 24 hours per step | Same SLI thresholds hold at each step; support ticket volume for the affected flow shows no anomalous increase |
| Stage 3 — Full | 100% | Ongoing | Full bake for 48 hours before the flag is considered "graduated" and eligible for removal |

**High-blast-radius items (1.1 OAuth exchange-code flow, 2.2 Redis rate limiter) require an explicit sign-off from Engineering + Security before advancing from Stage 1 to Stage 2.** All other flagged items may auto-advance on SLI thresholds alone with on-call awareness.

**Rollout ordering across items:** items are never rolled out in parallel if they touch the same code path. Specifically: 1.1 and 2.2 both introduce a dependency on a shared temporary-state store (per the revised roadmap's unification of these two efforts) — 1.1's Stage 1 canary must complete before 2.2 begins its own Stage 0, so that any store-related instability is attributed to a single change at a time.

---

## 3. Canary Deployment Plan

**Infrastructure-level canary (applies regardless of feature flags):** every deploy to `services/api` follows a canary instance pattern — one new-version instance receives a small percentage of load-balanced traffic before the full fleet is updated.

| Step | Action | Duration | Abort condition |
|---|---|---|---|
| 1 | Deploy new build to a single canary instance behind the load balancer | — | Build fails health check (Section 10) at startup → auto-abort, canary instance never receives traffic |
| 2 | Route 5% of live traffic to canary instance | 30 minutes minimum | Error rate on canary >2x baseline fleet error rate → auto-rollback |
| 3 | Route 25% of live traffic to canary | 30 minutes minimum | Same threshold; also compare P95/P99 latency against fleet baseline |
| 4 | Full fleet rollout | — | Standard post-deploy monitoring window (Section 13) |

**Database/Redis-touching deploys (2.2, 3.1, 3.2) get an extended canary window (2 hours minimum at each traffic step) given the higher cost of a bad state propagating into persisted data.**

**Canary + feature flag are independent, layered controls:** a canary deploy can carry a feature flag that's still OFF — this validates that the new build itself is stable (no crashes, no memory leaks, clean health checks) *before* the flagged behavior is ever exercised in production. Flags are only flipped ON after the canary deploy of that build has fully graduated to 100% infrastructure rollout.

---

## 4. Rollback Plan (per roadmap item)

| Item | Rollback mechanism | Rollback time | Data cleanup required? |
|---|---|---|---|
| 1.1 OAuth exchange-code flow | Flag OFF → reverts to direct-token redirect | Seconds (flag flip) | No — exchange-code store entries simply expire unused |
| 1.2 Error handler hardening | Flag OFF → reverts to verbose error body | Seconds | No |
| 1.3 P2002/P2025 handling | Revert PR + redeploy | Minutes (standard deploy pipeline) | No |
| 1.4a Email normalization (app) | Revert PR + redeploy | Minutes | No |
| 1.4b Case-insensitive email constraint | `DROP CONSTRAINT` (reversible DDL, no data loss) | Minutes | Only if the audit step (Section 5) already merged/flagged duplicate accounts — those decisions are not auto-reverted |
| 1.5 Resend singleton fix | Revert PR + redeploy | Minutes | No |
| 2.1 Atomic token consumption | Revert PR + redeploy | Minutes | No |
| 2.2 Redis-backed rate limiting | Flag OFF → falls back to in-memory limiter | Seconds | No |
| 2.4 OAuth state secret fail-fast | Flag OFF → reverts to warn-only | Seconds | No |
| 3.1 FK constraints | `NOT VALID` phase: `DROP CONSTRAINT`. Post-`VALIDATE`: same, DDL-reversible | Minutes | Only if orphan rows were force-deleted rather than remediated — must confirm cleanup approach preserves reversibility |
| 3.2 Credit overdraft fix (forward fix) | Flag OFF → reverts to prior logic | Seconds | Historical reconciliation (separate workstream) is never auto-reverted — it is an explicit, audited, one-way correction |
| 3.4 CORS allowlist | Flag OFF → reverts to permissive CORS | Seconds | No |
| 3.6 Security logging/alerting | Revert PR + redeploy | Minutes | No |

**General rule:** any item whose rollback requires a code deploy (rather than a flag flip) must have its revert PR pre-written and approved *before* the forward change ships, so rollback is "merge the pre-approved revert" rather than "write a fix under incident pressure."

---

## 5. Database Migration Strategy

**Applies to:** 1.4b (case-insensitive email constraint), 3.1 (FK constraints on Upload/Asset/Order).

### 5.1 Pre-migration gate (mandatory for both)
1. Read-only audit query run against production (or a production snapshot) to detect rows that would violate the new constraint (case-collision duplicate emails for 1.4b; orphaned foreign-key references for 3.1).
2. If violations are found: **migration is blocked.** A data-remediation plan is written and executed first (merge/flag duplicate accounts for 1.4b; nullify or resolve orphaned references for 3.1), each remediation action individually audited and reversible.
3. Only after the audit returns zero violations does the migration proceed.

### 5.2 Two-phase safe migration pattern (mandatory for 3.1, recommended for 1.4b)
- **Phase A:** Add the constraint as `NOT VALID`. This takes a brief metadata-only lock and does not scan/validate existing rows — safe to run during business hours.
- **Bake period:** Minimum 24 hours between Phase A and Phase B, during which the constraint is enforced for all *new* writes (catching regressions immediately) while historical data has not yet been fully scanned.
- **Phase B:** Run `VALIDATE CONSTRAINT` separately, during a low-traffic window. This scans existing rows but takes a lighter lock than a combined add+validate and does not block concurrent reads/writes.
- **Abort path:** If Phase B validation fails (unexpected violations slipped in during the bake period), the constraint can be dropped without any data loss, and the pre-migration audit is re-run.

### 5.3 Timing
- All migrations execute during the lowest-traffic window for the platform (determined from traffic analytics — not assumed, to be confirmed against real usage data before scheduling).
- No migration is run within 48 hours of a major product launch, marketing push, or known traffic spike.
- Migrations are never run on a Friday or immediately before a weekend/holiday, to ensure full engineering availability for the bake period.

### 5.4 Backup verification
- A verified, restorable backup/snapshot is confirmed immediately before Phase A of any schema-altering migration. "Verified" means a test restore has been performed against a non-production environment within the prior 30 days — not merely "a backup job ran."

---

## 6. Redis Rollout Strategy

**Applies to:** 2.2 (rate limiting) and the shared temporary-store need identified for 1.1 (OAuth exchange codes).

### 6.1 Infrastructure provisioning (precedes any application code)
1. Provision a managed Redis instance (not self-hosted) with TLS-in-transit and authenticated access.
2. Configure connection pooling limits appropriate to the API's expected concurrency, with conservative defaults validated under load-test conditions (Section 6.3) before production use.
3. Provision Redis in the same failure domain/region as the API to minimize latency and cross-region failure correlation.

### 6.2 Fail-open vs. fail-closed decision (explicit, documented, signed off)
- **Rate limiting (2.2): fails open.** If Redis is unreachable, the rate limiter falls back to the existing in-memory limiter rather than blocking all authentication traffic. Rationale: availability of login/registration takes priority over rate-limiting completeness for the duration of a Redis incident, which is expected to be short and independently alerted on.
- **OAuth exchange codes (1.1): fails closed.** If the exchange-code store is unreachable, the OAuth callback returns a clear "try again" error rather than falling back to any less-secure behavior. Rationale: this store holds security-sensitive, single-use tokens — silently degrading here would reintroduce the exact vulnerability class being fixed.
- Both behaviors are covered by dedicated alerts (Section 7) so a Redis outage is never silent regardless of which fail-mode applies.

### 6.3 Load testing
- Before Stage 1 canary (Section 2), run a load test simulating peak expected auth traffic against the Redis-backed rate limiter and exchange-code store in a staging environment sized comparably to production.
- Validate connection pool exhaustion behavior specifically — confirm the application degrades according to the fail-open/fail-closed rules above rather than hanging or crashing under pool exhaustion.

### 6.4 Cost and capacity
- Redis sizing and cost are confirmed with the infrastructure/finance owner before provisioning — this is a new recurring cost line that did not previously exist in the stack.

---

## 7. Monitoring & Alerting

**Principle:** No new dependency or auth-critical code path ships without a corresponding alert. Alerts route to on-call with clear, actionable thresholds — not raw log volume.

| Signal | Alert condition | Severity | Routes to |
|---|---|---|---|
| Redis availability (rate limiter + exchange-code store) | Connection failures exceed a defined threshold within a 1-minute window | Sev-2 (rate limiter, fail-open) / Sev-1 (exchange-code store, fail-closed — blocks logins) | On-call engineer |
| Auth success rate (login, register, OAuth) | Drops below baseline by a defined margin over a 5-minute rolling window | Sev-1 | On-call engineer, immediate page |
| OAuth callback error rate | Spikes above baseline | Sev-2 | On-call engineer |
| Email delivery failure rate (Resend) | Consecutive failures exceed a defined threshold, or API key rejected | Sev-2 | On-call engineer + notify support (verification/reset emails affected) |
| Repeated failed logins per account/IP | Threshold exceeded within a rolling window | Sev-3 (security signal, not availability) | Security review queue, not a page |
| Password reset / verification token consumption anomalies | Unexpected spike in "invalid or expired token" responses | Sev-3 | Security review queue |
| Migration validation (Phase B, Section 5) | `VALIDATE CONSTRAINT` failure or unexpected duration | Sev-2 | On-call engineer, migration owner |
| Credit-check transaction failures (3.2) | Error rate on order submission spikes | Sev-2 | On-call engineer |
| API error rate (global, post error-handler hardening) | 5xx rate exceeds baseline | Sev-1 | On-call engineer |
| Database connection pool saturation | Utilization exceeds a defined threshold | Sev-2 | On-call engineer |

**Alert fatigue guardrail:** every alert above has a named owner responsible for tuning its threshold within the first 2 weeks of being live, to avoid the common failure mode of alerts being ignored due to excessive noise.

---

## 8. Dashboards

| Dashboard | Contents | Primary audience |
|---|---|---|
| **Auth Health** | Login/register/OAuth success and failure rates, latency percentiles (P50/P95/P99), token issuance volume, verification/reset request volume | On-call, Engineering |
| **Redis Operational** | Connection pool utilization, command latency, availability/uptime, fail-open/fail-closed event counts | On-call, SRE |
| **Email Delivery** | Send success/failure rate by template type (welcome, verify, forgot-password, password-changed), Resend API error breakdown | Engineering, Support |
| **Migration Progress** | Real-time status of `NOT VALID` → `VALIDATE CONSTRAINT` phases, row-scan progress, violation counts | Engineering (migration owner), on-call |
| **Security Signals** | Failed-login patterns, rate-limit trigger frequency, token-consumption anomalies | Security |
| **Billing Integrity (Credits)** | Credit-check transaction volume/error rate, before/after comparison of overdraft incidents | Engineering, Finance/Product |
| **Deployment/Canary** | Per-deploy canary error-rate comparison, active feature flag states and rollout percentages | Engineering, Release management |

---

## 9. SLOs / SLIs

| Service Level Indicator | Target (SLO) | Measurement window |
|---|---|---|
| Auth endpoint availability (login, register, OAuth callback, `/me`) | 99.9% successful (non-5xx) responses | Rolling 30 days |
| Login/OAuth P95 latency | Under a defined threshold consistent with pre-change baseline (no regression from Redis/exchange-code additions) | Rolling 7 days |
| Email delivery success rate | 99.5% of attempted sends succeed or are retried successfully | Rolling 7 days |
| Redis availability (as a dependency) | 99.95% | Rolling 30 days |
| Rate limiter fail-open incident duration | Any fail-open event resolved (Redis restored or explicitly mitigated) within a defined MTTR target | Per-incident |
| Migration validation success | 100% of schema migrations complete Phase B validation without requiring rollback | Per-migration |
| Credit-check correctness | Zero confirmed overdraft incidents post-fix | Rolling 30 days |

**Error budget policy:** if the auth availability SLO is breached in a given window, all non-essential feature-flag rollout advancement (Section 2) is frozen until the budget recovers — remediation and stability work takes priority over further rollout during a budget breach.

---

## 10. Health Checks

| Component | Health check | Failure behavior |
|---|---|---|
| API process | Liveness: process responds to `/health` (already exists in `app.ts`); Readiness: process can reach the database and, once introduced, Redis | Instance removed from load balancer rotation on readiness failure; liveness failure triggers instance restart |
| Database connectivity | Readiness probe includes a lightweight query | Instance marked unready, traffic drained, alert fired if sustained |
| Redis connectivity | Readiness probe includes a lightweight ping; failure does **not** fail the overall readiness check given the fail-open design for rate limiting, but **does** fail readiness for any request path that depends on the fail-closed exchange-code store | Partial degradation reflected accurately in health status rather than a binary healthy/unhealthy |
| Email provider (Resend) | Not part of liveness/readiness (email is fire-and-forget/non-blocking) — monitored via the delivery-failure alert (Section 7) instead | Does not affect instance health status |
| Canary instance (Section 3) | Must pass full health check suite before receiving any live traffic | Auto-abort canary promotion on failure |

---

## 11. Smoke Test Checklist

Run against the canary instance/environment immediately after every deploy, before traffic ramp-up proceeds past Stage 0.

- [ ] `/health` returns 200
- [ ] Register a new account with email/password → receives 201, valid JWT, welcome + verification emails dispatched
- [ ] Login with valid credentials → 200, valid JWT
- [ ] Login with invalid credentials → 401, generic message (no user enumeration)
- [ ] Google OAuth sign-in (new user) → completes end-to-end, lands authenticated on dashboard
- [ ] Google OAuth sign-in (existing linked user) → completes end-to-end
- [ ] Forgot password → reset email received with working link
- [ ] Reset password with valid token → succeeds, password-changed email sent
- [ ] Reset password with expired/invalid token → clean 400, no stack trace leaked
- [ ] Email verification link → redirects to `/login?verified=true`
- [ ] Email verification with invalid/expired token → redirects to `/login?verified=false`, no error leak
- [ ] Resend verification email (authenticated) → succeeds
- [ ] Rate limiter triggers correctly after threshold exceeded on `/login`
- [ ] (If 2.2 flag ON) Redis-backed rate limiter enforces the same threshold as in-memory did
- [ ] (If 1.1 flag ON) OAuth callback URL no longer contains a raw JWT in the query string
- [ ] Order submission with sufficient credits succeeds; with insufficient credits, fails cleanly with a clear error (post 3.2)
- [ ] CORS: request from an allowlisted origin succeeds; from a non-allowlisted origin, fails as expected (post 3.4, flag ON)

---

## 12. Manual QA Checklist

Performed by QA/Engineering in staging before Stage 0 sign-off, covering scenarios beyond automated smoke tests.

- [ ] Full registration → welcome/verify email → click verify link → confirm `emailVerifiedAt` set → login flow, across both light/dark or any theme variants of the email templates
- [ ] Mixed-case email registration and login (`Test@x.com` vs `test@x.com`) — confirm consistent behavior post-1.4 fix
- [ ] Concurrent password reset requests (two browser tabs) with the same token — confirm no double-consumption post-2.1
- [ ] Deactivated user attempting to use an existing valid token — confirm behavior matches documented (short-lived) exposure window
- [ ] Staff-role account attempting client-app login/OAuth — confirm blocked as before, unaffected by roadmap changes
- [ ] Browser back-button behavior after OAuth callback — confirm no token visible in URL bar/history post-1.1
- [ ] Support-facing error message review — confirm post-1.2 generic error messages are still comprehensible to end users and reference a traceable correlation ID
- [ ] Visual/content QA on all four email templates (welcome, verify, forgot-password, password-changed) across at least two major email clients (e.g., Gmail web, Apple Mail)
- [ ] Admin panel: forgot/reset password flow unaffected by any web-app-specific changes
- [ ] Accessibility spot-check on any modified auth UI (callback page, error states)

---

## 13. Post-Deployment Verification

Performed at each rollout stage advancement (Section 2), not just once after full rollout.

1. Compare SLI dashboards (Section 8/9) against pre-deploy baseline for the specific traffic percentage currently receiving the change.
2. Confirm zero increase in support ticket volume tagged to authentication/login/password-reset categories.
3. Confirm alert channels (Section 7) are quiet — no Sev-1/Sev-2 firing attributable to the change.
4. For migration-related items (1.4b, 3.1): confirm `VALIDATE CONSTRAINT` completed successfully and query the table to confirm zero constraint-violation errors logged since Phase A began.
5. For 3.2: spot-check a sample of organizations near their credit ceiling to confirm no new overdraft occurred during the bake period.
6. Sign-off recorded (who verified, when, which stage) before advancing to the next rollout percentage.

---

## 14. Incident Response Plan

| Step | Action |
|---|---|
| Detection | Alert fires (Section 7) or is reported via support/on-call |
| Triage | On-call determines severity (Sev-1: auth/login broken or data-integrity risk; Sev-2: degraded but functional; Sev-3: security signal, no immediate user impact) |
| Immediate mitigation | For any flagged item (Section 1): flip the relevant flag OFF first, before investigating root cause — mitigation is decoupled from diagnosis |
| For non-flagged items | Execute the pre-approved revert PR (Section 4) |
| Communication | Sev-1 triggers a status update to leadership and, if customer-facing, a status-page update; Sev-2/3 tracked internally |
| Root cause investigation | Begins only after mitigation is confirmed effective (error rates/SLIs back to baseline) |
| Postmortem | Blameless postmortem required for every Sev-1 and any Sev-2 that required a rollback, within 5 business days |
| Rollout freeze | Any Sev-1 during a rollout stage freezes advancement of *all* concurrently-rolling-out flags until resolved and postmortem-reviewed |

---

## 15. Disaster Recovery Plan

| Scenario | Recovery approach |
|---|---|
| Database corruption/loss during migration (Section 5) | Restore from the pre-migration verified backup; `NOT VALID`/two-phase approach minimizes the window in which this is even a risk since Phase A is near-instantaneous |
| Redis total loss | Application continues in fail-open mode for rate limiting (no customer impact beyond reduced brute-force protection until Redis is restored); exchange-code store fail-closed means OAuth logins are unavailable until restored — this is the accepted trade-off per Section 6.2, with restoration prioritized as Sev-1 |
| Bad deploy fully rolled out before detection (canary bypass failure) | Standard artifact rollback to the last known-good build via the deployment pipeline; all flags default OFF on a fresh deploy of a prior build, so no flagged behavior persists incorrectly |
| Mass account-credential compromise (unrelated to this roadmap but relevant to auth surface) | Out of scope for this roadmap; existing incident runbooks apply — flagged here as a gap given no server-side session revocation exists (see prior architecture review's "Missing Work") |
| Email provider (Resend) total outage | Registration/login continue to function (email dispatch is non-blocking, fire-and-forget); verification and password-reset emails queue-fail visibly via the 3.6 alerting, manual/delayed resend once provider recovers |

---

## 16. Success Metrics

| Metric | Target |
|---|---|
| Zero Sev-1 incidents attributable to any roadmap item during rollout | 100% |
| Auth availability SLO maintained throughout rollout | No breach |
| Support ticket volume for auth-related categories | No statistically significant increase vs. pre-rollout baseline |
| All flagged items reach 100% rollout within their planned rollout window without a rollback | 100% of items |
| Zero data-integrity incidents from migrations (1.4b, 3.1) | 100% |
| Zero newly-introduced duplicate accounts post-1.4 | 100% |
| Zero newly-introduced credit overdrafts post-3.2 | 100% |
| Redis dependency introduces no measurable regression to auth P95 latency beyond an agreed-upon margin | Within margin |

---

## 17. Rollback Triggers

Any of the following automatically triggers rollback (flag OFF or revert PR execution) without waiting for further investigation:

- Auth success rate SLI breaches its error budget threshold (Section 9) during any rollout stage.
- Any Sev-1 incident attributable to a specific flagged item.
- Canary error rate exceeds 2x fleet baseline (Section 3).
- Migration Phase B validation fails or exceeds its expected duration by a wide margin, suggesting unexpected lock contention or data volume issues.
- Support ticket volume for the affected flow spikes beyond an agreed threshold within a rollout stage window.
- Security review flags anomalous patterns in failed-login or token-consumption alerts (Section 7) suggesting the change introduced a new abuse vector rather than closing one.
- Redis fail-closed path (exchange-code store) triggers for longer than an agreed maximum duration, indicating the dependency is unsuitable for the fail-closed design as implemented.

---

## 18. Production Readiness Checklist

Sign-off required from Engineering, Security, and Product/Support before Stage 0 begins for each sprint's items.

**Sprint 1**
- [ ] Correlation ID added to generic error responses (1.2)
- [ ] Frontend copy reviewed for compatibility with generic error messages
- [ ] `googleId` race path covered by P2002 handling, not just email (1.3)
- [ ] Production data audit for case-collision duplicate emails completed with zero unresolved violations (1.4)
- [ ] Resend singleton fix verified via manual re-configuration test (1.5)
- [ ] Pre-written revert PRs approved for all non-flagged items

**Sprint 2**
- [ ] Redis instance provisioned, TLS-verified, connection-pool load-tested (Section 6)
- [ ] Fail-open (rate limiter) and fail-closed (exchange-code store) behaviors explicitly implemented and verified under simulated Redis outage
- [ ] Baseline alerting (Section 7) for Redis availability live *before* 2.2/1.1 flags reach Stage 1
- [ ] OAuth state secret enforcement shipped in warn-only mode with a scheduled follow-up to enable hard-fail
- [ ] Concurrency test suite for atomic token consumption (2.1) passing in staging
- [ ] Deployment runbook updated with required env-var sequencing for 2.4

**Sprint 3**
- [ ] Pre-migration orphan/violation audits completed for both 1.4b and 3.1 with zero unresolved findings
- [ ] Two-phase (`NOT VALID` → `VALIDATE`) migration plan reviewed and scheduled for a confirmed low-traffic window
- [ ] Verified, tested-restorable backup confirmed within 30 days prior to migration
- [ ] Historical credit-overdraft reconciliation plan approved by Finance/Product before 3.2's forward-fix ships
- [ ] CORS allowlist enumerated and confirmed against all known origins (prod, staging, preview) before 3.4 flag advances past Stage 0
- [ ] Full alerting thresholds (not just logging) live for 3.6 before this sprint is considered complete

**Explicitly out of scope / not gated by this document (per the approved roadmap's exclusions):**
- 2.3 (middleware/session signal) — held at design-spike stage, not eligible for any rollout stage until separately approved.
- 3.3 (auth-client consolidation) — removed from this roadmap; no deployment plan applies.
- Refresh-token/server-side session revocation architecture — identified as missing work in the architecture review; not covered by this roadmap or this deployment plan; tracked as a follow-up initiative.

---

*This document governs execution only. Any change in scope relative to the approved roadmap requires returning to architecture review before this deployment plan is updated.*
