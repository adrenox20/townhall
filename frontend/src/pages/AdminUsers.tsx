import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, Shield, Ban, UserCheck, MoreHorizontal, ChevronDown } from 'lucide-react';
import { endpoints } from '../lib/api';
import { Badge } from '../lib/badges';

const roles = ['student', 'moderator', 'dept_admin', 'super_admin'] as const;
const roleLabels: Record<string, string> = { student: 'Student', moderator: 'Moderator', dept_admin: 'Dept Admin', super_admin: 'Super Admin' };
const roleColors: Record<string, string> = {
  student: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  moderator: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  dept_admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  super_admin: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

export function AdminUsers() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['adminUsers'], queryFn: endpoints.adminUsers });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => endpoints.updateUserRole(userId, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); toast.success('Role updated'); },
    onError: (e) => toast.error(e.message),
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) => endpoints.banUser(userId, banned),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); toast.success('User status updated'); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = data?.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  }) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Users</h1>
          <p className="text-sm text-slate-400 mt-1">{data?.length ?? 0} registered users</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <Shield size={14} className="text-indigo-400" />
          <span>To invite: user signs in with @rishihood.edu.in email, then promote their role here</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="field pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." />
        </div>
        <select className="field w-auto min-w-[140px]" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide p-4">User</th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide p-4">Role</th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide p-4">Issues</th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide p-4">Joined</th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide p-4">Status</th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-semibold shrink-0">
                        {(user.name ?? user.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="relative">
                      <select
                        value={user.role}
                        onChange={e => roleMutation.mutate({ userId: user.id, role: e.target.value })}
                        disabled={roleMutation.isPending}
                        className="appearance-none bg-transparent border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 cursor-pointer hover:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 pr-7"
                      >
                        {roles.map(r => <option key={r} value={r} className="bg-[#1a1d2e]">{roleLabels[r]}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-300">{user.issue_count}</td>
                  <td className="p-4 text-sm text-slate-400">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <Badge className={user.is_banned ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}>
                      {user.is_banned ? 'Banned' : 'Active'}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => banMutation.mutate({ userId: user.id, banned: !user.is_banned })}
                      disabled={banMutation.isPending}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        user.is_banned
                          ? 'bg-emerald-600/15 text-emerald-300 hover:bg-emerald-600/25 border border-emerald-500/25'
                          : 'bg-red-600/15 text-red-300 hover:bg-red-600/25 border border-red-500/25'
                      }`}
                    >
                      {user.is_banned ? <><UserCheck size={12} /> Unban</> : <><Ban size={12} /> Ban</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">No users match your filters.</div>
        )}
      </div>
    </div>
  );
}
