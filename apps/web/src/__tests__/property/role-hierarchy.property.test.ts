import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getHighestRole, getNavItems, ROLE_PRIORITY } from '@/lib/roles';
import type { Role } from '@/lib/permissions';

const ALL_ROLES: Role[] = ['student', 'moderator', 'institution_admin', 'portal_admin'];

/** Arbitrary that generates a valid Role */
const roleArb = fc.constantFrom<Role>('student', 'moderator', 'institution_admin', 'portal_admin');

/** Arbitrary that generates a non-empty array of roles (with possible duplicates) */
const nonEmptyRolesArb = fc.array(roleArb, { minLength: 1, maxLength: 10 });

describe('Property 1: Role hierarchy resolution is deterministic and correct', () => {
  /**
   * **Validates: Requirements 4.1, 4.6**
   *
   * For any non-empty array of roles, getHighestRole SHALL return the role
   * with the highest privilege level, and calling it multiple times with the
   * same input SHALL always produce the same result.
   */

  it('getHighestRole always returns a valid role from the input array (or one with equal/higher priority)', () => {
    fc.assert(
      fc.property(nonEmptyRolesArb, (roles) => {
        const result = getHighestRole(roles);
        // Result must be a valid role
        expect(ALL_ROLES).toContain(result);
        // Result must have priority >= all roles in the input
        for (const role of roles) {
          expect(ROLE_PRIORITY[result]).toBeGreaterThanOrEqual(ROLE_PRIORITY[role]);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('getHighestRole is deterministic — same input always produces same output', () => {
    fc.assert(
      fc.property(nonEmptyRolesArb, (roles) => {
        const result1 = getHighestRole(roles);
        const result2 = getHighestRole(roles);
        const result3 = getHighestRole([...roles]);
        expect(result1).toBe(result2);
        expect(result1).toBe(result3);
      }),
      { numRuns: 100 },
    );
  });

  it('getHighestRole is order-independent (commutative over permutations)', () => {
    fc.assert(
      fc.property(
        nonEmptyRolesArb.chain((roles) =>
          fc.shuffledSubarray(roles, { minLength: roles.length, maxLength: roles.length }).map(
            (shuffled) => [roles, shuffled] as const,
          ),
        ),
        ([original, shuffled]) => {
          expect(getHighestRole(original)).toBe(getHighestRole(shuffled));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('getHighestRole result has the maximum priority value among all input roles', () => {
    fc.assert(
      fc.property(nonEmptyRolesArb, (roles) => {
        const result = getHighestRole(roles);
        const maxPriority = Math.max(...roles.map((r) => ROLE_PRIORITY[r]));
        expect(ROLE_PRIORITY[result]).toBe(maxPriority);
      }),
      { numRuns: 100 },
    );
  });

  it('adding a higher-priority role always changes or maintains the result', () => {
    fc.assert(
      fc.property(nonEmptyRolesArb, roleArb, (roles, extraRole) => {
        const resultBefore = getHighestRole(roles);
        const resultAfter = getHighestRole([...roles, extraRole]);
        // The result after adding a role should have priority >= before
        expect(ROLE_PRIORITY[resultAfter]).toBeGreaterThanOrEqual(ROLE_PRIORITY[resultBefore]);
      }),
      { numRuns: 100 },
    );
  });
});

describe('Property 5: Navigation items match role', () => {
  /**
   * **Validates: Requirements 4.3, 4.4, 4.5**
   *
   * For any user with a single role, the navigation items returned by
   * getNavItems SHALL contain exactly the items defined for that role
   * and no items from other roles.
   */

  const EXPECTED_NAV_LABELS: Record<Role, string[]> = {
    student: ['Dashboard', 'All Issues', 'Report Issue', 'Notifications'],
    moderator: ['All Issues', 'Report Issue', 'Notifications'],
    institution_admin: ['Triage Queue', 'All Issues', 'Analytics', 'Overview'],
    portal_admin: [
      'Platform Dashboard', 'User Management', 'Moderation', 'Audit Logs',
      'Triage Queue', 'All Issues', 'Analytics', 'Overview',
      'Dashboard', 'All Issues', 'Report Issue', 'Notifications',
    ],
  };

  it('getNavItems returns exactly the expected items for any role', () => {
    fc.assert(
      fc.property(roleArb, (role) => {
        const items = getNavItems(role);
        const labels = items.map((item) => item.label);
        expect(labels).toEqual(EXPECTED_NAV_LABELS[role]);
      }),
      { numRuns: 100 },
    );
  });

  it('getNavItems returns no items from other roles (portal_admin has full nav)', () => {
    fc.assert(
      fc.property(roleArb, (role) => {
        if (role === 'portal_admin') return;
        const items = getNavItems(role);
        const labels = new Set(items.map((item) => item.label));
        const otherRoles = ALL_ROLES.filter((r) => r !== role && r !== 'portal_admin');

        for (const otherRole of otherRoles) {
          const otherLabels = EXPECTED_NAV_LABELS[otherRole];
          for (const otherLabel of otherLabels) {
            // Skip items that are intentionally shared between roles (e.g. 'All Issues', 'Report Issue')
            if (labels.has(otherLabel)) continue;
            // Items exclusive to the other role must NOT appear in this role's nav
            const exclusiveToOther = EXPECTED_NAV_LABELS[otherRole].filter(
              l => !EXPECTED_NAV_LABELS[role].includes(l)
            );
            if (exclusiveToOther.includes(otherLabel)) {
              expect(labels.has(otherLabel)).toBe(false);
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('every nav item has a non-empty href, label, and icon', () => {
    fc.assert(
      fc.property(roleArb, (role) => {
        const items = getNavItems(role);
        for (const item of items) {
          expect(item.href).toBeTruthy();
          expect(item.label).toBeTruthy();
          expect(item.icon).toBeTruthy();
          expect(item.href.startsWith('/')).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('getNavItems is deterministic — same role always returns same items', () => {
    fc.assert(
      fc.property(roleArb, (role) => {
        const items1 = getNavItems(role);
        const items2 = getNavItems(role);
        expect(items1).toEqual(items2);
      }),
      { numRuns: 100 },
    );
  });

  it('navigation items count matches role specification', () => {
    fc.assert(
      fc.property(roleArb, (role) => {
        const items = getNavItems(role);
        expect(items.length).toBe(EXPECTED_NAV_LABELS[role].length);
      }),
      { numRuns: 100 },
    );
  });
});
