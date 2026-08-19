import { Suspense } from "react";
import { AuthPage } from "@/components/auth-pages";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="auth-screen">Loading password reset...</main>}>
      <AuthPage mode="reset" />
    </Suspense>
  );
}
