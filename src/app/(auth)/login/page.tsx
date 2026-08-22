import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/auth-form";
import { parseLoginPortal } from "@/features/auth/portal";
import { getSessionProfile } from "@/lib/auth/session";
import { dashboardPath } from "@/lib/permissions";
export const metadata: Metadata = { title: "Sign in" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ portal?: string }> }) {
  const profile = await getSessionProfile();
  if (profile?.account_status === "active") redirect(dashboardPath(profile.role));
  const { portal } = await searchParams;
  return <LoginForm initialPortal={parseLoginPortal(portal)} />;
}
