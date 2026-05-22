# Implementation Plan: Production-Ready Portal

## Overview

Transform the University Grievance Portal frontend from a mock-data prototype into a production-ready application by implementing real authentication, route protection, live API integration via React Query hooks, role-based navigation, comprehensive testing, and build correctness.

## Tasks

- [x] 1. Set up testing infrastructure and utility foundations
  - [x] 1.1 Install testing dependencies (vitest, @testing-library/react, @testing-library/jest-dom, jsdom, msw, fast-check, playwright)
    - Add to `apps/web/package.json` devDependencies
    - Create `apps/web/vitest.config.ts` with jsdom environment and path aliases
    - Create `apps/web/e2e/playwright.config.ts` with base URL and project config
    - _Requirements: 13.1, 13.2_

  - [x] 1.2 Create role resolution utility (`apps/web/src/lib/roles.ts`)
    - Implement `ROLE_PRIORITY` map and `getHighestRole(roles: Role[]): Role` function
    - Implement `getNavItems(role: Role)` function returning navigation config per role
    - Implement `meetsRoleRequirement(userRoles: Role[], requiredRole: Role): boolean`
    - _Requirements: 4.1, 4.6_

  - [x] 1.3 Write property tests for role hierarchy and navigation resolution
    - **Property 1: Role hierarchy resolution is deterministic and correct**
    - **Property 5: Navigation items match role**
    - **Validates: Requirements 4.1, 4.3, 4.4, 4.5, 4.6**

  - [x] 1.4 Write property test for permission helpers
    - **Property 2: Permission check consistency**
    - **Validates: Requirements 9.1**

- [x] 2. Implement AuthProvider and session management
  - [x] 2.1 Rewrite `apps/web/src/lib/auth.tsx` as a full AuthProvider
    - Remove hardcoded `demoUser`
    - Implement `AuthContextValue` interface: `user`, `isLoading`, `isAuthenticated`, `login`, `loginWithGoogle`, `logout`, `refresh`
    - On mount: call `GET /auth/me` via `api()` to restore session
    - On 401 from `/auth/me`: set `user = null`, `isAuthenticated = false`
    - `login(email)`: call `POST /auth/magic-link`
    - `loginWithGoogle(payload)`: call `POST /auth/google`, then `GET /auth/me`
    - `logout()`: call `POST /auth/logout`, clear state, redirect to `/login`
    - `refresh()`: call `POST /auth/refresh`
    - _Requirements: 1.1, 1.5, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 10.2, 10.3, 10.4_

  - [x] 2.2 Update `apps/web/src/components/shared/providers.tsx` to include AuthProvider
    - Wrap children with `<AuthProvider>` inside `QueryClientProvider` but outside `AppProvider`
    - _Requirements: 10.1_

  - [-]* 2.3 Write integration tests for AuthProvider
    - Test mount → /auth/me success → user populated
    - Test mount → /auth/me 401 → user null
    - Test logout flow
    - Use MSW to mock API responses
    - _Requirements: 3.1, 3.3, 3.4, 10.2, 10.3, 10.4_

- [x] 3. Implement RouteGuard and update AppShell
  - [x] 3.1 Create `apps/web/src/components/shared/route-guard.tsx`
    - Accept `requiredRole?` and `requiredPermission?` props
    - Use `useAuth()` to get user state
    - While `isLoading` → render `<LoadingSkeleton />`
    - If `!isAuthenticated` → redirect to `/login`
    - If `requiredRole` not met → redirect to `/dashboard`, show toast
    - Otherwise → render children
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 3.2 Create `apps/web/src/components/shared/loading-skeleton.tsx`
    - Implement `SkeletonLine`, `SkeletonCard`, `SkeletonTable`, `PageSkeleton` components
    - _Requirements: 5.4, 6.5, 12.2_

  - [x] 3.3 Rewrite `apps/web/src/components/app-shell/app-shell.tsx`
    - Remove `Segmented` role toggle from topbar
    - Remove `peopleById` and `NOTIFICATIONS` imports from `lib/data.ts`
    - Use `useAuth()` to get user; derive role via `getHighestRole(user.roles)`
    - Use `getNavItems(role)` for sidebar navigation
    - Fetch notification count from API (or React Query hook)
    - Display user avatar/name from `user` object
    - Add logout button
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.2_

  - [x] 3.4 Simplify `apps/web/src/context/app-context.tsx`
    - Remove `role` / `setRole` state (now derived from auth)
    - Remove `INITIAL_NOTIFICATIONS` import from `lib/data.ts`
    - Keep UI tweaks (accent, density, radius, etc.) and toast functionality
    - _Requirements: 4.2_

  - [-]* 3.5 Write property test for route guard authorization
    - **Property 3: Route guard authorization correctness**
    - **Validates: Requirements 5.2, 5.3**

