import test from 'node:test';
import assert from 'node:assert/strict';
import { safeNotificationTarget, notificationDate } from '../src/utils/notification-targets.ts';

test('only known internal routes for the current staff role can open', () => {
  assert.equal(safeNotificationTarget('/admin/projects?notificationTarget=123', 'admin'), '/admin/projects?notificationTarget=123');
  assert.equal(safeNotificationTarget('/assessor/projects', 'assessor'), null);
  assert.equal(safeNotificationTarget('/moderator/job-postings', 'moderator'), '/moderator/job-postings');
  for (const target of ['/admin/student-verifications', '/admin/partner-verifications', '/admin/job-postings', '/admin/community-posts']) {
    assert.equal(safeNotificationTarget(target, 'admin'), target);
    assert.equal(safeNotificationTarget(target, 'moderator'), null);
  }
  assert.equal(safeNotificationTarget('/notifications', 'admin'), '/admin/notifications');
  for (const url of ['https://evil.example', '//evil.example/admin/projects', '/\\evil.example', '/admin/projects\n', '/admin/unknown', '/assessor/projects', 'javascript:alert(1)', null, '']) {
    assert.equal(safeNotificationTarget(url, 'admin'), null, String(url));
  }
});

test('invalid notification dates are harmless', () => {
  assert.equal(notificationDate('invalid'), '');
  assert.ok(notificationDate('2026-10-25T00:00:00Z').includes('07:00'));
});

test('management details accept only matching staff roles and canonical GUID routes', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  for (const role of ['admin', 'verifier']) for (const kind of ['users', 'student-verifications', 'partner-verifications']) {
    const path = `/${role}/${kind}/${id}`;
    assert.equal(safeNotificationTarget(path, role), path);
    assert.equal(safeNotificationTarget(path + '/documents', role), null);
    assert.equal(safeNotificationTarget(`/${role}/${kind}/not-an-id`, role), null);
  }
  assert.equal(safeNotificationTarget('/admin/users/' + id, 'moderator'), null);
  assert.equal(safeNotificationTarget('/moderator/users/' + id, 'moderator'), '/moderator/users/' + id);
  for (const role of ['assessor', 'accountant']) assert.equal(safeNotificationTarget(`/${role}/student-verifications/${id}`, role), null);
});
