import { apiClient } from './api';
import type { AdminCapabilities, AdminPage, AdminUser, PermissionEntry, UserDetail, UserStats, VerificationDetail, VerificationKind, VerificationPage, VerificationStats } from '../types/admin-management';

export interface UserQuery { page: number; pageSize: number; search: string; role?: number; status?: number; verification?: string; sort: string; desc: boolean; staffOnly?: boolean }
export interface VerificationQuery { page: number; pageSize: number; search: string; status?: number; sort: string; desc: boolean }
const verificationPath = (kind: VerificationKind) => `/admin/${kind}-verifications`;
export const adminManagementService = {
  capabilities: async (signal?: AbortSignal) => {
    const value = (await apiClient.get<AdminCapabilities>('/admin/management', { signal })).data;
    if (!value || !Array.isArray(value.permissions) || value.permissions.some(permission => typeof permission !== 'string')) throw new Error('Không đọc được quyền quản trị.');
    return value;
  },
  users: async (params: UserQuery, signal?: AbortSignal) => (await apiClient.get<AdminPage<AdminUser>>('/admin/users', { params, signal })).data,
  userStats: async (signal?: AbortSignal) => (await apiClient.get<UserStats>('/admin/users/stats', { signal })).data,
  user: async (id: string, signal?: AbortSignal) => (await apiClient.get<UserDetail>(`/admin/users/${encodeURIComponent(id)}`, { signal })).data,
  changeStatus: async (id: string, locked: boolean, reason: string) => (await apiClient.post<AdminUser>(`/admin/users/${encodeURIComponent(id)}/${locked ? 'lock' : 'unlock'}`, { reason })).data,
  verifications: async (kind: VerificationKind, params: VerificationQuery, signal?: AbortSignal) => (await apiClient.get<VerificationPage>(verificationPath(kind), { params, signal })).data,
  verificationStats: async (kind: VerificationKind, signal?: AbortSignal) => (await apiClient.get<VerificationStats>(verificationPath(kind) + '/stats', { signal })).data,
  verification: async (kind: VerificationKind, id: string, signal?: AbortSignal) => (await apiClient.get<VerificationDetail>(verificationPath(kind) + '/' + encodeURIComponent(id), { signal })).data,
  review: async (kind: VerificationKind, id: string, approve: boolean, reason: string) => { await apiClient.post(`${verificationPath(kind)}/${encodeURIComponent(id)}/${approve ? 'approve' : 'reject'}`, approve ? {} : { reason }); },
  document: async (kind: VerificationKind, id: string, index: number, signal?: AbortSignal) => (await apiClient.get<Blob>(kind === 'student' ? `/student/verification/${encodeURIComponent(id)}/document` : `${verificationPath(kind)}/${encodeURIComponent(id)}/documents/${index}`, { responseType: 'blob', signal })).data,
  externalDocument: async (id: string, index: number) => (await apiClient.get<{ url: string }>(`/admin/partner-verifications/${encodeURIComponent(id)}/documents/${index}/external`)).data.url,
  permissions: async (id: string, signal?: AbortSignal) => (await apiClient.get<PermissionEntry[]>(`/admin/permissions/${encodeURIComponent(id)}`, { signal })).data,
  setPermissions: async (id: string, changes: { permission: string; granted: boolean }[]) => { await apiClient.put(`/admin/permissions/${encodeURIComponent(id)}`, changes); },
  createStaff: async (request: { fullName: string; email: string; password: string; confirmPassword: string; role: number }) => { await apiClient.post('/staff/accounts', request); },
};
