import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { meetsRoleRequirement, getHighestRole, ROLE_PRIORITY } from '@/lib/roles';
import type { Role } from '@/lib/permissions';

const ALL_ROLES: Role[] = ['student', 'institution_admin', 'portal_admin'];

/** Arbitrary that generates a valid Role */
const roleArb = fc.constantFrom<Role>('student', 'institution_admin', 'portal_admin');

/** Arbitrary that generates a non-empty array of roles (with possible duplicates) */
const nonEmptyRolesArb = fc.array(roleArb, { minLength: 1, maxLength: 10 });

/**
 * Route configuration mapping route prefixes to required roles,
 * matching the design document's ROUTE_CONFIG.
 */
const ROUTE_CONFIG: Record<string, Role> = {
  '/admin': 'institution_admin',
  '/admin/kanban': 'institution_admin',
  '/admin/analytics': 'institution_admin',
  '/admin/settings': 'institution_admin',
  '/portal': 'portal_admin',
  '/portal/users': 'portal_admin',
  '/portal/moderation': 'portal_admin',
  '/portal/audit': 'portal_admin',
};

const routePathArb = fc.constantFrom(...Object.keys(ROUTE_CONFIG));

describe('Property 3: Route guard authorization correctness', () => {
  /**
   * **Validates: Requirements 5.2, 5.3**
   *
   * For any route path and user with a set of roles, the route guard SHALL
   * grant access if and only if the user's highest-privilege role meets or
   * exceeds the route's required role in the hierarchy.
   */

  it('meetsRoleRequirement grants access iff highest role priority >= required role priority', () => {
    fc.assert(
      fc.property(nonEmptyRolesArb, roleArb, (userRoles, requiredRole) => {
        const result = meetsRoleRequirement(userRoles, requiredRole);
        const highestRole = getHighestRole(userRoles);
        const expected = ROLE_PRIORITY[highestRole] >= ROLE_PRIORITY[requiredRole];
        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('a student accessing /admin/* routes is always blocked (Requirement 5.2)', () => {
    const adminRoutes = Object.entries(ROUTE_CONFIG)
      .filter(([, role]) => role === 'institution_admin')
      .map(([path]) => path);
    const adminRouteArb = fc.constantFrom(...adminRoutes);

    fc.assert(
      fc.property(adminRouteArb, (routePath) => {
        const studentOnlyRoles: Role[] = ['student'];
        const requiredRole = ROUTE_CONFIG[routePath];
        const result = meetsRoleRequirement(studentOnlyRoles, requiredRole);
        expect(result).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('a non-portal_admin accessing /portal/* routes is always blocked (Requirement 5.3)', () => {
    const portalRoutes = Object.entries(ROUTE_CONFIG)
      .filter(([, role]) => role === 'portal_admin')
      .map(([path]) => path);
    const portalRouteArb = fc.constantFrom(...portalRoutes);
    // Generate role arrays that do NOT include portal_admin
    const nonPortalAdminRolesArb = fc.array(
      fc.constantFrom<Role>('student', 'institution_admin'),
      { minLength: 1, maxLength: 5 },
    );

    fc.assert(
      fc.property(portalRouteArb, nonPortalAdminRolesArb, (routePath, userRoles) => {
        const requiredRole = ROUTE_CONFIG[routePath];
        const result = meetsRoleRequirement(userRoles, requiredRole);
        expect(result).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('a portal_admin can access any protected route', () => {
    fc.assert(
      fc.property(routePathArb, (routePath) => {
        const portalAdminRoles: Role[] = ['portal_admin'];
        const requiredRole = ROUTE_CONFIG[routePath];
        const result = meetsRoleRequirement(portalAdminRoles, requiredRole);
        expect(result).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('an institution_admin can access /admin/* but not /portal/* routes', () => {
    fc.assert(
      fc.property(routePathArb, (routePath) => {
        const institutionAdminRoles: Role[] = ['institution_admin'];
        const requiredRole = ROUTE_CONFIG[routePath];
        const result = meetsRoleRequirement(institutionAdminRoles, requiredRole);

        if (routePath.startsWith('/portal')) {
          expect(result).toBe(false);
        } else {
          expect(result).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('adding a higher-privilege role to user roles never reduces access', () => {
    fc.assert(
      fc.property(nonEmptyRolesArb, roleArb, roleArb, (userRoles, extraRole, requiredRole) => {
        const resultBefore = meetsRoleRequirement(userRoles, requiredRole);
        const resultAfter = meetsRoleRequirement([...userRoles, extraRole], requiredRole);

        // If access was granted before, it must still be granted after adding any role
        if (resultBefore) {
          expect(resultAfter).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('meetsRoleRequirement is consistent with the role hierarchy ordering', () => {
    fc.assert(
      fc.property(nonEmptyRolesArb, (userRoles) => {
        // If user meets a higher requirement, they must also meet all lower requirements
        const meetsPortalAdmin = meetsRoleRequirement(userRoles, 'portal_admin');
        const meetsInstitutionAdmin = meetsRoleRequirement(userRoles, 'institution_admin');
        const meetsStudent = meetsRoleRequirement(userRoles, 'student');

        // portal_admin requirement is strictest
        if (meetsPortalAdmin) {
          expect(meetsInstitutionAdmin).toBe(true);
          expect(meetsStudent).toBe(true);
        }
        // institution_admin is middle
        if (meetsInstitutionAdmin) {
          expect(meetsStudent).toBe(true);
        }
        // student is always met (lowest requirement)
        expect(meetsStudent).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
