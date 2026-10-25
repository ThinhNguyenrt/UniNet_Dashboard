import { createContext, useContext } from 'react';
import type { NotificationItem } from '../types/notifications';

export interface NotificationsState {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string;
  canManage: boolean;
  revision: number;
  refresh: () => Promise<void>;
  read: (id: string) => Promise<void>;
  readAll: () => Promise<void>;
}

export const NotificationsContext = createContext<NotificationsState | null>(null);
export function useNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error('NotificationsProvider is required.');
  return value;
}
