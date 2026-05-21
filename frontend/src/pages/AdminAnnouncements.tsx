import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Megaphone, Send, Loader2 } from 'lucide-react';
import { api, endpoints } from '../lib/api';

export function AdminAnnouncements() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['announcements'], queryFn: endpoints.announcements });
  const mutation = useMutation({
    mutationFn: () => api('/api/admin/announcements', { method: 'POST', body: JSON.stringify({ title, body, type: 'info', is_active: true }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement published');
      setTitle('');
      setBody('');
    },
    onError: (error) => toast.error(error.message)
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Announcements</h1>
        <p className="text-sm text-slate-400 mt-1">Publish banners visible to all users.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Create Form */}
        <form onSubmit={submit} className="panel p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone size={18} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">New Announcement</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Body</label>
            <textarea className="field min-h-28 resize-y" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement..." required />
          </div>
          <button className="btn-primary w-full" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {mutation.isPending ? 'Publishing...' : 'Publish'}
          </button>
        </form>

        {/* Existing Announcements */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
          ) : data?.length ? data.map((item) => (
            <article key={item.id} className="panel p-5">
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.body}</p>
            </article>
          )) : (
            <div className="panel p-8 text-center text-sm text-slate-400">No announcements yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
