const { chromium } = require('C:/Users/minec/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const origin = process.env.DASHBOARD_TEST_ORIGIN || 'http://127.0.0.1:5174';
const token = claim => [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ role: claim, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'fixture-signature'].join('.');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const mode of ['new-login', 'legacy-assessor', 'legacy-admin-label']) {
      const context = await browser.newContext(); const page = await context.newPage(); let managementReads = 0;
      const account = { id: 'assessor-fixture', email: 'assessor@fixture.test', role: 2, status: 1, profile: { id: 'expert-profile', fullName: 'Assessor' }, profileComplete: true };
      if (mode !== 'new-login') await page.addInitScript(({ account, mode, access }) => {
        localStorage.setItem('uninet_auth_user', JSON.stringify({ id: account.id, email: account.email, name: 'Legacy Assessor', role: mode === 'legacy-admin-label' ? 'admin' : 'assessor', rawRole: 2, account }));
        localStorage.setItem('uninet_account', JSON.stringify(account)); localStorage.setItem('accessToken', access); localStorage.setItem('refreshToken', 'fixture-refresh'); localStorage.setItem('expiresAt', new Date(Date.now() + 3600000).toISOString());
      }, { account, mode, access: token('Assessor') });
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/api/auth/login') return route.fulfill({ json: { account, accessToken: token('Assessor'), refreshToken: 'fixture-refresh', expiresAt: new Date(Date.now() + 3600000).toISOString() } });
        if (path.startsWith('/api/admin/')) managementReads++;
        return route.fulfill({ status: 403, json: { message: 'Assessor denied' } });
      });
      await page.goto(origin + (mode === 'new-login' ? '/login' : '/admin/revenue'));
      await page.waitForURL(/\/login/);
      if (mode === 'new-login') {
        await page.getByLabel('Email', { exact: true }).fill(account.email); await page.getByLabel('Mật khẩu', { exact: true }).fill('fixture-password');
        await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click(); await page.getByText('Thẩm định viên vui lòng đăng nhập trên ứng dụng UniNet.', { exact: true }).waitFor();
      }
      assert.equal(managementReads, 0); assert.equal(await page.getByTestId('finance-page').count(), 0);
      // Read fixture storage only: denial must not preserve any usable Dashboard token.
      assert.equal(await page.evaluate(() => localStorage.getItem('accessToken')), null);
      await context.close(); console.log(mode + ': denied');
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
