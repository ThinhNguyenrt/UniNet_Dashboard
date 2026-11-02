const { chromium } = require('C:/Users/minec/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const origin = process.env.DASHBOARD_TEST_ORIGIN || 'http://127.0.0.1:5174';
const guid = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const financial = ['finance.view', 'finance.wallet.credit', 'finance.refund.create', 'finance.refund.review', 'finance.withdrawal.review', 'finance.payout.create', 'finance.payout.confirm', 'finance.report.export'];
const scopes = { admin: [...financial, 'users.view', 'users.detail', 'staff.manage', 'permissions.manage', 'verification.student.review', 'verification.partner.review', 'notifications.manage', 'verification.evidence.review'], accountant: financial, verifier: ['users.view', 'users.detail', 'verification.student.review', 'verification.partner.review'], moderator: ['users.view', 'users.detail', 'project.review', 'recruitment.review', 'community.review'], assessor: ['verification.evidence.review'] };
const roles = { admin: 6, accountant: 5, verifier: 3, moderator: 4, assessor: 2 };
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const role of ['admin', 'accountant', 'verifier', 'moderator']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
      const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
      const account = { id: guid(1), email: 'finance@fixture.test', role: roles[role], status: 1, profileComplete: true, profile: { id: guid(2), fullName: 'Finance Fixture', nickname: 'fixture', displayName: 'Finance Fixture' } };
      const user = { id: account.id, name: 'Finance Fixture', email: account.email, role, roleName: role, profile: account.profile };
      await page.addInitScript(({ user, account }) => { localStorage.setItem('uninet_auth_user', JSON.stringify(user)); localStorage.setItem('uninet_account', JSON.stringify(account)); localStorage.setItem('accessToken', 'finance-fixture'); localStorage.setItem('refreshToken', 'finance-refresh'); localStorage.setItem('expiresAt', new Date(Date.now() + 3600000).toISOString()); }, { user, account });
      await page.routeWebSocket('**/hubs/notifications**', socket => socket.onMessage(v => { if (String(v).includes('"protocol"')) socket.send('{}\x1e'); }));
      const withdrawal = { id: guid(10), accountId: guid(20), amount: '1000', bankName: 'Fixture Bank', bankAccountNumber: '123456', bankAccountHolder: 'RECIPIENT', state: 0, createdAt: '2026-11-01T00:00:00Z', reviewReason: null };
      const refunds = [{ id: guid(30), transactionId: guid(40), amount: '100', status: 0, approval: 1, reason: 'Other staff request', requestedByUserId: guid(99) }];
      const writes = []; let financeReads = 0;
      await page.route('**/api/**', async route => {
        const request = route.request(), url = new URL(request.url()), path = url.pathname;
        const ok = json => route.fulfill({ json });
        if (path === '/api/admin/management') return ok({ permissions: scopes[role], pendingStudents: 0, pendingPartners: 0 });
        if (path === '/api/staff/accounts' && request.method() === 'POST') { writes.push({ path, body: request.postDataJSON() }); return ok({}); }
        if (path === '/api/notifications/summary') return ok({ unreadCount: 0, total: 0, canManage: role === 'admin' });
        if (path === '/api/notifications') return ok({ items: [], page: 1, pageSize: 20, total: 0, totalItems: 0 });
        if (path === '/api/notifications/read-all') return ok({});
        if (path.startsWith('/api/admin/finance/')) {
          if (!['admin', 'accountant'].includes(role)) return route.fulfill({ status: 403, json: { message: 'Denied' } });
          if (request.method() === 'POST') {
            const body = request.postDataJSON() || {}; writes.push({ path, body });
            if (path.endsWith('/review') && path.includes('/withdrawals/')) withdrawal.state = body.approve ? 1 : 4;
            if (path.endsWith('/order')) withdrawal.state = 2;
            if (path.endsWith('/confirm') && path.includes('/withdrawals/')) { withdrawal.state = 3; withdrawal.bankReference = body.bankReference; }
            if (path.endsWith('/refunds')) refunds.push({ id: guid(31), transactionId: body.transactionId, amount: body.amount, reason: body.reason, status: 0, approval: 1, requestedByUserId: guid(2) });
            if (path.endsWith('/review') && path.includes('/refunds/')) refunds[0].approval = body.approve ? 2 : 3;
            return ok({});
          }
          financeReads++;
          if (path.endsWith('/summary')) return ok({ paymentsReceived: '9007199254740993', refundsPaid: '0', withdrawalsPaid: '0', walletIncome: '1000', pendingWithdrawals: '1000', refundsAwaitingReview: 1 });
          if (path.endsWith('/recipients')) return ok([{ accountId: guid(20), fullName: 'Recipient', email: 'recipient@fixture.test' }]);
          if (path.endsWith('/report.csv')) return route.fulfill({ contentType: 'text/csv', body: 'Metric,VND\nPaymentsReceived,9007199254740993' });
          const items = path.endsWith('/withdrawals') ? [withdrawal] : path.endsWith('/refunds') ? refunds : path.endsWith('/payments') ? [{ id: guid(40), accountId: guid(20), fullName: 'Payer', email: 'payer@fixture.test', packageName: 'Package', amount: '9007199254740993', reservedRefund: '0', status: 1, createdAt: '2026-11-01T00:00:00Z' }] : [];
          return ok({ items, page: 1, pageSize: 30, total: items.length });
        }
        if (path.includes('/negotiate')) return ok({ negotiateVersion: 1, connectionId: 'fixture', connectionToken: 'fixture', availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text', 'Binary'] }] });
        return ok({ items: [], total: 0, totalItems: 0, page: 1, pageSize: 20 });
      });
      await page.goto(origin + (['admin', 'accountant'].includes(role) ? role === 'admin' ? '/admin/revenue' : '/accountant/finance' : `/${role}/notifications`));
      if (role === 'admin') {
        await page.getByTestId('finance-page').waitFor();
        await page.getByRole('button', { name: 'Duyệt', exact: true }).click();
        await page.getByRole('dialog').getByRole('textbox').fill('Approved with evidence');
        await page.getByRole('dialog').getByRole('button', { name: 'Duyệt yêu cầu', exact: true }).click();
        await page.getByRole('button', { name: 'Lập lệnh chi', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Lập lệnh chi rút tiền' }).click();
        await page.getByRole('button', { name: 'Xác nhận đã chuyển' }).click();
        await page.getByLabel('Ngân hàng và số tài khoản chi').fill('BANK 999'); await page.getByLabel('Mã giao dịch ngân hàng').fill('TX-123');
        await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận kết quả chuyển khoản', exact: true }).click();
        await page.getByRole('cell', { name: /Đã chuyển tiền/ }).waitFor();
        await page.getByRole('tab', { name: 'Thanh toán', exact: true }).click();
        await page.getByRole('button', { name: 'Tạo hoàn tiền' }).click();
        await page.getByLabel('Số tiền (VND)').fill('9007199254740993'); await page.getByLabel('Lý do / nội dung chứng từ').fill('Exact amount test');
        await page.getByRole('dialog').getByRole('button', { name: 'Tạo yêu cầu hoàn tiền', exact: true }).click();
        await page.getByRole('tab', { name: /^Hoàn tiền/ }).click(); await page.getByText('Cần nhân viên khác duyệt').waitFor();
        assert.equal(writes.find(w => w.path.endsWith('/refunds')).body.amount, '9007199254740993');
        await page.getByRole('button', { name: 'Ghi nhận thu nhập', exact: true }).click();
        await page.getByPlaceholder('Email hoặc tên, ít nhất 3 ký tự').fill('recipient');
        await page.getByLabel('Tài khoản được ghi có').selectOption(guid(20));
        await page.getByLabel('Số tiền (VND)').fill('1000'); await page.getByLabel('Lý do / nội dung chứng từ').fill('Project income'); await page.getByLabel('Mã chứng từ thu nhập (duy nhất)').fill('INCOME-001');
        await page.getByRole('dialog').getByRole('button', { name: 'Ghi nhận thu nhập vào ví', exact: true }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Xuất báo cáo' }).click(); assert.equal((await download).suggestedFilename(), 'bao-cao-tai-chinh.csv');
        fs.mkdirSync('dist/finance-check', { recursive: true }); await page.screenshot({ path: 'dist/finance-check/admin-desktop.png', fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: 'dist/finance-check/admin-mobile.png', fullPage: true });
        assert(writes.some(w => w.path.endsWith('/order'))); assert(writes.some(w => w.body.bankReference === 'TX-123'));
        await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(origin + '/admin/staff');
        await page.getByRole('button', { name: 'Thêm nhân viên', exact: true }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByLabel('Vai trò', { exact: true }).waitFor();
        assert.deepEqual(await dialog.getByLabel('Vai trò', { exact: true }).locator('option').evaluateAll(options => options.map(o => o.value)), ['2', '3', '4', '5']);
        await dialog.getByLabel('Vai trò', { exact: true }).selectOption('5'); await dialog.getByLabel('Họ và tên', { exact: true }).fill('Local Accountant'); await dialog.getByLabel('Email', { exact: true }).fill('accountant@fixture.test');
        await dialog.getByLabel('Mật khẩu', { exact: true }).fill('FixturePassword123'); await dialog.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('FixturePassword123');
        await dialog.getByRole('button', { name: 'Tạo nhân viên', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
        assert.equal(writes.find(w => w.path === '/api/staff/accounts').body.role, 5);
      } else if (role === 'accountant') {
        await page.getByTestId('finance-page').waitFor(); assert.equal(await page.getByRole('link', { name: 'Nhân viên', exact: true }).count(), 0);
        await page.goto(origin + '/admin/staff'); await page.waitForURL(/unauthorized|accountant/); assert.equal(await page.getByRole('button', { name: 'Thêm nhân viên' }).count(), 0);
      } else {
        assert.equal(await page.getByRole('link', { name: 'Tài chính', exact: true }).count(), 0);
        await page.goto(origin + '/accountant/finance'); await page.waitForURL(/unauthorized|notifications|projects|verifications|availability/);
        assert.equal(financeReads, 0);
      }
      assert.deepEqual(errors, []); await context.close(); console.log(role + ': OK');
    }
  } catch (error) {
    const active = browser.contexts()[0]?.pages()[0];
    fs.mkdirSync('dist/finance-check', { recursive: true });
    if (active) { await active.screenshot({ path: 'dist/finance-check/failure.png', fullPage: true }); fs.writeFileSync('dist/finance-check/failure.txt', await active.locator('body').innerText()); }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
