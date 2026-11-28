import axios from 'axios';
import { apiClient, getApiErrorMessage } from './api';
import type {
  PendingProjectModerationsResponse,
  ProjectModerationApiError,
  ProjectModerationRecord,
  ReviewProjectRequest,
} from '../types/project-moderation';

const normalizePagination = (page: number, pageSize: number) => ({
  page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
  pageSize: Number.isFinite(pageSize)
    ? Math.min(100, Math.max(1, Math.floor(pageSize)))
    : 10,
});

export const projectModerationService = {
  /**
   * Lấy danh sách hồ sơ Project Hub đang chờ kiểm duyệt thủ công (ReviewRequired)
   */
  getPendingProjects: async (
    page = 1,
    pageSize = 10,
    signal?: AbortSignal
  ): Promise<PendingProjectModerationsResponse> => {
    const query = normalizePagination(page, pageSize);
    const response = await apiClient.get<PendingProjectModerationsResponse>('/project-hub/pending', {
      params: query,
      signal,
    });
    return response.data;
  },

  /**
   * Phê duyệt dự án (ghi chú là tùy chọn)
   */
  approveProject: async (
    projectId: string,
    reviewNote?: string | null,
    signal?: AbortSignal
  ): Promise<ProjectModerationRecord> => {
    const trimmed = reviewNote?.trim();
    const payload: ReviewProjectRequest = {
      reviewNote: trimmed && trimmed.length > 0 ? trimmed : null,
    };
    const response = await apiClient.post<ProjectModerationRecord>(
      `/project-hub/${encodeURIComponent(projectId)}/approve`,
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
   * Từ chối dự án (lý do từ chối là bắt buộc)
   */
  rejectProject: async (
    projectId: string,
    reviewNote: string,
    signal?: AbortSignal
  ): Promise<ProjectModerationRecord> => {
    const trimmed = reviewNote.trim();
    if (!trimmed) {
      throw new Error('Lý do từ chối không được để trống.');
    }
    const payload: ReviewProjectRequest = {
      reviewNote: trimmed,
    };
    const response = await apiClient.post<ProjectModerationRecord>(
      `/project-hub/${encodeURIComponent(projectId)}/reject`,
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
   * Trích xuất lỗi nghiệp vụ {"code":"...","message":"..."} và lỗi HTTP/mạng dự phòng
   */
  extractBusinessError: (error: unknown): ProjectModerationApiError => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as { code?: unknown; message?: unknown } | undefined;
      const code =
        data && typeof data === 'object' && typeof data.code === 'string'
          ? data.code
          : undefined;
      const isNetworkOrTimeout =
        error.code === 'ECONNABORTED' ||
        error.message.toLowerCase().includes('timeout') ||
        !error.response;

      let fallback = 'Đã có lỗi xảy ra khi xử lý kiểm duyệt dự án. Vui lòng thử lại.';
      if (status === 400) {
        fallback =
          code === 'REVIEW_NOTE_REQUIRED'
            ? 'Vui lòng nhập lý do từ chối dự án.'
            : 'Tham số yêu cầu không hợp lệ.';
      } else if (status === 401) {
        fallback = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (status === 403) {
        fallback =
          code === 'PROFILE_NOT_FOUND'
            ? 'Tài khoản chưa có hồ sơ người dùng hợp lệ để thực hiện kiểm duyệt.'
            : 'Bạn không có quyền kiểm duyệt dự án (project.review).';
      } else if (status === 404) {
        fallback = 'Không tìm thấy dự án hoặc hồ sơ kiểm duyệt không còn khả dụng.';
      } else if (status === 409) {
        fallback = 'Hồ sơ kiểm duyệt đã được xử lý hoặc đã thay đổi trạng thái.';
      } else if (isNetworkOrTimeout) {
        fallback = 'Không thể kết nối đến máy chủ hoặc yêu cầu quá thời gian phản hồi.';
      }

      const rawMessage =
        data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()
          ? data.message
          : undefined;

      return {
        status,
        code,
        message: rawMessage || getApiErrorMessage(error, fallback),
        isNetworkOrTimeout,
      };
    }

    return {
      message:
        error instanceof Error
          ? error.message
          : 'Đã có lỗi xảy ra khi xử lý kiểm duyệt dự án. Vui lòng thử lại.',
    };
  },
};

