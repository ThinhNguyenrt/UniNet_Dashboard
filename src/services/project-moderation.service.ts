import { apiClient } from './api';
import type {
  PendingProjectModerationsResponse,
  ProjectModerationRecord,
  ReviewProjectRequest,
} from '../types/project-moderation';

export const projectModerationService = {
  /**
   * Lấy danh sách hồ sơ dự án đang chờ kiểm duyệt thủ công (ReviewRequired)
   */
  getPendingProjects: async (
    page = 1,
    pageSize = 10,
    signal?: AbortSignal
  ): Promise<PendingProjectModerationsResponse> => {
    const response = await apiClient.get<PendingProjectModerationsResponse>('/projects/pending', {
      params: { page, pageSize },
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
      `/projects/${encodeURIComponent(projectId)}/approve`,
      payload,
      { signal }
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
      `/projects/${encodeURIComponent(projectId)}/reject`,
      payload,
      { signal }
    );
    return response.data;
  },
};

