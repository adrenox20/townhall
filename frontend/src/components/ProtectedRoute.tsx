import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { canAccessAdmin, canAccessCouncil, useAuth } from '../lib/auth';

export function ProtectedRoute({ admin = false, council = false }: { admin?: boolean; council?: boolean }) {
  const { isAuthed, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthed) return <Navigate to="/login" replace />;
  if (admin && !canAccessAdmin(user?.role)) return <Navigate to="/" replace />;
  if (council && !canAccessCouncil(user?.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
