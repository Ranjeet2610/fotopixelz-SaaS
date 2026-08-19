# Security

Documented directly from code in this pass. No secret values are reproduced anywhere below — only mechanisms and variable names.

## Password hashing
`bcryptjs`, cost factor `10` (`bcrypt.hash(input.password, 10)` in `auth.service.ts`). Standard, reasonable.

## Authentication (JWT)
- Custom JWT via `jsonwebtoken`, signed/verified in `packages/auth/tokens.ts`.
- Payload: `sub` (user id), `role`, `email`. No token type/audience/issuer claims observed.
- Secret: `JWT_ACCESS_SECRET` env var — signing/verification both throw if missing (`requireSecret` guard), so the app fails closed rather than silently using a default secret. Good.
- Expiry: `JWT_ACCESS_TTL`, default `15m` if unset.
- **No refresh token mechanism found** — a single short-lived access token is the entire session model. Once expired, the user must log in again (no silent renewal observed in `auth-provider.tsx`/`api-client.ts`).
- `POST /auth/logout` exists but JWTs are stateless (no server-side token blocklist/revocation observed) — logout is effectively "the client discards its copy," not "the server invalidates the token." A stolen/leaked pre-expiry token remains valid until its TTL elapses regardless of logout.

## Authorization
See `docs/02-ROLES-AND-PERMISSIONS.md` for full detail. Summary: `requireAuth` (JWT verify) + `requireAdmin` (role check) at the route level, plus ad hoc per-module role/assignment checks in service functions. A fine-grained `PERMISSION_GROUPS` system exists in `packages/auth/permissions.ts` but is **never called** anywhere in `services/api` — confirmed by repo-wide search. Not a vulnerability by itself (the ad hoc checks are real), but worth flagging as unused/misleading code.

