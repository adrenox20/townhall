'use client';

import { Icon } from './icon';
import type { Toast } from '@/lib/types';

export function ToastWrap({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <Icon name={t.icon} size={14} stroke={2.4} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
