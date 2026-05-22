'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';

export default function AdminSettingsPage() {
  return (
    <RouteGuard requiredRole="institution_admin">
      <PageShell title="Settings" subtitle="Categories, tags, and departments (managed via API).">
        <div className="card" style={{ padding: 20 }}>
          <p className="text-sm text-foreground/70">Institution settings are configured through the admin API. Contact a portal admin for platform-wide changes.</p>
        </div>
      </PageShell>
    </RouteGuard>
  );
}
