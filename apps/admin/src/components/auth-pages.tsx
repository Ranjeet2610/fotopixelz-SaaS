"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { routeAfterAuth } from "@/lib/access-control";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "./auth-provider";
import { Button, ErrorBanner, SuccessBanner, TextField } from "./ui";

type AuthMode = "login" | "forgot" | "reset";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("client") === "blocked" ? "Client workspace is available in the web app." : null,
  );
  const [success, setSuccess] = useState<string | null>(null);

  const title = useMemo(() => {
    if (mode === "forgot") return "Reset your password";
    if (mode === "reset") return "Set a new password";
    return "Operations sign in";
  }, [mode]);

  useEffect(() => {
    if (!loading && user && mode === "login") {
      if (user.role === "CLIENT") {
        void logout().finally(() => {
          setError("Client workspace is available in the web app.");
        });
        return;
      }

      router.replace(routeAfterAuth(user.role, searchParams.get("next")));
    }
  }, [loading, user, mode, logout, router, searchParams]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const currentUser = await login({ email, password });
      if (currentUser.role === "CLIENT") {
        await logout();
        setError("Client workspace is available in the web app.");
        return;
      }
      router.replace(routeAfterAuth(currentUser.role, searchParams.get("next")));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setSuccess("If this email exists, a reset link has been sent.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Password reset request failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: { token, password },
      });
      setSuccess("Password reset successful. You can sign in now.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Password reset failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-visual">
        <div className="auth-visual-content">
          <p>Fotopixelz Operations</p>
          <h1>Production control for image editing workflows.</h1>
        </div>
      </section>
      <section className="auth-panel">
        <div className="brand-mark">fotopixelz</div>
        <div className="auth-copy">
          <h2>{title}</h2>
          <p>Internal access for operations, editing, QA, and administration teams.</p>
        </div>

        <ErrorBanner message={error} />
        <SuccessBanner message={success} />

        {mode === "login" ? (
          <form className="auth-form" onSubmit={submitLogin}>
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? "Signing in" : "Sign in"}
            </Button>
            <Link className="auth-link" href="/forgot-password">
              Forgot password?
            </Link>
          </form>
        ) : null}

        {mode === "forgot" ? (
          <form className="auth-form" onSubmit={submitForgot}>
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending link" : "Send reset link"}
            </Button>
            <Link className="auth-link" href="/login">
              Back to sign in
            </Link>
          </form>
        ) : null}

        {mode === "reset" ? (
          <form className="auth-form" onSubmit={submitReset}>
            <TextField
              label="Reset token"
              name="token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
            />
            <TextField
              label="New password"
              name="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating password" : "Update password"}
            </Button>
            <Link className="auth-link" href="/login">
              Back to sign in
            </Link>
          </form>
        ) : null}
      </section>
    </main>
  );
}
