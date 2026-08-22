# Five-minute demo

1. Sign in as `employee@dayflow.demo`; show personal metrics, live attendance, leave balance, announcements, and private payroll.
2. Check in (reset the demo DB if today already has a record). Apply for a paid/sick leave date not overlapping the seeded pending request. Sign out.
3. Sign in as `hr@dayflow.demo`. Open the pending queue, approve with a comment, then show updated attendance, dashboard metrics, notification generation, and activity log.
4. Open Employees, a detailed profile, Payroll, and Reports. Export a CSV and show the Dayflow Insights panel.
5. Sign back in as the Employee. Show the approval notification, updated balance, leave timeline, and print-ready payslip. Resize to 375px to demonstrate the navigation drawer and stacked cards.

For repeatable demos, run `npx supabase db reset` immediately beforehand.
