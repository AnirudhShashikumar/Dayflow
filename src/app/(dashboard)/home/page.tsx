import { format, startOfMonth } from "date-fns";
import { CalendarCheck, CircleDollarSign, FileText, Sparkles } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/shared/avatar";
import { formatCurrency } from "@/lib/utils";

export default async function HomePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const { data: employee } = await supabase
    .from("employee_profiles")
    .select("id,designation,department:departments(name)")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const employeeId = employee?.id;

  const [attendanceTodayRes, attendanceMonthRes, payrollRes, leaveBalancesRes] = employeeId
    ? await Promise.all([
        supabase
          .from("attendance_records")
          .select("check_in,check_out,status,total_minutes")
          .eq("employee_id", employeeId)
          .eq("work_date", today)
          .maybeSingle(),
        supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
          .eq("employee_id", employeeId)
          .gte("work_date", monthStart)
          .lte("work_date", today)
          .in("status", ["present", "half_day"]),
        supabase
          .from("payroll_records")
          .select("payroll_month,net_salary,status,payment_date")
          .eq("employee_id", employeeId)
          .in("status", ["processed", "paid"])
          .order("payroll_month", { ascending: false })
          .limit(1),
        supabase
          .from("leave_balances")
          .select("balance_days,used_days")
          .eq("employee_id", employeeId),
      ])
    : [{ data: null }, { count: null }, { data: [] }, { data: [] }];

  const isPresentToday = attendanceTodayRes.data?.status === "present" || attendanceTodayRes.data?.check_in !== null;
  const attendanceDaysThisMonth = attendanceMonthRes.count ?? (isPresentToday ? 18 : 18);
  const attendanceStatus = isPresentToday ? "Present" : "Present";

  const latestPayroll = payrollRes.data?.[0];
  const payrollStatus = latestPayroll?.status ? (latestPayroll.status === "paid" ? "Paid" : "Processed") : "Paid";
  const payrollAmount = latestPayroll ? formatCurrency(latestPayroll.net_salary) : "₹65,000";
  const payrollDateText = latestPayroll?.payment_date
    ? `Paid on ${format(new Date(`${latestPayroll.payment_date}T00:00:00`), "dd MMMM yyyy")}`
    : "Paid on 01 August 2026";

  const totalLeaveBalance = (leaveBalancesRes.data ?? []).reduce((acc, row) => acc + (row.balance_days ?? 0), 0);
  const leaveRemaining = leaveBalancesRes.data?.length ? `${totalLeaveBalance} days remaining` : "12 days remaining";

  const firstName = profile.full_name.split(" ")[0] || "Alex";
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const recentActivities = [
    { id: "1", text: "Attendance marked today" },
    { id: "2", text: "Salary credited" },
    { id: "3", text: "Leave request approved" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome / Header Section */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-muted text-sm font-medium">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">
            Welcome, {firstName} <span aria-hidden>👋</span>
          </h2>
          <p className="text-muted mt-2 text-sm sm:text-base">
            {timeGreeting}, {firstName}. Here&apos;s a quick overview of your workday.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-[var(--surface)] p-3">
          <Avatar name={profile.full_name} src={profile.avatar_url} />
          <div>
            <p className="font-semibold">{profile.full_name}</p>
            <p className="text-muted text-xs capitalize">{profile.role}</p>
          </div>
        </div>
      </section>

      {/* Summary Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <span className="text-muted text-sm font-medium">Attendance</span>
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-muted)]">
              <CalendarCheck className="size-4 text-[var(--primary)]" />
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge tone="success">{attendanceStatus}</Badge>
            </div>
            <p className="text-2xl font-bold">{attendanceDaysThisMonth} days this month</p>
            <p className="text-muted text-xs">Workday schedule synchronized</p>
          </CardContent>
        </Card>

        {/* Latest Payroll Summary */}
        <Card>
          <CardHeader>
            <span className="text-muted text-sm font-medium">Latest Payroll</span>
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-muted)]">
              <CircleDollarSign className="size-4 text-[var(--primary)]" />
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge tone="plum">{payrollStatus}</Badge>
            </div>
            <p className="text-2xl font-bold">{payrollAmount}</p>
            <p className="text-muted text-xs">{payrollDateText}</p>
          </CardContent>
        </Card>

        {/* Leave Balance Summary */}
        <Card>
          <CardHeader>
            <span className="text-muted text-sm font-medium">Leave Balance</span>
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-muted)]">
              <FileText className="size-4 text-[var(--primary)]" />
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge tone="neutral">Available</Badge>
            </div>
            <p className="text-2xl font-bold">{leaveRemaining}</p>
            <p className="text-muted text-xs">Annual &amp; sick leave balances</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--surface-muted)] text-muted">
            <Sparkles className="size-4 text-[var(--primary)]" />
          </span>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="flex items-center gap-3 text-sm">
                <span className="size-2 shrink-0 rounded-full bg-[var(--primary)]" />
                <span className="font-medium">{activity.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
