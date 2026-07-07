import { Suspense, type ReactNode } from "react";
import { ClientShell } from "@/components/client-shell";
import { LoadingBlock } from "@/components/loading-block";
import { OrganizationProvider } from "@/components/organization-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <OrganizationProvider>
      <Suspense fallback={<LoadingBlock label="Loading workspace..." />}>
        <ClientShell>{children}</ClientShell>
      </Suspense>
    </OrganizationProvider>
  );
}
