import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminAnnouncements } from './pages/AdminAnnouncements';
import { AdminCategories } from './pages/AdminCategories';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminIssues } from './pages/AdminIssues';
import { AdminPipeline } from './pages/AdminPipeline';
import { AdminSolutions } from './pages/AdminSolutions';
import { AdminUsers } from './pages/AdminUsers';
import { AuthVerify } from './pages/AuthVerify';
import { CouncilAnalytics } from './pages/CouncilAnalytics';
import { CouncilDashboard } from './pages/CouncilDashboard';
import { CouncilPipeline } from './pages/CouncilPipeline';
import { CouncilReview } from './pages/CouncilReview';
import { CouncilSolutions } from './pages/CouncilSolutions';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { IssueAppeal } from './pages/IssueAppeal';
import { IssueDetail } from './pages/IssueDetail';
import { Login } from './pages/Login';
import { NewIssue } from './pages/NewIssue';
import { Pipeline } from './pages/Pipeline';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="auth/verify" element={<AuthVerify />} />
        <Route path="issues/:id" element={<IssueDetail />} />
        <Route path="pipeline" element={<Pipeline />} />

        {/* Authenticated — any logged-in user */}
        <Route element={<ProtectedRoute />}>
          <Route path="issues/new" element={<NewIssue />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="issues/:id/appeal" element={<IssueAppeal />} />
        </Route>

        {/* Student Council portal */}
        <Route element={<ProtectedRoute council />}>
          <Route path="council" element={<CouncilDashboard />} />
          <Route path="council/review" element={<CouncilReview />} />
          <Route path="council/pipeline" element={<CouncilPipeline />} />
          <Route path="council/solutions" element={<CouncilSolutions />} />
          <Route path="council/analytics" element={<CouncilAnalytics />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute admin />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/pipeline" element={<AdminPipeline />} />
          <Route path="admin/issues" element={<AdminIssues />} />
          <Route path="admin/solutions" element={<AdminSolutions />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/categories" element={<AdminCategories />} />
          <Route path="admin/announcements" element={<AdminAnnouncements />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
