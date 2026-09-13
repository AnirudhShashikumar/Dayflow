import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  await requireProfile(["hr", "admin"]);
  const month = new URL(request.url).searchParams.get("month");
  if (month && !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) return new Response("Invalid payroll month", { status: 400 });
  let query = (await createClient()).from("payroll_records")
    .select("payroll_month,basic_salary,allowances,deductions,gross_salary,net_salary,status,payment_date,employee:employee_profiles(employee_code,profile:profiles(full_name))")
    .order("payroll_month", { ascending: false }).limit(1000);
  if (month) query = query.eq("payroll_month", month);
  const { data, error } = await query;
  if (error) {
    console.error("Payroll export failed", { code: error.code });
    return new Response("Export unavailable", { status: 500 });
  }
  if ((data?.length ?? 0) === 1000) return new Response("Too many records. Narrow the export filters.", { status: 413 });
  const rows = (data ?? []).map((record) => {
    const employee = Array.isArray(record.employee) ? record.employee[0] : record.employee;
    const profile = employee ? (Array.isArray(employee.profile) ? employee.profile[0] : employee.profile) : null;
    return [profile?.full_name, employee?.employee_code, record.payroll_month, record.basic_salary, record.allowances,
      record.deductions, record.gross_salary, record.net_salary, record.status, record.payment_date];
  });
  return csvResponse("Employee,Employee ID,Month,Basic,Allowances,Deductions,Gross,Net,Status,Payment Date", rows, "dayflow-payroll.csv");
}
