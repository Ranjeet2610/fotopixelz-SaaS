# Fotopixelz Documentation

This directory is the single home for all engineering documentation in the Fotopixelz monorepo. It replaces the previous convention of accumulating standalone reports and plans in the repository root.

Package-local `README.md` files (e.g. `apps/web/README.md`, `apps/admin/README.md`, `apps/workers/src/**/README.md`) are intentionally **not** included here — they document their own package in place and are maintained alongside that package's code.

---

## Folder Purpose

| Folder | Purpose |
|---|---|
| `planning/` | Forward-looking plans: roadmaps, implementation master plans, and execution/deployment strategies. If it describes what will happen next and how it will be rolled out, it belongs here. |
| `reports/` | Point-in-time audits, verification reports, and implementation reports. These are dated snapshots of a finding, an investigation, or a completed change — not living documents. Once written, a report is not edited to reflect later changes; a new report is added instead. |
| `testing/` | Executable test plans and QA checklists tied to a specific feature or module. |
| `architecture/` | Living reference documentation describing how the system is built today: API surface, environment/configuration reference, and system architecture overview. Updated in place as the system evolves. |
| `guides/` | Task-oriented, how-to documentation for people working in this repository (e.g. local environment setup). Updated in place as tooling/process changes. |
| `adr/` | Architecture Decision Records. Currently empty — reserved for future one-decision-per-file records (e.g. `0001-use-resend-for-email.md`) documenting a specific architectural choice, its context, and its consequences. Do not use this folder for general planning or status documents. |

---

## Document Purpose (current contents)

| Document | Folder | Purpose |
|---|---|---|
| `IMPLEMENTATION_MASTER_PLAN.md` | `planning/` | **Single source of truth** for current remediation scope, sequencing, and acceptance criteria. Supersedes conflicting detail in earlier planning/report documents. |
| `PRODUCTION_DEPLOYMENT_STRATEGY.md` | `planning/` | **Execution guide** for how approved work ships to production: feature flags, rollout stages, rollback triggers, monitoring, and readiness checklists. |
| `FOTOPIXELZ_FINAL_ROADMAP.md` | `planning/` | Earlier full-repository implementation roadmap. Historical planning input; where it conflicts with `IMPLEMENTATION_MASTER_PLAN.md`, the master plan wins. |
| `FOTOPIXELZ_PROJECT_STATUS_REPORT.md`, `FOTOPIXELZ_CURRENT_PROJECT_STATUS.md` | `reports/` | Dated, full-repository technical status/audit snapshots. |
| `FOTOPIXELZ_WORKFLOW_AUDIT_REPORT.md`, `FOTOPIXELZ_DEV_ENVIRONMENT_AUDIT_REPORT.md` | `reports/` | Dated audits of the order workflow and local development environment respectively. |
| `FOTOPIXELZ_BUG001_VERIFICATION_REPORT.md`, `FOTOPIXELZ_PHASE_A_PORT_VERIFICATION_REPORT.md` | `reports/` | Post-implementation verification reports for specific fixes. |
| `FOTOPIXELZ_BUG003_IMPLEMENTATION_REPORT.md`, `FOTOPIXELZ_BUG003_1_BOUNDARY_FIX_REPORT.md`, `FOTOPIXELZ_BUG003_2_IMPLEMENTATION_REPORT.md`, `FOTOPIXELZ_BUG003_2_PENDING_UPLOAD_AUDIT_REPORT.md` | `reports/` | Audit and implementation reports for the BUG-003 deliverable-integrity work. |
| `ORDER_COMMENTS_TESTING_CHECKLIST.md` | `testing/` | Manual QA checklist for the order comments/collaboration module. |
| `architecture.md`, `api.md`, `env.md` | `architecture/` | Living reference for system architecture, API surface, and environment variables. |
| `local-setup.md` | `guides/` | Local development environment setup guide. |

---

## Recommended Reading Order

**For a new engineer onboarding:**
1. `guides/local-setup.md` — get the environment running.
2. `architecture/architecture.md` — understand the system shape.
3. `architecture/api.md` and `architecture/env.md` — reference as needed.
4. `reports/FOTOPIXELZ_CURRENT_PROJECT_STATUS.md` — most recent full status snapshot.

