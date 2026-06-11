"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { isClientRole, routeAfterAuth } from "@/lib/access-control";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const STAFF_BLOCKED_MESSAGE = "Operations sign-in is available in the admin app.";

function AuthAlert({ message, variant }: { message: string; variant: "error" | "success" }) {
  const styles =
    variant === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles}`} role="alert">
      {message}
    </div>
  );
}

function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
      />
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
  const [error, setError] = useState<string | null>(
    searchParams.get("staff") === "blocked" ? STAFF_BLOCKED_MESSAGE : null,
  );

  useEffect(() => {
    if (!loading && user && isClientRole(user.role)) {
      router.replace(routeAfterAuth(user.role, searchParams.get("next")));
    }
  }, [loading, user, router, searchParams]);

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
      title="Sign in"
      description="Access your client workspace to manage orders and assets."
    >
      {error ? <AuthAlert message={error} variant="error" /> : null}

      <Card>
        <CardContent className="pt-4">
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
            <Button className="w-full" type="submit" disabled={submitting || loading}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/register">
          Create an account
        </Link>
      </p>
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && isClientRole(user.role)) {
      router.replace(routeAfterAuth(user.role, searchParams.get("next")));
    }
  }, [loading, user, router, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

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
      title="Create account"
      description="Register as a client to start submitting image editing orders."
    >
      {error ? <AuthAlert message={error} variant="error" /> : null}

      <Card>
        <CardContent className="pt-4">
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
            <p className="text-xs text-muted-foreground">Password must be at least 8 characters.</p>
            <Button className="w-full" type="submit" disabled={submitting || loading}>
              {submitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
