import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ProjectVerificationStatus,
  projectVerificationStatusLabels,
  VerificationAssignmentStatus,
  verificationAssignmentStatusLabels,
  VerificationBookingStatus,
  BackendProjectStatus,
} from '../src/types/admin-project-verifications.ts';
import { roleNavigationConfig, isPathAllowedForRole } from '../src/data/navigation.ts';
import { safeNotificationTarget } from '../src/utils/notification-targets.ts';

test('ProjectVerificationStatus has 5 distinct outcomes matching backend enum', () => {
  assert.equal(ProjectVerificationStatus.Pending, 0);
  assert.equal(ProjectVerificationStatus.Verified, 1);
  assert.equal(ProjectVerificationStatus.Failed, 2);
  assert.equal(ProjectVerificationStatus.Cancelled, 3);
  assert.equal(ProjectVerificationStatus.InsufficientEvidence, 4);

  assert.equal(projectVerificationStatusLabels[ProjectVerificationStatus.Pending], 'Chờ thẩm định');
  assert.equal(projectVerificationStatusLabels[ProjectVerificationStatus.Verified], 'Đạt chuẩn (Verified)');
  assert.equal(projectVerificationStatusLabels[ProjectVerificationStatus.Failed], 'Không đạt (Failed)');
  assert.equal(projectVerificationStatusLabels[ProjectVerificationStatus.Cancelled], 'Đã hủy');
  assert.equal(
    projectVerificationStatusLabels[ProjectVerificationStatus.InsufficientEvidence],
    'Chưa đủ cơ sở đánh giá'
  );
});

test('VerificationAssignmentStatus has 4 states matching backend', () => {
  assert.equal(VerificationAssignmentStatus.Assigned, 0);
  assert.equal(VerificationAssignmentStatus.Completed, 1);
  assert.equal(VerificationAssignmentStatus.Overdue, 2);
  assert.equal(VerificationAssignmentStatus.Cancelled, 3);
});

test('BackendProjectStatus aligns with backend Pending=0, Active=1, Completed=2, Rejected=3', () => {
  assert.equal(BackendProjectStatus.Pending, 0);
  assert.equal(BackendProjectStatus.Active, 1);
  assert.equal(BackendProjectStatus.Completed, 2);
  assert.equal(BackendProjectStatus.Rejected, 3);
});

test('Admin navigation includes Project Verifications menu item in QUẢN LÝ & XÁC MINH', () => {
  const adminNav = roleNavigationConfig.admin;
  const item = adminNav.find((n) => n.id === 'admin-project-verifications');
  assert.ok(item, 'Menu Thẩm định dự án phải tồn tại trong admin nav');
  assert.equal(item.path, '/admin/project-verifications');
  assert.equal(item.label, 'Thẩm định dự án');
  assert.equal(item.section, 'QUẢN LÝ & XÁC MINH');
});

test('Admin role allows /admin/project-verifications and detail paths, disallows other roles', () => {
  assert.ok(isPathAllowedForRole('/admin/project-verifications', 'admin'));
  assert.ok(isPathAllowedForRole('/admin/project-verifications/11111111-1111-1111-1111-111111111111', 'admin'));

  assert.equal(isPathAllowedForRole('/admin/project-verifications', 'moderator'), false);
  assert.equal(isPathAllowedForRole('/admin/project-verifications', 'verifier'), false);
  assert.equal(isPathAllowedForRole('/admin/project-verifications', 'accountant'), false);
});

test('safeNotificationTarget accepts project verification list and detail deep links for admin', () => {
  const canonicalId = 'e3753bc2-29b3-4501-8bdd-b69c44d53688';
  const validDetail = `/admin/project-verifications/${canonicalId}`;
  assert.equal(safeNotificationTarget(validDetail, 'admin'), validDetail);
  assert.equal(safeNotificationTarget('/admin/project-verifications', 'admin'), '/admin/project-verifications');

  // Must reject non-admin roles
  assert.equal(safeNotificationTarget(validDetail, 'moderator'), null);
  assert.equal(safeNotificationTarget(validDetail, 'verifier'), null);
  assert.equal(safeNotificationTarget(validDetail, 'accountant'), null);
});

