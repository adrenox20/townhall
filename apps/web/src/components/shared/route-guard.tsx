'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { meetsRoleRequirement } from '@/lib/roles';
import { hasPermission } from '@/lib/permissions';
import type { Role, Permission } from '@/lib/permissions';
import { useApp } from '@/context/app-context';
import { PageSkeleton } from '@/components/shared/loading-skeleton';

export interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: Role;
  requiredPermission?: Permission;
}

/**
 * RouteGuard protects pages by checking authentication and authorization.
 *
 * - While loading auth state → renders a skeleton placeholder.
 * - If not authenticated → redirects to /login.
 * - If authenticated but missing required role/permission → redirects to /dashboard with a toast.
 * - Otherwise → renders children.
 */
export function RouteGuard({ children, requiredRole, requiredPermission }: RouteGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { pushToast } = useApp();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirected.current) return;

    if (!isAuthenticated) {
      hasRedirected.current = true;
      router.replace('/login');
      return;
    }

    // Check role requirement
    if (requiredRole && user) {
      if (!meetsRoleRequirement(user.roles, requiredRole)) {
        hasRedirected.current = true;
        pushToast('You do not have permission to access that page', 'alert-triangle');
        router.replace('/dashboard');
        return;
      }
    }

    // Check permission requirement
    if (requiredPermission && user) {
      if (!hasPermission(user, requiredPermission)) {
        hasRedirected.current = true;
        pushToast('You do not have permission to access that page', 'alert-triangle');
        router.replace('/dashboard');
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, requiredPermission, router, pushToast]);

  // While loading, show skeleton
  if (isLoading) {
    return <PageSkeleton />;
  }

  // If not authenticated or missing authorization, render nothing while redirect happens
  if (!isAuthenticated) {
    return <PageSkeleton />;
  }

  if (requiredRole && user && !meetsRoleRequirement(user.roles, requiredRole)) {
    return <PageSkeleton />;
  }

  if (requiredPermission && user && !hasPermission(user, requiredPermission)) {
    return <PageSkeleton />;
  }

  return <>{children}</>;
}
