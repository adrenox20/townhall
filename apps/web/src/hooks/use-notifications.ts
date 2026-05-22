import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ApiNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  issue_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<ApiNotification[]>('/notifications'),
  });
}
