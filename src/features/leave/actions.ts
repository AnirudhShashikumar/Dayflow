"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { leaveSchema } from "@/lib/validations/business";

export type LeaveActionState = { error?: string; success?: string };
export async function submitLeave(_: LeaveActionState, formData: FormData): Promise<LeaveActionState> {
  await requireProfile(); const parsed=leaveSchema.safeParse({leaveTypeId:formData.get("leaveTypeId"),startDate:formData.get("startDate"),endDate:formData.get("endDate"),isHalfDay:formData.get("isHalfDay")==="on",remarks:formData.get("remarks")});
  if(!parsed.success)return{error:parsed.error.issues[0]?.message??"Check the request"}; const supabase=await createClient(); const d=parsed.data;
  const {error}=await supabase.rpc("submit_leave",{p_leave_type_id:d.leaveTypeId,p_start:d.startDate,p_end:d.endDate,p_half_day:d.isHalfDay,p_remarks:d.remarks,p_attachment:null});
  if(error)return{error:error.message}; revalidatePath("/leave");revalidatePath("/overview");return{success:"Leave request submitted for HR review."};
}
export async function reviewLeave(formData: FormData){await requireProfile(["hr","admin"]);const id=String(formData.get("requestId"));const decision=String(formData.get("decision"));const comment=String(formData.get("comment")??"");if(!["approved","rejected"].includes(decision))return;const supabase=await createClient();const{error}=await supabase.rpc("review_leave",{p_request_id:id,p_decision:decision,p_comment:comment});if(error)throw new Error(error.message);revalidatePath("/leave");revalidatePath("/hr");}
export async function cancelLeave(formData: FormData){await requireProfile(["employee"]);const supabase=await createClient();const{error}=await supabase.rpc("cancel_leave",{p_request_id:String(formData.get("requestId"))});if(error)throw new Error(error.message);revalidatePath("/leave");revalidatePath("/overview");}
