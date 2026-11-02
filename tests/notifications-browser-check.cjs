const { chromium } = require('C:/Users/minec/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const origin = process.env.DASHBOARD_TEST_ORIGIN || 'http://127.0.0.1:5174';
const user = { id: '00000000-0000-4000-8000-000000000001', name: 'Admin Test', email: 'admin@example.test', role: 'admin', roleName: 'Quản trị viên' };
const account = { id: user.id, email: user.email, role: 2, status: 0, emailVerified: true, profileComplete: true, profile: { id: '00000000-0000-4000-8000-000000000002', fullName: user.name, displayName: user.name, nickname: 'admin' } };
const first = { id: '00000000-0000-4000-8000-000000000010', type: 'VerificationPending', category: 'verification', title: 'Có hồ sơ cần xác minh', message: 'Một hồ sơ đang chờ xét duyệt.', audience: 'Permission', targetType: 'UserVerification', targetId: '00000000-0000-4000-8000-000000000100', createdAt: '2026-10-25T00:00:00Z', readAt: null };

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    let rows = [structuredClone(first)], history = [], allowManage = true, failPreview = false, target = 'https://untrusted.example';
    let socket, reads = 0, subscriptions = 0, refreshes = 0, createdBroadcasts = 0;
    const publishedBroadcastIds = [];
    await page.addInitScript(({ user, account }) => { localStorage.setItem('uninet_auth_user', JSON.stringify(user)); localStorage.setItem('uninet_account', JSON.stringify(account)); localStorage.setItem('accessToken', 'fixture-access-token'); localStorage.setItem('refreshToken', 'fixture-refresh-token'); localStorage.setItem('expiresAt', new Date(Date.now() + 3600000).toISOString()); }, { user, account });
    await page.routeWebSocket('**/hubs/notifications**', ws => {
      socket = ws; subscriptions++;
      ws.onMessage(message => {
        if (String(message).includes('"protocol"')) ws.send('{}\u001e');
      });
    });
    await page.route('**/api/**', route => {
      const request = route.request(), url = new URL(request.url()), path = url.pathname, method = request.method();
      if (path === '/api/auth/refresh') { refreshes++; return route.fulfill({ json: { account, accessToken: 'fixture-rotated-access', refreshToken: 'fixture-rotated-refresh', expiresAt: new Date(Date.now() + 3600000).toISOString(), requiresProfileCompletion: false } }); }
      if (request.headers().authorization === 'Bearer fixture-access-token') return route.fulfill({ status: 401, json: { message: 'Token expired' } });
      if (path.endsWith('/permissions')) return route.fulfill({ json: { canManage: allowManage } });
      if (path.endsWith('/unread-count')) return route.fulfill({ json: { count: rows.filter(row => !row.readAt).length } });
      if (path === '/api/notifications') {
        reads++;
        const items = rows.filter(row => (url.searchParams.get('unreadOnly') !== 'true' || !row.readAt) && (!url.searchParams.get('category') || row.category === url.searchParams.get('category')));
        return route.fulfill({ json: { items, page: 1, pageSize: 20, total: items.length, unreadCount: rows.filter(row => !row.readAt).length } });
      }
      if (path.endsWith('/read-all')) { rows.forEach(row => { row.readAt = new Date().toISOString(); }); return route.fulfill({ status: 204 }); }
      if (path.endsWith('/read')) { rows.find(row => path.includes(row.id)).readAt = new Date().toISOString(); return route.fulfill({ status: 204 }); }
      if (path.endsWith('/target')) return route.fulfill({ json: { targetUrl: target } });
      if (path === '/api/admin/notification-broadcasts' && method === 'GET') return route.fulfill({ json: history });
      if (path === '/api/admin/notification-broadcasts' && method === 'POST') { createdBroadcasts++; const input = request.postDataJSON(); const draft = { ...input, id: '00000000-0000-4000-8000-000000000020', status: 'Draft', recipientCount: 0, processedCount: 0, createdAt: new Date().toISOString() }; history = [draft]; return route.fulfill({ json: draft }); }
      if (path.endsWith('/preview')) return failPreview ? route.fulfill({ status: 503, json: { message: 'Không tải được danh sách người nhận.' } }) : route.fulfill({ json: { recipientCount: 12 } });
      if (path.endsWith('/publish')) { publishedBroadcastIds.push(path.split('/').at(-2)); history[0].status = 'Queued'; history[0].recipientCount = 12; return route.fulfill({ status: 202, json: history[0] }); }
      if (path.endsWith('/cancel')) { history[0].status = 'Cancelled'; return route.fulfill({ json: history[0] }); }
      return route.fulfill({ json: [] });
    });
    await page.route('**/hubs/notifications/negotiate*', route => route.fulfill({ json: { negotiateVersion: 1, connectionId: 'fixture', connectionToken: 'fixture', availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text', 'Binary'] }] } }));
    await page.goto(`${origin}/admin/projects`);
    assert.equal(await page.getByRole('link', { name: 'Thông báo của tôi', exact: true }).count(), 0, 'sidebar does not duplicate the header bell');
    await page.getByRole('link', { name: 'Thông báo, 1 chưa đọc', exact: true }).waitFor({ timeout: 5000 });
    assert.equal(refreshes, 1, 'concurrent inbox/count/permission 401 responses share one refresh');
    assert.equal(await page.evaluate(() => localStorage.getItem('refreshToken') === 'fixture-rotated-refresh'), true, 'refresh rotation is persisted');
    await page.getByRole('link', { name: 'Thông báo, 1 chưa đọc', exact: true }).click();
    await page.waitForURL('**/admin/notifications');
    await page.getByRole('heading', { name: 'Thông báo của bạn' }).waitFor();
    assert.equal(await page.getByRole('dialog', { name: 'Thông báo gần đây' }).count(), 0, 'header bell opens a page directly');
    await page.getByRole('combobox', { name: /Loại thông báo/ }).selectOption('recruitment');
    await page.getByText('Chưa có thông báo trong mục này.').waitFor();
    await page.getByRole('combobox', { name: /Loại thông báo/ }).selectOption('verification');
    await page.getByText(first.title, { exact: true }).waitFor();
    await page.getByText(first.title, { exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'chưa có màn hình phù hợp' }).waitFor();
    assert.equal(page.url(), `${origin}/admin/notifications`);
    target = '/admin/projects?notificationTarget=fixture';
    await page.getByText(first.title, { exact: true }).click();
    await page.waitForURL('**/admin/projects?notificationTarget=fixture');
    const before = reads;
    rows.push({ ...first, id: '00000000-0000-4000-8000-000000000011', title: 'Thông báo realtime', readAt: null });
    assert.ok(socket && subscriptions > 0, 'authenticated SignalR connection negotiated');
    socket.send(JSON.stringify({ type: 1, target: 'NotificationChanged', arguments: [{ reason: 'created' }] }) + '\u001e');
    await page.getByRole('link', { name: 'Thông báo, 1 chưa đọc', exact: true }).click();
    await page.waitForURL('**/admin/notifications');
    await page.getByText('Thông báo realtime', { exact: true }).waitFor();
    assert.ok(reads > before, 'SignalR event refetches API source of truth');
    rows.push({ ...first, id: '00000000-0000-4000-8000-000000000012', title: 'Cập nhật khi kết nối lại', readAt: null });
    socket.close({ code: 1001, reason: 'fixture reconnect' });
    await page.getByRole('link', { name: 'Thông báo, 2 chưa đọc', exact: true }).waitFor();
    assert.ok(subscriptions >= 2, 'reconnect negotiates a fresh authenticated connection');
    await page.getByRole('link', { name: 'Thông báo, 2 chưa đọc', exact: true }).click();
    await page.getByText('Cập nhật khi kết nối lại', { exact: true }).waitFor();
    await page.goto(`${origin}/admin/notification-broadcasts`);
    await page.getByLabel('Tiêu đề', { exact: true }).fill('Thông báo bảo trì');
    await page.getByLabel('Nội dung', { exact: true }).fill('Hệ thống sẽ bảo trì vào cuối tuần.');
    await page.getByRole('button', { name: 'Lưu bản nháp và xem trước' }).click();
    await page.getByText('Dự kiến gửi đến 12 tài khoản').waitFor();
    await page.reload();
    await page.getByText('Bản nháp', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Xem trước bản nháp', exact: true }).count(), 1, 'saved draft remains publishable after reload');
    await page.getByRole('button', { name: 'Xem trước bản nháp', exact: true }).click();
    await page.getByText('Dự kiến gửi đến 12 tài khoản').waitFor();
    assert.equal(publishedBroadcastIds.length, 0, 'reopening a draft only previews recipients');
    await page.getByRole('button', { name: 'Xác nhận phát hành' }).click();
    await page.getByText('Đang chờ gửi', { exact: true }).waitFor();
    history[0].status = 'Failed';
    history[0].processedCount = 3;
    await page.getByRole('button', { name: 'Làm mới lịch sử' }).click();
    await page.getByText('Gửi thất bại', { exact: true }).waitFor();
    failPreview = true;
    await page.getByRole('button', { name: 'Xem trước và thử gửi lại', exact: true }).click();
    await page.getByRole('alert').getByText('Không tải được danh sách người nhận.', { exact: false }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Xác nhận phát hành' }).count(), 0, 'failed preview cannot publish stale recipient data');
    failPreview = false;
    await page.getByRole('button', { name: 'Xem trước và thử gửi lại', exact: true }).click();
    await page.getByText('Dự kiến gửi đến 12 tài khoản').waitFor();
    const retryPreview = page.getByRole('region', { name: 'Xem trước thông báo' });
    await retryPreview.getByText('Đã gửi 3 tài khoản; lần thử lại chỉ tiếp tục phần chưa nhận.').waitFor();
    assert.equal(await retryPreview.evaluate(el => el === document.activeElement), true, 'keyboard focus moves to the confirmation preview');
    await page.setViewportSize({ width: 320, height: 960 });
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
    await page.screenshot({ path: 'dist/notifications/retry-preview-mobile.png' });
    await page.setViewportSize({ width: 1440, height: 960 });
    assert.equal(publishedBroadcastIds.length, 1, 'retry still requires separate publish confirmation');
    await page.getByRole('button', { name: 'Xác nhận phát hành' }).click();
    await page.getByText('Đang chờ gửi', { exact: true }).waitFor();
    assert.equal(createdBroadcasts, 1, 'recovery reuses the persisted broadcast');
    assert.deepEqual(publishedBroadcastIds, [history[0].id, history[0].id]);
    await page.getByRole('button', { name: 'Hủy phần chưa gửi' }).click();
    await page.getByText('Đã hủy', { exact: true }).waitFor();
    await page.screenshot({ path: 'dist/notifications/broadcast-desktop.png' });
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
      const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].map(el => ({ tag: el.tagName, text: el.textContent?.slice(0, 60), x: el.getBoundingClientRect().x, right: el.getBoundingClientRect().right, width: el.getBoundingClientRect().width })).filter(el => el.right > innerWidth + 1));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `no horizontal overflow at ${width}px: ${JSON.stringify(overflow.slice(-8))}`);
    }
    await page.getByRole('link', { name: /^Thông báo(?:,|$)/ }).click();
    await page.waitForURL('**/admin/notifications');
    await page.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }).click();
    await page.getByRole('link', { name: 'Thông báo', exact: true }).waitFor();
    allowManage = false;
    await page.goto(`${origin}/admin/notification-broadcasts`);
    await page.getByText('Bạn chưa được cấp quyền quản lý thông báo hoặc quyền đang được kiểm tra.').waitFor();
    assert.equal(await page.getByLabel('Tiêu đề', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).first().click();
    await page.waitForURL('**/login');
    assert.equal(await page.getByRole('link', { name: /^Thông báo/ }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('Dashboard notifications: inbox, realtime, saved drafts, failed broadcast recovery, preview errors, explicit confirmation, responsive layouts, permissions and logout passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
