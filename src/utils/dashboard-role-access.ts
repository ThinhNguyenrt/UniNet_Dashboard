import type { UserRole } from '../types/auth';
export function dashboardRole(value: unknown): UserRole | null {
  const names: Record<string, UserRole> = { '3': 'verifier', verifier: 'verifier', '4': 'moderator', moderator: 'moderator', '5': 'accountant', accountant: 'accountant', '6': 'admin', admin: 'admin' };
  const key = String(value).trim().toLowerCase();
  return Object.hasOwn(names, key) ? names[key] : null;
}
export function isDashboardRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ['admin', 'accountant', 'moderator', 'verifier'].includes(value);
}
