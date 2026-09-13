import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { csvResponse } from "@/lib/csv";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export async function GET(request: Request) {
  await requireProfile(["hr", "admin"]);
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const department = url.searchParams.get("department");
  if ((from && !datePattern.test(from)) || (to && !datePattern.test(to)) || (from && to && from > to) ||
    (department && !/^[0-9a-f-]{36}$/i.test(department))) return new Response("Invalid report filters", { status: 400 });
  const supabase = await createClient();
  let employeeIds: string[] | null = null;
  if (department) {
    const { data, error } = await supabase.from("employee_profiles").select("id").eq("department_id", department);
    if (error) return new Response("Export unavailable", { status: 500 });
    employeeIds = (data ?? []).map((employee) => employee.id);
  }
  const header = "Employee,Employee ID,Leave Type,Start,End,Days,Status,Remarks";
  if (employeeIds?.length === 0) return csvResponse(header, [], "dayflow-leave-report.csv");
  let query = supabase.from("leave_requests")
    .select("start_date,end_date,duration_days,status,remarks,leave_type:leave_types(name),employee:employee_profiles(employee_code,profile:profiles(full_name))")
    .order("start_date", { ascending: false }).limit(1000);
  if (from) query = query.gte("start_date", from);
  if (to) query = query.lte("end_date", to);
  if (employeeIds) query = query.in("employee_id", employeeIds);
  const { data, error } = await query;
  if (error) {
    console.error("Leave report export failed", { code: error.code });
    return new Response("Export unavailable", { status: 500 });
  }
  if ((data?.length ?? 0) === 1000) return new Response("Too many records. Narrow the export filters.", { status: 413 });
  const rows = (data ?? []).map((record) => {
    const employee = Array.isArray(record.employee) ? record.employee[0] : record.employee;
    const profile = employee ? (Array.isArray(employee.profile) ? employee.profile[0] : employee.profile) : null;
    const leaveType = Array.isArray(record.leave_type) ? record.leave_type[0] : record.leave_type;
    return [profile?.full_name, employee?.employee_code, leaveType?.name, record.start_date, record.end_date,
      record.duration_days, record.status, record.remarks];
  });
  return csvResponse(header, rows, "dayflow-leave-report.csv");
}
