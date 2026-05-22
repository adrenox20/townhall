'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateIssue } from '@/hooks/use-issues';
import { RouteGuard } from '@/components/shared/route-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select, Field } from '@/components/ui/input';

export default function NewIssuePage() {
  const router = useRouter();
  const createIssue = useCreateIssue();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createIssue.mutate(
      { title, description, urgency, is_anonymous: isAnonymous },
      {
        onSuccess: (result) => {
          router.push(`/issues/${result.id}`);
        },
      }
    );
  };

  return (
    <RouteGuard>
      <div className="space-y-5">
        <div className="page-head">
          <div>
            <h1 className="page-title">Report an Issue</h1>
            <p className="page-sub">
              Describe the problem you&apos;re experiencing. Your report will be reviewed by the appropriate team.
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title">
              <Input
                required
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>

            <Field label="Description">
              <Textarea
                required
                rows={5}
                placeholder="Provide details about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field label="Urgency">
              <Select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </Field>

            <Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                Submit anonymously
              </label>
            </Field>

            {createIssue.isError && (
              <div className="text-sm" style={{ color: 'var(--danger)' }}>
                {createIssue.error instanceof Error
                  ? createIssue.error.message
                  : 'Something went wrong. Please try again.'}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                disabled={createIssue.isPending}
              >
                {createIssue.isPending ? 'Submitting...' : 'Submit Issue'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </RouteGuard>
  );
}
