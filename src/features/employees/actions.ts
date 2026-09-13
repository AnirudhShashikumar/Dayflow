"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";

export type ProfileActionState = { error?: string; success?: string };

export async function updateOwnProfile(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const profile = await requireProfile();
  const fields = {
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    emergency_contact_name: String(formData.get("emergencyName") ?? "").trim(),
    emergency_contact_phone: String(formData.get("emergencyPhone") ?? "").trim(),
  };
  if (fields.phone.length > 30 || fields.address.length > 500 || fields.emergency_contact_name.length > 100 || fields.emergency_contact_phone.length > 30) {
    return { error: "A field is too long. Check your contact details." };
  }
  const supabase = await createClient();
  const { data: employee, error: lookupError } = await supabase.from("employee_profiles").select("id").eq("profile_id", profile.id).single();
  if (lookupError || !employee) return { error: "Your employee profile could not be loaded." };
  const { error } = await supabase.from("employee_profiles").update({
    phone: fields.phone || null,
    address: fields.address || null,
    emergency_contact_name: fields.emergency_contact_name || null,
    emergency_contact_phone: fields.emergency_contact_phone || null,
  }).eq("id", employee.id);
  if (error) {
    console.error("Personal profile update failed", { code: error.code });
    return { error: "Your details could not be saved. Please try again." };
  }
  revalidatePath("/profile");
  return { success: "Your personal details were saved." };
}

export async function setEmploymentStatus(formData: FormData) {
  await requireProfile(["hr", "admin"]);
  const id = String(formData.get("employeeId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["active", "inactive"].includes(status)) throw new Error("Invalid employee request.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_employee_status", { p_employee_id: id, p_status: status });
  if (error) {
    console.error("Employee status update failed", { code: error.code });
    throw new Error(error.message.includes("own account") ? "You cannot deactivate your own account." : "Employee status could not be updated.");
  }
  revalidatePath("/employees");
}

export async function updateEmployee(formData: FormData) {
  const actor = await requireProfile(["hr", "admin"]);
  const id = String(formData.get("employeeId") ?? "");
  const role = actor.role === "admin" ? String(formData.get("role") ?? "") : "";
  const payload = {
    p_employee_id: id,
    p_name: String(formData.get("fullName") ?? "").trim(),
    p_designation: String(formData.get("designation") ?? "").trim(),
    p_department_id: String(formData.get("departmentId") ?? "") || null,
    p_employment_type: String(formData.get("employmentType") ?? ""),
    p_joining_date: String(formData.get("joiningDate") ?? ""),
    p_phone: String(formData.get("phone") ?? ""),
    p_role: role || null,
  };
  if (!/^[0-9a-f-]{36}$/i.test(id) || payload.p_name.length < 2 || payload.p_designation.length < 2 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(payload.p_joining_date) || (role && !["employee", "hr", "admin"].includes(role))) {
    throw new Error("Enter valid employee details.");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_employee_job", payload);
  if (error) {
    console.error("Employee update failed", { code: error.code });
    throw new Error("Employee details could not be saved. Check the fields and try again.");
  }
  revalidatePath(`/employees/${id}`);
  revalidatePath("/employees");
  revalidatePath("/profile");
}

export async function createEmployee(formData: FormData) {
  const actor = await requireProfile(["hr", "admin"]);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const employeeCode = String(formData.get("employeeCode") ?? "").trim().toUpperCase();
  const password = String(formData.get("password") ?? "");
  const requestedRole = String(formData.get("role") ?? "employee");
  const role = actor.role === "admin" && ["employee", "hr", "admin"].includes(requestedRole) ? requestedRole : "employee";
  if (!email.includes("@") || fullName.length < 2 || employeeCode.length < 3 || password.length < 8) throw new Error("Enter valid employee details and an 8+ character temporary password.");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
  if (error || !data.user) {
    console.error("Employee provision failed", { code: error?.code });
    throw new Error("Employee account could not be created. Check for an existing email or employee ID.");
  }
  try {
    if (role !== "employee") {
      const { error: roleError } = await admin.from("profiles").update({ role }).eq("id", data.user.id);
      if (roleError) throw roleError;
    }
    const { data: employee, error: updateError } = await admin.from("employee_profiles").update({
      employee_code: employeeCode,
      department_id: String(formData.get("departmentId") ?? "") || null,
      designation: String(formData.get("designation") ?? "").trim(),
      employment_type: String(formData.get("employmentType") ?? "full_time"),
      joining_date: String(formData.get("joiningDate") ?? ""),
    }).eq("profile_id", data.user.id).select("id").single();
    if (updateError || !employee) throw updateError ?? new Error("Employee profile missing");
    const supabase = await createClient();
    const { error: auditError } = await supabase.rpc("write_management_audit", {
      p_action: "employee.created", p_entity_type: "employee", p_entity_id: employee.id,
      p_summary: `Created employee ${fullName}`, p_metadata: { employee_code: employeeCode, role, created_by: actor.id },
    });
    if (auditError) console.error("Employee audit failed", { code: auditError.code });
  } catch (provisionError) {
    await admin.auth.admin.deleteUser(data.user.id);
    console.error("Employee setup failed", { reason: provisionError instanceof Error ? provisionError.name : "unknown" });
    throw new Error("Employee account setup failed. Please try again.");
  }
  revalidatePath("/employees");
}