**For anyone picking up active remediation work:**
1. `planning/IMPLEMENTATION_MASTER_PLAN.md` — the authoritative current scope. Start here, always.
2. `planning/PRODUCTION_DEPLOYMENT_STRATEGY.md` — how that scope ships safely.
3. Relevant `reports/` documents only as historical context for *why* an item is in the master plan — not as a source of current scope.

**For historical/audit context only** (not current-state authoritative):
- `planning/FOTOPIXELZ_FINAL_ROADMAP.md`
- Everything under `reports/`

---

## Document Ownership

| Document type | Owner | Update cadence |
|---|---|---|
| `planning/IMPLEMENTATION_MASTER_PLAN.md` | Engineering Director / initiative lead | Amended only via a new architecture review; not edited ad hoc |
| `planning/PRODUCTION_DEPLOYMENT_STRATEGY.md` | On-call/SRE + initiative lead | Updated as execution mechanics change; kept in sync with the master plan |
| `reports/*` | Author at time of writing | **Immutable once merged.** Superseded findings get a new report, not an edit to the old one |
| `testing/*` | QA / feature owner | Updated per release cycle of the feature it covers |
| `architecture/*` | Any engineer, on every PR that changes the described behavior | Continuously kept accurate — treated as living documentation |
| `guides/*` | Any engineer, on every PR that changes onboarding/local setup | Continuously kept accurate |
| `adr/*` | Decision proposer, reviewed by the team | One file per decision, never edited after acceptance (a reversal gets a new ADR that supersedes the old one) |

---

## Documentation Conventions

- **Reports are immutable.** Once a report is merged, it is a historical record of what was true at that time. Do not edit a report to reflect later changes — write a new report and let readers follow the reading order above to find the current state.
- **`planning/IMPLEMENTATION_MASTER_PLAN.md` is the single source of truth.** Any other document's scope/sequencing content is historical input only when it conflicts with the master plan.
- **`architecture/` and `guides/` are living documents.** Unlike reports, these are expected to be edited in place as the system changes, and pull requests that change described behavior should update the corresponding doc.
- **ADRs (`adr/`) are one decision per file, immutable once accepted.** A changed decision is recorded as a new ADR that explicitly supersedes the old one; the old one is never deleted or rewritten.
- **File naming:** existing `FOTOPIXELZ_*_REPORT.md` naming is preserved for historical documents already in the repository. New reports going forward should follow the same `<AREA>_<TYPE>_REPORT.md` convention for consistency; new ADRs should follow `NNNN-short-title.md`.
- **No document in this tree should contain secrets, credentials, or environment-specific values** (see `architecture/env.md` for the pattern of documenting variable names only).

---

## Documentation Terminology

This applies to all documents in `docs/`, including the numbered root-level documents (`00-PRODUCT-OVERVIEW.md`, `01-ARCHITECTURE.md`, and further passes to follow).

- **CURRENT** — actually implemented and verified in code. Not "a model/route/component exists" — verified to actually function.
- **TARGET** — intended future behavior, established by project requirements (CLAUDE.md, planning docs, or explicit code comments stating intent). If no such source exists, state: *"Not established in current codebase."* Do not infer or invent target functionality.
- **GAP** — the difference between CURRENT and TARGET for a given area.
- **STATUS** values, used per feature/route/module:
  - `COMPLETE` — implemented and functionally verified end-to-end.
  - `PARTIAL` — implemented but missing meaningful functionality, or only partially verified.
  - `STUB` — a route/component/file exists but contains placeholder content only (no real logic or API connection).
  - `BROKEN` — implemented but verified not to work correctly.
  - `NOT IMPLEMENTED` — no code exists for this yet.

**Never call something `COMPLETE` merely because a route, component, or database model exists.** Verify the implementation actually does what it claims (real API calls, real data, real logic) before assigning `COMPLETE`.

---

## Master Documentation Index

This index covers the root-level `docs/` documentation set produced across four documentation passes (product/architecture, modules/workflows, technical implementation, UI/UX/roadmap). It is separate from — and does not replace — the `planning/`, `reports/`, `architecture/`, `guides/`, and `testing/` subfolders indexed above.

