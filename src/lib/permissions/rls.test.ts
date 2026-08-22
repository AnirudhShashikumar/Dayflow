// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const sql=readFileSync(resolve(process.cwd(),"supabase/migrations/202608220001_initial_schema.sql"),"utf8");
describe("database isolation contract",()=>{
  it.each(["profiles","employee_profiles","attendance_records","leave_requests","payroll_records","employee_documents","notifications"])("enables RLS for %s",table=>expect(sql).toContain(`alter table public.${table} enable row level security`));
  it("guards employee payroll and documents",()=>{expect(sql).toContain("employee_id=public.current_employee_id() and status in('processed','paid')");expect(sql).toContain("employee_id=public.current_employee_id() and visibility='employee'")});
  it("prevents duplicate attendance and performs leave review atomically",()=>{expect(sql).toContain("unique(employee_id, work_date)");expect(sql).toContain("for update");expect(sql).toContain("update leave_balances")});
});
