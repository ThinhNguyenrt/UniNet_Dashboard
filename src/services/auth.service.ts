import apiClient from './api';
import { SESSION_GENERATION_KEY } from './dashboard-session';
import type {
  LoginRequest,
  LoginResponse,
  User,
  UserRole,
} from '../types/auth';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  EXPIRES_AT: 'expiresAt',
  ACCOUNT: 'uninet_account',
  USER: 'uninet_auth_user',
};

/**
 * Giải mã JWT payload an toàn không cần cài thêm thư viện
 */
const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonString = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
};

/**
 * Phân giải vai trò (role) từ token claims hoặc account.role từ API
 */
export const mapRole = (
  backendRole: number | string,
  jwtToken?: string
): { role: UserRole; roleName: string } => {
  let roleStr = '';

  // Ưu tiên đọc claim role từ JWT nếu có
  if (jwtToken) {
    const payload = decodeJwtPayload(jwtToken);
    if (payload) {
      const claimRole =
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        payload['role'] ||
        payload['Role'];
      if (typeof claimRole === 'string') {
        roleStr = claimRole.toLowerCase();
      }
    }
  }

  // Nếu không có trong JWT claim, dựa trên backendRole
  if (!roleStr) {
    roleStr = String(backendRole).toLowerCase();
  }

  // Khớp vai trò phù hợp với phân hệ dashboard
  if (roleStr.includes('admin') || roleStr === '2') {
    return { role: 'admin', roleName: 'Admin (Quản trị viên)' };
  }
  if (roleStr.includes('verif') || roleStr === '4') {
    return { role: 'verificator', roleName: 'Verificator (Xác thực viên)' };
  }
  if (roleStr.includes('mod') || roleStr === '3') {
    return { role: 'moderator', roleName: 'Moderator (Kiểm duyệt viên)' };
  }

  throw new Error('Tài khoản không có quyền truy cập bảng điều khiển quản trị.');
};

export const authService = {
  /**
   * Gọi API POST /auth/login
   */
  login: async (requestData: LoginRequest): Promise<LoginResponse> => {
    const payload: LoginRequest = {
      email: requestData.email.trim(),
      password: requestData.password,
      rememberMe: requestData.rememberMe ?? true,
    };

    if (requestData.deviceId) {
      payload.deviceId = requestData.deviceId;
    }
    if (requestData.deviceName) {
      payload.deviceName = requestData.deviceName;
    }

    const response = await apiClient.post<LoginResponse>('/auth/login', payload);
    return response.data;
  },

  /**
   * Chuyển đổi dữ liệu trả về từ API thành cấu trúc User phục vụ giao diện
   */
  transformLoginResponseToUser: (response: LoginResponse): User => {
    const { account, accessToken } = response;
    const { role, roleName } = mapRole(account.role, accessToken);

    const displayName =
      account.profile?.displayName ||
      account.profile?.fullName ||
      account.profile?.nickname ||
      account.email;

    return {
      id: account.id,
      name: displayName,
      email: account.email,
      role,
      roleName,
      avatar: account.profile?.avatarUrl || undefined,
      description: account.profile?.bio || undefined,
      rawRole: account.role,
      account,
      profile: account.profile,
    };
  },

  /**
   * Lưu thông tin đăng nhập và token vào Storage
   */
  saveAuthData: (data: LoginResponse, user: User): void => {
    localStorage.setItem(SESSION_GENERATION_KEY, crypto.randomUUID());
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, data.expiresAt);
    localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(data.account));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  /**
   * Lấy Access Token đã lưu
   */
  getAccessToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Lấy Refresh Token đã lưu
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Lấy User đã lưu trong localStorage
   */
  getStoredUser: (): User | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  },

  /**
   * Xóa sạch thông tin đăng nhập khi logout
   */
  clearAuthData: (): void => {
    localStorage.removeItem(SESSION_GENERATION_KEY);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.ACCOUNT);
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.clear();
  },
};

export default authService;
