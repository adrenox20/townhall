import { Card, CardContent, CardHeader } from '@/components/ui/card';
export default function PortalAuditPage() {
  return <Card><CardHeader><h2 className="text-xl font-semibold">Audit log explorer</h2></CardHeader><CardContent className="space-y-2 text-sm"><p>login - student@university.edu</p><p>issue.status_update - ops@university.edu</p><p>user.suspend - admin@university.edu</p></CardContent></Card>;
}
