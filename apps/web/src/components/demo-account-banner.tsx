"use client";

import { getCreditsRemaining, getTrialDaysRemaining, isDemoTrialAccount } from "@/lib/workspace";
import { useOrganization } from "@/components/organization-provider";
import { Button } from "@/components/ui/button";

export function DemoAccountBanner() {
  const { organization, loading } = useOrganization();

  if (loading || !isDemoTrialAccount(organization)) {
    return null;
  }

  const trialDaysRemaining = getTrialDaysRemaining(organization?.trialEndsAt);
  const creditsRemaining = getCreditsRemaining(organization);

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-200">
              Demo Account
            </span>
            <span className="text-sm text-muted-foreground">{organization?.name}</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <p>
              <span className="font-medium">{trialDaysRemaining}</span> trial day
              {trialDaysRemaining === 1 ? "" : "s"} remaining
            </p>
            <p>
              <span className="font-medium">{creditsRemaining}</span> free image credit
              {creditsRemaining === 1 ? "" : "s"} remaining
            </p>
          </div>
        </div>

        <Button type="button" variant="outline" disabled title="Upgrade flow coming soon">
          Upgrade
        </Button>
      </div>
    </section>
  );
}
