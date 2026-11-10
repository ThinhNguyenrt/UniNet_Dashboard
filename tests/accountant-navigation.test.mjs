import test from 'node:test';
import assert from 'node:assert/strict';
import { roleNavigationConfig, roleDefaultRoutes, isPathAllowedForRole } from '../src/data/navigation.ts';
import { safeNotificationTarget } from '../src/utils/notification-targets.ts';
import { moneyText, refundableVnd } from '../src/utils/finance-money.ts';

test('accountant sidebar has exactly 4 items across 2 sections in order', () => {
  const accountantNav = roleNavigationConfig.accountant;
  assert.equal(accountantNav.length, 4, 'Accountant navigation must have exactly 4 items');

  const [statistics, withdrawals, settings, activityLogs] = accountantNav;

  // Section: TÀI CHÍNH KẾ TOÁN
  assert.equal(statistics.label, 'Thống kê');
  assert.equal(statistics.path, '/accountant/statistics');
  assert.equal(statistics.section, 'TÀI CHÍNH KẾ TOÁN');

  assert.equal(withdrawals.label, 'Yêu cầu rút tiền');
  assert.equal(withdrawals.path, '/accountant/withdrawals');
  assert.equal(withdrawals.section, 'TÀI CHÍNH KẾ TOÁN');

  assert.equal(settings.label, 'Cài đặt tài chính');
  assert.equal(settings.path, '/accountant/financial-settings');
  assert.equal(settings.section, 'TÀI CHÍNH KẾ TOÁN');

  // Section: HỆ THỐNG
  assert.equal(activityLogs.label, 'Nhật ký hoạt động');
  assert.equal(activityLogs.path, '/accountant/activity-logs');
  assert.equal(activityLogs.section, 'HỆ THỐNG');

  // No separate 1st-level item for Giao dịch, Hoàn tiền, or Đối soát
  const labels = accountantNav.map(item => item.label.toLowerCase());
  assert.ok(!labels.includes('giao dịch'));
  assert.ok(!labels.includes('hoàn tiền'));
  assert.ok(!labels.includes('đối soát'));
});

