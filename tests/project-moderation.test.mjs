import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ModerationCheckResult,
  moderationCheckResultLabels,
  getModerationCheckResultLabel,
  getModerationCheckResultBadgeClass,
  ProjectModerationStatus,
  projectModerationStatusLabels,
  sanitizeDisplayText,
} from '../src/types/project-moderation.ts';
import { roleNavigationConfig, isPathAllowedForRole } from '../src/data/navigation.ts';

test('ModerationCheckResult enum and labels align with backend specifications', () => {
  assert.equal(ModerationCheckResult.Pending, 0);
  assert.equal(ModerationCheckResult.Passed, 1);
  assert.equal(ModerationCheckResult.Failed, 2);
  assert.equal(ModerationCheckResult.Error, 3);

  assert.equal(moderationCheckResultLabels[ModerationCheckResult.Pending], 'Chờ kiểm tra');
  assert.equal(moderationCheckResultLabels[ModerationCheckResult.Passed], 'Đạt');
  assert.equal(moderationCheckResultLabels[ModerationCheckResult.Failed], 'Không đạt');
  assert.equal(moderationCheckResultLabels[ModerationCheckResult.Error], 'Lỗi kiểm tra');

  // getModerationCheckResultLabel helper
  assert.equal(getModerationCheckResultLabel(0), 'Chờ kiểm tra');
  assert.equal(getModerationCheckResultLabel(1), 'Đạt');
  assert.equal(getModerationCheckResultLabel(2), 'Không đạt');
  assert.equal(getModerationCheckResultLabel(3), 'Lỗi kiểm tra');
  assert.equal(getModerationCheckResultLabel(999), 'Chưa rõ');
  assert.equal(getModerationCheckResultLabel(null), 'Chưa rõ');
  assert.equal(getModerationCheckResultLabel(undefined), 'Chưa rõ');

  // Badge styles helper
  assert.ok(getModerationCheckResultBadgeClass(ModerationCheckResult.Passed).includes('emerald'));
  assert.ok(getModerationCheckResultBadgeClass(ModerationCheckResult.Failed).includes('rose'));
  assert.ok(getModerationCheckResultBadgeClass(ModerationCheckResult.Error).includes('amber'));
  assert.ok(getModerationCheckResultBadgeClass(ModerationCheckResult.Pending).includes('sky'));
});

test('ProjectModerationStatus enum matches backend statuses', () => {
  assert.equal(ProjectModerationStatus.Pending, 0);
  assert.equal(ProjectModerationStatus.Processing, 1);
  assert.equal(ProjectModerationStatus.ReviewRequired, 2);
  assert.equal(ProjectModerationStatus.Approved, 3);
  assert.equal(ProjectModerationStatus.Rejected, 4);
  assert.equal(ProjectModerationStatus.Error, 5);
  assert.equal(ProjectModerationStatus.Passed, 6);
  assert.equal(ProjectModerationStatus.NeedsEvidence, 7);

  assert.equal(projectModerationStatusLabels[ProjectModerationStatus.ReviewRequired], 'Cần kiểm duyệt');
  assert.equal(projectModerationStatusLabels[ProjectModerationStatus.Approved], 'Đã duyệt');
  assert.equal(projectModerationStatusLabels[ProjectModerationStatus.Rejected], 'Đã từ chối');
});

test('sanitizeDisplayText hides UUIDs from displayed text to preserve ID concealment', () => {
  const sampleWithUUID = 'Vi phạm bản quyền với ID 12345678-abcd-1234-cdef-123456789abc trong mã nguồn';
  const sanitized = sanitizeDisplayText(sampleWithUUID);
  assert.equal(sanitized, 'Vi phạm bản quyền với ID *** trong mã nguồn');
  assert.ok(!sanitized.includes('12345678-abcd-1234-cdef-123456789abc'));

  // Test multiple UUIDs
  const multipleUUIDs = 'Dự án (e579ef62-1111-2222-3333-444455556666) đối chiếu với c0a80101-9999-8888-7777-666655554444';
  const clean = sanitizeDisplayText(multipleUUIDs);
  assert.equal(clean, 'Dự án (***) đối chiếu với ***');

  // Normal text remains untouched
  assert.equal(sanitizeDisplayText('Website quản lý đồ án tốt nghiệp sinh viên'), 'Website quản lý đồ án tốt nghiệp sinh viên');
  assert.equal(sanitizeDisplayText(''), '');
  assert.equal(sanitizeDisplayText(null), '');
  assert.equal(sanitizeDisplayText(undefined), '');
});

test('Navigation configuration connects project moderation for both Admin and Moderator', () => {
  const adminNav = roleNavigationConfig.admin;
  const adminItem = adminNav.find((item) => item.id === 'admin-project-moderation');
  assert.ok(adminItem, 'Admin navigation must include admin-project-moderation');
  assert.equal(adminItem.path, '/admin/project-moderation');
  assert.equal(adminItem.section, 'KIỂM DUYỆT');

  const moderatorNav = roleNavigationConfig.moderator;
  const modItem = moderatorNav.find((item) => item.id === 'moderator-projects');
  assert.ok(modItem, 'Moderator navigation must include moderator-projects');
  assert.equal(modItem.path, '/moderator/projects');
  assert.equal(modItem.section, 'KIỂM DUYỆT');

  // Role path checks
  assert.ok(isPathAllowedForRole('/admin/project-moderation', 'admin'));
  assert.ok(isPathAllowedForRole('/moderator/projects', 'moderator'));

  // Cross-role separation
  assert.equal(isPathAllowedForRole('/admin/project-moderation', 'moderator'), false);
  assert.equal(isPathAllowedForRole('/moderator/projects', 'admin'), false);
  assert.equal(isPathAllowedForRole('/moderator/projects', 'accountant'), false);
  assert.equal(isPathAllowedForRole('/moderator/projects', 'verifier'), false);
});
