import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
export default function AdminSettingsPage() {
  return <Card><CardHeader><h2 className="text-xl font-semibold">Categories, tags, departments, and SLA settings</h2></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><Input defaultValue="university.edu" /><Input defaultValue="72 hours default SLA" /></CardContent></Card>;
}
