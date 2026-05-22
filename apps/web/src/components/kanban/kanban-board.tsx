'use client';

import { DndContext } from '@dnd-kit/core';
import { demoIssues } from '@/lib/api';
import { statuses, statusLabels } from '@/lib/constants';
import { IssueCard } from '@/components/issues/issue-card';

export function KanbanBoard() {
  return (
    <DndContext onDragEnd={() => undefined}>
      <div className="grid min-h-[70vh] gap-4 overflow-x-auto lg:grid-cols-3 xl:grid-cols-4">
        {statuses.map((status) => (
          <section key={status} className="min-w-72 rounded-lg border border-border bg-panel">
            <div className="border-b border-border p-3 text-sm font-semibold">{statusLabels[status]}</div>
            <div className="space-y-3 p-3">
              {demoIssues.filter((issue) => issue.status === status).map((issue) => <IssueCard key={issue.id} issue={issue} />)}
            </div>
          </section>
        ))}
      </div>
    </DndContext>
  );
}
