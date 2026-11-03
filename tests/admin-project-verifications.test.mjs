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

