import { KanbanBoard } from '@/components/kanban/kanban-board';

export default function AdminKanbanPage() {
  return <div className="space-y-5"><div><h2 className="text-2xl font-semibold">Workflow kanban</h2><p className="text-sm text-foreground/60">Drag and drop validates transitions through the backend.</p></div><KanbanBoard /></div>;
}
