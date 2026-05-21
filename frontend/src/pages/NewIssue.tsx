import { FormEvent, useMemo, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, Send, Lightbulb } from 'lucide-react';
import { endpoints } from '../lib/api';

const audienceOptions = ['Students', 'Faculty', 'Staff', 'All'];

export function NewIssue() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [prioritySuggestion, setPrioritySuggestion] = useState('medium');
  const [department, setDepartment] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<string[]>([]);
  const [proposedSolution, setProposedSolution] = useState('');
  const [showSolutionField, setShowSolutionField] = useState(false);
  const [preview, setPreview] = useState(false);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: endpoints.categories });
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: endpoints.tags });
  const parents = useMemo(() => categories?.filter(item => !item.parent_id) ?? [], [categories]);
  const children = useMemo(() => categories?.filter(item => item.parent_id) ?? [], [categories]);

  const mutation = useMutation({
    mutationFn: endpoints.createIssue,
    onSuccess: (data) => { toast.success('Issue submitted'); navigate(`/issues/${data.id}`); },
    onError: (error) => toast.error(error.message)
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({
      title,
      description,
      category_id: categoryId || undefined,
      priority_suggestion: prioritySuggestion,
      department: department || undefined,
      is_anonymous: anonymous,
      tag_ids: selectedTags,
      attachment_keys: [],
      affected_audience: selectedAudience.length ? selectedAudience.join(',') : undefined,
      proposed_solution: proposedSolution.trim() || undefined
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <section className="panel p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white font-display">Submit Issue</h1>
          <button type="button" className="btn-secondary text-xs px-3 py-1.5" onClick={() => setPreview(v => !v)}>
            <Eye size={14} /> {preview ? 'Edit' : 'Preview'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
          <input className="field" value={title} onChange={e => setTitle(e.target.value)} minLength={10} placeholder="Briefly describe the campus issue" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
          <div className="rounded-lg overflow-hidden border border-white/[0.1]" data-color-mode="dark">
            <MDEditor value={description} onChange={(v) => setDescription(v ?? '')} preview={preview ? 'preview' : 'edit'} height={320} />
          </div>
        </div>

        {/* Optional Solution Proposal */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          <button type="button" onClick={() => setShowSolutionField(v => !v)} className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors w-full text-left">
            <Lightbulb size={16} className="text-amber-400" />
            {showSolutionField ? 'Hide' : 'Add'} a solution idea (optional)
          </button>
          {showSolutionField && (
            <textarea
              className="field mt-3 min-h-20"
              value={proposedSolution}
              onChange={e => setProposedSolution(e.target.value)}
              maxLength={500}
              placeholder="Briefly describe a possible solution to this issue..."
            />
          )}
        </div>
      </section>

      <aside className="space-y-5">
        <div className="panel p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
            <select className="field" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
              <option value="">Choose category</option>
              {parents.map(parent => (
                <optgroup key={parent.id} label={parent.name}>
                  <option value={parent.id}>{parent.name}</option>
                  {children.filter(c => c.parent_id === parent.id).map(child => (
                    <option key={child.id} value={child.id}>{parent.name} › {child.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Department (if known)</label>
            <input className="field" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Facilities, Academic Affairs" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority Suggestion</label>
            <select className="field" value={prioritySuggestion} onChange={e => setPrioritySuggestion(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">Student Council sets the final priority.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Affected Audience</label>
            <div className="flex flex-wrap gap-2">
              {audienceOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedAudience(prev => prev.includes(opt) ? prev.filter(a => a !== opt) : [...prev, opt])}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                    selectedAudience.includes(opt)
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tags?.map(tag => (
              <button
                key={tag.id}
                type="button"
                className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:border-white/[0.15]'
                }`}
                onClick={() => setSelectedTags(c => c.includes(tag.id) ? c.filter(i => i !== tag.id) : [...c, tag.id])}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>

        <label className="panel flex items-center gap-3 p-4 cursor-pointer">
          <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="w-4 h-4 rounded border-white/[0.2] bg-white/[0.05] text-indigo-600 focus:ring-indigo-500/50" />
          <span className="text-sm text-slate-300">Hide my name from other students</span>
        </label>

        <button className="btn-primary w-full" disabled={mutation.isPending}>
          <Send size={16} /> {mutation.isPending ? 'Submitting...' : 'Submit Issue'}
        </button>
      </aside>
    </form>
  );
}
