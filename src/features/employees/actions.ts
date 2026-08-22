"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";

export async function updateOwnProfile(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: employee } = await supabase.from("employee_profiles").select("id").eq("profile_id", profile.id).single();
  if (!employee) throw new Error("Employee profile not found");
  const { error } = await supabase.from("employee_profiles").update({
    phone: String(formData.get("phone") ?? "") || null,
    address: String(formData.get("address") ?? "") || null,
    emergency_contact_name: String(formData.get("emergencyName") ?? "") || null,
    emergency_contact_phone: String(formData.get("emergencyPhone") ?? "") || null,
  }).eq("id", employee.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile");
}

export async function setEmploymentStatus(formData: FormData) {
  await requireProfile(["hr", "admin"]);
  const id = String(formData.get("employeeId"));
  const status = String(formData.get("status"));
  if (!["active", "inactive"].includes(status)) throw new Error("Invalid status");
  const supabase = await createClient();
  const { data: employee, error } = await supabase.from("employee_profiles").update({ employment_status: status }).eq("id", id).select("profile_id").single();
  if (error) throw new Error(error.message);
  await supabase.from("profiles").update({ account_status: status }).eq("id", employee.profile_id);
  await supabase.rpc("write_management_audit", { p_action: `employee.${status === "active" ? "activated" : "deactivated"}`, p_entity_type: "employee", p_entity_id: id, p_summary: `Employee ${status === "active" ? "activated" : "deactivated"}`, p_metadata: {} });
  revalidatePath("/employees");
}

export async function updateEmployee(formData: FormData) {
  const actor = await requireProfile(["hr", "admin"]);
  const id = String(formData.get("employeeId"));
  const profileId = String(formData.get("profileId"));
  const requestedRole = String(formData.get("role") ?? "");
  const profileUpdate: Record<string, string> = { full_name: String(formData.get("fullName")), email: String(formData.get("email")) };
  if (actor.role === "admin" && ["employee", "hr", "admin"].includes(requestedRole)) profileUpdate.role = requestedRole;
  const supabase = await createClient();
  const { error: profileError } = await supabase.from("profiles").update(profileUpdate).eq("id", profileId);
  if (profileError) throw new Error(profileError.message);
  const { error } = await supabase.from("employee_profiles").update({
    department_id: String(formData.get("departmentId")) || null,
    designation: String(formData.get("designation")),
    employment_type: String(formData.get("employmentType")),
    joining_date: String(formData.get("joiningDate")),
    phone: String(formData.get("phone")) || null,
  }).eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.rpc("write_management_audit", { p_action: "employee.updated", p_entity_type: "employee", p_entity_id: id, p_summary: "Employee profile updated", p_metadata: { role: profileUpdate.role ?? "unchanged" } });
  if (profileUpdate.role) await supabase.rpc("write_management_audit", { p_action: "role.changed", p_entity_type: "profile", p_entity_id: profileId, p_summary: `Role changed to ${profileUpdate.role}`, p_metadata: { role: profileUpdate.role } });
  revalidatePath(`/employees/${id}`);
  revalidatePath("/employees");
}

export async function createEmployee(formData: FormData) {
  const actor = await requireProfile(["hr", "admin"]);
  const email = String(formData.get("email")).trim().toLowerCase();
  const fullName = String(formData.get("fullName")).trim();
  const employeeCode = String(formData.get("employeeCode")).trim().toUpperCase();
  const password = String(formData.get("password"));
  const requestedRole = String(formData.get("role") ?? "employee");
  const role = actor.role === "admin" && ["employee", "hr", "admin"].includes(requestedRole) ? requestedRole : "employee";
  if (!email.includes("@") || fullName.length < 2 || employeeCode.length < 3 || password.length < 8) throw new Error("Enter valid employee details and an 8+ character temporary password");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName, employee_code: employeeCode } });
  if (error || !data.user) throw new Error(error?.message ?? "Could not create employee");
  if (role !== "employee") await admin.from("profiles").update({ role }).eq("id", data.user.id);
  const { data: employee, error: updateError } = await admin.from("employee_profiles").update({
    department_id: String(formData.get("departmentId")) || null,
    designation: String(formData.get("designation")) || "Employee",
    employment_type: String(formData.get("employmentType")) || "full_time",
    joining_date: String(formData.get("joiningDate")),
  }).eq("profile_id", data.user.id).select("id").single();
  if (updateError) { await admin.auth.admin.deleteUser(data.user.id); throw new Error(updateError.message); }
  const supabase = await createClient();
  await supabase.rpc("write_management_audit", { p_action: "employee.created", p_entity_type: "employee", p_entity_id: employee.id, p_summary: `Created employee ${fullName}`, p_metadata: { employee_code: employeeCode, role, created_by: actor.id } });
  revalidatePath("/employees");
}
