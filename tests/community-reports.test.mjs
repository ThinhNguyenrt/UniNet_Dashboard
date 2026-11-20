import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ContentReportStatus,
  PostStatus,
  contentReportStatusLabels,
  postStatusLabels,
} from '../src/types/community-report.ts';
import { adminPermissions } from '../src/types/admin-management.ts';
import { safeNotificationTarget } from '../src/utils/notification-targets.ts';
import { roleNavigationConfig } from '../src/data/navigation.ts';

test('ContentReportStatus and PostStatus enums match API contract exactly', () => {
  // ReportStatus: 0 = Open, 1 = Resolved, 2 = Dismissed
  assert.equal(ContentReportStatus.Open, 0);
  assert.equal(ContentReportStatus.Resolved, 1);
  assert.equal(ContentReportStatus.Dismissed, 2);

  assert.equal(contentReportStatusLabels[ContentReportStatus.Open], 'Chờ xử lý');
  assert.equal(contentReportStatusLabels[ContentReportStatus.Resolved], 'Không vi phạm');
  assert.equal(contentReportStatusLabels[ContentReportStatus.Dismissed], 'Xác nhận vi phạm');

  // PostStatus: 0 = PendingReview, 1 = Published, 2 = Hidden, 3 = Blocked
  assert.equal(PostStatus.PendingReview, 0);
  assert.equal(PostStatus.Published, 1);
  assert.equal(PostStatus.Hidden, 2);
  assert.equal(PostStatus.Blocked, 3);

  assert.equal(postStatusLabels[PostStatus.PendingReview], 'Chờ duyệt');
  assert.equal(postStatusLabels[PostStatus.Published], 'Đang hiển thị');
  assert.equal(postStatusLabels[PostStatus.Hidden], 'Đã ẩn');
  assert.equal(postStatusLabels[PostStatus.Blocked], 'Bị chặn');
});

test('adminPermissions includes communityReview with permission string community.review', () => {
  assert.equal(adminPermissions.communityReview, 'community.review');
});

test('roleNavigationConfig has complaints for both Admin and Moderator', () => {
  const adminItem = roleNavigationConfig.admin.find(item => item.id === 'admin-complaints');
  assert.ok(adminItem, 'Admin navigation must have admin-complaints');
  assert.equal(adminItem.path, '/admin/complaints');
  assert.equal(adminItem.label, 'Xử lý khiếu nại');

  const modItem = roleNavigationConfig.moderator.find(item => item.id === 'moderator-complaints');
  assert.ok(modItem, 'Moderator navigation must have moderator-complaints');
  assert.equal(modItem.path, '/moderator/complaints');
  assert.equal(modItem.label, 'Xử lý khiếu nại');
});

test('safeNotificationTarget recognizes canonical complaints list and UUID detail routes for Admin and Moderator', () => {
  const validReportId = '11111111-1111-4111-8111-111111111111';

  // Admin list & detail
  assert.equal(
    safeNotificationTarget('/admin/complaints', 'admin'),
    '/admin/complaints'
  );
  assert.equal(
    safeNotificationTarget(`/admin/complaints/${validReportId}`, 'admin'),
    `/admin/complaints/${validReportId}`
  );

  // Moderator list & detail
  assert.equal(
    safeNotificationTarget('/moderator/complaints', 'moderator'),
    '/moderator/complaints'
  );
  assert.equal(
    safeNotificationTarget(`/moderator/complaints/${validReportId}`, 'moderator'),
    `/moderator/complaints/${validReportId}`
  );

  // Role mismatch
  assert.equal(
    safeNotificationTarget(`/admin/complaints/${validReportId}`, 'moderator'),
    null
  );
  assert.equal(
    safeNotificationTarget(`/moderator/complaints/${validReportId}`, 'admin'),
    null
  );

  // Verifier and Accountant cannot access complaints
  assert.equal(
    safeNotificationTarget(`/verifier/complaints/${validReportId}`, 'verifier'),
    null
  );
  assert.equal(
    safeNotificationTarget(`/accountant/complaints/${validReportId}`, 'accountant'),
    null
  );

  // Invalid GUID format
  assert.equal(
    safeNotificationTarget('/admin/complaints/not-a-valid-guid', 'admin'),
    null
  );
});
