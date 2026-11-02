# Unified notifications dashboard

- Header uses `NotificationBell` as a direct link to the dedicated `/:role/notifications` page for every staff role; clicking the bell never opens a popup. Unread badges remain live.
- `NotificationsProvider` is keyed by account ID and role, owns recent inbox/unread state, and aborts requests/stops SignalR on session change.
- Hub `/hubs/notifications` emits invalidations (`NotificationChanged`); the client refetches APIs on events, reconnect, tab resume and every 30 seconds while visible.
- GET/PATCH `/api/notifications` APIs only operate on the authenticated account. Navigation resolves `/notifications/{id}/target` before applying a strict per-role route allowlist.
- Existing dashboard business pages are lists/placeholders, with no object detail routes. Unavailable/unauthorized targets show a message rather than opening arbitrary links.
- Admin aliases `/admin/student-verifications`, `/admin/partner-verifications`, `/admin/job-postings`, `/admin/community-posts` reuse existing staff list views. These existing lists still contain mock data; notification delivery does not implement new review business screens. Target API rechecks permission before navigation.
- Admin `notification-broadcasts` page and navigation require the backend `canManage` capability. Every create/preview/publish/cancel request still requires backend authorization. History refreshes every 10 seconds while visible.
- Broadcast UI supports all accounts, one role, or selected account GUIDs. Preview is explicit; publishing requires a second action. Cancellation preserves already delivered notifications.
- History can reopen a saved draft after reload and preview a failed broadcast before retry. Both reuse the persisted broadcast ID and require a fresh recipient preview plus explicit publish confirmation. A failed preview clears the confirmation; partially delivered retries keep progress and only deliver to missing recipients. Keyboard focus moves to the preview region.
- `dashboard-session.ts` implements single-flight refresh rotation, session-generation/account checks and expiry cleanup. A late refresh cannot restore a logged-out account or overwrite a new session. Transient network failures retain the session; rejected refresh credentials clear it.
- Numeric role mapping matches backend: Moderator=3, Verificator=4. Unsupported dashboard roles are rejected rather than defaulting to Admin.
- Vite proxies both `/api` and `/hubs` to the origin configured in `VITE_API_BASE_URL` (falls back to the existing hosted backend). Configure deployment reverse proxy/CORS for the actual environment.

## Verification

```text
npm run build
node --experimental-strip-types tests/notification-targets.test.mjs
node tests/notifications-browser-check.cjs
node tests/session-refresh-browser-check.cjs
```

Browser checks use synthetic local API/WebSocket fixtures, not production credentials. Set `DASHBOARD_TEST_ORIGIN` to the running Vite origin (default `http://127.0.0.1:5174`). Screenshots are ignored under `dist/notifications/`.

October 25 continuation: browser recovery checks pass for saved drafts, failed jobs, preview errors, explicit confirmation, reused IDs and mobile layout. `retry-preview-mobile.png` records the recovery preview at 320px. Backend batch tests independently verify retry after 250 deliveries finishes with 252 unique notifications.

Build and targeted ESLint pass. Full lint retains pre-existing `AuthContext.tsx` effect/FastRefresh and `SidebarItem.tsx` effect violations. npm installation reported 3 moderate/1 high dependency advisories; no forced dependency upgrades were applied. The main production JS bundle currently triggers Vite's 500 kB advisory.
