import { apiClient } from './api';
import type { AdminPage } from '../types/admin-management';

export const skillCategories = ['Frontend', 'Backend', 'Thiết kế', 'Công cụ & khác'] as const;
export interface AdminSkill { id: string; name: string; category: number | null; isActive: boolean; studentCount: number; iconUrl: string | null }
export interface SkillInput { name: string; category: number | null; isActive: boolean; iconUrl?: string }
export interface SkillQuery { page: number; pageSize: number; search: string; category?: number; isActive?: boolean; sort: string }
export const adminSkillsService = {
  prepareIcon: async (file: File, signal: AbortSignal) => {
    const form = new FormData(); form.append('file', file);
    return (await apiClient.post<Blob>('/admin/skills/icons/preview', form, { signal, responseType: 'blob', headers: { 'Content-Type': undefined } })).data;
  },
  uploadIcon: async (file: File, signal?: AbortSignal) => {
    const form = new FormData(); form.append('file', file);
    return (await apiClient.post<{ imageUrl: string }>('/admin/skills/icons', form, { signal, headers: { 'Content-Type': undefined } })).data.imageUrl;
  },
  removeIconBackground: async (file: File, signal: AbortSignal) => {
    const form = new FormData(); form.append('file', file);
    return (await apiClient.post<Blob>('/admin/skills/icons/remove-background', form, { signal, responseType: 'blob', headers: { 'Content-Type': undefined }, timeout: 120000 })).data;
  },
  list: async (params: SkillQuery, signal: AbortSignal) => (await apiClient.get<AdminPage<AdminSkill>>('/admin/skills', { params, signal })).data,
  save: async (id: string | null, input: SkillInput) => (id
    ? await apiClient.put<AdminSkill>(`/admin/skills/${encodeURIComponent(id)}`, input)
    : await apiClient.post<AdminSkill>('/admin/skills', input)).data,
};
