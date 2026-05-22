import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'outline' | '';
  size?: 'sm' | 'lg' | 'icon' | '';
  icon?: string;
  iconRight?: string;
  block?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = '',
  size = '',
  icon,
  iconRight,
  block,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const cls = [
    'btn',
    variant && `btn--${variant}`,
    size && `btn--${size}`,
    block && 'btn--block',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={14} />}
    </button>
  );
}
