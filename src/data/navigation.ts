import {
  BarChart3,
  Wallet,
  Settings,
  Bell,
  History,
  Users,
  UserCheck,
  Megaphone,
  Award,
  FolderKanban,
  MessageSquare,
  AlertTriangle,
  GraduationCap,
  Building2,
  CircleDollarSign,
  ShieldCheck,
  CheckSquare,
  Sliders,
} from 'lucide-react';
import type { NavigationItem } from '../types/navigation';
import type { UserRole } from '../types/auth';

export const roleNavigationConfig: Record<UserRole, NavigationItem[]> = {
  // 1. Kế toán (Accountant)
  accountant: [
    {
      id: 'accountant-statistics',
      label: 'Thống kê',
      path: '/accountant/statistics',
      icon: BarChart3,
      section: 'TÀI CHÍNH KẾ TOÁN',
      sectionIcon: CircleDollarSign,
    },
    {
      id: 'accountant-withdrawals',
      label: 'Yêu cầu rút tiền',
      path: '/accountant/withdrawals',
      icon: Wallet,
      section: 'TÀI CHÍNH KẾ TOÁN',
      sectionIcon: CircleDollarSign,
    },
    {
      id: 'accountant-financial-settings',
      label: 'Cài đặt tài chính',
      path: '/accountant/financial-settings',
      icon: Settings,
      section: 'TÀI CHÍNH KẾ TOÁN',
      sectionIcon: CircleDollarSign,
    },
    {
      id: 'accountant-notifications',
      label: 'Thông báo',
      path: '/accountant/notifications',
      icon: Bell,
      section: 'HỆ THỐNG',
      sectionIcon: Sliders,
    },
    {
      id: 'accountant-activity-logs',
      label: 'Nhật kí hoạt động',
      path: '/accountant/activity-logs',
      icon: History,
      section: 'HỆ THỐNG',
      sectionIcon: Sliders,
    },
  ],

  // 2. Quản trị viên (Admin)
  admin: [
    {
      id: 'admin-users',
      label: 'Người dùng',
      path: '/admin/users',
      icon: Users,
      section: 'QUẢN LÝ VÀ XÁC MINH',
      sectionIcon: ShieldCheck,
    },
    {
      id: 'admin-staff',
      label: 'Nhân viên',
      path: '/admin/staff',
      icon: UserCheck,
      section: 'QUẢN LÝ VÀ XÁC MINH',
      sectionIcon: ShieldCheck,
    },
    {
      id: 'admin-advertisements',
      label: 'Quảng cáo',
      path: '/admin/advertisements',
      icon: Megaphone,
      section: 'HỆ THỐNG',
      sectionIcon: Sliders,
    },
    {
      id: 'admin-notifications',
      label: 'Thông báo',
      path: '/admin/notifications',
      icon: Bell,
      section: 'HỆ THỐNG',
      sectionIcon: Sliders,
    },
    {
      id: 'admin-activity-logs',
      label: 'Nhật kí hoạt động',
      path: '/admin/activity-logs',
      icon: History,
      section: 'HỆ THỐNG',
      sectionIcon: Sliders,
    },
    {
      id: 'admin-skills',
      label: 'Kĩ năng',
      path: '/admin/skills',
      icon: Award,
      section: 'HỆ THỐNG',
      sectionIcon: Sliders,
    },
  ],

  // 3. Kiểm duyệt viên (Moderator)
  moderator: [
    {
      id: 'moderator-projects',
      label: 'Kiểm duyệt dự án',
      path: '/moderator/projects',
      icon: FolderKanban,
      section: 'KIỂM DUYỆT',
      sectionIcon: CheckSquare,
    },
    {
      id: 'moderator-community-posts',
      label: 'Kiểm duyệt cộng đồng',
      path: '/moderator/community-posts',
      icon: MessageSquare,
      section: 'KIỂM DUYỆT',
      sectionIcon: CheckSquare,
    },
    {
      id: 'moderator-complaints',
      label: 'Xử lý khiếu nại',
      path: '/moderator/complaints',
      icon: AlertTriangle,
      section: 'KIỂM DUYỆT',
      sectionIcon: CheckSquare,
    },
    {
      id: 'moderator-notifications',
      label: 'Thông báo',
      path: '/moderator/notifications',
      icon: Bell,
      section: 'HỆ THỐNG',
      sectionIcon: Sliders,
    },
    {
      id: 'moderator-activity-logs',
      label: 'Nhật kí hoạt động',
      path: '/moderator/activity-logs',
      icon: History,
      section: 'HỆ THỐNG',
      sectionIcon: Sliders,
    },
  ],

  // 4. Xác minh viên (Verifier)
  verifier: [
    {
      id: 'verifier-student-verifications',
      label: 'Xác minh sinh viên',
      path: '/verifier/student-verifications',
      icon: GraduationCap,
      section: 'QUẢN LÝ & XÁC MINH',
      sectionIcon: ShieldCheck,
    },
    {
      id: 'verifier-partner-verifications',
      label: 'Xác minh đối tác',
      path: '/verifier/partner-verifications',
      icon: Building2,
      section: 'QUẢN LÝ & XÁC MINH',
      sectionIcon: ShieldCheck,
    },
    {
      id: 'verifier-notifications',
      label: 'Thông báo',
      path: '/verifier/notifications',
      icon: Bell,
      section: 'HỆ THỐNG',
      sectionIcon: Sliders,
    },
    {
      id: 'verifier-activity-logs',
      label: 'Nhật kí hoạt động',
      path: '/verifier/activity-logs',
      icon: History,
      section: 'HỆ THỐNG',
      sectionIcon: Sliders,
    },
  ],
};

// Route mặc định khi đăng nhập theo vai trò
export const roleDefaultRoutes: Record<UserRole, string> = {
  admin: '/admin/users',
  moderator: '/moderator/projects',
  verifier: '/verifier/student-verifications',
  accountant: '/accountant/statistics',
};

/**
 * Kiểm tra xem một đường dẫn có hợp lệ và người dùng thuộc vai trò này có quyền truy cập không.
 */
export const isPathAllowedForRole = (path: string, role: UserRole): boolean => {
  if (!path || path === '/' || path === '/login' || path === '/unauthorized') {
    return false;
  }
  // Tuyến đường phải bắt đầu bằng phân vùng tương ứng với role (vd: /moderator/...)
  return path === `/${role}` || path.startsWith(`/${role}/`);
};

/**
 * Phân giải đường dẫn điều hướng an toàn theo role:
 * Nếu đường dẫn yêu cầu (requestedPath) hợp lệ cho role đó thì ưu tiên giữ lại,
 * ngược lại luôn chuyển hướng về route mặc định của role đó.
 */
export const getRedirectPathForRole = (
  role: UserRole,
  requestedPath?: string | null
): string => {
  if (requestedPath && isPathAllowedForRole(requestedPath, role)) {
    return requestedPath;
  }
  return roleDefaultRoutes[role] || `/${role}`;
};
