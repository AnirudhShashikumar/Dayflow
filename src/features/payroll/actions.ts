"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { payrollTotals } from "@/lib/validations/business";

function payrollError(message: string) {
  if (message.includes("Published payroll cannot be edited")) return "Published payroll cannot be edited. Contact an administrator to resolve a correction.";
  if (message.includes("Invalid payroll status transition")) return "Payroll status changed. Refresh the page and try again.";
  if (message.includes("Invalid payroll amounts")) return "Enter valid amounts; deductions cannot exceed gross pay.";
  return "Payroll could not be saved. Please try again.";
}

export async function savePayroll(formData: FormData) {
  await requireProfile(["hr", "admin"]);
  const employeeId = String(formData.get("employeeId") ?? "");
  const month = String(formData.get("month") ?? "");
  const basic = Number(formData.get("basic"));
  const allowances = Number(formData.get("allowances"));
  const deductions = Number(formData.get("deductions"));
  if (!/^[0-9a-f-]{36}$/i.test(employeeId) || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month) ||
    [basic, allowances, deductions].some((value) => !Number.isFinite(value))) throw new Error("Enter valid payroll details.");
  payrollTotals(basic, allowances, deductions);
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_payroll_draft", {
    p_employee_id: employeeId, p_month: month, p_basic: basic, p_allowances: allowances, p_deductions: deductions,
  });
  if (error) {
    console.error("Payroll draft failed", { code: error.code });
    throw new Error(payrollError(error.message));
  }
  revalidatePath("/payroll");
}

export async function setPayrollStatus(formData: FormData) {
  await requireProfile(["hr", "admin"]);
  const id = String(formData.get("payrollId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["processed", "paid"].includes(status)) throw new Error("Invalid payroll request.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_payroll", { p_payroll_id: id, p_status: status });
  if (error) {
    console.error("Payroll publication failed", { code: error.code });
    throw new Error(payrollError(error.message));
  }
  revalidatePath("/payroll");
  revalidatePath("/hr");
  revalidatePath("/admin");
  revalidatePath("/home");
}
