import { Card, CardContent, CardHeader } from '@/components/ui/card';
export default function PortalModerationPage() {
  return <Card><CardHeader><h2 className="text-xl font-semibold">Moderation center</h2></CardHeader><CardContent className="space-y-2 text-sm"><p>Reported issues</p><p>Hidden comments</p><p>Suspended user review</p></CardContent></Card>;
}
