# Database and security model

The migration creates profiles, departments, employee profiles, attendance, configurable leave types/balances/requests/history, payroll, documents, notifications, announcements, activity logs, and organization settings. UUID keys, foreign keys, unique/check constraints, indexes, safe delete actions, and `updated_at` triggers are included.

Employee ownership is resolved from `auth.uid()` through `current_employee_id()`. Employees can select only their own sensitive rows; payroll additionally requires `processed`/`paid`, and documents require employee visibility. HR/Admin receive management policies. Only Admin receives department/settings policies. No client code can assign a privileged role.

`check_in`, `check_out`, `submit_leave`, `review_leave`, and `cancel_leave` are atomic RPCs. Leave approval locks the request, verifies balance, deducts it, materializes leave attendance days, adds history/notification/audit records, and commits as one transaction.

Seed employees: `employee@dayflow.demo`, `priya@dayflow.demo`, `vikram@dayflow.demo`, `meera@dayflow.demo`, `kabir@dayflow.demo`, `isha@dayflow.demo`, `arjun@dayflow.demo`, and `neha@dayflow.demo`. All use the README demo password and contain fictional data.
