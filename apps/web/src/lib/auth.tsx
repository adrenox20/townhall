'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { SessionUser } from './permissions';
import { api } from './api';

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: (idToken: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  loginWithGoogle: async () => { throw new Error('AuthProvider missing'); },
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = user !== null;

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        const me = await api<SessionUser>('/auth/me');
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const isPublic = pathname === '/login' || pathname === '/';
    if (!isAuthenticated && !isPublic) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const loginWithGoogle = useCallback(async (idToken: string): Promise<SessionUser> => {
    await api<{ token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    const me = await api<SessionUser>('/auth/me');
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' });
    } catch {
      // clear local state even if API fails
    }
    setUser(null);
    router.push('/login');
  }, [router]);

  const refresh = useCallback(async (): Promise<void> => {
    await api<{ token: string }>('/auth/refresh', { method: 'POST' });
    const me = await api<SessionUser>('/auth/me');
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, loginWithGoogle, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
