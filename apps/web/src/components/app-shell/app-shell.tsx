'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bell, KanbanSquare, LayoutDashboard, ListChecks, Moon, Plus, Settings, ShieldCheck, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/issues', label: 'Issues', icon: ListChecks },
  { href: '/issues/new', label: 'New', icon: Plus },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin', label: 'Ops', icon: BarChart3 },
  { href: '/admin/kanban', label: 'Kanban', icon: KanbanSquare },
  { href: '/portal', label: 'Portal', icon: ShieldCheck },
  { href: '/portal/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-border bg-panel lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="grid size-9 place-items-center rounded-md bg-primary text-sm font-bold text-white">UG</div>
          <div>
            <div className="font-semibold">Grievance Portal</div>
            <div className="text-xs text-foreground/60">University operations</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/75 hover:bg-muted', pathname === item.href && 'bg-muted text-foreground')}>
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur">
          <div>
            <div className="text-sm text-foreground/60">Single university deployment</div>
            <h1 className="text-lg font-semibold">Campus grievance resolution</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="grid size-10 place-items-center rounded-md border border-border bg-panel" aria-label="Notifications"><Bell size={18} /></button>
            <button className="grid size-10 place-items-center rounded-md border border-border bg-panel" aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Moon size={18} /></button>
          </div>
        </header>
        <div className="p-4 pb-24 lg:p-6">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-panel lg:hidden">
          {nav.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} className="grid min-h-14 place-items-center text-xs"><Icon size={18} /><span>{item.label}</span></Link>;
          })}
        </nav>
      </main>
    </div>
  );
}
