<div align="center">

# ✦ DAYFLOW

### Your people. One clear flow.

**A modern, secure, full-stack Human Resource Management System built for the way teams actually work.**

One platform. Two purpose-built experiences.  
**Employee Workspace × HR / Admin Command Center**

<br>

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-68%20Tests-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

<br>

![Build](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)
![Typecheck](https://img.shields.io/badge/TypeScript-Passing-brightgreen?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-68%20Passing-brightgreen?style=flat-square)
![Security](https://img.shields.io/badge/Security-RLS%20Protected-blueviolet?style=flat-square)
![Architecture](https://img.shields.io/badge/Architecture-Role%20Based-blue?style=flat-square)

<br>

[**Live Application**](https://dayflow-psi-teal.vercel.app) ·
[**Features**](#-features) ·
[**Architecture**](#-system-architecture) ·
[**Security**](#-security-by-design) ·
[**Setup**](#-local-development) ·
[**Roadmap**](#-roadmap)

<br>

> **Dayflow turns fragmented HR operations into one calm, intelligent and secure workspace.**

</div>

---

## ✦ The Vision

HR software should not feel like enterprise software from another decade.

It should be fast.

It should be understandable.

It should be secure by default.

And most importantly, employees and management should not be forced into the exact same experience.

**Dayflow** was designed around that principle.

It is a full-stack Human Resource Management System that provides two distinct role-aware experiences inside one unified platform:

<table>
<tr>
<td width="50%" valign="top">

### 👤 Employee Workspace

A focused personal workspace for everyday work.

- Attendance
- Leave & time off
- Payroll
- Personal profile
- Documents
- Notifications
- Announcements
- Work overview

</td>
<td width="50%" valign="top">

### 🛡️ HR / Admin Command Center

An operational workspace for managing the organization.

- Employee management
- Attendance oversight
- Leave approvals
- Payroll operations
- Document assignment
- Departments
- Reports
- Announcements
- Activity & audit workflows

</td>
</tr>
</table>

---

# ✨ Features

## 👤 Employee Experience

Dayflow gives every employee a personal workspace built around the information and actions they need every day.

### 🏠 Personal Dashboard

Employees receive a personalized overview containing relevant workplace information rather than fabricated dashboard metrics.

The dashboard can surface:

- attendance status
- recorded working hours
- leave information
- latest published payroll
- announcements
- recent notifications
- quick actions

---

### ⏱ Attendance

Employees can manage and review their working time through the attendance system.

**Capabilities**

- Check in
- Check out
- View today's attendance
- Track recorded working time
- Review daily history
- View attendance rate
- Review weekly working hours

```text
Employee
   │
   ▼
Check In
   │
   ▼
Attendance Record
   │
   ▼
Working Session
   │
   ▼
Check Out
   │
   ▼
Recorded Duration
```

---

### 🌴 Leave & Time Off

Employees can submit and follow leave requests through a dedicated workflow.

**Capabilities**

- Select leave type
- Choose start and end dates
- Submit half-day requests
- Add remarks
- View calculated duration
- Track request history
- Review approval status
- View leave balances

```text
Employee Request
       │
       ▼
   Submitted
       │
       ▼
   HR Review
     /     \
    ▼       ▼
Approved  Rejected
    │
    ▼
Employee Notification
```

---

### 💳 Payroll

Payroll information is private and employee-specific.

Employees can:

- view published payroll
- access payroll history
- view payslip information
- print or save available payslip information
- access only authorized payroll records

Unpublished payroll information is not intended to appear in the employee workspace.

---

### 📄 Secure Documents

Dayflow supports private employee document delivery.

Examples may include:

- payslips
- employment documents
- HR letters
- organization documents
- employee-specific files

Document access uses short-lived signed URLs instead of permanent public links.

---

### 🔔 Notifications

Employees receive workplace updates through the notification center.

Notifications can represent events such as:

- leave decisions
- payroll updates
- announcements
- document updates
- operational events

---

### 👤 Profile

Employees can maintain personal information while organization-controlled employment data remains separated.

Examples include:

**Employee editable**

- phone
- emergency contact
- emergency phone
- address

**Organization controlled**

- employee ID
- department
- designation
- employment type
- role

---

# 🛡️ HR / Admin Experience

Dayflow separates management capabilities from employee workflows.

Authorized HR/Admin users can access organization-level operations unavailable to standard employees.

### 👥 Employee Management

Management workflows support:

- employee records
- account status
- job information
- departments
- designations
- employment information
- organization-level employee administration

---

### 🌴 Leave Management

Authorized users can:

- review employee leave requests
- approve requests
- reject requests
- manage associated workflow state
- trigger employee notifications

The release architecture includes transactional database operations for sensitive multi-step workflows.

---

### 💰 Payroll Operations

Management users can manage payroll workflows separately from employee payroll visibility.

```text
HR / Admin
     │
     ▼
Payroll Record
     │
     ▼
Processing
     │
     ▼
Publication
     │
     ▼
Employee Visibility
```

Only appropriately published records should become visible to employees.

---

### 📁 Document Management

Authorized management users can assign private documents to employees while employees receive restricted access to their own authorized files.

---

### 📢 Announcements

Organization announcements can be surfaced directly inside Dayflow so important workplace information does not need to depend entirely on external communication channels.

---

### 📊 Reports

Management reporting is designed around real operational records.

The release pass includes safer paginated retrieval and explicit failure handling instead of silently presenting failed queries as empty datasets.

---

# 🧠 System Architecture

Dayflow follows a layered architecture designed to keep presentation, business logic, authentication and database authorization separated.

```text
┌───────────────────────────────────────────────┐
│                    USER                       │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                NEXT.JS FRONTEND               │
│                                               │
│  Server Components │ Client Components        │
│  App Router        │ Forms / Interactions     │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│               APPLICATION LAYER               │
│                                               │
│ Authentication                               │
│ Authorization                                │
│ Validation                                   │
│ Permissions                                  │
│ Server Actions                               │
│ API Routes                                   │
│ Domain Logic                                 │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                    SUPABASE                   │
│                                               │
│ Auth │ PostgreSQL │ RLS │ RPC │ Storage       │
│      │ Triggers   │ Policies │ Audit          │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│               PERSISTENT DATA                 │
└───────────────────────────────────────────────┘
```

---

# 🔐 Role-Based Access

Portal selection does **not** determine authorization.

The database-backed user role does.

```text
                     ┌─────────────┐
                     │    LOGIN    │
                     └──────┬──────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ Supabase Session  │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │  Trusted Profile  │
                  │       Role        │
                  └─────────┬─────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │   EMPLOYEE   │        │  HR / ADMIN  │
        └──────┬───────┘        └──────┬───────┘
               │                       │
               ▼                       ▼
       Employee Workspace      Management Workspace
```

Public registration is designed to prevent users from choosing privileged roles themselves.

Privileged access must come from a trusted administrative process.

---

# ⚙️ Technology Stack

<table>
<tr>
<td><strong>Layer</strong></td>
<td><strong>Technology</strong></td>
<td><strong>Purpose</strong></td>
</tr>

<tr>
<td>Framework</td>
<td>Next.js 16</td>
<td>Full-stack application framework</td>
</tr>

<tr>
<td>Frontend</td>
<td>React</td>
<td>Interactive user interface</td>
</tr>

<tr>
<td>Language</td>
<td>TypeScript</td>
<td>Type-safe application development</td>
</tr>

<tr>
<td>Authentication</td>
<td>Supabase Auth</td>
<td>User identity and sessions</td>
</tr>

<tr>
<td>Database</td>
<td>PostgreSQL</td>
<td>Persistent relational data</td>
</tr>

<tr>
<td>Backend Platform</td>
<td>Supabase</td>
<td>Database, Auth, Storage and RPC</td>
</tr>

<tr>
<td>Authorization</td>
<td>Supabase RLS</td>
<td>Database-level data protection</td>
</tr>

<tr>
<td>Storage</td>
<td>Supabase Storage</td>
<td>Private employee documents</td>
</tr>

<tr>
<td>Testing</td>
<td>Vitest</td>
<td>Automated application testing</td>
</tr>

<tr>
<td>Deployment</td>
<td>Vercel</td>
<td>Application hosting</td>
</tr>

<tr>
<td>Version Control</td>
<td>Git + GitHub</td>
<td>Source control and collaboration</td>
</tr>

</table>

---

# 🗄️ Data Model

Dayflow is built around a relational HR data model.

Core entities include:

```text
profiles
│
├── employee_profiles
├── attendance_records
├── leave_requests
├── leave_balances
├── payroll_records
├── employee_documents
└── notifications

departments
leave_types
announcements
organization_settings
activity_logs
```

This architecture separates authentication identity from employee-specific and organization-specific data.

---

# 🔄 Transactional Workflows

Important business operations may require multiple database changes to succeed together.

For example:

```text
Leave Approval
      │
      ├── Update leave request
      │
      ├── Update leave balance
      │
      ├── Generate notification
      │
      └── Record audit event
      │
      ▼
 Transaction Complete
```

The release integrity migration introduces transactional RPCs and supporting database logic for critical workflows.

---

# 🔒 Security by Design

Dayflow does not rely only on hidden UI elements for security.

Security is applied across multiple layers.

### Authentication

```text
Supabase Authentication
        +
Secure Session Handling
        +
Protected Application Routes
```

### Authorization

```text
Trusted Database Role
        +
Server-Side Permission Checks
        +
Row Level Security
```

### Database Protection

Supabase RLS is used to restrict access to business data according to the authenticated user and their permissions.

### Document Security

```text
Private Storage
      │
      ▼
Authorization Check
      │
      ▼
Short-Lived Signed URL
      │
      ▼
Authorized Download
```

### Callback Protection

Authentication callback destinations are validated to reduce unsafe redirect behavior.

### Privilege Protection

Public signup is not intended to allow users to self-assign:

```text
admin
hr
manager
```

or trusted employee identifiers.

---

# 🎨 Product Design Philosophy

Dayflow aims for the clarity and restraint associated with modern software products rather than traditional enterprise dashboards.

The interface is built around:

```text
Clarity
   +
Hierarchy
   +
Consistency
   +
Accessibility
   +
Restraint
   +
Useful Information
```

Design principles include:

- strong visual hierarchy
- restrained use of color
- predictable interactions
- consistent spacing
- readable typography
- useful empty states
- clear feedback
- responsive layouts
- keyboard accessibility
- visible focus states
- reduced-motion support
- truthful data representation

The goal is not to imitate Apple, OpenAI or Google.

The goal is to apply the same fundamental principles of **simplicity, precision and usability** while giving Dayflow its own visual identity.

---

# ⚡ Performance

Several production-oriented improvements reduce unnecessary work and make failure behavior more predictable.

### Pagination

Large datasets such as attendance, leave and notifications use bounded/paginated retrieval strategies.

### Reports

Report retrieval uses successive pages with an explicit safety limit instead of silently truncating arbitrary amounts of data.

### Documents

Signed document links are created on demand instead of being permanently exposed.

### Error Handling

Failed database operations are distinguished from legitimate empty states where supported by the release implementation.

---

# ♿ Accessibility

The release pass includes accessibility improvements such as:

- keyboard interaction
- visible focus handling
- form labels
- reduced-motion support
- clearer state feedback
- chart empty states

A complete WCAG AA certification has **not yet been completed**.

---

# 🧪 Testing & Verification

The current release passes the repository verification suite.

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Current automated result:

```text
✓ Lint
✓ TypeScript
✓ 68 tests passing
✓ Production build
✓ git diff --check
```

Local smoke testing also confirmed successful public authentication page rendering and login redirects for protected routes.

---

# 🧪 Test Coverage Areas

Focused tests cover areas including:

```text
✓ Callback path validation
✓ Permission behavior
✓ Input validation
✓ Organization date handling
✓ CSV safety
✓ Report pagination
✓ Supporting utility behavior
```

The project should additionally receive full browser-based authenticated end-to-end testing before being considered completely production-certified.

---

# 🚦 Release Status

## Repository Verification

| Check | Status |
|---|---|
| Lint | ✅ Passing |
| TypeScript | ✅ Passing |
| Unit / focused tests | ✅ 68 passing |
| Production build | ✅ Passing |
| Public auth smoke tests | ✅ Passing |
| Protected route redirects | ✅ Passing |
| Database integrity migration | ⚠️ Pending application |
| Authenticated employee E2E | ⚠️ Pending |
| Authenticated HR/Admin E2E | ⚠️ Pending |
| Direct RLS security testing | ⚠️ Pending |
| Mobile/tablet visual QA | ⚠️ Pending |
| Full WCAG AA audit | ⚠️ Pending |

> Passing the repository verification suite does not by itself constitute complete production certification. Database migrations, authenticated workflows and authorization boundaries must also be validated against a safe Supabase environment.

---

# 🗂️ Project Structure

```text
Dayflow/
│
├── docs/
│   ├── DAYFLOW_PRODUCTION_AUDIT.md
│   └── DAYFLOW_PRODUCTION_PLAN.md
│
├── public/
│
├── src/
│   │
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   └── api/
│   │
│   ├── components/
│   │   └── layout/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── employees/
│   │   ├── payroll/
│   │   └── ...
│   │
│   └── lib/
│       ├── auth/
│       ├── supabase/
│       └── organization.ts
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

# 🚀 Local Development

## 1. Clone Dayflow

```bash
git clone https://github.com/AnirudhShashikumar/Dayflow.git
cd Dayflow
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create:

```text
.env.local
```

Configure the Supabase variables required by your current Dayflow environment.

For the current configuration, this may include:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Legacy configuration names supported by the project may include:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> Never commit `.env.local`, private API keys, service-role credentials or database passwords to GitHub.

---

## 4. Start Dayflow

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

# 🧰 Development Commands

```bash
# Start development server
npm run dev

# Run lint
npm run lint

# Run TypeScript checks
npm run typecheck

# Run automated tests
npm test

# Create production build
npm run build

# Start production build
npm run start
```

---

# 🟢 Supabase

Dayflow uses Supabase for:

```text
Authentication
      +
PostgreSQL
      +
Row Level Security
      +
Private Storage
      +
Database Functions
      +
Triggers
```

To work with the Supabase CLI:

```bash
npx supabase login
```

Then link the appropriate project:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

---

# ⚠️ Database Migrations

The release integrity migration is located at:

```text
supabase/migrations/202609130001_release_integrity.sql
```

It introduces production-oriented database changes including:

- transactional RPC support
- audit behavior
- notification triggers
- tighter access policies
- integrity improvements

### Recommended deployment sequence

```text
Backup Database
      │
      ▼
Safe Staging Supabase Project
      │
      ▼
Apply Migration
      │
      ▼
Employee Workflow Tests
      │
      ▼
HR/Admin Workflow Tests
      │
      ▼
RLS Security Tests
      │
      ▼
Production Migration
      │
      ▼
Vercel Deployment
      │
      ▼
Production Smoke Tests
```

> Do not run `supabase/seed.sql` against production unless you have explicitly verified that doing so is intended and safe.

---

# ☁️ Deployment Architecture

```text
┌─────────────────┐
│     GitHub      │
└────────┬────────┘
         │
         │ push
         ▼
┌─────────────────┐
│     Vercel      │
│                 │
│   Next.js App   │
└────────┬────────┘
         │
         │ secure API/database access
         ▼
┌─────────────────────────────┐
│          Supabase           │
│                             │
│ Auth │ PostgreSQL │ Storage │
│ RLS  │ RPC        │ Triggers│
└─────────────────────────────┘
```

---

# 📚 Engineering Documentation

The repository contains dedicated release documentation.

### Production Audit

```text
docs/DAYFLOW_PRODUCTION_AUDIT.md
```

Contains the engineering findings discovered during the production review.

### Production Plan

```text
docs/DAYFLOW_PRODUCTION_PLAN.md
```

Contains the release sequence and remaining production validation work.

---

# 🧭 Engineering Principles

Dayflow is developed around a small set of non-negotiable principles.

```text
┌─────────────────────────────────────┐
│                                     │
│   Truthful data > fake dashboards   │
│                                     │
│   Security > convenience            │
│                                     │
│   Authorization > hidden buttons    │
│                                     │
│   Clarity > complexity              │
│                                     │
│   Consistency > duplication         │
│                                     │
│   Accessibility > decoration        │
│                                     │
│   Reliability > shortcuts           │
│                                     │
└─────────────────────────────────────┘
```

---

# 🗺️ Roadmap

Dayflow has a strong foundation, but the product can continue evolving.

Future areas include:

- [ ] Complete authenticated E2E test suite
- [ ] Full WCAG AA accessibility audit
- [ ] Advanced organization analytics
- [ ] Richer payroll processing
- [ ] Smarter attendance insights
- [ ] Improved leave analytics
- [ ] Expanded notification preferences
- [ ] Advanced document lifecycle management
- [ ] Organization branding
- [ ] Multi-organization architecture
- [ ] Organization-specific currencies
- [ ] Organization-specific time zones
- [ ] Expanded audit capabilities
- [ ] Mobile-first refinements
- [ ] Progressive Web App capabilities
- [ ] Additional automated security testing
- [ ] Advanced reporting and exports

---

# 🤝 Contributing

Contributions, suggestions and issue reports are welcome.

A typical contribution flow:

```bash
git checkout -b feature/your-feature
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

Then open a Pull Request.

For substantial changes, document the reasoning and test the affected workflows before requesting review.

---

# 🔐 Security Notice

If you discover a security vulnerability, avoid publishing sensitive exploitation details in a public issue.

Sensitive values such as:

```text
SUPABASE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY
database passwords
private tokens
```

must never be committed to the repository.

---

# 📜 License

Copyright © 2026 Dayflow Team.

All rights reserved unless a separate repository license states otherwise.

---

<div align="center">

<br>

# ✦ DAYFLOW

### Your people. One clear flow.

**Modern HR operations without the enterprise complexity.**

<br>

Built with

**Next.js × TypeScript × Supabase × PostgreSQL × Vercel**

<br>

---

### Built for people. Engineered for trust.

⭐ **If you like Dayflow, consider starring the repository.**

</div>
