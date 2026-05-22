import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  title?: string;
  sub?: string;
  action?: ReactNode;
  children?: ReactNode;
  foot?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Card({ title, sub, action, children, foot, className = '', style }: CardProps) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <div className="card-title">{title}</div>}
            {sub && <div className="card-sub">{sub}</div>}
          </div>
          {action}
        </div>
      )}
      {children !== undefined && <div className="card-body">{children}</div>}
      {foot && <div className="card-foot">{foot}</div>}
    </div>
  );
}

export function CardRaw({ className = '', style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

/* Keep old exports so existing imports don't break */
export function CardHeader({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <div className={`card-head ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}