test('admin sidebar has exactly the 17 items across 4 sections matching reference design in order', () => {
  const adminNav = roleNavigationConfig.admin;
  assert.equal(adminNav.length, 17, 'Admin navigation must have exactly 17 items');

  const [
    users, staff, students, partners,
    projectVerifications, projectMod, communityPosts, complaints,
    statistics, withdrawals, finSettings,
    ads, notifications, activityLogs, skills, specializations, serviceConfig
  ] = adminNav;

  // Section 1: QUẢN LÝ & XÁC MINH

  // Section 1: QUẢN LÝ & XÁC MINH
  assert.equal(users.label, 'Người dùng');
  assert.equal(users.path, '/admin/users');
  assert.equal(users.section, 'QUẢN LÝ & XÁC MINH');

  assert.equal(staff.label, 'Nhân viên');
  assert.equal(staff.path, '/admin/staff');
  assert.equal(staff.section, 'QUẢN LÝ & XÁC MINH');

  assert.equal(students.label, 'Xác minh sinh viên');
  assert.equal(students.path, '/admin/student-verifications');
  assert.equal(students.section, 'QUẢN LÝ & XÁC MINH');

  assert.equal(partners.label, 'Xác minh đối tác');
  assert.equal(partners.path, '/admin/partner-verifications');
  assert.equal(partners.section, 'QUẢN LÝ & XÁC MINH');

  assert.equal(projectVerifications.label, 'Thẩm định dự án');
  assert.equal(projectVerifications.path, '/admin/project-verifications');
  assert.equal(projectVerifications.section, 'QUẢN LÝ & XÁC MINH');

  // Section 2: KIỂM DUYỆT

  assert.equal(projectMod.label, 'Kiểm duyệt dự án');
  assert.equal(projectMod.path, '/admin/project-moderation');
  assert.equal(projectMod.section, 'KIỂM DUYỆT');

  assert.equal(communityPosts.label, 'Kiểm duyệt cộng đồng');
  assert.equal(communityPosts.path, '/admin/community-posts');
  assert.equal(communityPosts.section, 'KIỂM DUYỆT');

  assert.equal(complaints.label, 'Xử lý khiếu nại');
  assert.equal(complaints.path, '/admin/complaints');
  assert.equal(complaints.section, 'KIỂM DUYỆT');

  // Section 3: TÀI CHÍNH & KẾ TOÁN
  assert.equal(statistics.label, 'Thống kê');
  assert.equal(statistics.path, '/admin/statistics');
  assert.equal(statistics.section, 'TÀI CHÍNH & KẾ TOÁN');

  assert.equal(withdrawals.label, 'Yêu cầu rút tiền');
  assert.equal(withdrawals.path, '/admin/withdrawals');
  assert.equal(withdrawals.section, 'TÀI CHÍNH & KẾ TOÁN');

  assert.equal(finSettings.label, 'Cài đặt tài chính');
  assert.equal(finSettings.path, '/admin/financial-settings');
  assert.equal(finSettings.section, 'TÀI CHÍNH & KẾ TOÁN');

  // Section 4: HỆ THỐNG
  assert.equal(ads.label, 'Quảng cáo');
  assert.equal(ads.path, '/admin/advertisements');
  assert.equal(ads.section, 'HỆ THỐNG');

  // "Thông báo" trong admin sidebar là trang tạo/phát thông báo (/admin/notification-broadcasts)
  assert.equal(notifications.label, 'Thông báo hệ thống');
  assert.equal(notifications.path, '/admin/notification-broadcasts');
  assert.equal(notifications.section, 'HỆ THỐNG');

  assert.equal(activityLogs.label, 'Nhật ký hoạt động');
  assert.equal(activityLogs.path, '/admin/activity-logs');
  assert.equal(activityLogs.section, 'HỆ THỐNG');

  assert.equal(skills.label, 'Kỹ năng');
  assert.equal(skills.path, '/admin/skills');
  assert.equal(skills.section, 'HỆ THỐNG');

  assert.equal(specializations.label, 'Danh mục ngành nghề');
  assert.equal(specializations.path, '/admin/specializations');
  assert.equal(specializations.section, 'HỆ THỐNG');

  assert.equal(serviceConfig.label, 'Cấu hình dịch vụ');
  assert.equal(serviceConfig.path, '/admin/service-packages');
  assert.equal(serviceConfig.section, 'HỆ THỐNG');
});

test('moderator sidebar has exactly 4 items across 2 sections in order', () => {
  const modNav = roleNavigationConfig.moderator;
  assert.equal(modNav.length, 4, 'Moderator navigation must have exactly 4 items');

  const [projects, communityPosts, complaints, activityLogs] = modNav;

  // Section: KIỂM DUYỆT
  assert.equal(projects.label, 'Kiểm duyệt dự án');
  assert.equal(projects.path, '/moderator/projects');
  assert.equal(projects.section, 'KIỂM DUYỆT');

  assert.equal(communityPosts.label, 'Kiểm duyệt cộng đồng');
  assert.equal(communityPosts.path, '/moderator/community-posts');
  assert.equal(communityPosts.section, 'KIỂM DUYỆT');

  assert.equal(complaints.label, 'Xử lý khiếu nại');
  assert.equal(complaints.path, '/moderator/complaints');
  assert.equal(complaints.section, 'KIỂM DUYỆT');

  // Section: HỆ THỐNG
  assert.equal(activityLogs.label, 'Nhật ký hoạt động');
  assert.equal(activityLogs.path, '/moderator/activity-logs');
  assert.equal(activityLogs.section, 'HỆ THỐNG');
});

test('verifier sidebar has exactly 3 items across 2 sections in order', () => {
  const verifierNav = roleNavigationConfig.verifier;
  assert.equal(verifierNav.length, 3, 'Verifier navigation must have exactly 3 items');

  const [students, partners, activityLogs] = verifierNav;

  // Section: QUẢN LÝ & XÁC MINH
  assert.equal(students.label, 'Xác minh sinh viên');
  assert.equal(students.path, '/verifier/student-verifications');
  assert.equal(students.section, 'QUẢN LÝ & XÁC MINH');

  assert.equal(partners.label, 'Xác minh đối tác');
  assert.equal(partners.path, '/verifier/partner-verifications');
  assert.equal(partners.section, 'QUẢN LÝ & XÁC MINH');

  // Section: HỆ THỐNG
  assert.equal(activityLogs.label, 'Nhật ký hoạt động');
  assert.equal(activityLogs.path, '/verifier/activity-logs');
  assert.equal(activityLogs.section, 'HỆ THỐNG');
});

