import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endpoints, getToken } from './api';
import type { User } from './types';

const AuthContext = createContext<{ user?: User; isLoading: boolean; isAuthed: boolean }>({ isLoading: false, isAuthed: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const enabled = Boolean(getToken());
  const { data, isLoading } = useQuery({ queryKey: ['me'], queryFn: endpoints.me, enabled, retry: false });
  const value = useMemo(() => ({ user: data, isLoading, isAuthed: Boolean(data) }), [data, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function canAccessAdmin(role?: string) {
  return role === 'moderator' || role === 'dept_admin' || role === 'super_admin';
}
