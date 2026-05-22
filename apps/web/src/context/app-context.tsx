'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { NOTIFICATIONS as INITIAL_NOTIFICATIONS, ISSUES } from '@/lib/data';
import type { Notification, Toast } from '@/lib/types';

interface Tweaks {
  accent: string;
  density: string;
  radius: number;
  cardStyle: string;
  typeMode: string;
}

const ACCENT_PRESETS: Record<string, { light: string; dark: string }> = {
  indigo:  { light: 'oklch(0.5 0.14 265)',  dark: 'oklch(0.68 0.16 265)' },
  emerald: { light: 'oklch(0.55 0.13 155)', dark: 'oklch(0.72 0.15 155)' },
  amber:   { light: 'oklch(0.65 0.15 65)',  dark: 'oklch(0.78 0.16 65)' },
  rose:    { light: 'oklch(0.58 0.17 15)',  dark: 'oklch(0.72 0.17 15)' },
  slate:   { light: 'oklch(0.35 0.03 250)', dark: 'oklch(0.75 0.04 250)' },
};

interface AppContextValue {
  role: 'student' | 'admin';
  setRole: (role: 'student' | 'admin') => void;
  votes: Record<string, number>;
  handleVote: (id: string) => void;
  statusOverrides: Record<string, string>;
  handleStatusChange: (id: string, status: string) => void;
  notifications: Notification[];
  handleMarkAllRead: () => void;
  unreadCount: number;
  toasts: Toast[];
  pushToast: (text: string, icon?: string) => void;
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tweaks, setTweaks] = useState<Tweaks>({
    accent: 'indigo',
    density: 'comfy',
    radius: 10,
    cardStyle: 'default',
    typeMode: 'editorial',
  });

  // Apply tweaks to document root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-density', tweaks.density);
    root.setAttribute('data-cardstyle', tweaks.cardStyle);
    root.setAttribute('data-typemode', tweaks.typeMode);
    root.style.setProperty('--radius', tweaks.radius + 'px');
  }, [tweaks]);

  // Apply accent color based on theme
  useEffect(() => {
    const applyAccent = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const preset = ACCENT_PRESETS[tweaks.accent] ?? ACCENT_PRESETS.indigo;
      document.documentElement.style.setProperty('--accent', isDark ? preset.dark : preset.light);
    };
    applyAccent();
    const observer = new MutationObserver(applyAccent);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [tweaks.accent]);

  const handleVote = useCallback((id: string) => {
    setVotes(v => {
      const issue = ISSUES.find(i => i.id === id);
      if (!issue) return v;
      const next = { ...v };
      const already = issue.votedByMe ? (next[id] ?? 0) >= 0 : (next[id] ?? 0) > 0;
      next[id] = already ? (issue.votedByMe ? -1 : 0) : (issue.votedByMe ? 0 : 1);
      return next;
    });
  }, []);

  const handleStatusChange = useCallback((id: string, status: string) => {
    setStatusOverrides(s => ({ ...s, [id]: status }));
    const label = { open: 'Open', progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' }[status] ?? status;
    pushToast(`Moved ${id} to ${label}`, 'check');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications(ns => ns.map(n => ({ ...n, unread: false })));
    pushToast('All caught up', 'check');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushToast = useCallback((text: string, icon = 'check') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, text, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks(t => ({ ...t, [key]: value }));
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <AppContext.Provider value={{
      role, setRole,
      votes, handleVote,
      statusOverrides, handleStatusChange,
      notifications, handleMarkAllRead, unreadCount,
      toasts, pushToast,
      tweaks, setTweak,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
