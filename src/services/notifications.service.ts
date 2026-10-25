import { apiClient } from './api';
import type { BroadcastInput, NotificationBroadcast, NotificationPage } from '../types/notifications';

const broadcasts = '/admin/notification-broadcasts';
export const notificationsService = {
  list: async (params: { page?: number; pageSize?: number; unreadOnly?: boolean; category?: string } = {}, signal?: AbortSignal) =>
    (await apiClient.get<NotificationPage>('/notifications', { params, signal })).data,
  unreadCount: async (signal?: AbortSignal) => (await apiClient.get<{ count: number }>('/notifications/unread-count', { signal })).data.count,
  read: async (id: string) => { await apiClient.patch(`/notifications/${encodeURIComponent(id)}/read`); },
  readAll: async () => { await apiClient.patch('/notifications/read-all'); },
  target: async (id: string) => (await apiClient.get<{ targetUrl: string | null }>(`/notifications/${encodeURIComponent(id)}/target`)).data.targetUrl,
  permissions: async (signal?: AbortSignal) => (await apiClient.get<{ canManage: boolean }>(`${broadcasts}/permissions`, { signal })).data.canManage,
  broadcasts: async (signal?: AbortSignal) => (await apiClient.get<NotificationBroadcast[]>(broadcasts, { signal })).data,
  create: async (input: BroadcastInput) => (await apiClient.post<NotificationBroadcast>(broadcasts, input)).data,
  preview: async (id: string) => (await apiClient.post<{ recipientCount: number }>(`${broadcasts}/${encodeURIComponent(id)}/preview`)).data,
  publish: async (id: string) => (await apiClient.post<NotificationBroadcast>(`${broadcasts}/${encodeURIComponent(id)}/publish`)).data,
  cancel: async (id: string) => (await apiClient.post<NotificationBroadcast>(`${broadcasts}/${encodeURIComponent(id)}/cancel`)).data,
};
