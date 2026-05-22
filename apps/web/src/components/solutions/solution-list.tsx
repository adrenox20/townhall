import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SolutionList() {
  return <Card><CardHeader><h2 className="font-semibold">Ranked solutions</h2></CardHeader><CardContent className="space-y-3">{['Official accepted solution', 'Verified workaround', 'Community suggestion'].map((item, index) => <div key={item} className="rounded-md border border-border p-3"><Badge>{index === 0 ? 'official' : index === 1 ? 'verified' : 'community'}</Badge><p className="mt-2 text-sm">{item}</p></div>)}</CardContent></Card>;
}
