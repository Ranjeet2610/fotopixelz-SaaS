-- Data-only backfill (no schema change).
--
-- emailVerifiedAt was introduced in 20260706120000_auth_oauth_email_verification
-- as a bare nullable column with no backfill, so every account that existed
-- before that migration has emailVerifiedAt = NULL — indistinguishable from a
-- genuinely unverified new signup.
--
-- This migration grandfathers every account that already exists at the moment
-- it runs (password-based accounts only; Google-linked accounts already have
-- their own verification signal from Google and are unaffected by this
-- statement since it only touches rows where emailVerifiedAt IS NULL AND a
-- password is set). This must run before any deploy that enforces email
-- verification at login, otherwise every pre-existing user is locked out.
--
-- Safe to leave in place even if login-time enforcement is later rolled back:
-- it only ever marks existing accounts as verified, never removes access.
UPDATE "User"
SET "emailVerifiedAt" = "createdAt"
WHERE "emailVerifiedAt" IS NULL
  AND "password" IS NOT NULL;
