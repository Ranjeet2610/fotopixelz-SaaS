"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { isManagementRole } from "@/lib/access-control";
import { dateValue, getId, textValue } from "@/lib/format";
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

type PeopleMode = "all" | "clients" | "editors" | "qa";

const pageConfig: Record<PeopleMode, { title: string; endpoint: string; description: string }> = {
  all: {
    title: "Users",
    endpoint: "/admin/users",
    description: "Manage internal and client accounts.",
  },
  clients: {
    title: "Clients",
    endpoint: "/admin/users/clients",
    description: "Client accounts connected to organizations and orders.",
  },
  editors: {
    title: "Editors",
    endpoint: "/admin/users/editors",
    description: "Production editors available for assigned work.",
  },
  qa: {
    title: "QA Users",
    endpoint: "/admin/users/qa",
    description: "Quality assurance operators and reviewers.",
  },
};

const allRoles: Role[] = ["CLIENT", "EDITOR", "QA", "ADMIN", "SUPER_ADMIN"];

export function PeoplePage({ mode }: { mode: PeopleMode }) {
  const { user } = useAuth();
  const config = pageConfig[mode];
  const canManage = isManagementRole(user?.role);
  const { data, loading, error, reload } = useApiList<ApiRecord>(config.endpoint, { limit: 100 }, canManage);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<ApiRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return data.items.filter((item) => {
      const haystack = `${textValue(item.name, "")} ${textValue(item.email, "")}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesRole = roleFilter === "ALL" || textValue(item.role) === roleFilter;
      const active = item.isActive === true;
      const matchesStatus =
        statusFilter === "ALL" || (statusFilter === "ACTIVE" ? active : !active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [data.items, search, roleFilter, statusFilter]);

  async function deactivate(id: string) {
    setActionError(null);
    setMessage(null);
    try {
      await apiRequest(`/admin/users/${id}`, { method: "DELETE" });
      setMessage("User deactivated.");
      reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "User update failed");
    }
  }

  if (!canManage) {
    return <PermissionNotice />;
  }

  return (
    <div className="stack-xl">
      <PageHeader eyebrow="People" title={config.title} description={config.description} />
      <ErrorBanner message={error ?? actionError} />
      <SuccessBanner message={message} />

      <Card className="toolbar-card">
        <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" />
        <SelectField label="Role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="ALL">All roles</option>
          {allRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </SelectField>
        <SelectField label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </SelectField>
        <Button variant="secondary" onClick={reload}>
          Refresh
        </Button>
      </Card>

      <Card>
        {loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={filtered}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No users found."
            columns={[
              { key: "name", label: "Name", render: (row) => <strong>{textValue(row.name)}</strong> },
              { key: "email", label: "Email", render: (row) => textValue(row.email) },
              { key: "role", label: "Role", render: (row) => <RoleBadge value={textValue(row.role)} /> },
              { key: "status", label: "Status", render: (row) => <StatusBadge value={row.isActive ? "ACTIVE" : "INACTIVE"} /> },
              { key: "created", label: "Created", render: (row) => dateValue(row.createdAt) },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <div className="row-actions">
                    <Button size="sm" variant="secondary" onClick={() => setSelected(row)}>
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

      <UserEditModal
        currentRole={user?.role}
        user={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          setSelected(null);
          setMessage("User updated.");
          reload();
        }}
        onError={setActionError}
      />
    </div>
  );
}

function UserEditModal({
  user,
  currentRole,
  onClose,
  onSaved,
  onError,
}: {
  user: ApiRecord | null;
  currentRole?: Role;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("CLIENT");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(textValue(user.name, ""));
      setRole((textValue(user.role, "CLIENT") as Role) ?? "CLIENT");
      setIsActive(user.isActive !== false);
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const activeUser = user;
  const canSetSuperAdmin = currentRole === "SUPER_ADMIN";
  const options = canSetSuperAdmin ? allRoles : allRoles.filter((item) => item !== "SUPER_ADMIN");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    onError(null);

    try {
      const id = getId(activeUser);
      if (name && name !== textValue(activeUser.name, "")) {
        await apiRequest(`/admin/users/${id}`, { method: "PATCH", body: { name } });
      }

      if (role !== activeUser.role) {
        if (role === "SUPER_ADMIN" && !canSetSuperAdmin) {
          throw new Error("Only SUPER_ADMIN can promote another SUPER_ADMIN.");
        }
        await apiRequest(`/admin/users/${id}/role`, { method: "PATCH", body: { role } });
      }

      if (isActive !== (activeUser.isActive !== false)) {
        await apiRequest(`/admin/users/${id}/status`, { method: "PATCH", body: { isActive } });
      }

      onSaved();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "User update failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(user)} title="Edit user" onClose={onClose}>
      <FormShell onSubmit={submit}>
        <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <SelectField label="Role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
        <SelectField label="Status" value={isActive ? "ACTIVE" : "INACTIVE"} onChange={(event) => setIsActive(event.target.value === "ACTIVE")}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </SelectField>
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving" : "Save changes"}
          </Button>
        </FormActions>
      </FormShell>
    </Modal>
  );
}
