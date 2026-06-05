"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { isManagementRole } from "@/lib/access-control";
import { dateValue, getId, nestedText, textValue, toSlug } from "@/lib/format";
import type { ApiRecord, Role } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { useApiList } from "./data-hooks";
import {
  Button,
  Card,
  DataTable,
  ErrorBanner,
  FormActions,
  FormShell,
  LoadingBlock,
  Modal,
  PageHeader,
  PermissionNotice,
  RoleBadge,
  SelectField,
  StatusBadge,
  SuccessBanner,
  TextField,
} from "./ui";

const membershipRoles: Role[] = ["CLIENT", "EDITOR", "QA", "ADMIN", "SUPER_ADMIN"];

export function OrganizationsPage() {
  const { user } = useAuth();
  const canManage = isManagementRole(user?.role);
  const { data, loading, error, reload } = useApiList<ApiRecord>(
    "/organizations",
    { includeInactive: true },
    canManage,
  );
  const [editing, setEditing] = useState<ApiRecord | "new" | null>(null);
  const [membersOrg, setMembersOrg] = useState<ApiRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function deactivate(id: string) {
    setActionError(null);
    setMessage(null);
    try {
      await apiRequest(`/organizations/${id}`, { method: "DELETE" });
      setMessage("Organization deactivated.");
      reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Organization update failed");
    }
  }

  if (!canManage) {
    return <PermissionNotice />;
  }

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Accounts"
        title="Organizations"
        description="Manage customer organizations and internal membership access."
        actions={<Button onClick={() => setEditing("new")}>Create organization</Button>}
      />

      <ErrorBanner message={error ?? actionError} />
      <SuccessBanner message={message} />

      <Card>
        {loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={data.items}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No organizations found."
            columns={[
              { key: "name", label: "Organization", render: (row) => <strong>{textValue(row.name)}</strong> },
              { key: "slug", label: "Slug", render: (row) => textValue(row.slug) },
              { key: "members", label: "Members", render: (row) => String(Array.isArray(row.memberships) ? row.memberships.length : 0) },
              { key: "status", label: "Status", render: (row) => <StatusBadge value={row.isActive === false ? "INACTIVE" : "ACTIVE"} /> },
              { key: "created", label: "Created", render: (row) => dateValue(row.createdAt) },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <div className="row-actions">
                    <Button size="sm" variant="secondary" onClick={() => setMembersOrg(row)}>
                      Members
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(row)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void deactivate(getId(row))}>
                      Disable
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <OrganizationModal
        value={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setMessage("Organization saved.");
          reload();
        }}
        onError={setActionError}
      />

      <MembershipModal
        organization={membersOrg}
        onClose={() => setMembersOrg(null)}
        onChanged={() => {
          setMessage("Memberships updated.");
          reload();
        }}
        onError={setActionError}
      />
    </div>
  );
}

function OrganizationModal({
  value,
  onClose,
  onSaved,
  onError,
}: {
  value: ApiRecord | "new" | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const editing = value && value !== "new";

  useEffect(() => {
    if (value === "new") {
      setName("");
      setSlug("");
      setIsActive(true);
    } else if (value) {
      setName(textValue(value.name, ""));
      setSlug(textValue(value.slug, ""));
      setIsActive(value.isActive !== false);
    }
  }, [value]);

  useEffect(() => {
    if (value === "new") {
      setSlug(toSlug(name));
    }
  }, [name, value]);

  if (!value) {
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    onError(null);

    try {
      const body = { name, slug, isActive };
      if (editing) {
        await apiRequest(`/organizations/${getId(value)}`, { method: "PATCH", body });
      } else {
        await apiRequest("/organizations", { method: "POST", body });
      }
      onSaved();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Organization save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(value)} title={editing ? "Edit organization" : "Create organization"} onClose={onClose}>
      <FormShell onSubmit={submit}>
        <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <TextField label="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} required />
        <SelectField label="Status" value={isActive ? "ACTIVE" : "INACTIVE"} onChange={(event) => setIsActive(event.target.value === "ACTIVE")}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </SelectField>
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving" : "Save organization"}
          </Button>
        </FormActions>
      </FormShell>
    </Modal>
  );
}

function MembershipModal({
  organization,
  onClose,
  onChanged,
  onError,
}: {
  organization: ApiRecord | null;
  onClose: () => void;
  onChanged: () => void;
  onError: (message: string | null) => void;
}) {
  const organizationId = organization ? getId(organization) : "";
  const { data, loading, reload } = useApiList<ApiRecord>(
    organizationId ? `/organizations/${organizationId}/memberships` : "/organizations/none/memberships",
    undefined,
    Boolean(organizationId),
  );
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<Role>("CLIENT");

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onError(null);
    try {
      await apiRequest(`/organizations/${organizationId}/memberships`, {
        method: "POST",
        body: { userId, role },
      });
      setUserId("");
      setRole("CLIENT");
      reload();
      onChanged();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Membership update failed");
    }
  }

  async function updateMember(membershipId: string, nextRole: Role) {
    onError(null);
    try {
      await apiRequest(`/organizations/${organizationId}/memberships/${membershipId}`, {
        method: "PATCH",
        body: { role: nextRole },
      });
      reload();
      onChanged();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Membership update failed");
    }
  }

  async function removeMember(membershipId: string) {
    onError(null);
    try {
      await apiRequest(`/organizations/${organizationId}/memberships/${membershipId}`, { method: "DELETE" });
      reload();
      onChanged();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Membership removal failed");
    }
  }

  return (
    <Modal open={Boolean(organization)} title={`Members: ${textValue(organization?.name)}`} onClose={onClose}>
      <div className="stack-lg">
        <FormShell onSubmit={addMember}>
          <TextField label="User ID" value={userId} onChange={(event) => setUserId(event.target.value)} required />
          <SelectField label="Membership role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
            {membershipRoles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
          <FormActions>
            <Button type="submit">Add member</Button>
          </FormActions>
        </FormShell>

        {loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={data.items}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No members found."
            columns={[
              { key: "user", label: "User", render: (row) => nestedText(row, ["user", "email"]) },
              { key: "role", label: "Role", render: (row) => <RoleBadge value={textValue(row.role)} /> },
              {
                key: "change",
                label: "Change role",
                render: (row) => (
                  <select
                    className="table-select"
                    value={textValue(row.role, "CLIENT")}
                    onChange={(event) => void updateMember(getId(row), event.target.value as Role)}
                  >
                    {membershipRoles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ),
              },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <Button size="sm" variant="danger" onClick={() => void removeMember(getId(row))}>
                    Remove
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>
    </Modal>
  );
}
