import type { Person } from '@/lib/types';

interface AvatarProps {
  person: Person | null | undefined;
  size?: 'sm' | 'lg' | 'xl' | '';
}

export function Avatar({ person, size = '' }: AvatarProps) {
  if (!person) return null;
  return (
    <span
      className={`avatar${size ? ` avatar--${size}` : ''}`}
      style={{ background: person.color, color: 'white', borderColor: 'transparent' }}
      title={person.name}
    >
      {person.avatar}
    </span>
  );
}
