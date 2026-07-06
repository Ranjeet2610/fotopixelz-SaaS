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

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeOAuthSession, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function completeSignIn() {
      const oauthError = searchParams.get("error");
      if (oauthError) {
        if (!cancelled) {
          setError(OAUTH_ERROR_MESSAGES[oauthError] ?? OAUTH_ERROR_MESSAGES.oauth_failed);
          setProcessing(false);
        }
        return;
      }

      const token = searchParams.get("token");
      if (!token) {
        if (!cancelled) {
          setError(OAUTH_ERROR_MESSAGES.oauth_failed);
          setProcessing(false);
        }
        return;
      }

      try {
        const currentUser = await completeOAuthSession(token);
        if (!isClientRole(currentUser.role)) {
          await logout();
          router.replace("/login?staff=blocked");
          return;
        }

        const next = searchParams.get("next");
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
  }, [completeOAuthSession, logout, router, searchParams]);

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
