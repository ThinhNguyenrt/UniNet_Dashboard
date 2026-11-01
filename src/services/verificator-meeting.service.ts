import axios from 'axios';
import { apiClient, getApiErrorMessage } from './api';
import type {
  MeetingResponse,
  MeetingJoinResponse,
} from '../types/verificator-assignments';

export const MEETING_ERROR_MESSAGES: Record<string, string> = {
  FORBIDDEN: 'Bạn không có quyền truy cập hoặc điều khiển buổi họp xác minh này.',
  ASSIGNMENT_NOT_FOUND: 'Không tìm thấy thông tin phân công của buổi họp.',
  BOOKING_NOT_CONFIRMED: 'Hồ sơ dự án chưa được xác nhận lịch hẹn thẩm định hợp lệ.',
  MEETING_ROOM_REQUIRED: 'Cần khởi tạo phòng họp trước khi có thể tham gia hoặc bắt đầu.',
  INVALID_MEETING_STATE: 'Trạng thái buổi họp không hợp lệ cho thao tác này (buổi họp có thể đã bắt đầu hoặc đã kết thúc).',
  JITSI_NOT_CONFIGURED: 'Hệ thống phòng họp trực tuyến (Jitsi Meet) chưa được cấu hình trên máy chủ backend.',
  MEETING_CONFLICT: 'Xung đột trạng thái buổi họp. Dữ liệu đã thay đổi, vui lòng tải lại trang.',
};

/**
 * Trích xuất lỗi nghiệp vụ chuyên biệt cho buổi họp xác minh
 */
export const parseMeetingErrorMessage = (
  error: unknown,
  fallback = 'Đã có lỗi xảy ra khi thao tác với buổi họp xác minh. Vui lòng thử lại.'
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const code = (data as { code?: string; error?: string }).code || (data as { error?: string }).error;
      if (code && typeof code === 'string' && MEETING_ERROR_MESSAGES[code]) {
        return MEETING_ERROR_MESSAGES[code];
      }
    }
  }
  return getApiErrorMessage(error, fallback);
};

export type MeetingLifecycleStatus = 'NotCreated' | 'Ready' | 'InProgress' | 'Completed';

/**
 * Xác định trạng thái vòng đời của buổi họp xác minh
 */
export const getMeetingLifecycleStatus = (meeting: MeetingResponse | null): MeetingLifecycleStatus => {
  if (!meeting || (!meeting.roomName && !meeting.joinUrl)) {
    return 'NotCreated';
  }
  if (meeting.meetingEndAt) {
    return 'Completed';
  }
  if (meeting.meetingStartAt) {
    return 'InProgress';
  }
  return 'Ready';
};

/**
 * Tính số giây còn lại cho đến giờ hẹn bắt đầu
 */
export const getRemainingSeconds = (
  scheduledStartAt: string | Date | null | undefined,
  now = Date.now()
): number => {
  if (!scheduledStartAt) return 0;
  const scheduledTime =
    typeof scheduledStartAt === 'string'
      ? new Date(scheduledStartAt).getTime()
      : scheduledStartAt.getTime();
  if (isNaN(scheduledTime)) return 0;
  return Math.max(0, Math.floor((scheduledTime - now) / 1000));
};

/**
 * Định dạng chuỗi đếm ngược thời gian chờ đến giờ họp
 */
export const formatCountdown = (diffSeconds: number): string => {
  if (diffSeconds <= 0) return '00:00';
  const days = Math.floor(diffSeconds / 86400);
  const hours = Math.floor((diffSeconds % 86400) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  if (days > 0) {
    return `${days} ngày ${hours} giờ ${minutes} phút`;
  }
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Định dạng thời lượng giữa 2 mốc thời gian
 */
export const formatMeetingDuration = (
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string => {
  if (!start) return '—';
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = end ? (typeof end === 'string' ? new Date(end) : end) : new Date();

  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs <= 0) return '0 phút';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} giờ ${minutes > 0 ? `${minutes} phút` : ''}`.trim();
  }
  return `${Math.max(1, minutes)} phút`;
};

export const verificatorMeetingService = {
  /**
   * Đọc thông tin phòng / lịch họp xác minh
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
   * Khởi tạo phòng họp nếu chưa có, hoặc trả về phòng hiện có
   * Endpoint: POST /api/assignments/{assignmentId}/meeting
   */
  createOrGetMeeting: async (assignmentId: string): Promise<MeetingResponse> => {
    const response = await apiClient.post<MeetingResponse>(
      `/assignments/${encodeURIComponent(assignmentId)}/meeting`
    );
    return response.data;
  },

  /**
   * Lấy URL tham gia phòng họp (cho Verificator hoặc Leader)
   * Endpoint: POST /api/assignments/{assignmentId}/meeting/join
   */
  joinMeeting: async (assignmentId: string): Promise<MeetingJoinResponse> => {
    const response = await apiClient.post<MeetingJoinResponse>(
      `/assignments/${encodeURIComponent(assignmentId)}/meeting/join`
    );
    return response.data;
  },

  /**
   * Đánh dấu bắt đầu buổi họp (dành cho Verificator)
   * Endpoint: POST /api/verificator/assignments/{assignmentId}/meeting/start
   */
  startMeeting: async (assignmentId: string): Promise<MeetingResponse> => {
    const response = await apiClient.post<MeetingResponse>(
      `/verificator/assignments/${encodeURIComponent(assignmentId)}/meeting/start`
    );
    return response.data;
  },

  /**
   * Đánh dấu kết thúc buổi họp (dành cho Verificator)
   * Endpoint: POST /api/verificator/assignments/{assignmentId}/meeting/end
   */
  endMeeting: async (assignmentId: string): Promise<MeetingResponse> => {
    const response = await apiClient.post<MeetingResponse>(
      `/verificator/assignments/${encodeURIComponent(assignmentId)}/meeting/end`
    );
    return response.data;
  },
};

