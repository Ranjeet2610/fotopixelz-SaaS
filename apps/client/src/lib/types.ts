export type Role = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "QA" | "CLIENT";

export type OrganizationPlan = "DEMO";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export type SessionUser = {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
};

export type WorkspaceOrganization = {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan | null;
  subscriptionStatus: SubscriptionStatus | null;
  trialEndsAt: string | null;
  freeImageCredits: number;
  usedImageCredits: number;
};

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
};
