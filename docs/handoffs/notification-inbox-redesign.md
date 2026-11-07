# Notification inbox UI — 2026-11-06

- Reference layout applied to inbox page and row: All/Unread/Read tabs, global total/unread badges, mark-all action, category color/icon blocks, rounded blue unread/white read rows, relative times and Today/Earlier groups.
- Removed category selector from this view to match reference. Server category filtering remains available. Pagination remains for large inboxes; readOnly query filters on the server before pagination and requires the matching backend update.
- Provider exposes totalCount from the unfiltered inbox response. Optimistic read overrides, instant badge changes, rollback and errors after navigation remain intact.
- Verified production build and Chrome integration including tabs/counts, server-query fixtures, optimistic read errors/retry, realtime, broadcast management, permissions and 320/768/1440px screenshots. Images under ignored dist/notifications/inbox-reference-*.png.
- Backend: 31 focused notification tests pass. Full FE/backend test limitations are recorded in backend docs/handoffs/notification-inbox-redesign.md.
