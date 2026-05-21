import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell, LayoutDashboard, LogIn, Plus, Shield, Menu, X,
  Home, FileText, Users, Megaphone, FolderKanban, Tag, LogOut, Zap,
  ChevronLeft, ChevronRight, PlusCircle, Kanban
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { clearToken } from '../lib/api';
import { canAccessAdmin, useAuth } from '../lib/auth';
import { useState } from 'react';

export function Layout() {
  const { user, isAuthed } = useAuth();
  const navigate = useNavigate();
  const isAdmin = canAccessAdmin(user?.role);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  function logout() {
    clearToken();
    navigate('/login');
    window.location.reload();
  }

  // Public layout (not logged in) — just a top navbar
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#0f1117] text-slate-100">
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-[#0f1117]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white font-display">Campus Issues</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Feed</NavLink>
            <NavLink to="/pipeline" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Pipeline</NavLink>
          </nav>
          <Link to="/login" className="btn-primary text-xs px-4 py-2">
            <LogIn size={14} /> Sign In
          </Link>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-fade-in"><Outlet /></div>
        </main>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#1a1d2e', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' } }} />
      </div>
    );
  }

  // Authenticated layout — sidebar + header
  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen z-30 bg-[#12141f] border-r border-white/[0.06] transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[250px]'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06] shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <Zap size={16} className="text-white" />
            </div>
            {!collapsed && <span className="text-lg font-bold text-white font-display">Campus</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <NavSection collapsed={collapsed}>
            <SideLink to="/" icon={<Home size={18} />} label="Feed" collapsed={collapsed} end />
            <SideLink to="/pipeline" icon={<Kanban size={18} />} label="Pipeline" collapsed={collapsed} />
            <SideLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="My Dashboard" collapsed={collapsed} />
            <SideLink to="/issues/new" icon={<PlusCircle size={18} />} label="Submit Issue" collapsed={collapsed} />
          </NavSection>

          {isAdmin && (
            <>
              <div className={`pt-4 pb-2 ${collapsed ? 'px-2' : 'px-3'}`}>
                {!collapsed && <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Admin</span>}
                {collapsed && <div className="w-full h-px bg-white/[0.06]" />}
              </div>
              <NavSection collapsed={collapsed}>
                <SideLink to="/admin" icon={<Shield size={18} />} label="Overview" collapsed={collapsed} end />
                <SideLink to="/admin/pipeline" icon={<FolderKanban size={18} />} label="Pipeline" collapsed={collapsed} />
                <SideLink to="/admin/issues" icon={<FileText size={18} />} label="All Issues" collapsed={collapsed} />
                <SideLink to="/admin/users" icon={<Users size={18} />} label="Users" collapsed={collapsed} />
                <SideLink to="/admin/categories" icon={<Tag size={18} />} label="Categories" collapsed={collapsed} />
                <SideLink to="/admin/announcements" icon={<Megaphone size={18} />} label="Announcements" collapsed={collapsed} />
              </NavSection>
            </>
          )}
        </nav>

        {/* Collapse Button */}
        <div className="px-3 py-2 border-t border-white/[0.06]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors text-sm"
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
        </div>

        {/* User Section */}
        <div className="border-t border-white/[0.06] p-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-semibold shrink-0">
              {(user?.name ?? 'U')[0]}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name ?? 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 transition-colors" title="Logout">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[270px] bg-[#12141f] border-r border-white/[0.06] flex flex-col animate-slide-left">
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white font-display">Campus</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              <SideLink to="/" icon={<Home size={18} />} label="Feed" onClick={() => setMobileMenuOpen(false)} end />
              <SideLink to="/pipeline" icon={<Kanban size={18} />} label="Pipeline" onClick={() => setMobileMenuOpen(false)} />
              <SideLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="My Dashboard" onClick={() => setMobileMenuOpen(false)} />
              <SideLink to="/issues/new" icon={<PlusCircle size={18} />} label="Submit Issue" onClick={() => setMobileMenuOpen(false)} />
              {isAdmin && (
                <>
                  <div className="pt-4 pb-2 px-3">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Admin</span>
                  </div>
                  <SideLink to="/admin" icon={<Shield size={18} />} label="Overview" onClick={() => setMobileMenuOpen(false)} end />
                  <SideLink to="/admin/pipeline" icon={<FolderKanban size={18} />} label="Pipeline" onClick={() => setMobileMenuOpen(false)} />
                  <SideLink to="/admin/issues" icon={<FileText size={18} />} label="All Issues" onClick={() => setMobileMenuOpen(false)} />
                  <SideLink to="/admin/users" icon={<Users size={18} />} label="Users" onClick={() => setMobileMenuOpen(false)} />
                  <SideLink to="/admin/categories" icon={<Tag size={18} />} label="Categories" onClick={() => setMobileMenuOpen(false)} />
                  <SideLink to="/admin/announcements" icon={<Megaphone size={18} />} label="Announcements" onClick={() => setMobileMenuOpen(false)} />
                </>
              )}
            </nav>
            <div className="border-t border-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-semibold">
                  {(user?.name ?? 'U')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name ?? 'User'}</p>
                </div>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[250px]'}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 lg:px-6 bg-[#0f1117]/80 backdrop-blur-xl border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/[0.06] text-slate-400">
              <Menu size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="relative p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 transition-colors" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse-dot" />
            </Link>
            <Link to="/issues/new" className="btn-primary text-xs px-3 py-1.5 hidden sm:inline-flex">
              <Plus size={14} /> New Issue
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1a1d2e', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' } }} />
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function NavSection({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  return <div className="space-y-0.5">{children}</div>;
}

function SideLink({ to, icon, label, collapsed, onClick, end }: {
  to: string; icon: React.ReactNode; label: string; collapsed?: boolean; onClick?: () => void; end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
          isActive
            ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25 shadow-sm shadow-indigo-500/5'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
        }`
      }
      title={collapsed ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
    </NavLink>
  );
}
