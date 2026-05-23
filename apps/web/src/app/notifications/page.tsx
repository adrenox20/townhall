'use client';

import { useRouter } from 'next/navigation';
import { RouteGuard } from '@/components/shared/route-guard';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/use-notifications';

function NotificationsList() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unreadCount = (data ?? []).filter(n => !n.is_read).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">Updates on issues you follow or reported.</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markRead.mutate()}
            disabled={markRead.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>Loading…</div>
      ) : error ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ marginBottom: 12 }}>{(error as Error).message || 'Something went wrong.'}</p>
          <Button variant="primary" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : !data?.length ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--fg-subtle)' }}>
          No notifications yet. You&apos;ll be notified when something happens on issues you follow.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: '12px 16px',
                opacity: n.is_read ? 0.7 : 1,
                cursor: n.issue_id ? 'pointer' : 'default',
                borderLeft: n.is_read ? '3px solid transparent' : '3px solid var(--accent)',
              }}
              onClick={() => {
                if (n.issue_id) {
                  markRead.mutate();
                  router.push(`/issues/${n.issue_id}`);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {!n.is_read && (
                  <span style={{
                    width: 7, height: 7, borderRadius: 999, background: 'var(--accent)',
                    flexShrink: 0, marginTop: 5,
                  }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
                  {n.body && <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 3, lineHeight: 1.5 }}>{n.body}</p>}
                  <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 6 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RouteGuard>
      <NotificationsList />
    </RouteGuard>
  );
}
