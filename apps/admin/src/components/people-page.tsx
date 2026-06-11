"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import {
  canManageTargetUser,
  creatableUserRoles,
  type CreatableUserRole,
  editableUserRoles,
  isManagementRole,
  visibleUserRoles,
} from "@/lib/access-control";
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

export function PeoplePage({ mode }: { mode: PeopleMode }) {
  const { user } = useAuth();
  const config = pageConfig[mode];
  const canManage = isManagementRole(user?.role);
  const roleFilterOptions = visibleUserRoles(user?.role);
  const canCreateUser = creatableUserRoles(user?.role).length > 0 && mode === "all";
  const { data, loading, error, reload } = useApiList<ApiRecord>(config.endpoint, { limit: 100 }, canManage);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<ApiRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return data.items.filter((item) => {
      if (user?.id && getId(item) === user.id) {
        return false;
      }

      const haystack = `${textValue(item.name, "")} ${textValue(item.email, "")}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesRole = roleFilter === "ALL" || textValue(item.role) === roleFilter;
      const active = item.isActive === true;
      const matchesStatus =
        statusFilter === "ALL" || (statusFilter === "ACTIVE" ? active : !active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [data.items, search, roleFilter, statusFilter, user?.id]);

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
      <PageHeader
        eyebrow="People"
        title={config.title}
        description={config.description}
        actions={
          canCreateUser ? <Button onClick={() => setCreating(true)}>Create user</Button> : null
        }
      />
      <ErrorBanner message={error ?? actionError} />
      <SuccessBanner message={message} />

      <Card className="toolbar-card">
        <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" />
        <SelectField label="Role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="ALL">All roles</option>
          {roleFilterOptions.map((role) => (
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
                render: (row) =>
                  canManageTargetUser(user?.role, textValue(row.role), user?.id, getId(row)) ? (
                    <div className="row-actions">
                      <Button size="sm" variant="secondary" onClick={() => setSelected(row)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => void deactivate(getId(row))}>
                        Disable
                      </Button>
                    </div>
                  ) : (
                    <span className="muted-copy">View only</span>
                  ),
              },
            ]}
          />
        )}
      </Card>

      <UserCreateModal
        open={creating}
        actorRole={user?.role}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          setMessage("User created.");
          reload();
        }}
        onError={setActionError}
      />

      <UserEditModal
        currentRole={user?.role}
        currentUserId={user?.id}
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

function UserCreateModal({
  open,
  actorRole,
  onClose,
  onCreated,
  onError,
}: {
  open: boolean;
  actorRole?: Role;
  onClose: () => void;
  onCreated: () => void;
  onError: (message: string | null) => void;
}) {
  const createRoles = creatableUserRoles(actorRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CreatableUserRole>("EDITOR");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const allowedRoles = creatableUserRoles(actorRole);
    setName("");
    setEmail("");
    setPassword("");
    setRole(allowedRoles[0] ?? "EDITOR");
  }, [open, actorRole]);

  if (!open) {
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    onError(null);

    try {
      await apiRequest("/admin/users", {
        method: "POST",
        body: {
          name: name.trim() || undefined,
          email,
          password,
          role,
        },
      });
      onCreated();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "User creation failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Create user" onClose={onClose}>
      <FormShell onSubmit={submit}>
        <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        <p className="muted-copy">Password must be at least 8 characters.</p>
        <SelectField label="Role" value={role} onChange={(event) => setRole(event.target.value as CreatableUserRole)}>
          {createRoles.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating" : "Create user"}
          </Button>
        </FormActions>
      </FormShell>
    </Modal>
  );
}

function UserEditModal({
  user,
  currentRole,
  currentUserId,
  onClose,
  onSaved,
  onError,
}: {
  user: ApiRecord | null;
  currentRole?: Role;
  currentUserId?: string;
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
  const options = editableUserRoles(currentRole);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    onError(null);

    try {
      const id = getId(activeUser);
      if (!canManageTargetUser(currentRole, textValue(activeUser.role), currentUserId, id)) {
        throw new Error("You do not have permission to modify this user.");
      }

      if (name && name !== textValue(activeUser.name, "")) {
        await apiRequest(`/admin/users/${id}`, { method: "PATCH", body: { name } });
      }

      if (role !== activeUser.role) {
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
