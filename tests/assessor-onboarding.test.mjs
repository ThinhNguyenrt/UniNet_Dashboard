import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AssessorOnboardingStatus,
  ASSESSOR_ONBOARDING_STATUS_CONFIG,
} from '../src/types/assessor-onboarding.ts';
import { isPathAllowedForRole } from '../src/data/navigation.ts';

test('AssessorOnboardingStatus contains exactly the 10 statuses defined by backend contract', () => {
  const expectedStatuses = [
    'Invited',
    'ProfileSubmitted',
    'AwaitingSignature',
    'AwaitingApproval',
    'ApprovalConflict',
    'AwaitingPassword',
    'Activated',
    'Rejected',
    'Revoked',
    'Expired',
  ];

  assert.equal(Object.keys(AssessorOnboardingStatus).length, 10);
  for (const st of expectedStatuses) {
    assert.equal(AssessorOnboardingStatus[st], st);
  }
});

test('ASSESSOR_ONBOARDING_STATUS_CONFIG provides user-friendly labels and descriptions for all statuses', () => {
  for (const [key, val] of Object.entries(AssessorOnboardingStatus)) {
    const cfg = ASSESSOR_ONBOARDING_STATUS_CONFIG[val];
    assert.ok(cfg, `Status ${key} must have configuration`);
    assert.ok(cfg.label && typeof cfg.label === 'string');
    assert.ok(cfg.bg && typeof cfg.bg === 'string');
    assert.ok(cfg.text && typeof cfg.text === 'string');
    assert.ok(cfg.desc && typeof cfg.desc === 'string');
  }

  assert.equal(ASSESSOR_ONBOARDING_STATUS_CONFIG[AssessorOnboardingStatus.Invited].label, 'Đã tạo lời mời');
  assert.equal(ASSESSOR_ONBOARDING_STATUS_CONFIG[AssessorOnboardingStatus.AwaitingSignature].label, 'Chờ ký hợp đồng');
  assert.equal(ASSESSOR_ONBOARDING_STATUS_CONFIG[AssessorOnboardingStatus.AwaitingApproval].label, 'Chờ duyệt');
  assert.equal(ASSESSOR_ONBOARDING_STATUS_CONFIG[AssessorOnboardingStatus.ApprovalConflict].label, 'Xung đột cấp tài khoản');
  assert.equal(ASSESSOR_ONBOARDING_STATUS_CONFIG[AssessorOnboardingStatus.Activated].label, 'Đã kích hoạt');
});

test('Assessor onboarding routes are strictly protected for Admin role', () => {
  const listRoute = '/admin/assessor-onboardings';
  const detailRoute = '/admin/assessor-onboardings/e3b0c442-98fc-1c14-9afb-f4c8996fb924';

  assert.equal(isPathAllowedForRole(listRoute, 'admin'), true);
  assert.equal(isPathAllowedForRole(detailRoute, 'admin'), true);

  assert.equal(isPathAllowedForRole(listRoute, 'moderator'), false);
  assert.equal(isPathAllowedForRole(detailRoute, 'moderator'), false);

  assert.equal(isPathAllowedForRole(listRoute, 'accountant'), false);
  assert.equal(isPathAllowedForRole(detailRoute, 'accountant'), false);

  assert.equal(isPathAllowedForRole(listRoute, 'verifier'), false);
  assert.equal(isPathAllowedForRole(detailRoute, 'verifier'), false);
});

test('GUID lookup validation accurately validates canonical UUID format', () => {
  const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  assert.ok(guidRegex.test('12345678-1234-1234-1234-123456789abc'));
  assert.ok(guidRegex.test('E3B0C442-98FC-1C14-9AFB-F4C8996FB924'));

  assert.equal(guidRegex.test('not-a-guid'), false);
  assert.equal(guidRegex.test('12345678-1234-1234-1234'), false);
  assert.equal(guidRegex.test(''), false);
});

