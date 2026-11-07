import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/notifications-context';
import { getApiErrorMessage } from '../services/api';
import { notificationsService } from '../services/notifications.service';
import type { NotificationItem } from '../types/notifications';
import { safeNotificationTarget } from '../utils/notification-targets';

export function useOpenNotification(onNavigate?: () => void) {
  const { currentUser } = useAuth();
  const { read } = useNotifications();
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const [message, setMessage] = useState('');
  const active = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const open = async (item: NotificationItem) => {
    if (!currentUser || opening) return;
    setOpening(true); setMessage('');
    void read(item);
    try {
      const direct = safeNotificationTarget(item.targetUrl, currentUser.role);
      if (!direct && !item.targetType && !item.targetUrl) return;
      const target = direct ?? await notificationsService.target(item.id);
      if (!active.current) return;
      if (!target && !item.targetType && !item.targetUrl) return;
      const safe = safeNotificationTarget(target, currentUser.role);
      if (!safe) return;
      onNavigate?.(); navigate(safe);
    } catch (cause) { if (active.current) setMessage(getApiErrorMessage(cause, 'Nội dung không còn tồn tại hoặc bạn không có quyền truy cập.')); }
    finally { if (active.current) setOpening(false); }
  };
  return { open, opening, message, setMessage };
}
