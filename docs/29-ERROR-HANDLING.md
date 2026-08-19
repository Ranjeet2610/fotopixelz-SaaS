# Error Handling

## API errors
Standard pattern across every module: services throw `AppError(statusCode, message)` (`services/api/src/common/errors/app-error.ts`), controllers catch and format:
```ts
if (error instanceof AppError) {
  return res.status(error.statusCode).json({ success: false, message: error.message })
}
const message = error instanceof Error ? error.message : 'Internal server error'
return res.status(500).json({ success: false, message })
```
This per-controller `sendError` pattern is duplicated across modules (confirmed identical in `categories.controller.ts` and structurally the same elsewhere) rather than centralized — functionally consistent, but a repeated block rather than a shared helper.

**Global fallback:** `services/api/src/common/middleware/error-handler.ts` catches anything that reaches Express's error-handling chain (i.e. errors passed to `next(err)` rather than caught locally) and returns `500` with the raw `err.message` — see `docs/28-SECURITY.md` for the message-leakage implication.

## Validation errors
Zod-based, consistent shape across all modules: `400` with `{ success: false, errors: parsed.error.flatten() }`. The client maps this generically — `apps/client/src/lib/api-client.ts`'s `extractErrorMessage` turns any `errors` payload into a fixed string ("Please check the highlighted form values.") rather than surfacing field-specific messages, meaning **detailed Zod validation errors are discarded client-side** even though the API returns them with full field-level detail.

## Auth errors
- `401 Unauthorized` — missing/invalid/expired JWT (`requireAuth` in `packages/auth/middleware.ts`), or missing `JWT_ACCESS_SECRET` config (`500` instead, since that's a server misconfiguration not a client error — correctly distinguished).
- `403 Forbidden` — role/permission/ownership failures (`requireAdmin`, and the many inline `AppError(403, 'Forbidden')` throws across `orders.service.ts`, `admin.permissions.ts`, `organizations.service.ts`).
- Client-side: `apps/client/src/components/auth-pages.tsx` maps a specific `403` + `"Account is inactive"` combination to a friendlier message; all other auth errors fall through to the raw API message.

## Upload errors
- **Client-side retry loop is the primary error-handling mechanism** — `order-upload-panel.tsx` catches XHR failures per-file, stores `{ status: 'failed', error: message }` on the local item, and offers a manual **Retry** button that re-runs the same presigned-URL → PUT → complete sequence.
- **Server-side verification failure** (`headObject` check finding no object, or a zero-length object) results in `status: 'FAILED'` on the `Upload` record itself — not a thrown error — allowing the object to exist in a known bad state that the client can detect and offer retry for, rather than a hard 500.
- Network aborts (`AbortController`, used when a user removes an in-progress upload) are explicitly distinguished from real failures (`DOMException` named `'AbortError'` is caught and treated as a silent no-op, not shown as an error) — a correct, deliberate distinction.

## Database errors
No custom Prisma error-code handling (e.g. mapping `P2002` unique-constraint violations to a specific friendly message) was found in the modules inspected — a raw Prisma error thrown from, say, a duplicate-slug creation attempt would fall through to the generic `500`/raw-message path described above, rather than a targeted `409 Conflict`-style response. This is consistent with the "global error handler has no redaction" finding in `docs/28-SECURITY.md`.

## Frontend error states
Consistently implemented across the client app's real (non-stub) pages:
- Inline `role="alert"` destructive-styled banners for request-level errors (order wizard, upload panel, assets page, order detail).
- Field-level error text under individual form inputs (`auth-pages.tsx`'s `FormField` component).
- A shared `ApiError` class (`apps/client/src/lib/api-client.ts`) distinguishes API-thrown errors (with a real status code and message) from generic JS `Error`s, and every consuming component follows the same `caught instanceof ApiError ? caught.message : caught instanceof Error ? caught.message : 'fallback string'` pattern — this exact three-way fallback is repeated verbatim across many components rather than extracted into a shared helper, a minor duplication (not a bug).

## Loading states
Consistently implemented via a shared `LoadingBlock` component (`apps/client/src/components/loading-block.tsx`) across dashboard/orders/assets/wizard/marketing pages — a real, reused pattern, not ad hoc per-page loading text.

## Retry behavior
- **Uploads:** explicit, real per-file retry (see above) — the only module with a first-class retry UI.
- **Everything else** (order list/detail/assets fetch failures, organization load failures): no retry button — the error banner is shown, and the only recovery path is a manual page refresh or navigation. This is a real, consistent gap across the client app outside the upload flow.

## Inconsistencies identified
1. **Detailed Zod field errors are thrown away client-side** — the API does the work of returning field-level validation detail, and the client discards it for a generic message.
2. **Email verification vs. password reset token handling differs** in whether the token is hashed at rest (see `docs/28-SECURITY.md`) — not an error-handling inconsistency per se, but a related data-handling inconsistency worth noting here too.
3. **Retry is only implemented for uploads** — every other data-fetch failure in the client app has no retry affordance, despite the same `LoadingBlock`/error-banner pattern being reusable for one.
4. **The `sendError` catch-format block is duplicated per-controller** rather than centralized, though its behavior is consistent across modules (a maintenance/DRY concern, not a correctness bug).
5. **No error-code-specific handling for common database failures** (unique constraint, foreign key violation) — these surface as generic 500s with a raw Prisma message rather than a targeted 4xx response.
