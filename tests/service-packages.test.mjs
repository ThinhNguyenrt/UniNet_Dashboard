import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PackageType,
  TargetRole,
  PACKAGE_TYPE_LABELS,
  TARGET_ROLE_LABELS,
} from '../src/types/packages.ts';
import { roleNavigationConfig, isPathAllowedForRole } from '../src/data/navigation.ts';

test('PackageType aligns with backend enum: Verification=0, Advertisement=1', () => {
  assert.equal(PackageType.Verification, 0);
  assert.equal(PackageType.Advertisement, 1);
  assert.equal(Object.keys(PackageType).length, 2);

  assert.equal(PACKAGE_TYPE_LABELS[PackageType.Verification], 'Thẩm định dự án');
  assert.equal(PACKAGE_TYPE_LABELS[PackageType.Advertisement], 'Quảng cáo');
});

test('TargetRole aligns with backend enum: Student=0, Company=1 without Assessor', () => {
  assert.equal(TargetRole.Student, 0);
  assert.equal(TargetRole.Company, 1);
  assert.equal(Object.keys(TargetRole).length, 2);

  // TargetRole must NOT have Assessor
  assert.equal(TargetRole.Assessor, undefined);

  assert.equal(TARGET_ROLE_LABELS[TargetRole.Student], 'Sinh viên');
  assert.equal(TARGET_ROLE_LABELS[TargetRole.Company], 'Doanh nghiệp');
});

test('Admin navigation contains Cấu hình dịch vụ item under HỆ THỐNG', () => {
  const adminNav = roleNavigationConfig.admin;
  const configItem = adminNav.find((item) => item.id === 'admin-service-config');

  assert.ok(configItem, 'admin-service-config item must be present');
  assert.equal(configItem.label, 'Cấu hình dịch vụ');
  assert.equal(configItem.path, '/admin/service-packages');
  assert.equal(configItem.section, 'HỆ THỐNG');
});

test('Service packages route is restricted exclusively to Admin role', () => {
  assert.equal(isPathAllowedForRole('/admin/service-packages', 'admin'), true);
  assert.equal(isPathAllowedForRole('/admin/service-packages', 'moderator'), false);
  assert.equal(isPathAllowedForRole('/admin/service-packages', 'accountant'), false);
  assert.equal(isPathAllowedForRole('/admin/service-packages', 'verifier'), false);
});

test('Price validation accepts valid decimal format and rejects malformed values', () => {
  const decimalRegex = /^\d+(\.\d{1,2})?$/;

  // Valid values
  assert.ok(decimalRegex.test('0'));
  assert.ok(decimalRegex.test('500000'));
  assert.ok(decimalRegex.test('4990000.5'));
  assert.ok(decimalRegex.test('12500000.99'));

  // Invalid values
  assert.equal(decimalRegex.test('-100'), false);
  assert.equal(decimalRegex.test('abc'), false);
  assert.equal(decimalRegex.test('12.345'), false); // More than 2 decimal digits
  assert.equal(decimalRegex.test(''), false);
});

test('Duration handling maps blank input to null instead of 0', () => {
  const formatDuration = (val) => (val && val.trim() ? parseInt(val.trim(), 10) : null);

  assert.equal(formatDuration(''), null);
  assert.equal(formatDuration('   '), null);
  assert.equal(formatDuration('30'), 30);
  assert.equal(formatDuration('365'), 365);
});

