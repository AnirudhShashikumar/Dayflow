"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";

export type AttendanceActionState = { error?: string; success?: string };

export async function checkIn(): Promise<AttendanceActionState> {
  await requireProfile(); const supabase = await createClient(); const { error } = await supabase.rpc("check_in");
  if (error) return { error: error.message.includes("already") ? "You have already checked in today." : error.message };
  revalidatePath("/overview"); revalidatePath("/attendance"); return { success: "Checked in successfully." };
}

export async function checkOut(): Promise<AttendanceActionState> {
  await requireProfile(); const supabase = await createClient(); const { error } = await supabase.rpc("check_out");
  if (error) return { error: error.message.includes("check-in") ? "Check in before checking out." : error.message };
  revalidatePath("/overview"); revalidatePath("/attendance"); return { success: "Checked out successfully." };
}

export async function correctAttendance(formData: FormData) {
  const profile=await requireProfile(["hr","admin"]); const id=String(formData.get("recordId")); const reason=String(formData.get("reason")??"").trim();
  if(reason.length<3)throw new Error("A correction reason is required."); const checkIn=String(formData.get("checkIn")??""); const checkOut=String(formData.get("checkOut")??""); const status=String(formData.get("status")??"present");
  if(checkOut&&new Date(checkOut)<new Date(checkIn))throw new Error("Check-out must be after check-in."); const total=checkOut&&checkIn?Math.floor((new Date(checkOut).getTime()-new Date(checkIn).getTime())/60000):0;
  const supabase=await createClient(); const{data:record,error}=await supabase.from("attendance_records").update({check_in:checkIn||null,check_out:checkOut||null,total_minutes:total,status,source:"hr_correction",modified_by:profile.id,modification_reason:reason}).eq("id",id).select("employee:employee_profiles(profile_id)").single(); if(error)throw new Error(error.message);
  const employee=Array.isArray(record.employee)?record.employee[0]:record.employee;if(employee)await supabase.from("notifications").insert({recipient_id:employee.profile_id,title:"Attendance corrected",message:`HR corrected an attendance record: ${reason}`,category:"attendance",related_entity_type:"attendance",related_entity_id:id,link:"/attendance"});
  await supabase.rpc("write_management_audit",{p_action:"attendance.corrected",p_entity_type:"attendance",p_entity_id:id,p_summary:"Attendance record corrected",p_metadata:{reason}}); revalidatePath("/attendance"); revalidatePath("/hr");
}
