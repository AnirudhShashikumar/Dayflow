"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function refreshNotifications() {
  revalidatePath("/notifications");
  revalidatePath("/home");
  revalidatePath("/", "layout");
}

export async function markNotification(formData: FormData) {
  const profile = await requireProfile();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Notification not found.");
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id).eq("recipient_id", profile.id);
  if (error) {
    console.error("Notification read update failed", { code: error.code });
    throw new Error("Notification could not be marked read.");
  }
  refreshNotifications();
}

export async function markAllNotifications() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_id", profile.id).eq("is_read", false);
  if (error) {
    console.error("Notification read update failed", { code: error.code });
    throw new Error("Notifications could not be marked read.");
  }
  refreshNotifications();
}
