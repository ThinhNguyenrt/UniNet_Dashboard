# Optimistic notification reads — 2026-11-06

- `NotificationsProvider` owns per-ID read overrides, pending request deduplication, badge updates and rollback. Inbox projects overrides over API pages, including unread-only filtering. Provider persists across nested page navigation.
- Clicking unread rows updates read state/count synchronously. PATCH runs independently of target resolution/navigation. Safe embedded URLs navigate immediately; related target lookup otherwise runs without waiting for PATCH. Destination-free rows do not call target lookup.
- Read success has no toast. Failure restores unread state/count and shows a dismissible provider-level error, also after navigation. Error sits at bottom right to avoid blocking the header bell.
- Refresh sequence/pending guards prevent stale count responses from overwriting optimistic state. Read callbacks check provider lifetime and dashboard session generation. Read-all clears per-ID overrides after success.
- Verification: Dashboard production build and mocked Chrome integration passed. Tests hold PATCH responses, assert row/badge updates before server state changes, inject failures before/after navigation, check rollback on revisiting the inbox and retry success. Existing broadcast, realtime, permissions, responsive and logout checks also pass.
- Matching FE behavior is documented in its `docs/handoffs/optimistic-notification-read.md`. No backend endpoint or schema changes.
