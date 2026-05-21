import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, GripVertical } from 'lucide-react';
import { endpoints } from '../lib/api';
import { statusLabels } from '../lib/badges';
import type { Issue } from '../lib/types';

const columns = ['submitted', 'under_review', 'accepted', 'in_progress', 'resolved', 'closed'];

const columnColors: Record<string, { border: string; bg: string; dot: string }> = {
  submitted: { border: 'border-slate-500/30', bg: 'bg-slate-500/5', dot: 'bg-slate-400' },
  under_review: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', dot: 'bg-blue-400' },
  accepted: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', dot: 'bg-violet-400' },
  in_progress: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', dot: 'bg-amber-400' },
  resolved: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', dot: 'bg-emerald-400' },
  closed: { border: 'border-zinc-500/30', bg: 'bg-zinc-500/5', dot: 'bg-zinc-400' },
};

export function AdminPipeline() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['adminIssues'], queryFn: endpoints.adminIssues });
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  // Use PointerSensor with activation constraint to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => endpoints.updateStatus(id, { status, note: `Moved to ${statusLabels[status]} via pipeline board` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
      setMovingId(null);
      toast.success('Status updated');
    },
    onError: (error) => {
      setMovingId(null);
      toast.error(error.message);
    }
  });

  function onDragStart(event: DragStartEvent) {
    const issue = data?.find(i => i.id === String(event.active.id));
    setActiveIssue(issue ?? null);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveIssue(null);
    const issueId = String(event.active.id);
    const newStatus = event.over?.id ? String(event.over.id) : '';
    const issue = data?.find(i => i.id === issueId);
    if (!issueId || !newStatus || !issue || issue.status === newStatus) return;
    setMovingId(issueId);
    mutation.mutate({ id: issueId, status: newStatus });
  }

  function onDragCancel() {
    setActiveIssue(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-8 w-48" />
        <div className="grid gap-3 lg:grid-cols-6">
          {columns.map(c => <div key={c} className="skeleton h-80 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Pipeline Board</h1>
          <p className="text-sm text-slate-400 mt-1">Drag issues between columns to update status.</p>
        </div>
        {mutation.isPending && (
          <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5">
            <Loader2 size={12} className="animate-spin" /> Updating...
          </div>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
        <div className="grid gap-3 lg:grid-cols-6 overflow-x-auto pb-2" style={{ minHeight: '450px' }}>
          {columns.map((column) => {
            const issues = data?.filter((issue) => issue.status === column) ?? [];
            return (
              <PipelineColumn key={column} id={column} count={issues.length}>
                {issues.map((issue) => (
                  <DraggableCard key={issue.id} issue={issue} isMoving={movingId === issue.id} isDragActive={activeIssue?.id === issue.id} />
                ))}
              </PipelineColumn>
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeIssue && (
            <div className="w-[180px] rounded-lg border border-indigo-500/50 bg-[#1a1d2e] p-3 shadow-2xl shadow-indigo-500/20 rotate-1">
              <div className="text-xs font-medium text-white line-clamp-2">{activeIssue.title}</div>
              <div className="mt-1.5 text-[10px] text-indigo-300 font-semibold">{activeIssue.upvotes} ↑</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function PipelineColumn({ id, count, children }: { id: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const colors = columnColors[id] ?? columnColors.submitted;

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[350px] rounded-xl border p-3 transition-all duration-200 ${
        isOver
          ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/20'
          : `${colors.border} ${colors.bg}`
      }`}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
        <h2 className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide flex-1">{statusLabels[id]}</h2>
        <span className="text-[10px] font-medium text-slate-500 bg-white/[0.06] rounded-full px-1.5 py-0.5">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DraggableCard({ issue, isMoving, isDragActive }: { issue: Issue; isMoving: boolean; isDragActive: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: issue.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`w-full rounded-lg border border-white/[0.08] bg-[#1a1d2e] p-3 text-left transition-all cursor-grab active:cursor-grabbing hover:border-indigo-500/30 ${
        isDragActive ? 'opacity-30 scale-95' : ''
      } ${isMoving ? 'opacity-50 animate-pulse' : ''}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={12} className="text-slate-600 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium text-white line-clamp-2 leading-relaxed">{issue.title}</div>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
            <span className="text-indigo-400 font-semibold">{issue.upvotes} ↑</span>
            <span className="truncate">{issue.category_name ?? 'Uncategorized'}</span>
          </div>
        </div>
      </div>
      {isMoving && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-300">
          <Loader2 size={10} className="animate-spin" /> Moving...
        </div>
      )}
    </div>
  );
}