### PRODUCT
- [00-PRODUCT-OVERVIEW.md](00-PRODUCT-OVERVIEW.md) — what Fotopixelz is, workflow, capabilities, maturity, limitations
- [PRODUCT-STATUS.md](PRODUCT-STATUS.md) — current per-component status snapshot
- [CURRENT-TARGET-GAP.md](CURRENT-TARGET-GAP.md) — master current/target/gap table across every area
- [ROADMAP.md](ROADMAP.md) — phased development sequence (Admin → Client → Website → Backend → Advanced Processing → Production)
- [DEFINITION-OF-DONE.md](DEFINITION-OF-DONE.md) — what "COMPLETE" actually requires

### ARCHITECTURE
- [01-ARCHITECTURE.md](01-ARCHITECTURE.md) — per-app architecture, system diagram, repo structure, tech stack, env/runtime
- [architecture/architecture.md](architecture/architecture.md) — earlier living architecture reference (see note below)

### ROLES
- [02-ROLES-AND-PERMISSIONS.md](02-ROLES-AND-PERMISSIONS.md) — actual roles, the unused permission-group system, backend-vs-frontend enforcement matrix

### MODULES
- [03-AUTHENTICATION.md](03-AUTHENTICATION.md)
- [04-USERS.md](04-USERS.md)
- [05-ORGANIZATIONS.md](05-ORGANIZATIONS.md)
- [06-CATALOG-AND-SERVICES.md](06-CATALOG-AND-SERVICES.md)
- [07-PRICING.md](07-PRICING.md)
- [08-ORDERS.md](08-ORDERS.md) — includes the order state machine (Mermaid diagram)
- [09-UPLOADS.md](09-UPLOADS.md)
- [10-ASSETS.md](10-ASSETS.md)
- [11-EDITING-WORKFLOW.md](11-EDITING-WORKFLOW.md) — stub module; real capability lives in Orders
- [12-QA.md](12-QA.md) — stub module; real capability lives in Orders
- [13-REVISIONS.md](13-REVISIONS.md) — stub module; real capability lives in Orders
- [14-PAYMENTS-AND-BILLING.md](14-PAYMENTS-AND-BILLING.md) — stub
- [15-ADMIN.md](15-ADMIN.md)
- [16-NOTIFICATIONS.md](16-NOTIFICATIONS.md) — email real, in-app notifications unreadable
- [17-ANALYTICS.md](17-ANALYTICS.md) — stub
- [18-AI.md](18-AI.md) — stub
- [19-WORKERS-AND-JOBS.md](19-WORKERS-AND-JOBS.md) — stub, no real consumer
- [MODULE-MATRIX.md](MODULE-MATRIX.md) — master per-module matrix (app/frontend/backend/API/DB/UI/status)

### WORKFLOWS
- [25-PRODUCT-WORKFLOWS.md](25-PRODUCT-WORKFLOWS.md) — 18 end-to-end product workflows, CURRENT vs TARGET vs GAP

### API
- [26-API.md](26-API.md) — full route-level inventory, grouped by module
- [architecture/api.md](architecture/api.md) — earlier living API reference (see note below)

### DATABASE
- [27-DATABASE.md](27-DATABASE.md) — every model, ER diagram, unused/dead schema findings

### SECURITY
- [28-SECURITY.md](28-SECURITY.md) — auth/session/OAuth/token/CORS/validation findings and known risks
- [29-ERROR-HANDLING.md](29-ERROR-HANDLING.md) — API/validation/upload/database/frontend error patterns

### UI/UX
> **⚠️ Strategy change:** the incremental design-token migration (Admin Stage 1–3) has been stopped by decision. Fotopixelz is now pursuing a **ground-up UI/UX redesign** — see `docs/24-UI-UX.md`'s strategy-change notice. `DESIGN-SYSTEM.md`'s tokens/primitives are provisional inputs, not the final system.

