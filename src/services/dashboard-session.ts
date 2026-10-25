import axios from 'axios';
import type { LoginResponse } from '../types/auth';

export const SESSION_GENERATION_KEY = 'uninet_auth_generation';
export const SESSION_REFRESHED_EVENT = 'uninet-auth-refreshed';
export const SESSION_EXPIRED_EVENT = 'uninet-auth-expired';
interface DashboardSession { generation: string; accountId: string; accessToken: string; refreshToken: string | null }
let pending: { generation: string; promise: Promise<string> } | null = null;

export function dashboardSession(): DashboardSession | null {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) return null;
  let accountId: unknown;
  try { accountId = JSON.parse(localStorage.getItem('uninet_account') || localStorage.getItem('uninet_auth_user') || 'null')?.id; } catch { return null; }
  if (typeof accountId !== 'string' || !accountId) return null;
  let generation = localStorage.getItem(SESSION_GENERATION_KEY);
  if (!generation) { generation = crypto.randomUUID(); localStorage.setItem(SESSION_GENERATION_KEY, generation); }
  return { generation, accountId, accessToken, refreshToken: localStorage.getItem('refreshToken') };
}

function current(session: DashboardSession): boolean {
  const next = dashboardSession();
  return !!next && next.generation === session.generation && next.accountId === session.accountId;
}

function expire(session: DashboardSession) {
  if (!current(session)) return;
  for (const key of ['accessToken', 'refreshToken', 'expiresAt', 'uninet_account', 'uninet_auth_user', SESSION_GENERATION_KEY]) localStorage.removeItem(key);
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export async function refreshDashboardSession(session: DashboardSession, apiBase: string): Promise<string> {
  if (!current(session)) throw new Error('Phiên đăng nhập đã thay đổi.');
  const next = dashboardSession();
  if (next && next.accessToken !== session.accessToken) return next.accessToken;
  if (pending?.generation === session.generation) return pending.promise;
  const promise = (async () => {
    if (!session.refreshToken) { expire(session); throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); }
    try {
      // Use a separate client so refresh failures cannot recursively retry themselves.
      const { data } = await axios.post<LoginResponse>(`${apiBase}/auth/refresh`, { refreshToken: session.refreshToken }, { timeout: 30000 });
      if (!current(session)) throw new Error('Phiên đăng nhập đã thay đổi.');
      if (!data?.accessToken || typeof data.accessToken !== 'string' || !data.refreshToken || typeof data.refreshToken !== 'string' || data.account?.id !== session.accountId || !data.expiresAt || !Number.isFinite(Date.parse(data.expiresAt))) {
        expire(session); throw new Error('Phản hồi làm mới phiên không hợp lệ. Vui lòng đăng nhập lại.');
      }
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('expiresAt', data.expiresAt);
      localStorage.setItem('uninet_account', JSON.stringify(data.account));
      window.dispatchEvent(new CustomEvent(SESSION_REFRESHED_EVENT, { detail: data }));
      if (!current(session)) throw new Error('Phiên đăng nhập đã thay đổi.');
      return data.accessToken;
    } catch (cause) {
      if (axios.isAxiosError(cause) && [400, 401, 403].includes(cause.response?.status || 0)) expire(session);
      throw cause;
    }
  })();
  const entry = { generation: session.generation, promise }; pending = entry;
  try { return await promise; } finally { if (pending === entry) pending = null; }
}

export async function dashboardAccessToken(apiBase: string): Promise<string> {
  const session = dashboardSession();
  if (!session) return '';
  const expiry = Date.parse(localStorage.getItem('expiresAt') || '');
  return Number.isFinite(expiry) && expiry - Date.now() < 30000 ? refreshDashboardSession(session, apiBase) : session.accessToken;
}
