import type { Role } from './permissions';

export const ROLE_PRIORITY: Record<Role, number> = {
  portal_admin: 4,
  institution_admin: 3,
  moderator: 2,
  student: 1,
};

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { href: '/issues', label: 'All Issues', icon: 'list' },
  { href: '/issues/new', label: 'Report Issue', icon: 'plus-circle' },
  { href: '/notifications', label: 'Notifications', icon: 'bell' },
];

const MODERATOR_NAV: NavItem[] = [
  { href: '/issues', label: 'All Issues', icon: 'list' },
  { href: '/issues/new', label: 'Report Issue', icon: 'plus-circle' },
  { href: '/notifications', label: 'Notifications', icon: 'bell' },
];

const INSTITUTION_ADMIN_NAV: NavItem[] = [
  { href: '/admin/kanban', label: 'Triage Queue', icon: 'kanban' },
  { href: '/issues', label: 'All Issues', icon: 'list' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'bar-chart-3' },
  { href: '/admin', label: 'Overview', icon: 'layout-dashboard' },
];

const PORTAL_ADMIN_NAV: NavItem[] = [
  { href: '/portal', label: 'Platform Dashboard', icon: 'gauge' },
  { href: '/portal/users', label: 'User Management', icon: 'users' },
  { href: '/portal/moderation', label: 'Moderation', icon: 'shield' },
  { href: '/portal/audit', label: 'Audit Logs', icon: 'scroll-text' },
];

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: STUDENT_NAV,
  moderator: MODERATOR_NAV,
  institution_admin: INSTITUTION_ADMIN_NAV,
  portal_admin: PORTAL_ADMIN_NAV,
};

export function getHighestRole(roles: Role[]): Role {
  if (roles.length === 0) return 'student';
  return roles.reduce<Role>((highest, role) =>
    ROLE_PRIORITY[role] > ROLE_PRIORITY[highest] ? role : highest,
    roles[0],
  );
}

export function getNavItems(role: Role): NavItem[] {
  return getNavSections(role).flatMap((s) => s.items);
}

export function getNavSections(role: Role): NavSection[] {
  if (role === 'portal_admin') {
    return [
      { label: 'Platform', items: PORTAL_ADMIN_NAV },
      { label: 'Staff', items: INSTITUTION_ADMIN_NAV },
      { label: 'Student', items: STUDENT_NAV },
    ];
  }
  if (role === 'institution_admin') {
    return [{ label: 'Staff', items: INSTITUTION_ADMIN_NAV }];
  }
  if (role === 'moderator') {
    return [{ label: 'Moderation', items: MODERATOR_NAV }];
  }
  return [{ label: 'Browse', items: STUDENT_NAV }];
}

export function meetsRoleRequirement(userRoles: Role[], requiredRole: Role): boolean {
  const highest = getHighestRole(userRoles);
  return ROLE_PRIORITY[highest] >= ROLE_PRIORITY[requiredRole];
}
