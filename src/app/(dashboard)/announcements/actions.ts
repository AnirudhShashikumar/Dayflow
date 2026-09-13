"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function publishAnnouncement(formData: FormData) {
  await requireProfile(["hr", "admin"]);
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const priority = String(formData.get("priority") ?? "");
  const expiry = String(formData.get("expiryDate") ?? "");
  if (title.length < 2 || title.length > 120 || message.length < 2 || message.length > 2000 ||
    !["normal", "important", "urgent"].includes(priority) || (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry))) {
    throw new Error("Check the announcement details and try again.");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_announcement", {
    p_title: title, p_message: message, p_priority: priority, p_expiry_date: expiry || null,
  });
  if (error) {
    console.error("Announcement publication failed", { code: error.code });
    throw new Error("The announcement could not be published. Check its expiry date and try again.");
  }
  revalidatePath("/announcements");
  revalidatePath("/home");
  revalidatePath("/hr");
  revalidatePath("/admin");
  revalidatePath("/notifications");
}

export async function toggleAnnouncement(formData: FormData) {
  await requireProfile(["hr", "admin"]);
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Announcement not found.");
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").update({ active: String(formData.get("active")) === "true" }).eq("id", id);
  if (error) {
    console.error("Announcement update failed", { code: error.code });
    throw new Error("The announcement could not be updated.");
  }
  revalidatePath("/announcements");
  revalidatePath("/home");
}