test('role default landing routes are accurately configured', () => {
  assert.equal(roleDefaultRoutes.admin, '/admin/users');
  assert.equal(roleDefaultRoutes.moderator, '/moderator/projects');
  assert.equal(roleDefaultRoutes.verifier, '/verifier/student-verifications');
  assert.equal(roleDefaultRoutes.accountant, '/accountant/statistics');
});

test('role paths are correctly recognized and allowed', () => {
  assert.equal(isPathAllowedForRole('/accountant/statistics', 'accountant'), true);
  assert.equal(isPathAllowedForRole('/accountant/withdrawals', 'accountant'), true);
  assert.equal(isPathAllowedForRole('/accountant/financial-settings', 'accountant'), true);
  assert.equal(isPathAllowedForRole('/accountant/activity-logs', 'accountant'), true);
  assert.equal(isPathAllowedForRole('/accountant/finance', 'accountant'), true);
  assert.equal(isPathAllowedForRole('/admin/users', 'admin'), true);
  assert.equal(isPathAllowedForRole('/admin/statistics', 'admin'), true);
  assert.equal(isPathAllowedForRole('/admin/withdrawals', 'admin'), true);
  assert.equal(isPathAllowedForRole('/admin/financial-settings', 'admin'), true);
  assert.equal(isPathAllowedForRole('/admin/complaints', 'admin'), true);
  assert.equal(isPathAllowedForRole('/admin/notification-broadcasts', 'admin'), true);
  assert.equal(isPathAllowedForRole('/admin/staff', 'accountant'), false);
  assert.equal(isPathAllowedForRole('/moderator/projects', 'accountant'), false);
  assert.equal(isPathAllowedForRole('/moderator/complaints', 'moderator'), true);
  assert.equal(isPathAllowedForRole('/verifier/student-verifications', 'verifier'), true);
});

test('safeNotificationTarget allows valid routes for each role and disallows unauthorized routes', () => {
  assert.equal(safeNotificationTarget('/accountant/statistics', 'accountant'), '/accountant/statistics');
  assert.equal(safeNotificationTarget('/accountant/withdrawals', 'accountant'), '/accountant/withdrawals');
  assert.equal(safeNotificationTarget('/accountant/financial-settings', 'accountant'), '/accountant/financial-settings');
  assert.equal(safeNotificationTarget('/accountant/activity-logs', 'accountant'), '/accountant/activity-logs');
  assert.equal(safeNotificationTarget('/moderator/complaints', 'moderator'), '/moderator/complaints');
  assert.equal(safeNotificationTarget('/moderator/activity-logs', 'moderator'), '/moderator/activity-logs');
  assert.equal(safeNotificationTarget('/verifier/activity-logs', 'verifier'), '/verifier/activity-logs');
  assert.equal(safeNotificationTarget('/admin/activity-logs', 'admin'), '/admin/activity-logs');
  assert.equal(safeNotificationTarget('/admin/complaints', 'admin'), '/admin/complaints');
  assert.equal(safeNotificationTarget('/admin/statistics', 'admin'), '/admin/statistics');
  assert.equal(safeNotificationTarget('/admin/withdrawals', 'admin'), '/admin/withdrawals');
  assert.equal(safeNotificationTarget('/admin/notification-broadcasts', 'admin'), '/admin/notification-broadcasts');
  assert.equal(safeNotificationTarget('/admin/staff', 'accountant'), null);
});

test('financial monetary precision operates accurately beyond standard JS integer limit', () => {
  const hugeAmount = '9007199254740993';
  const text = moneyText(hugeAmount);
  assert.ok(text.includes('9.007.199.254.740.993') || text.includes('9007199254740993') || text.includes('9,007,199,254,740,993'));

  const reserved = '100000';
  const refundMax = refundableVnd('500000', reserved);
  assert.equal(refundMax, '400000');
});
