import { Card, CardContent, CardHeader } from '@/components/ui/card';
export default function PortalUsersPage() {
  return <Card><CardHeader><h2 className="text-xl font-semibold">User and admin management</h2></CardHeader><CardContent><div className="grid gap-2 text-sm"><p>student@university.edu - student</p><p>ops@university.edu - institution_admin</p><p>admin@university.edu - portal_admin</p></div></CardContent></Card>;
}
