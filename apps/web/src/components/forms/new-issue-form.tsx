'use client';

import { useState } from 'react';
import { AlertTriangle, Paperclip, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { demoIssues } from '@/lib/api';

export function NewIssueForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const suggestions = title.length > 10 ? demoIssues.slice(0, 2) : [];
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Submit grievance</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-2 text-sm font-medium">Title<Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Short, specific title" /></label>
          <label className="block space-y-2 text-sm font-medium">Description<Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What happened, where, and who is affected?" /></label>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block space-y-2 text-sm font-medium">Category<select className="h-10 w-full rounded-md border border-border bg-panel px-3"><option>IT Services</option><option>Hostel</option><option>Academic</option></select></label>
            <label className="block space-y-2 text-sm font-medium">Department<select className="h-10 w-full rounded-md border border-border bg-panel px-3"><option>Information Technology</option><option>Facilities</option><option>Academics</option></select></label>
            <label className="block space-y-2 text-sm font-medium">Urgency<select className="h-10 w-full rounded-md border border-border bg-panel px-3"><option>medium</option><option>high</option><option>critical</option></select></label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><Paperclip size={16} /> Attachment</button>
            <Button onClick={() => toast.success('Issue submitted for review')}>Submit issue</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Search size={18} /> Duplicate check</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.length === 0 ? <p className="text-sm text-foreground/65">Suggestions appear as the issue becomes specific.</p> : suggestions.map((issue) => (
            <div key={issue.id} className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2 text-sm font-medium"><AlertTriangle size={16} className="text-accent" /> Possible match</div>
              <div className="mt-1 text-sm">{issue.title}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
