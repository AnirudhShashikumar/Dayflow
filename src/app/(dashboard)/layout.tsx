import { AppShell } from "@/components/layout/app-shell";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile(); const supabase = await createClient();
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", profile.id).eq("is_read", false);
  return <AppShell profile={profile} unreadCount={count ?? 0}>{children}</AppShell>;
}