- [REDESIGN-DIRECTION.md](REDESIGN-DIRECTION.md) — **the current UI/UX direction.** Vision and principles for the ground-up redesign: functional foundation to preserve, Pixelz-caliber quality benchmark (without copying it), per-application direction, and what's still open. Read this first for UI/UX work.
- [CLIENT-DASHBOARD.md](CLIENT-DASHBOARD.md) — **approved, build-ready spec.** Final Client Dashboard design (Direction D v2): information architecture, every component, real CURRENT data per component, TARGET data honestly marked, responsive/empty/loading/error/hover behavior.
- [ADMIN-DASHBOARD.md](ADMIN-DASHBOARD.md) — **approved, build-ready spec.** Final Admin Dashboard design (Direction D v2, production-board layout): same structure as the Client spec, admin-specific components and data.
- [24-UI-UX.md](24-UI-UX.md) — per-app current state + strategy-change notice + prior creative-direction input that `REDESIGN-DIRECTION.md` extends
- [UI-REVIEW.md](UI-REVIEW.md) — KEEP/IMPROVE/REDESIGN per page; the FUNCTIONALITY TO KEEP column remains authoritative, the visual verdicts are superseded (treat all as REDESIGN now)
- [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) — **superseded/provisional.** Prior design-token system (Geist/Geist Mono/Instrument Serif, Electric Coral `#FF5A36`, `packages/ui` primitives) — retained as an input to the ground-up redesign (see `REDESIGN-DIRECTION.md` §7), not the final visual language.

### TESTING
- [30-TESTING.md](30-TESTING.md) — confirms zero automated tests exist anywhere in the repository

### DEPLOYMENT
- [31-DEPLOYMENT.md](31-DEPLOYMENT.md) — dev commands, Docker Compose, ports, env variable names by group
- [TECHNICAL-MATRIX.md](TECHNICAL-MATRIX.md) — code/API/DB/integration/tests/status per component

**Note on overlap with `architecture/`:** `architecture/architecture.md`, `architecture/api.md`, and `architecture/env.md` predate this numbered documentation set and are lighter-weight living references. Where they conflict with the numbered `docs/00`–`docs/31` set (which was produced by direct, exhaustive code inspection across four passes), **the numbered set is authoritative** — it supersedes `architecture/architecture.md`'s older content (e.g. that document still describes some modules as "placeholders" that are now confirmed real, and vice versa for modules confirmed still-stub). `architecture/env.md` remains the authoritative *variable-by-variable* reference with descriptions; `docs/31-DEPLOYMENT.md`'s environment section is grouped/summary-level and defers to it for detail.

---

## Claude Development Workflow

This is the permanent workflow for any implementation work on Fotopixelz, by Claude or any engineer, going forward:

1. **Identify application** — which of `apps/web`, `apps/client`, `apps/admin`, `services/api`, `apps/workers` does this task touch?
2. **Identify module** — which module doc (`docs/03`–`docs/19`) covers this area?
3. **Read relevant documentation** — the specific module doc(s), not just this index.
4. **Read architecture** — `docs/01-ARCHITECTURE.md` for how the module fits the wider system.
5. **Check CURRENT** — what actually exists today, per the module doc and `docs/MODULE-MATRIX.md`/`docs/TECHNICAL-MATRIX.md`.
6. **Check TARGET** — what's actually established as intended direction (not invented) — `docs/CURRENT-TARGET-GAP.md`, `docs/ROADMAP.md`.
7. **Identify GAP** — the specific, scoped difference between CURRENT and TARGET relevant to the requested task.
8. **Preserve existing working functionality** — anything marked KEEP in `docs/UI-REVIEW.md` or COMPLETE in the module docs must not be rewritten without a stated reason.
9. **Implement only requested scope** — do not expand into adjacent modules or unrelated cleanup.
10. **Validate** — typecheck/lint/manual verification appropriate to the change, per CLAUDE.md's existing project standards.
11. **Update documentation** — the relevant module doc, matrix rows, and `docs/PRODUCT-STATUS.md` should reflect the new CURRENT state before the task is considered finished.
12. **Continue to next module** — following the Sequential Development Rule below, not jumping ahead.

**Never treat TARGET as CURRENT.** **Never rewrite working functionality without reason.** **Never perform broad, unrelated refactors** under cover of a scoped task.

---

## Sequential Development Rule

Fotopixelz is being completed **sequentially**, per `docs/ROADMAP.md`:

```
ADMIN
  ↓
CLIENT
  ↓
MAIN WEBSITE
  ↓
BACKEND / PRODUCT GAPS
  ↓
ADVANCED PROCESSING (Payments / Editing / QA / Revisions / AI / Workers)
  ↓
PRODUCTION (Testing / Security / Performance / Deployment)
```

Do not jump randomly between applications or phases. Explicit cross-phase dependencies (e.g. Client billing UI depending on Phase 5's payments backend) are called out in `docs/ROADMAP.md` and are the only sanctioned exceptions to strict sequencing.
