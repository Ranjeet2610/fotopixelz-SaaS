"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { DemoAccountBanner } from "@/components/demo-account-banner";
import { useOrganization } from "@/components/organization-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCreditsRemaining,
  getTrialDaysRemaining,
  isDemoTrialAccount,
} from "@/lib/workspace";

export default function Page() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const isDemo = isDemoTrialAccount(organization);
  const trialDaysRemaining = getTrialDaysRemaining(organization?.trialEndsAt);
  const creditsRemaining = getCreditsRemaining(organization);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{user?.name ? `, ${user.name}` : ""}. Your client
            workspace is ready.
          </p>
        </div>
        {isDemo ? (
          <Button
            type="button"
            variant="outline"
            disabled
            title="Upgrade flow coming soon"
          >
            Upgrade
          </Button>
        ) : null}
      </div>

      <DemoAccountBanner />

      {isDemo ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Account type</CardTitle>
              <CardDescription>Your current workspace plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="inline-flex rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-200">
                Demo Account
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trial</CardTitle>
              <CardDescription>Days left on your demo trial.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{trialDaysRemaining}</p>
              <p className="text-sm text-muted-foreground">days remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Free image credits</CardTitle>
              <CardDescription>
                Included with your demo workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{creditsRemaining}</p>
              <p className="text-sm text-muted-foreground">credits remaining</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              Track submissions and delivery status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create a draft order with the guided wizard, then upload source files.
            </p>
            <Button asChild size="sm">
              <Link href="/dashboard/orders/new">Start new order</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
            <CardDescription>Upload and review edited files.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Asset library coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
