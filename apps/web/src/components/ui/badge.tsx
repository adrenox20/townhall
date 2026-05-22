import { statusLabels, statusBadgeClass, urgencyColors } from '@/lib/constants';

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = '', style }: BadgeProps) {
  const variantClass = variant === 'danger' ? ' badge--danger' : (variant ? ` badge--${variant}` : '');
  return (
    <span className={`badge${variantClass}`} style={style}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] || status;
  const cls = statusBadgeClass[status] || 'badge--open';
  return (
    <span className={`badge ${cls}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

export function PriorityDot({ p }: { p: string }) {
  const color = urgencyColors[p] || urgencyColors.medium;
  return (
    <span
      title={p}
      style={{
        display: 'inline-block', width: 8, height: 8,
        borderRadius: 999, background: color, flexShrink: 0,
      }}
    />
  );
}

export function CategoryBadge({ name }: { name: string }) {
  if (!name) return null;
  return <span className="badge">{name}</span>;
}
