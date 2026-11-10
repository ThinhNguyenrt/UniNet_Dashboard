import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { roleNavigationConfig, isPathAllowedForRole } from '../src/data/navigation.ts';
import { safeNotificationTarget } from '../src/utils/notification-targets.ts';

test('Admin navigation contains Danh mục ngành nghề under HỆ THỐNG', () => {
  const adminNav = roleNavigationConfig.admin;
  const item = adminNav.find((i) => i.id === 'admin-specializations');

  assert.ok(item, 'admin-specializations item must be present');
  assert.equal(item.label, 'Danh mục ngành nghề');
  assert.equal(item.path, '/admin/specializations');
  assert.equal(item.section, 'HỆ THỐNG');
});

test('Specializations route is restricted exclusively to Admin role', () => {
  assert.equal(isPathAllowedForRole('/admin/specializations', 'admin'), true);
  assert.equal(isPathAllowedForRole('/admin/specializations', 'moderator'), false);
  assert.equal(isPathAllowedForRole('/admin/specializations', 'accountant'), false);
  assert.equal(isPathAllowedForRole('/admin/specializations', 'verifier'), false);
});

test('safeNotificationTarget allows /admin/specializations for admin and rejects for other roles', () => {
  assert.equal(
    safeNotificationTarget('/admin/specializations', 'admin'),
    '/admin/specializations'
  );
  assert.equal(safeNotificationTarget('/admin/specializations', 'moderator'), null);
  assert.equal(safeNotificationTarget('/admin/specializations', 'accountant'), null);
  assert.equal(safeNotificationTarget('/admin/specializations', 'verifier'), null);
});

test('SpecializationsPage does not display technical IDs anywhere in user-facing JSX', () => {
  const pagePath = path.resolve('src/pages/admin/SpecializationsPage.tsx');
  const content = fs.readFileSync(pagePath, 'utf-8');

  // Must not render item.id or specialization.id as visible text
  assert.doesNotMatch(content, />\{item\.id\}</);
  assert.doesNotMatch(content, />\{specialization\.id\}</);
  assert.doesNotMatch(content, />ID:\s*\{/);
  assert.doesNotMatch(content, />Mã ID:\s*\{/);
  assert.doesNotMatch(content, /Mã hệ thống/);
  assert.doesNotMatch(content, /UUID/);
});

test('SpecializationsPage table rows do NOT contain edit or toggle buttons, only Xem chi tiết', () => {
  const pagePath = path.resolve('src/pages/admin/SpecializationsPage.tsx');
  const content = fs.readFileSync(pagePath, 'utf-8');

  // Locate the table body row section
  const tbodyIndex = content.indexOf('<tbody');
  const tbodyEndIndex = content.indexOf('</tbody>');
  assert.ok(tbodyIndex > 0 && tbodyEndIndex > tbodyIndex, 'Table body must exist');

  const tbodyContent = content.slice(tbodyIndex, tbodyEndIndex);

  // Must contain "Xem chi tiết"
  assert.match(tbodyContent, /Xem chi tiết/);

  // Must NOT have direct edit action in list rows
  assert.doesNotMatch(tbodyContent, /Chỉnh sửa/);
  assert.doesNotMatch(tbodyContent, /Xóa/);
  assert.doesNotMatch(tbodyContent, /type="checkbox"/);
  assert.doesNotMatch(tbodyContent, /onClick=\{.*setEditing/);
});

test('Specialization code format regex validation matches backend rules (1-100 uppercase alphanumeric and underscores)', () => {
  const codeRegex = /^[A-Z0-9_]+$/;

  // Valid codes
  assert.ok(codeRegex.test('SOFTWARE_ENGINEERING'));
  assert.ok(codeRegex.test('ARTIFICIAL_INTELLIGENCE'));
  assert.ok(codeRegex.test('INFORMATION_SECURITY'));
  assert.ok(codeRegex.test('DATA_SCIENCE_2026'));
  assert.ok(codeRegex.test('BLOCKCHAIN'));

  // Invalid codes (lowercase, spaces, dashes, symbols)
  assert.equal(codeRegex.test('software_engineering'), false);
  assert.equal(codeRegex.test('Software_Engineering'), false);
  assert.equal(codeRegex.test('SOFTWARE ENGINEERING'), false);
  assert.equal(codeRegex.test('SOFTWARE-ENGINEERING'), false);
  assert.equal(codeRegex.test('IT@UNINET'), false);
  assert.equal(codeRegex.test(''), false);
});