## Session storage (frontend)
Client apps store the JWT, user object, and organization object in `localStorage` (`apps/client/src/lib/api-client.ts`: `TOKEN_STORAGE_KEY`, `USER_STORAGE_KEY`, `ORGANIZATION_STORAGE_KEY`). **`localStorage` is accessible to any JavaScript running on the page**, meaning it is vulnerable to token theft via XSS if any XSS vector exists elsewhere in the app (not itself confirmed present or absent in this pass — this is a description of the storage mechanism's inherent exposure, not a finding of an actual XSS bug). No `httpOnly` cookie-based session was found; this is a deliberate architectural choice (bearer-token API), common but with this known tradeoff.

## OAuth (Google)
Real, well-implemented PKCE + signed-state flow (`services/api/src/modules/auth/oauth-state.ts`):
- PKCE code verifier/challenge generated via `crypto.randomBytes` + SHA-256.
- State parameter is a signed payload (`nonce`, `codeVerifier`, `next`, `exp`) — HMAC-SHA256 signed with `OAUTH_STATE_SECRET`, verified with `crypto.timingSafeEqual` (constant-time comparison, correctly avoiding timing side-channels).
- State has a 10-minute TTL, checked and rejected if expired.
- **Open-redirect protection:** `sanitizeOAuthNextPath` rejects any `next` value that doesn't start with `/` or that starts with `//` (protocol-relative URL trick), falling back to `/dashboard`. This is a correct, specific defense against open-redirect via the OAuth `next` parameter.

## Email verification tokens
Stored as `emailVerificationToken` + `emailVerificationExpiresAt` directly on `User`. **Token appears to be stored/compared in plaintext** (not hashed before storage) based on the `User` model's single `emailVerificationToken` field and no observed hashing call for it in `auth.service.ts` (contrast with password-reset tokens below, which are explicitly hashed). This means a database read (e.g. via a different vulnerability, or an insider) would directly expose valid, usable verification tokens. Lower severity than password-reset token exposure would be, since verification tokens only grant email-verified status, not account takeover.

## Password reset tokens
**Hashed before storage** — `hashResetToken()` in `auth.service.ts` applies SHA-256 before persisting `passwordResetToken`, so a database read alone does not yield a usable token (the raw token, only ever sent via email, is required). This is the correct pattern, and is inconsistent with how the email-verification token is handled (see above) — worth reconciling.

## CORS
`services/api/src/app.ts`: `app.use(cors())` — **called with no configuration options**. The `cors` package's default behavior reflects the request's `Origin` header back as `Access-Control-Allow-Origin`, effectively allowing cross-origin requests from any origin with credentials-less requests (and per the `cors` package's default, `credentials` is not enabled by default either, which limits — but does not eliminate — the practical risk, since the API uses bearer tokens in headers rather than cookies for auth). Still, an explicit allowlist (e.g. restricting to `WEB_APP_URL`/`ADMIN_APP_URL`) is not configured despite those env vars existing, which is a real hardening gap for a production deployment.

## Rate limiting
`express-rate-limit` is applied specifically to auth endpoints (`auth-rate-limit.ts`): `googleOAuthRateLimiter` (20 requests / 15 min) and `authMutationRateLimiter` (10 requests / 15 min) applied to register/login/password-reset/OAuth-start/OAuth-callback. **No rate limiting was found on any other module's endpoints** (orders, uploads, etc.) — this is scoped specifically to auth abuse prevention (credential stuffing, brute force), not general API abuse.

## S3 / presigned URLs
- Uploads and deliverables both use presigned `PUT` URLs for direct-to-storage upload, with expiry controlled by `STORAGE_UPLOAD_EXPIRY_SECONDS` (default 900s) — reasonable, time-limited.
- Downloads use presigned `GET` URLs, expiry `STORAGE_DOWNLOAD_EXPIRY_SECONDS` (default 300s) — reasonable.
- **Server-side verification on completion** (`headObject` check in both `uploads.service.ts` and presumably `assets.service.ts`'s deliverable-complete path) prevents a client from marking an upload `UPLOADED` without the object actually existing — a correct anti-spoofing measure.
- Storage keys are namespaced by `organizationId`/`orderId`, limiting (but not by itself cryptographically proving) tenant isolation within the bucket.

## Input validation
Zod schemas (`.validator.ts` per module) are used consistently across every module for request-body/query validation — confirmed present in every module inspected across Pass 2 and this pass. Validation failures return `400` with flattened Zod error detail (`res.status(400).json({ success: false, errors: parsed.error.flatten() })`), consistent across controllers.

## Global error handler
`services/api/src/common/middleware/error-handler.ts` — **notably minimal**: catches any unhandled error and returns `500` with `err.message` directly exposed to the client (`err instanceof Error ? err.message : 'Internal server error'`). This means **any uncaught internal error's message text is sent verbatim to the API caller**, which could leak internal implementation detail (e.g. a raw Prisma/database error message) if a code path throws an error that isn't a handled `AppError`. Individual modules mitigate this in practice by catching and re-throwing as typed `AppError`s with intentional messages, but the fallback path itself has no message redaction.

## Environment secrets
All secrets are loaded from environment variables (`services/api/src/config/env.ts`) with empty-string fallbacks (not fabricated defaults) for genuinely secret values (`JWT_ACCESS_SECRET`, `OAUTH_STATE_SECRET`, `GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`) — meaning a misconfigured deployment fails at first use (e.g. `requireSecret` throwing) rather than silently running insecurely, for the ones that have explicit guards. No secret values appear in this documentation set, consistent with the project's own `docs/README.md` convention.

## Known risks summary
1. No refresh-token/session-revocation mechanism — logout doesn't invalidate a still-valid token.
2. `localStorage`-based token storage — standard bearer-token tradeoff, XSS-exposed if an XSS vector exists.
3. Email verification tokens appear unhashed at rest, inconsistent with the (correctly hashed) password-reset token pattern.
4. CORS has no origin allowlist configured.
5. Global error handler passes raw error messages to the client on any uncaught, non-`AppError` exception.
6. No general-purpose API rate limiting beyond the auth endpoints.

None of these were fixed in this pass, per instructions — documentation only.
