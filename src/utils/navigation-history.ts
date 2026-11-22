import { isPathAllowedForRole, roleDefaultRoutes } from '../data/navigation.ts';
import type { UserRole } from '../types/auth.ts';

export const LAST_ACTIVE_PATH_KEY = 'uninet_last_active_path';

/**
 * Lấy đường dẫn đã lưu gần nhất cho vai trò người dùng hiện tại.
 * Đảm bảo đường dẫn hợp lệ và được phép truy cập theo vai trò.
 */
export const getLastActivePath = (role: UserRole): string => {
  try {
    const saved =
      sessionStorage.getItem(LAST_ACTIVE_PATH_KEY) ||
      localStorage.getItem(LAST_ACTIVE_PATH_KEY);

    if (saved) {
      // Tách pathname để kiểm tra quyền
      const pathname = saved.split('?')[0].split('#')[0];
      if (isPathAllowedForRole(pathname, role)) {
        return saved;
      }
    }
  } catch {
    // Không thể truy xuất storage
  }

  return roleDefaultRoutes[role] || `/${role}`;
};

/**
 * Lưu đường dẫn đang hoạt động hiện tại vào cả sessionStorage và localStorage
 */
export const setLastActivePath = (fullPath: string): void => {
  try {
    if (
      fullPath &&
      fullPath !== '/' &&
      !fullPath.startsWith('/login') &&
      !fullPath.startsWith('/unauthorized')
    ) {
      sessionStorage.setItem(LAST_ACTIVE_PATH_KEY, fullPath);
      localStorage.setItem(LAST_ACTIVE_PATH_KEY, fullPath);
    }
  } catch {
    // Không thể ghi storage
  }
};

/**
 * Xóa đường dẫn đã lưu khi đăng xuất
 */
export const clearLastActivePath = (): void => {
  try {
    sessionStorage.removeItem(LAST_ACTIVE_PATH_KEY);
    localStorage.removeItem(LAST_ACTIVE_PATH_KEY);
  } catch {
    // Bỏ qua
  }
};
