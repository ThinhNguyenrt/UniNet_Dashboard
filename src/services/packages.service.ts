import { apiClient } from './api';
import type {
  PackageFilter,
  PackageResponse,
  PackagesResponse,
  SavePackageRequest,
} from '../types/packages';

export const packagesService = {
  /**
   * Lấy danh sách gói dịch vụ cho Admin (bao gồm cả gói đang hoạt động và ngừng hoạt động)
   */
  async listAdmin(filter?: PackageFilter, signal?: AbortSignal): Promise<PackagesResponse> {
    const params = new URLSearchParams();

    if (filter?.type !== undefined && filter.type !== null) {
      params.append('type', String(filter.type));
    }
    if (filter?.role !== undefined && filter.role !== null) {
      params.append('role', String(filter.role));
    }
    if (filter?.isActive !== undefined && filter.isActive !== null) {
      params.append('isActive', String(filter.isActive));
    }
    if (filter?.keyword && filter.keyword.trim().length > 0) {
      params.append('keyword', filter.keyword.trim());
    }
    if (filter?.page !== undefined && filter.page > 0) {
      params.append('page', String(filter.page));
    }
    if (filter?.pageSize !== undefined && filter.pageSize > 0) {
      params.append('pageSize', String(filter.pageSize));
    }

    const query = params.toString();
    const url = `/packages/admin${query ? `?${query}` : ''}`;
    const response = await apiClient.get<PackagesResponse>(url, { signal });
    return response.data;
  },

  /**
   * Lấy chi tiết gói dịch vụ theo ID
   */
  async get(id: string, signal?: AbortSignal): Promise<PackageResponse> {
    const response = await apiClient.get<PackageResponse>(`/packages/${id}`, { signal });
    return response.data;
  },

  /**
   * Tạo mới gói dịch vụ
   */
  async create(data: SavePackageRequest): Promise<PackageResponse> {
    const response = await apiClient.post<PackageResponse>('/packages', data);
    return response.data;
  },

  /**
   * Cập nhật thông tin gói dịch vụ
   */
  async update(id: string, data: SavePackageRequest): Promise<PackageResponse> {
    const response = await apiClient.put<PackageResponse>(`/packages/${id}`, data);
    return response.data;
  },

  /**
   * Đảo trạng thái kích hoạt của gói dịch vụ (PATCH /api/packages/{id}/status)
   */
  async toggleStatus(id: string): Promise<PackageResponse> {
    const response = await apiClient.patch<PackageResponse>(`/packages/${id}/status`, {});
    return response.data;
  },

  /**
   * Ngừng cung cấp gói dịch vụ (vô hiệu hóa mềm, DELETE trả về 204 No Content)
   */
  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`/packages/${id}`);
  },
};

