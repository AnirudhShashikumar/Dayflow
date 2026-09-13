# Dayflow production audit — 13 September 2026

## Scope and evidence

Inspected the Next.js App Router routes, proxy, auth actions/callback, Supabase clients, permission helpers, dashboard pages, management forms, exports, tests, and `supabase/migrations/202608220001_initial_schema.sql`. This is a repository audit; live Supabase policies/data and deployed Vercel behavior were not available for verification. Existing code contains real Supabase queries and RPCs; no runtime mock auth was found. The working tree was clean before this audit.

## Architecture and data flow

- `src/proxy.ts` refreshes Supabase auth cookies and redirects unauthenticated users on selected paths. `src/lib/auth/session.ts` obtains the auth user, reads `profiles`, and enforces page role checks. `src/lib/supabase/server.ts` creates a cookie-bound client; `admin.ts` uses a server-only secret for employee provisioning.
- `/` and login route through `dashboardPath` in `src/lib/permissions/index.ts`. Dashboard layout reads profile and unread notification count; `AppShell` chooses employee or management navigation.
- Employee `/home` and `/overview` each independently query `employee_profiles`, attendance, leave balances, and published payroll. Overview additionally queries announcements/notifications. `/attendance`, `/leave`, `/payroll`, `/documents`, `/notifications`, `/profile`, and `/settings` query their corresponding Supabase tables directly in server pages; mutations use server actions and database RPCs where present.
- `/hr` and `/admin` use `ManagementDashboard`, which reads employee, attendance, leave, payroll, department, announcement, and activity tables. `/employees`, `/departments`, `/announcements`, `/reports`, and `/activity` query Supabase from server pages. Management CSV route handlers enforce `requireProfile(["hr","admin"])`.
- The initial migration defines all named domain tables, RLS policies, private document storage, auth bootstrap trigger, and attendance/leave RPCs. No later migration exists. `organization_settings` carries timezone/currency but most pages do not use them.

## Findings by priority

### P0 — security, data correctness, release blockers

1. `src/app/auth/callback/route.ts` redirects to the unvalidated `next` query parameter. A crafted callback URL can redirect a signed-in user off site.
2. `src/app/(dashboard)/home/page.tsx` fabricates attendance status/count, payroll amount/date/status, leave balance, and recent activities when data is absent. It also computes `check_in !== null` as true when `check_in` is undefined. `/overview` and payroll truthfully show empty data, causing direct contradiction.
3. `dashboardPath` always returns `/home` (`src/lib/permissions/index.ts`), including HR/admin. `/home` renders employee cards and fabricated data for managers. Portal intent is checked during login but no role-specific landing follows.
4. `review_leave` in the initial SQL migration uses `ON CONFLICT ... DO UPDATE` to set attendance to leave, including a day with an actual check-in. Approval can erase the meaning of a worked day. `submit_leave` overlap detection has no concurrency lock/exclusion constraint; concurrent requests can overlap.
5. `check_in`/`check_out` SQL use database `current_date`, while pages use server `new Date()`; neither uses `organization_settings.timezone`. Day boundaries can disagree. The live timer similarly displays browser-local date/time.
6. `src/features/payroll/actions.ts` performs a draft upsert against any existing month, which can silently unpublish and overwrite a processed/paid record; publication, notification, and audit are separate non-atomic operations. Employee visibility depends on processed/paid RLS, which is present in the initial migration.
7. `src/features/employees/actions.ts` updates `profiles` then `employee_profiles` separately, and employment/account status separately; failures leave conflicting identity/access state. Changing `profiles.email` does not update Supabase Auth email. The employee detail form advertises email editing despite this mismatch.
8. `src/app/(dashboard)/documents/page.tsx` signs every URL while rendering, exposing the signed URL to the page and doing one Storage request per document; upload/delete metadata, file, notifications, and audit are separate operations. `deleteDocument` removes storage first, then does not check metadata deletion failure.
9. Several server actions and export routes return raw Supabase/Postgres errors (`attendance`, `leave`, `payroll`, `documents`, `employees`, CSV routes). This can expose internals and gives poor feedback.
10. Public registration accepts `employeeCode`, and the original `handle_new_user` trigger trusts `raw_user_meta_data.employee_code`. An employee can claim an HR-looking ID through direct Supabase signup even though role remains `employee` (`auth-form.tsx`, `business.ts`, initial migration).

### P1 — core workflow and UX

1. `/home` and `/overview` duplicate employee dashboard purpose and queries. `/overview` is currently the stronger truthful dashboard; one destination should own the command center with backward-compatible redirect.
2. `getSessionProfile` only loads `profiles`; pages each independently load employee ID, designation and department. Identity in the shell is incomplete and can diverge from page cards. `profiles` and `employee_profiles` remain the source of truth.
3. `overview` reports unread updates from only the latest three notifications and pending leave from only the latest request. Charts show zeros even when no records exist. Attendance rate is over recorded rows, not scheduled workdays, and the weekly chart uses last five calendar days rather than the selected week.
4. Management navigation omits attendance, documents and notifications even though those routes work for management; it links `/hr` as Overview while `/home` is another dashboard. `/admin` is a duplicate management dashboard route.
5. `AppShell` command dialog has no focus trap or Escape handling (despite instructing Escape); the avatar is decorative, collapse has a static label, and mobile search is inaccessible. The command control performs text search only, not command navigation.
6. `src/features/leave/leave-form.tsx` shows an inert hidden Cancel button and no explicit pending state on the whole form. Several forms rely on plain server-action exceptions; they lack inline save progress/success feedback.
   The half-day checkbox disables the end-date input without submitting a replacement value, so the server validation rejects half-day requests.
7. Notification bell count and page use the same table, but notification mutations only revalidate `/notifications`, so the layout count may remain stale until navigation/refresh. Announcement notifications are sent to all active profiles regardless of audience; document uploads do not notify recipients.
8. `src/app/(dashboard)/profile/page.tsx` reads real data and edits only personal fields, but the form has weak labels and no save feedback. `src/app/(dashboard)/settings/page.tsx` has descriptive cards rather than actionable preferences. Org settings fallback values can mask a missing settings row.
9. Employee search advertises name/email but filters only code/designation (`employees/page.tsx`). Reports and several management pages load broad tables without pagination. Empty-state coverage is uneven; many query errors are treated as empty arrays.

### P2 — visual, accessibility and performance

1. Token set in `src/app/globals.css` is partial; spacing, radii and motion live as scattered utility values. Arial and repeated dark plum cards produce uneven hierarchy.
2. Many form labels use `<Label>` without `htmlFor`, tables rely on horizontal scroll on narrow screens, and charts need better zero-data alternatives and accessible summaries.
3. `AppShell` is a large client component; notification count is queried in layout and again on overview. Personal data is correctly under a `force-dynamic` dashboard layout; cache must remain user-scoped.
4. CSV export values are quoted but not protected against spreadsheet formula injection. Response errors expose database messages. Exports and management queries lack strict date-range limits.

## Existing safeguards and limitations

The migration gives employees self-scoped RLS for attendance, leave, payroll, documents, and notifications, keeps the document bucket private, and restricts public signup to `employee` in `handle_new_user`. Server pages protect management routes, and the service credential is only accessed from a server module. This audit cannot establish whether the migration was applied unchanged in production, whether Supabase Auth email settings match the application, or whether RLS has been altered in the live project. Database-dependent integration/security behavior requires a configured test Supabase project and real role fixtures.
