import { NewIssueForm } from '@/components/forms/new-issue-form';

export default function NewIssuePage() {
  return <div className="space-y-5"><div><h2 className="text-2xl font-semibold">New issue</h2><p className="text-sm text-foreground/60">Duplicate detection runs before final submission.</p></div><NewIssueForm /></div>;
}
