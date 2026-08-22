# Architecture

Dayflow is a Next.js App Router application with Server Components for database reads and Server Actions/PostgreSQL RPC functions for mutations. Client Components are limited to clocks, charts, theme/navigation state, forms needing immediate feedback, and toasts.

The browser authenticates through Supabase Auth. `src/proxy.ts` refreshes sessions and guards private route families. Page-level `requireProfile` calls enforce role entry, every action rechecks the role, and RLS is the final authorization layer. Attendance and leave transitions that require concurrency safety run as `security definer` PostgreSQL functions using row locks and server-generated `now()` timestamps.

The Storage bucket is private. Metadata stays in `employee_documents`; RLS verifies ownership/visibility, and downloads use five-minute signed URLs. Dashboards and reports calculate metrics from stored operational tables—no random analytics or AI claims.

Feature folders minimize cross-team conflicts. Shared app/layout/config changes require a lead review.
