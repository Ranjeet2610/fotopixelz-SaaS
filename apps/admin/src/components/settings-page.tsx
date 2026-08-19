"use client";

import { API_BASE_URL } from "@/lib/api-client";
import { getAdminNavGroups } from "@/lib/access-control";
import { useAuth } from "./auth-provider";
import { Button, Card, PageHeader, RoleBadge } from "./ui";

export function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const navItems = getAdminNavGroups(user?.role).flatMap((group) => group.items);

  return (
    <div className="stack-xl">
      <PageHeader eyebrow="Internal" title="Settings" description="Admin app session and API configuration." />
      <section className="detail-grid">
        <Card>
          <h2 className="section-title">Session</h2>
          <dl className="detail-list">
            <div>
              <dt>User</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>
                <RoleBadge value={user?.role} />
              </dd>
            </div>
            <div>
              <dt>API base URL</dt>
              <dd>{API_BASE_URL}</dd>
            </div>
          </dl>
          <div className="button-row">
            <Button variant="secondary" onClick={() => void refreshUser()}>
              Refresh session
            </Button>
            <Button variant="danger" onClick={() => void logout()}>
              Logout
            </Button>
          </div>
        </Card>
        <Card>
          <h2 className="section-title">Role navigation</h2>
          <div className="settings-list">
            {navItems.map((item) => (
              <div key={item.href}>
                <span>{item.label}</span>
                <code>{item.href}</code>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
