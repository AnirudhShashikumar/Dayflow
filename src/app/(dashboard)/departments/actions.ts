"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function saveDepartment(formData: FormData) {
  await requireProfile(["admin"]);
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 2 || name.length > 100 || !/^[A-Z0-9_-]{2,20}$/.test(code) || description.length > 500) throw new Error("Check the department details.");
  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({ name, code, description: description || null });
  if (error) {
    console.error("Department save failed", { code: error.code });
    throw new Error("Department could not be saved. Its name or code may already exist.");
  }
  revalidatePath("/departments");
}

export async function toggleDepartment(formData: FormData) {
  await requireProfile(["admin"]);
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Department not found.");
  const supabase = await createClient();
  const { error } = await supabase.from("departments").update({ active: String(formData.get("active")) === "true" }).eq("id", id);
  if (error) {
    console.error("Department update failed", { code: error.code });
    throw new Error("Department could not be updated.");
  }
  revalidatePath("/departments");
}
