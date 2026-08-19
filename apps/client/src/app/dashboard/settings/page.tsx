"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useOrganization } from "@/components/organization-provider";
import { LoadingBlock } from "@/components/loading-block";
import { Button } from "@/components/ui/button";
import { formatOrderDate } from "@/lib/order-status";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3.5 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="border-b border-border pb-2.5">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Client",
};

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const router = useRouter();

  if (authLoading || orgLoading || !user) {
    return <LoadingBlock label="Loading settings..." />;
  }

  const initial = (user.name ?? user.email).charAt(0).toUpperCase();

  const handleSignOut = () => {
    void logout().finally(() => router.replace("/login"));
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Account</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Your profile and workspace details.</p>
      </div>

      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium">{user.name ?? user.email}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Section title="Profile" description="Your account identity.">
        <Row label="Name" value={user.name ?? "—"} />
        <Row label="Email" value={user.email} />
        <Row label="Role" value={ROLE_LABELS[user.role] ?? user.role} />
      </Section>

      <Section title="Organization" description="The workspace this account belongs to.">
        <Row label="Workspace" value={organization?.name ?? "—"} />
        <Row label="Workspace URL" value={organization?.slug ? `${organization.slug}` : "—"} />
        <Row label="Plan" value={organization?.plan ?? "—"} />
        <Row label="Status" value={organization?.subscriptionStatus ?? "—"} />
        {organization?.trialEndsAt ? (
          <Row label="Trial ends" value={formatOrderDate(organization.trialEndsAt)} />
        ) : null}
      </Section>

      <Section title="Security" description="Manage access to this account.">
        <div className="flex items-center justify-between py-3.5">
          <span className="text-sm text-muted-foreground">Signed in as {user.email}</span>
          <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </Section>
    </div>
  );
}
