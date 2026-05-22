# Requirements Document

## Introduction

The University Grievance Portal frontend (`apps/web`) currently uses hardcoded mock data, a non-functional authentication flow, and lacks route protection. This feature transforms the frontend into a production-ready application by wiring it to the real backend API (`apps/worker`), implementing proper authentication and authorization, replacing all mock data with live API calls, adding comprehensive tests, and ensuring build correctness.

## Glossary

- **Auth_Provider**: The React context provider responsible for managing authentication state, session restoration, and exposing the current user to the component tree
- **Session_Cookie**: An HTTP-only cookie named `session` containing a JWT token issued by the Worker API upon successful authentication
- **Magic_Link_Flow**: Authentication method where the user provides their university email, receives a verification link, and clicking it establishes a session
- **Route_Guard**: A client-side component that checks authentication and authorization before rendering protected page content
- **API_Client**: The existing `api()` function in `lib/api.ts` that makes authenticated fetch requests to the Worker API with credentials included
- **React_Query**: The `@tanstack/react-query` library used for server state management, caching, and data fetching
- **Permission_Helper**: Utility functions (`hasPermission`, `hasAnyPermission`) that check a user's permissions array against required permissions
- **App_Shell**: The layout component providing sidebar navigation, topbar, and content area for authenticated pages
- **Role**: One of `student`, `institution_admin`, or `portal_admin` as defined in the RBAC system
- **Worker_API**: The Hono-based Cloudflare Worker backend serving all REST endpoints under `/api/v1`

## Requirements

### Requirement 1: Magic Link Authentication

**User Story:** As a student, I want to sign in with my university email via a magic link, so that I can access the portal without remembering a password.

#### Acceptance Criteria

1. WHEN a user submits their email on the login page, THE Auth_Provider SHALL call `POST /auth/magic-link` with the email address
2. WHEN the Worker_API returns a successful response, THE Login_Page SHALL display a confirmation message instructing the user to check their email
3. WHEN a user navigates to the verification URL with a valid token, THE Auth_Provider SHALL call `GET /auth/verify` and store the returned session token as a cookie
4. IF the magic link token is invalid or expired, THEN THE Auth_Provider SHALL display an error message and redirect to the login page
5. WHEN a session is established, THE Auth_Provider SHALL call `GET /auth/me` to fetch the full user profile and store it in context

### Requirement 2: Google OAuth Authentication

**User Story:** As a student, I want to sign in with my Google account, so that I can authenticate quickly using my university Google Workspace credentials.

#### Acceptance Criteria

1. WHEN a user clicks the Google sign-in button, THE Login_Page SHALL initiate the Google OAuth flow and obtain an ID token
2. WHEN a Google ID token is obtained, THE Auth_Provider SHALL call `POST /auth/google` with the email, name, and ID token
3. WHEN the Worker_API returns a session token, THE Auth_Provider SHALL store it as a cookie and fetch the user profile via `GET /auth/me`
4. IF the Google account email domain is not allowed, THEN THE Auth_Provider SHALL display an error indicating only university emails are accepted

### Requirement 3: Session Management

**User Story:** As a user, I want my session to persist across page reloads and browser restarts, so that I do not need to log in repeatedly.

#### Acceptance Criteria

1. WHEN the application loads, THE Auth_Provider SHALL call `GET /auth/me` to restore the session from the existing cookie
2. WHILE a valid session exists, THE Auth_Provider SHALL expose the authenticated user object to all child components
3. IF the `GET /auth/me` call returns a 401 status, THEN THE Auth_Provider SHALL clear the local session state and redirect to the login page
4. WHEN a user clicks the logout button, THE Auth_Provider SHALL call `POST /auth/logout`, clear the session cookie, and redirect to the login page
5. WHEN a session token is nearing expiration, THE Auth_Provider SHALL call `POST /auth/refresh` to obtain a new token

### Requirement 4: Role-Based Navigation

**User Story:** As a user, I want to see navigation items relevant to my role, so that I can access the features I am authorized to use without confusion.

#### Acceptance Criteria

1. THE App_Shell SHALL derive the user's primary role from the `roles` array returned by `GET /auth/me`
2. THE App_Shell SHALL NOT display a Student/Staff segmented toggle in the topbar
3. WHILE the user has the `student` role, THE App_Shell SHALL display navigation items for Dashboard, All Issues, Report Issue, and Notifications
4. WHILE the user has the `institution_admin` role, THE App_Shell SHALL display navigation items for Triage Queue, All Issues, Analytics, Overview, and Settings
5. WHILE the user has the `portal_admin` role, THE App_Shell SHALL display navigation items for Platform Dashboard, User Management, Moderation, and Audit Logs
6. WHEN the user has multiple roles, THE App_Shell SHALL use the highest-privilege role for navigation display

### Requirement 5: Route Protection

**User Story:** As a portal administrator, I want unauthorized users to be blocked from accessing admin pages, so that sensitive operations are protected.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access any page other than `/login` or `/`, THE Route_Guard SHALL redirect them to `/login`
2. WHEN a user with only the `student` role attempts to access `/admin/*` routes, THE Route_Guard SHALL redirect them to `/dashboard`
3. WHEN a user without the `portal_admin` role attempts to access `/portal/*` routes, THE Route_Guard SHALL redirect them to `/dashboard`
4. WHILE the Route_Guard is verifying authentication, THE Route_Guard SHALL display a loading skeleton instead of page content
5. WHEN a user is redirected due to insufficient permissions, THE Route_Guard SHALL display a toast notification explaining the access denial

### Requirement 6: Real API Integration for Issues

