import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  User,
  UserRole,
  AuthContextType,
  LoginRequest,
  LoginResult,
  LoginResponse,
} from '../types/auth';
import { mockAccounts } from '../data/mockAccount';
import { authService } from '../services/auth.service';
import { getApiErrorMessage } from '../services/api';
import { SESSION_EXPIRED_EVENT, SESSION_GENERATION_KEY, SESSION_REFRESHED_EVENT } from '../services/dashboard-session';

const AUTH_STORAGE_KEY = 'uninet_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục phiên làm việc từ localStorage khi F5 hoặc mở tab mới
  useEffect(() => {
    try {
      const user = authService.getStoredUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (e) {
      console.error('Lỗi khi đọc phiên đăng nhập:', e);
      authService.clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const expired = () => { setCurrentUser(null); navigate('/login', { replace: true, state: {} }); };
    const refreshed = (event: Event) => {
      const response = (event as CustomEvent<LoginResponse>).detail;
      try {
        const user = authService.transformLoginResponseToUser(response);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        setCurrentUser(user);
      } catch { authService.clearAuthData(); expired(); }
    };
    const changed = (event: StorageEvent) => {
      if (event.key === SESSION_GENERATION_KEY || event.key === AUTH_STORAGE_KEY || event.key === null) {
        const user = authService.getStoredUser();
        if (!authService.getAccessToken()) expired(); else setCurrentUser(user);
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expired);
    window.addEventListener(SESSION_REFRESHED_EVENT, refreshed);
    window.addEventListener('storage', changed);
    return () => { window.removeEventListener(SESSION_EXPIRED_EVENT, expired); window.removeEventListener(SESSION_REFRESHED_EVENT, refreshed); window.removeEventListener('storage', changed); };
  }, [navigate]);

  /**
   * Đăng nhập thông qua API thực tế: POST /auth/login
   */
  const login = async (
    emailOrParams: string | LoginRequest,
    passwordArg?: string,
    rememberMeArg?: boolean
  ): Promise<LoginResult> => {
    const params: LoginRequest =
      typeof emailOrParams === 'string'
        ? {
            email: emailOrParams.trim(),
            password: passwordArg || '',
            rememberMe: rememberMeArg ?? true,
          }
        : emailOrParams;

    try {
      // 1. Gọi backend API đăng nhập
      const response = await authService.login(params);

      // 2. Chuẩn hóa dữ liệu trả về theo chuẩn User dashboard
      const user = authService.transformLoginResponseToUser(response);

      // 3. Lưu trữ accessToken, refreshToken và thông tin user
      authService.saveAuthData(response, user);
      setCurrentUser(user);

      return {
        success: true,
        user,
        data: response,
      };
    } catch (error) {
      const errorMsg = getApiErrorMessage(
        error,
        'Email hoặc mật khẩu không chính xác! Vui lòng kiểm tra lại.'
      );
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  /**
   * Đăng nhập thử nghiệm bằng mock data (được giữ lại phục vụ dev/test)
   */
  const loginWithMock = async (
    email: string,
    password: string
  ): Promise<LoginResult> => {
    const trimmedEmail = email.trim().toLowerCase();
    const matched = mockAccounts.find(
      (acc) => acc.email.toLowerCase() === trimmedEmail && acc.password === password
    );

    if (matched) {
      const user: User = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        roleName: matched.roleName,
        description: matched.description,
        avatar: matched.avatar,
      };

      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return { success: true, user };
    }

    return {
      success: false,
      error: 'Email hoặc mật khẩu không chính xác trong mock data!',
    };
  };

  /**
   * Đăng xuất: xóa token và phiên làm việc, chuyển hướng sạch về /login
   */
  const logout = () => {
    authService.clearAuthData();
    setCurrentUser(null);
    navigate('/login', { replace: true, state: {} });
  };

  /**
   * Hỗ trợ chuyển đổi nhanh vai trò khi kiểm thử giao diện
   */
  const switchRoleForDev = (targetRole: UserRole) => {
    const sample = mockAccounts.find((acc) => acc.role === targetRole);
    if (sample) {
      const user: User = {
        id: sample.id,
        name: sample.name,
        email: sample.email,
        role: sample.role,
        roleName: sample.roleName,
        description: sample.description,
        avatar: sample.avatar,
      };
      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        switchRoleForDev,
        loginWithMock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

