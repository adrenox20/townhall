import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function CommentList() {
  return <Card><CardHeader><h2 className="font-semibold">Comments and notes</h2></CardHeader><CardContent className="space-y-3"><p className="rounded-md bg-muted p-3 text-sm">Official update: IT team has isolated the access point failure and ordered replacement hardware.</p><p className="rounded-md bg-muted p-3 text-sm">Student follow-up: The issue still affects the south reading room.</p></CardContent></Card>;
}
