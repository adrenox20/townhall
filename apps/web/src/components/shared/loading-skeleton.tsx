/**
 * Reusable skeleton loading components.
 *
 * These are server-safe (no hooks) and use Tailwind's `animate-pulse`
 * for the shimmer effect. They match the layout of expected content so
 * the page doesn't jump when real data loads in.
 */

interface SkeletonLineProps {
  /** Tailwind width class, e.g. "w-full", "w-48", "w-3/4". Defaults to "w-full". */
  width?: string;
  /** Tailwind height class, e.g. "h-4", "h-8". Defaults to "h-4". */
  height?: string;
  className?: string;
}

/** A single animated placeholder line. */
export function SkeletonLine({ width = 'w-full', height = 'h-4', className = '' }: SkeletonLineProps) {
  return (
    <div
      className={`${height} ${width} rounded bg-[var(--bg-muted)] animate-pulse ${className}`}
    />
  );
}

interface SkeletonCardProps {
  /** Number of text lines inside the card. Defaults to 3. */
  lines?: number;
  className?: string;
}

/** A card-shaped skeleton with a title line and body lines. */
export function SkeletonCard({ lines = 3, className = '' }: SkeletonCardProps) {
  return (
    <div
      className={`rounded-[var(--radius)] border border-[var(--border)] p-4 flex flex-col gap-3 animate-pulse ${className}`}
    >
      {/* Title line */}
      <div className="h-5 w-2/3 rounded bg-[var(--bg-muted)]" />
      {/* Body lines */}
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`h-3 rounded bg-[var(--bg-muted)] ${i === lines - 1 ? 'w-1/2' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

interface SkeletonTableProps {
  /** Number of rows to render. Defaults to 5. */
  rows?: number;
  /** Number of columns per row. Defaults to 4. */
  columns?: number;
  className?: string;
}

/** A table-shaped skeleton with a header row and data rows. */
export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={`flex flex-col gap-2 animate-pulse ${className}`}>
      {/* Header row */}
      <div className="flex gap-4 pb-2 border-b border-[var(--border)]">
        {Array.from({ length: columns }, (_, i) => (
          <div key={i} className="h-4 flex-1 rounded bg-[var(--bg-muted)]" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }, (_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-2">
          {Array.from({ length: columns }, (_, colIdx) => (
            <div
              key={colIdx}
              className={`h-3 flex-1 rounded bg-[var(--bg-muted)] ${colIdx === 0 ? 'max-w-[40%]' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface PageSkeletonProps {
  className?: string;
}

/** Full page skeleton with a header area and a grid of cards. Used by RouteGuard while loading. */
export function PageSkeleton({ className = '' }: PageSkeletonProps) {
  return (
    <div className={`flex flex-col gap-6 p-6 animate-pulse ${className}`}>
      {/* Page header area */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 rounded bg-[var(--bg-muted)]" />
        <div className="h-4 w-72 rounded bg-[var(--bg-muted)]" />
      </div>

      {/* Metric cards row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>

      {/* Content area — table-like skeleton */}
      <SkeletonTable rows={6} columns={4} />
    </div>
  );
}
