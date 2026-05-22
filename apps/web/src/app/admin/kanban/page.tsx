'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { KanbanBoard } from '@/components/kanban/kanban-board';

export default function AdminKanbanPage() {
  return (
    <RouteGuard requiredRole="institution_admin">
      <PageShell title="Workflow kanban" subtitle="Drag cards to update status via the API.">
        <KanbanBoard />
      </PageShell>
    </RouteGuard>
  );
}
