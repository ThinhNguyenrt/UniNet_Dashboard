import { apiClient } from './api';
import type { Specialization, SaveSpecializationRequest } from '../types/specialization';

export const adminSpecializationService = {
  list: async (signal?: AbortSignal): Promise<Specialization[]> => {
    const response = await apiClient.get<Specialization[]>('/admin/specializations', { signal });
    return response.data;
  },

  listActive: async (signal?: AbortSignal): Promise<Specialization[]> => {
    const response = await apiClient.get<Specialization[]>('/specializations', { signal });
    return response.data;
  },

  create: async (data: SaveSpecializationRequest, signal?: AbortSignal): Promise<Specialization> => {
    const response = await apiClient.post<Specialization>('/admin/specializations', data, { signal });
    return response.data;
  },

  update: async (id: string, data: SaveSpecializationRequest, signal?: AbortSignal): Promise<Specialization> => {
    const response = await apiClient.put<Specialization>(
      `/admin/specializations/${encodeURIComponent(id)}`,
      data,
      { signal }
    );
    return response.data;
  },
};

