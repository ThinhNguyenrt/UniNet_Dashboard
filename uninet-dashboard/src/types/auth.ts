export type UserRole = 'admin' | 'verificator' | 'moderator';

// Thông tin hồ sơ người dùng trả về từ API
export interface UserProfile {
  id: string;
  fullName: string | null;
  nickname: string | null;
  organizationName?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  universityName?: string | null;
  major?: string | null;
  studentCode?: string | null;
  partnerType?: string | null;
  industry?: string | null;
  website?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  isVerified?: boolean;
  displayName: string | null;
}

// Thông tin tài khoản trả về từ API
export interface Account {
  id: string;
  email: string;
  role: number | string;
  status: number;
  emailVerified: boolean;
  profile: UserProfile;
  profileComplete: boolean;
}

// Tham số request khi gọi /auth/login (POST)
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceId?: string;
  deviceName?: string;
}

// Cấu trúc response trả về từ /auth/login (POST)
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  account: Account;
  requiresProfileCompletion: boolean;
}

// Thông tin lỗi API (RFC 7807 Problem Details hoặc custom error message)
export interface ApiErrorResponse {
  code?: string;
  message?: string;
  error?: string;
  title?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Đối tượng User được chuẩn hóa để sử dụng xuyên suốt Dashboard
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleName: string;
  avatar?: string;
  description?: string;
  rawRole?: number | string;
  account?: Account;
  profile?: UserProfile;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
  data?: LoginResponse;
}

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    emailOrParams: string | LoginRequest,
    password?: string,
    rememberMe?: boolean
  ) => Promise<LoginResult>;
  logout: () => void;
  switchRoleForDev?: (role: UserRole) => void;
  loginWithMock?: (email: string, password: string) => Promise<LoginResult>;
}

