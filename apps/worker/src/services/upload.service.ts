import { id } from '../utils/ids';

export function createObjectKey(userId: string, filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return `${userId}/${id('att')}/${safe}`;
}
