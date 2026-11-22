import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CampaignStatus,
  CAMPAIGN_STATUS_CONFIG,
  getCampaignStatusConfig,
  isSafeHttpUrl,
} from '../src/types/advertisements.ts';
import { roleNavigationConfig, isPathAllowedForRole } from '../src/data/navigation.ts';
import { safeNotificationTarget } from '../src/utils/notification-targets.ts';

test('CampaignStatus enum aligns with backend specification: 0 to 5', () => {
  assert.equal(CampaignStatus.Draft, 0);
  assert.equal(CampaignStatus.PendingModeration, 1);
  assert.equal(CampaignStatus.PendingPayment, 2);
  assert.equal(CampaignStatus.Active, 3);
  assert.equal(CampaignStatus.Completed, 4);
  assert.equal(CampaignStatus.Rejected, 5);

  assert.equal(Object.keys(CampaignStatus).length, 6);
});

test('CAMPAIGN_STATUS_CONFIG defines user-friendly labels matching specification', () => {
  assert.equal(CAMPAIGN_STATUS_CONFIG[CampaignStatus.Draft].label, 'Bản nháp');
  assert.equal(CAMPAIGN_STATUS_CONFIG[CampaignStatus.PendingModeration].label, 'Chờ kiểm duyệt');
  assert.equal(CAMPAIGN_STATUS_CONFIG[CampaignStatus.PendingPayment].label, 'Chờ thanh toán');
  assert.equal(CAMPAIGN_STATUS_CONFIG[CampaignStatus.Active].label, 'Đang chạy');
  assert.equal(CAMPAIGN_STATUS_CONFIG[CampaignStatus.Completed].label, 'Đã kết thúc');
  assert.equal(CAMPAIGN_STATUS_CONFIG[CampaignStatus.Rejected].label, 'Bị từ chối');

  for (const status of Object.values(CampaignStatus)) {
    const cfg = getCampaignStatusConfig(status);
    assert.ok(cfg.label, `Status ${status} must have label`);
    assert.ok(cfg.bg, `Status ${status} must have bg`);
    assert.ok(cfg.text, `Status ${status} must have text`);
    assert.ok(cfg.border, `Status ${status} must have border`);
  }
});

test('isSafeHttpUrl strictly allows only HTTP and HTTPS protocols and rejects malicious schemes', () => {
  // Valid HTTP/HTTPS
  assert.equal(isSafeHttpUrl('https://uninet.edu.vn'), true);
  assert.equal(isSafeHttpUrl('http://example.com/promo'), true);
  assert.equal(isSafeHttpUrl('https://sub.domain.co.uk:8080/path?key=val#hash'), true);

  // Invalid or Dangerous Schemes
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeHttpUrl('ftp://ftp.example.com'), false);
  assert.equal(isSafeHttpUrl('file:///etc/passwd'), false);
  assert.equal(isSafeHttpUrl('vbscript:msgbox(1)'), false);
  assert.equal(isSafeHttpUrl('not-a-url'), false);
  assert.equal(isSafeHttpUrl(''), false);
  assert.equal(isSafeHttpUrl(null), false);
  assert.equal(isSafeHttpUrl(undefined), false);
});

test('Moderator navigation contains moderator-advertisements item under HỆ THỐNG matching admin structure', () => {
  const modNav = roleNavigationConfig.moderator;
  const adItem = modNav.find((item) => item.id === 'moderator-advertisements');

  assert.ok(adItem, 'moderator-advertisements must be present in Moderator navigation');
  assert.equal(adItem.label, 'Quảng cáo');
  assert.equal(adItem.path, '/moderator/advertisements');
  assert.equal(adItem.section, 'HỆ THỐNG');

  // Verify Admin also retains admin-advertisements
  const adminNav = roleNavigationConfig.admin;
  const adminAdItem = adminNav.find((item) => item.id === 'admin-advertisements');
  assert.ok(adminAdItem, 'admin-advertisements must remain in Admin navigation');
  assert.equal(adminAdItem.label, 'Quảng cáo');
  assert.equal(adminAdItem.path, '/admin/advertisements');
});

test('Advertisements route permissions are permitted for Admin and Moderator, and rejected for others', () => {
  // Allowed
  assert.equal(isPathAllowedForRole('/admin/advertisements', 'admin'), true);
  assert.equal(isPathAllowedForRole('/moderator/advertisements', 'moderator'), true);

  // Disallowed cross-role
  assert.equal(isPathAllowedForRole('/admin/advertisements', 'moderator'), false);
  assert.equal(isPathAllowedForRole('/moderator/advertisements', 'admin'), false);

  // Disallowed for Accountant and Verifier
  assert.equal(isPathAllowedForRole('/admin/advertisements', 'accountant'), false);
  assert.equal(isPathAllowedForRole('/moderator/advertisements', 'accountant'), false);
  assert.equal(isPathAllowedForRole('/admin/advertisements', 'verifier'), false);
  assert.equal(isPathAllowedForRole('/moderator/advertisements', 'verifier'), false);
});

test('safeNotificationTarget recognizes advertisements routes for Admin and Moderator', () => {
  assert.equal(safeNotificationTarget('/admin/advertisements', 'admin'), '/admin/advertisements');
  assert.equal(safeNotificationTarget('/moderator/advertisements', 'moderator'), '/moderator/advertisements');

  assert.equal(safeNotificationTarget('/admin/advertisements', 'accountant'), null);
  assert.equal(safeNotificationTarget('/moderator/advertisements', 'accountant'), null);
});