**User Story:** As a student, I want to see real grievance data from the university system, so that I can track actual campus issues and their resolution status.

#### Acceptance Criteria

1. WHEN the issues list page loads, THE Issues_Page SHALL fetch issues from `GET /issues` using React_Query and display them with loading states
2. WHEN a user views an issue detail page, THE Issue_Detail_Page SHALL fetch the issue from `GET /issues/{id}`, comments from `GET /issues/{id}/comments`, solutions from `GET /issues/{id}/solutions`, and timeline from `GET /issues/{id}/timeline`
3. WHEN a user submits the new issue form, THE New_Issue_Form SHALL call `POST /issues` with the form data and redirect to the created issue on success
4. IF an API call fails, THEN THE page SHALL display an error state with a retry button
5. WHILE data is being fetched, THE page SHALL display loading skeletons matching the layout of the expected content
6. WHEN the API returns an empty result set, THE page SHALL display an appropriate empty state message

### Requirement 7: Real API Integration for Dashboard and Admin

**User Story:** As an institution admin, I want to see real operational metrics and manage issues through the kanban board, so that I can effectively triage and resolve campus grievances.

#### Acceptance Criteria

1. WHEN the student dashboard loads, THE Dashboard_Page SHALL fetch metrics from `GET /admin/dashboard` and display them using the existing metric grid component
2. WHEN the admin kanban page loads, THE Kanban_Page SHALL fetch board data from `GET /admin/kanban` and render draggable issue cards
3. WHEN the admin analytics page loads, THE Analytics_Page SHALL fetch data from `GET /admin/analytics` and render charts
4. WHEN an admin changes an issue status via drag-and-drop on the kanban board, THE Kanban_Page SHALL call `PATCH /issues/{id}/status` with the new status
5. WHEN the portal dashboard loads, THE Portal_Dashboard SHALL fetch platform-wide metrics from `GET /portal/dashboard`

### Requirement 8: Real API Integration for Notifications

**User Story:** As a user, I want to receive real notifications about issues I follow, so that I stay informed about status changes and new comments.

#### Acceptance Criteria

1. WHEN the notifications page or dropdown loads, THE Notification_Component SHALL fetch notifications from `GET /notifications` using React_Query
2. WHEN new notifications arrive, THE App_Shell SHALL update the unread count badge in the sidebar and topbar
3. THE Notification_Component SHALL NOT use hardcoded notification data from `lib/data.ts`

### Requirement 9: Permission-Based UI Controls

**User Story:** As a user, I want to only see action buttons I am authorized to use, so that the interface is clear and I do not encounter permission errors.

#### Acceptance Criteria

1. WHEN rendering action buttons, THE UI components SHALL use the Permission_Helper to check the user's permissions before displaying actions
2. WHILE the user lacks the `issue:status_update` permission, THE Issue_Detail_Page SHALL hide the status change controls
3. WHILE the user lacks the `issue:assign` permission, THE Issue_Detail_Page SHALL hide the assign button
4. WHILE the user lacks the `comment:moderate` permission, THE Comment_List SHALL hide moderation actions on comments
5. WHILE the user lacks the `solution:official_select` permission, THE Solution_List SHALL hide the "mark as official" button

### Requirement 10: Auth Provider Integration

**User Story:** As a developer, I want the Auth_Provider properly wired into the component tree, so that all components can access authentication state.

#### Acceptance Criteria

1. THE Providers component SHALL include the Auth_Provider wrapping all child components
2. THE Auth_Provider SHALL expose `user`, `isLoading`, `isAuthenticated`, `login`, `loginWithGoogle`, `logout`, and `refresh` through its context
3. WHEN the Auth_Provider is in a loading state, THE Auth_Provider SHALL expose `isLoading: true` so consuming components can show appropriate loading UI
4. THE Auth_Provider SHALL NOT use a hardcoded demo user object

### Requirement 11: Production Build Correctness

**User Story:** As a developer, I want the application to build without suppressing errors, so that type safety and code correctness are enforced.

#### Acceptance Criteria

1. THE next.config.ts SHALL NOT set `typescript.ignoreBuildErrors` to true
2. THE next.config.ts SHALL NOT set `eslint.ignoreDuringBuilds` to true
3. WHEN `npm run build` is executed, THE build process SHALL complete with zero TypeScript errors
4. WHEN a runtime error occurs in a page component, THE Error_Boundary SHALL catch it and display a user-friendly error page instead of crashing

### Requirement 12: UI Consistency and Polish

**User Story:** As a user, I want a consistent visual experience across all pages, so that the application feels professional and trustworthy.

#### Acceptance Criteria

1. THE application SHALL display a custom 404 page when navigating to an undefined route
2. WHILE data is loading on any page, THE page SHALL display skeleton placeholders that match the expected content layout
3. THE application SHALL be responsive and usable on viewport widths from 320px to 1920px
4. WHEN an error boundary catches an error, THE Error_Boundary SHALL display a styled error page with a "Go back" action

### Requirement 13: Testing Infrastructure

**User Story:** As a developer, I want automated tests covering critical paths, so that regressions are caught before deployment.

#### Acceptance Criteria

1. THE project SHALL use Vitest as the unit and integration test runner for the web application
2. THE project SHALL use Playwright as the end-to-end test runner
3. WHEN unit tests are executed, THE test suite SHALL validate auth utility functions, permission helpers, and the API client
4. WHEN integration tests are executed, THE test suite SHALL validate key user flows including login, issue creation, voting, and status changes
5. WHEN end-to-end tests are executed, THE test suite SHALL validate the critical path: login, view dashboard, create issue, view issue detail
