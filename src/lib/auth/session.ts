import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Profile, UserRole } from "@/types/domain";

export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("id,email,full_name,role,avatar_url,account_status").eq("id", user.id).single();
  return data as Profile | null;
});

export async function requireProfile(roles?: UserRole[]) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.account_status !== "active") redirect("/login?error=inactive");
  if (roles && !roles.includes(profile.role)) redirect(profile.role === "employee" ? "/overview" : "/hr");
  return profile;
}
