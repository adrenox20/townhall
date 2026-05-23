'use client';

import { useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateIssue, useCategories } from '@/hooks/use-issues';
import { useCreateSolution } from '@/hooks/use-solutions';
import { RouteGuard } from '@/components/shared/route-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select, Field } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { API_URL } from '@/lib/constants';

const TITLE_MIN = 5;
const TITLE_MAX = 150;
const DESC_MIN = 10;
const DESC_MAX = 5000;
const SOLUTION_MAX = 3000;

interface UploadedFile {
  key: string;
  name: string;
  url: string;
  contentType: string;
  sizeBytes: number;
}

interface FormErrors {
  title?: string;
  description?: string;
  solution?: string;
}

function validate(title: string, description: string, solution: string): FormErrors {
  const errors: FormErrors = {};
  const t = title.trim();
  const d = description.trim();
  const s = solution.trim();

  if (!t) {
    errors.title = 'Title is required.';
  } else if (t.length < TITLE_MIN) {
    errors.title = `Title must be at least ${TITLE_MIN} characters.`;
  } else if (t.length > TITLE_MAX) {
    errors.title = `Title must be ${TITLE_MAX} characters or fewer.`;
  }

  if (!d) {
    errors.description = 'Description is required.';
  } else if (d.length < DESC_MIN) {
    errors.description = `Description must be at least ${DESC_MIN} characters.`;
  } else if (d.length > DESC_MAX) {
    errors.description = `Description must be ${DESC_MAX} characters or fewer.`;
  }

  if (s && s.length > SOLUTION_MAX) {
    errors.solution = `Proposed solution must be ${SOLUTION_MAX} characters or fewer.`;
  }

  return errors;
}

export default function NewIssuePage() {
  const router = useRouter();
  const createIssue = useCreateIssue();
  const createSolution = useCreateSolution();
  const { data: categories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [categoryId, setCategoryId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [solutionBody, setSolutionBody] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-validate live only after first submit attempt
  function handleTitleChange(v: string) {
    setTitle(v);
    if (submitted) setErrors(e => ({ ...e, title: validate(v, description, solutionBody).title }));
  }
  function handleDescChange(v: string) {
    setDescription(v);
    if (submitted) setErrors(e => ({ ...e, description: validate(title, v, solutionBody).description }));
  }
  function handleSolutionChange(v: string) {
    setSolutionBody(v);
    if (submitted) setErrors(e => ({ ...e, solution: validate(title, description, v).solution }));
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadError('');
    setUploading(true);

    for (const file of files) {
      const isVideo = file.type === 'video/mp4';
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      const maxLabel = isVideo ? '50 MB' : '10 MB';
      if (file.size > maxSize) {
        setUploadError(`${file.name} exceeds the ${maxLabel} limit.`);
        continue;
      }
      const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'video/mp4'];
      if (!allowed.includes(file.type)) {
        setUploadError(`${file.name} is not an allowed file type (PNG, JPEG, WebP, PDF, MP4).`);
        continue;
      }
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: Record<string, string> = { 'content-type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const presignRes = await fetch(`${API_URL}/uploads/presign`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ filename: file.name, contentType: file.type, sizeBytes: file.size }),
        });
        const presignJson = await presignRes.json() as { data: { key: string; uploadUrl: string } };
        const { key, uploadUrl } = presignJson.data;

        await fetch(`${API_URL.replace('/api/v1', '')}${uploadUrl}`, {
          method: 'PUT',
          body: file,
          headers: { 'content-type': file.type, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          credentials: 'include',
        });

        setAttachments((prev) => [...prev, { key, name: file.name, url: uploadUrl, contentType: file.type, sizeBytes: file.size }]);
      } catch {
        setUploadError(`Failed to upload ${file.name}.`);
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
    setSubmitted(true);
    const fieldErrors = validate(title, description, solutionBody);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    createIssue.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        urgency,
        isAnonymous,
        ...(categoryId && { category_id: categoryId }),
        attachments: attachments.map(a => ({
          key: a.key,
          filename: a.name,
          contentType: a.contentType,
          sizeBytes: a.sizeBytes,
        })),
      },
      {
        onSuccess: (result) => {
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
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Title */}
            <Field
              label="Title"
              error={errors.title}
              hint={`${title.length}/${TITLE_MAX} characters · min ${TITLE_MIN}`}
            >
              <Input
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                maxLength={TITLE_MAX + 50}
                style={errors.title ? { borderColor: 'var(--danger)' } : undefined}
              />
            </Field>

            {/* Description */}
            <Field
              label="Description"
              error={errors.description}
              hint={`${description.length}/${DESC_MAX} characters · min ${DESC_MIN}`}
            >
              <Textarea
                rows={5}
                placeholder="Provide details about the issue — where it happens, how often, what you've tried…"
                value={description}
                onChange={(e) => handleDescChange(e.target.value)}
                maxLength={DESC_MAX + 200}
                style={errors.description ? { borderColor: 'var(--danger)' } : undefined}
              />
            </Field>

            {/* Category */}
            <Field label="Category" hint="Choose the most relevant category for your issue.">
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Select category (optional)</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>

            {/* Urgency */}
            <Field label="Urgency" hint="How urgently does this need to be addressed?">
              <Select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                <option value="low">Low — minor inconvenience</option>
                <option value="medium">Medium — affects daily work</option>
                <option value="high">High — significant disruption</option>
              </Select>
            </Field>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--bg-surface)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>
                  Submit anonymously
                </span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 13, color: 'var(--fg-subtle)', lineHeight: 1.4 }}>
                  Your name will be hidden from public issue views.
                </span>
              </span>
            </label>

            {/* Attachments */}
            <Field label="Attachments" hint="Images, PDFs, or MP4 videos, max 10 MB each.">
              <div className="space-y-2">
                <div
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 8,
                    padding: '20px 16px',
                    textAlign: 'center',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    background: 'var(--bg-surface)',
                    transition: 'border-color 0.15s',
                    opacity: uploading ? 0.6 : 1,
                  }}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  <Icon name="paperclip" size={20} className="mx-auto mb-1 text-foreground/40" />
                  <p className="text-sm text-foreground/60">
                    {uploading ? 'Uploading…' : 'Click to attach images, PDFs, or videos'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,application/pdf,video/mp4"
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
              error={errors.solution}
              hint={solutionBody ? `${solutionBody.length}/${SOLUTION_MAX} characters` : 'If you have an idea how this could be fixed, share it here.'}
            >
              <Textarea
                rows={3}
                placeholder="Describe a possible solution or workaround…"
                value={solutionBody}
                onChange={(e) => handleSolutionChange(e.target.value)}
                maxLength={SOLUTION_MAX + 100}
                style={errors.solution ? { borderColor: 'var(--danger)' } : undefined}
              />
            </Field>

            {/* API error */}
            {(createIssue.isError || createSolution.isError) && (
              <div className="text-sm" style={{ color: 'var(--danger)', padding: '8px 12px', background: 'color-mix(in srgb, var(--danger) 10%, transparent)', borderRadius: 6 }}>
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
                {isSubmitting ? 'Submitting…' : 'Submit Issue'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </RouteGuard>
  );
}
