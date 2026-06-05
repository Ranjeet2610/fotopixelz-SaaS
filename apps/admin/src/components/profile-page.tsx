"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { dateValue, textValue } from "@/lib/format";
import type { ApiRecord, SessionUser } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { useApiResource } from "./data-hooks";
import {
  Button,
  Card,
  ErrorBanner,
  FormActions,
  FormShell,
  LoadingBlock,
  PageHeader,
  RoleBadge,
  StatusBadge,
  SuccessBanner,
  TextField,
} from "./ui";

export function ProfilePage() {
  const { updateLocalUser } = useAuth();
  const me = useApiResource<ApiRecord>("/users/me");
  const billing = useApiResource<ApiRecord>("/users/me/billing");
  const credits = useApiResource<ApiRecord>("/users/me/credits");
  const [name, setName] = useState("");
  const [billingForm, setBillingForm] = useState({
    companyName: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    taxId: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me.data) {
      setName(textValue(me.data.name, ""));
    }
  }, [me.data]);

  useEffect(() => {
    if (billing.data) {
      setBillingForm({
        companyName: textValue(billing.data.companyName, ""),
        address: textValue(billing.data.address, ""),
        city: textValue(billing.data.city, ""),
        country: textValue(billing.data.country, ""),
        postalCode: textValue(billing.data.postalCode, ""),
        taxId: textValue(billing.data.taxId, ""),
      });
    }
  }, [billing.data]);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const updated = await apiRequest<SessionUser>("/users/me", { method: "PATCH", body: { name } });
      updateLocalUser(updated);
      setMessage("Profile updated.");
      me.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Profile update failed");
    }
  }

  async function updateBilling(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await apiRequest("/users/me/billing", { method: "PATCH", body: billingForm });
      setMessage("Billing profile updated.");
      billing.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Billing update failed");
    }
  }

  function updateBillingField(key: keyof typeof billingForm, value: string) {
    setBillingForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="stack-xl">
      <PageHeader eyebrow="Account" title="Profile" description="Manage your operations account and billing profile." />
      <ErrorBanner message={me.error ?? billing.error ?? credits.error ?? error} />
      <SuccessBanner message={message} />

      <section className="detail-grid">
        <Card>
          <h2 className="section-title">Account</h2>
          {me.loading ? (
            <LoadingBlock />
          ) : (
            <div className="stack-lg">
              <dl className="detail-list">
                <div>
                  <dt>Email</dt>
                  <dd>{textValue(me.data?.email)}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>
                    <RoleBadge value={textValue(me.data?.role)} />
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <StatusBadge value={me.data?.isActive === false ? "INACTIVE" : "ACTIVE"} />
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{dateValue(me.data?.createdAt)}</dd>
                </div>
              </dl>
              <FormShell onSubmit={updateProfile}>
                <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
                <FormActions>
                  <Button type="submit">Save profile</Button>
                </FormActions>
              </FormShell>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="section-title">Credits</h2>
          {credits.loading ? <LoadingBlock /> : <p className="credit-balance">{textValue(credits.data?.balance, "0")}</p>}
        </Card>
      </section>

      <Card>
        <h2 className="section-title">Billing profile</h2>
        <FormShell onSubmit={updateBilling}>
          <div className="form-grid two">
            <TextField label="Company name" value={billingForm.companyName} onChange={(event) => updateBillingField("companyName", event.target.value)} />
            <TextField label="Tax ID" value={billingForm.taxId} onChange={(event) => updateBillingField("taxId", event.target.value)} />
            <TextField label="Address" value={billingForm.address} onChange={(event) => updateBillingField("address", event.target.value)} />
            <TextField label="City" value={billingForm.city} onChange={(event) => updateBillingField("city", event.target.value)} />
            <TextField label="Country" value={billingForm.country} onChange={(event) => updateBillingField("country", event.target.value)} />
            <TextField label="Postal code" value={billingForm.postalCode} onChange={(event) => updateBillingField("postalCode", event.target.value)} />
          </div>
          <FormActions>
            <Button type="submit">Save billing</Button>
          </FormActions>
        </FormShell>
      </Card>
    </div>
  );
}
