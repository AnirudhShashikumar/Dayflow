# Four-member workflow

| Owner | Folders |
| --- | --- |
| Lead | `supabase/`, `src/lib/supabase`, `src/lib/permissions`, deployment/docs |
| Auth/Employee | `src/features/auth`, `src/components/layout`, profile/notification/settings routes |
| Attendance/Leave | `src/features/attendance`, `src/features/leave`, attendance/leave routes |
| HR/Payroll/Reports | employee/payroll/report/announcement/activity routes and components |

Before work: fetch/pull `main`, confirm a clean merge base, and announce any shared-file change. Commit one logical unit with Conventional Commits and push at least at each integration checkpoint. Checkpoints are: schema/auth, shell/dashboards, core workflows, evaluation features, release candidate.

Resolve conflicts with both owners present. Preserve intent from both sides, rerun the complete verification suite, and never force-push, rewrite public history, or casually regenerate lockfiles. The lead owns final migration order and shared navigation integration.
