'use client';

import { useState } from 'react';
import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { usePortalUsers, useUpdateUserRole } from '@/hooks/use-portal';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApp } from '@/context/app-context';
import type { PortalUser } from '@/hooks/use-portal';

const PAGE_SIZE = 20;

const ALL_ROLES = [
  { id: 'role_portal_admin', label: 'Portal Admin' },
  { id: 'role_institution_admin', label: 'Staff' },
  { id: 'role_moderator', label: 'Moderator' },
  { id: 'role_student', label: 'Student' },
];

function roleLabel(roleId: string) {
  return ALL_ROLES.find(r => r.id === roleId)?.label ?? roleId.replace('role_', '');
}

function roleVariant(roleId: string): 'accent' | 'danger' | 'subtle' {
  if (roleId === 'role_portal_admin') return 'danger';
  if (roleId === 'role_institution_admin') return 'accent';
  if (roleId === 'role_moderator') return 'accent';
  return 'subtle';
}

function useSuspendUser() {
  const queryClient = useQueryClient();
  const { pushToast } = useApp();
  return useMutation({
    mutationFn: ({ userId, suspended }: { userId: string; suspended: boolean }) =>
      api<{ updated: boolean }>(`/portal/users/${userId}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ suspended }),
      }),
    onSuccess: (_, { suspended }) => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'users'] });
      pushToast(suspended ? 'User banned' : 'User unbanned', 'check');
    },
    onError: (err) => pushToast(err instanceof Error ? err.message : 'Failed to update user', 'alert'),
  });
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 999, padding: 2,
        background: checked ? 'var(--danger)' : 'var(--border)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s', display: 'inline-flex', alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        width: 16, height: 16, borderRadius: 999,
        background: 'white',
        transform: checked ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform 0.15s',
        display: 'block',
      }} />
    </button>
  );
}

function UserRow({ user }: { user: PortalUser }) {
  const [open, setOpen] = useState(false);
  const updateRole = useUpdateUserRole();
  const suspendUser = useSuspendUser();
  const isBanned = user.status === 'suspended';

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
          {user.roles.length === 0 && <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>—</span>}
        </div>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <Badge variant={isBanned ? 'danger' : 'resolved'}>{isBanned ? 'Banned' : 'Active'}</Badge>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Manage Roles dropdown */}
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

          {/* Ban toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Toggle
              checked={isBanned}
              onChange={(banned) => suspendUser.mutate({ userId: user.id, suspended: banned })}
              disabled={suspendUser.isPending}
            />
            <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>Ban</span>
          </div>
        </div>
      </td>
    </tr>
  );
}

function UsersContent() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = usePortalUsers({ page, limit: PAGE_SIZE, search });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(q.trim());
    setPage(1);
  }

  function handleSearchClear() {
    setQ('');
    setSearch('');
    setPage(1);
  }

  return (
    <PageShell
      title="User management"
      subtitle="University accounts and roles."
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      isEmpty={false}
    >
      {/* Search bar */}
      <form style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }} onSubmit={handleSearch}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <Icon name="search" size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by name or email…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={q ? { paddingRight: 28 } : undefined}
          />
          {q && (
            <button
              type="button"
              onClick={handleSearchClear}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: '2px', display: 'flex', alignItems: 'center' }}
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>
        <Button type="submit" variant="outline" size="sm" style={{ marginLeft: 6 }}>Search</Button>
      </form>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="table" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th>Name / Email</th>
              <th>Roles</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--fg-subtle)', fontSize: 13 }}>
                  {search ? `No users match "${search}"` : 'No users found.'}
                </td>
              </tr>
            ) : (
              items.map((u) => <UserRow key={u.id} user={u} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 13, color: 'var(--fg-muted)' }}>
        <span>
          {total > 0
            ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} users`
            : '0 users'}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            icon="arrow-left"
          >
            Prev
          </Button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next <Icon name="arrow-right" size={13} />
          </Button>
        </div>
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
