import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardRole, isDashboardRole } from '../src/utils/dashboard-role-access.ts';
test('Assessor and public users cannot enter the management Dashboard', () => {
  for (const role of [0, 1, 2, 'Student', 'Partner', 'Assessor', 'Verificator', 'assessor', 'constructor', '__proto__', 'toString', 'guest']) assert.equal(dashboardRole(role), null);
  assert.equal(isDashboardRole('assessor'), false);
});
test('only the four system staff roles remain eligible', () => {
  for (const [value, role] of [[3, 'verifier'], [4, 'moderator'], [5, 'accountant'], [6, 'admin']]) {
    assert.equal(dashboardRole(value), role); assert.equal(dashboardRole(role), role); assert.equal(isDashboardRole(role), true);
  }
});
