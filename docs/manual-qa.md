# Manual QA checklist

- Auth: valid/invalid login, Employee registration/verification, forgot/reset password, persistence, logout, inactive account.
- Security: direct-route checks for Employee versus HR/Admin; two-browser verification that Employee A cannot read Employee B profile, attendance, leave, payroll, documents, or notifications.
- Attendance: first check-in, duplicate rejection, checkout, second checkout rejection, live timer, history, HR correction reason, audit entry, CSV.
- Leave: date order, past date, half-day, overlap, insufficient balance, submit/cancel, approve/reject comment, balance/attendance/notification/audit updates.
- Payroll: draft calculation, process, paid date, Employee read-only isolation, history, print/PDF, CSV, missing-record insight.
- Documents: type/size validation, private signed download, Employee visibility, HR-only denial, deletion.
- Notifications/announcements: unread count, mark one/all, related links, audience/date/priority, activation.
- Reports: date/department filters, stored-data totals, CSV, print layout, empty result.
- Responsive/accessibility: keyboard navigation/focus, dialogs/forms/labels, reduced motion, contrast; test 375, 768, 1024, and 1440px plus light/dark themes.
- Demo: execute every step in `docs/demo-script.md` after a clean seed.
