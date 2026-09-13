# Dayflow production implementation plan — 13 September 2026

1. **P0 release safety:** validate callback destinations; fix role landing; remove fabricated home data and consolidate dashboards; close leave/attendance integrity gaps with additive SQL migration; prevent payroll unpublishing and unsafe partial writes. Preserve existing tables, keys, and RLS contract.
2. **P1 shared foundation:** add canonical viewer/employee context and organization time/currency helpers; centralize trusted role redirects; expose query failures as actionable states; make navigation complete and keyboard accessible.
3. **P1 employee workflows:** verify and repair attendance, leave, payroll, documents, notifications, profile, and settings against real data. Add pending/success/error states and strict server validation.
4. **P1 management workflows:** repair employee identity/status changes, leave approvals, payroll publication, document lifecycle, announcements, reports/exports, and audit propagation. Use database transactions/RPCs for related writes.
5. **P2 product pass:** align design tokens and component spacing; improve mobile table/form behavior, chart empty states, labels/focus, and reduced motion; bound management queries and exports.
6. **Verification:** add focused domain/security tests, run `npm install`, lint, typecheck, Vitest, build, and role/route smoke checks. Test production data and deployed behavior separately before release; apply migrations before deploying dependent code.

The audit is in `docs/DAYFLOW_PRODUCTION_AUDIT.md`. Changes should be made incrementally and verified after each milestone. Live Supabase tests are conditional on access to a safe configured project; this plan does not authorize destructive resets or live data edits.

## Implementation status in this change

- Milestone 1: callback path validation, role landings, removal of fabricated `/home` metrics, and additive integrity migration implemented. The migration has **not** been applied to a live database.
- Milestone 2: cached viewer identity, organization date/currency helpers, role-specific navigation, command links, and error surfaces implemented. Attendance, leave, and notification lists are paginated; reports fetch multiple pages and fail explicitly above 20,000 rows. Other management tables should be revisited as organization size grows.
- Milestone 3: attendance/leave/payroll/document/profile/notification flows repaired in code; database-dependent paths require the migration. Half-day leave preserves the ability to check in for the remaining time; a full working-calendar model is not present.
- Milestone 4: management employee/status/payroll/announcement writes use atomic RPCs or database triggers; document Storage and metadata cannot share one database transaction. Reports now apply department filtering to on-screen totals and CSV export.
- Milestone 5: key form pending states, keyboard command dialog, chart empty state, focus styles, and scrollable table keyboard access implemented. Full visual and WCAG AA audit across authenticated desktop/tablet/mobile states remains outstanding.
- Milestone 6: `npm install`, 68 unit tests, lint, typecheck, production build, and unauthenticated route smoke checks pass locally. Authenticated role/integration, migration execution, browser console, visual breakpoints, and production RLS tests remain outstanding pending a safe Supabase test environment.

## Release sequence

1. Back up the production database and inspect migration history. Do not run `supabase/seed.sql` in production.
2. Apply `supabase/migrations/202609130001_release_integrity.sql` through the normal Supabase migration pipeline. Confirm RPCs, triggers, and policies exist, and inspect errors before deploying code that calls them.
3. In a staging Supabase project with employee, HR, and admin fixtures, test signup metadata forgery, portal routing, attendance across midnight, half-day/full-day leave, double submissions, published payroll isolation, private document downloads, and notification counts. Verify direct browser Supabase requests obey RLS.
4. Deploy the Next.js app to Vercel with the existing `NEXT_PUBLIC_SUPABASE_URL`, publishable key (or legacy anon key), `NEXT_PUBLIC_APP_URL`, and server-only secret/service-role key. Never prefix the secret with `NEXT_PUBLIC_`.
5. Smoke-test login, role landings, `/overview` redirect, attendance/leave/payroll/documents/notifications, HR approvals, exports, and mobile layout. Monitor Vercel and Supabase logs before opening the release to users.
