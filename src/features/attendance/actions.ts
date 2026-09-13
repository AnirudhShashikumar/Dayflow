"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/organization";
import { parseBusinessLocal } from "@/lib/organization-date";

export type AttendanceActionState = { error?: string; success?: string };

export async function checkIn(): Promise<AttendanceActionState> {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.rpc("check_in");
  if (error) {
    console.error("Check-in failed", { code: error.code });
    return { error: error.message.includes("already") ? "Attendance is already recorded for today." : "Check-in failed. Please try again." };
  }
  revalidatePath("/home"); revalidatePath("/attendance");
  return { success: "Checked in successfully." };
}

export async function checkOut(): Promise<AttendanceActionState> {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.rpc("check_out");
  if (error) {
    console.error("Check-out failed", { code: error.code });
    return { error: error.message.includes("Check-in") ? "Check in before checking out." : "Check-out failed. Please try again." };
  }
  revalidatePath("/home"); revalidatePath("/attendance");
  return { success: "Checked out successfully." };
}

export async function correctAttendance(formData: FormData) {
  await requireProfile(["hr", "admin"]);
  const id = String(formData.get("recordId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const checkIn = String(formData.get("checkIn") ?? "");
  const checkOut = String(formData.get("checkOut") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || reason.length < 3 || reason.length > 500 || !["present", "absent", "half_day", "leave"].includes(status)) throw new Error("Check the attendance correction fields.");
  const { timezone } = await getOrganizationContext();
  const checkInUtc = checkIn ? parseBusinessLocal(checkIn, timezone) : null;
  const checkOutUtc = checkOut ? parseBusinessLocal(checkOut, timezone) : null;
  const supabase = await createClient();
  const { error } = await supabase.rpc("correct_attendance", {
    p_record_id: id, p_check_in: checkInUtc, p_check_out: checkOutUtc,
    p_status: status, p_reason: reason,
  });
  if (error) {
    console.error("Attendance correction failed", { code: error.code });
    throw new Error("Attendance could not be corrected. Check the times and work date.");
  }
  revalidatePath("/attendance");
  revalidatePath("/hr");
  revalidatePath("/admin");
  revalidatePath("/notifications");
}
