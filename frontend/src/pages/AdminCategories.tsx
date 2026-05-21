import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FolderOpen, Tag, Plus, Trash2, Loader2, X } from 'lucide-react';
import { endpoints } from '../lib/api';

export function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading: catLoading } = useQuery({ queryKey: ['categories'], queryFn: endpoints.categories });
  const { data: tags, isLoading: tagLoading } = useQuery({ queryKey: ['tags'], queryFn: endpoints.tags });

  // Category form
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#6366f1');
  const [catParent, setCatParent] = useState('');
  const [showCatForm, setShowCatForm] = useState(false);

  // Tag form
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#a78bfa');
  const [showTagForm, setShowTagForm] = useState(false);

  const parents = categories?.filter((item) => !item.parent_id) ?? [];

  const createCat = useMutation({
    mutationFn: endpoints.createCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category created'); setCatName(''); setShowCatForm(false); },
    onError: (e) => toast.error(e.message),
  });

  const deleteCat = useMutation({
    mutationFn: endpoints.deleteCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category removed'); },
    onError: (e) => toast.error(e.message),
  });

  const createTagMut = useMutation({
    mutationFn: endpoints.createTag,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tags'] }); toast.success('Tag created'); setTagName(''); setShowTagForm(false); },
    onError: (e) => toast.error(e.message),
  });

  const deleteTagMut = useMutation({
    mutationFn: endpoints.deleteTag,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tags'] }); toast.success('Tag deleted'); },
    onError: (e) => toast.error(e.message),
  });

  if (catLoading || tagLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2"><div className="skeleton h-64" /><div className="skeleton h-64" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Categories & Tags</h1>
        <p className="text-sm text-slate-400 mt-1">Manage issue organization and labeling.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Categories */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen size={18} className="text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Categories</h2>
            </div>
            <button onClick={() => setShowCatForm(!showCatForm)} className="btn-primary text-xs px-2.5 py-1.5">
              <Plus size={12} /> Add
            </button>
          </div>

          {/* Create Category Form */}
          {showCatForm && (
            <div className="mb-4 p-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-300">New Category</span>
                <button onClick={() => setShowCatForm(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
              </div>
              <input className="field" value={catName} onChange={e => setCatName(e.target.value)} placeholder="Category name" />
              <div className="flex gap-2">
                <select className="field flex-1" value={catParent} onChange={e => setCatParent(e.target.value)}>
                  <option value="">No parent (top-level)</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-10 h-10 rounded-lg border border-white/[0.1] bg-transparent cursor-pointer" />
              </div>
              <button
                onClick={() => createCat.mutate({ name: catName, color: catColor, parent_id: catParent || null })}
                disabled={!catName.trim() || createCat.isPending}
                className="btn-primary text-xs w-full"
              >
                {createCat.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Create Category'}
              </button>
            </div>
          )}

          {/* Category List */}
          <div className="space-y-2">
            {parents.map((parent) => (
              <div key={parent.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: parent.color ?? '#6366f1' }} />
                    <span className="text-sm font-medium text-white">{parent.name}</span>
                  </div>
                  <button
                    onClick={() => { if (confirm(`Delete "${parent.name}"?`)) deleteCat.mutate(parent.id); }}
                    className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {categories?.filter(c => c.parent_id === parent.id).map(child => (
                  <div key={child.id} className="flex items-center justify-between mt-2 ml-5">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      {child.name}
                    </div>
                    <button
                      onClick={() => { if (confirm(`Delete "${child.name}"?`)) deleteCat.mutate(child.id); }}
                      className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
            {parents.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No categories yet.</p>}
          </div>
        </div>

        {/* Tags */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Tags</h2>
            </div>
            <button onClick={() => setShowTagForm(!showTagForm)} className="btn-primary text-xs px-2.5 py-1.5">
              <Plus size={12} /> Add
            </button>
          </div>

          {/* Create Tag Form */}
          {showTagForm && (
            <div className="mb-4 p-4 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-300">New Tag</span>
                <button onClick={() => setShowTagForm(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
              </div>
              <div className="flex gap-2">
                <input className="field flex-1" value={tagName} onChange={e => setTagName(e.target.value)} placeholder="Tag name" />
                <input type="color" value={tagColor} onChange={e => setTagColor(e.target.value)} className="w-10 h-10 rounded-lg border border-white/[0.1] bg-transparent cursor-pointer" />
              </div>
              <button
                onClick={() => createTagMut.mutate({ name: tagName, color: tagColor })}
                disabled={!tagName.trim() || createTagMut.isPending}
                className="btn-primary text-xs w-full"
              >
                {createTagMut.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Create Tag'}
              </button>
            </div>
          )}

          {/* Tag List */}
          <div className="flex flex-wrap gap-2">
            {tags?.map((tag) => (
              <span key={tag.id} className="group inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-white/[0.15] transition-colors">
                <span className="w-2 h-2 rounded-full" style={{ background: tag.color ?? '#a78bfa' }} />
                #{tag.name}
                {tag.usage_count != null && <span className="text-slate-500">({tag.usage_count})</span>}
                <button
                  onClick={() => { if (confirm(`Delete tag "#${tag.name}"?`)) deleteTagMut.mutate(tag.id); }}
                  className="ml-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            {!tags?.length && <p className="text-sm text-slate-500 py-4">No tags yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
