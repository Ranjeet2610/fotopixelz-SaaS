"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { useAuth } from "@/components/auth-provider";
import { AuthLayout } from "@/components/auth-layout";
import { LoadingBlock } from "@/components/loading-block";
import { Button } from "@/components/ui/button";
import { isClientRole, routeAfterAuth } from "@/lib/access-control";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Google sign-in could not be completed. Please try again.",
  account_inactive: "Your account is inactive. Contact support for help.",
};

// The OAuth handoff code is single-use (services/api consumes it via Redis
// GETDEL) and must never be re-submitted. A component-scoped guard (e.g.
// useRef) cannot enforce that on its own: React development StrictMode
// deliberately mounts -> cleans up -> remounts this component once, and the
// second mount gets a fresh ref. Module scope survives that remount (only
// the component function and hooks are re-invoked, not the module), so it's
// the correct place for the "has this exact code already been submitted"
// check — this is the standard idiom for a non-idempotent one-time action
// inside an effect, not a stopgap.
const submittedCodes = new Set<string>();

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeOAuthSession, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Capture everything the effect needs from the URL up front, then strip
    // the code (and error/next) from the address bar and history immediately
    // — before any network request starts, not after it resolves. The code
    // is a one-time secret; it shouldn't sit visible in the URL/history for
    // the duration of the exchange, and it shouldn't be re-readable by a
    // later render/remount once we've captured it.
    const oauthError = searchParams.get("error");
    const code = searchParams.get("code");
    const next = searchParams.get("next");

    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    async function completeSignIn() {
      if (oauthError) {
        if (!cancelled) {
          setError(OAUTH_ERROR_MESSAGES[oauthError] ?? OAUTH_ERROR_MESSAGES.oauth_failed);
          setProcessing(false);
        }
        return;
      }

      if (!code) {
        if (!cancelled) {
          setError(OAUTH_ERROR_MESSAGES.oauth_failed);
          setProcessing(false);
        }
        return;
      }

      if (submittedCodes.has(code)) {
        // Already submitted this exact single-use code (StrictMode remount)
        // — skip the redundant exchange instead of resending an
        // already-consumed code and rendering a spurious failure.
        return;
      }
      submittedCodes.add(code);

      try {
        const currentUser = await completeOAuthSession(code);
        if (!isClientRole(currentUser.role)) {
          await logout();
          router.replace("/login?staff=blocked");
          return;
        }

        router.replace(routeAfterAuth(currentUser.role, next));
      } catch {
        if (!cancelled) {
          setError(OAUTH_ERROR_MESSAGES.oauth_failed);
          setProcessing(false);
        }
      }
    }

    void completeSignIn();

    return () => {
      cancelled = true;
    };
    // Intentionally run once per mount only: the code/next/error are read
    // directly from the URL a single time above, not re-derived from
    // `searchParams` on every dependency change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (processing && !error) {
    return (
      <AuthLayout
        title="Signing you in"
        description="Completing Google authentication and loading your workspace."
      >
        <LoadingBlock label="Finalizing sign in..." />
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout
        title="Sign in failed"
        description="We couldn't complete Google authentication."
      >
        <div className="space-y-4">
          <AuthAlert message={error} />
          <Button asChild className="h-12 w-full rounded-xl text-sm font-medium shadow-sm">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return null;
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Signing you in" description="Please wait a moment.">
          <LoadingBlock label="Loading..." />
        </AuthLayout>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
