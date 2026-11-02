const { chromium } = require('C:/Users/minec/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const origin = process.env.DASHBOARD_TEST_ORIGIN || 'http://127.0.0.1:5174';
const guid = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const admin = { id: guid(1), name: 'Admin Fixture', email: 'admin@fixture.test', role: 'admin', roleName: 'Quản trị viên' };
const account = { id: admin.id, email: admin.email, role: 2, status: 1, profileComplete: true, profile: { id: guid(2), fullName: admin.name, nickname: 'admin', displayName: admin.name } };
const allPermissions = ['users.view', 'users.detail', 'users.lock', 'users.unlock', 'staff.manage', 'permissions.manage', 'verification.student.review', 'verification.partner.review', 'notifications.manage'];

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const skills = Array.from({ length: 23 }, (_, index) => ({ id: guid(1000 + index), name: 'DB Skill ' + index, category: index % 4, isActive: index !== 0, studentCount: index + 1, iconUrl: index === 0 ? origin + '/skill-fixture.png' : index === 2 ? origin + '/skill-missing.png' : null }));
    await page.route('**/skill-fixture.png', route => route.fulfill({ contentType: 'image/png', body: fs.readFileSync('../UniNet_BE/UniNet.Tests/Fixtures/portrait-sample.png') }));
    await page.route('**/skill-missing.png', route => route.fulfill({ status: 404 }));
    let skillsUnavailable = false;
    let iconUploads = 0, backgroundsRemoved = 0;
    let releaseBackground, backgroundStarted, backgroundFailure = true;
    const cloudIcon = 'https://res.cloudinary.com/fixture/image/upload/v1/uninet/skills/icon.png';
    await page.route('https://res.cloudinary.com/fixture/image/upload/**', route => route.fulfill({ contentType: 'image/png', body: fs.readFileSync('../UniNet_BE/UniNet.Tests/Fixtures/portrait-sample.png') }));
    let permissions = [...allPermissions], permissionEdits = [], documentsRead = 0, studentListReads = 0, managementUnavailable = true;
    const users = Array.from({ length: 22 }, (_, index) => ({ id: guid(100 + index), profileId: guid(300 + index), fullName: 'Sinh viên ' + index, nickname: 'student' + index, email: `student${index}@fixture.test`, avatarUrl: null, role: 0, status: 1, createdAt: '2026-10-25T00:00:00Z', isVerified: false, verificationStatus: index === 0 ? 0 : null }));
    const partner = { ...users[0], id: guid(200), profileId: guid(400), fullName: 'Trung tâm UniNet', email: 'partner@fixture.test', role: 1 };
    const staff = { ...users[0], id: guid(201), profileId: guid(401), fullName: 'Nhân viên xác minh', email: 'staff@fixture.test', role: 4, verificationStatus: null };
    users.push(partner, staff, { ...staff, id: admin.id, role: 2, fullName: admin.name, email: admin.email });
    const changes = [];
    const applications = [
      { id: guid(501), userId: users[0].profileId, accountId: users[0].id, email: users[0].email, fullName: users[0].fullName, avatarUrl: null, phone: null, organizationName: null, partnerType: null, schoolName: 'FPT University', studentCode: 'SE123456', status: 0, submittedAt: '2026-10-25T00:00:00Z', reviewedAt: null, reviewedBy: null, reviewerName: null, kind: 'student' },
      { id: guid(502), userId: partner.profileId, accountId: partner.id, email: partner.email, fullName: partner.fullName, avatarUrl: null, phone: '0900000000', organizationName: partner.fullName, partnerType: 3, schoolName: null, studentCode: null, status: 0, submittedAt: '2026-10-25T01:00:00Z', reviewedAt: null, reviewedBy: null, reviewerName: null, kind: 'partner' },
    ];
    const history = item => ({ id: item.id, type: item.kind === 'student' ? 0 : 1, status: item.status, submittedAt: item.submittedAt, reviewedAt: item.reviewedAt, reason: item.reason || null, reviewedBy: item.reviewedBy, reviewerName: item.reviewerName });
    const profile = { coverUrl: null, bio: 'Hồ sơ thực tế trong kiểm thử.', phone: '0900000000', universityName: 'FPT University', major: 'Software Engineering', studentCode: 'SE123456', organizationName: null, partnerType: null, industry: null, website: null, contactEmail: null, address: null };
    await page.addInitScript(({ admin, account }) => { if (localStorage.getItem('management-fixture-initialized')) return; localStorage.setItem('management-fixture-initialized', 'true'); localStorage.setItem('uninet_auth_user', JSON.stringify(admin)); localStorage.setItem('uninet_account', JSON.stringify(account)); localStorage.setItem('accessToken', 'management-fixture-token'); localStorage.setItem('refreshToken', 'management-refresh'); localStorage.setItem('expiresAt', new Date(Date.now() + 3600000).toISOString()); }, { admin, account });
    await page.routeWebSocket('**/hubs/notifications**', socket => socket.onMessage(value => { if (String(value).includes('"protocol"')) socket.send('{}\x1e'); }));
    await page.route('**/hubs/notifications/negotiate*', route => route.fulfill({ json: { negotiateVersion: 1, connectionId: 'fixture', connectionToken: 'fixture', availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text', 'Binary'] }] } }));
    await page.route('**/api/**', async route => {
      const request = route.request(), url = new URL(request.url()), path = url.pathname, method = request.method();
      const ok = json => route.fulfill({ json }), denied = () => route.fulfill({ status: 403, json: { message: 'Bạn không có quyền thực hiện thao tác này.' } });
      if (path === '/api/admin/skills/icons/preview') {
        assert.match(request.headers()['content-type'], /^multipart\/form-data; boundary=/);
        return route.fulfill({ contentType: 'image/png', body: fs.readFileSync('../UniNet_BE/UniNet.Tests/Fixtures/portrait-sample.png') });
      }
      if (path === '/api/admin/skills/icons' || path === '/api/admin/skills/icons/remove-background') {
        assert.match(request.headers()['content-type'], /^multipart\/form-data; boundary=/);
        if (path.endsWith('remove-background')) {
          backgroundsRemoved++; await new Promise(resolve => { releaseBackground = resolve; backgroundStarted?.(); });
          if (backgroundFailure) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Dịch vụ xóa nền chưa sẵn sàng. Bạn có thể lưu ảnh gốc.' }) });
          return route.fulfill({ contentType: 'image/png', body: fs.readFileSync('../UniNet_BE/UniNet.Tests/Fixtures/portrait-sample.png') });
        }
        iconUploads++; return ok({ imageUrl: cloudIcon });
      }
      if (path === '/api/admin/skills' || path.startsWith('/api/admin/skills/')) {
        if (skillsUnavailable) return route.fulfill({ status: 503, json: { message: 'Không tải được danh mục kỹ năng.' } });
        if (method === 'POST' || method === 'PUT') {
          const input = request.postDataJSON(), existing = method === 'PUT' ? skills.find(s => path.endsWith('/' + s.id)) : null;
          if (skills.some(s => s.id !== existing?.id && s.name.toLowerCase() === input.name.toLowerCase())) return route.fulfill({ status: 409, json: { message: 'Tên kỹ năng đã tồn tại.' } });
          if (existing) Object.assign(existing, input); else skills.push({ ...input, id: guid(2000), studentCount: 0 });
          return ok(existing || skills.at(-1));
        }
        const p = url.searchParams, rows = skills.filter(s => (!p.get('search') || s.name.toLowerCase().includes(p.get('search').toLowerCase())) && (!p.get('category') || s.category === Number(p.get('category'))) && (!p.get('isActive') || s.isActive === (p.get('isActive') === 'true')));
        const pageNumber = Number(p.get('page') || 1), size = Number(p.get('pageSize') || 20);
        rows.sort((a, b) => p.get('sort') === 'popular' ? b.studentCount - a.studentCount || a.name.localeCompare(b.name) : a.name.localeCompare(b.name));
        return ok({ items: rows.slice((pageNumber - 1) * size, pageNumber * size), total: rows.length, page: pageNumber, pageSize: size });
      }
      if (path === '/api/admin/management') return managementUnavailable ? route.fulfill({ status: 404 }) : ok({ permissions, pendingStudents: applications.filter(a => a.kind === 'student' && a.status === 0).length, pendingPartners: applications.filter(a => a.kind === 'partner' && a.status === 0).length });
      if (path.endsWith('/notification-broadcasts/permissions')) return ok({ canManage: permissions.includes('notifications.manage') });
      if (path === '/api/notifications') return ok({ items: [], page: 1, pageSize: 5, total: 0, unreadCount: 0 });
      if (path.endsWith('/unread-count')) return ok({ count: 0 });
      if (path === '/api/admin/users/stats') { const customers = users.filter(u => u.role <= 1); return ok({ total: customers.length, active: customers.filter(u => u.status === 1).length, locked: customers.filter(u => u.status === 2).length, verified: customers.filter(u => u.isVerified).length }); }
      if (path === '/api/admin/users') {
        if (!permissions.includes('users.view')) return denied();
        let rows = users.filter(u => (!url.searchParams.get('search') || [u.fullName, u.email, u.id].some(value => value.toLowerCase().includes(url.searchParams.get('search').toLowerCase()))) && (!url.searchParams.get('role') || u.role === Number(url.searchParams.get('role'))) && (!url.searchParams.get('status') || u.status === Number(url.searchParams.get('status'))) && (url.searchParams.get('staffOnly') === 'true' ? u.role >= 2 : u.role <= 1));
        const pageNumber = Number(url.searchParams.get('page') || 1), pageSize = Number(url.searchParams.get('pageSize') || 20);
        return ok({ items: rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), page: pageNumber, pageSize, total: rows.length });
      }
      const userPath = path.match(/^\/api\/admin\/users\/([^/]+)(?:\/(lock|unlock))?$/);
      if (userPath) {
        const user = users.find(u => u.id === userPath[1]); if (!user) return route.fulfill({ status: 404 });
        if (method === 'POST') {
          if (!permissions.includes(userPath[2] === 'lock' ? 'users.lock' : 'users.unlock')) return denied();
          const previousStatus = user.status; user.status = userPath[2] === 'lock' ? 2 : 1;
          changes.push({ id: guid(700 + changes.length), previousStatus, status: user.status, reason: request.postDataJSON().reason, actorAccountId: admin.id, actorName: admin.name, accountId: user.id, createdAt: new Date().toISOString() }); return ok(user);
        }
        return ok({ account: user, profile, verifications: applications.filter(a => a.accountId === user.id).map(history), statusHistory: changes.filter(c => c.accountId === user.id) });
      }
      const permissionPath = path.match(/^\/api\/admin\/permissions\/([^/]+)$/);
      if (permissionPath) {
        if (method === 'PUT') { permissionEdits = request.postDataJSON(); return route.fulfill({ status: 204 }); }
        return ok(allPermissions.map(permission => ({ permission, granted: false, override: null })));
      }
      if (path === '/api/staff/accounts') { const input = request.postDataJSON(); users.push({ ...staff, id: guid(900), fullName: input.fullName, email: input.email, role: input.role }); return route.fulfill({ status: 201, json: {} }); }
      const verificationPath = path.match(/^\/api\/admin\/(student|partner)-verifications(?:\/([^/]+))?(?:\/(approve|reject))?$/);
      if (verificationPath) {
        const [, kind, id, action] = verificationPath;
        if (!permissions.includes(kind === 'student' ? 'verification.student.review' : 'verification.partner.review')) return denied();
        const rows = applications.filter(a => a.kind === kind);
        if (id === 'stats') return ok({ total: rows.length, pending: rows.filter(a => a.status === 0).length, approved: rows.filter(a => a.status === 1).length, rejected: rows.filter(a => a.status === 2).length, cancelled: 0 });
        if (!id) { if (kind === 'student') studentListReads++; const filtered = rows.filter(a => !url.searchParams.get('status') || a.status === Number(url.searchParams.get('status'))); return ok({ items: filtered, totalItems: filtered.length, page: 1, pageSize: 20 }); }
        const item = rows.find(a => a.id === id);
        if (!item) return route.fulfill({ status: 404 });
        if (action) {
          if (item.status !== 0) return route.fulfill({ status: 409, json: { message: 'Hồ sơ đã được xử lý. Vui lòng tải lại.' } });
          item.status = action === 'approve' ? 1 : 2; item.reviewedBy = admin.id; item.reviewerName = admin.name; item.reviewedAt = new Date().toISOString(); item.reason = action === 'reject' ? request.postDataJSON().reason : null;
          users.find(u => u.id === item.accountId).isVerified = item.status === 1; return ok({ status: item.status });
        }
        return ok({ application: item, profile, submittedData: kind === 'student' ? { fullName: item.fullName, schoolName: item.schoolName, studentCode: item.studentCode } : { representativeName: 'Nguyễn Đại Diện', organizationName: partner.fullName, phone: item.phone }, documents: [{ index: 0, fileName: 'student-card.png', contentType: 'image/png', uploaded: true }], history: [history(item)], rejectReason: item.reason || null, isVerified: users.find(u => u.id === item.accountId).isVerified });
      }
      if (path.includes('/document')) { assert.equal(request.headers().authorization, 'Bearer management-fixture-token'); documentsRead++; return route.fulfill({ contentType: 'image/png', body: fs.readFileSync('../UniNet_BE/UniNet.Tests/Fixtures/portrait-sample.png') }); }
      return ok([]);
    });

    await page.goto(origin + '/admin/revenue');
    await page.getByRole('alert').filter({ hasText: 'Backend chưa cung cấp API quản lý' }).waitFor();
    await page.getByRole('link', { name: 'Người dùng', exact: true }).waitFor();
    await page.getByRole('link', { name: /^Xác minh sinh viên/ }).waitFor();
    await page.getByRole('link', { name: /^Xác minh đối tác/ }).waitFor();
    await page.getByRole('link', { name: 'Người dùng', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Backend chưa cung cấp API quản lý' }).first().waitFor();
    assert.equal(await page.getByTestId('user-' + users[0].id).count(), 0, 'visible navigation never bypasses permission loading');
    managementUnavailable = false;
    await page.getByRole('button', { name: 'Thử tải lại quyền', exact: true }).click();
    await page.getByRole('link', { name: 'Người dùng', exact: true }).waitFor();
    assert.equal(await page.getByRole('alert').filter({ hasText: 'Backend chưa cung cấp API quản lý' }).count(), 0);
    await page.goto(origin + '/admin/users');
    await page.getByRole('heading', { name: 'Quản lý người dùng', exact: true }).waitFor();
    await page.getByTestId('user-' + users[0].id).waitFor();
    assert.deepEqual(await page.getByRole('combobox', { name: 'Loại tài khoản' }).locator('option').allTextContents(), ['Tất cả vai trò', 'Sinh viên', 'Đối tác']);
    assert.equal(await page.getByTestId('user-' + admin.id).count(), 0);
    assert.equal(await page.getByTestId('user-' + staff.id).count(), 0);
    await page.screenshot({ path: 'dist/admin-management/users-desktop.png' });
    assert.equal(await page.getByRole('link', { name: 'Thông báo của tôi', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Sau', exact: true }).click();
    await page.getByTestId('user-' + partner.id).waitFor();
    assert.equal(await page.getByTestId('user-' + admin.id).count(), 0);
    assert.equal(await page.getByTestId('user-' + staff.id).count(), 0);
    await page.getByRole('textbox', { name: 'Tìm người dùng' }).fill('student0@');
    const studentRow = page.getByTestId('user-' + users[0].id); await studentRow.waitFor();
    await studentRow.getByRole('button', { name: 'Khóa', exact: true }).click();
    let dialog = page.getByRole('dialog', { name: 'Khóa tài khoản', exact: true });
    assert.equal(await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).isDisabled(), true);
    await dialog.getByLabel('Lý do', { exact: true }).fill('Vi phạm nội quy cộng đồng');
    await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await studentRow.getByText('Đã khóa', { exact: true }).waitFor();
    await studentRow.getByRole('button', { name: 'Mở khóa', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Mở khóa tài khoản', exact: true });
    await dialog.getByLabel('Lý do', { exact: true }).fill('Đã xác minh lại'); await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await studentRow.getByText('Đang hoạt động', { exact: true }).waitFor();
    await studentRow.getByRole('link', { name: 'Chi tiết', exact: true }).click();
    await page.getByText('Vi phạm nội quy cộng đồng', { exact: true }).waitFor();
    await page.getByText('Đã xác minh lại', { exact: true }).waitFor();

    await page.getByRole('link', { name: /^Xác minh sinh viên/ }).click();
    await page.getByRole('link', { name: 'Xem hồ sơ', exact: true }).click();
    await page.getByText('SE123456', { exact: true }).waitFor();
    await page.screenshot({ path: 'dist/admin-management/student-review-desktop.png' });
    await page.getByRole('img', { name: 'Giấy tờ: student-card.png', exact: true }).waitFor();
    await page.waitForFunction(() => [...document.images].some(img => img.alt === 'Giấy tờ: student-card.png' && img.complete && img.naturalWidth > 0));
    await page.getByRole('button', { name: 'Phóng to tài liệu 1', exact: true }).click();
    await page.getByRole('dialog').getByRole('img', { name: 'Giấy tờ: student-card.png' }).waitFor();
    assert.ok(await page.getByRole('dialog').evaluate(el => el.getBoundingClientRect().width > innerWidth * 0.9), 'document viewer fills the viewport width');
    assert.ok(await page.getByRole('dialog').getByRole('img').evaluate(el => el.getBoundingClientRect().height > innerHeight * 0.7), 'expanded image has a large viewing area');
    assert.equal(documentsRead, 1); await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click();
    await page.getByRole('button', { name: 'Duyệt hồ sơ', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await page.getByText('Đã duyệt hồ sơ và gửi thông báo kết quả.', { exact: true }).waitFor();
    assert.equal(applications[0].status, 1); assert.equal(users[0].isVerified, true);

    await page.getByRole('link', { name: /^Xác minh đối tác/ }).click();
    await page.getByRole('link', { name: 'Xem hồ sơ', exact: true }).click();
    await page.getByText('Trung tâm đào tạo', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Từ chối hồ sơ', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Từ chối hồ sơ', exact: true });
    await dialog.getByLabel('Lý do từ chối', { exact: true }).fill('Tài liệu chưa rõ, vui lòng gửi lại');
    await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await page.getByText('Đã từ chối hồ sơ và gửi lý do cho chủ tài khoản.', { exact: true }).waitFor();
    assert.equal(partner.isVerified, false); assert.equal(applications[1].status, 2); assert.equal(users.length, 25, 'review reuses the existing partner account');

    await page.goto(origin + '/admin/staff');
    const staffRow = page.getByTestId('user-' + staff.id); await staffRow.getByRole('button', { name: 'Phân quyền', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Phân quyền: ' + staff.fullName });
    await dialog.getByRole('checkbox', { name: 'Xem người dùng', exact: true }).check();
    await dialog.getByRole('button', { name: 'Lưu phân quyền' }).click();
    await page.getByText('Đã lưu phân quyền nhân viên.', { exact: true }).waitFor();
    assert.deepEqual(permissionEdits, [{ permission: 'users.view', granted: true }]);
    await page.getByRole('button', { name: 'Thêm nhân viên', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Thêm nhân viên mới', exact: true });
    await dialog.getByLabel('Họ và tên', { exact: true }).fill('Nhân viên mới'); await dialog.getByLabel('Email', { exact: true }).fill('new-staff@fixture.test');
    await dialog.getByLabel('Mật khẩu', { exact: true }).fill('FixturePassword123'); await dialog.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('FixturePassword123');
    await dialog.getByRole('button', { name: 'Tạo nhân viên', exact: true }).click(); await page.getByText('Đã tạo tài khoản nhân viên.', { exact: true }).waitFor();
    await page.getByText('new-staff@fixture.test', { exact: true }).waitFor();
    await page.screenshot({ path: 'dist/admin-management/staff-desktop.png' });

    for (const path of ['/admin/users', '/admin/student-verifications', '/admin/partner-verifications/' + applications[1].id]) {
      await page.goto(origin + path); await page.getByRole('heading', { level: 1 }).waitFor();
      for (const width of [320, 768, 1440]) { await page.setViewportSize({ width, height: 1000 }); await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth); await page.screenshot({ path: 'dist/admin-management/' + path.replaceAll('/', '-') + '-' + width + '.png' }); }
    }
    await page.goto(origin + '/admin/users'); await page.getByRole('heading', { name: 'Quản lý người dùng' }).waitFor();
    await page.getByRole('button', { name: 'Mở thanh điều hướng', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('aside').getBoundingClientRect().width === 5 * parseFloat(getComputedStyle(document.documentElement).fontSize));
    await page.getByRole('button', { name: 'Mở thanh điều hướng', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('aside').getBoundingClientRect().width === 16 * parseFloat(getComputedStyle(document.documentElement).fontSize));
    await page.goto(origin + '/admin/skills');
    await page.getByTestId('skill-' + skills[22].id).waitFor();
    await page.getByRole('combobox', { name: 'Sắp xếp theo' }).selectOption('name');
    await page.getByTestId('skill-' + skills[0].id).waitFor();
    await page.getByRole('img', { name: 'Icon DB Skill 0', exact: true }).waitFor();
    await page.waitForFunction(() => [...document.images].some(img => img.alt === 'Icon DB Skill 0' && img.complete && img.naturalWidth > 0));
    await page.getByLabel('Icon mặc định DB Skill 1', { exact: true }).waitFor();
    await page.screenshot({ path: 'dist/admin-management/skills-grid-desktop.png' });
    await page.getByRole('combobox', { name: 'Số kỹ năng mỗi trang' }).selectOption('24');
    await page.getByTestId('skill-' + skills[22].id).waitFor();
    await page.getByRole('combobox', { name: 'Số kỹ năng mỗi trang' }).selectOption('12');
    await page.getByTestId('skill-' + skills[0].id).waitFor();
    await page.getByRole('button', { name: 'Sau', exact: true }).click();
    await page.getByTestId('skill-' + skills[22].id).waitFor();
    await page.getByLabel('Icon mặc định DB Skill 2', { exact: true }).waitFor();
    await page.getByRole('textbox', { name: 'Tìm kiếm kỹ năng' }).fill('DB Skill 0');
    await page.getByTestId('skill-' + skills[0].id).waitFor();
    await page.getByRole('textbox', { name: 'Tìm kiếm kỹ năng' }).fill('');
    await page.getByRole('combobox', { name: 'Nhóm kỹ năng' }).selectOption('1');
    await page.getByTestId('skill-' + skills[1].id).waitFor();
    assert.equal(await page.getByTestId('skill-' + skills[0].id).count(), 0);
    await page.getByRole('combobox', { name: 'Nhóm kỹ năng' }).selectOption('');
    await page.getByRole('button', { name: 'Thêm kỹ năng mới', exact: true }).click();
    let skillDialog = page.getByRole('dialog');
    assert.equal(await skillDialog.getByRole('button', { name: 'Xóa nền', exact: true }).isDisabled(), true);
    await skillDialog.getByLabel('Chọn ảnh icon', { exact: true }).setInputFiles('../UniNet_BE/UniNet.Tests/Fixtures/portrait-sample.png');
    await skillDialog.getByRole('img', { name: 'Xem trước icon kỹ năng' }).waitFor();
    await page.waitForFunction(() => { const button = [...document.querySelectorAll('button')].find(el => el.textContent.trim() === 'Xóa nền'); return button && !button.matches(':disabled'); });
    const originalPreview = await skillDialog.getByRole('img', { name: 'Xem trước icon kỹ năng' }).getAttribute('src');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    let processingStarted = new Promise(resolve => { backgroundStarted = resolve; });
    await skillDialog.getByRole('button', { name: 'Xóa nền', exact: true }).click();
    await processingStarted;
    await page.getByTestId('icon-background-scan').waitFor();
    const scan = page.getByTestId('icon-background-scan').locator('span');
    assert.equal(await scan.evaluate(el => getComputedStyle(el).animationName), 'skill-icon-scan');
    const transform = await scan.evaluate(el => getComputedStyle(el).transform);
    await page.waitForFunction(previous => getComputedStyle(document.querySelector('.skill-icon-scan-line')).transform !== previous, transform);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await scan.evaluate(el => getComputedStyle(el).animationName), 'none');
    releaseBackground();
    await skillDialog.getByRole('alert').getByText('Dịch vụ xóa nền chưa sẵn sàng. Bạn có thể lưu ảnh gốc.', { exact: true }).waitFor();
    assert.equal(await page.getByTestId('icon-background-scan').count(), 0);
    assert.equal(await skillDialog.getByRole('img', { name: 'Xem trước icon kỹ năng' }).getAttribute('src'), originalPreview);
    backgroundFailure = false;
    processingStarted = new Promise(resolve => { backgroundStarted = resolve; });
    await skillDialog.getByRole('button', { name: 'Xóa nền', exact: true }).click();
    await processingStarted;
    await page.getByTestId('icon-background-scan').waitFor();
    releaseBackground();
    await skillDialog.getByRole('button', { name: 'Dùng ảnh gốc', exact: true }).waitFor();
    assert.equal(await page.getByTestId('icon-background-scan').count(), 0);
    await page.screenshot({ path: 'dist/admin-management/skill-icon-form.png' });
    await page.setViewportSize({ width: 320, height: 1000 });
    await page.waitForFunction(() => { const dialog = document.querySelector('dialog[open]'); return dialog.scrollWidth <= dialog.clientWidth && document.documentElement.scrollWidth <= innerWidth; });
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(backgroundsRemoved, 2); assert.equal(iconUploads, 0, 'preview processing does not upload to Cloudinary');
    await skillDialog.getByLabel('Tên kỹ năng', { exact: true }).fill('DB Skill 0');
    await skillDialog.getByRole('button', { name: 'Lưu kỹ năng' }).click();
    await skillDialog.getByRole('alert').getByText('Tên kỹ năng đã tồn tại.', { exact: true }).waitFor();
    await skillDialog.getByLabel('Tên kỹ năng', { exact: true }).fill('Kỹ năng mới từ API');
    await skillDialog.getByRole('button', { name: 'Lưu kỹ năng' }).click();
    await page.getByText('Đã thêm kỹ năng.', { exact: true }).waitFor();
    assert.equal(iconUploads, 1, 'retry after duplicate name reuses the uploaded image');
    assert.equal(skills.find(s => s.id === guid(2000)).iconUrl, cloudIcon);
    await page.getByRole('textbox', { name: 'Tìm kiếm kỹ năng' }).fill('Kỹ năng mới từ API');
    const skillCard = page.getByTestId('skill-' + guid(2000)); await skillCard.waitFor();
    await skillCard.getByText('0 sinh viên', { exact: true }).waitFor();
    await skillCard.getByRole('button', { name: 'Chỉnh sửa' }).click();
    skillDialog = page.getByRole('dialog');
    await skillDialog.getByLabel('Đang sử dụng', { exact: true }).uncheck();
    await skillDialog.getByRole('button', { name: 'Lưu kỹ năng' }).click();
    await skillCard.getByText('Ngừng sử dụng', { exact: true }).waitFor();
    for (const width of [320, 768, 1440]) { await page.setViewportSize({ width, height: 1000 }); await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth); }
    await page.screenshot({ path: 'dist/admin-management/skills-desktop.png' });
    skillsUnavailable = true;
    await page.getByRole('button', { name: 'Làm mới kỹ năng' }).click();
    await page.getByRole('alert').filter({ hasText: 'Không tải được danh mục kỹ năng.' }).waitFor();
    skillsUnavailable = false;
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await skillCard.waitFor();
    await page.getByRole('textbox', { name: 'Tìm kiếm kỹ năng' }).fill('không tồn tại');
    await page.getByText('Không tìm thấy kỹ năng phù hợp.', { exact: true }).waitFor();
    const readsBefore = studentListReads;
    permissions = permissions.filter(p => p !== 'verification.student.review');
    await page.goto(origin + '/admin/student-verifications');
    await page.getByText('Bạn không có quyền truy cập chức năng này.', { exact: true }).waitFor();
    assert.equal(studentListReads, readsBefore, 'denied page never fetches protected list');
    assert.equal(await page.getByRole('link', { name: /^Xác minh sinh viên/ }).count(), 0);
    permissions = ['users.view'];
    await page.evaluate(({ staff }) => {
      localStorage.setItem('uninet_auth_user', JSON.stringify({ id: staff.id, name: staff.fullName, email: staff.email, role: 'verificator', roleName: 'Xác minh viên' }));
      localStorage.setItem('uninet_account', JSON.stringify({ id: staff.id, email: staff.email, role: 4, status: 1, profileComplete: true, profile: { fullName: staff.fullName, displayName: staff.fullName, nickname: 'staff' } }));
      localStorage.setItem('uninet_session_generation', 'staff-fixture-session');
    }, { staff });
    await page.goto(origin + '/verificator/users');
    await page.getByRole('heading', { name: 'Quản lý người dùng', exact: true }).waitFor();
    await page.getByTestId('user-' + users[0].id).waitFor();
    assert.equal(await page.getByRole('link', { name: /^Xác minh sinh viên/ }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Khóa', exact: true }).count(), 0);
    assert.equal(await page.getByRole('link', { name: 'Chi tiết', exact: true }).count(), 0, 'staff read access does not imply detail or lock access');
    assert.deepEqual(errors, []);
    console.log('Admin management: real UI/API contracts, users/search/paging/lock/history, student approval/private document, partner rejection, staff creation/permissions, sidebar badges/collapse/access and responsive layouts passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
