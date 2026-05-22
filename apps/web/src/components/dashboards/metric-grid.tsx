import { Card, CardContent } from '@/components/ui/card';

export function MetricGrid() {
  const metrics = [
    ['Active issues', '186'],
    ['Resolution rate', '72%'],
    ['Avg first response', '9h'],
    ['SLA breaches', '14']
  ];
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <Card key={label}><CardContent><div className="text-sm text-foreground/60">{label}</div><div className="mt-2 text-3xl font-semibold">{value}</div></CardContent></Card>)}</div>;
}
