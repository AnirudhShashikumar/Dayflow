# Dayflow

**Every workday, perfectly aligned.**

Dayflow is a full-stack HR operating system built for the Odoo × NMIT Bangalore Hackathon 2026. It combines employee self-service, attendance, leave, payroll, documents, announcements, reports, notifications, and audit history in one responsive workspace.

## Product and roles

- Employees manage permitted profile fields, record attendance, request leave, privately view payroll/documents, and receive notifications.
- HR Officers manage employees, attendance corrections, leave decisions, payroll, announcements, reports, documents, and audit history.
- Administrators inherit HR abilities and manage departments, roles, account status, and organization settings.

Public registration always creates an `employee`. HR/Admin accounts are seeded or provisioned by a trusted administrator. Role enforcement exists in routes, Server Actions/RPCs, the interface, and PostgreSQL Row Level Security. The Supabase service-role key is server-only and is never referenced by a Client Component.

## Stack

Next.js App Router, strict TypeScript, Tailwind CSS, shadcn-style Radix primitives, Lucide, Framer Motion-ready UI, Supabase PostgreSQL/Auth/Storage/RLS, React Hook Form, Zod, Recharts, date-fns, Sonner, Vitest, npm, and Vercel.

## Local setup

Requirements: Node 22+ (Node 24 recommended), npm, Supabase CLI, and Docker for local Supabase.

```bash
npm install
cp .env.example .env.local
npx supabase start
npx supabase db reset
npm run dev
```

Copy the local Supabase URL, anon key, and service-role key printed by `supabase start` into `.env.local`. Configure Supabase Auth Site URL as `http://localhost:3000` and add `http://localhost:3000/auth/callback` to redirect URLs. For a hosted project, run `npx supabase link --project-ref <ref>` followed by `npx supabase db push`, then execute `supabase/seed.sql` only in a non-production demo project.

Environment variables:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server | RLS-constrained public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Trusted administrator provisioning |
| `NEXT_PUBLIC_APP_URL` | Browser/server | Auth callback base URL |
| `HR_INVITATION_CODE` | Server only | Reserved optional invitation flow |

## Demo credentials

After `supabase db reset`, all demo accounts use `Dayflow@2026`:

| Role | Email |
| --- | --- |
| Administrator | `admin@dayflow.demo` |
| HR Officer | `hr@dayflow.demo` |
| Employee | `employee@dayflow.demo` |

Seven more fictional employee accounts are documented in [the database guide](./docs/database.md). Credentials appear only in seed documentation and the development-only login hint.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deployment

1. Create a Supabase production project, apply `supabase/migrations/202608220001_initial_schema.sql`, and configure the Auth Site URL plus `https://<domain>/auth/callback` redirect.
2. Import the repository into Vercel and add all environment variables. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
3. Deploy, verify an Employee/HR login, and test RLS with separate sessions. Do not load demo seed data into a real production tenant.

The application contains no localhost-only runtime paths. Private documents use short-lived signed URLs from a non-public Storage bucket.

## Repository map

```text
src/app                 routes, layouts, route handlers, server actions
src/components          design system, shell, dashboards, shared states
src/features            domain actions and interactive modules
src/lib                 Supabase, auth, permissions, validation, utilities
src/types               domain contracts
supabase/migrations     reproducible schema, functions, RLS, storage policy
supabase/seed.sql       fictional Indian-company demo dataset
docs                    architecture, database, demo, QA, and teamwork guides
```

## Screenshots

Add final event-day screenshots here after connecting the team’s hosted Supabase demo tenant.

## Team ownership

| Member | Primary ownership |
| --- | --- |
| Lead | architecture, database, RLS, integration, deployment |
| Member 2 | auth, shell, employee experience, notifications |
| Member 3 | attendance, leave, related analytics |
| Member 4 | HR, employees, payroll, reports, announcements |

See [team workflow](./docs/team-workflow.md) and [contributing guide](./CONTRIBUTING.md).

## Known non-critical limitations / future enhancements

- Weekends and organization holidays currently count in multi-day leave duration; a configurable work calendar is the next enhancement.
- Payslips use a polished print-to-PDF flow rather than server-generated PDFs.
- Email notifications are intentionally optional; core workflows use in-app notifications.
- HR invitation codes are reserved in configuration; trusted account provisioning/seed remains the implemented security path.
