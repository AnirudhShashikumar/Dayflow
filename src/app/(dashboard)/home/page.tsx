import Link from "next/link";
import { format } from "date-fns";
import {
  Activity,
  Bell,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileBarChart,
  FileText,
  LayoutDashboard,
  Megaphone,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

const employeeLinks = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard, description: "Your dashboard summary" },
  { label: "Attendance", href: "/attendance", icon: CalendarDays, description: "Track your hours" },
  { label: "Leave", href: "/leave", icon: FileText, description: "Manage time off" },
  { label: "Payroll", href: "/payroll", icon: CircleDollarSign, description: "View payslips" },
  { label: "Documents", href: "/documents", icon: FileText, description: "Your files" },
  { label: "Notifications", href: "/notifications", icon: Bell, description: "Stay updated" },
  { label: "Profile", href: "/profile", icon: UserRound, description: "Your information" },
  { label: "Settings", href: "/settings", icon: Settings, description: "Preferences" },
] as const;

const managementLinks = [
  { label: "Overview", href: "/hr", icon: LayoutDashboard, description: "Operations dashboard" },
  { label: "Employees", href: "/employees", icon: Users, description: "Manage your team" },
  { label: "Attendance", href: "/attendance", icon: CalendarDays, description: "Track attendance" },
  { label: "Leave Requests", href: "/leave", icon: FileText, description: "Approve time off" },
  { label: "Payroll", href: "/payroll", icon: CircleDollarSign, description: "Process pay runs" },
  { label: "Reports", href: "/reports", icon: FileBarChart, description: "Analytics & insights" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, description: "Broadcast updates" },
  { label: "Departments", href: "/departments", icon: Building2, description: "Org structure" },
  { label: "Activity Log", href: "/activity", icon: Activity, description: "Audit trail" },
  { label: "Settings", href: "/settings", icon: Settings, description: "Workspace settings" },
] as const;

export default async function HomePage() {
  const profile = await requireProfile();
  const links = profile.role === "employee" ? employeeLinks : managementLinks;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile.full_name.split(" ")[0];

  return (
    <div className="flex h-[calc(100vh-4.5rem-2rem)] flex-col overflow-hidden sm:h-[calc(100vh-4.5rem-3rem)] lg:h-[calc(100vh-4.5rem-4rem)]">
      {/* Welcome header */}
      <div className="flex shrink-0 flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {firstName} <span aria-hidden>👋</span>
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Where would you like to go today?</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border bg-[var(--surface)] p-3">
          <Avatar name={profile.full_name} src={profile.avatar_url} />
          <div>
            <p className="font-semibold leading-tight">{profile.full_name}</p>
            <Badge tone={profile.role === "employee" ? "neutral" : "plum"} className="mt-1 px-1.5 py-0 text-[9px]">
              {profile.role}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick-access grid — fills remaining height, no scroll */}
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {links.map(({ label, href, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-0 flex-col items-start justify-between overflow-hidden rounded-2xl border bg-[var(--surface)] p-4 transition hover:border-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_5%,transparent)]"
          >
            <span className="mb-2 grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-muted)] transition group-hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]">
              <Icon className="size-5 text-[var(--primary)]" />
            </span>
            <div className="min-h-0">
              <p className="font-semibold leading-tight">{label}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted-foreground)]">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