test('ProjectOrigin enum matches backend (Internal=0, External=1)', async () => {
  const { ProjectOrigin } = await import('../src/types/admin-project-verifications.ts');
  assert.equal(ProjectOrigin.Internal, 0);
  assert.equal(ProjectOrigin.External, 1);
});

test('ProjectVerificationDetailPage does not display raw UUIDs in user-facing JSX', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const detailPageContent = fs.readFileSync(
    path.resolve('src/pages/admin/ProjectVerificationDetailPage.tsx'),
    'utf-8'
  );

  // 1. Must not display Hồ sơ #{verification.id}
  assert.doesNotMatch(detailPageContent, /Hồ sơ #\{verification\.id\}/);
  // 2. Must not display packageId directly as text
  assert.doesNotMatch(detailPageContent, />\{detail\.packageId\}</);
  // 3. Must not display project.leaderId or project.id directly
  assert.doesNotMatch(detailPageContent, />\{project\.leaderId\}</);
  assert.doesNotMatch(detailPageContent, />\{project\.id\}</);
  // 4. Must not display verification.reservationId directly
  assert.doesNotMatch(detailPageContent, />\{verification\.reservationId\}</);
  assert.doesNotMatch(detailPageContent, /\{verification\.reservationId \|\|/);
  // 5. Must not display transactionId directly as text
  assert.doesNotMatch(detailPageContent, /Mã GD:\s*\{p\.transactionId\}/);

  // 6. Must not have "Bằng chứng cấp 1" or "Minh chứng cấp 1" in tabs
  assert.doesNotMatch(detailPageContent, /Bằng chứng cấp 1/);
  assert.doesNotMatch(detailPageContent, /Minh chứng cấp 1/);
  assert.doesNotMatch(detailPageContent, /EvidenceModerationPanel/);

  // 7. Must display project skills section
  assert.match(detailPageContent, /Kỹ năng & Công nghệ dự án/);
  // 8. Must display team members section including leader and without "Tài khoản hệ thống" label
  assert.match(detailPageContent, /Danh sách thành viên tham gia/);
  assert.match(detailPageContent, /Trưởng nhóm/);
  assert.doesNotMatch(detailPageContent, /Tài khoản hệ thống/);
  assert.doesNotMatch(detailPageContent, /Trưởng dự án \/ Người phụ trách/);
});

test('AssignmentHistoryPanel does not display technical IDs in user-facing JSX', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const panelContent = fs.readFileSync(
    path.resolve('src/components/project-verifications/AssignmentHistoryPanel.tsx'),
    'utf-8'
  );

  // Must not display ID: {assignment.id}
  assert.doesNotMatch(panelContent, /ID:\s*\{assignment\.id\}/);
  // Must not display adminId or assignedToUserId directly
  assert.doesNotMatch(panelContent, /Admin chỉ định ID/);
  assert.doesNotMatch(panelContent, /Thẩm định viên ID/);
  // Must not fallback to assignedToUserId when assignedToFullName is missing
  assert.doesNotMatch(panelContent, /assignment\.assignedToFullName \|\| assignment\.assignedToUserId/);
});

test('ReplaceVerificatorDialog does not expose raw assignment UUID', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dialogContent = fs.readFileSync(
    path.resolve('src/components/project-verifications/ReplaceVerificatorDialog.tsx'),
    'utf-8'
  );

  // Must not display Mã phân công hiện tại: {assignment.id}
  assert.doesNotMatch(dialogContent, /Mã phân công hiện tại/);
  // Must not fallback to assignedToUserId
  assert.doesNotMatch(dialogContent, /assignment\.assignedToFullName \|\| assignment\.assignedToUserId/);
});

test('VerificationReportView does not expose raw report.id UUID', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const reportContent = fs.readFileSync(
    path.resolve('src/components/project-verifications/VerificationReportView.tsx'),
    'utf-8'
  );

  // Must not display Mã báo cáo: {report.id}
  assert.doesNotMatch(reportContent, /Mã báo cáo:\s*<span[^>]*>\{report\.id\}<\/span>/);
});

