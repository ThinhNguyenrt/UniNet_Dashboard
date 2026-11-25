import axios from 'axios';
import { apiClient, getApiErrorMessage } from './api';
import type { ApiErrorResponse } from '../types/auth';
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
    super('Email đã được đăng ký. Hồ sơ chưa được phê duyệt.');
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

export type OnboardingActionErrorKind =
  | 'invalid_reason'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'approval_conflict'
  | 'onboarding_changed'
  | 'contracts_disabled'
  | 'timeout'
  | 'generic';

export interface ParsedOnboardingActionError {
  kind: OnboardingActionErrorKind;
  message: string;
  conflictData?: AssessorReviewResult;
}

function extractValidationReasonError(errData: ApiErrorResponse | undefined): string | null {
  if (!errData?.errors || typeof errData.errors !== 'object') return null;
  for (const [key, messages] of Object.entries(errData.errors)) {
    if (key.toLowerCase() === 'reason' && Array.isArray(messages) && messages.length > 0) {
      return messages[0];
    }
  }
  const allErrors = Object.values(errData.errors).flat();
  return allErrors.length > 0 ? allErrors[0] : null;
}

export function parseOnboardingActionError(
  err: unknown,
  fallbackMessage = 'Không thể xử lý hồ sơ onboarding. Vui lòng thử lại.'
): ParsedOnboardingActionError {
  if (err instanceof ApprovalConflictError) {
    return {
      kind: 'approval_conflict',
      message: 'Email đã được đăng ký. Hồ sơ chưa được phê duyệt.',
      conflictData: err.conflictData,
    };
  }

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const rawData = err.response?.data as (ApiErrorResponse & Partial<AssessorReviewResult>) | string | undefined;
    const data = rawData && typeof rawData === 'object' ? rawData : undefined;
    const code = data?.code || '';

    if (err.code === 'ECONNABORTED' || err.message.toLowerCase().includes('timeout')) {
      return {
        kind: 'timeout',
        message: 'Yêu cầu hết thời gian chờ (Timeout). Đang đọc lại trạng thái hồ sơ mới nhất trước khi thử lại.',
      };
    }

    if (status === 400) {
      const validationMsg = extractValidationReasonError(data);
      return {
        kind: 'invalid_reason',
        message:
          validationMsg ||
          (code === 'INVALID_REASON' ? data?.message : undefined) ||
          data?.message ||
          data?.title ||
          'Lý do từ chối không hợp lệ (cần từ 1 đến 2.000 ký tự).',
      };
    }

    if (status === 401) {
      return {
        kind: 'unauthorized',
        message: data?.message || 'Phiên làm việc không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
      };
    }

    if (status === 403 || code === 'FORBIDDEN') {
      return {
        kind: 'forbidden',
        message: data?.message || 'Bạn không có quyền thực hiện thao tác này hoặc tài khoản Admin không còn hoạt động.',
      };
    }

    if (status === 404 || code === 'ONBOARDING_NOT_FOUND') {
      return {
        kind: 'not_found',
        message: data?.message || 'Hồ sơ onboarding không còn khả dụng.',
      };
    }

    if (status === 409) {
      if (
        data?.status === 'ApprovalConflict' ||
        data?.reviewReason === 'EMAIL_ALREADY_REGISTERED'
      ) {
        return {
          kind: 'approval_conflict',
          message: 'Email đã được đăng ký. Hồ sơ chưa được phê duyệt.',
          conflictData: data as AssessorReviewResult,
        };
      }
      return {
        kind: 'onboarding_changed',
        message:
          data?.message ||
          'Hồ sơ vừa thay đổi trạng thái hoặc không ở trạng thái hợp lệ để thực hiện thao tác này.',
      };
    }

    if (status === 503 || code === 'CONTRACTS_DISABLED') {
      return {
        kind: 'contracts_disabled',
        message:
          data?.message ||
          'Tính năng onboarding thẩm định viên chưa được cấu hình trên môi trường đang gọi.',
      };
    }
  }

  return {
    kind: 'generic',
    message: getApiErrorMessage(err, fallbackMessage),
  };
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
        `/admin/assessor-onboardings/${id}/approve`
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
