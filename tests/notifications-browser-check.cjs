const { chromium } = require('C:/Users/minec/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const origin = process.env.DASHBOARD_TEST_ORIGIN || 'http://127.0.0.1:5174';
const user = { id: '00000000-0000-4000-8000-000000000001', name: 'Admin Test', email: 'admin@example.test', role: 'admin', roleName: 'Quản trị viên' };
const account = { id: user.id, email: user.email, role: 6, status: 1, emailVerified: true, profileComplete: true, profile: { id: '00000000-0000-4000-8000-000000000002', fullName: user.name, displayName: user.name, nickname: 'admin' } };
const first = { id: '00000000-0000-4000-8000-000000000010', type: 'VerificationPending', category: 'verification', title: 'Có hồ sơ cần xác minh', message: 'Một hồ sơ đang chờ xét duyệt.', audience: 'Permission', targetType: 'UserVerification', targetId: '00000000-0000-4000-8000-000000000100', createdAt: '2026-10-25T00:00:00Z', readAt: null };

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    let rows = [structuredClone(first)], history = [], allowManage = true, failPreview = false, target = 'https://untrusted.example';
    let socket, reads = 0, subscriptions = 0, refreshes = 0, createdBroadcasts = 0;
    const publishedBroadcastIds = [];
    let holdReads = true;
    const heldReads = [];
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
      if (path === '/api/admin/management') return route.fulfill({ json: { permissions: [] } });
      if (path.endsWith('/unread-count')) return route.fulfill({ json: { count: rows.filter(row => !row.readAt).length } });
      if (path === '/api/notifications') {
        reads++;
        const items = rows.filter(row => (url.searchParams.get('unreadOnly') !== 'true' || !row.readAt) && (url.searchParams.get('readOnly') !== 'true' || !!row.readAt) && (!url.searchParams.get('category') || row.category === url.searchParams.get('category')));
        return route.fulfill({ json: { items, page: 1, pageSize: 20, total: items.length, unreadCount: rows.filter(row => !row.readAt).length } });
      }
      if (path.endsWith('/read-all')) { rows.forEach(row => { row.readAt = new Date().toISOString(); }); return route.fulfill({ status: 204 }); }
      if (path.endsWith('/read')) {
        if (holdReads) { heldReads.push(route); return; }
        rows.find(row => path.includes(row.id)).readAt = new Date().toISOString(); return route.fulfill({ status: 204 });
      }
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
    await page.getByRole('tab', { name: 'Đã đọc', exact: true }).click();
    await page.getByText('Chưa có thông báo đã đọc', { exact: true }).waitFor();
    await page.getByRole('tab', { name: 'Tất cả', exact: true }).click();
    await page.getByText(first.title, { exact: true }).waitFor();
    await page.getByText(first.title, { exact: true }).click();
    await page.getByRole('link', { name: 'Thông báo', exact: true }).waitFor();
    assert.equal(await page.getByTestId(`notification-unread-${first.id}`).count(), 0, 'row is read before PATCH completes');
    assert.equal(rows[0].readAt, null, 'server remains unread while PATCH is held');
    assert.equal(await page.getByRole('alert').filter({ hasText: /đã đọc|trạng thái đọc/ }).count(), 0, 'no read success message');
    for (let i = 0; i < 100 && !heldReads.length; i++) await page.waitForTimeout(10);
    assert.equal(heldReads.length, 1);
    socket.send(JSON.stringify({ type: 1, target: 'NotificationChanged', arguments: [{ reason: 'changed' }] }) + '\u001e');
    await heldReads.shift().fulfill({ status: 503, json: { message: 'Không lưu được trạng thái đọc.' } });
    await page.getByRole('alert').filter({ hasText: 'Không lưu được trạng thái đọc.' }).waitFor();
    await page.getByRole('link', { name: 'Thông báo, 1 chưa đọc', exact: true }).waitFor();
    await page.getByTestId(`notification-unread-${first.id}`).waitFor();
    await page.getByRole('button', { name: 'Đóng thông báo lỗi' }).click();
    assert.equal(page.url(), `${origin}/admin/notifications`);
    target = '/admin/projects?notificationTarget=fixture';
    await page.getByText(first.title, { exact: true }).click();
    await page.waitForURL('**/admin/projects?notificationTarget=fixture');
    await page.getByRole('link', { name: 'Thông báo', exact: true }).waitFor();
    assert.equal(rows[0].readAt, null, 'navigation does not wait for read PATCH');
    await heldReads.shift().fulfill({ status: 503, json: { message: 'Không lưu được trạng thái đọc.' } });
    await page.getByRole('alert').filter({ hasText: 'Không lưu được trạng thái đọc.' }).waitFor();
    await page.getByRole('link', { name: 'Thông báo, 1 chưa đọc', exact: true }).click();
    await page.getByText(first.title, { exact: true }).waitFor();
    await page.getByTestId(`notification-unread-${first.id}`).waitFor();
    await page.getByRole('button', { name: 'Đóng thông báo lỗi' }).click();
    holdReads = false;
    await page.getByText(first.title, { exact: true }).click();
    await page.waitForURL('**/admin/projects?notificationTarget=fixture');
    await page.getByRole('link', { name: 'Thông báo', exact: true }).waitFor();
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
    const audienceSelect = page.getByRole('combobox', { name: 'Đối tượng nhận', exact: true });
    await audienceSelect.waitFor();
    assert.deepEqual(await audienceSelect.locator('option').allTextContents(), ['Tất cả người dùng', 'Theo vai trò', 'Nhân viên']);
    await page.getByText('Gửi đến sinh viên, đối tác và người thẩm định đang hoạt động.', { exact: true }).waitFor();
    await audienceSelect.selectOption('Role');
    const roleSelect = page.getByRole('combobox', { name: 'Vai trò', exact: true });
    await roleSelect.waitFor();
    assert.deepEqual(await roleSelect.locator('option').evaluateAll(options => options.map(option => option.value)), ['Student', 'Partner', 'Assessor']);
    await roleSelect.selectOption('Assessor');
    await audienceSelect.selectOption('Staff');
    assert.equal(await roleSelect.count(), 0, 'staff audience does not offer user role selection');
    await page.getByText('Gửi đến nhân viên xác minh, nhân viên kiểm duyệt, kế toán và quản trị viên đang hoạt động.', { exact: true }).waitFor();
    await page.getByLabel('Tiêu đề', { exact: true }).fill('Thông báo bảo trì');
    await page.getByLabel('Nội dung', { exact: true }).fill('Hệ thống sẽ bảo trì vào cuối tuần.');
    await page.getByRole('button', { name: 'Lưu bản nháp và xem trước' }).click();
    await page.getByText('Dự kiến gửi đến 12 tài khoản').waitFor();
    assert.equal(history[0].audience, 'Staff');
    assert.equal(history[0].role, undefined, 'switching to staff does not submit a stale user role');
    assert.equal(history[0].recipientAccountIds, undefined);
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
    rows = [
      ['Test thông báo nhá', 'Quyền test thử', 'SystemAnnouncement', 'system', 3],
      ['Hồ sơ đối tác đã được xác minh', 'Hồ sơ đối tác của bạn đã được xác minh thành công. Bạn có thể bắt đầu đăng dự án và tuyển dụng.', 'verification.approved', 'verification', 15],
      ['Ưu đãi gói dịch vụ mới', 'Khám phá gói quảng cáo và xác minh dự án với nhiều ưu đãi hấp dẫn trong tháng này!', 'system.promotion', 'system', 45],
      ['Dự án của bạn đã được duyệt', 'Dự án “Ứng dụng quản lý học tập” đã được phê duyệt và hiển thị trên nền tảng.', 'project.approved', 'project', 1440],
      ['Có bình luận mới về bài viết của bạn', 'Nguyễn Văn An đã bình luận: “Dự án rất hay, bạn có thể chia sẻ thêm về công nghệ được không?”', 'community.comment.created', 'community', 2880],
      ['Thanh toán gói dịch vụ thành công', 'Bạn đã thanh toán gói “Quảng cáo cơ bản” trị giá 200.000đ.', 'payment.succeeded', 'system', 4320],
    ].map(([title, message, type, category, minutes], i) => ({ ...first, id: `preview-${i}`, title, message, type, category, createdAt: new Date(Date.now() - minutes * 60000).toISOString(), readAt: i < 3 ? null : new Date().toISOString() }));
    socket.send(JSON.stringify({ type: 1, target: 'NotificationChanged', arguments: [{ reason: 'created' }] }) + '\u001e');
    await page.getByTestId('notification-preview-5').waitFor();
    assert.equal(await page.locator('[data-testid^="notification-tab-count-"]').count(), 0, 'tabs display labels without counts');
    await page.getByRole('tab', { name: 'Đã đọc', exact: true }).click();
    await page.getByTestId('notification-preview-5').waitFor();
    assert.equal(await page.getByTestId('notification-preview-0').count(), 0);
    await page.getByRole('tab', { name: 'Chưa đọc', exact: true }).click();
    await page.getByTestId('notification-preview-0').waitFor();
    assert.equal(await page.getByTestId('notification-preview-5').count(), 0);
    await page.getByRole('tab', { name: 'Tất cả', exact: true }).click();
    await page.getByTestId('notification-preview-5').waitFor();
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
      await page.mouse.move(0, 0);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `dist/notifications/inbox-reference-${width}.png`, fullPage: true });
    }
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
