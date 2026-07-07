import type { WorkspaceOrganization } from "./types";

export function getTrialDaysRemaining(trialEndsAt: string | null | undefined) {
  if (!trialEndsAt) {
    return 0;
  }

  const remainingMs = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

export function getCreditsRemaining(organization: WorkspaceOrganization | null | undefined) {
  if (!organization) {
    return 0;
  }

  return Math.max(0, organization.freeImageCredits - organization.usedImageCredits);
}

export function isDemoTrialAccount(organization: WorkspaceOrganization | null | undefined) {
  return organization?.plan === "DEMO" && organization?.subscriptionStatus === "TRIAL";
}

export function normalizeWorkspaceOrganization(value: unknown): WorkspaceOrganization | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.name !== "string" || typeof record.slug !== "string") {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    plan: (record.plan as WorkspaceOrganization["plan"]) ?? null,
    subscriptionStatus: (record.subscriptionStatus as WorkspaceOrganization["subscriptionStatus"]) ?? null,
    trialEndsAt:
      record.trialEndsAt instanceof Date
        ? record.trialEndsAt.toISOString()
        : typeof record.trialEndsAt === "string"
          ? record.trialEndsAt
          : null,
    freeImageCredits: Number(record.freeImageCredits ?? 0),
    usedImageCredits: Number(record.usedImageCredits ?? 0),
  };
}
