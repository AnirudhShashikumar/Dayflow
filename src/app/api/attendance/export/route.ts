import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { csvResponse } from "@/lib/csv";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export async function GET(request: Request) {
  await requireProfile(["hr", "admin"]);
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const status = url.searchParams.get("status");
  if ((from && !datePattern.test(from)) || (to && !datePattern.test(to)) || (from && to && from > to) ||
    (status && !["present", "absent", "half_day", "leave"].includes(status))) return new Response("Invalid export filters", { status: 400 });
  let query = (await createClient()).from("attendance_records")
    .select("work_date,check_in,check_out,total_minutes,status,source,employee:employee_profiles(employee_code,profile:profiles(full_name))")
    .order("work_date", { ascending: false }).limit(1000);
  if (from) query = query.gte("work_date", from);
  if (to) query = query.lte("work_date", to);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) {
    console.error("Attendance export failed", { code: error.code });
    return new Response("Export unavailable", { status: 500 });
  }
  if ((data?.length ?? 0) === 1000) return new Response("Too many records. Narrow the export filters.", { status: 413 });
  const rows = (data ?? []).map((record) => {
    const employee = Array.isArray(record.employee) ? record.employee[0] : record.employee;
    const profile = employee ? (Array.isArray(employee.profile) ? employee.profile[0] : employee.profile) : null;
    return [profile?.full_name, employee?.employee_code, record.work_date, record.check_in, record.check_out, record.total_minutes, record.status, record.source];
  });
  return csvResponse("Employee,Employee ID,Date,Check In,Check Out,Minutes,Status,Source", rows, "dayflow-attendance.csv");
}
