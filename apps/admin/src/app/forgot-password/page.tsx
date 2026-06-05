import { Suspense } from "react";
import { AuthPage } from "@/components/auth-pages";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<main className="auth-screen">Loading password reset...</main>}>
      <AuthPage mode="forgot" />
    </Suspense>
  );
}
