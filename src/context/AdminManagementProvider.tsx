import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { adminManagementService } from '../services/admin-management.service';
import { getApiErrorMessage } from '../services/api';
import type { AdminCapabilities } from '../types/admin-management';
import { AdminManagementContext } from './admin-management-context';
import { useNotifications } from './notifications-context';

export function AdminManagementProvider({ children }: { children: ReactNode }) {
  const [capabilities, setCapabilities] = useState<AdminCapabilities | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const { revision } = useNotifications();
  const refresh = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    void adminManagementService.capabilities(controller.signal).then(result => {
      if (!controller.signal.aborted) { setCapabilities(result); setError(''); }
    }).catch(cause => { if (!controller.signal.aborted) {
      setCapabilities(null);
      setError(isAxiosError(cause) && cause.response?.status === 404
        ? 'Backend chưa cung cấp API quản lý (/api/admin/management). Hãy cập nhật backend hoặc trỏ VITE_API_BASE_URL tới BE local có chức năng quản lý, rồi khởi động lại Dashboard.'
        : getApiErrorMessage(cause));
    } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision, attempt]);
  return <AdminManagementContext.Provider value={{ capabilities, loading, error, has: permission => capabilities?.permissions.includes(permission) ?? false, refresh }}>{children}</AdminManagementContext.Provider>;
}
