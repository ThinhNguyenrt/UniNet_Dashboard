const { chromium } = require('C:/Users/minec/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const origin = process.env.DASHBOARD_TEST_ORIGIN || 'http://127.0.0.1:5174';
const oldUser = { id: '00000000-0000-4000-8000-000000000001', name: 'Old Admin', email: 'old@example.test', role: 'admin', roleName: 'Quản trị viên' };
const account = id => ({ id, email: `${id.slice(-1)}@example.test`, role: 2, status: 0, emailVerified: true, profileComplete: true, profile: { id: '00000000-0000-4000-8000-000000000010', fullName: id === oldUser.id ? 'Old Admin' : 'New Admin', displayName: null, nickname: 'admin' } });
const auth = (id, token) => ({ account: account(id), accessToken: `${token}-access`, refreshToken: `${token}-refresh`, expiresAt: new Date(Date.now() + 3600000).toISOString(), requiresProfileCompletion: false });

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const switchAccount of [false, true]) {
      const page = await browser.newPage();
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      let release, started;
      const pending = new Promise(resolve => { release = resolve; });
      const waiting = new Promise(resolve => { started = resolve; });
      await page.addInitScript(({ user, account }) => {
        localStorage.setItem('uninet_auth_user', JSON.stringify(user)); localStorage.setItem('uninet_account', JSON.stringify(account));
        localStorage.setItem('accessToken', 'old-access'); localStorage.setItem('refreshToken', 'old-refresh');
        localStorage.setItem('expiresAt', new Date(Date.now() + 3600000).toISOString());
      }, { user: oldUser, account: account(oldUser.id) });
      await page.route('**/hubs/**', route => route.fulfill({ status: 503 }));
      const newId = '00000000-0000-4000-8000-000000000002';
      await page.route('**/api/**', async route => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith('/auth/refresh')) { started(); await pending; return route.fulfill({ json: auth(oldUser.id, 'stale') }); }
        if (path.endsWith('/auth/login')) return route.fulfill({ json: auth(newId, 'new') });
        if (route.request().headers().authorization === 'Bearer old-access') return route.fulfill({ status: 401 });
        if (path.endsWith('/permissions')) return route.fulfill({ json: { canManage: true } });
        if (path.endsWith('/unread-count')) return route.fulfill({ json: { count: 0 } });
        if (path.endsWith('/notifications')) return route.fulfill({ json: { items: [], page: 1, pageSize: 20, total: 0, unreadCount: 0 } });
        return route.fulfill({ json: [] });
      });
      await page.goto(`${origin}/admin/notifications`);
      await waiting;
      await page.getByRole('button', { name: 'Đăng xuất', exact: true }).first().click();
      await page.waitForURL('**/login');
      if (switchAccount) {
        await page.getByLabel('Địa chỉ Email', { exact: true }).fill('new@example.test');
        await page.getByLabel('Mật khẩu', { exact: true }).fill('fixture-password');
        await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click();
        await page.waitForURL(url => url.pathname.startsWith('/admin/'));
      }
      const completed = page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/auth/refresh'));
      release();
      await (await completed).finished();
      await page.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
      // A subsequent API request proves the pending refresh has settled without restoring the old account.
      if (switchAccount) {
        await page.getByRole('link', { name: 'Thông báo', exact: true }).click();
        await page.waitForURL('**/admin/notifications');
        await page.getByText('Chưa có thông báo trong mục này.', { exact: true }).waitFor();
        assert.equal(await page.evaluate(id => JSON.parse(localStorage.getItem('uninet_auth_user')).id === id && localStorage.getItem('accessToken') === 'new-access', newId), true);
      } else {
        await page.waitForFunction(() => !localStorage.getItem('accessToken'));
        assert.equal(page.url(), `${origin}/login`);
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('Pending refresh cannot restore a logged-out session or overwrite a newly signed-in account.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
