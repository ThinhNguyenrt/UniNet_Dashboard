import axios from 'axios';
import { apiClient, getApiErrorMessage } from './api';
import type {
  SubmitReportRequest,
  ReportResponse,
} from '../types/verificator-assignments';
import { ProjectVerificationStatus } from '../types/verificator-assignments';

export const REPORT_ERROR_MESSAGES: Record<string, string> = {
  REPORT_EXISTS: 'Báo cáo thẩm định cho phân công này đã được nộp trước đó. Hệ thống không cho phép gửi lại.',
  ASSIGNMENT_LOCKED: 'Phân công thẩm định đã bị khóa hoặc bạn đã được thay thế bởi nhân sự khác.',
  VERIFICATION_LOCKED: 'Hồ sơ xác minh dự án đã được chốt kết quả thẩm định hoặc đã bị hủy.',
  MEETING_NOT_COMPLETED: 'Buổi họp thẩm định trực tuyến cần phải bắt đầu và kết thúc trước khi bạn có thể nộp báo cáo.',
  REPORT_CONFLICT: 'Dữ liệu báo cáo bị xung đột hoặc đã được nộp đồng thời bởi thao tác khác. Vui lòng làm mới dữ liệu.',
  FORBIDDEN: 'Bạn không có quyền nộp hoặc xem báo cáo của phân công này.',
  ASSIGNMENT_NOT_FOUND: 'Không tìm thấy thông tin phân công tương ứng.',
};

/**
 * Trích xuất lỗi chi tiết khi xử lý báo cáo thẩm định
 */
export const parseReportErrorMessage = (
  error: unknown,
  fallback = 'Đã có lỗi xảy ra khi xử lý báo cáo thẩm định. Vui lòng thử lại.'
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const code = (data as { code?: string; error?: string }).code || (data as { error?: string }).error;
      if (code && typeof code === 'string' && REPORT_ERROR_MESSAGES[code]) {
        return REPORT_ERROR_MESSAGES[code];
      }

      // Xử lý lỗi validation từ ASP.NET ProblemDetails
      const errors = (data as { errors?: Record<string, string[]> }).errors;
      if (errors && typeof errors === 'object') {
        const errorList = Object.values(errors).flat();
        if (errorList.length > 0) {
          return errorList[0];
        }
      }
    }
  }
  return getApiErrorMessage(error, fallback);
};

export interface ReportValidationResult {
  isValid: boolean;
  errors: {
    summary?: string;
    findings?: string;
    recommendations?: string;
    outcome?: string;
  };
}

/**
 * Kiểm tra hợp lệ dữ liệu báo cáo trước khi gửi
 */
export const validateReportInput = (request: Partial<SubmitReportRequest>): ReportValidationResult => {
  const errors: ReportValidationResult['errors'] = {};

  if (!request.summary || !request.summary.trim()) {
    errors.summary = 'Tóm tắt buổi xác minh không được để trống hoặc chỉ chứa khoảng trắng.';
  } else if (request.summary.length > 10000) {
    errors.summary = 'Tóm tắt buổi xác minh vượt quá độ dài tối đa (10.000 ký tự).';
  }

  if (!request.findings || !request.findings.trim()) {
    errors.findings = 'Bằng chứng và kết quả đối chiếu không được để trống hoặc chỉ chứa khoảng trắng.';
  } else if (request.findings.length > 30000) {
    errors.findings = 'Bằng chứng và kết quả đối chiếu vượt quá độ dài tối đa (30.000 ký tự).';
  }

  if (!request.recommendations || !request.recommendations.trim()) {
    errors.recommendations = 'Khuyến nghị cho dự án không được để trống hoặc chỉ chứa khoảng trắng.';
  } else if (request.recommendations.length > 10000) {
    errors.recommendations = 'Khuyến nghị cho dự án vượt quá độ dài tối đa (10.000 ký tự).';
  }

  if (
    request.outcome !== ProjectVerificationStatus.Verified &&
    request.outcome !== ProjectVerificationStatus.Failed
  ) {
    errors.outcome = 'Kết luận thẩm định chỉ được chọn Đạt chuẩn (Verified) hoặc Không đạt (Failed).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const verificatorReportService = {
  /**
   * Nộp báo cáo kết luận thẩm định dự án
   * Lưu ý: Nộp thành công sẽ chuyển phân công sang Completed và chốt kết quả hồ sơ.
   * Endpoint: POST /api/reports
   */
  submitReport: async (request: SubmitReportRequest): Promise<ReportResponse> => {
    const response = await apiClient.post<ReportResponse>('/reports', request);
    return response.data;
  },

  /**
   * Lấy báo cáo thẩm định theo ID phân công (lưu ý: endpoint dùng 'report' số ít)
   * Endpoint: GET /api/report/{assignmentId}
   */
  getReportByAssignment: async (
    assignmentId: string,
    signal?: AbortSignal
  ): Promise<ReportResponse> => {
    const response = await apiClient.get<ReportResponse>(
      `/report/${encodeURIComponent(assignmentId)}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Lấy báo cáo thẩm định theo ID báo cáo (lưu ý: endpoint dùng 'reports' số nhiều)
   * Endpoint: GET /api/reports/{reportId}
   */
  getReportById: async (
    reportId: string,
    signal?: AbortSignal
  ): Promise<ReportResponse> => {
    const response = await apiClient.get<ReportResponse>(
      `/reports/${encodeURIComponent(reportId)}`,
      { signal }
    );
    return response.data;
  },
};

