import {
  TrendingUp,
  Users,
  Package,
  Award,
  FolderKanban,
  Briefcase,
  FileText,
  MessageSquare,
  Megaphone,
} from 'lucide-react';
import type { NavigationItem } from '../types/navigation';
import type { UserRole } from '../types/auth';

export const roleNavigationConfig: Record<UserRole, NavigationItem[]> = {
  admin: [
    {
      id: 'admin-revenue',
      label: 'T\u00e0i ch\u00ednh',
      path: '/admin/revenue',
      icon: TrendingUp,
    },
    { id: 'admin-project-moderation', label: 'Ki\u1ec3m duy\u1ec7t d\u1ef1 \u00e1n', path: '/admin/project-moderation', icon: FolderKanban },
    { id: 'admin-job-postings', label: 'Ki\u1ec3m duy\u1ec7t tuy\u1ec3n d\u1ee5ng', path: '/admin/job-postings', icon: Briefcase },
    { id: 'admin-community-posts', label: 'Ki\u1ec3m duy\u1ec7t c\u1ed9ng \u0111\u1ed3ng', path: '/admin/community-posts', icon: MessageSquare },
    { id: 'admin-advertisements', label: 'Qu\u1ea3ng c\u00e1o', path: '/admin/advertisements', icon: Megaphone },
    { id: 'admin-career-profiles', label: 'H\u1ed3 s\u01a1 ngh\u1ec1 nghi\u1ec7p', path: '/admin/career-profiles', icon: FileText },


    {
      id: 'admin-staff',
      label: 'Nhân viên',
      path: '/admin/staff',
      icon: Users,
    },
    {
      id: 'admin-service-packages',
      label: 'Gói dịch vụ',
      path: '/admin/service-packages',
      icon: Package,
    },
    {
      id: 'admin-skills',
      label: 'Kỹ năng',
      path: '/admin/skills',
      icon: Award,
    },
    {
      id: 'admin-projects',
      label: 'Dự án',
      path: '/admin/projects',
      icon: FolderKanban,
    },
  ],

  verifier: [],
  accountant: [],
  moderator: [
    {
      id: 'moderator-projects',
      label: 'Dự án',
      path: '/moderator/projects',
      icon: FolderKanban,
    },
    {
      id: 'moderator-job-postings',
      label: 'Bài đăng tuyển dụng',
      path: '/moderator/job-postings',
      icon: Briefcase,
    },
    {
      id: 'moderator-career-profiles',
      label: 'Hồ sơ nghề nghiệp',
      path: '/moderator/career-profiles',
      icon: FileText,
    },
    {
      id: 'moderator-community-posts',
      label: 'Bài đăng cộng đồng',
      path: '/moderator/community-posts',
      icon: MessageSquare,
    },
    {
      id: 'moderator-advertisements',
      label: 'Quảng cáo',
      path: '/moderator/advertisements',
      icon: Megaphone,
    },
  ],
};

// Route mặc định khi đăng nhập theo vai trò
export const roleDefaultRoutes: Record<UserRole, string> = {
  admin: '/admin/revenue',
  moderator: '/moderator/projects',
  verifier: '/verifier/student-verifications',
  accountant: '/accountant/finance',
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
