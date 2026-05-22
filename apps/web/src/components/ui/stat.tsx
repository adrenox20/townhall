import { Icon } from './icon';

interface StatProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaDir?: 'up' | 'down' | '';
  hint?: string;
}

export function Stat({ label, value, delta, deltaDir, hint }: StatProps) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {delta && (
        <div className={`stat-delta${deltaDir ? ` ${deltaDir}` : ''}`}>
          {deltaDir === 'up' && <Icon name="arrow-up" size={12} stroke={2.4} />}
          {deltaDir === 'down' && (
            <Icon name="arrow-up" size={12} stroke={2.4} style={{ transform: 'rotate(180deg)' }} />
          )}
          {delta}
          {hint && <span style={{ color: 'var(--fg-subtle)', marginLeft: 4 }}>{hint}</span>}
        </div>
      )}
    </div>
  );
}
