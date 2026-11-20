import axios from 'axios';
import { apiClient, getApiErrorMessage } from './api';
import type {
  ContentReportResponse,
  ContentReportQuery,
  ReviewContentReportRequest,
} from '../types/community-report';

export interface BusinessApiError {
  code?: string;
  message: string;
  status?: number;
}

export const communityReportService = {
  /**
   * Lấy danh sách báo cáo vi phạm cộng đồng (GET /community/reports)
   * Query: status (0 = Open, 1 = Resolved, 2 = Dismissed), page, pageSize
   */
  getReports: async (
    query?: ContentReportQuery,
    signal?: AbortSignal
  ): Promise<ContentReportResponse[]> => {
    const params: Record<string, unknown> = {
      page: query?.page ?? 1,
      pageSize: query?.pageSize ?? 10,
    };
    if (query?.status !== undefined && query?.status !== null) {
      params.status = query.status;
    }

    const response = await apiClient.get<ContentReportResponse[]>('/community/reports', {
      params,
      signal,
    });
    return response.data;
  },

  /**
   * Lấy chi tiết một báo cáo vi phạm theo UUID (GET /community/reports/{reportId})
   */
  getReportById: async (
    reportId: string,
    signal?: AbortSignal
  ): Promise<ContentReportResponse> => {
    const response = await apiClient.get<ContentReportResponse>(
      `/community/reports/${encodeURIComponent(reportId)}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Đưa ra quyết định kiểm duyệt báo cáo (PATCH /community/reports/{reportId}/review)
   * Body: { isViolation: boolean }
   * - isViolation = false: Không vi phạm (status -> 1 Resolved, bài viết giữ nguyên trạng thái)
   * - isViolation = true: Xác nhận vi phạm (status -> 2 Dismissed, bài viết chuyển sang Hidden)
   */
  reviewReport: async (
    reportId: string,
    isViolation: boolean,
    signal?: AbortSignal
  ): Promise<ContentReportResponse> => {
    const payload: ReviewContentReportRequest = { isViolation };
    const response = await apiClient.patch<ContentReportResponse>(
      `/community/reports/${encodeURIComponent(reportId)}/review`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      }
    );
    return response.data;
  },

  /**
   * Trích xuất thông tin lỗi nghiệp vụ từ backend
   * Backend trả dạng: { code: "REPORT_ALREADY_REVIEWED", message: "This report has already been reviewed." }
   */
  extractBusinessError: (error: unknown): BusinessApiError => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { code?: string; message?: string } | undefined;
      const status = error.response?.status;
      if (data && typeof data === 'object') {
        return {
          code: data.code,
          message: data.message || getApiErrorMessage(error),
          status,
        };
      }
      return {
        message: getApiErrorMessage(error),
        status,
      };
    }
    return {
      message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.',
    };
  },
};

