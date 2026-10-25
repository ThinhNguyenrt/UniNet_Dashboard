import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '../types/auth';
import { dashboardSession, refreshDashboardSession } from './dashboard-session';

type SessionRequest = InternalAxiosRequestConfig & { sessionGeneration?: string; sessionAccessToken?: string; retried?: boolean };

// Lấy base URL từ biến môi trường Vite (.env) và chuẩn hóa loại bỏ khoảng trắng / slash thừa
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

// Trong môi trường development (Vite dev server), ưu tiên sử dụng proxy '/api'
// để tránh hoàn toàn lỗi CORS từ trình duyệt. Trong production sẽ dùng URL thực tế từ .env.
export const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (rawBaseUrl || 'https://uninet-be.onrender.com/api').replace(/\/+$/, '');

// Tạo Axios instance dùng chung cho toàn bộ dự án
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout đề phòng backend cold start (Render)
});

// Request Interceptor: Tự động đính kèm accessToken nếu có
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    const session = dashboardSession();
    const request = config as SessionRequest;
    request.sessionGeneration = session?.generation;
    request.sessionAccessToken = token || undefined;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý tập trung response & error
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as SessionRequest | undefined;
    if (error.response?.status !== 401 || !request || request.retried || /\/?auth\//.test(request.url || '')) return Promise.reject(error);
    const session = dashboardSession();
    if (!session || session.generation !== request.sessionGeneration) return Promise.reject(error);
    request.retried = true;
    const token = session.accessToken !== request.sessionAccessToken ? session.accessToken : await refreshDashboardSession(session, API_BASE_URL);
    if (dashboardSession()?.generation !== session.generation) throw new Error('Phiên đăng nhập đã thay đổi.');
    request.headers.Authorization = `Bearer ${token}`;
    return apiClient.request(request);
  }
);

/**
 * Trích xuất thông báo lỗi thân thiện từ API response
 */
export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
): string => {
  if (axios.isAxiosError(error)) {
    const errData = error.response?.data as ApiErrorResponse | string | undefined;

    // Trường hợp backend trả chuỗi text đơn giản
    if (typeof errData === 'string' && errData.trim().length > 0) {
      return errData;
    }

    // Trường hợp backend trả JSON { message, error, title, errors }
    if (errData && typeof errData === 'object') {
      if (errData.message && typeof errData.message === 'string') {
        return errData.message;
      }
      if (errData.error && typeof errData.error === 'string') {
        return errData.error;
      }
      if (errData.errors && typeof errData.errors === 'object') {
        const errorList = Object.values(errData.errors).flat();
        if (errorList.length > 0) {
          return errorList[0];
        }
      }
      if (errData.title && typeof errData.title === 'string') {
        return errData.title;
      }
    }

    // Xử lý theo mã HTTP status code
    if (error.response?.status === 401) {
      return 'Email hoặc mật khẩu không chính xác.';
    }
    if (error.response?.status === 403) {
      return 'Tài khoản không có quyền truy cập vào bảng điều khiển quản trị.';
    }
    if (error.response?.status === 404) {
      return 'Không tìm thấy dữ liệu yêu cầu.';
    }
    if (error.response?.status && error.response.status >= 500) {
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút.';
    }

    // Xử lý Timeout / Lỗi kết nối mạng
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'Kết nối tới máy chủ quá thời gian chờ (Timeout). Vui lòng thử lại.';
    }
    if (error.message === 'Network Error' || !error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};

export default apiClient;
