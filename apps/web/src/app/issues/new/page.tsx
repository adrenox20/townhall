'use client';

import { useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateIssue, useCategories, useDepartments } from '@/hooks/use-issues';
import { useCreateSolution } from '@/hooks/use-solutions';
import { RouteGuard } from '@/components/shared/route-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select, Field } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { API_URL } from '@/lib/constants';

interface UploadedFile {
  key: string;
  name: string;
  url: string;
}

export default function NewIssuePage() {
  const router = useRouter();
  const createIssue = useCreateIssue();
  const createSolution = useCreateSolution();
  const { data: categories } = useCategories();
  const { data: departments } = useDepartments();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [categoryId, setCategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [solutionBody, setSolutionBody] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadError('');
    setUploading(true);

    for (const file of files) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: Record<string, string> = { 'content-type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Get presigned info
        const presignRes = await fetch(`${API_URL}/uploads/presign`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ filename: file.name, contentType: file.type, sizeBytes: file.size }),
        });
        const presignJson = await presignRes.json() as { data: { key: string; uploadUrl: string } };
        const { key, uploadUrl } = presignJson.data;

        // Upload directly
        await fetch(`${API_URL.replace('/api/v1', '')}${uploadUrl}`, {
          method: 'PUT',
          body: file,
          headers: { 'content-type': file.type, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          credentials: 'include',
        });

        setAttachments((prev) => [...prev, { key, name: file.name, url: uploadUrl }]);
      } catch {
        setUploadError(`Failed to upload ${file.name}. Max size is 10 MB.`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (key: string) => {
    setAttachments((prev) => prev.filter((a) => a.key !== key));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createIssue.mutate(
      {
        title,
        description,
        urgency,
        ...(categoryId && { category_id: categoryId }),
        ...(departmentId && { department_id: departmentId }),
      },
      {
        onSuccess: (result) => {
          // If user provided a proposed solution, submit it right after
          if (solutionBody.trim()) {
            createSolution.mutate(
              { issueId: result.id, body: solutionBody.trim() },
              { onSettled: () => router.push(`/issues/${result.public_id}`) }
            );
          } else {
            router.push(`/issues/${result.public_id}`);
          }
        },
      }
    );
  };

  const isSubmitting = createIssue.isPending || createSolution.isPending;

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

            {/* Title */}
            <Field label="Title">
              <Input
                required
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>

            {/* Description */}
            <Field label="Description">
              <Textarea
                required
                rows={5}
                placeholder="Provide details about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            {/* Category + Department side by side on sm+, stacked on mobile */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Category">
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Select category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Department">
                <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                  <option value="">Select department</option>
                  {departments?.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* Urgency */}
            <Field label="Urgency">
              <Select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </Field>

            {/* Attachments */}
            <Field label="Attachments" hint="Images or PDFs, max 10 MB each">
              <div className="space-y-2">
                <div
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 8,
                    padding: '20px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'var(--bg-surface)',
                    transition: 'border-color 0.15s',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="paperclip" size={20} className="mx-auto mb-1 text-foreground/40" />
                  <p className="text-sm text-foreground/60">
                    {uploading ? 'Uploading...' : 'Click to attach images or PDFs'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </div>

                {uploadError && (
                  <p className="text-sm" style={{ color: 'var(--danger)' }}>{uploadError}</p>
                )}

                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((file) => (
                      <div
                        key={file.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          fontSize: 13,
                        }}
                      >
                        <Icon name="tag" size={14} className="text-foreground/50 shrink-0" />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(file.key)}
                          style={{ color: 'var(--fg-subtle)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            {/* Proposed Solution */}
            <Field
              label="Proposed Solution (optional)"
              hint="If you already have an idea how this could be fixed, share it here."
            >
              <Textarea
                rows={3}
                placeholder="Describe a possible solution or workaround..."
                value={solutionBody}
                onChange={(e) => setSolutionBody(e.target.value)}
              />
            </Field>

            {/* Errors */}
            {(createIssue.isError || createSolution.isError) && (
              <div className="text-sm" style={{ color: 'var(--danger)' }}>
                {createIssue.error instanceof Error
                  ? createIssue.error.message
                  : createSolution.error instanceof Error
                  ? createSolution.error.message
                  : 'Something went wrong. Please try again.'}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={isSubmitting || uploading}>
                {isSubmitting ? 'Submitting...' : 'Submit Issue'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </RouteGuard>
  );
}
