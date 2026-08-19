# Authentication

## Purpose
Identity, session, and access control for both the client application (`apps/client`) and admin application (`apps/admin`), backed by `services/api/src/modules/auth`.

## Users / Roles
All roles (`CLIENT`, `EDITOR`, `QA`, `ADMIN`, `SUPER_ADMIN`) authenticate through the same API auth endpoints. `apps/client` accepts only `CLIENT` role sessions (staff roles are blocked client-side and logged out with `?staff=blocked`). `apps/admin` is for staff roles.

## Current Implementation
Real, working implementation — not scaffolding. Verified functions in `auth.service.ts`: `register`, `login`, `getCurrentUser`, `forgotPassword`, `resetPassword`, plus controller-level handlers for Google OAuth, email verification, resend-verification, logout, and `/me`.

## Frontend
- `apps/client/src/app/{login,register}/page.tsx` → `apps/client/src/components/auth-pages.tsx`
- `apps/client/src/components/auth-provider.tsx` — holds session state, calls `apiRequest`, persists token/user/org to `localStorage`
- `apps/client/src/app/auth/callback/page.tsx` — OAuth callback landing
- `apps/admin/src/app/{login,forgot-password,reset-password}/page.tsx` + `apps/admin/src/components/auth-pages.tsx`, `auth-provider.tsx` (separate implementation from client, not shared)

## Backend
`services/api/src/modules/auth/`: `auth.controller.ts`, `auth.routes.ts`, `auth.service.ts`, `auth.validator.ts`, `google-oauth.service.ts`, `oauth-state.ts`, `oauth-handoff.ts`, `email-verification.service.ts`, `client-workspace.ts`, `client-workspace-bootstrap.ts`, `auth-rate-limit.ts`. Shared JWT helpers in `packages/auth` (`requireAuth`, `requireAdmin`, `requireRole`).

## Database
`User` (email, password hash, googleId, role, emailVerifiedAt + token/expiry, passwordResetToken + expiry, isActive), `Organization`, `Membership` (created together on client registration — see Workflow).

## APIs
`GET /auth/health`, `GET /auth/google`, `GET /auth/google/callback`, `POST /auth/oauth/exchange`, `GET /auth/verify-email`, `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/resend-verification` (authed), `POST /auth/resend-verification-email` (unauthed), `GET /auth/me` (authed), `POST /auth/logout` (authed).

## Business Rules
- Registering a client (`CLIENT` role) atomically creates a `User`, a new `Organization` (DEMO plan, TRIAL subscription status, free image credits per `client-workspace.ts` constants), and an `OWNER` `Membership` — one org per new client, created in the same transaction (`client-workspace-bootstrap.ts`).
- Email verification is enforced at login (per `ENFORCE_EMAIL_VERIFICATION` env kill-switch, default enabled) — confirmed by CLAUDE.md and the client's "Account created — check your email" login notice flow.
- Staff roles (`EDITOR`, `QA`, `ADMIN`, `SUPER_ADMIN`) are rejected by `apps/client`'s login page (logged out immediately, redirected with `staff=blocked`), even though the API itself doesn't scope `/auth/login` by app.
- Auth mutation endpoints (`register`, `login`, `forgot-password`, `reset-password`, `resend-verification*`, Google OAuth start/callback) are rate-limited (`auth-rate-limit.ts`).

## Workflow
1. **Register:** `POST /auth/register` → creates `User` + `Organization` + `Membership` (client) → sends verification email → client shown "check your email" notice.
2. **Login:** `POST /auth/login` → validates credentials, verifies `emailVerifiedAt` is set (if enforcement enabled) → issues JWT bearer token.
3. **Google OAuth:** `GET /auth/google` starts the flow with a signed state (`oauth-state.ts`) → Google redirects to `GET /auth/google/callback` → `POST /auth/oauth/exchange` completes session issuance client-side via `apps/client/src/app/auth/callback/page.tsx`.
4. **Email verification:** verification token/expiry stored on `User`; `GET /auth/verify-email?token=` marks `emailVerifiedAt`.
5. **Password reset:** `forgotPassword` issues `passwordResetToken`/expiry + email; `resetPassword` consumes the token.
6. **Session:** JWT bearer token stored in `localStorage` on the client (`TOKEN_STORAGE_KEY`), attached as `Authorization: Bearer <token>` by `apiRequest`. No refresh-token rotation observed — `JWT_ACCESS_TTL` (default `15m`) governs expiry.
7. **Protected routes:** `apps/client`'s `ClientShell` and `apps/admin`'s equivalent guard redirect unauthenticated users to `/login?next=<path>`; server-side, `requireAuth`/`requireAdmin` middleware gates API routes per-router.
8. **Logout:** `POST /auth/logout` (server-side, purpose not fully re-verified this pass — likely a no-op/audit hook since JWTs are stateless) + client clears `localStorage`.

## Permissions
- Public (no auth): register, login, forgot/reset password, Google OAuth start/callback, resend-verification-by-email, `GET /auth/health`.
- Authenticated only: `/auth/me`, `/auth/logout`, `/auth/resend-verification`.
- Role distinction (CLIENT vs staff) is enforced in the **frontend**, not by a role-gated auth endpoint — the API's `/auth/login` itself will authenticate any role.

## Validation
Zod-based validators in `auth.validator.ts` (not individually enumerated this pass — schema-driven per the module-per-domain convention used throughout `services/api`).

## Error Handling
Thrown `AppError`s formatted by `common/middleware/error-handler.ts`; client surfaces messages via `ApiError` (e.g. "Account is inactive" mapped to a specific client-side message in `auth-pages.tsx`).

## Dependencies
`packages/auth` (JWT), `packages/email` (verification/reset emails, Resend), `auth-provider.tsx`/`organization-provider.tsx` on the client, `client-workspace.ts` for org bootstrap logic.

## Current Status
**COMPLETE** — credential auth, Google OAuth, email verification, password reset, and client-side route protection are all implemented and functionally connected, not placeholders.

## Known Limitations
- No visible refresh-token mechanism — sessions rely on a single access token with a fixed TTL.
- Admin app maintains a fully separate `auth-provider.tsx`/`auth-pages.tsx` implementation from the client app rather than a shared package, despite both talking to the same `/auth/*` endpoints.
- Role gating between "client app" and "admin app" logins happens client-side, not via separate API surfaces.

## Target
Not established in current codebase beyond what's implemented.

## Gap
No formally documented gap beyond the limitations above — this module was assessed as functionally complete for its current scope.
