"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { useAuth } from "@/components/auth-provider";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isClientRole, routeAfterAuth } from "@/lib/access-control";
import { ApiError } from "@/lib/api-client";
import { startGoogleOAuth } from "@/lib/google-auth";
import { cn } from "@/lib/utils";

const STAFF_BLOCKED_MESSAGE = "Operations sign-in is available in the admin app.";
const fieldClassName =
  "h-12 rounded-xl border-border/80 bg-background px-4 text-sm shadow-sm placeholder:text-muted-foreground/80";

function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  error?: string | null;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(fieldClassName, error && "border-destructive/50")}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("staff") === "blocked" ? STAFF_BLOCKED_MESSAGE : null,
  );

  useEffect(() => {
    if (!loading && user && isClientRole(user.role)) {
      router.replace(routeAfterAuth(user.role, searchParams.get("next")));
    }
  }, [loading, user, router, searchParams]);

  function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    startGoogleOAuth(searchParams.get("next"));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const currentUser = await login({ email, password });
      if (!isClientRole(currentUser.role)) {
        await logout();
        setError(STAFF_BLOCKED_MESSAGE);
        return;
      }
      router.replace(routeAfterAuth(currentUser.role, searchParams.get("next")));
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) {
        setError("Your account is inactive. Contact support for help.");
      } else {
        setError(caught instanceof Error ? caught.message : "Sign in failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your client workspace to manage orders and deliverables."
    >
      <div className="space-y-6">
        {error ? <AuthAlert message={error} /> : null}

        <GoogleAuthButton
          onClick={handleGoogleSignIn}
          disabled={submitting || loading}
          loading={googleLoading}
        />

        <AuthDivider />

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
          <Button
            className="h-12 w-full rounded-xl text-sm font-medium shadow-sm"
            type="submit"
            disabled={submitting || loading || googleLoading}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href="/register"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, register } = useAuth();
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && isClientRole(user.role)) {
      router.replace(routeAfterAuth(user.role, searchParams.get("next")));
    }
  }, [loading, user, router, searchParams]);

  function handleGoogleSignUp() {
    setGoogleLoading(true);
    setError(null);
    startGoogleOAuth(searchParams.get("next"));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setConfirmError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const currentUser = await register({
        name: name.trim() || undefined,
        organizationName: organizationName.trim() || undefined,
        email,
        password,
      });
      router.replace(routeAfterAuth(currentUser.role, searchParams.get("next")));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      description="Start your client workspace and submit your first production order."
    >
      <div className="space-y-6">
        {error ? <AuthAlert message={error} /> : null}

        <GoogleAuthButton
          onClick={handleGoogleSignUp}
          disabled={submitting || loading}
          loading={googleLoading}
        />

        <AuthDivider />

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            id="name"
            label="Name"
            value={name}
            onChange={setName}
            autoComplete="name"
          />
          <FormField
            id="organizationName"
            label="Workspace name"
            value={organizationName}
            onChange={setOrganizationName}
            autoComplete="organization"
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
          />
          <FormField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
            error={confirmError}
          />
          <Button
            className="h-12 w-full rounded-xl text-sm font-medium shadow-sm"
            type="submit"
            disabled={submitting || loading || googleLoading}
          >
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
