import { Suspense } from "react";
import { AuthPage } from "@/components/auth-pages";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth-screen">Loading sign in...</main>}>
      <AuthPage mode="login" />
    </Suspense>
  );
}
