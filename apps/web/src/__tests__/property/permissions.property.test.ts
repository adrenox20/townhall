import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import type { Permission, SessionUser } from '@/lib/permissions';

const ALL_PERMISSIONS: Permission[] = [
  'issue:create', 'issue:read_public', 'issue:update_own', 'issue:update_any',
  'issue:delete_own_pre_review', 'issue:status_update', 'issue:assign',
  'issue:merge', 'issue:archive', 'comment:create', 'comment:moderate',
  'solution:create', 'solution:review', 'solution:official_select',
  'analytics:institution_read', 'analytics:platform_read', 'settings:manage',
  'rbac:manage', 'audit:read', 'user:suspend', 'admin:manage',
];

/** Arbitrary that generates a valid Permission */
const permissionArb = fc.constantFrom<Permission>(...ALL_PERMISSIONS);

/** Arbitrary that generates a subset of permissions (possibly empty) */
const permissionsSubsetArb = fc.subarray(ALL_PERMISSIONS, { minLength: 0 });

/** Arbitrary that generates a non-empty subset of permissions */
const nonEmptyPermissionsSubsetArb = fc.subarray(ALL_PERMISSIONS, { minLength: 1 });

/** Arbitrary that generates a valid SessionUser with a given set of permissions */
const sessionUserArb = (permissions: Permission[]): fc.Arbitrary<SessionUser> =>
  fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    status: fc.constantFrom('active', 'suspended', 'pending'),
    roles: fc.constant<SessionUser['roles']>(['student']),
    permissions: fc.constant(permissions),
  });

/** Arbitrary that generates a SessionUser with a random subset of permissions */
const randomSessionUserArb: fc.Arbitrary<SessionUser> = permissionsSubsetArb.chain((perms) =>
  sessionUserArb(perms),
);

describe('Property 2: Permission check consistency', () => {
  /**
   * **Validates: Requirements 9.1**
   *
   * For any SessionUser object and any Permission value, hasPermission(user, perm)
   * SHALL return true if and only if perm is present in user.permissions.
   * hasAnyPermission(user, perms) SHALL return true if and only if at least one
   * element of perms is present in user.permissions.
   */

  it('hasPermission returns true if and only if the permission is in user.permissions', () => {
    fc.assert(
      fc.property(randomSessionUserArb, permissionArb, (user, perm) => {
        const result = hasPermission(user, perm);
        const expected = user.permissions.includes(perm);
        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('hasPermission returns false for null/undefined user', () => {
    fc.assert(
      fc.property(permissionArb, (perm) => {
        expect(hasPermission(null, perm)).toBe(false);
        expect(hasPermission(undefined, perm)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('hasAnyPermission returns true if and only if at least one permission is in user.permissions', () => {
    fc.assert(
      fc.property(randomSessionUserArb, nonEmptyPermissionsSubsetArb, (user, perms) => {
        const result = hasAnyPermission(user, perms);
        const expected = perms.some((p) => user.permissions.includes(p));
        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('hasAnyPermission returns false for an empty permissions array', () => {
    fc.assert(
      fc.property(randomSessionUserArb, (user) => {
        expect(hasAnyPermission(user, [])).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('hasAnyPermission returns false for null/undefined user', () => {
    fc.assert(
      fc.property(nonEmptyPermissionsSubsetArb, (perms) => {
        expect(hasAnyPermission(null, perms)).toBe(false);
        expect(hasAnyPermission(undefined, perms)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('hasPermission is consistent with hasAnyPermission for a single permission', () => {
    fc.assert(
      fc.property(randomSessionUserArb, permissionArb, (user, perm) => {
        const single = hasPermission(user, perm);
        const any = hasAnyPermission(user, [perm]);
        expect(single).toBe(any);
      }),
      { numRuns: 100 },
    );
  });
});
