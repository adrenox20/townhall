'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/lib/auth';
import { getHighestRole, getNavSections } from '@/lib/roles';
import { useNotifications } from '@/hooks/use-notifications';
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

  const role = getHighestRole(user?.roles ?? []);
  const sections = getNavSections(role);
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
          <div className="brand-mark">R</div>
          <div>
            <div className="brand-name">Campus Issues</div>
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
                className={`nav-item${pathname === n.href || pathname.startsWith(n.href + '/') ? ' active' : ''}`}
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

          <div className="search-wrap">
            <Icon name="search" size={14} className="search-icon" />
            <input className="search-input" placeholder="Search issues..." />
          </div>

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
                      <div key={n.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{n.title}</div>
                        {n.body && <div style={{ color: 'var(--fg-subtle)', marginTop: 2 }}>{n.body}</div>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, marginLeft: 4, borderLeft: '1px solid var(--border)' }}>
              <span className="avatar avatar--sm" style={{ background: 'var(--accent)', color: 'white', borderColor: 'transparent' }} title={user?.name ?? ''}>
                {user?.name ? getInitials(user.name) : '?'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{user?.name ?? 'User'}</span>
                <span style={{ fontSize: 10.5, color: 'var(--fg-subtle)' }}>
                  {role === 'portal_admin' ? 'Portal Admin' : role === 'institution_admin' ? 'Staff' : 'Student'}
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
