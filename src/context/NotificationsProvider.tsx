import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL, getApiErrorMessage } from '../services/api';
import { dashboardAccessToken } from '../services/dashboard-session';
import { notificationsService } from '../services/notifications.service';
import type { NotificationItem } from '../types/notifications';
import { NotificationsContext } from './notifications-context';

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canManage, setCanManage] = useState(false);
  const [revision, setRevision] = useState(0);
  const lifecycle = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const controller = lifecycle.current;
    if (!controller || controller.signal.aborted) return;
    const current = ++sequence.current;
    try {
      const [data, count] = await Promise.all([
        notificationsService.list({ pageSize: 5 }, controller.signal),
        notificationsService.unreadCount(controller.signal),
      ]);
      if (controller.signal.aborted || current !== sequence.current) return;
      setItems(data.items); setUnreadCount(count); setError(''); setRevision(value => value + 1);
    } catch (cause) {
      if (!controller.signal.aborted && current === sequence.current) setError(getApiErrorMessage(cause, 'Không tải được thông báo.'));
    } finally {
      if (!controller.signal.aborted && current === sequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    const updatePermissions = () => notificationsService.permissions(controller.signal).then(value => {
      if (!controller.signal.aborted) setCanManage(value);
    }).catch(() => { if (!controller.signal.aborted) setCanManage(false); });
    void refresh(); void updatePermissions();
    const base = API_BASE_URL === '/api' ? window.location.origin : API_BASE_URL.replace(/\/api\/?$/, '');
    const connection = new HubConnectionBuilder().withUrl(`${base}/hubs/notifications`, {
      accessTokenFactory: () => dashboardAccessToken(API_BASE_URL),
    }).withAutomaticReconnect().configureLogging(LogLevel.None).build();
    connection.on('NotificationChanged', () => { void refresh(); });
    connection.onreconnected(() => { void refresh(); void updatePermissions(); });
    const connect = async () => {
      if (controller.signal.aborted || connection.state !== HubConnectionState.Disconnected) return;
      try { await connection.start(); if (!controller.signal.aborted) await refresh(); }
      catch { /* The API remains available while realtime reconnects. */ }
    };
    void connect();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') { void refresh(); void updatePermissions(); void connect(); }
    }, 30000);
    const resume = () => { if (document.visibilityState === 'visible') { void refresh(); void connect(); } };
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      controller.abort(); lifecycle.current = null; window.clearInterval(timer);
      window.removeEventListener('online', resume); document.removeEventListener('visibilitychange', resume);
      connection.off('NotificationChanged'); void connection.stop();
    };
  }, [refresh]);

  const read = useCallback(async (id: string) => { await notificationsService.read(id); await refresh(); }, [refresh]);
  const readAll = useCallback(async () => { await notificationsService.readAll(); await refresh(); }, [refresh]);
  return <NotificationsContext.Provider value={{ items, unreadCount, loading, error, canManage, revision, refresh, read, readAll }}>{children}</NotificationsContext.Provider>;
}
