# Notification broadcast audience form — 2026-11-06

- Form offers All (Sinh viên/Đối tác/Người thẩm định), Role (one of those three), Staff (Verifier/Moderator/Accountant/Admin).
- Removed manual recipient IDs from creation form; legacy Selected input type/history remains supported for saved jobs. Staff submissions omit stale role/recipient IDs. History displays the Staff label.
- Backend `NotificationBroadcastService` enforces the same audience split for preview, publish and delivery. Deploy matching backend before using the new Staff choice; no migration required.
- `npm run build` and `node tests/notifications-browser-check.cjs` passed. Browser fixture now uses current Admin role 6 / Active status 1, and checks the audience and role selectors plus Staff request payload.
- Backend: 30 focused notification tests passed in isolation; full test project has unrelated AI moderation interface compile errors. See backend `docs/handoffs/notification-broadcast-audiences.md` for details.
