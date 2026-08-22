# Contributing to Dayflow

Pull `main` before starting. Create a short-lived branch (`feat/auth`, `feat/attendance`, etc.), keep changes inside the owned domain where possible, and never force-push shared history. Use Conventional Commits such as `feat: add leave approval timeline` or `fix: prevent duplicate check-in`.

Before opening a pull request run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Describe schema/RLS changes explicitly, include manual verification steps, and never commit `.env.local`, service keys, real employee data, or downloaded private documents. Database changes must be forward-only migrations; do not edit an already-applied production migration.
