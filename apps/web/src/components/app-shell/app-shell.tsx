'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useApp } from '@/context/app-context';
import { Icon } from '@/components/ui/icon';
import { Avatar } from '@/components/ui/avatar';
import { Segmented } from '@/components/ui/segmented';
import { Button } from '@/components/ui/button';
import { ToastWrap } from '@/components/ui/toast';
import { peopleById, NOTIFICATIONS } from '@/lib/data';

const studentNav = [
  { href: '/dashboard',   label: 'Dashboard',   icon: 'home' },
  { href: '/issues',      label: 'All Issues',  icon: 'list',  count: 38 },
  { href: '/issues/new',  label: 'Report Issue', icon: 'plus' },
  { href: '/analytics',   label: 'Analytics',   icon: 'chart' },
];

const adminNav = [
  { href: '/admin/kanban', label: 'Triage Queue', icon: 'shield', count: 12 },
  { href: '/issues',       label: 'All Issues',   icon: 'list',   count: 38 },
  { href: '/analytics',    label: 'Analytics',    icon: 'chart' },
  { href: '/dashboard',    label: 'Overview',     icon: 'home' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/login' || pathname === '/';

  if (isLanding) {
    return <>{children}</>;
  }

  return <ShellInner pathname={pathname}>{children}</ShellInner>;
}

function ShellInner({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const { role, setRole, unreadCount, toasts } = useApp();
  const { theme, setTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();

  const nav = role === 'admin' ? adminNav : studentNav;
  const me = peopleById[role === 'admin' ? 's1' : 'u1'];
  const unread = NOTIFICATIONS.filter(n => n.unread).length;

  return (
    <div className="app-grid">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <div className="brand-name">Campus Issues</div>
            <div className="brand-sub">Rishihood Univ.</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">{role === 'admin' ? 'Staff' : 'Browse'}</div>
          {nav.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-item${pathname === n.href || pathname.startsWith(n.href + '/') ? ' active' : ''}`}
            >
              <Icon name={n.icon} size={15} />
              <span>{n.label}</span>
              {n.count && <span className="nav-count">{n.count}</span>}
            </Link>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-label">Activity</div>
          <Link
            href="/notifications"
            className={`nav-item${pathname === '/notifications' ? ' active' : ''}`}
          >
            <Icon name="bell" size={15} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="nav-count" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </Link>
        </div>

        <div style={{ marginTop: 'auto', padding: '12px 8px 4px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <span>This week</span>
            <span className="mono">26 fixes</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-muted)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: '72%', height: '100%', background: 'var(--accent)', borderRadius: 999 }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>72% of issues resolved within SLA</div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="search-wrap" style={{ maxWidth: 420 }}>
            <Icon name="search" size={14} className="search-icon" />
            <input className="search-input" placeholder="Search issues, locations, people..." />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <span className="kbd">⌘K</span>
            </span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Segmented
              value={role}
              onChange={v => setRole(v as 'student' | 'admin')}
              options={[{ value: 'student', label: 'Student' }, { value: 'admin', label: 'Staff' }]}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              icon={theme === 'dark' ? 'sun' : 'moon'}
            />

            <div style={{ position: 'relative' }}>
              <Button variant="ghost" size="icon" onClick={() => setNotifOpen(o => !o)}>
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <Icon name="bell" size={15} />
                  {unread > 0 && (
                    <span style={{
                      position: 'absolute', top: -2, right: -2, width: 7, height: 7,
                      background: 'var(--accent)', borderRadius: 999,
                      border: '1.5px solid var(--bg)',
                    }} />
                  )}
                </span>
              </Button>
              {notifOpen && (
                <div className="dropdown">
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Notifications</div>
                    <button className="btn btn--ghost btn--sm" onClick={() => { router.push('/notifications'); setNotifOpen(false); }}>
                      View all
                    </button>
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {NOTIFICATIONS.slice(0, 4).map(n => (
                      <div key={n.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start', background: n.unread ? 'var(--bg-muted)' : 'transparent' }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: n.unread ? 'var(--accent)' : 'transparent', marginTop: 6, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>{n.text}</div>
                          <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 2 }}>{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, marginLeft: 4, borderLeft: '1px solid var(--border)' }}>
              <Avatar person={me} size="sm" />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{me?.name}</span>
                <span style={{ fontSize: 10.5, color: 'var(--fg-subtle)' }}>{role === 'admin' ? me?.title : 'B.Tech CSE · Year 3'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content">{children}</div>
      </div>

      <ToastWrap toasts={toasts} />
    </div>
  );
}
