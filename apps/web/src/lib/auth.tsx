'use client';

import { createContext, useContext } from 'react';
import type { SessionUser } from './permissions';

const demoUser: SessionUser = {
  id: 'user_demo',
  email: 'student@university.edu',
  name: 'Aarav Mehta',
  status: 'active',
  roles: ['student', 'institution_admin', 'portal_admin'],
  permissions: [
    'issue:create','issue:read_public','issue:update_own','issue:update_any','issue:delete_own_pre_review',
    'issue:status_update','issue:assign','issue:merge','issue:archive','comment:create','comment:moderate',
    'solution:create','solution:review','solution:official_select','analytics:institution_read','analytics:platform_read',
    'settings:manage','rbac:manage','audit:read','user:suspend','admin:manage'
  ]
};

const AuthContext = createContext<{ user: SessionUser | null }>({ user: demoUser });
export const AuthProvider = ({ children }: { children: React.ReactNode }) => <AuthContext.Provider value={{ user: demoUser }}>{children}</AuthContext.Provider>;
export const useAuth = () => useContext(AuthContext);
