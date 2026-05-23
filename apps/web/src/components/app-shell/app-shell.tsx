'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/lib/auth';
import { getHighestRole, getNavSections } from '@/lib/roles';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/use-notifications';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { ToastWrap } from '@/components/ui/toast';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/login' || pathname === '/';

  if (isLanding) return <>{children}</>;
  return <ShellInner pathname={pathname}>{children}</ShellInner>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ShellInner({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const { toasts } = useApp();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const role = getHighestRole(user?.roles ?? []);
  const sections = getNavSections(role);
  // Only the most specific matching href gets the active class (prevents /admin matching /admin/kanban etc.)
  const activeHref = sections
    .flatMap(s => s.items)
    .filter(n => pathname === n.href || pathname.startsWith(n.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const notificationCount = notifications?.filter((n) => !n.is_read).length ?? 0;
  const recentNotifs = (notifications ?? []).slice(0, 4);

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  return (
    <div className="app-grid">
      {/* Mobile backdrop — click to close sidebar */}
      {mobileNavOpen && (
        <div className="sidebar-backdrop" onClick={closeMobileNav} aria-hidden="true" />
      )}

      <aside className={`sidebar${mobileNavOpen ? ' sidebar--open' : ''}`}>
        <div className="brand">
          <img src="/logo.svg" alt="Town Hall" className="brand-mark" style={{ padding: 0, objectFit: 'contain', background: 'transparent' }} />
          <div>
            <div className="brand-name">Town Hall</div>
            <div className="brand-sub">Rishihood Univ.</div>
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.label} className="nav-section">
            <div className="nav-label">{section.label}</div>
            {section.items.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={closeMobileNav}
                className={`nav-item${n.href === activeHref ? ' active' : ''}`}
              >
                <Icon name={n.icon} size={15} />
                <span>{n.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </aside>

      <div className="main">
        <header className="topbar">
          {/* Hamburger — only visible on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="hamburger-btn"
            onClick={() => setMobileNavOpen((o) => !o)}
            icon="menu"
            aria-label="Open navigation"
          />

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              icon={theme === 'dark' ? 'sun' : 'moon'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            />

            <div style={{ position: 'relative' }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
              >
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <Icon name="bell" size={15} />
                  {notificationCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -2, right: -2, width: 7, height: 7,
                      background: 'var(--accent)', borderRadius: 999, border: '1.5px solid var(--bg)',
                    }} />
                  )}
                </span>
              </Button>
              {notifOpen && (
                <div className="dropdown">
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Notifications</div>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => { router.push('/notifications'); setNotifOpen(false); }}>
                      View all
                    </button>
                  </div>
                  {recentNotifs.length === 0 ? (
                    <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--fg-subtle)', fontSize: 13 }}>No notifications</div>
                  ) : (
                    recentNotifs.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12,
                          cursor: n.issue_id ? 'pointer' : 'default',
                          opacity: n.is_read ? 0.7 : 1,
                          borderLeft: n.is_read ? '2px solid transparent' : '2px solid var(--accent)',
                        }}
                        onClick={() => {
                          if (n.issue_id) {
                            markRead.mutate();
                            router.push(`/issues/${n.issue_id}`);
                            setNotifOpen(false);
                          }
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{n.title}</div>
                        {n.body && <div style={{ color: 'var(--fg-subtle)', marginTop: 2 }}>{n.body}</div>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, marginLeft: 4, borderLeft: '1px solid var(--border)' }}>
              <span className="avatar avatar--sm" style={{ background: 'var(--accent)', color: 'white', borderColor: 'transparent', flexShrink: 0 }} title={user?.name ?? ''}>
                {user?.name ? getInitials(user.name) : '?'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{user?.name ?? 'User'}</span>
                <span style={{ fontSize: 10.5, color: 'var(--fg-subtle)' }}>·</span>
                <span style={{ fontSize: 10.5, color: 'var(--fg-subtle)' }}>
                  {role === 'portal_admin' ? 'Portal Admin' : role === 'institution_admin' ? 'Staff' : role === 'moderator' ? 'Moderator' : 'Student'}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => logout()} icon="log-out" title="Logout" aria-label="Logout" />
            </div>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
      <ToastWrap toasts={toasts} />
    </div>
  );
}
