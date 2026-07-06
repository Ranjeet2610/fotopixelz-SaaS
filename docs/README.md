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
