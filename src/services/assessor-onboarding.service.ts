import axios from 'axios';
import { apiClient } from './api';
import type {
  AssessorInvitationResponse,
  AssessorOnboardingReviewResponse,
  AssessorReviewResult,
  CreateAssessorInvitationRequest,
  AssessorOnboardingsListResponse,
  AssessorOnboardingFilter,
} from '../types/assessor-onboarding';

export class ApprovalConflictError extends Error {
  conflictData: AssessorReviewResult;
  constructor(data: AssessorReviewResult) {
    super(data.reviewReason || 'Email đã tồn tại tài khoản hoặc xung đột hồ sơ mở.');
    this.name = 'ApprovalConflictError';
    this.conflictData = data;
  }
}

export class ContractUnavailableError extends Error {
  code?: string;
  constructor(message = 'Bản hợp đồng chưa sẵn sàng hoặc không khả dụng.', code?: string) {
    super(message);
    this.name = 'ContractUnavailableError';
    this.code = code;
  }
}

export const assessorOnboardingService = {
  /**
   * Lấy danh sách hồ sơ onboarding thẩm định viên (phân trang, lọc trạng thái, tìm kiếm từ khóa)
   * GET /api/admin/assessor-onboardings?keyword=...&status=...&page=...&pageSize=...
   */
  async list(
    filter: AssessorOnboardingFilter = {},
    signal?: AbortSignal
  ): Promise<AssessorOnboardingsListResponse> {
    const params = new URLSearchParams();
    if (filter.keyword && filter.keyword.trim()) {
      params.append('keyword', filter.keyword.trim().slice(0, 255));
    }
    if (filter.status && filter.status !== 'all') {
      params.append('status', filter.status);
    }
    params.append('page', (filter.page && filter.page > 0 ? filter.page : 1).toString());
    params.append(
      'pageSize',
      (filter.pageSize && filter.pageSize > 0 && filter.pageSize <= 100
        ? filter.pageSize
        : 20
      ).toString()
    );

    const response = await apiClient.get<AssessorOnboardingsListResponse>(
      `/admin/assessor-onboardings?${params.toString()}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Tạo lời mời onboarding thẩm định viên mới
   */
  async invite(req: CreateAssessorInvitationRequest): Promise<AssessorInvitationResponse> {
    const response = await apiClient.post<AssessorInvitationResponse>(
      '/admin/assessor-onboardings/invitations',
      {
        email: req.email.trim(),
        autoApprove: Boolean(req.autoApprove),
      }
    );
    return response.data;
  },

  /**
   * Thu hồi lời mời onboarding (áp dụng cho Invited, ProfileSubmitted, AwaitingSignature, AwaitingApproval)
   */
  async revoke(id: string): Promise<void> {
    await apiClient.post(`/admin/assessor-onboardings/invitations/${id}/revoke`, {});
  },

  /**
   * Lấy chi tiết thông tin hồ sơ onboarding theo ID
   */
  async getDetail(id: string, signal?: AbortSignal): Promise<AssessorOnboardingReviewResponse> {
    const response = await apiClient.get<AssessorOnboardingReviewResponse>(
      `/admin/assessor-onboardings/${id}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Tải file hợp đồng PDF dưới dạng Blob kèm token Authorization
   */
  async getContractPdf(id: string, signal?: AbortSignal): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(
        `/admin/assessor-onboardings/${id}/contract`,
        {
          responseType: 'blob',
          signal,
        }
      );
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          const errorMsg = json?.message || json?.error || json?.code;
          if (err.response.status === 404 || json?.code === 'CONTRACT_UNAVAILABLE') {
            throw new ContractUnavailableError(
              errorMsg || 'Chưa có bản hợp đồng nào được tạo cho hồ sơ này.',
              json?.code
            );
          }
          throw new Error(errorMsg || 'Không thể tải bản hợp đồng.', { cause: err });
        } catch (parseErr) {
          if (parseErr instanceof ContractUnavailableError || parseErr instanceof Error) {
            throw parseErr;
          }
        }
      }
      throw err;
    }
  },

  /**
   * Phê duyệt hồ sơ thẩm định viên (chuyển sang AwaitingPassword, cấp tài khoản)
   */
  async approve(id: string): Promise<AssessorReviewResult> {
    try {
      const response = await apiClient.post<AssessorReviewResult>(
        `/admin/assessor-onboardings/${id}/approve`,
        {}
      );
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409 && err.response.data) {
        const errorData = err.response.data as AssessorReviewResult;
        if (errorData.status === 'ApprovalConflict') {
          throw new ApprovalConflictError(errorData);
        }
      }
      throw err;
    }
  },

  /**
   * Từ chối hồ sơ thẩm định viên kèm lý do cụ thể gửi qua email
   */
  async reject(id: string, reason: string): Promise<AssessorReviewResult> {
    const response = await apiClient.post<AssessorReviewResult>(
      `/admin/assessor-onboardings/${id}/reject`,
      {
        reason: reason.trim(),
      }
    );
    return response.data;
  },

  /**
   * Gửi lại đường dẫn ký hợp đồng (chỉ cho AwaitingSignature, cooldown 60s)
   */
  async resendContract(id: string): Promise<void> {
    await apiClient.post(`/admin/assessor-onboardings/${id}/resend-contract`, {});
  },

  /**
   * Gửi lại đường dẫn kích hoạt/đặt mật khẩu (chỉ cho AwaitingPassword, cooldown 60s)
   */
  async resendPassword(id: string): Promise<void> {
    await apiClient.post(`/admin/assessor-onboardings/${id}/resend-password`, {});
  },
};
