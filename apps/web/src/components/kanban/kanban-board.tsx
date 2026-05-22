'use client';

import { DndContext } from '@dnd-kit/core';
import { useAdminKanban, groupKanbanColumns } from '@/hooks/use-admin';
import { useUpdateIssueStatus } from '@/hooks/use-issues';
import { IssueCard } from '@/components/issues/issue-card';
import { PageSkeleton } from '@/components/shared/loading-skeleton';

export function KanbanBoard() {
  const { data, isLoading, error, refetch } = useAdminKanban();
  const updateStatus = useUpdateIssueStatus();

  if (isLoading) return <PageSkeleton />;
  if (error) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <p>{error.message}</p>
        <button type="button" className="btn btn--primary" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  const columns = groupKanbanColumns(data ?? []);

  return (
    <DndContext
      onDragEnd={(event) => {
        const issueId = event.active.id as string;
        const newStatus = event.over?.id as string | undefined;
        if (issueId && newStatus) updateStatus.mutate({ id: issueId, status: newStatus });
      }}
    >
      <div className="grid min-h-[70vh] gap-4 overflow-x-auto lg:grid-cols-3 xl:grid-cols-4">
        {columns.map((col) => (
          <section key={col.status} id={col.status} className="min-w-72 rounded-lg border border-border bg-panel">
            <div className="border-b border-border p-3 text-sm font-semibold">{col.label} ({col.issues.length})</div>
            <div className="space-y-3 p-3">
              {col.issues.map((issue) => (
                <IssueCard key={issue.id} issue={{ ...issue, comments: 0, department: '', category: '', sla_due_at: issue.sla_due_at ?? undefined }} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </DndContext>
  );
}
