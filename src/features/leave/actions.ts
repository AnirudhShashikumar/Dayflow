"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { leaveSchema } from "@/lib/validations/business";

export type LeaveActionState = { error?: string; success?: string };

function leaveMessage(message: string) {
  if (message.includes("overlaps")) return "These dates overlap an existing leave request.";
  if (message.includes("Insufficient")) return "Your available balance does not cover this request.";
  if (message.includes("Past dates")) return "Choose today or a future date.";
  if (message.includes("calendar year")) return "Submit a separate request for each calendar year.";
  if (message.includes("Attendance already exists")) return "Attendance is already recorded for a requested day. Review that record first.";
  if (message.includes("pending")) return "This request is no longer pending. Refresh the page.";
  return "The leave request could not be updated. Please try again.";
}

export async function submitLeave(_: LeaveActionState, formData: FormData): Promise<LeaveActionState> {
  await requireProfile();
  const parsed = leaveSchema.safeParse({
    leaveTypeId: formData.get("leaveTypeId"), startDate: formData.get("startDate"),
    endDate: formData.get("endDate"), isHalfDay: formData.get("isHalfDay") === "on", remarks: formData.get("remarks"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the request fields." };
  const supabase = await createClient();
  const data = parsed.data;
  const { error } = await supabase.rpc("submit_leave", {
    p_leave_type_id: data.leaveTypeId, p_start: data.startDate, p_end: data.endDate,
    p_half_day: data.isHalfDay, p_remarks: data.remarks, p_attachment: null,
  });
  if (error) {
    console.error("Leave submission failed", { code: error.code });
    return { error: leaveMessage(error.message) };
  }
  revalidatePath("/leave"); revalidatePath("/home"); revalidatePath("/hr");
  return { success: "Leave request submitted for HR review." };
}

export async function reviewLeave(_: LeaveActionState, formData: FormData): Promise<LeaveActionState> {
  await requireProfile(["hr", "admin"]);
  const id = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["approved", "rejected"].includes(decision) || comment.length < 2 || comment.length > 500) return { error: "Add a review comment and choose a decision." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_leave", { p_request_id: id, p_decision: decision, p_comment: comment });
  if (error) {
    console.error("Leave review failed", { code: error.code });
    return { error: leaveMessage(error.message) };
  }
  revalidatePath("/leave"); revalidatePath("/hr"); revalidatePath("/admin"); revalidatePath("/home"); revalidatePath("/attendance");
  return { success: `Request ${decision}.` };
}

export async function cancelLeave(_: LeaveActionState, formData: FormData): Promise<LeaveActionState> {
  await requireProfile(["employee"]);
  const id = String(formData.get("requestId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Request not found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_leave", { p_request_id: id });
  if (error) {
    console.error("Leave cancellation failed", { code: error.code });
    return { error: leaveMessage(error.message) };
  }
  revalidatePath("/leave"); revalidatePath("/home");
  return { success: "Request cancelled." };
}
