import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<main className="guard-screen">Loading admin...</main>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
