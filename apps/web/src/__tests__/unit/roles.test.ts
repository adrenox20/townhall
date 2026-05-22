import { describe, it, expect } from 'vitest';
import {
  ROLE_PRIORITY,
  getHighestRole,
  getNavItems,
  getNavSections,
  meetsRoleRequirement,
} from '@/lib/roles';
import type { Role } from '@/lib/permissions';

describe('ROLE_PRIORITY', () => {
  it('defines portal_admin as highest priority', () => {
    expect(ROLE_PRIORITY.portal_admin).toBeGreaterThan(ROLE_PRIORITY.institution_admin);
    expect(ROLE_PRIORITY.institution_admin).toBeGreaterThan(ROLE_PRIORITY.student);
  });
});

describe('getHighestRole', () => {
  it('returns student as default for empty array', () => {
    expect(getHighestRole([])).toBe('student');
  });

  it('returns the single role when array has one element', () => {
    expect(getHighestRole(['student'])).toBe('student');
    expect(getHighestRole(['institution_admin'])).toBe('institution_admin');
    expect(getHighestRole(['portal_admin'])).toBe('portal_admin');
  });

  it('returns portal_admin when all roles are present', () => {
    expect(getHighestRole(['student', 'institution_admin', 'portal_admin'])).toBe('portal_admin');
  });

  it('returns institution_admin over student', () => {
    expect(getHighestRole(['student', 'institution_admin'])).toBe('institution_admin');
  });

  it('is order-independent', () => {
    expect(getHighestRole(['portal_admin', 'student'])).toBe('portal_admin');
    expect(getHighestRole(['student', 'portal_admin'])).toBe('portal_admin');
  });
});

describe('getNavItems', () => {
  it('returns student nav items', () => {
    const items = getNavItems('student');
    expect(items).toHaveLength(4);
    expect(items.map((i) => i.label)).toEqual([
      'Dashboard',
      'All Issues',
      'Report Issue',
      'Notifications',
    ]);
  });

  it('returns institution_admin nav items', () => {
    const items = getNavItems('institution_admin');
    expect(items).toHaveLength(5);
    expect(items.map((i) => i.label)).toEqual([
      'Triage Queue',
      'All Issues',
      'Analytics',
      'Overview',
      'Settings',
    ]);
  });

  it('returns portal_admin nav items (all sections)', () => {
    const items = getNavItems('portal_admin');
    expect(items).toHaveLength(13);
    const sections = getNavSections('portal_admin');
    expect(sections).toHaveLength(3);
    expect(sections.map((s) => s.label)).toEqual(['Platform', 'Staff', 'Student']);
  });

  it('each nav item has href, label, and icon', () => {
    const allRoles: Role[] = ['student', 'institution_admin', 'portal_admin'];
    for (const role of allRoles) {
      for (const item of getNavItems(role)) {
        expect(item.href).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.icon).toBeTruthy();
      }
    }
  });
});

describe('meetsRoleRequirement', () => {
  it('student meets student requirement', () => {
    expect(meetsRoleRequirement(['student'], 'student')).toBe(true);
  });

  it('student does not meet institution_admin requirement', () => {
    expect(meetsRoleRequirement(['student'], 'institution_admin')).toBe(false);
  });

  it('student does not meet portal_admin requirement', () => {
    expect(meetsRoleRequirement(['student'], 'portal_admin')).toBe(false);
  });

  it('institution_admin meets student requirement', () => {
    expect(meetsRoleRequirement(['institution_admin'], 'student')).toBe(true);
  });

  it('institution_admin meets institution_admin requirement', () => {
    expect(meetsRoleRequirement(['institution_admin'], 'institution_admin')).toBe(true);
  });

  it('institution_admin does not meet portal_admin requirement', () => {
    expect(meetsRoleRequirement(['institution_admin'], 'portal_admin')).toBe(false);
  });

  it('portal_admin meets all route requirements (cascade)', () => {
    expect(meetsRoleRequirement(['portal_admin'], 'student')).toBe(true);
    expect(meetsRoleRequirement(['portal_admin'], 'institution_admin')).toBe(true);
    expect(meetsRoleRequirement(['portal_admin'], 'portal_admin')).toBe(true);
  });

  it('uses highest role from array', () => {
    expect(meetsRoleRequirement(['student', 'institution_admin'], 'institution_admin')).toBe(true);
    expect(meetsRoleRequirement(['student', 'portal_admin'], 'portal_admin')).toBe(true);
  });

  it('empty roles array defaults to student', () => {
    expect(meetsRoleRequirement([], 'student')).toBe(true);
    expect(meetsRoleRequirement([], 'institution_admin')).toBe(false);
  });
});
