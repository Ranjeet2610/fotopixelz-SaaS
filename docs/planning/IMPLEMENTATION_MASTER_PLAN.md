# Implementation Master Plan — Fotopixelz Auth/Email/Data Remediation

**Status:** Single source of truth. Supersedes all prior audit, roadmap, and review drafts for planning purposes.
**Document hierarchy going forward:**
- **This document** — authoritative scope, sequencing, ownership, and acceptance criteria (the "what" and "when").
- **`PRODUCTION_DEPLOYMENT_STRATEGY.md`** — authoritative execution mechanics (the "how": feature flags, rollout stages, rollback triggers, monitoring, checklists). Referenced, not repeated, below.
- All earlier audit findings, the original roadmap draft, and the first architecture review are historical inputs only. Where they conflict with this document, **this document wins.**

No code is included. No new findings are introduced. Every item below has already passed both a security-exploitability challenge and a production-readiness architecture review.

---

## 1. Conflict Resolution Log

This section exists so no one re-litigates a decision that was already made. Each row is a case where earlier drafts disagreed with each other; the resolution below is final.

| Conflict | Earlier position(s) | Final resolution |
|---|---|---|
| Severity of the six "Critical" audit findings | Initial audit rated 6 items Critical | Security challenge review re-verified each against live code; all 6 were downgraded (Medium/Low) or reclassified as business-logic issues, not security vulnerabilities. **Final severities in Section 2 use the challenged values, not the initial audit.** |
| OAuth token-in-URL fix (sprint placement) | Roadmap draft placed it in Sprint 1 as a low-risk, 6–8h, no-new-infra item | Architecture review found it requires shared server-side state and is high blast-radius | **Moved to Sprint 2, merged with the Redis rate-limiter effort below.** |
| Redis-backed rate limiting (scope) | Roadmap draft scoped as a standalone 6–8h code task | Architecture review found this duplicates infrastructure work with the OAuth fix above and left the fail-open/fail-closed question unresolved | **Unified into a single Redis workstream (Section 2, Item S2-2) serving both the rate limiter and the OAuth exchange-code store, with fail-mode explicitly decided.** |
| Email case-sensitivity fix (scope) | Roadmap draft treated this as one Sprint 1 item | Architecture review split it: application-level normalization is safe and immediate; DB-level case-insensitive constraint requires a data audit and migration | **Split into two milestones under one item (Section 2, Item S1-3 and S3-2) — not duplicated as two separate initiatives.** |
| Security event logging (scope) | Roadmap draft placed all logging + alerting in Sprint 3 | Architecture review found this leaves the new Redis dependency (Sprint 2) unmonitored for a full sprint | **Split into a Sprint 2 baseline (Redis/auth-critical alerting only) and a Sprint 3 completion (full logging + alert-threshold tuning) — one item, two milestones, not duplicated.** |
| Auth-client consolidation (web/admin) | Roadmap draft included as a Sprint 3 deliverable | Architecture review determined this duplicates effort with the still-undecided session/middleware redesign, and is disproportionately risky to bundle into a security roadmap | **Rejected from this plan.** Tracked separately, not to be started before Section 4's session-architecture decision is made. |
| Dead code cleanup | Roadmap draft allocated dedicated Sprint 3 hours | Architecture review found this has no urgency or risk profile justifying planned capacity | **Rejected as a planned item.** Performed opportunistically by any engineer touching the affected files; not tracked as initiative work. |
| Next.js middleware / session-guard work | Roadmap draft included as a Sprint 2 deliverable (10–14h) | Architecture review found the effort was understated by roughly 2x and that it silently requires a parallel cookie-based session mechanism — a sub-architecture decision, not a patch | **Rejected as scheduled work.** Converted to a prerequisite design spike (Section 4); no implementation is approved until that spike concludes. |
| OAuth state secret enforcement (rollout style) | Roadmap draft proposed immediate fail-fast enforcement | Architecture review identified a deploy-sequencing outage risk (API fails to boot if ops hasn't set the env var first) | **Resolved as a phased rollout: warn-only for one release, then hard-fail** (Section 2, Item S2-4). |
| FK constraint migration approach | Roadmap draft implied a standard `ADD CONSTRAINT` | Architecture review required the two-phase `NOT VALID` → `VALIDATE CONSTRAINT` pattern with a mandatory pre-migration audit given production lock-contention risk | **Two-phase pattern is mandatory, not optional** (Section 2, Item S3-1). |
| Credit-overdraft race fix (completeness) | Roadmap draft scoped only the forward code fix | Architecture review found no plan existed for organizations already affected by the historical race | **Forward fix and historical reconciliation are two explicitly separate workstreams under one item** (Section 2, Item S3-3), with reconciliation requiring a Finance/Product decision-maker, not just engineering. |

---

## 2. Final Approved Scope

Organized by sprint. Every item lists: what is approved, why (business/security justification, final form only — not re-deriving the original audit), acceptance criteria, and execution reference.

### Sprint 1 — Isolated, Low-Regression Fixes

| ID | Item | Justification | Acceptance Criteria | Execution Reference |
|---|---|---|---|---|
| S1-1 | Harden the global error handler to stop forwarding raw internal error messages to API clients, and attach a correlation ID to every error response | Prevents internal error/schema detail leakage; correlation ID preserves debuggability that the hardening would otherwise remove | Generic error responses in place; correlation ID present and traceable to structured logs; frontend copy reviewed for compatibility with the new message format | Deployment Strategy §1 (flag `api.generic_error_responses`), §4, §11 |
| S1-2 | Add explicit handling for Prisma known errors (`P2002`, `P2025`) in registration and both Google OAuth user-creation paths (email uniqueness and `googleId` uniqueness) | Converts unhandled exceptions on concurrent registration/OAuth signup into correct, clean HTTP responses instead of leaking raw database errors | Concurrent duplicate-registration and concurrent duplicate-OAuth-signup both return clean, expected status codes with no unhandled exception and no raw Prisma text in the response | Deployment Strategy §4 (standard revert), §11 |
| S1-3 | Normalize email at every lookup point (register existence check, forgot-password lookup, admin user creation) to match the normalization already applied at write time — **application layer only** | Closes the register-race 500-error path and the forgot-password silent-failure bug for users with inconsistent email casing | All three flows behave identically regardless of input casing; no change to already-consistent inputs | Deployment Strategy §4, §11 |
| S1-4 | Run a read-only production data audit for existing case-collision duplicate email accounts | Required precondition before the DB-level constraint in Sprint 3 (S3-2) can be scheduled; must be known and resolved before that migration is attempted | Audit report produced; if violations found, a remediation decision is made and executed before Sprint 3 begins; if none found, Sprint 3's migration proceeds without a blocking gate | Deployment Strategy §5.1 |
| S1-5 | Fix the email-provider client singleton so it re-evaluates configuration instead of permanently caching an unconfigured state | Prevents a silent, permanent email outage if credentials become available after the process's first (failed) attempt | Manual test confirms recovery without a process restart once valid configuration is supplied | Deployment Strategy §4 |
| S1-6 | Scaffold (do not wire to any route) a reusable "require verified email" guard | De-risks a future, separately-approved rollout of verification gating by establishing the pattern now with zero behavioral change | Guard function exists, is unit-tested in isolation, and is not referenced by any active route | Deployment Strategy §18 (Sprint 1 checklist) |

**Sprint 1 exit criteria:** all six items merged and deployed with no Sev-1/Sev-2 incident attributable to any of them; S1-4's audit result is known before Sprint 3 planning is finalized.

---

### Sprint 2 — Auth Infrastructure Hardening

| ID | Item | Justification | Acceptance Criteria | Execution Reference |
|---|---|---|---|---|
| S2-1 | Provision managed Redis infrastructure (TLS, authenticated, connection-pool-tuned, load-tested) as a shared dependency | Single infrastructure effort serving both S2-2 and S2-3 below — rejects the duplicate-provisioning path from the original roadmap draft | Redis provisioned, load-tested under simulated peak auth traffic, connection pool exhaustion behavior verified before either consuming feature is enabled | Deployment Strategy §6.1, §6.3 |
| S2-2 | Migrate auth rate limiting to the shared Redis store, with an explicit **fail-open** behavior on Redis unavailability (falls back to in-memory limiting) | Removes the per-instance rate-limit gap that matters once the API scales beyond one replica, without making Redis a login-blocking dependency | Rate limiting enforces identical thresholds whether backed by Redis or the in-memory fallback; simulated Redis outage confirmed to degrade gracefully, not block login | Deployment Strategy §6.2, §7, §9 |
| S2-3 | Replace the OAuth callback's raw-JWT-in-URL redirect with a short-lived, single-use exchange code stored in the shared Redis store, with an explicit **fail-closed** behavior on Redis unavailability (clear "try again" error, never a less-secure fallback) | Removes the token's exposure to browser history/logs; the security review found this to be a real (if TTL-bounded) exposure worth closing outright rather than relying on token expiry alone | OAuth callback URL never contains a raw access token; exchange codes are single-use and expire quickly; simulated Redis outage confirmed to fail closed with a clear user-facing error, never falling back to the old direct-token behavior | Deployment Strategy §1 (flag `auth.oauth_exchange_code_flow`), §6.2, §11 |
| S2-4 | Enforce a required, distinct OAuth state-signing secret at startup, rolled out as **warn-only for one release**, then hard-fail in a subsequent release | Closes the secret-separation gap (state signing falling back to the JWT secret) without risking a deploy-time outage from missing environment configuration | Warn-only release ships and confirms zero missing-secret warnings in production before the hard-fail release proceeds | Deployment Strategy §1 (flag `auth.oauth_state_secret_strict`), §18 |
| S2-5 | Make password-reset and email-verification token consumption atomic (single conditional update, not read-then-write) | Closes a narrow, low-severity race window as a correctness improvement; confirmed by the security review to carry no meaningful privilege-escalation risk, but worth fixing for hygiene | Concurrency test confirms exactly one of two simultaneous requests with the same token succeeds; single-request and expired-token flows unaffected | Deployment Strategy §4, §11 |
| S2-6 | Ship a baseline monitoring/alerting layer covering Redis availability and auth success-rate SLIs, live **before** S2-2/S2-3 begin their rollout | Ensures the new Redis dependency is never running unmonitored — resolves the sequencing gap identified in architecture review, where logging/alerting was originally scheduled a full sprint after the dependency it needed to observe | Alerts fire correctly under a simulated Redis outage and a simulated auth-success-rate drop, verified in staging before Sprint 2's flagged items advance past Stage 0 | Deployment Strategy §7, §8, §9 |

**Sprint 2 exit criteria:** S2-1 and S2-6 complete before S2-2 or S2-3 begin any rollout stage. S2-3 completes its full progressive rollout (Deployment Strategy §2) before S2-2 begins its own, so any instability is attributable to a single change at a time. S2-4's hard-fail release does not ship until its warn-only bake period confirms zero missing-secret occurrences.

---

### Sprint 3 — Schema, Billing Integrity, and Completion

| ID | Item | Justification | Acceptance Criteria | Execution Reference |
|---|---|---|---|---|
| S3-1 | Add missing foreign-key constraints (`Upload.organizationId`/`userId`, `Asset.organizationId`, `Order.categoryId`/`assignedEditorId`/`assignedQaId`) using the mandatory two-phase (`NOT VALID` → `VALIDATE CONSTRAINT`) migration pattern, gated by a pre-migration orphan audit | Closes a data-integrity gap (not an active exploit, confirmed by security review) before it compounds as more write paths are added | Pre-migration audit returns zero unresolved violations; Phase A and Phase B both complete without triggering lock-contention alerts; rollback (`DROP CONSTRAINT`) verified available at every stage | Deployment Strategy §5.2, §7, §18 |
| S3-2 | Add a DB-level case-insensitive uniqueness guarantee on user email, contingent on S1-4's audit showing zero unresolved case-collision duplicates | Completes the email-normalization fix from Sprint 1 with a durable database-level guarantee, preventing future code paths from reintroducing the bug | Migration completes with zero violations (guaranteed by the S1-4 precondition); constraint verified reversible without data loss if validation ever fails | Deployment Strategy §5.1, §5.2 |
| S3-3 | Fix the order-submission credit-overdraft race (conditional/locked credit check inside the transaction) as a forward fix, **plus** a separately-owned historical reconciliation for any organizations already affected, requiring Finance/Product sign-off on remediation approach | The forward fix alone leaves already-incorrect billing data uncorrected; reconciliation is a business decision, not an engineering one | Forward fix passes a concurrency test under simulated parallel order submissions; reconciliation plan is reviewed and approved by a named Finance/Product stakeholder before any historical data is adjusted, and all adjustments are additive/auditable, never destructive | Deployment Strategy §1 (flag `orders.atomic_credit_check`), §4 |
| S3-4 | Replace fully-open CORS with an explicit, environment-driven origin allowlist, after enumerating all legitimate origins (production, staging, and any preview/PR-deploy URLs) | Closes an unnecessary open-CORS configuration; confirmed by security review to carry limited standalone risk given the Bearer-token architecture, but still standard hardening | All legitimate origins enumerated and verified functional under the allowlist before the flag advances past Stage 0; no legitimate client blocked | Deployment Strategy §1 (flag `api.strict_cors_allowlist`), §11 |
| S3-5 | Complete the security-event logging and alerting work started in Sprint 2 (S2-6): full structured logging for login failures, password-reset lifecycle, OAuth outcomes, and verification events, with tuned alert thresholds | Provides an actual audit trail and abuse-detection capability, not just log volume; threshold tuning is explicitly required, not optional, per architecture review | All named event types produce structured log entries; each alert in Deployment Strategy §7 has a named owner and has been tuned at least once within two weeks of going live | Deployment Strategy §7, §8 |

**Sprint 3 exit criteria:** S1-4's audit result is confirmed clean (or remediated) before S3-2 begins. S3-3's reconciliation plan is signed off by a named business stakeholder before any historical data adjustment executes. No migration in this sprint runs within 48 hours of a known traffic event, per Deployment Strategy §5.3.

---

## 3. Explicitly Rejected / Deferred Work

Listed here so this plan cannot be misread as silently endorsing everything ever proposed.

| Item | Status | Reason | Re-entry condition |
|---|---|---|---|
| Auth-client consolidation (`apps/web` / `apps/admin`) | **Rejected from this plan** | Duplicates effort with an undecided session-architecture direction; disproportionate regression risk for a security remediation initiative | May be proposed as independent tech-debt work only after Section 4's session-architecture decision is finalized |
| Dead code cleanup (orphaned integrations, generated client artifacts) | **Rejected as planned work** | No urgency or risk justifying dedicated capacity | Performed opportunistically by engineers already touching affected files; never scheduled |
| Next.js middleware / server-side route guard implementation | **Rejected as scheduled work; converted to a prerequisite spike** | Original effort estimate was understated; silently requires a parallel cookie-based session mechanism, which is a session-architecture decision, not a patch | Implementation may only be scheduled after the design spike in Section 4 concludes with an approved design |
| Email enumeration on registration (409 response revealing existing accounts) | **Rejected as a finding requiring action** | Standard industry UX pattern; security review found no credible exploit value in changing it | Not tracked; no re-entry condition |
| Password complexity rules beyond minimum length | **Rejected as a finding requiring action** | Current approach (length minimum + bcrypt) aligns with modern guidance (NIST 800-63B); composition rules were found to add no security value | Not tracked; no re-entry condition |
| Non-strict Zod schema on login (`loginSchema` accepting extra keys) | **Rejected as a finding requiring action** | No demonstrated exploit path; extra keys are ignored, not processed | Not tracked; no re-entry condition |
| Deactivated-user token validity until natural expiry | **Accepted as a known, bounded limitation** | Standard trade-off of short-lived stateless JWTs (15-minute TTL); not remediated by this plan | Only revisited if the refresh-token/session-revocation initiative in Section 4 proceeds |

---

## 4. Deferred Initiative Requiring Separate Approval

**Refresh-token / server-side session revocation architecture.** Identified during architecture review as the most significant structural gap in the current auth model (no server-side logout, no revocation on deactivation beyond token TTL expiry). This is **not scheduled in any sprint above** because:
- It is a session-architecture redesign, not a remediation item, and would change the current Bearer-token/localStorage contract used by both frontend apps.
- It is the prerequisite decision that determines whether the rejected middleware/session-guard work (Section 3) should ever be attempted, and in what form.

**Required before this initiative can be scheduled:** a dedicated design spike producing an approved design document, covering token lifecycle, revocation mechanism, and migration path for existing sessions. This plan does not authorize implementation work on this initiative; it authorizes only that the spike may be requested as a separate, explicitly-approved effort.

---

## 5. Sequencing Summary

1. **Sprint 1** ships in full — no dependencies on later sprints, except S1-4's audit output gates S3-2.
2. **Sprint 2** begins only after Sprint 1 is stable in production. Within Sprint 2: S2-1 and S2-6 must complete before S2-2 or S2-3 begin rollout; S2-3 fully rolls out before S2-2 begins its own rollout; S2-4's hard-fail phase does not ship until its warn-only bake period is clean.
3. **Sprint 3** begins only after Sprint 2 is stable. Within Sprint 3: S3-2 is gated on S1-4's audit; S3-3's historical reconciliation is gated on named Finance/Product sign-off; S3-1 and S3-2 migrations are scheduled independently, each following the full two-phase pattern, never both during the same low-traffic window.
4. **Section 4's design spike** may be requested at any time in parallel with the above, since it produces no production changes, but its output governs whether any middleware/session/consolidation work is ever scheduled.

---

## 6. Governance

- This document is the sole authority for **scope, sequencing, and acceptance criteria**. `PRODUCTION_DEPLOYMENT_STRATEGY.md` remains the sole authority for **execution mechanics** (flags, rollout percentages, rollback triggers, monitoring detail, checklists). Neither document duplicates the other's content; where a reader needs execution detail for an item above, they follow the stated cross-reference.
- Any proposed change to scope (adding, removing, or re-sequencing an item) requires a new architecture review before this document is amended. Ad hoc scope changes during implementation are not permitted.
- Section 3's rejected items are not to be reintroduced without an explicit new proposal and review — their presence in earlier drafts is not standing approval.
- Section 4's deferred initiative requires its own approval cycle and is not implicitly authorized by this plan.

---

## 7. Definition of Done

The initiative described in this plan is complete when:
- All items in Sections 2 (S1-1 through S3-5) are deployed at 100% rollout with no open Sev-1/Sev-2 incident attributable to any of them, per the success metrics and SLOs defined in `PRODUCTION_DEPLOYMENT_STRATEGY.md`.
- S1-4's audit and any resulting remediation are closed.
- S3-3's historical credit reconciliation is closed with Finance/Product sign-off recorded.
- All feature flags introduced for items in Section 2 have either graduated to permanent-on removal or have a documented reason for remaining.
- No item from Section 3 has been implemented outside of its stated re-entry condition.
- Section 4's design spike has either concluded with a separate, newly-approved follow-on plan, or has not been started — both are acceptable end states for **this** plan's closure.
