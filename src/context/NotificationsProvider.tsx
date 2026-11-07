import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL, getApiErrorMessage } from '../services/api';
import { dashboardAccessToken, dashboardSession } from '../services/dashboard-session';
import { notificationsService } from '../services/notifications.service';
import type { NotificationItem } from '../types/notifications';
import { NotificationsContext } from './notifications-context';

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canManage, setCanManage] = useState(false);
  const [revision, setRevision] = useState(0);
  const [readStates, setReadStates] = useState<Record<string, string | null>>({});
  const [readError, setReadError] = useState('');
  const pendingReads = useRef(new Set<string>());
  const localReads = useRef<Record<string, string | null>>({});
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
      if (controller.signal.aborted || current !== sequence.current || pendingReads.current.size) return;
      setItems(data.items); setTotalCount(data.total); setUnreadCount(count); setError(''); setRevision(value => value + 1);
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

  const read = useCallback(async (item: NotificationItem) => {
    if (pendingReads.current.has(item.id) || (item.id in localReads.current ? localReads.current[item.id] : item.readAt)) return;
    const controller = lifecycle.current;
    if (!controller || controller.signal.aborted) return;
    const session = dashboardSession();
    const active = () => !controller.signal.aborted && dashboardSession()?.generation === session?.generation;
    pendingReads.current.add(item.id); ++sequence.current;
    localReads.current = { ...localReads.current, [item.id]: new Date().toISOString() };
    setReadStates(localReads.current); setUnreadCount(count => Math.max(0, count - 1)); setReadError('');
    try { await notificationsService.read(item.id); }
    catch (cause) {
      if (active()) {
        localReads.current = { ...localReads.current, [item.id]: null };
        setReadStates(localReads.current); setUnreadCount(count => count + 1);
        setReadError(getApiErrorMessage(cause, 'Chưa đánh dấu được thông báo. Vui lòng thử lại.'));
      }
    } finally {
      pendingReads.current.delete(item.id); ++sequence.current;
      if (active() && !pendingReads.current.size) void refresh();
    }
  }, [refresh]);
  const readAll = useCallback(async () => { await notificationsService.readAll(); localReads.current = {}; setReadStates({}); await refresh(); }, [refresh]);
  return <NotificationsContext.Provider value={{ items: items.map(item => item.id in readStates ? { ...item, readAt: readStates[item.id] } : item), unreadCount, totalCount, loading, error, canManage, revision, readStates, refresh, read, readAll }}>
    {readError && <div role="alert" className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{readError}<button type="button" aria-label="Đóng thông báo lỗi" onClick={() => setReadError('')} className="ml-3 font-semibold">×</button></div>}
    {children}
  </NotificationsContext.Provider>;
}
