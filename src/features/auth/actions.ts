"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/business";
import { dashboardPath } from "@/lib/permissions";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import type { UserRole } from "@/types/domain";

export type ActionState = { error?: string; success?: string };

export async function signIn(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured yet. Add the project URL and anon key to .env.local." };
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "Email or password is incorrect." };
  const { data: profile } = await supabase.from("profiles").select("role,account_status").eq("id", data.user.id).single();
  if (!profile || profile.account_status !== "active") { await supabase.auth.signOut(); return { error: "This account is not active. Contact HR." }; }
  redirect(dashboardPath(profile.role as UserRole));
}

export async function register(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured yet. Add the project URL and anon key to .env.local." };
  const parsed = registerSchema.safeParse({ ...Object.fromEntries(formData), employeeCode: formData.get("employeeCode") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const { confirmPassword: _confirm, employeeCode, fullName, ...credentials } = parsed.data;
  void _confirm;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ ...credentials, options: { data: { full_name: fullName, employee_code: employeeCode, role: "employee" } } });
  return error ? { error: error.message } : { success: "Account created. Check your email to verify your address." };
}

export async function requestPasswordReset(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured yet. Add the project URL and anon key to .env.local." };
  const email = String(formData.get("email") ?? "");
  if (!loginSchema.shape.email.safeParse(email).success) return { error: "Enter a valid email." };
  const supabase = await createClient(); const { url } = getPublicEnv(); void url;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${appUrl}/auth/callback?next=/reset-password` });
  return error ? { error: error.message } : { success: "If an account exists, a reset link has been sent." };
}

export async function updatePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured yet. Add the project URL and anon key to .env.local." };
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  const supabase = await createClient(); const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/home");
}

export async function signOut() { const supabase = await createClient(); await supabase.auth.signOut(); redirect("/login"); }
