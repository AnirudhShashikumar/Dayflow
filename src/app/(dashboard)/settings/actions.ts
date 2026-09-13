"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function updateOrganization(formData: FormData) {
  await requireProfile(["admin"]);
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const currency = String(formData.get("currency") ?? "").trim();
  const workdayStart = String(formData.get("workdayStart") ?? "");
  const workdayEnd = String(formData.get("workdayEnd") ?? "");
  if (name.length < 2 || name.length > 120 || !/^[A-Z]{3}$/.test(currency) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(workdayStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(workdayEnd)) {
    throw new Error("Check the organization settings fields.");
  }
  try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date()); }
  catch { throw new Error("Choose a valid IANA timezone, such as Asia/Kolkata."); }
  const supabase = await createClient();
  const { data, error: lookupError } = await supabase.from("organization_settings").select("id").order("created_at").limit(1).maybeSingle();
  if (lookupError) throw new Error("Organization settings could not be loaded.");
  const payload = { organization_name: name, timezone, currency, workday_start: workdayStart, workday_end: workdayEnd };
  const { error } = data ? await supabase.from("organization_settings").update(payload).eq("id", data.id) : await supabase.from("organization_settings").insert(payload);
  if (error) {
    console.error("Organization settings update failed", { code: error.code });
    throw new Error("Organization settings could not be saved.");
  }
  revalidatePath("/settings");
  revalidatePath("/home");
  revalidatePath("/hr");
  revalidatePath("/admin");
}
