import axios from 'axios';
import { apiClient, getApiErrorMessage } from './api';
import type {
  AssignmentsResponse,
  AssignmentDetailResponse,
  MeetingResponse,
  MeetingJoinResponse,
  SubmitReportRequest,
  ReportResponse,
  AssignmentQuery,
} from '../types/verificator-assignments';

export const ASSIGNMENT_ERROR_MESSAGES: Record<string, string> = {
  FORBIDDEN: 'Bạn không có quyền truy cập hoặc thực hiện thao tác trên phân công này.',
  ASSIGNMENT_NOT_FOUND: 'Không tìm thấy phân công yêu cầu.',
  BOOKING_NOT_CONFIRMED: 'Hồ sơ chưa có lịch hẹn thẩm định được xác nhận đặt chỗ.',
  MEETING_ROOM_REQUIRED: 'Cần khởi tạo phòng họp trước khi có thể tham gia hoặc bắt đầu.',
  INVALID_MEETING_STATE: 'Trạng thái buổi họp hiện tại không phù hợp với thao tác yêu cầu.',
  JITSI_NOT_CONFIGURED: 'Hệ thống phòng họp trực tuyến (Jitsi) chưa được cấu hình trên máy chủ.',
  MEETING_CONFLICT: 'Xung đột trạng thái buổi họp với thao tác khác. Vui lòng tải lại và thử lại.',
  REPORT_EXISTS: 'Báo cáo thẩm định cho phân công này đã được nộp trước đó. Không thể gửi lại.',
  ASSIGNMENT_LOCKED: 'Phân công này đã bị khóa hoặc đã được chuyển giao cho nhân sự khác.',
  VERIFICATION_LOCKED: 'Hồ sơ xác minh dự án đã được chốt kết quả thẩm định hoặc đã hủy.',
  MEETING_NOT_COMPLETED: 'Buổi họp thẩm định trực tuyến cần phải bắt đầu và kết thúc trước khi bạn có thể nộp báo cáo.',
  REPORT_CONFLICT: 'Xung đột khi ghi nhận báo cáo. Vui lòng làm mới dữ liệu và thử lại.',
};

/**
 * Trích xuất mã lỗi nghiệp vụ chi tiết từ backend nếu có
 */
export const parseAssignmentErrorMessage = (
  error: unknown,
  fallback = 'Đã có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.'
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const code = (data as { code?: string; error?: string }).code || (data as { error?: string }).error;
      if (code && typeof code === 'string' && ASSIGNMENT_ERROR_MESSAGES[code]) {
        return ASSIGNMENT_ERROR_MESSAGES[code];
      }
    }
  }
  return getApiErrorMessage(error, fallback);
};

export const verificatorAssignmentsService = {
  /**
   * Lấy danh sách phân công thẩm định của chính Verificator đang đăng nhập
   * Endpoint: GET /api/assignments/me
   */
  listMyAssignments: async (
    query: AssignmentQuery = {},
    signal?: AbortSignal
  ): Promise<AssignmentsResponse> => {
    const response = await apiClient.get<AssignmentsResponse>('/assignments/me', {
      params: {
        status: query.status !== undefined && query.status !== -1 ? query.status : undefined,
        page: query.page || 1,
        pageSize: query.pageSize || 10,
      },
      signal,
    });
    return response.data;
  },

  /**
   * Xem chi tiết một phân công (kèm thông tin dự án, kết quả kiểm tra bằng chứng, báo cáo nếu có)
   * Endpoint: GET /api/assignments/{id}
   */
  getAssignmentDetail: async (
    id: string,
    signal?: AbortSignal
  ): Promise<AssignmentDetailResponse> => {
    const response = await apiClient.get<AssignmentDetailResponse>(
      `/assignments/${encodeURIComponent(id)}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Đọc thông tin phòng / lịch họp của buổi thẩm định
   * Endpoint: GET /api/assignments/{assignmentId}/meeting
   */
  getMeeting: async (
    assignmentId: string,
    signal?: AbortSignal
  ): Promise<MeetingResponse> => {
    const response = await apiClient.get<MeetingResponse>(
      `/assignments/${encodeURIComponent(assignmentId)}/meeting`,
      { signal }
    );
    return response.data;
  },

  /**
   * Khởi tạo phòng họp nếu chưa có, hoặc lấy thông tin phòng hiện có
   * Endpoint: POST /api/assignments/{assignmentId}/meeting
   */
  createOrGetMeeting: async (assignmentId: string): Promise<MeetingResponse> => {
    const response = await apiClient.post<MeetingResponse>(
      `/assignments/${encodeURIComponent(assignmentId)}/meeting`
    );
    return response.data;
  },

  /**
   * Lấy URL tham gia phòng họp (dành cho Verificator hoặc Leader)
   * Endpoint: POST /api/assignments/{assignmentId}/meeting/join
   */
  joinMeeting: async (assignmentId: string): Promise<MeetingJoinResponse> => {
    const response = await apiClient.post<MeetingJoinResponse>(
      `/assignments/${encodeURIComponent(assignmentId)}/meeting/join`
    );
    return response.data;
  },

  /**
   * Đánh dấu bắt đầu buổi họp thẩm định
   * Endpoint: POST /api/verificator/assignments/{assignmentId}/meeting/start
   */
  startMeeting: async (assignmentId: string): Promise<MeetingResponse> => {
    const response = await apiClient.post<MeetingResponse>(
      `/verificator/assignments/${encodeURIComponent(assignmentId)}/meeting/start`
    );
    return response.data;
  },

  /**
   * Đánh dấu kết thúc buổi họp thẩm định
   * Endpoint: POST /api/verificator/assignments/{assignmentId}/meeting/end
   */
  endMeeting: async (assignmentId: string): Promise<MeetingResponse> => {
    const response = await apiClient.post<MeetingResponse>(
      `/verificator/assignments/${encodeURIComponent(assignmentId)}/meeting/end`
    );
    return response.data;
  },

  /**
   * Nộp báo cáo kết luận thẩm định dự án (Đạt chuẩn outcome = 1 hoặc Không đạt outcome = 2)
   * Lưu ý: Báo cáo sau khi nộp thành công sẽ chốt kết quả và không được chỉnh sửa.
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
   * Lấy báo cáo thẩm định theo ID báo cáo
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

