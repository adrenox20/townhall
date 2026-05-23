'use client';

import { useState } from 'react';
import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortalUsers, useUpdateUserRole } from '@/hooks/use-portal';

const ALL_ROLES = [
  { id: 'role_portal_admin', label: 'Portal Admin' },
  { id: 'role_institution_admin', label: 'Staff' },
  { id: 'role_student', label: 'Student' },
];

function roleLabel(roleId: string) {
  return ALL_ROLES.find(r => r.id === roleId)?.label ?? roleId.replace('role_', '');
}

function roleVariant(roleId: string): 'accent' | 'danger' | 'subtle' {
  if (roleId === 'role_portal_admin') return 'danger';
  if (roleId === 'role_institution_admin') return 'accent';
  return 'subtle';
}

function UserRow({ user }: { user: import('@/hooks/use-portal').PortalUser }) {
  const [open, setOpen] = useState(false);
  const updateRole = useUpdateUserRole();

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ fontWeight: 500 }}>{user.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)', marginTop: 1 }}>{user.email}</div>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {user.roles.map(r => (
            <Badge key={r} variant={roleVariant(r)}>{roleLabel(r)}</Badge>
          ))}
        </div>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <Badge variant={user.status === 'active' ? 'resolved' : 'danger'}>{user.status}</Badge>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ position: 'relative' }}>
          <Button variant="ghost" size="sm" onClick={() => setOpen(o => !o)}>
            Manage roles
          </Button>
          {open && (
            <div className="dropdown" style={{ minWidth: 200, left: 0, right: 'auto' }}>
              <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>
                Grant / Revoke
              </div>
              {ALL_ROLES.map(role => {
                const has = user.roles.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 12px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 13, background: 'none', border: 'none', cursor: 'pointer',
                      color: has ? 'var(--fg)' : 'var(--fg-muted)',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onClick={() => {
                      updateRole.mutate({ userId: user.id, roleId: role.id, action: has ? 'revoke' : 'grant' });
                      setOpen(false);
                    }}
                    disabled={updateRole.isPending}
                  >
                    <span>{role.label}</span>
                    <span style={{ fontSize: 11, color: has ? 'var(--danger)' : 'var(--success)' }}>
                      {has ? 'Revoke' : 'Grant'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function UsersContent() {
  const { data, isLoading, error, refetch } = usePortalUsers();
  return (
    <PageShell title="User management" subtitle="University accounts and roles." isLoading={isLoading} error={error} onRetry={() => refetch()} isEmpty={!data?.length}>
      <div className="card" style={{ overflow: 'auto' }}>
        <table className="table" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th>Name / Email</th>
              <th>Roles</th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => <UserRow key={u.id} user={u} />)}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

export default function PortalUsersPage() {
  return (
    <RouteGuard requiredRole="portal_admin">
      <UsersContent />
    </RouteGuard>
  );
}
