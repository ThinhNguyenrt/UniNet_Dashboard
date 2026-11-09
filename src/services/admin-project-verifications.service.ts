import { apiClient } from './api';
import type {
  ProjectVerificationsResponse,
  ProjectVerificationDetailResponse,
  AdminVerificationDetailResponse,
  VerificationReportResponse,
  VerificationRefundResponse,
  ProjectVerificationFilter,
} from '../types/admin-project-verifications';

const packageCache = new Map<string, { id: string; name: string; code: string; price: number }>();

export const adminProjectVerificationsService = {
  /**
   * Danh sách hồ sơ thẩm định chung với bộ lọc
   */
  async list(
    filter: ProjectVerificationFilter = {},
    signal?: AbortSignal
  ): Promise<ProjectVerificationsResponse> {
    const params = new URLSearchParams();
    if (filter.status !== undefined && filter.status !== null) {
      params.append('status', filter.status.toString());
    }
    if (filter.from) {
      params.append('from', filter.from);
    }
    if (filter.to) {
      params.append('to', filter.to);
    }
    params.append('page', (filter.page || 1).toString());
    params.append('pageSize', (filter.pageSize || 10).toString());

    const response = await apiClient.get<ProjectVerificationsResponse>(
      `/admin/project-verifications?${params.toString()}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Hàng đợi hồ sơ chờ phân công thẩm định viên
   */
  async getPendingAssignment(
    page = 1,
    pageSize = 10,
    signal?: AbortSignal
  ): Promise<ProjectVerificationsResponse> {
    const response = await apiClient.get<ProjectVerificationsResponse>(
      `/admin/project-verifications/pending-assignment?page=${page}&pageSize=${pageSize}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Hàng đợi hồ sơ quá hạn (cuộc họp hoặc deadline phân công/báo cáo)
   */
  async getOverdue(
    page = 1,
    pageSize = 10,
    signal?: AbortSignal
  ): Promise<ProjectVerificationsResponse> {
    const response = await apiClient.get<ProjectVerificationsResponse>(
      `/admin/project-verifications/overdue?page=${page}&pageSize=${pageSize}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Chi tiết hồ sơ thẩm định dự án (tự động unwrap detail)
   */
  async getDetail(
    verificationId: string,
    signal?: AbortSignal
  ): Promise<ProjectVerificationDetailResponse> {
    const response = await apiClient.get<AdminVerificationDetailResponse>(
      `/admin/project-verifications/${verificationId}`,
      { signal }
    );
    return response.data.detail;
  },

  /**
   * Danh sách báo cáo thẩm định của hồ sơ
   */
  async getReports(
    verificationId: string,
    signal?: AbortSignal
  ): Promise<VerificationReportResponse[]> {
    const response = await apiClient.get<VerificationReportResponse[]>(
      `/admin/project-verifications/${verificationId}/reports`,
      { signal }
    );
    return response.data;
  },

  /**
   * Danh sách yêu cầu hoàn tiền của hồ sơ
   */
  async getRefunds(
    verificationId: string,
    signal?: AbortSignal
  ): Promise<VerificationRefundResponse[]> {
    const response = await apiClient.get<VerificationRefundResponse[]>(
      `/admin/project-verifications/${verificationId}/refunds`,
      { signal }
    );
    return response.data;
  },

  /**
   * Lấy thông tin gói dịch vụ theo ID (có cache tránh gọi lặp)
   */
  async getPackage(
    packageId: string,
    signal?: AbortSignal
  ): Promise<{ id: string; name: string; code: string; price: number } | null> {
    if (!packageId) return null;
    if (packageCache.has(packageId)) {
      return packageCache.get(packageId)!;
    }
    try {
      const response = await apiClient.get<{ id: string; name: string; code: string; price: number }>(
        `/packages/${packageId}`,
        { signal }
      );
      if (response.data) {
        packageCache.set(packageId, response.data);
      }
      return response.data;
    } catch {
      return null;
    }
  },
};