- [x] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create React Query hooks for API integration
  - [x] 5.1 Create `apps/web/src/hooks/use-issues.ts`
    - `useIssues(params?)` — `GET /issues` with query params
    - `useIssue(id)` — `GET /issues/{id}`
    - `useCreateIssue()` — `POST /issues` mutation
    - `useUpdateIssueStatus()` — `PATCH /issues/{id}/status` mutation
    - `useAssignIssue()` — `PATCH /issues/{id}/assign` mutation
    - `useVoteIssue()` — vote mutation
    - _Requirements: 6.1, 6.2, 6.3, 7.4_

  - [x] 5.2 Create `apps/web/src/hooks/use-comments.ts`
    - `useComments(issueId)` — `GET /issues/{id}/comments`
    - `useCreateComment()` — `POST /issues/{id}/comments` mutation
    - _Requirements: 6.2_

  - [x] 5.3 Create `apps/web/src/hooks/use-solutions.ts`
    - `useSolutions(issueId)` — `GET /issues/{id}/solutions`
    - `useCreateSolution()` — `POST /issues/{id}/solutions` mutation
    - _Requirements: 6.2_

  - [x] 5.4 Create `apps/web/src/hooks/use-timeline.ts`
    - `useTimeline(issueId)` — `GET /issues/{id}/timeline`
    - _Requirements: 6.2_

  - [x] 5.5 Create `apps/web/src/hooks/use-notifications.ts`
    - `useNotifications()` — `GET /notifications`
    - _Requirements: 8.1, 8.2_

  - [x] 5.6 Create `apps/web/src/hooks/use-admin.ts`
    - `useAdminDashboard()` — `GET /admin/dashboard`
    - `useAdminKanban()` — `GET /admin/kanban`
    - `useAdminAnalytics()` — `GET /admin/analytics`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 5.7 Create `apps/web/src/hooks/use-portal.ts`
    - `usePortalDashboard()` — `GET /portal/dashboard`
    - `usePortalUsers()` — `GET /portal/users`
    - _Requirements: 7.5_

  - [x]* 5.8 Write property test for API client error propagation
    - **Property 4: API client error propagation**
    - **Validates: Requirements 6.4**

- [ ] 6. Wire pages to real API data
  - [x] 6.1 Rewrite `apps/web/src/app/login/page.tsx`
    - Use `useAuth().login(email)` for magic link flow
    - Use `useAuth().loginWithGoogle()` for Google flow
    - Show confirmation message on success
    - Show error on failure (wrong domain, etc.)
    - Remove `peopleById` import from `lib/data.ts`
    - _Requirements: 1.1, 1.2, 2.1, 2.4_

  - [x] 6.2 Rewrite `apps/web/src/app/issues/page.tsx`
    - Replace `ISSUES`, `CATEGORIES`, `STATUS`, `PRIORITY`, `peopleById` imports with `useIssues()` hook
    - Add loading skeleton state
    - Add error state with retry button
    - Add empty state
    - _Requirements: 6.1, 6.4, 6.5, 6.6_

  - [x] 6.3 Rewrite `apps/web/src/app/issues/[id]/page.tsx`
    - Use `useIssue(id)`, `useComments(id)`, `useSolutions(id)`, `useTimeline(id)`
    - Add loading/error/empty states
    - Use `hasPermission()` to conditionally show status controls, assign button
    - _Requirements: 6.2, 9.2, 9.3_

  - [x] 6.4 Rewrite `apps/web/src/app/issues/new/page.tsx`
    - Use `useCreateIssue()` mutation
    - On success: redirect to created issue
    - On error: show error message
    - _Requirements: 6.3_

  - [x] 6.5 Rewrite `apps/web/src/app/dashboard/page.tsx`
    - Replace all `ISSUES`, `CATEGORIES`, `peopleById` imports with `useAdminDashboard()` or `useIssues()` hooks
    - Add loading/error states
    - _Requirements: 7.1_

  - [~] 6.6 Rewrite `apps/web/src/app/admin/kanban/page.tsx`
    - Use `useAdminKanban()` hook
    - Wire drag-and-drop to `useUpdateIssueStatus()` mutation
    - Add RouteGuard with `requiredRole: 'institution_admin'`
    - _Requirements: 7.2, 7.4_

  - [~] 6.7 Rewrite `apps/web/src/app/admin/analytics/page.tsx`
    - Use `useAdminAnalytics()` hook
    - Add RouteGuard with `requiredRole: 'institution_admin'`
    - _Requirements: 7.3_

  - [~] 6.8 Rewrite `apps/web/src/app/admin/issues/page.tsx` and `apps/web/src/app/admin/page.tsx`
    - Use real API hooks
    - Add RouteGuard with `requiredRole: 'institution_admin'`
    - _Requirements: 7.1_

  - [~] 6.9 Rewrite portal pages (`apps/web/src/app/portal/`)
    - Use `usePortalDashboard()`, `usePortalUsers()` hooks
    - Add RouteGuard with `requiredRole: 'portal_admin'`
    - _Requirements: 7.5_

  - [~] 6.10 Update comment and solution components
    - `apps/web/src/components/comments/comment-list.tsx` — use `useComments()`, hide moderation actions based on permissions
    - `apps/web/src/components/solutions/solution-list.tsx` — use `useSolutions()`, hide "mark as official" based on permissions
    - _Requirements: 8.3, 9.4, 9.5_

