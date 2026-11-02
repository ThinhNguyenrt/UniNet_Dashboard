# Admin management UI — handoff

## Behavior and routes
The Users page and its role filter cover Student/Partner only; Admin/Moderator/Verificator belong to the Staff page. Backend list pagination and statistics enforce this scope before returning records; deploy the matching BE update for Render-backed local testing.
Users list/detail, Student verification list/detail, Partner verification list/detail, staff creation and permission editing now call real APIs. Sidebar groups system management, review and notifications, filters new menus by effective permission, shows real authorized pending counts, supports desktop collapse and mobile drawer. Only the header bell opens personal notifications.

Routes under `/admin`, `/moderator`, `/verificator`: `/users`, `/users/:id`, `/student-verifications`, `/student-verifications/:id`, `/partner-verifications`, `/partner-verifications/:id`. Existing staff and verificator student/company routes remain usable aliases/wrappers. Capability failures deny access rather than invent permission/count data.

When capabilities are unavailable, Admin retains user/staff/review navigation so missing API routes do not silently remove the pages. A global error notice provides retry; page guards still block protected data/actions. Successful capability responses remain authoritative, including explicit denials; other staff get no role fallback. Chrome regression checks cover API 404, visible Admin links, blocked data and recovery after retry. Dashboard uses `VITE_API_BASE_URL` (not Expo environment names).

Lists provide debounced search, filters, stable server sorting, pagination, loading/empty/error states and refresh. Status/review actions have confirmation and feedback. Lock/unlock and rejection require reasons. Private image/PDF documents are loaded through authenticated blobs, with object URLs revoked on cleanup. Legacy external Partner documents use a separate authorized safe HTTPS link. Conflict responses refresh stale review data.

## Manual verification
1. Log in as Admin. Open Users; search name/email/ID, change role/status/verification filters and pages; inspect profile, verification and account status history.
2. Lock an active Student/Partner with a reason. Verify their existing API token and refresh token stop working; unlock with a reason and log them in again. Old JWT must remain invalid. Self/staff locking must be denied.
3. Submit Student verification through the existing student flow; check pending badge, private document and history. Approve, then check profile status and recipient notification. Exercise rejection/resubmission separately.
4. Submit Partner verification through the existing partner flow; inspect organization type and documents; approve/reject with two reviewers to check only one decision succeeds. Verify no duplicate account and the existing verified-partner business guard.
5. Create Moderator/Verificator from Staff. Grant only users.view; log in as that staff and verify no user detail, lock or review access, including direct URLs. Grant review permission and verify its menu/badge/documents appear. Revoke and retest the API boundary.
6. Check header bell/deep links, desktop sidebar collapse and widths 320/768/1440. There must be no personal-notification sidebar item.

## Evidence and limits
`npm run build` passed (bundle-size advisory remains). Targeted ESLint passed. Full `npm run lint` retains three prior errors: AuthContext setState-in-effect and only-export-components; SidebarItem setState-in-effect.

`node tests/admin-management-browser-check.cjs` passed real Chrome fixture checks for search/paging, locks/history, Student approval/private file, Partner rejection/type, staff creation/permissions, permission denial, badges/collapse and responsive layouts. Fixtures mock HTTP/SignalR; this is not deployed-backend E2E. Ignored screenshots: `dist/admin-management/`. Existing notification browser suite, session-refresh browser suite and three notification-target tests passed. Runtime uses cached Playwright and installed Chrome; see test file for defaults.

Before production, follow backend handoff for migration/session rollout; point dashboard at staging API, verify CORS and actual accounts/documents/notifications, then resolve or triage known baseline failures. No production changes or commits were made. Other existing dashboard modules were not rewritten.

## File inventory
New:
- `src/types/admin-management.ts`, `src/services/admin-management.service.ts`, `src/utils/management.ts`.
- `src/context/AdminManagementProvider.tsx`, `admin-management-context.ts`, `src/hooks/useAdminResource.ts`.
- `src/components/management/ManagementUI.tsx`, `AccountStatusDialog.tsx`, `StaffDialogs.tsx`, `VerificationDocumentPreview.tsx`.
- `src/pages/admin/UsersPage.tsx`, `UserDetailPage.tsx`, `AccountVerificationsPage.tsx`, `AccountVerificationDetailPage.tsx`.
- `tests/admin-management-browser-check.cjs`, this handoff.

Updated: `src/App.tsx`; layout DashboardLayout/Header/Sidebar; `src/pages/admin/StaffPage.tsx`; verificator StudentsPage/CompaniesPage; `src/types/navigation.ts`; `src/utils/notification-targets.ts`; notification target and session-refresh browser tests. FE integration adds the existing company profile route to `src/utils/notifications.ts` and its notification target test.

API/schema/permission/notification details: backend `docs/handoffs/admin-users-verifications.md`. UI production data has no hardcoded fixture fallback; fixtures exist only in tests.
