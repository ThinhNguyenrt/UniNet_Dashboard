import type { UserRole } from '../types/auth';

const routes: Record<UserRole, readonly string[]> = {
  admin: ['/admin/projects', '/admin/staff', '/admin/service-packages', '/admin/skills', '/admin/revenue', '/admin/notifications', '/admin/notification-broadcasts', '/admin/student-verifications', '/admin/partner-verifications', '/admin/job-postings', '/admin/community-posts'],
  verificator: ['/verificator/students', '/verificator/companies', '/verificator/projects', '/verificator/notifications'],
  moderator: ['/moderator/projects', '/moderator/job-postings', '/moderator/career-profiles', '/moderator/community-posts', '/moderator/advertisements', '/moderator/notifications'],
};

// Only known dashboard routes returned by the authorized target API may be opened.
export function safeNotificationTarget(target: string | null | undefined, role: UserRole): string | null {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.includes('\\') || [...target].some(char => char.charCodeAt(0) < 32)) return null;
  if (target === '/notifications') return `/${role}/notifications`;
  try {
    const url = new URL(target, 'https://dashboard.invalid');
    const managementDetail = new RegExp('^/' + role + '/(?:users|student-verifications|partner-verifications)/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$').test(url.pathname);
    const managementList = ['users', 'student-verifications', 'partner-verifications'].some(path => url.pathname === '/' + role + '/' + path);
    if (url.origin !== 'https://dashboard.invalid' || !routes[role].includes(url.pathname) && !managementDetail && !managementList) return null;
    return url.pathname + url.search;
  } catch { return null; }
}

export function notificationDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
}