- [~] 7. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Error handling, 404, and build correctness
  - [~] 8.1 Create `apps/web/src/components/shared/error-boundary.tsx`
    - React error boundary with styled fallback
    - "Go back" button that navigates to previous page or dashboard
    - _Requirements: 11.4, 12.4_

  - [~] 8.2 Create `apps/web/src/app/not-found.tsx`
    - Custom 404 page with branding and link to dashboard
    - _Requirements: 12.1_

  - [~] 8.3 Update `apps/web/next.config.ts`
    - Remove `typescript: { ignoreBuildErrors: true }`
    - Remove `eslint: { ignoreDuringBuilds: true }`
    - _Requirements: 11.1, 11.2_

  - [~] 8.4 Fix all TypeScript errors surfaced by the build
    - Run `npm run typecheck` in `apps/web`
    - Fix all type errors across the codebase
    - Ensure `npm run build` completes with zero errors
    - _Requirements: 11.3_

  - [~] 8.5 Add global React Query error handler for 401 responses
    - Configure `QueryClient` with `onError` that triggers logout on 401
    - _Requirements: 3.3_

  - [~] 8.6 Wrap page content with ErrorBoundary in layout or per-page
    - _Requirements: 11.4, 12.4_

- [ ] 9. Integration and E2E tests
  - [ ]* 9.1 Write integration tests for login page
    - Test magic link submission flow
    - Test Google login flow
    - Test error states (wrong domain)
    - Use MSW for API mocking
    - _Requirements: 1.1, 1.2, 2.1, 2.4, 13.4_

  - [ ]* 9.2 Write integration tests for issues page
    - Test data loading and display
    - Test error state with retry
    - Test empty state
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 13.4_

  - [ ]* 9.3 Write integration tests for route guard
    - Test unauthenticated redirect
    - Test unauthorized redirect with toast
    - Test authorized access
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 13.4_

  - [ ]* 9.4 Write Playwright E2E tests for critical path
    - Login → Dashboard → Issues list → Create issue → View detail → Logout
    - _Requirements: 13.5_

- [~] 10. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify `npm run build` succeeds without errors
  - Verify no remaining imports from `lib/data.ts` in production code (except as fallback reference data like categories/statuses if needed)

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3"] },
    { "wave": 4, "tasks": ["4"] },
    { "wave": 5, "tasks": ["5"] },
    { "wave": 6, "tasks": ["6"] },
    { "wave": 7, "tasks": ["7"] },
    { "wave": 8, "tasks": ["8"] },
    { "wave": 9, "tasks": ["9"] },
    { "wave": 10, "tasks": ["10"] }
  ]
}
```

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The `lib/data.ts` file can be kept for reference but should not be imported by any production component
- All pages use `output: 'export'` (static), so auth is purely client-side
