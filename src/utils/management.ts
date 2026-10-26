export const managementInput = 'min-h-11 lg:min-h-10 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 lg:py-1.5 text-sm text-slate-700 outline-blue-500';
export const managementButton = 'inline-flex min-h-11 lg:min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 lg:py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-40';
export function managementDate(value: string | null | undefined) {
  if (!value) return '—'; const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}
export function safeManagementImage(value: string | null | undefined) {
  if (!value) return undefined;
  try { const base = new URL(API_BASE_URL, window.location.origin); const url = new URL(value, base.origin); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
import { API_BASE_URL } from '../services/api';

