import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { dashboardPath } from "@/lib/permissions";
import type { Profile, UserRole } from "@/types/domain";

export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("id,email,full_name,role,avatar_url,account_status").eq("id", user.id).maybeSingle();
  if (error) throw new Error("Unable to load account access");
  return data as Profile | null;
});

export type ViewerContext = {
  profile: Profile;
  employee: {
    id: string;
    employeeCode: string;
    designation: string;
    department: string | null;
  } | null;
};

export const getViewerContext = cache(async (): Promise<ViewerContext | null> => {
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("employee_profiles")
    .select("id,employee_code,designation,department:departments(name)")
    .eq("profile_id", profile.id).maybeSingle();
  if (error) throw new Error("Unable to load employee identity");
  const department = Array.isArray(data?.department) ? data.department[0] : data?.department;
  return { profile, employee: data ? {
    id: data.id,
    employeeCode: data.employee_code,
    designation: data.designation,
    department: department?.name ?? null,
  } : null };
});

export async function requireProfile(roles?: UserRole[]) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.account_status !== "active") redirect("/login?error=inactive");
  if (roles && !roles.includes(profile.role)) redirect(dashboardPath(profile.role));
  return profile;
}
