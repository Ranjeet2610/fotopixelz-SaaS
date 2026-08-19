# Testing

## What actually exists

**No automated tests exist anywhere in this repository.** Verified by direct search in this pass:
- No files matching `*.test.ts`, `*.spec.ts`, or `*.test.tsx` anywhere outside `node_modules`.
- No test-related directories (`__tests__`, `test/`, `tests/`, `e2e/`) found outside `node_modules`.
- No `jest.config.*`, `vitest.config.*`, or `playwright.config.*` found anywhere in the repository.
- No `"test"` script defined in the root `package.json` or any workspace package's `package.json` (`services/api`, `apps/client`, `apps/admin`, `apps/workers` all checked — none define a `test` script).
- CLAUDE.md itself states: *"There is no test runner configured in any package.json yet — do not assume Jest/Vitest exist; check the specific package before writing tests."* This documentation pass independently confirms that statement is accurate.

## Unit tests
None.

## Integration tests
None.

## API tests
None. No Postman/Insomnia collection, no supertest-based route tests, nothing.

## E2E tests
None. No Playwright/Cypress configuration or spec files.

## Frontend tests
None. No React Testing Library / component test files in `apps/client` or `apps/admin`.

## Test scripts
None defined at the root or in any workspace package.

## Coverage
Not applicable — there is nothing to measure coverage of.

## Manual QA
The only testing-adjacent artifact in the repository is `docs/testing/ORDER_COMMENTS_TESTING_CHECKLIST.md` (referenced in Pass 1/`docs/README.md`) — a manual QA checklist for the order comments/collaboration module, not an automated test.

## Assessment
This is a genuine, significant gap. Every module documented as COMPLETE in Pass 2 (`docs/MODULE-MATRIX.md`) — including the business-critical order state machine, pricing calculation, and upload/asset presigned-URL flows — has **zero automated regression protection**. Any future change to `orders.service.ts`'s status-transition logic, `pricing.service.ts`'s quote calculation, or the upload verification flow carries full risk of silent regression, detectable only by manual testing or production incidents.

This documentation pass does not create tests (out of scope per instructions), but flags this as the single highest-leverage engineering investment available given how much real, working business logic already exists and currently has no safety net.
