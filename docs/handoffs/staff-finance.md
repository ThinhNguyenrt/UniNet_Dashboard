# Staff finance UI

- Canonical roles: admin6, accountant5, moderator4, verifier3, assessor2. JWT/name/numeric normalization is strict. Existing expert page source modules and API route names retain verificator for compatibility; browser routes use /assessor.
- Admin /admin/revenue and /admin/finance use the real FinancePage. Accountant /accountant/finance shares it. Verifier has /verifier identity-review pages; protected route families and API capabilities prevent cross-role access.
- Finance tabs: withdrawals, refunds, payments, ledger. Includes documented income credit/account search, two-person refund approval, payout orders, manual bank confirmation, detailed payout audit and aggregate CSV export. No external transfer is executed by a button.
- Money is decimal text, formatted/calculated with BigInt. Tab loader results are keyed to tab/page to prevent stale rows rendering under another row type.
- Staff creation exposes Assessor/Verifier/Moderator/Accountant. Role catalog displays the requested seven roles/groups. Permission editor only exposes that role's scope; server independently enforces it.
- Validated build, exact-money/notification-target tests and finance-browser-check.cjs across all five dashboard roles. Fixtures are isolated from real signed-in sessions. Screenshots: dist/finance-check.
- Deployment dependency: backend handoff ../UniNet_BE/docs/handoffs/staff-finance-permissions.md. Current .env points to Render; backend/migrations must be upgraded before live use. No remote environment changed.
