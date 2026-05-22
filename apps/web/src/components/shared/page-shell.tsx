"use client";

import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/shared/loading-skeleton";

export function PageShell({
  title,
  subtitle,
  children,
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyMessage = "Nothing here yet.",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyMessage?: string;
}) {
  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="space-y-5">
        <div className="page-head">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-sub">{subtitle}</p>}
        </div>
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <p style={{ marginBottom: 12 }}>{error.message || "Something went wrong."}</p>
          {onRetry && <Button variant="primary" onClick={onRetry}>Retry</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-sub">{subtitle}</p>}
        </div>
      </div>
      {isEmpty ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--fg-subtle)" }}>{emptyMessage}</div>
      ) : (
        children
      )}
    </div>
  );
}
