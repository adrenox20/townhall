'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { ApiComment } from '@/hooks/use-comments';

export function CommentList({ comments, isLoading }: { comments?: ApiComment[]; isLoading?: boolean }) {
  if (isLoading) return <Card><CardContent className="p-6 text-foreground/60">Loading comments…</CardContent></Card>;

  return (
    <Card>
      <CardHeader><h2 className="font-semibold">Comments and notes</h2></CardHeader>
      <CardContent className="space-y-3">
        {!comments?.length ? (
          <p className="text-sm text-foreground/60">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-md bg-muted p-3 text-sm">
              <div className="mb-1 text-xs text-foreground/50">
                {c.author?.name ?? 'User'}
                {c.is_official ? ' · Official' : ''}
                {c.is_internal ? ' · Internal' : ''}
              </div>
              <p>{c.body}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
