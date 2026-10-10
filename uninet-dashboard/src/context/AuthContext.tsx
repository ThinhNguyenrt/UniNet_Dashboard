import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, AuthContextType } from '../types/auth';
import { mockAccounts } from '../data/mockAccount';

const AUTH_STORAGE_KEY = 'uninet_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục phiên làm việc từ localStorage khi F5 hoặc mở tab mới
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setCurrentUser(parsed);
      }
    } catch (e) {
      console.error('Lỗi khi đọc phiên đăng nhập:', e);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
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
      error: 'Email hoặc mật khẩu không chính xác! Vui lòng kiểm tra lại.',
    };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Hỗ trợ chuyển đổi nhanh vai trò khi kiểm thử giao diện
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
