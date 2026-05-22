import { STATUS, PRIORITY, categoryById } from '@/lib/data';

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = '', style }: BadgeProps) {
  return (
    <span className={`badge${variant ? ` badge--${variant}` : ''}`} style={style}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <span className={`badge ${s.cls}`}>
      <span className="dot" />
      {s.label}
    </span>
  );
}

export function PriorityDot({ p }: { p: string }) {
  const priority = PRIORITY[p];
  if (!priority) return null;
  return (
    <span
      title={priority.label}
      style={{
        display: 'inline-block', width: 8, height: 8,
        borderRadius: 999, background: priority.color,
        flexShrink: 0,
      }}
    />
  );
}

export function CategoryBadge({ id }: { id: string }) {
  const c = categoryById[id];
  if (!c) return null;
  return (
    <span
      className="badge"
      style={{
        background: `color-mix(in oklab, ${c.color} 14%, transparent)`,
        color: c.color,
        borderColor: `color-mix(in oklab, ${c.color} 30%, transparent)`,
      }}
    >
      <span className="dot" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}
