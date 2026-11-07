import type { UserRole } from '../types/auth';

export function notificationRelativeTime(value: string, now = Date.now()) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return '';
  const minutes = Math.max(0, Math.floor((now - time) / 60000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
  if (minutes < 43200) return `${Math.floor(minutes / 1440)} ngày trước`;
  return new Date(time).toLocaleDateString('vi-VN');
}

export function groupNotifications<T extends { createdAt: string }>(items: T[]) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const groups = ['Hôm nay', 'Trước đó'].map(label => ({ label, items: [] as T[] }));
  for (const item of items) {
    const time = Date.parse(item.createdAt);
    groups[time >= +today ? 0 : 1].items.push(item);
  }
  return groups.filter(group => group.items.length);
}

const routes: Record<UserRole, readonly string[]> = {
  admin: [
    '/admin/users',
    '/admin/staff',
    '/admin/student-verifications',
    '/admin/partner-verifications',
    '/admin/project-moderation',
    '/admin/community-posts',
    '/admin/complaints',
    '/admin/statistics',
    '/admin/withdrawals',
    '/admin/financial-settings',
    '/admin/advertisements',
    '/admin/notifications',
    '/admin/activity-logs',
    '/admin/skills',
    '/admin/projects',
    '/admin/project-verifications',
    '/admin/service-packages',
    '/admin/revenue',
    '/admin/notification-broadcasts',
    '/admin/job-postings',
  ],
  verifier: [
    '/verifier/student-verifications',
    '/verifier/partner-verifications',
    '/verifier/notifications',
    '/verifier/activity-logs',
  ],
  accountant: [
    '/accountant/statistics',
    '/accountant/withdrawals',
    '/accountant/financial-settings',
    '/accountant/notifications',
    '/accountant/activity-logs',
    '/accountant/finance',
  ],
  moderator: [
    '/moderator/projects',
    '/moderator/community-posts',
    '/moderator/complaints',
    '/moderator/notifications',
    '/moderator/activity-logs',
    '/moderator/job-postings',
    '/moderator/career-profiles',
    '/moderator/advertisements',
  ],
};

// Only known dashboard routes returned by the authorized target API may be opened.
export function safeNotificationTarget(target: string | null | undefined, role: UserRole): string | null {
  if (!routes[role]) return null;
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.includes('\\') || [...target].some(char => char.charCodeAt(0) < 32)) return null;
  if (target === '/notifications') return `/${role}/notifications`;
  try {
    const url = new URL(target, 'https://dashboard.invalid');
    const managementKinds = role === 'admin' || role === 'verifier' ? ['users', 'student-verifications', 'partner-verifications', 'project-verifications'] : role === 'moderator' ? ['users'] : [];
    const managementDetail = managementKinds.some(kind => new RegExp('^/' + role + '/' + kind + '/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$').test(url.pathname));
    const managementList = managementKinds.some(path => url.pathname === '/' + role + '/' + path);
    if (url.origin !== 'https://dashboard.invalid' || !routes[role].includes(url.pathname) && !managementDetail && !managementList) return null;
    return url.pathname + url.search;
  } catch { return null; }
}

export function notificationDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
}
